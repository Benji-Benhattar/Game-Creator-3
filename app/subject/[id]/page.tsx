import Link from "next/link";
import { notFound } from "next/navigation";
import { getChildren, getPath, getRelated, getSubject, isLeaf } from "@/lib/tree";
import { getStoredCourse, hasCertificate } from "@/lib/db";

export default async function SubjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const subject = getSubject(id);
  if (!subject) notFound();

  const path = getPath(id);
  const children = getChildren(id);
  const related = getRelated(id);
  const leaf = isLeaf(id);
  const stored = leaf ? getStoredCourse(id) : null;
  const passed = leaf ? hasCertificate(id) : false;

  return (
    <div className="space-y-10">
      <nav className="text-sm text-ink/60 flex flex-wrap gap-1">
        {path.slice(0, -1).map((s, i) => (
          <span key={s.id}>
            <Link href={i === 0 ? "/" : `/subject/${s.id}`} className="hover:text-amber-700">
              {s.name}
            </Link>
            <span className="mx-1.5">›</span>
          </span>
        ))}
        <span className="text-ink/40">{subject.name}</span>
      </nav>

      <section>
        <h1 className="text-4xl font-semibold tracking-tight mb-3">{subject.name}</h1>
        <p className="text-ink/70 max-w-2xl">{subject.blurb}</p>
      </section>

      {leaf ? (
        <section className="rounded-lg border border-amber-900/20 bg-white/50 p-6">
          <h2 className="text-xl font-semibold mb-2">Course</h2>
          <p className="text-sm text-ink/70 mb-4">
            {stored
              ? "A course on this subject has been generated. Take it any time."
              : "No course yet for this subject. Generate one with Claude — it will be cached so you (and others) only pay for it once."}
          </p>
          <div className="flex items-center gap-3">
            <Link
              href={`/course/${id}`}
              className="inline-block px-4 py-2 rounded-md bg-amber-700 text-white text-sm font-medium hover:bg-amber-800"
            >
              {stored ? "Open course" : "Generate & start course"}
            </Link>
            {passed && (
              <span className="text-sm text-emerald-700">✓ Certificate earned</span>
            )}
          </div>
        </section>
      ) : (
        <section>
          <h2 className="text-lg font-semibold mb-3">Subfields</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {children.map((c) => (
              <Link
                key={c.id}
                href={`/subject/${c.id}`}
                className="block rounded-md border border-amber-900/20 bg-white/40 p-4 hover:border-amber-700"
              >
                <div className="font-medium">
                  {c.name}
                  {!isLeaf(c.id) && <span className="text-ink/40"> ›</span>}
                </div>
                <p className="text-sm text-ink/60 mt-1">{c.blurb}</p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {related.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold mb-3">Related fields</h2>
          <ul className="flex flex-wrap gap-2">
            {related.map((r) => (
              <li key={r.id}>
                <Link
                  href={`/subject/${r.id}`}
                  className="px-3 py-1 rounded-full bg-amber-100/70 hover:bg-amber-200 text-sm"
                >
                  {r.name}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
