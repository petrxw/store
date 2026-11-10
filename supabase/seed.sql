-- Starter listings. PRICES AND TEXT ARE PLACEHOLDERS. Set real values before launch.
-- No inventory is created here, so every product shows "Out of stock" and cannot be bought
-- until verified codes are loaded and delivery_verified is switched on.

insert into products (slug, name, description, price, category, image, featured, active, activation_instructions, delivery_info)
values
  ('pirate-shop-token', 'Pirate Shop Token',
   'Product details will be published here once they are verified.',
   9.99, 'pirate-shop', '/placeholders/token.svg', true, false, null, null),
  ('golden-asap-rocky', 'Golden A$AP Rocky',
   'Product details will be published here once they are verified.',
   19.99, 'golden-asap-rocky', '/placeholders/gold.svg', true, false, null, null),
  ('v-bucks-1000', '1,000 V-Bucks', 'Digital V-Bucks code. Check platform and region before buying.',
   8.99, 'v-bucks', '/placeholders/currency.svg', true, true, null, null),
  ('v-bucks-2800', '2,800 V-Bucks', 'Digital V-Bucks code. Check platform and region before buying.',
   22.99, 'v-bucks', '/placeholders/currency.svg', false, true, null, null),
  ('v-bucks-5000', '5,000 V-Bucks', 'Digital V-Bucks code. Check platform and region before buying.',
   36.99, 'v-bucks', '/placeholders/currency.svg', false, true, null, null),
  ('v-bucks-13500', '13,500 V-Bucks', 'Digital V-Bucks code. Check platform and region before buying.',
   89.99, 'v-bucks', '/placeholders/currency.svg', false, true, null, null)
on conflict (slug) do nothing;
