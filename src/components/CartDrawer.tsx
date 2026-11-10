"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { useCart } from "./CartProvider";
import { formatPrice, lineTotal } from "@/lib/format";
import { brand } from "@/config/brand";

export default function CartDrawer() {
  const { lines, open, setOpen, remove, setQty, subtotal } = useCart();
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, setOpen]);

  return (
    <div className={`fixed inset-0 z-50 ${open ? "" : "pointer-events-none"}`} aria-hidden={!open}>
      <div
        className={`absolute inset-0 bg-black/70 transition-opacity duration-300 ${open ? "opacity-100" : "opacity-0"}`}
        onClick={() => setOpen(false)}
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Shopping cart"
        className={`absolute right-0 top-0 flex h-full w-full max-w-md flex-col border-l border-line bg-surface transition-transform duration-300 ${open ? "translate-x-0" : "translate-x-full"}`}
      >
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <h2 className="text-lg font-semibold">Your cart</h2>
          <button ref={closeRef} type="button" className="btn btn-ghost !min-h-[40px] !px-3" onClick={() => setOpen(false)} aria-label="Close cart">
            Close
          </button>
        </div>

        {lines.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
            <p className="text-lg font-semibold text-white">Your cart is empty</p>
            <p className="text-sm text-muted">Add a product and it will show up here.</p>
            <Link href="/#featured" onClick={() => setOpen(false)} className="btn btn-ghost mt-2">
              Browse products
            </Link>
          </div>
        ) : (
          <>
            <ul className="flex-1 divide-y divide-line overflow-y-auto px-5">
              {lines.map((l) => (
                <li key={l.productId} className="flex gap-4 py-4">
                  {l.image && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={l.image} alt="" width={64} height={64} className="h-16 w-16 shrink-0 rounded-lg border border-line object-cover" />
                  )}
                  <div className="min-w-0 flex-1">
                    <Link href={`/products/${l.slug}`} onClick={() => setOpen(false)} className="block truncate font-medium text-white hover:underline">
                      {l.name}
                    </Link>
                    <p className="text-sm text-muted">{formatPrice(l.price)} each</p>
                    <div className="mt-2 flex items-center gap-3">
                      <div className="flex items-center rounded-lg border border-line">
                        <button type="button" className="h-9 w-9 text-lg hover:bg-white/5" onClick={() => setQty(l.productId, l.qty - 1)} disabled={l.qty <= 1} aria-label={`Decrease quantity of ${l.name}`}>
                          −
                        </button>
                        <span className="w-8 text-center text-sm tabular-nums text-white" aria-live="polite">{l.qty}</span>
                        <button type="button" className="h-9 w-9 text-lg hover:bg-white/5" onClick={() => setQty(l.productId, l.qty + 1)} disabled={l.qty >= Math.min(l.max, brand.maxQtyPerLine)} aria-label={`Increase quantity of ${l.name}`}>
                          +
                        </button>
                      </div>
                      <button type="button" className="text-sm text-muted underline underline-offset-4 hover:text-white" onClick={() => remove(l.productId)}>
                        Remove
                      </button>
                    </div>
                  </div>
                  <p className="text-sm font-semibold tabular-nums text-white">{formatPrice(lineTotal(l.price, l.qty))}</p>
                </li>
              ))}
            </ul>
            <div className="border-t border-line px-5 py-5">
              <div className="flex items-baseline justify-between">
                <span className="text-muted">Subtotal</span>
                <span className="text-xl font-semibold tabular-nums text-white">{formatPrice(subtotal)}</span>
              </div>
              <p className="mt-1 text-xs text-muted">Prices in {brand.currency}. Final total is confirmed at checkout.</p>
              <Link href="/checkout" onClick={() => setOpen(false)} className="btn btn-primary mt-4 w-full">
                Go to checkout
              </Link>
            </div>
          </>
        )}
      </aside>
    </div>
  );
}
