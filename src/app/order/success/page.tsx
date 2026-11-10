import { Suspense } from "react";
import type { Metadata } from "next";
import OrderStatus from "./OrderStatus";

export const metadata: Metadata = { title: "Order confirmation", robots: { index: false } };

export default function SuccessPage() {
  return (
    <div className="container-page max-w-2xl py-20">
      <Suspense fallback={<div className="h-40 animate-pulse rounded-xl bg-raised" />}>
        <OrderStatus />
      </Suspense>
    </div>
  );
}
