import { NextResponse } from "next/server";
import { verifyWebhook, type Stripe } from "@/lib/payments";
import { getAdminClient } from "@/lib/supabase-admin";
import { processPaidOrder } from "@/lib/delivery";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** The only place an order becomes "paid". The browser's success page never decides this. */
export async function POST(req: Request) {
  const rawBody = await req.text();

  let event: Stripe.Event;
  try {
    event = verifyWebhook(rawBody, req.headers.get("stripe-signature"));
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const db = getAdminClient();

  try {
    switch (event.type) {
      case "checkout.session.completed":
      case "checkout.session.async_payment_succeeded": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.payment_status !== "paid") break; // delayed methods confirm later
        const orderId = session.metadata?.order_id ?? session.client_reference_id;
        if (!orderId) break;

        const paymentIntent = typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id ?? null;
        const { data: result } = await db.rpc("mark_order_paid", {
          p_order_id: orderId,
          p_session_id: session.id,
          p_payment_intent: paymentIntent,
          p_amount_cents: session.amount_total ?? -1,
          p_currency: session.currency ?? "",
        });
        if (result === "paid" || result === "already_paid") await processPaidOrder(orderId);
        break;
      }

      case "checkout.session.async_payment_failed":
      case "checkout.session.expired": {
        const session = event.data.object as Stripe.Checkout.Session;
        await db
          .from("orders")
          .update({ payment_status: event.type === "checkout.session.expired" ? "expired" : "failed" })
          .eq("stripe_session_id", session.id)
          .eq("payment_status", "pending");
        break;
      }

      case "charge.refunded": {
        const charge = event.data.object as Stripe.Charge;
        const pi = typeof charge.payment_intent === "string" ? charge.payment_intent : charge.payment_intent?.id;
        if (pi && charge.refunded) await db.from("orders").update({ payment_status: "refunded" }).eq("stripe_payment_intent", pi);
        break;
      }

      default:
        break;
    }
  } catch {
    // Unexpected failure: ask Stripe to retry. Handlers above are safe to run twice.
    return NextResponse.json({ error: "Processing failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
