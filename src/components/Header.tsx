import Link from "next/link";
import { brand } from "@/config/brand";
import { categories } from "@/config/categories";
import CartButton from "./CartButton";

export default function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-ink/85 backdrop-blur">
      <div className="container-page flex h-16 items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2.5" aria-label={`${brand.name} home`}>
          <svg width="26" height="26" viewBox="0 0 26 26" aria-hidden="true">
            <defs>
              <linearGradient id="logo-g" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="#8B5CF6" />
                <stop offset="1" stopColor="#3B82F6" />
              </linearGradient>
            </defs>
            <path d="M3 22V4l10 11V4h4v18L7 11v11H3Z" fill="url(#logo-g)" />
            <rect x="19" y="4" width="4" height="18" rx="1" fill="url(#logo-g)" opacity="0.55" />
          </svg>
          <span className="font-display text-lg font-bold tracking-[0.14em] text-white">{brand.name}</span>
        </Link>

        <nav aria-label="Categories" className="hidden items-center gap-6 text-sm md:flex">
          {categories.map((c) => (
            <Link key={c.slug} href={`/category/${c.slug}`} className="text-zinc-400 transition hover:text-white">
              {c.name}
            </Link>
          ))}
        </nav>

        <CartButton />
      </div>
      <nav aria-label="Categories" className="container-page flex gap-5 overflow-x-auto pb-3 text-sm md:hidden">
        {categories.map((c) => (
          <Link key={c.slug} href={`/category/${c.slug}`} className="whitespace-nowrap text-zinc-400 hover:text-white">
            {c.name}
          </Link>
        ))}
      </nav>
    </header>
  );
}
