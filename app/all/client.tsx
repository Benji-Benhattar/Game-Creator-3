"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

type Item = {
  id: string;
  name: string;
  blurb: string;
  breadcrumb: string;
  leaf: boolean;
  certified: boolean;
  started: boolean;
};

export default function AllSubjectsClient({ items }: { items: Item[] }) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "leaves" | "certified">("all");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((item) => {
      if (filter === "leaves" && !item.leaf) return false;
      if (filter === "certified" && !item.certified) return false;
      if (!q) return true;
      return (
        item.name.toLowerCase().includes(q) ||
        item.blurb.toLowerCase().includes(q) ||
        item.breadcrumb.toLowerCase().includes(q)
      );
    });
  }, [items, query, filter]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search subjects (e.g. quantum, evolution, calculus)…"
          className="flex-1 rounded-md border border-amber-900/20 bg-white/70 px-3 py-2 text-sm focus:outline-none focus:border-amber-700"
        />
        <div className="flex gap-1 text-sm">
          {(["all", "leaves", "certified"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-2 rounded-md border ${
                filter === f
                  ? "bg-amber-700 text-white border-amber-700"
                  : "bg-white/40 border-amber-900/20 hover:border-amber-700"
              }`}
            >
              {f === "all" ? "All" : f === "leaves" ? "Courses" : "Certified"}
            </button>
          ))}
        </div>
      </div>

      <p className="text-xs text-ink/50">
        {filtered.length} of {items.length} subjects
      </p>

      <ul className="divide-y divide-amber-900/10 rounded-lg border border-amber-900/15 bg-white/30">
        {filtered.map((item) => (
          <li key={item.id}>
            <Link
              href={`/subject/${item.id}`}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-4 py-3 hover:bg-amber-50/60"
            >
              <div className="min-w-0">
                <div className="text-xs text-ink/50">{item.breadcrumb || "Root"}</div>
                <div className="font-medium flex items-center gap-2">
                  {item.name}
                  {item.certified && (
                    <span className="text-xs px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                      🎓
                    </span>
                  )}
                  {item.started && !item.certified && (
                    <span className="text-xs px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-800">
                      started
                    </span>
                  )}
                  {item.leaf && (
                    <span className="text-xs px-1.5 py-0.5 rounded-full bg-amber-100/50 text-amber-700">
                      course
                    </span>
                  )}
                </div>
                <p className="text-sm text-ink/60 mt-0.5 line-clamp-1">{item.blurb}</p>
              </div>
              <span className="text-amber-700 text-sm shrink-0">→</span>
            </Link>
          </li>
        ))}
        {filtered.length === 0 && (
          <li className="px-4 py-6 text-sm text-ink/50 italic">No subjects match.</li>
        )}
      </ul>
    </div>
  );
}
