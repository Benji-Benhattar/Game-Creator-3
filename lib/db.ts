import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

const DATA_DIR = path.join(process.cwd(), "data");
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const dbPath = path.join(DATA_DIR, "knowledge.db");

let _db: Database.Database | null = null;

export function db(): Database.Database {
  if (_db) return _db;
  const database = new Database(dbPath);
  database.pragma("journal_mode = WAL");
  database.exec(`
    CREATE TABLE IF NOT EXISTS courses (
      subject_id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      questions TEXT NOT NULL,
      created_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS certificates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      subject_id TEXT NOT NULL,
      score INTEGER NOT NULL,
      total INTEGER NOT NULL,
      earned_at INTEGER NOT NULL
    );
  `);
  _db = database;
  return _db;
}

export type StoredCourse = {
  subject_id: string;
  title: string;
  content: string;
  questions: MCQ[];
  created_at: number;
};

export type MCQ = {
  question: string;
  options: string[];
  correct_index: number;
  explanation: string;
};

export function getStoredCourse(subjectId: string): StoredCourse | null {
  const row = db()
    .prepare("SELECT subject_id, title, content, questions, created_at FROM courses WHERE subject_id = ?")
    .get(subjectId) as { subject_id: string; title: string; content: string; questions: string; created_at: number } | undefined;
  if (!row) return null;
  return {
    subject_id: row.subject_id,
    title: row.title,
    content: row.content,
    questions: JSON.parse(row.questions),
    created_at: row.created_at,
  };
}

export function saveCourse(course: Omit<StoredCourse, "created_at">): StoredCourse {
  const created_at = Date.now();
  db()
    .prepare(
      "INSERT OR REPLACE INTO courses (subject_id, title, content, questions, created_at) VALUES (?, ?, ?, ?, ?)"
    )
    .run(course.subject_id, course.title, course.content, JSON.stringify(course.questions), created_at);
  return { ...course, created_at };
}

export type Certificate = {
  id: number;
  subject_id: string;
  score: number;
  total: number;
  earned_at: number;
};

export function recordCertificate(subjectId: string, score: number, total: number): Certificate {
  const earned_at = Date.now();
  const result = db()
    .prepare("INSERT INTO certificates (subject_id, score, total, earned_at) VALUES (?, ?, ?, ?)")
    .run(subjectId, score, total, earned_at);
  return {
    id: Number(result.lastInsertRowid),
    subject_id: subjectId,
    score,
    total,
    earned_at,
  };
}

export function getCertificates(): Certificate[] {
  return db()
    .prepare("SELECT id, subject_id, score, total, earned_at FROM certificates ORDER BY earned_at DESC")
    .all() as Certificate[];
}

export function hasCertificate(subjectId: string): boolean {
  const row = db()
    .prepare("SELECT 1 FROM certificates WHERE subject_id = ? LIMIT 1")
    .get(subjectId);
  return !!row;
}
