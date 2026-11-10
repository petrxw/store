import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { categories, getCategory } from "@/config/categories";
import { getProducts } from "@/lib/catalog";
import CategoryBrowser from "@/components/CategoryBrowser";

export const dynamic = "force-dynamic";
// Only the four known categories exist. Anything else is a real 404.
export const dynamicParams = false;

export function generateStaticParams() {
  return categories.map((c) => ({ slug: c.slug }));
}

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const category = getCategory(slug);
  if (!category) return {};
  return { title: category.name, description: category.blurb, alternates: { canonical: `/category/${slug}` } };
}

export default async function CategoryPage({ params }: Props) {
  const { slug } = await params;
  const category = getCategory(slug);
  if (!category) notFound();

  const products = await getProducts(slug);
  const gold = category.theme === "gold";

  return (
    <>
      <section className={`border-b border-line ${gold ? "bg-gradient-to-b from-[#1d1608] to-ink" : "hero-backdrop"}`}>
        <div className="container-page py-14 sm:py-20">
          <nav aria-label="Breadcrumb" className="text-sm text-muted">
            <Link href="/" className="hover:text-white">Home</Link> <span aria-hidden="true">/</span> {category.name}
          </nav>
          <h1 className={`mt-4 text-4xl font-bold sm:text-5xl ${gold ? "bg-gold-gradient bg-clip-text text-transparent" : ""}`}>{category.name}</h1>
          <p className="mt-4 max-w-2xl text-zinc-400">{category.blurb}</p>
        </div>
      </section>

      <div className="container-page py-10">
        {slug === "v-bucks" && (
          <div className="card mb-8 grid gap-4 p-5 text-sm sm:grid-cols-3">
            <div><p className="font-semibold text-white">Platform compatibility</p><p className="mt-1 text-zinc-400">Listed on each product. Make sure it matches the platform you play on.</p></div>
            <div><p className="font-semibold text-white">Region</p><p className="mt-1 text-zinc-400">Listed on each product. A code only works in the region it was issued for.</p></div>
            <div><p className="font-semibold text-white">Delivery</p><p className="mt-1 text-zinc-400">Sent by email after payment is confirmed. Steps are on the product page.</p></div>
          </div>
        )}
        <CategoryBrowser products={products} />
      </div>
    </>
  );
}
