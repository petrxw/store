import "server-only";
import { getAdminClient } from "./supabase-admin";
import { decryptCode } from "./crypto";
import { sendDeliveryEmail, type DeliveredItem } from "./email";

const shortRef = (orderId: string) => orderId.slice(0, 8).toUpperCase();

async function setDeliveryState(orderId: string, status: "awaiting_manual" | "failed", error?: string) {
  await getAdminClient()
    .from("orders")
    .update({ delivery_status: status, delivery_error: error ?? null })
    .eq("id", orderId)
    .in("delivery_status", ["pending", "awaiting_manual", "failed", "allocated"]);
}

/**
 * Runs after a payment is confirmed by the verified webhook. Safe to call more than once for the same order:
 * allocation is idempotent and only one caller can claim the email.
 *
 * Automated delivery only runs when AUTO_DELIVERY_ENABLED=true AND every product in the order has
 * delivery_verified = true. Otherwise the order waits for manual handling.
 */
export async function processPaidOrder(orderId: string): Promise<void> {
  const db = getAdminClient();

  const { data: order } = await db.from("orders").select("id, customer_email, payment_status, delivery_status").eq("id", orderId).single();
  if (!order || order.payment_status !== "paid") return;
  if (order.delivery_status === "delivered" || order.delivery_status === "sending") return;

  const { data: items } = await db
    .from("order_items")
    .select("product_id, product_name, products(delivery_verified, activation_instructions)")
    .eq("order_id", orderId);
  if (!items || items.length === 0) return;

  type ItemRow = {
    product_id: string;
    product_name: string;
    products: { delivery_verified: boolean; activation_instructions: string | null } | null;
  };
  const rows = items as unknown as ItemRow[];

  const autoEnabled = process.env.AUTO_DELIVERY_ENABLED === "true";
  const allVerified = rows.every((r) => r.products?.delivery_verified === true);
  if (!autoEnabled || !allVerified) {
    await setDeliveryState(orderId, "awaiting_manual");
    return;
  }

  const { data: allocated, error: allocError } = await db.rpc("allocate_order_codes", { p_order_id: orderId });
  if (allocError || !allocated) {
    const reason = allocError?.message.includes("insufficient_stock") ? "insufficient_stock" : "allocation_failed";
    await setDeliveryState(orderId, "failed", reason);
    return;
  }

  const { data: claimed } = await db.rpc("claim_order_for_email", { p_order_id: orderId });
  if (!claimed) return;

  try {
    const byProduct = new Map<string, DeliveredItem>();
    for (const row of allocated as { out_product_id: string; out_encrypted_code: string }[]) {
      const meta = rows.find((r) => r.product_id === row.out_product_id);
      const entry = byProduct.get(row.out_product_id) ?? {
        productName: meta?.product_name ?? "Digital product",
        codes: [],
        activationInstructions: meta?.products?.activation_instructions ?? null,
      };
      entry.codes.push(decryptCode(row.out_encrypted_code));
      byProduct.set(row.out_product_id, entry);
    }
    await sendDeliveryEmail({ to: order.customer_email, reference: shortRef(orderId), items: [...byProduct.values()] });
    await db.rpc("mark_order_delivered", { p_order_id: orderId });
  } catch (err) {
    // Codes stay reserved for this order. Never log the codes themselves.
    const message = err instanceof Error ? err.message : "delivery_failed";
    await db.from("orders").update({ delivery_status: "failed", delivery_error: message.slice(0, 200) }).eq("id", orderId);
  }
}
