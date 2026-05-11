# Knowledge Tree

A prototype web app for learning a huge range of subjects, one course at a time. Currently focused on
science.

## How it works

- **The tree of knowledge is pre-generated** — a hand-curated science taxonomy lives in
  [`lib/tree.ts`](lib/tree.ts). Each subject has a parent, children, and cross-disciplinary
  *related fields*.
- **Courses are generated on demand** — when someone opens a leaf subject for the first time,
  Claude (Opus 4.7) writes a Quantic-MBA-style course: ~1000 words of explanatory text plus a
  5-question multiple-choice quiz at the end. The course is stored in a Postgres database, so every
  later visitor reads the cached version.
- **Certificates** are awarded per field for scoring 4/5 or better on the quiz.
- **Search** lives at `/all` — full-text filter across every subject in the tree.

## Stack

- Next.js 15 (App Router) + TypeScript
- Tailwind CSS
- **Vercel Postgres** (`@vercel/postgres`) for course / certificate storage
- Anthropic SDK with Claude Opus 4.7 (adaptive thinking + structured output) for course generation

## Deploy to Vercel

```bash
npm install -g vercel        # or use: npx vercel
vercel login
vercel link                  # link this directory to a new (or existing) Vercel project
```

Provision the database **from the Vercel dashboard**:

1. Project → **Storage** → **Create Database** → **Postgres** (Neon-backed). Vercel automatically
   injects `POSTGRES_URL` (and friends) into the project's env vars.

Add the Anthropic key:

```bash
vercel env add ANTHROPIC_API_KEY   # paste your key; pick "Production, Preview, Development"
```

Pull the env vars locally and deploy:

```bash
vercel env pull .env.local   # writes POSTGRES_URL + ANTHROPIC_API_KEY to .env.local
npm install
npm run dev                  # local dev hits the cloud Postgres
vercel --prod                # ship to production
```

Schema tables (`courses`, `certificates`) are created automatically the first time the app touches
the database — no manual migration step.

## Local-only run (no Vercel)

Works too — just point `POSTGRES_URL` at any Postgres instance (local Docker, Supabase free tier,
Neon, etc.) in `.env.local` and set `ANTHROPIC_API_KEY`. Then `npm install && npm run dev`.

## Layout

| Path | What it does |
| --- | --- |
| `app/page.tsx` | Tree browser (root + top-level branches, with certificate progress per branch) |
| `app/subject/[id]/page.tsx` | Subject detail — children, related fields, course launcher |
| `app/course/[id]/page.tsx` | Course view: text + MCQ + grading + retake |
| `app/all/page.tsx` + `client.tsx` | Searchable index of every subject |
| `app/certificates/page.tsx` | Earned certificates |
| `app/api/course/[id]/route.ts` | `GET` returns or generates the course; `POST` grades answers |
| `lib/tree.ts` | The pre-generated science knowledge tree |
| `lib/claude.ts` | Course generation prompt + Anthropic client |
| `lib/db.ts` | Postgres schema + access layer (`@vercel/postgres`) |

## Extending the tree

`lib/tree.ts` is just an array of `{id, name, blurb, parent, children, related}`. Add a new node,
list it under its parent's `children`, and it shows up immediately. Only leaf subjects (no children)
unlock courses.

## Notes

- No auth — certificates are global to the deployment. Adding per-user state means hooking up an
  auth provider and keying both tables by `user_id`.
- Course quality depends on the model. Tweak the prompt in [`lib/claude.ts`](lib/claude.ts) to taste.
- First-time generation for a given subject takes 30-60 seconds; every later visit is instant from
  the Postgres cache.
