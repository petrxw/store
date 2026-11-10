import { NextResponse } from "next/server";
import { getAdminClient, isAdminConfigured } from "@/lib/supabase-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Returns statuses only. It never returns codes or the customer's email. */
export async function GET(req: Request) {
  const sessionId = new URL(req.url).searchParams.get("session_id") ?? "";
  if (!/^cs_[A-Za-z0-9_]{10,200}$/.test(sessionId) || !isAdminConfigured()) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const { data } = await getAdminClient()
    .from("orders")
    .select("id, payment_status, delivery_status")
    .eq("stripe_session_id", sessionId)
    .maybeSingle();
  if (!data) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({
    reference: String(data.id).slice(0, 8).toUpperCase(),
    paymentStatus: data.payment_status,
    deliveryStatus: data.delivery_status,
  });
}
