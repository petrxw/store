import "server-only";
import Stripe from "stripe";
import { brand } from "@/config/brand";

/* All payment-provider code lives in this file. To switch provider, replace these three functions. */

let stripe: Stripe | null = null;

function client(): Stripe {
  if (stripe) return stripe;
  const secret = process.env.STRIPE_SECRET_KEY;
  if (!secret) throw new Error("STRIPE_SECRET_KEY is not set");
  stripe = new Stripe(secret);
  return stripe;
}

export type CheckoutLine = { name: string; unitPrice: number; quantity: number };

export async function createCheckoutSession(input: { orderId: string; email: string; lines: CheckoutLine[] }) {
  const session = await client().checkout.sessions.create({
    mode: "payment",
    customer_email: input.email,
    client_reference_id: input.orderId,
    metadata: { order_id: input.orderId },
    line_items: input.lines.map((l) => ({
      quantity: l.quantity,
      price_data: {
        currency: brand.currency.toLowerCase(),
        unit_amount: Math.round(l.unitPrice * 100),
        product_data: { name: l.name },
      },
    })),
    success_url: `${brand.siteUrl}/order/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${brand.siteUrl}/checkout`,
    expires_at: Math.floor(Date.now() / 1000) + 60 * 30,
  });
  if (!session.url) throw new Error("Payment provider did not return a checkout URL");
  return { id: session.id, url: session.url };
}

/** Verifies the signature. Throws if the request did not come from the payment provider. */
export function verifyWebhook(rawBody: string, signature: string | null): Stripe.Event {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) throw new Error("STRIPE_WEBHOOK_SECRET is not set");
  if (!signature) throw new Error("Missing signature");
  return client().webhooks.constructEvent(rawBody, signature, secret);
}

export type { Stripe };
