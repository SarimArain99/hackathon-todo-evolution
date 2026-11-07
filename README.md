# Dayline

A simple to-do list web app. Create an account, add tasks, set priorities
and due dates, and filter your list by today, this week, or this month.

Built by [Muhammad Sarim](https://github.com/SarimArain99).

Live site: https://zenith-flow-zeta.vercel.app

## What it does today

- Email/password sign-up, log-in, log-out, and password reset (Better Auth,
  session cookies stored in Postgres).
- Tasks: create, edit, complete / mark as not done, and delete (with a
  confirmation step).
- Each task can have a description, priority (low / medium / high), tags, a
  due date, and an optional repeat rule (daily / weekly / monthly / yearly).
  Completing a repeating task completes that task only — new copies are not
  created yet.
- Search tasks by title or description; filter by status (all / not done /
  completed), priority, and date (all / today / this week / this month);
  sort by due date, priority, date created, or title.
- Light and dark themes.

## What it does not do (yet)

- **AI chat is not included.** It was removed because it depended on a
  FastAPI backend that is currently down.
- **Reminders and notifications are not included.** Tasks can store a
  reminder time, but nothing sends reminders today.
- There is no offline mode, no sharing, and no mobile app.

## Tech stack

- **Frontend:** Next.js 16.1.1 (App Router), React 19, TypeScript,
  Tailwind CSS 4, shadcn/ui + Radix.
- **Auth:** Better Auth 1.4 (email + password, database sessions).
- **Database:** Neon Postgres — the same database holds the auth tables and
  the `tasks` table.
- **Task API:** same-origin Next.js routes under `/api/tasks` (see
  `frontend/app/api/tasks/`). No separate backend is needed for tasks.
- **Email:** Resend (password reset emails only).

The `backend/` directory still contains the original FastAPI app (tasks,
chat, reminders, notifications), but it is **not used by the deployed
frontend** and is currently down. It is kept in the repo for a possible
future redeploy.

## Running it locally

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:3000.

### Environment variables

Create `frontend/.env.local` (never commit it):

| Variable | Required | What it is |
| --- | --- | --- |
| `DATABASE_URL` | Yes | Postgres connection string (Neon). Auth tables and the `tasks` table live here. |
| `BETTER_AUTH_SECRET` | Yes | Random secret used to sign sessions. The app refuses to start without one. |
| `RESEND_API_KEY` | No | Needed only to actually send password-reset emails. Without it, reset requests fail at the email step. |
| `BETTER_AUTH_URL` | No | Public base URL of the app (defaults to `http://localhost:3000` locally). |
| `BETTER_AUTH_TRUSTED_ORIGINS` | No | Extra comma-separated origins allowed for auth, in addition to localhost and the Vercel domains. |

To build for production:

```bash
cd frontend
npm run build
npm run start
```

## Project structure

```text
.
├── frontend/               # Next.js 16 app (the whole product today)
│   ├── app/                # Pages: landing, auth, dashboard, /api/tasks, /api/health
│   ├── components/         # UI components (task list, task form, dialogs)
│   └── lib/                # Auth client, task API client, DB access
├── backend/                # FastAPI app (not used by the deployed frontend)
└── BUILD.md                # Change log for the rebuild
```

## Planned

- AI chat assistant (needs the backend redeployed with an OpenAI key).
- Working reminders and notifications.
- Recurring-task expansion (creating the next copy when one is completed).
