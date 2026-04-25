import Link from "next/link";

export default function NotFound() {
  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-semibold">Not found</h1>
      <p className="text-ink/70">That subject isn't in the tree.</p>
      <Link href="/" className="text-amber-700 hover:underline">
        ← Back to the tree
      </Link>
    </div>
  );
}
