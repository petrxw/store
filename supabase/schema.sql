-- PirateVault database schema. Run once in the Supabase SQL editor.
-- Money is stored as numeric(10,2). Codes are stored encrypted. Only the service role can touch inventory and orders.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------- products
create table if not exists products (
  id                      uuid primary key default gen_random_uuid(),
  slug                    text not null unique,
  name                    text not null,
  description             text not null default '',
  price                   numeric(10,2) not null check (price >= 0),
  category                text not null,
  image                   text,
  active                  boolean not null default true,
  featured                boolean not null default false,
  stock_quantity          integer not null default 0,           -- kept in sync from digital_inventory by a trigger
  attributes              jsonb not null default '{}'::jsonb,   -- e.g. {"platform":"...","region":"...","rarity":"..."}
  activation_instructions text,
  delivery_info           text,
  delivery_verified       boolean not null default false,       -- automated delivery stays blocked until this is true
  created_at              timestamptz not null default now()
);
create index if not exists products_category_idx on products (category) where active;

-- ------------------------------------------------------------------ orders
create table if not exists orders (
  id                    uuid primary key default gen_random_uuid(),
  customer_email        text not null,
  total                 numeric(10,2) not null check (total >= 0),
  currency              text not null default 'EUR',
  payment_status        text not null default 'pending'
                        check (payment_status in ('pending','paid','failed','expired','refunded','flagged')),
  delivery_status       text not null default 'pending'
                        check (delivery_status in ('pending','awaiting_manual','allocated','sending','delivered','failed')),
  delivery_error        text,
  stripe_session_id     text unique,
  stripe_payment_intent text,
  created_at            timestamptz not null default now(),
  paid_at               timestamptz
);
create index if not exists orders_email_idx on orders (customer_email);
create index if not exists orders_status_idx on orders (payment_status, delivery_status);
create index if not exists orders_payment_intent_idx on orders (stripe_payment_intent);

create table if not exists order_items (
  id           uuid primary key default gen_random_uuid(),
  order_id     uuid not null references orders(id) on delete cascade,
  product_id   uuid not null references products(id),
  product_name text not null,
  quantity     integer not null check (quantity > 0),
  unit_price   numeric(10,2) not null check (unit_price >= 0)
);
create index if not exists order_items_order_idx on order_items (order_id);

-- --------------------------------------------------------- digital_inventory
create table if not exists digital_inventory (
  id             uuid primary key default gen_random_uuid(),
  product_id     uuid not null references products(id),
  encrypted_code text not null,                 -- AES-256-GCM, key lives only in the server environment
  code_hash      text not null,                 -- HMAC of the plain code, blocks duplicate uploads
  status         text not null default 'available' check (status in ('available','reserved','sold','void')),
  created_at     timestamptz not null default now(),
  sold_at        timestamptz,
  order_id       uuid references orders(id)
);
create unique index if not exists inventory_product_hash_uq on digital_inventory (product_id, code_hash);
create index if not exists inventory_available_idx on digital_inventory (product_id, created_at) where status = 'available';
create index if not exists inventory_order_idx on digital_inventory (order_id);

-- ----------------------------------------------------------------- reviews
-- Reviews are added by an admin after checking they come from a real purchase. Nothing is auto-generated.
create table if not exists reviews (
  id          uuid primary key default gen_random_uuid(),
  product_id  uuid references products(id),
  order_id    uuid references orders(id),
  author_name text not null,
  rating      integer not null check (rating between 1 and 5),
  body        text not null,
  approved    boolean not null default false,
  created_at  timestamptz not null default now()
);

-- ------------------------------------------- live stock, driven by inventory
create or replace function refresh_product_stock() returns trigger
language plpgsql set search_path = public as $$
declare
  pid uuid;
begin
  pid := case when tg_op = 'DELETE' then old.product_id else new.product_id end;
  update products
     set stock_quantity = (select count(*) from digital_inventory where product_id = pid and status = 'available')
   where id = pid;
  if tg_op = 'UPDATE' and old.product_id is distinct from new.product_id then
    update products
       set stock_quantity = (select count(*) from digital_inventory where product_id = old.product_id and status = 'available')
     where id = old.product_id;
  end if;
  return null;
end;
$$;

drop trigger if exists inventory_stock_sync on digital_inventory;
create trigger inventory_stock_sync
  after insert or update or delete on digital_inventory
  for each row execute function refresh_product_stock();

-- ---------------------------------------------------- payment confirmation
-- Called only by the verified webhook. Checks the amount Stripe collected against the order total.
create or replace function mark_order_paid(
  p_order_id uuid, p_session_id text, p_payment_intent text, p_amount_cents bigint, p_currency text
) returns text
language plpgsql security definer set search_path = public as $$
declare
  v_order orders%rowtype;
