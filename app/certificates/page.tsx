import Link from "next/link";
import { getCertificates } from "@/lib/db";
import { getPath, getSubject } from "@/lib/tree";

export const dynamic = "force-dynamic";

export default async function CertificatesPage() {
  const certs = await getCertificates();
  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-4xl font-semibold tracking-tight mb-2">Certificates</h1>
        <p className="text-ink/70">
          Pass a course (4/5 or better) to earn a certificate in that field.
        </p>
      </header>

      {certs.length === 0 ? (
        <p className="text-ink/60 italic">No certificates yet — pick a leaf subject and take a course.</p>
      ) : (
        <ul className="space-y-3">
          {certs.map((c) => {
            const subject = getSubject(c.subject_id);
            const path = subject ? getPath(c.subject_id).slice(1, -1).map((s) => s.name).join(" › ") : "";
            return (
              <li
                key={c.id}
                className="rounded-lg border border-amber-900/30 bg-parchment p-5 flex items-center justify-between"
              >
                <div>
                  <div className="text-xs text-ink/50">{path}</div>
                  <div className="text-lg font-semibold text-amber-800">
                    Certificate in {subject?.name ?? c.subject_id}
                  </div>
                  <div className="text-sm text-ink/60 mt-1">
                    Score: {c.score} / {c.total} ·{" "}
                    {new Date(c.earned_at).toLocaleDateString(undefined, {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </div>
                </div>
                <Link
                  href={`/subject/${c.subject_id}`}
                  className="text-sm text-amber-700 hover:underline"
                >
                  Revisit →
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
