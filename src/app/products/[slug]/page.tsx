import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { brand } from "@/config/brand";
import { getCategory } from "@/config/categories";
import { getProductBySlug } from "@/lib/catalog";
import { formatPrice } from "@/lib/format";
import AddToCart from "@/components/AddToCart";
import Faq from "@/components/Faq";
import { StockBadge } from "@/components/ProductCard";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return {};
  const description = product.description.slice(0, 160);
  return {
    title: product.name,
    description,
    alternates: { canonical: `/products/${slug}` },
    openGraph: { title: `${product.name} | ${brand.name}`, description, images: product.image ? [product.image] : undefined },
  };
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const category = getCategory(product.category);
  const gold = category?.theme === "gold";

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    image: product.image ? `${brand.siteUrl}${product.image}` : undefined,
    offers: {
      "@type": "Offer",
      price: product.price.toFixed(2),
      priceCurrency: brand.currency,
      availability: product.stock_quantity > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
    },
  };

  const attrs = Object.entries(product.attributes).filter(([, v]) => v);

  return (
    <div className={gold ? "bg-gradient-to-b from-[#1a1408] via-ink to-ink" : ""}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <div className="container-page py-10 sm:py-14">
        <nav aria-label="Breadcrumb" className="text-sm text-muted">
          <Link href="/" className="hover:text-white">Home</Link> <span aria-hidden="true">/</span>{" "}
          {category && <><Link href={`/category/${category.slug}`} className="hover:text-white">{category.name}</Link> <span aria-hidden="true">/</span> </>}
          {product.name !== category?.name && product.name}
        </nav>

        <div className="mt-8 grid gap-10 lg:grid-cols-2">
          <div className={`overflow-hidden rounded-2xl border ${gold ? "border-gold-deep/70" : "border-line"} bg-raised`}>
            {product.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={product.image} alt={product.name} width={960} height={720} className="aspect-[4/3] w-full object-cover" />
            ) : (
              <div className="grid aspect-[4/3] place-items-center text-zinc-500">No image</div>
            )}
          </div>

          <div>
            <p className="eyebrow">{category?.name ?? "Product"}</p>
            <h1 className={`mt-2 text-4xl font-bold sm:text-5xl ${gold ? "bg-gold-gradient bg-clip-text text-transparent" : ""}`}>{product.name}</h1>
            <div className="mt-5 flex flex-wrap items-center gap-4">
              <p className={`text-3xl font-semibold tabular-nums ${gold ? "text-gold-soft" : "text-white"}`}>{formatPrice(product.price)}</p>
              <StockBadge stock={product.stock_quantity} />
            </div>
            <p className="mt-6 max-w-prose whitespace-pre-line text-zinc-300">{product.description}</p>

            {attrs.length > 0 && (
              <dl className="mt-6 grid max-w-md grid-cols-2 gap-x-6 gap-y-2 text-sm">
                {attrs.map(([k, v]) => (
                  <div key={k} className="contents">
                    <dt className="text-muted">{k[0].toUpperCase() + k.slice(1)}</dt>
                    <dd className="text-white">{v}</dd>
                  </div>
                ))}
              </dl>
            )}

            <div className="mt-8"><AddToCart product={product} gold={gold} /></div>
          </div>
        </div>

        <div className="mt-14 grid gap-5 lg:grid-cols-3">
          <section className="card p-6">
            <h2 className="text-lg font-semibold">Activation instructions</h2>
            <p className="mt-3 whitespace-pre-line text-sm text-zinc-400">
              {product.activation_instructions ?? "Activation steps for this product have not been published yet."}
            </p>
          </section>
          <section className="card p-6">
            <h2 className="text-lg font-semibold">Delivery information</h2>
            <p className="mt-3 whitespace-pre-line text-sm text-zinc-400">
              {product.delivery_info ?? "Delivery details for this product have not been published yet."}
            </p>
          </section>
          <section className="card p-6">
            <h2 className="text-lg font-semibold">Refund policy</h2>
            <p className="mt-3 text-sm text-zinc-400">Read the full policy before you buy.</p>
            <Link href="/legal/refunds" className="mt-3 inline-block text-sm font-medium text-white underline underline-offset-4">View refund policy</Link>
          </section>
        </div>

        <div className="mt-14 max-w-3xl">
          <h2 className="mb-5 text-2xl font-bold">Questions</h2>
          <Faq
            items={[
              { q: "How do I get my product?", a: "After the payment provider confirms your payment, delivery details are sent to the email you entered at checkout." },
              { q: "Can I buy without an account?", a: "Yes. Checkout is as a guest." },
              { q: `Is ${brand.name} affiliated with Epic Games?`, a: "No. We are an independent store and are not affiliated with, endorsed by or sponsored by Epic Games." },
            ]}
          />
        </div>
      </div>
    </div>
  );
}
