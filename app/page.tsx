import Link from "next/link";
import { getChildren, getRoot, isLeaf } from "@/lib/tree";

export default function Home() {
  const root = getRoot();
  const branches = getChildren(root.id);

  return (
    <div className="space-y-10">
      <section>
        <h1 className="text-4xl font-semibold tracking-tight mb-3">{root.name}</h1>
        <p className="text-ink/70 max-w-2xl">{root.blurb}</p>
        <p className="text-sm text-ink/50 mt-4">
          Pick any field to drill down. Leaf subjects unlock a full course with a quiz at the end and a
          certificate when you pass.
        </p>
      </section>

      <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {branches.map((branch) => {
          const subBranches = getChildren(branch.id);
          return (
            <Link
              key={branch.id}
              href={`/subject/${branch.id}`}
              className="block rounded-lg border border-amber-900/20 bg-white/40 p-5 hover:border-amber-700 hover:shadow-sm transition"
            >
              <h2 className="text-xl font-semibold text-amber-800 mb-2">{branch.name}</h2>
              <p className="text-sm text-ink/70 mb-3">{branch.blurb}</p>
              <ul className="text-xs text-ink/60 flex flex-wrap gap-1.5">
                {subBranches.slice(0, 6).map((s) => (
                  <li key={s.id} className="px-2 py-0.5 rounded-full bg-amber-100/60">
                    {s.name}
                    {isLeaf(s.id) ? "" : " ›"}
                  </li>
                ))}
                {subBranches.length > 6 && (
                  <li className="px-2 py-0.5 text-ink/40">+{subBranches.length - 6} more</li>
                )}
              </ul>
            </Link>
          );
        })}
      </section>
    </div>
  );
}
