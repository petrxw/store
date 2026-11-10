import { NextResponse } from "next/server";
import { z } from "zod";
import { brand } from "@/config/brand";
import { getAdminClient, isAdminConfigured } from "@/lib/supabase-admin";
import { createCheckoutSession } from "@/lib/payments";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bodySchema = z.object({
  email: z.email().max(254),
  items: z
    .array(z.object({ productId: z.uuid(), quantity: z.number().int().min(1).max(brand.maxQtyPerLine) }))
    .min(1)
    .max(20),
});

// Basic per-instance rate limit. On serverless this is best effort, so also enable limits at your host or CDN.
const hits = new Map<string, number[]>();
function limited(ip: string) {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < 60_000);
  recent.push(now);
  hits.set(ip, recent);
  return recent.length > 8;
}

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (limited(ip)) return NextResponse.json({ error: "Too many attempts. Please wait a minute." }, { status: 429 });

  if (process.env.NEXT_PUBLIC_CHECKOUT_ENABLED !== "true") {
    return NextResponse.json({ error: "Checkout is not open yet." }, { status: 503 });
  }
  if (!isAdminConfigured()) return NextResponse.json({ error: "Checkout is not available yet." }, { status: 503 });

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Please check your email and cart." }, { status: 400 });

  // Merge duplicate lines.
  const wanted = new Map<string, number>();
  for (const i of parsed.data.items) wanted.set(i.productId, Math.min((wanted.get(i.productId) ?? 0) + i.quantity, brand.maxQtyPerLine));

  const db = getAdminClient();
  const { data: products } = await db
    .from("products")
    .select("id, name, price, stock_quantity, active")
    .in("id", [...wanted.keys()]);

  // Prices and stock always come from the database. The browser's numbers are ignored.
  const lines: { id: string; name: string; unitPrice: number; quantity: number }[] = [];
  for (const [id, quantity] of wanted) {
    const p = products?.find((x) => x.id === id);
    if (!p || !p.active) return NextResponse.json({ error: "A product in your cart is no longer available." }, { status: 409 });
    if (p.stock_quantity < quantity) {
      return NextResponse.json({ error: `Only ${p.stock_quantity} left of ${p.name}. Please lower the quantity.` }, { status: 409 });
    }
    lines.push({ id, name: p.name as string, unitPrice: Number(p.price), quantity });
  }

  const totalCents = lines.reduce((sum, l) => sum + Math.round(l.unitPrice * 100) * l.quantity, 0);
  if (totalCents <= 0) return NextResponse.json({ error: "This order has no payable amount." }, { status: 400 });

  const { data: order, error: orderError } = await db
    .from("orders")
    .insert({ customer_email: parsed.data.email.toLowerCase(), total: totalCents / 100, currency: brand.currency })
    .select("id")
    .single();
  if (orderError || !order) return NextResponse.json({ error: "Could not start checkout. Please try again." }, { status: 500 });

  const { error: itemsError } = await db.from("order_items").insert(
    lines.map((l) => ({ order_id: order.id, product_id: l.id, product_name: l.name, quantity: l.quantity, unit_price: l.unitPrice })),
  );
  if (itemsError) return NextResponse.json({ error: "Could not start checkout. Please try again." }, { status: 500 });

  try {
    const session = await createCheckoutSession({
      orderId: order.id,
      email: parsed.data.email,
      lines: lines.map((l) => ({ name: l.name, unitPrice: l.unitPrice, quantity: l.quantity })),
    });
    await db.from("orders").update({ stripe_session_id: session.id }).eq("id", order.id);
    return NextResponse.json({ url: session.url });
  } catch {
    await db.from("orders").update({ payment_status: "failed" }).eq("id", order.id);
    return NextResponse.json({ error: "Payment could not be started. Please try again." }, { status: 502 });
  }
}
