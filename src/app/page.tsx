import Link from "next/link";
import { brand } from "@/config/brand";
import { categories } from "@/config/categories";
import { getApprovedReviews, getBestSellerIds, getProducts } from "@/lib/catalog";
import { isSupabaseConfigured } from "@/lib/supabase-public";
import ProductCard from "@/components/ProductCard";
import Faq from "@/components/Faq";

export const dynamic = "force-dynamic";

const faq = [
  { q: "Do I need an account to buy?", a: "No. You check out as a guest with your email address. We send your order details there." },
  { q: "How will I receive my product?", a: "By email, to the address you enter at checkout. Each product page lists its delivery details and activation steps before you pay." },
  { q: "Is my payment information stored?", a: `No. Card details are handled by our payment provider and never reach ${brand.name}.` },
  { q: `Is ${brand.name} affiliated with Epic Games?`, a: "No. We are an independent store and are not affiliated with, endorsed by or sponsored by Epic Games." },
  { q: "What if something goes wrong with my order?", a: `Read our refund policy before you buy, and contact ${brand.supportEmail} with your order reference if you need help.` },
];

const steps = [
  { title: "Choose a product", text: "Read the description, activation steps and delivery details on its page." },
  { title: "Check out as a guest", text: "Enter your email and pay through our payment provider." },
  { title: "Payment is confirmed", text: "Your order only moves forward once the provider confirms the payment to our server." },
  { title: "Receive your order", text: "Delivery details arrive by email, as described on the product page." },
];

const reasons = [
  { title: "Clear product information", text: "Activation steps and delivery details are shown on every product page before you pay." },
  { title: "Secure payment", text: "Payments run through a payment provider. We never see or store your card details." },
  { title: "Policies up front", text: "The refund policy, terms and privacy policy are one click from every page." },
  { title: "Human support", text: `Questions go to ${brand.supportEmail}. Include your order reference.` },
];

