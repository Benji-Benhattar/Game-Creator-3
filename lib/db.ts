import { sql } from "@vercel/postgres";

export type MCQ = {
  question: string;
  options: string[];
  correct_index: number;
  explanation: string;
};

export type StoredCourse = {
  subject_id: string;
  title: string;
  content: string;
  questions: MCQ[];
  created_at: number;
};

export type Certificate = {
  id: number;
  subject_id: string;
  score: number;
  total: number;
  earned_at: number;
};

let initPromise: Promise<void> | null = null;

async function init(): Promise<void> {
  if (initPromise) return initPromise;
  initPromise = (async () => {
    await sql`
      CREATE TABLE IF NOT EXISTS courses (
        subject_id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        questions JSONB NOT NULL,
        created_at BIGINT NOT NULL
      )
    `;
    await sql`
      CREATE TABLE IF NOT EXISTS certificates (
        id SERIAL PRIMARY KEY,
        subject_id TEXT NOT NULL,
        score INTEGER NOT NULL,
        total INTEGER NOT NULL,
        earned_at BIGINT NOT NULL
      )
    `;
  })().catch((err) => {
    initPromise = null;
    throw err;
  });
  return initPromise;
}

export async function getStoredCourse(subjectId: string): Promise<StoredCourse | null> {
  await init();
  const result = await sql<{
    subject_id: string;
    title: string;
    content: string;
    questions: MCQ[];
    created_at: string;
  }>`SELECT subject_id, title, content, questions, created_at FROM courses WHERE subject_id = ${subjectId}`;
  const row = result.rows[0];
  if (!row) return null;
  return {
    subject_id: row.subject_id,
    title: row.title,
    content: row.content,
    questions: row.questions,
    created_at: Number(row.created_at),
  };
}

export async function saveCourse(
  course: Omit<StoredCourse, "created_at">
): Promise<StoredCourse> {
  await init();
  const created_at = Date.now();
  await sql`
    INSERT INTO courses (subject_id, title, content, questions, created_at)
    VALUES (${course.subject_id}, ${course.title}, ${course.content}, ${JSON.stringify(course.questions)}::jsonb, ${created_at})
    ON CONFLICT (subject_id) DO UPDATE SET
      title = EXCLUDED.title,
      content = EXCLUDED.content,
      questions = EXCLUDED.questions,
      created_at = EXCLUDED.created_at
  `;
  return { ...course, created_at };
}

export async function recordCertificate(
  subjectId: string,
  score: number,
  total: number
): Promise<Certificate> {
  await init();
  const earned_at = Date.now();
  const result = await sql<{ id: number }>`
    INSERT INTO certificates (subject_id, score, total, earned_at)
    VALUES (${subjectId}, ${score}, ${total}, ${earned_at})
    RETURNING id
  `;
  return {
    id: result.rows[0].id,
    subject_id: subjectId,
    score,
    total,
    earned_at,
  };
}

export async function getCertificates(): Promise<Certificate[]> {
  await init();
  const result = await sql<{
    id: number;
    subject_id: string;
    score: number;
    total: number;
    earned_at: string;
  }>`SELECT id, subject_id, score, total, earned_at FROM certificates ORDER BY earned_at DESC`;
  return result.rows.map((r) => ({
    id: r.id,
    subject_id: r.subject_id,
    score: r.score,
    total: r.total,
    earned_at: Number(r.earned_at),
  }));
}

export async function hasCertificate(subjectId: string): Promise<boolean> {
  await init();
  const result = await sql`SELECT 1 FROM certificates WHERE subject_id = ${subjectId} LIMIT 1`;
  return result.rows.length > 0;
}

export async function getCertifiedSubjectIds(): Promise<Set<string>> {
  await init();
  const result = await sql<{ subject_id: string }>`SELECT DISTINCT subject_id FROM certificates`;
  return new Set(result.rows.map((r) => r.subject_id));
}

export async function getStartedSubjectIds(): Promise<Set<string>> {
  await init();
  const result = await sql<{ subject_id: string }>`SELECT subject_id FROM courses`;
  return new Set(result.rows.map((r) => r.subject_id));
}
