"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";

type MCQ = {
  question: string;
  options: string[];
  correct_index: number;
  explanation: string;
};

type Course = {
  subject_id: string;
  title: string;
  content: string;
  questions: MCQ[];
};

type GradeResult = {
  score: number;
  total: number;
  passed: boolean;
  results: { correct: boolean; correct_index: number; explanation: string }[];
  certificate: { id: number } | null;
};

export default function CoursePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [course, setCourse] = useState<Course | null>(null);
  const [cached, setCached] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [grade, setGrade] = useState<GradeResult | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let active = true;
    fetch(`/api/course/${id}`)
      .then(async (r) => {
        const data = await r.json();
        if (!r.ok) throw new Error(data.error || "Failed to load course");
        if (active) {
          setCourse(data.course);
          setCached(data.cached);
        }
      })
      .catch((e) => active && setError(String(e.message ?? e)));
    return () => {
      active = false;
    };
  }, [id]);

  if (error) {
    return (
      <div className="space-y-4">
        <p className="text-red-700">Error: {error}</p>
        <Link href={`/subject/${id}`} className="text-sm text-amber-700 hover:underline">
          ← Back to subject
        </Link>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="space-y-4">
        <h1 className="text-3xl font-semibold">Preparing your course…</h1>
        <p className="text-ink/60">
          If this is the first time anyone has studied this subject, Claude is writing the course now —
          this can take 30-60 seconds. Subsequent visits will be instant.
        </p>
      </div>
    );
  }

  const allAnswered = course.questions.every((_, i) => answers[i] !== undefined);

  async function submit() {
    if (!course) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/course/${id}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          answers: course.questions.map((_, i) => answers[i] ?? -1),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Grade failed");
      setGrade(data);
    } catch (e) {
      setError(String((e as Error).message ?? e));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <article className="space-y-10">
      <header>
        <Link href={`/subject/${id}`} className="text-sm text-amber-700 hover:underline">
          ← {course.title.replace(/^Introduction to |^A Course on /i, "")}
        </Link>
        <h1 className="text-4xl font-semibold tracking-tight mt-3">{course.title}</h1>
        {!cached && (
          <p className="text-xs text-emerald-700 mt-2">Freshly generated and saved to the library.</p>
        )}
      </header>

      <section className="prose-course max-w-3xl">
        <Markdown source={course.content} />
      </section>

      <section className="border-t border-amber-900/20 pt-8">
        <h2 className="text-2xl font-semibold mb-2">Knowledge check</h2>
        <p className="text-sm text-ink/60 mb-6">
          Answer all 5 questions. You need 4 correct (80%) to earn a certificate.
        </p>
        <ol className="space-y-6">
          {course.questions.map((q, i) => {
            const result = grade?.results[i];
            return (
              <li key={i} className="rounded-lg border border-amber-900/15 bg-white/40 p-4">
                <p className="font-medium mb-3">
                  {i + 1}. {q.question}
                </p>
                <ul className="space-y-2">
                  {q.options.map((opt, j) => {
                    const chosen = answers[i] === j;
                    let cls = "border-amber-900/15 hover:bg-amber-50";
                    if (grade) {
                      if (j === q.correct_index) cls = "border-emerald-600 bg-emerald-50";
                      else if (chosen) cls = "border-red-500 bg-red-50";
                      else cls = "border-amber-900/10 opacity-60";
                    } else if (chosen) {
                      cls = "border-amber-700 bg-amber-50";
                    }
                    return (
                      <li key={j}>
                        <label
                          className={`flex gap-2 rounded-md border px-3 py-2 cursor-pointer ${cls}`}
                        >
                          <input
                            type="radio"
                            name={`q-${i}`}
                            disabled={!!grade}
                            checked={chosen}
                            onChange={() => setAnswers((a) => ({ ...a, [i]: j }))}
                            className="mt-1"
                          />
                          <span>{opt}</span>
                        </label>
                      </li>
                    );
                  })}
                </ul>
                {result && (
                  <p className={`mt-3 text-sm ${result.correct ? "text-emerald-700" : "text-red-700"}`}>
                    {result.correct ? "Correct. " : "Incorrect. "}
                    {result.explanation}
                  </p>
                )}
              </li>
            );
          })}
        </ol>

        {!grade && (
          <button
            onClick={submit}
            disabled={!allAnswered || submitting}
            className="mt-6 px-5 py-2.5 rounded-md bg-amber-700 text-white font-medium hover:bg-amber-800 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {submitting ? "Grading…" : "Submit answers"}
          </button>
        )}

        {grade && (
          <div className="mt-8 p-6 rounded-lg border border-amber-900/30 bg-parchment">
            <h3 className="text-2xl font-semibold mb-2">
              You scored {grade.score} / {grade.total}
            </h3>
            {grade.passed ? (
              <p className="text-emerald-800">
                🎓 Certificate earned in {course.title.replace(/^Introduction to /i, "")}.{" "}
                <Link href="/certificates" className="underline">View certificates</Link>.
              </p>
            ) : (
              <p className="text-ink/70">
                You need 4 correct to earn a certificate. Review the explanations above and try again
                soon — answers reset on refresh.
              </p>
            )}
          </div>
        )}
      </section>
    </article>
  );
}

function Markdown({ source }: { source: string }) {
  // Minimal Markdown renderer: H2, paragraphs, bold/italic/code, lists.
  const blocks = source.split(/\n{2,}/);
  return (
    <>
      {blocks.map((block, i) => {
        const trimmed = block.trim();
        if (trimmed.startsWith("## ")) {
          return <h2 key={i}>{inline(trimmed.slice(3))}</h2>;
        }
        if (/^[-*] /.test(trimmed)) {
          const items = trimmed.split(/\n/).map((line) => line.replace(/^[-*]\s+/, ""));
          return (
            <ul key={i}>
              {items.map((it, j) => (
                <li key={j}>{inline(it)}</li>
              ))}
            </ul>
          );
        }
        if (/^\d+\.\s/.test(trimmed)) {
          const items = trimmed.split(/\n/).map((line) => line.replace(/^\d+\.\s+/, ""));
          return (
            <ol key={i}>
              {items.map((it, j) => (
                <li key={j}>{inline(it)}</li>
              ))}
            </ol>
          );
        }
        return <p key={i}>{inline(trimmed)}</p>;
      })}
    </>
  );
}

function inline(text: string): React.ReactNode {
  // Handle **bold**, *italic*, `code` in a single pass.
  const parts: React.ReactNode[] = [];
  const regex = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let key = 0;
  while ((match = regex.exec(text))) {
    if (match.index > lastIndex) parts.push(text.slice(lastIndex, match.index));
    const token = match[0];
    if (token.startsWith("**")) parts.push(<strong key={key++}>{token.slice(2, -2)}</strong>);
    else if (token.startsWith("*")) parts.push(<em key={key++}>{token.slice(1, -1)}</em>);
    else if (token.startsWith("`")) parts.push(<code key={key++}>{token.slice(1, -1)}</code>);
    lastIndex = match.index + token.length;
  }
  if (lastIndex < text.length) parts.push(text.slice(lastIndex));
  return parts;
}