begin
  select * into v_order from orders where id = p_order_id for update;
  if not found then return 'not_found'; end if;
  if v_order.payment_status = 'paid' then return 'already_paid'; end if;
  if v_order.payment_status in ('refunded','flagged') then return v_order.payment_status; end if;
  if v_order.stripe_session_id is distinct from p_session_id then return 'session_mismatch'; end if;

  if round(v_order.total * 100)::bigint <> p_amount_cents or lower(v_order.currency) <> lower(p_currency) then
    update orders set payment_status = 'flagged', delivery_error = 'amount_or_currency_mismatch' where id = p_order_id;
    return 'flagged';
  end if;

  update orders
     set payment_status = 'paid', paid_at = now(), stripe_payment_intent = p_payment_intent
   where id = p_order_id;
  return 'paid';
end;
$$;

-- -------------------------------------------------------- code allocation
-- Reserves codes for a paid order inside one transaction. SKIP LOCKED means two orders can never get the same code.
-- Calling it again for the same order returns the same codes, so retries cannot hand out extra ones.
create or replace function allocate_order_codes(p_order_id uuid)
returns table (out_inventory_id uuid, out_product_id uuid, out_encrypted_code text)
language plpgsql security definer set search_path = public as $$
declare
  v_order orders%rowtype;
  v_item  record;
  v_n     integer;
begin
  select * into v_order from orders where id = p_order_id for update;
  if not found then raise exception 'order_not_found'; end if;
  if v_order.payment_status <> 'paid' then raise exception 'order_not_paid'; end if;

  if not exists (select 1 from digital_inventory di where di.order_id = p_order_id) then
    for v_item in
      select oi.product_id as pid, oi.quantity as qty from order_items oi where oi.order_id = p_order_id
    loop
      update digital_inventory
         set status = 'reserved', order_id = p_order_id
       where id in (
         select di.id from digital_inventory di
          where di.product_id = v_item.pid and di.status = 'available'
          order by di.created_at
          limit v_item.qty
          for update skip locked
       );
      get diagnostics v_n = row_count;
      if v_n < v_item.qty then
        raise exception 'insufficient_stock:%', v_item.pid;   -- aborts and rolls back every reservation above
      end if;
    end loop;

    update orders
       set delivery_status = 'allocated', delivery_error = null
     where id = p_order_id and delivery_status in ('pending','awaiting_manual','failed');
  end if;

  return query
    select di.id, di.product_id, di.encrypted_code
      from digital_inventory di
     where di.order_id = p_order_id
     order by di.created_at, di.id;
end;
$$;

-- Only one worker may send the delivery email for an order.
create or replace function claim_order_for_email(p_order_id uuid) returns boolean
language plpgsql security definer set search_path = public as $$
declare
  v_n integer;
begin
  update orders
     set delivery_status = 'sending'
   where id = p_order_id and payment_status = 'paid' and delivery_status in ('allocated','failed');
  get diagnostics v_n = row_count;
  return v_n = 1;
end;
$$;

create or replace function mark_order_delivered(p_order_id uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  update digital_inventory set status = 'sold', sold_at = now()
   where order_id = p_order_id and status = 'reserved';
  update orders set delivery_status = 'delivered', delivery_error = null where id = p_order_id;
end;
$$;

-- Lock the functions down to the service role.
revoke all on function mark_order_paid(uuid, text, text, bigint, text) from public, anon, authenticated;
revoke all on function allocate_order_codes(uuid) from public, anon, authenticated;
revoke all on function claim_order_for_email(uuid) from public, anon, authenticated;
revoke all on function mark_order_delivered(uuid) from public, anon, authenticated;
grant execute on function mark_order_paid(uuid, text, text, bigint, text) to service_role;
grant execute on function allocate_order_codes(uuid) to service_role;
grant execute on function claim_order_for_email(uuid) to service_role;
grant execute on function mark_order_delivered(uuid) to service_role;

-- ------------------------------------------------------ Row Level Security
alter table products          enable row level security;
alter table orders            enable row level security;
alter table order_items       enable row level security;
alter table digital_inventory enable row level security;
alter table reviews           enable row level security;

-- The public site can read active products and approved reviews. Nothing else is readable without the service role.
drop policy if exists "public read active products" on products;
create policy "public read active products" on products for select using (active = true);

drop policy if exists "public read approved reviews" on reviews;
create policy "public read approved reviews" on reviews for select using (approved = true);
