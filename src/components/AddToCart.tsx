"use client";

import { useState } from "react";
import type { Product } from "@/lib/types";
import { brand } from "@/config/brand";
import { formatPrice, lineTotal } from "@/lib/format";
import { useCart } from "./CartProvider";

export default function AddToCart({ product, gold = false }: { product: Product; gold?: boolean }) {
  const { add } = useCart();
  const max = Math.min(product.stock_quantity, brand.maxQtyPerLine);
  const [qty, setQty] = useState(1);
  const soldOut = max <= 0;

  const change = (next: number) => setQty(Math.max(1, Math.min(next, max)));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center rounded-lg border border-line">
          <button type="button" className="h-11 w-11 text-lg hover:bg-white/5 disabled:opacity-40" onClick={() => change(qty - 1)} disabled={soldOut || qty <= 1} aria-label="Decrease quantity">−</button>
          <input
            id="quantity"
            inputMode="numeric"
            aria-label="Quantity"
            value={soldOut ? 0 : qty}
            onChange={(e) => change(Number(e.target.value.replace(/\D/g, "")) || 1)}
            disabled={soldOut}
            className="h-11 w-12 bg-transparent text-center text-white tabular-nums focus:outline-none"
          />
          <button type="button" className="h-11 w-11 text-lg hover:bg-white/5 disabled:opacity-40" onClick={() => change(qty + 1)} disabled={soldOut || qty >= max} aria-label="Increase quantity">+</button>
        </div>
        <p className="text-sm text-muted">
          Total <span className="text-lg font-semibold tabular-nums text-white">{formatPrice(lineTotal(product.price, soldOut ? 0 : qty))}</span>
        </p>
      </div>
      <button
        type="button"
        disabled={soldOut}
        className={`btn w-full sm:w-auto sm:min-w-[260px] ${gold ? "btn-gold" : "btn-primary"}`}
        onClick={() =>
          add({ productId: product.id, slug: product.slug, name: product.name, price: product.price, image: product.image, max: product.stock_quantity }, qty)
        }
      >
        {soldOut ? "Out of stock" : "Add to cart"}
      </button>
      {!soldOut && max < product.stock_quantity && (
        <p className="text-xs text-muted">Up to {brand.maxQtyPerLine} per order.</p>
      )}
    </div>
  );
}
