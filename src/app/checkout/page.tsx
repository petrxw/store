"use client";

import Link from "next/link";
import { useState } from "react";
import { brand } from "@/config/brand";
import { formatPrice, lineTotal } from "@/lib/format";
import { useCart } from "@/components/CartProvider";

const checkoutOpen = process.env.NEXT_PUBLIC_CHECKOUT_ENABLED === "true";

export default function CheckoutPage() {
  const { lines, subtotal, hydrated, setQty, remove } = useCart();
  const [email, setEmail] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function pay(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, items: lines.map((l) => ({ productId: l.productId, quantity: l.qty })) }),
      });
      const data = (await res.json().catch(() => ({}))) as { url?: string; error?: string };
      if (!res.ok || !data.url) {
        setError(data.error ?? "Something went wrong. Please try again.");
        setBusy(false);
        return;
      }
      window.location.href = data.url;
    } catch {
      setError("We could not reach the server. Check your connection and try again.");
      setBusy(false);
    }
  }

  if (!hydrated) {
    return (
      <div className="container-page py-16" aria-busy="true">
        <div className="h-8 w-48 animate-pulse rounded bg-raised" />
        <div className="mt-8 h-64 animate-pulse rounded-xl bg-raised" />
      </div>
    );
  }

  if (lines.length === 0) {
    return (
      <div className="container-page py-24 text-center">
        <h1 className="text-3xl font-bold">Your cart is empty</h1>
        <p className="mt-3 text-muted">Add a product to continue to checkout.</p>
        <Link href="/" className="btn btn-primary mt-8">Browse products</Link>
      </div>
    );
  }

  return (
    <div className="container-page py-10 sm:py-14">
      <h1 className="text-3xl font-bold sm:text-4xl">Checkout</h1>
      {!checkoutOpen && (
        <p role="status" className="mt-6 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
          Ordering is not open yet. Your cart is saved, so you can come back when we open.
        </p>
      )}
      <form onSubmit={pay} className="mt-8 grid gap-8 lg:grid-cols-[1fr_400px]">
        <div className="space-y-6">
          <section className="card p-5 sm:p-6">
            <h2 className="text-lg font-semibold">Contact</h2>
            <p className="mt-1 text-sm text-muted">No account needed. Your order details are sent to this email.</p>
            <label htmlFor="email" className="mt-4 block text-sm font-medium text-white">Email address</label>
            <input id="email" name="email" type="email" required autoComplete="email" inputMode="email" className="input mt-2" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
          </section>

          <section className="card p-5 sm:p-6">
            <h2 className="text-lg font-semibold">Payment</h2>
            <p className="mt-1 text-sm text-zinc-400">You will pay on our payment provider&apos;s secure page. Your card details never reach {brand.name}.</p>
            <label htmlFor="agree" className="mt-5 flex items-start gap-3 text-sm text-zinc-300">
              <input id="agree" type="checkbox" required className="mt-0.5 h-5 w-5 shrink-0 accent-violet" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} />
              <span>
                I have read the <Link href="/legal/terms" target="_blank" className="underline">terms</Link> and the{" "}
                <Link href="/legal/refunds" target="_blank" className="underline">refund policy</Link>, and I understand this is a digital product delivered by email.
              </span>
            </label>
          </section>

          {error && (
            <p role="alert" className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</p>
          )}
        </div>

        <aside className="card h-fit p-5 sm:p-6 lg:sticky lg:top-24">
          <h2 className="text-lg font-semibold">Order summary</h2>
          <ul className="mt-4 divide-y divide-line">
            {lines.map((l) => (
              <li key={l.productId} className="flex items-center justify-between gap-3 py-3 text-sm">
                <div className="min-w-0">
                  <p className="truncate font-medium text-white">{l.name}</p>
                  <div className="mt-1 flex items-center gap-3 text-muted">
                    <label htmlFor={`qty-${l.productId}`} className="sr-only">Quantity of {l.name}</label>
                    <select id={`qty-${l.productId}`} className="rounded-md border border-line bg-raised px-2 py-1 text-white" value={l.qty} onChange={(e) => setQty(l.productId, Number(e.target.value))}>
                      {Array.from({ length: Math.min(l.max, brand.maxQtyPerLine) }, (_, i) => i + 1).map((n) => <option key={n} value={n}>{n}</option>)}
                    </select>
                    <button type="button" onClick={() => remove(l.productId)} className="underline underline-offset-4 hover:text-white">Remove</button>
                  </div>
                </div>
                <p className="tabular-nums text-white">{formatPrice(lineTotal(l.price, l.qty))}</p>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex items-baseline justify-between border-t border-line pt-4">
            <span className="text-muted">Total ({brand.currency})</span>
            <span className="text-2xl font-semibold tabular-nums text-white">{formatPrice(subtotal)}</span>
          </div>
          <button type="submit" disabled={!checkoutOpen || busy || !agreed || email.length === 0} className="btn btn-primary mt-5 w-full">
            {busy ? "Redirecting to payment…" : `Pay ${formatPrice(subtotal)}`}
          </button>
          <p className="mt-3 text-xs text-muted">Price and stock are checked again on our server before payment.</p>
        </aside>
      </form>
    </div>
  );
}
