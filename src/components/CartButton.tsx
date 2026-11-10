"use client";

import { useCart } from "./CartProvider";

export default function CartButton() {
  const { count, hydrated, setOpen } = useCart();
  return (
    <button
      type="button"
      onClick={() => setOpen(true)}
      className="btn btn-ghost relative !px-3"
      aria-label={`Open cart${hydrated ? `, ${count} items` : ""}`}
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M6 7h12l-1 12H7L6 7Z" />
        <path d="M9 7a3 3 0 0 1 6 0" />
      </svg>
      <span className="hidden sm:inline">Cart</span>
      {hydrated && count > 0 && (
        <span className="absolute -right-1.5 -top-1.5 grid h-5 min-w-5 place-items-center rounded-full bg-violet px-1 text-[11px] font-bold text-white">
          {count}
        </span>
      )}
    </button>
  );
}
