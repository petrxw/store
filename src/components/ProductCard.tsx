"use client";

import Link from "next/link";
import type { Product } from "@/lib/types";
import { formatPrice } from "@/lib/format";
import { getCategory } from "@/config/categories";
import { useCart } from "./CartProvider";

export function StockBadge({ stock }: { stock: number }) {
  if (stock <= 0) return <span className="rounded-full border border-line px-2.5 py-0.5 text-xs text-zinc-400">Out of stock</span>;
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-xs text-emerald-300">
      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" aria-hidden="true" />
      {stock} in stock
    </span>
  );
}

export default function ProductCard({ product }: { product: Product }) {
  const { add } = useCart();
  const gold = getCategory(product.category)?.theme === "gold";
  const soldOut = product.stock_quantity <= 0;
  const attrs = ["platform", "region", "rarity"].filter((k) => product.attributes[k]);

  return (
    <article
      className={`group flex flex-col overflow-hidden rounded-xl border bg-surface transition duration-300 hover:-translate-y-0.5 ${
        gold ? "border-gold-deep/60 hover:border-gold" : "border-line hover:border-violet/60"
      }`}
    >
      <Link href={`/products/${product.slug}`} className="block">
        <div className="aspect-[4/3] overflow-hidden bg-raised">
          {product.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={product.image} alt={product.name} width={640} height={480} loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]" />
          ) : (
            <div className="grid h-full place-items-center text-sm text-zinc-500">No image</div>
          )}
        </div>
      </Link>
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-base font-semibold leading-snug">
            <Link href={`/products/${product.slug}`} className="hover:underline">{product.name}</Link>
          </h3>
          <p className={`shrink-0 font-semibold tabular-nums ${gold ? "text-gold-soft" : "text-white"}`}>{formatPrice(product.price)}</p>
        </div>
        {attrs.length > 0 && (
          <p className="text-xs text-muted">
            {attrs.map((k) => `${k[0].toUpperCase()}${k.slice(1)}: ${product.attributes[k]}`).join(" · ")}
          </p>
        )}
        <div className="mt-auto flex items-center justify-between gap-3 pt-1">
          <StockBadge stock={product.stock_quantity} />
          <button
            type="button"
            disabled={soldOut}
            onClick={() =>
              add({ productId: product.id, slug: product.slug, name: product.name, price: product.price, image: product.image, max: product.stock_quantity })
            }
            className={`btn !min-h-[40px] !px-4 ${gold ? "btn-gold" : "btn-primary"}`}
            aria-label={`Add ${product.name} to cart`}
          >
            Add
          </button>
        </div>
      </div>
    </article>
  );
}
