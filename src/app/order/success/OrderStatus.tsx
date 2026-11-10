"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { brand } from "@/config/brand";
import { useCart } from "@/components/CartProvider";
import type { DeliveryStatus, PaymentStatus } from "@/lib/types";

type Status = { reference: string; paymentStatus: PaymentStatus; deliveryStatus: DeliveryStatus };

/** The page only reports what our server has recorded from the verified webhook. It never decides that a payment succeeded. */
export default function OrderStatus() {
  const sessionId = useSearchParams().get("session_id");
  const { clear } = useCart();
  const [status, setStatus] = useState<Status | null>(null);
  const [notFound, setNotFound] = useState(false);
  const cleared = useRef(false);

  useEffect(() => {
    if (!sessionId) return;
    let stop = false;
    let timer: ReturnType<typeof setTimeout>;
    let tries = 0;

    const poll = async () => {
      tries += 1;
      try {
        const res = await fetch(`/api/order-status?session_id=${encodeURIComponent(sessionId)}`, { cache: "no-store" });
        if (res.status === 404) return setNotFound(true);
        const data = (await res.json()) as Status;
        if (stop) return;
        setStatus(data);
        const settled = data.paymentStatus !== "pending" && ["delivered", "awaiting_manual", "failed"].includes(data.deliveryStatus);
        if (!settled && tries < 40) timer = setTimeout(poll, 3000);
      } catch {
        if (!stop && tries < 40) timer = setTimeout(poll, 5000);
      }
    };
    poll();
    return () => {
      stop = true;
      clearTimeout(timer);
    };
  }, [sessionId]);

  useEffect(() => {
    if (status?.paymentStatus === "paid" && !cleared.current) {
      cleared.current = true;
      clear();
    }
  }, [status, clear]);

  if (!sessionId || notFound) {
    return (
      <div className="text-center">
        <h1 className="text-3xl font-bold">We could not find that order</h1>
        <p className="mt-3 text-muted">If you just paid, wait a minute and refresh. Otherwise contact {brand.supportEmail}.</p>
        <Link href="/" className="btn btn-ghost mt-8">Back to the store</Link>
      </div>
    );
  }

  if (!status || status.paymentStatus === "pending") {
    return (
      <div className="text-center" role="status" aria-live="polite">
        <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-line border-t-violet" aria-hidden="true" />
        <h1 className="mt-6 text-3xl font-bold">Confirming your payment</h1>
        <p className="mt-3 text-muted">This usually takes a few seconds. You can keep this page open.</p>
      </div>
    );
  }

  const paid = status.paymentStatus === "paid";
  let title = "Payment confirmed";
  let body = "";
  if (!paid) {
    title = status.paymentStatus === "refunded" ? "This order was refunded" : "Payment was not completed";
    body = `No delivery will be made for this order. Contact ${brand.supportEmail} if this looks wrong.`;
  } else if (status.deliveryStatus === "delivered") {
    body = "Your delivery email has been sent. Check your inbox and your spam folder.";
  } else if (status.deliveryStatus === "awaiting_manual") {
    body = "Your payment is confirmed. Your order is being prepared for delivery. You will receive an email at the address you entered.";
  } else if (status.deliveryStatus === "failed") {
    body = `Your payment is confirmed but delivery needs attention. Contact ${brand.supportEmail} and quote your reference.`;
  } else {
    body = "Your payment is confirmed. We are preparing your delivery email.";
  }

  return (
    <div className="card p-8 text-center" role="status" aria-live="polite">
      <h1 className="text-3xl font-bold">{title}</h1>
      <p className="mx-auto mt-3 max-w-md text-zinc-400">{body}</p>
      <p className="mt-6 text-sm text-muted">Order reference</p>
      <p className="font-display text-2xl font-semibold tracking-widest text-white">{status.reference}</p>
      <Link href="/" className="btn btn-ghost mt-8">Continue shopping</Link>
    </div>
  );
}
