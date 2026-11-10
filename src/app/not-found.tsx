import Link from "next/link";

export default function NotFound() {
  return (
    <div className="container-page py-28 text-center">
      <p className="eyebrow">404</p>
      <h1 className="mt-3 text-4xl font-bold">Page not found</h1>
      <p className="mt-3 text-muted">The page you are looking for does not exist or is no longer listed.</p>
      <Link href="/" className="btn btn-primary mt-8">Back to the store</Link>
    </div>
  );
}
