import { getAllSubjects, getPath, isLeaf } from "@/lib/tree";
import { getCertifiedSubjectIds, getStartedSubjectIds } from "@/lib/db";
import AllSubjectsClient from "./client";

export const dynamic = "force-dynamic";

export default function AllSubjectsPage() {
  const certified = getCertifiedSubjectIds();
  const started = getStartedSubjectIds();
  const items = getAllSubjects().map((s) => ({
    id: s.id,
    name: s.name,
    blurb: s.blurb,
    breadcrumb: getPath(s.id).slice(0, -1).map((p) => p.name).join(" › "),
    leaf: isLeaf(s.id),
    certified: certified.has(s.id),
    started: started.has(s.id),
  }));

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-4xl font-semibold tracking-tight mb-2">All subjects</h1>
        <p className="text-ink/70">Search the full tree of {items.length} subjects.</p>
      </header>
      <AllSubjectsClient items={items} />
    </div>
  );
}
