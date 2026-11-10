export type FaqItem = { q: string; a: string };

export default function Faq({ items }: { items: FaqItem[] }) {
  return (
    <div className="divide-y divide-line rounded-xl border border-line bg-surface">
      {items.map((item) => (
        <details key={item.q} className="group px-5 py-4">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium text-white [&::-webkit-details-marker]:hidden">
            {item.q}
            <span className="text-violet-soft transition group-open:rotate-45" aria-hidden="true">+</span>
          </summary>
          <p className="mt-3 max-w-prose text-sm leading-relaxed text-zinc-400">{item.a}</p>
        </details>
      ))}
    </div>
  );
}
