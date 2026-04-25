# Knowledge Tree

A prototype web app for learning a huge range of subjects, one course at a time. Currently focused on
science.

## How it works

- **The tree of knowledge is pre-generated** — a hand-curated science taxonomy lives in
  [`lib/tree.ts`](lib/tree.ts). Each subject has a parent, children, and cross-disciplinary
  *related fields*.
- **Courses are generated on demand** — when someone opens a leaf subject for the first time,
  Claude (Opus 4.7) writes a Quantic-MBA-style course: ~1000 words of explanatory text plus a
  5-question multiple-choice quiz at the end. The course is then stored in a SQLite database
  ([`data/knowledge.db`](data/knowledge.db)), so every later visitor reads the cached version.
- **Certificates** are awarded per field for scoring 4/5 or better on the quiz.

## Stack

- Next.js 15 (App Router) + TypeScript
- Tailwind CSS
- SQLite via `better-sqlite3` for course/certificate storage
- Anthropic SDK with Claude Opus 4.7 for course generation (adaptive thinking + structured output)

## Running it

```bash
npm install
cp .env.example .env.local
# put your Anthropic API key in .env.local
npm run dev
```

Visit <http://localhost:3000>. Pick a branch (e.g. Physics) → drill down to a leaf subject (e.g.
Quantum Mechanics) → click *Generate & start course*. The first generation takes 30-60 seconds; it's
cached forever after.

## Layout

| Path | What it does |
| --- | --- |
| `app/page.tsx` | Tree browser (root + top-level branches) |
| `app/subject/[id]/page.tsx` | Subject detail — children, related fields, course launcher |
| `app/course/[id]/page.tsx` | Course view: text + MCQ + grading |
| `app/certificates/page.tsx` | Earned certificates |
| `app/api/course/[id]/route.ts` | `GET` returns or generates the course; `POST` grades answers |
| `lib/tree.ts` | The pre-generated science knowledge tree |
| `lib/claude.ts` | Course generation prompt + Anthropic client |
| `lib/db.ts` | SQLite schema for `courses` and `certificates` |

## Extending the tree

`lib/tree.ts` is just an array of `{id, name, blurb, parent, children, related}`. Add a new node,
list it under its parent's `children`, and it shows up immediately. Only leaf subjects (no children)
unlock courses.

## Notes

- This is a prototype. There is no auth — certificates are global to the deployment.
- Course quality depends on the model. Tweak the prompt in [`lib/claude.ts`](lib/claude.ts) to taste.