export default async function HomePage() {
  const [products, bestIds, reviews] = await Promise.all([getProducts(), getBestSellerIds(), getApprovedReviews()]);

  const featuredPool = products.filter((p) => p.featured);
  const featured = (featuredPool.length > 0 ? featuredPool : products).slice(0, 4);
  const bestSellers = bestIds.map((id) => products.find((p) => p.id === id)).filter((p): p is NonNullable<typeof p> => Boolean(p));
  // Only shown when real stock is low. Never a made-up scarcity message.
  const limited = products.filter((p) => p.stock_quantity > 0 && p.stock_quantity <= 10).slice(0, 4);

  return (
    <>
      <section className="hero-backdrop relative overflow-hidden border-b border-line">
        <div className="hero-grid absolute inset-0" aria-hidden="true" />
        <div className="container-page relative grid items-center gap-12 py-20 sm:py-28 lg:grid-cols-[1.15fr_0.85fr] lg:py-32">
          <div>
            <p className="eyebrow">Gaming rewards · Digital products</p>
            <h1 className="mt-5 max-w-3xl text-[2.75rem] font-bold uppercase leading-[0.98] sm:text-6xl lg:text-7xl">
              Your next level <span className="bg-brand-gradient bg-clip-text text-transparent">starts here.</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg text-zinc-400">Discover exclusive gaming rewards and digital products.</p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link href="#featured" className="btn btn-primary">Explore Products</Link>
              <Link href="#how-it-works" className="btn btn-ghost">How It Works</Link>
            </div>
          </div>
          <ul className="grid grid-cols-2 gap-3" aria-label="Categories">
            {categories.map((c) => (
              <li key={c.slug}>
                <Link
                  href={`/category/${c.slug}`}
                  className={`flex h-full min-h-[104px] flex-col justify-end rounded-xl border p-4 text-sm font-semibold transition duration-300 hover:-translate-y-0.5 ${
                    c.theme === "gold"
                      ? "border-gold-deep/60 bg-gradient-to-br from-[#241b09] to-surface text-gold-soft hover:border-gold"
                      : "border-line bg-surface/80 text-white hover:border-violet/60"
                  }`}
                >
                  {c.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {!isSupabaseConfigured() && (
        <div className="border-b border-amber-500/30 bg-amber-500/10">
          <p className="container-page py-3 text-sm text-amber-200">
            Catalog not connected. Add your Supabase keys to <code>.env.local</code> and run <code>supabase/schema.sql</code> to show products.
          </p>
        </div>
      )}

      <section id="featured" className="section scroll-mt-20">
        <div className="container-page">
          <div className="mb-8 flex items-end justify-between gap-4">
            <div>
              <p className="eyebrow">Featured</p>
              <h2 className="mt-2 text-3xl font-bold sm:text-4xl">Featured products</h2>
            </div>
          </div>
          {featured.length === 0 ? (
            <div className="card px-6 py-14 text-center">
              <p className="text-lg font-semibold text-white">No products listed yet</p>
              <p className="mt-2 text-sm text-muted">Listings appear here as soon as they are verified.</p>
            </div>
          ) : (
            <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {featured.map((p) => <li key={p.id}><ProductCard product={p} /></li>)}
            </ul>
          )}
        </div>
      </section>

      <section className="border-y border-line bg-surface/50 section">
        <div className="container-page">
          <p className="eyebrow">Browse</p>
          <h2 className="mt-2 text-3xl font-bold sm:text-4xl">Shop by category</h2>
          <ul className="mt-8 grid gap-4 sm:grid-cols-2">
            {categories.map((c) => (
              <li key={c.slug}>
                <Link
                  href={`/category/${c.slug}`}
                  className={`group block h-full rounded-xl border p-6 transition duration-300 hover:-translate-y-0.5 ${
                    c.theme === "gold" ? "border-gold-deep/60 bg-gradient-to-br from-[#1a1408] to-surface hover:border-gold" : "border-line bg-surface hover:border-violet/60"
                  }`}
                >
                  <h3 className={`text-xl font-semibold ${c.theme === "gold" ? "text-gold-soft" : ""}`}>{c.name}</h3>
                  <p className="mt-2 text-sm text-zinc-400">{c.blurb}</p>
                  <span className="mt-4 inline-block text-sm font-medium text-white underline-offset-4 group-hover:underline">View category →</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {bestSellers.length > 0 && (
        <section className="section">
          <div className="container-page">
            <p className="eyebrow">Popular</p>
            <h2 className="mt-2 text-3xl font-bold sm:text-4xl">Best sellers</h2>
            <ul className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {bestSellers.map((p) => <li key={p.id}><ProductCard product={p} /></li>)}
            </ul>
          </div>
        </section>
      )}

      {limited.length > 0 && (
        <section className="section">
          <div className="container-page">
            <p className="eyebrow">Low stock</p>
            <h2 className="mt-2 text-3xl font-bold sm:text-4xl">Almost gone</h2>
            <p className="mt-2 text-sm text-muted">Shown only when ten or fewer are actually left.</p>
            <ul className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {limited.map((p) => <li key={p.id}><ProductCard product={p} /></li>)}
            </ul>
          </div>
        </section>
      )}

      <section className="border-y border-line bg-surface/50 section">
        <div className="container-page">
          <p className="eyebrow">Why {brand.name}</p>
          <h2 className="mt-2 text-3xl font-bold sm:text-4xl">What you can expect</h2>
          <ul className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {reasons.map((r) => (
              <li key={r.title} className="card p-6">
                <h3 className="text-lg font-semibold">{r.title}</h3>
                <p className="mt-2 text-sm text-zinc-400">{r.text}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section id="how-it-works" className="section scroll-mt-20">
        <div className="container-page">
          <p className="eyebrow">How it works</p>
          <h2 className="mt-2 text-3xl font-bold sm:text-4xl">Buying in four steps</h2>
          <ol className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((s, i) => (
              <li key={s.title} className="card p-6">
                <span className="font-display text-sm font-semibold text-violet-soft">Step {i + 1}</span>
                <h3 className="mt-2 text-lg font-semibold">{s.title}</h3>
                <p className="mt-2 text-sm text-zinc-400">{s.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {reviews.length > 0 && (
        <section className="border-y border-line bg-surface/50 section">
          <div className="container-page">
            <p className="eyebrow">Customers</p>
            <h2 className="mt-2 text-3xl font-bold sm:text-4xl">Reviews from real orders</h2>
            <ul className="mt-8 grid gap-5 md:grid-cols-3">
              {reviews.map((r) => (
                <li key={r.id} className="card p-6">
                  <p className="text-sm text-gold-soft" aria-label={`${r.rating} out of 5`}>{"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}</p>
                  <p className="mt-3 text-sm text-zinc-300">{r.body}</p>
                  <p className="mt-4 text-xs text-muted">{r.author_name}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      <section id="faq" className="section scroll-mt-20">
        <div className="container-page max-w-3xl">
          <p className="eyebrow">FAQ</p>
          <h2 className="mt-2 text-3xl font-bold sm:text-4xl">Common questions</h2>
          <div className="mt-8"><Faq items={faq} /></div>
        </div>
      </section>
    </>
  );
}
