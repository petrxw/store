"use client";

export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="container-page py-28 text-center" role="alert">
      <h1 className="text-3xl font-bold">Something went wrong</h1>
      <p className="mt-3 text-muted">The page could not load. Your cart is safe.</p>
      <button type="button" onClick={reset} className="btn btn-primary mt-8">Try again</button>
    </div>
  );
}
