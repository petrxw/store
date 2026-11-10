import { getPublicClient } from "./supabase-public";
import { getAdminClient, isAdminConfigured } from "./supabase-admin";
import type { Product, Review } from "./types";

type Row = Record<string, unknown>;

function toProduct(r: Row): Product {
  return {
    id: String(r.id),
    slug: String(r.slug),
    name: String(r.name),
    description: String(r.description ?? ""),
    price: Number(r.price),
    category: String(r.category),
    image: (r.image as string | null) ?? null,
    active: Boolean(r.active),
    featured: Boolean(r.featured),
    stock_quantity: Number(r.stock_quantity ?? 0),
    attributes: (r.attributes as Record<string, string>) ?? {},
    activation_instructions: (r.activation_instructions as string | null) ?? null,
    delivery_info: (r.delivery_info as string | null) ?? null,
  };
}

const PRODUCT_COLUMNS =
  "id, slug, name, description, price, category, image, active, featured, stock_quantity, attributes, activation_instructions, delivery_info";

export async function getProducts(category?: string): Promise<Product[]> {
  const db = getPublicClient();
  if (!db) return [];
  let query = db.from("products").select(PRODUCT_COLUMNS).eq("active", true);
  if (category) query = query.eq("category", category);
  const { data, error } = await query.order("featured", { ascending: false }).order("name");
  if (error || !data) return [];
  return data.map(toProduct);
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  const db = getPublicClient();
  if (!db) return null;
  const { data } = await db.from("products").select(PRODUCT_COLUMNS).eq("slug", slug).eq("active", true).maybeSingle();
  return data ? toProduct(data) : null;
}

/** Best sellers come from real paid orders. Returns an empty list until there are sales. */
export async function getBestSellerIds(limit = 4): Promise<string[]> {
  if (!isAdminConfigured()) return [];
  try {
    const { data } = await getAdminClient()
      .from("order_items")
      .select("product_id, quantity, orders!inner(payment_status)")
      .eq("orders.payment_status", "paid");
    if (!data) return [];
    const totals = new Map<string, number>();
    for (const row of data as unknown as { product_id: string; quantity: number }[]) {
      totals.set(row.product_id, (totals.get(row.product_id) ?? 0) + row.quantity);
    }
    return [...totals.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([id]) => id);
  } catch {
    return [];
  }
}

/** Only reviews approved in the admin area are shown. */
export async function getApprovedReviews(limit = 6): Promise<Review[]> {
  const db = getPublicClient();
  if (!db) return [];
  const { data } = await db
    .from("reviews")
    .select("id, author_name, rating, body, created_at")
    .eq("approved", true)
    .order("created_at", { ascending: false })
    .limit(limit);
  return (data as Review[] | null) ?? [];
}
