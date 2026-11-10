"use client";

import { useMemo, useState } from "react";
import type { Product } from "@/lib/types";
import ProductCard from "./ProductCard";

type Sort = "featured" | "price-asc" | "price-desc" | "name";

export default function CategoryBrowser({ products }: { products: Product[] }) {
  const [query, setQuery] = useState("");
  const [rarity, setRarity] = useState("all");
  const [sort, setSort] = useState<Sort>("featured");
  const [inStockOnly, setInStockOnly] = useState(false);

  const rarities = useMemo(
    () => [...new Set(products.map((p) => p.attributes.rarity).filter(Boolean))].sort(),
    [products],
  );

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = products.filter(
      (p) =>
        (!q || p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q)) &&
        (rarity === "all" || p.attributes.rarity === rarity) &&
        (!inStockOnly || p.stock_quantity > 0),
    );
    const sorted = [...list];
    if (sort === "price-asc") sorted.sort((a, b) => a.price - b.price);
    if (sort === "price-desc") sorted.sort((a, b) => b.price - a.price);
    if (sort === "name") sorted.sort((a, b) => a.name.localeCompare(b.name));
    return sorted;
  }, [products, query, rarity, sort, inStockOnly]);

  return (
    <div>
      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_auto_auto_auto]">
        <div>
          <label htmlFor="search" className="sr-only">Search products</label>
          <input id="search" type="search" className="input" placeholder="Search products" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
        {rarities.length > 0 && (
          <div>
            <label htmlFor="rarity" className="sr-only">Rarity</label>
            <select id="rarity" className="input" value={rarity} onChange={(e) => setRarity(e.target.value)}>
              <option value="all">All rarities</option>
              {rarities.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
        )}
        <div>
          <label htmlFor="sort" className="sr-only">Sort by</label>
          <select id="sort" className="input" value={sort} onChange={(e) => setSort(e.target.value as Sort)}>
            <option value="featured">Featured</option>
            <option value="price-asc">Price: low to high</option>
            <option value="price-desc">Price: high to low</option>
            <option value="name">Name</option>
          </select>
        </div>
        <label htmlFor="in-stock" className="flex min-h-[44px] items-center gap-2 text-sm text-zinc-300">
          <input id="in-stock" type="checkbox" className="h-4 w-4 accent-violet" checked={inStockOnly} onChange={(e) => setInStockOnly(e.target.checked)} />
          In stock only
        </label>
      </div>

      {visible.length === 0 ? (
        <div className="card px-6 py-14 text-center">
          <p className="text-lg font-semibold text-white">{products.length === 0 ? "Nothing listed here yet" : "No products match your filters"}</p>
          <p className="mt-2 text-sm text-muted">
            {products.length === 0 ? "New listings appear here as soon as they are verified and in stock." : "Try a different search or clear a filter."}
          </p>
        </div>
      ) : (
        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((p) => (
            <li key={p.id}><ProductCard product={p} /></li>
          ))}
        </ul>
      )}
    </div>
  );
}
