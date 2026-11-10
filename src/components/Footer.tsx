import Link from "next/link";
import { brand } from "@/config/brand";
import { categories } from "@/config/categories";

export default function Footer() {
  return (
    <footer className="mt-10 border-t border-line bg-surface/60">
      <div className="container-page grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div className="lg:col-span-2">
          <p className="font-display text-lg font-bold tracking-[0.14em] text-white">{brand.name}</p>
          <p className="mt-3 max-w-md text-sm text-muted">{brand.description}</p>
          <p className="mt-4 text-sm text-muted">
            Support: <span className="select-all text-zinc-300">{brand.supportEmail}</span>
          </p>
        </div>
        <div>
          <p className="eyebrow">Shop</p>
          <ul className="mt-4 space-y-2 text-sm">
            {categories.map((c) => (
              <li key={c.slug}>
                <Link href={`/category/${c.slug}`} className="text-zinc-400 hover:text-white">{c.name}</Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="eyebrow">Help</p>
          <ul className="mt-4 space-y-2 text-sm">
            <li><Link href="/legal/refunds" className="text-zinc-400 hover:text-white">Refund policy</Link></li>
            <li><Link href="/legal/terms" className="text-zinc-400 hover:text-white">Terms and conditions</Link></li>
            <li><Link href="/legal/privacy" className="text-zinc-400 hover:text-white">Privacy policy</Link></li>
            <li><Link href="/legal/contact" className="text-zinc-400 hover:text-white">Contact</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-line">
        <div className="container-page py-6 text-xs leading-relaxed text-zinc-500">
          <p>{brand.disclaimer}</p>
          <p className="mt-2">© {new Date().getFullYear()} {brand.name}. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
