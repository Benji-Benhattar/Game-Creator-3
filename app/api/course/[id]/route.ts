import { NextResponse } from "next/server";
import { getStoredCourse, saveCourse, recordCertificate } from "@/lib/db";
import { generateCourse } from "@/lib/claude";
import { getSubject, isLeaf } from "@/lib/tree";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const subject = getSubject(id);
  if (!subject) {
    return NextResponse.json({ error: "Unknown subject" }, { status: 404 });
  }
  if (!isLeaf(id)) {
    return NextResponse.json(
      { error: "Courses are only available for leaf subjects" },
      { status: 400 }
    );
  }

  const existing = await getStoredCourse(id);
  if (existing) {
    return NextResponse.json({ course: existing, cached: true });
  }

  try {
    const generated = await generateCourse(id);
    const stored = await saveCourse({
      subject_id: id,
      title: generated.title,
      content: generated.content,
      questions: generated.questions,
    });
    return NextResponse.json({ course: stored, cached: false });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Generation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const subject = getSubject(id);
  if (!subject) {
    return NextResponse.json({ error: "Unknown subject" }, { status: 404 });
  }

  const body = (await req.json().catch(() => ({}))) as {
    answers?: number[];
  };
  const stored = await getStoredCourse(id);
  if (!stored) {
    return NextResponse.json({ error: "Course not generated yet" }, { status: 400 });
  }
  const answers = body.answers ?? [];
  if (answers.length !== stored.questions.length) {
    return NextResponse.json(
      { error: `Expected ${stored.questions.length} answers` },
      { status: 400 }
    );
  }

  let score = 0;
  const results = stored.questions.map((q, i) => {
    const correct = answers[i] === q.correct_index;
    if (correct) score += 1;
    return { correct, correct_index: q.correct_index, explanation: q.explanation };
  });
  const total = stored.questions.length;
  const passed = score >= Math.ceil(total * 0.8);
  let certificate = null;
  if (passed) {
    certificate = await recordCertificate(id, score, total);
  }
  return NextResponse.json({ score, total, passed, results, certificate });
}
