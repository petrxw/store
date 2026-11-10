import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { legalPages } from "@/config/legal";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return legalPages.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const page = legalPages.find((p) => p.slug === slug);
  return page ? { title: page.title } : {};
}

export default async function LegalPage({ params }: Props) {
  const { slug } = await params;
  const page = legalPages.find((p) => p.slug === slug);
  if (!page) notFound();

  return (
    <div className="container-page max-w-3xl py-14 sm:py-20">
      <h1 className="text-4xl font-bold">{page.title}</h1>
      <p className="mt-4 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
        Draft template. Replace every [BRACKET] and have this text reviewed before launch.
      </p>
      <div className="mt-10 space-y-8">
        {page.sections.map((s) => (
          <section key={s.heading}>
            <h2 className="text-xl font-semibold">{s.heading}</h2>
            <p className="mt-2 text-zinc-400">{s.body}</p>
          </section>
        ))}
      </div>
    </div>
  );
}
