import postgres from "postgres";

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

let _sql: ReturnType<typeof postgres> | null = null;

function sql() {
  if (_sql) return _sql;
  const url = process.env.POSTGRES_URL;
  if (!url) {
    throw new Error(
      "POSTGRES_URL is not set. Run `vercel env pull .env.local` or set it in your environment."
    );
  }
  _sql = postgres(url, {
    // Vercel serverless: keep pool small, idle short
    max: 5,
    idle_timeout: 20,
    connect_timeout: 10,
  });
  return _sql;
}

let initPromise: Promise<void> | null = null;

async function init(): Promise<void> {
  if (initPromise) return initPromise;
  initPromise = (async () => {
    const s = sql();
    await s`
      CREATE TABLE IF NOT EXISTS courses (
        subject_id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        questions JSONB NOT NULL,
        created_at BIGINT NOT NULL
      )
    `;
    await s`
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
  const rows = await sql()<
    {
      subject_id: string;
      title: string;
      content: string;
      questions: MCQ[];
      created_at: string;
    }[]
  >`SELECT subject_id, title, content, questions, created_at FROM courses WHERE subject_id = ${subjectId}`;
  const row = rows[0];
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
  const s = sql();
  await s`
    INSERT INTO courses (subject_id, title, content, questions, created_at)
    VALUES (${course.subject_id}, ${course.title}, ${course.content}, ${s.json(course.questions)}, ${created_at})
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
  const rows = await sql()<{ id: number }[]>`
    INSERT INTO certificates (subject_id, score, total, earned_at)
    VALUES (${subjectId}, ${score}, ${total}, ${earned_at})
    RETURNING id
  `;
  return {
    id: rows[0].id,
    subject_id: subjectId,
    score,
    total,
    earned_at,
  };
}

export async function getCertificates(): Promise<Certificate[]> {
  await init();
  const rows = await sql()<
    {
      id: number;
      subject_id: string;
      score: number;
      total: number;
      earned_at: string;
    }[]
  >`SELECT id, subject_id, score, total, earned_at FROM certificates ORDER BY earned_at DESC`;
  return rows.map((r) => ({
    id: r.id,
    subject_id: r.subject_id,
    score: r.score,
    total: r.total,
    earned_at: Number(r.earned_at),
  }));
}

export async function hasCertificate(subjectId: string): Promise<boolean> {
  await init();
  const rows = await sql()`SELECT 1 FROM certificates WHERE subject_id = ${subjectId} LIMIT 1`;
  return rows.length > 0;
}

export async function getCertifiedSubjectIds(): Promise<Set<string>> {
  await init();
  const rows = await sql()<{ subject_id: string }[]>`SELECT DISTINCT subject_id FROM certificates`;
  return new Set(rows.map((r) => r.subject_id));
}

export async function getStartedSubjectIds(): Promise<Set<string>> {
  await init();
  const rows = await sql()<{ subject_id: string }[]>`SELECT subject_id FROM courses`;
  return new Set(rows.map((r) => r.subject_id));
}
