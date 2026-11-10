import type { MetadataRoute } from "next";
import { brand } from "@/config/brand";
import { categories } from "@/config/categories";
import { legalPages } from "@/config/legal";
import { getProducts } from "@/lib/catalog";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const products = await getProducts();
  return [
    { url: brand.siteUrl, changeFrequency: "daily", priority: 1 },
    ...categories.map((c) => ({ url: `${brand.siteUrl}/category/${c.slug}`, changeFrequency: "daily" as const, priority: 0.8 })),
    ...products.map((p) => ({ url: `${brand.siteUrl}/products/${p.slug}`, changeFrequency: "daily" as const, priority: 0.7 })),
    ...legalPages.map((l) => ({ url: `${brand.siteUrl}/legal/${l.slug}`, changeFrequency: "yearly" as const, priority: 0.3 })),
  ];
}
