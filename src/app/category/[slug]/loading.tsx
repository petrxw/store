export default function Loading() {
  return (
    <div className="container-page py-16" aria-busy="true" aria-label="Loading">
      <div className="h-10 w-64 animate-pulse rounded bg-raised" />
      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="h-72 animate-pulse rounded-xl bg-raised" />
        ))}
      </div>
    </div>
  );
}
