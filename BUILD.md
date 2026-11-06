# Build / Change Log

## Backend / Auth

2026-11-07 — backend/auth engineer (subagent). Scope: auth fixes, task CRUD
without Hugging Face, AI-chat decision, .db untracking, build check.
Do not push — the coordinator owns the push. No history rewritten.

### FastAPI backend: DEAD (verified live, not assumed)
- `curl https://sarimarain-zenith-mind.hf.space/health` → **503 "Your space is in error, check its status on hf.co"**.
- The live site's own proxy confirms it: `curl https://zenith-flow-zeta.vercel.app/api/proxy/health` → same 503 with the same HF error body. So Vercel's `NEXT_PUBLIC_API_URL` points at that HF Space, and every task/chat call through it fails. That is the 4/4 "Failed to create task" from the audit.
- Consequence: task CRUD was reimplemented as same-origin Next.js routes (below). The FastAPI backend is not used for tasks any more. Its CORS was still fixed (see below) so it works if/when it is redeployed.

### 1. Auth — `frontend/lib/auth.ts`
- `trustedOrigins` now: `http://localhost:3000`, `https://zenith-flow-zeta.vercel.app` (the live domain — a previous merge had dropped it), `https://zenith-flow-beta.vercel.app`, plus wildcard `https://*.vercel.app` for preview deploys. Wildcard verified in the installed better-auth 1.4.15 (`node_modules/better-auth/dist/auth/trusted-origins.mjs`: entries containing `*` are matched with `wildcardMatch`). Extra origins can be added via `BETTER_AUTH_TRUSTED_ORIGINS` (comma-separated).
- `sendResetPassword` now destructures `{ user, url }` (was `{ user, email }`, so the template's `${url}` was undefined and every reset email was broken). Rate limit now uses `user.email`.
- Dummy fallback secret removed. `getSecret()` throws at startup when `BETTER_AUTH_SECRET` is unset — no publicly known secret is ever used to sign sessions. One carve-out: during `next build` bundling only (`NEXT_PHASE=phase-production-build`) a placeholder is returned so the build can run without a secret present; any real request at runtime still throws. Local dev: set a real secret in `frontend/.env.local` (gitignored, never commit one).
- Pool is now typed and exported via `getDbPool()` so the task routes reuse the same pool/DB as auth.

### 2. Auth client — `frontend/lib/auth-client.ts`, sign-in / sign-up pages
- `forgotPassword()` now POSTs `/api/auth/request-password-reset` (was `/forgot-password` — 404). Correction to the audit: the audit said Better Auth's endpoint is `/forget-password`, but the installed better-auth 1.4.15 has no such route — verified in `node_modules/better-auth/dist/api/routes/password.mjs` and live (both `/forgot-password` and `/forget-password` return 404; `/request-password-reset` returns 200). The emailed reset link is `{baseURL}/reset-password/{token}`, matching the existing `/reset-password/[token]` page.
- `resetPassword()` now POSTs `/api/auth/reset-password` with `{ token, newPassword }` in the body (was `/reset-password/${token}` — 404).
- Both now parse error bodies safely: non-JSON error bodies (e.g. an HTML 502/503 from a proxy) return the real status/message instead of throwing a misleading "Network error". Only a genuine fetch failure is reported as a network error.
- New `toPlainEnglishAuthError()` maps common Better Auth failures (wrong password, unknown email, duplicate email, unverified email, short password, rate limit) to plain English; otherwise the raw message is shown. Sign-in and sign-up pages use it and read `result.error` instead of showing a generic code.
- Sign-in success check: installed better-auth 1.4.15 returns `{ user, token }` from `signIn.email` — `token` is the DB session token, NOT a JWT (JWT plugin is disabled), and no `session` object is returned by this client version (verified in `node_modules/better-auth/dist/api/routes/sign-in.mjs`). Success is `result.data?.user || result.data?.token`. (The audit's suggested `result.data?.session` does not exist in this version's client type and would not compile.)
- Sign-in: email is trimmed; a "Forgot password?" link to `/forgot-password` was added (none existed).
- Sign-up: name/email trimmed; password >= 8 chars validated client-side before the round-trip; redirect to `/dashboard` happens ONLY when a session actually exists. Installed 1.4.15 returns `{ token: string | null, user }` from sign-up — `token` is null when email verification is required, in which case the page now shows an on-page "check your email to verify" notice with a sign-in link instead of redirecting (which used to bounce back to sign-in looking like a login failure).

### 3. Tasks WITHOUT Hugging Face — new same-origin API
- New `frontend/lib/db.ts`: shared pool accessor + `ensureTasksTable()` + row→response mapper. `tasks` table (created `IF NOT EXISTS` on first use, in the SAME Neon Postgres DB as the auth tables):
  `id SERIAL PK, user_id TEXT, title TEXT, description TEXT, context TEXT, priority low|medium|high DEFAULT medium, tags TEXT[] DEFAULT '{}', due_date TIMESTAMPTZ, recurrence_rule TEXT, reminder_at TIMESTAMPTZ, completed BOOLEAN DEFAULT false, created_at / updated_at TIMESTAMPTZ DEFAULT now()` + indexes on `(user_id)` and `(user_id, created_at DESC)`.
- New `frontend/lib/server-auth.ts`: `getSessionUser(request)` — same `auth.api.getSession` + cookie check the protected layout uses. All task routes 401 without a valid session and scope every query to that user (another user's task reads as 404).
- New routes (all `ƒ` dynamic, nodejs runtime):
  - `GET /api/tasks` — list, same query params as the old backend: `completed, priority, search, sort_by (created_at|due_date|priority|title), sort_order (asc|desc), filter_start, filter_end, preset_filter (today|this_week|this_month)`. Date filters mirror the old FastAPI service (on `created_at`, UTC day boundaries). → `200 { tasks: Task[], total: number }`
  - `POST /api/tasks` — `{ title (required, trimmed), description?, context?, priority?, tags?, due_date?, recurrence_rule?, reminder_at?, completed? }` → `201 Task`
  - `GET /api/tasks/:id` → `200 Task` / 404
  - `PUT /api/tasks/:id`, `PATCH /api/tasks/:id` — update only the fields present in the body (explicit `null` clears a field); invalid values → 400 with a plain message → `200 Task`
  - `DELETE /api/tasks/:id` → `200 { ok: true }` (not 204 — callers read `.ok`)
  - `POST /api/tasks/:id/complete`, `POST /api/tasks/:id/uncomplete` → `200 Task`
  - Response shape is the same snake_case `Task` the FastAPI backend returned (`id, user_id, parent_task_id: null, title, description, context, completed, priority, tags, due_date, recurrence_rule, reminder_at, created_at, updated_at`), so the UI components work unchanged.
  - Errors are honest JSON: 401 not signed in, 400 validation, 404 not found, 503 when `DATABASE_URL` is not configured / DB unreachable, 500 otherwise.
- `frontend/lib/api.ts`: `tasksApi` (list/get/create/put/update/delete/complete/uncomplete — same names/signatures) now calls the same-origin `/api/tasks` handlers via a new `sameOriginRequest()` helper instead of `/api/proxy`. `notificationsApi` still uses the proxy (still needs the backend — see limitations). `healthApi.check()` now calls the new `GET /api/health` instead of the backend directly from the browser (that direct call failed CORS in production).
- New `GET /api/health`: honest status — `{ status: ok|degraded, database, tasks, auth, backend: "unavailable", backendUrl, chat: "unavailable", chatReason, timestamp }`. It checks the Postgres pool live; the backend is reported unavailable without probing it on every call (it is down; a probe would add seconds).
- Known limitation: recurring-task expansion was NOT reimplemented — `recurrence_rule` is stored and returned, but completing a recurring task completes that instance only (the old backend expanded recurrences). Reminders/scheduling (APScheduler) also remain backend-only and do not run while the backend is down.
- `frontend/app/api/proxy/[...path]/route.ts`: KEPT, unchanged — still needed by `notificationsApi`. No longer used by tasks or chat.

### 4. AI chat: REMOVED (entry points deleted)
- Why: chat needs the FastAPI backend (`POST /api/chat`, conversations) + `OPENAI_API_KEY` (required by `backend/app/services/agent_service.py` and listed as a required var in `backend/app/main.py`; Qdrant is optional — the conversation service fails silently without it — but OpenAI is not). The backend is down (503, verified above), so every chat call fails and history cannot persist anywhere. The page also claimed "Core Status: Active" while disconnected.
- Removed: `frontend/app/(protected)/chat/page.tsx` (whole route), `frontend/components/floating-chat-button.tsx` (and its use in `dashboard-shell.tsx`), `frontend/components/chat.tsx`, `frontend/components/conversation-list.tsx`, `frontend/lib/api/chat.ts`. No remaining reference to `/chat`, `chatApi` or `FloatingChatButton` in `frontend/app|components|hooks|lib`. Chat history persistence was backend-side (Neon + Qdrant), so nothing local was lost — there was no working history to preserve.
- To restore chat later: redeploy the FastAPI backend somewhere healthy, set `OPENAI_API_KEY` (+ `NEXT_PUBLIC_API_URL`) in Vercel, then re-add the `/chat` route and floating button from git history.

### 5. Security — committed .db files
- Untracked from git ONLY (`git rm --cached`, staged, not pushed): `backend/test.db`, `backend/todo.db`, `frontend/todo-app.db`, `frontend/todo-app.db-shm`, `frontend/todo-app.db-wal`, `frontend/todo.db`, `test.db`, `todo.db`. Files still exist on disk (local dev DBs untouched). No history rewritten, no force-push (per instructions).
- Added `*.db`, `*.db-shm`, `*.db-wal`, `*.sqlite`, `*.sqlite3` to the ROOT `.gitignore` and `frontend/.gitignore` (`backend/.gitignore` already had `*.db`).
- STILL REQUIRED (owner/coordinator action, not done here): purge the .db files from git HISTORY (they contain a real password hash + session tokens), reset the affected user's password, and revoke those sessions. Untracking alone does not remove them from history. No hash/token/secret value is reproduced anywhere in this log or in the report.

### 6. Backend CORS — `backend/app/main.py`
- Added `https://zenith-flow-zeta.vercel.app` to `allowed_origins` (was only in `FRONTEND_URL` env, default localhost) and added `PUT` to `allow_methods` (tasksApi.put uses PUT). Only matters if/when the backend is redeployed; the live backend is currently down.

### Live runtime test (local Postgres) — PASSED 2026-11-07
- Local PostgreSQL via `pgserver` (apt mirrors were unreachable from this sandbox; no repo files involved). Better Auth tables applied from `frontend/better-auth_migrations/`; dev server run with a local `DATABASE_URL` + generated `BETTER_AUTH_SECRET` in gitignored `frontend/.env.local` (removed after testing).
- `GET /api/health` → 200 `{status:"ok", database:"ok", tasks:"ok", auth:"ok", backend:"unavailable", chat:"unavailable"}`.
- Sign-up → 200 `{token, user}` (confirms the sign-up page's token check); wrong-password sign-in → 401 `INVALID_EMAIL_OR_PASSWORD`; correct sign-in → 200; session persists across calls (`/api/auth/get-session` 200).
- Tasks (all as the signed-in user): create → 201 (x2, incl. tags/due date), list → `{tasks:[...], total:2}`, `priority=high` → 1, `search=milk` → 1, `preset_filter=today` → 2, `sort_by=priority` → 200, get one → 200, PATCH title+priority → 200 (updated_at bumped), PUT with bad priority → 400, complete → 200 `completed:true`, `completed=true` filter → 1, uncomplete → 200, delete → 200 `{ok:true}`, get deleted → 404, bad id → 400, empty title → 400, unauthenticated list → 401.
- Ownership: a second user gets 404 for the first user's task (GET and DELETE) and an empty list — no cross-user leak.
- Password reset end-to-end: `POST /api/auth/request-password-reset` → 200, verification token created in DB, `POST /api/auth/reset-password {token, newPassword}` → 200, sign-in with the new password → 200, old password → 401. The reset-email callback ran (`sendResetPassword` reached the Resend call) and failed only because `RESEND_API_KEY` is unset in this sandbox — the old undefined-`url` ReferenceError is gone. Actual email delivery still needs a real `RESEND_API_KEY` in Vercel (not verified here).
- FINDING (test env only, not a repo change): the stored migrations in `frontend/better-auth_migrations/` are stale for better-auth 1.4.15 — the 2026-01-08 migration creates `"user"."emailVerified"` as `integer` and `createdAt/updatedAt` as `date`, but 1.4.15 inserts boolean `false` (`invalid input syntax for type integer: "false"`, sign-up 422). The local test DB was fixed with `ALTER TABLE ... TYPE boolean/timestamptz`. The live Neon DB evidently already has a working schema (live sign-up works per the audit), but a FRESH database built from these migration files would break sign-up — the coordinator should regenerate migrations with the Better Auth CLI before any fresh-DB setup.

### Build check (final, after all edits)
- `npm install` run in `frontend/` (911 packages; lockfile updated better-auth 1.4.10 → 1.4.15 as installed).
- `npm run build` PASSES (exit 0). Two environment notes:
  - First attempt failed only on fetching Google Fonts (sandbox TLS); rerun with `NEXT_TURBOPACK_EXPERIMENTAL_USE_SYSTEM_TLS_CERTS=1` succeeded. No code change needed.
  - Build ran with no `.env.local` present: the `BETTER_AUTH_SECRET` build-phase carve-out (see §1) is what lets it bundle; runtime still fails hard without the secret.
- Build output route table confirms the new routes (`/api/tasks`, `/api/tasks/[id]`, `/api/tasks/[id]/complete`, `/api/tasks/[id]/uncomplete`, `/api/health`) and that `/chat` is gone.
- Type errors fixed during the build (all mine, all in new/edited code): nullable `requireTaskPool` return (explicit discriminated union), untyped `pool` (`PgPool | null`), `sendResetPassword` referencing the removed `email` variable, and the sign-in/sign-up success checks using the real 1.4.15 response shape (`{ user, token }`, no `session`).

## Frontend / UI-UX

2026-11-07 — frontend UI/UX redesign engineer (subagent). Scope: rename +
plain language, bug fixes, clean mobile-first redesign, honest README, build
check. Backend/auth work in the section above was NOT touched. Do not push —
the coordinator owns the push.

### Root cause found: semantic Tailwind utilities generated no CSS
- `frontend/app/globals.css` defined CSS variables (`--primary`,
  `--foreground`, …) but had NO `@theme` block, so Tailwind v4 never
  generated utilities like `bg-primary`, `text-foreground`, `border-border`,
  `bg-surface`. Verified in the previous build's CSS: zero matches for
  `.bg-primary` / `.text-foreground`. That is why buttons had no background
  and light-mode text was white-on-white.
- Fix: added `@theme inline` mapping every token to a Tailwind color
  (`--color-primary: var(--primary)`, etc., including input, state,
  priority and danger/warning/success/info tokens), so the utilities now
  exist and follow the `.dark` class at runtime. Verified in the new build
  output: `.bg-primary`, `.text-foreground`, `.bg-surface`,
  `.text-primary-foreground`, `.border-border`, `.bg-input-bg`, `.text-danger`,
  `.bg-state-error-bg`, `.bg-priority-high-bg` etc. all present.
- Token contrast was also fixed, not just wired up: the old light-mode
  primary was a bright green (oklch 78%) with white text; it is now
  oklch(45% 0.16 155) in light mode (white text) and oklch(76% 0.18 155)
  with dark text in dark mode. Light glass borders were white-on-white
  (`rgba(255,255,255,0.5)`); they are now a visible dark-tinted border.
  Removed the Google Fonts `@import` (the layout already loads the same
  fonts via `next/font`; the import also broke builds on flaky TLS).
- Removed the `.reveal-stage { visibility: hidden }` rule and the
  white-gradient `.text-glow` class; added a `prefers-reduced-motion`
  block that disables animation/transition durations and smooth scrolling.

### 1. Rename + plain language
- Product is "Todo Evolution" everywhere user-facing (landing, auth pages,
  dashboard header, metadata/OG/Twitter, README). Headline on the first
  screen: "Plan your day. Get things done." with the subline "Todo Evolution
  is a simple to-do list. Create tasks, set priorities and due dates, and
  filter them by today, this week, or this month".
- All labels are plain English: Sign up / Log in / Log out, Name / Email /
  Password, Tasks, Add task, Complete, Delete, Search tasks. Removed from
  all user-facing text: TERMINATE, Deploy Workspace, Initialize Node,
  Access Node, Objective, Subject, Node, KEY_PRIMARY, UPLINK_ADDRESS,
  "neural", "sovereign", "uplink", "cognitive", "momentum", "protocol",
  Zenith branding, "CORE STATUS", "v3.0", "Next.js 15" (it's 16.1.1),
  biometrics, "sub-second sync", "sovereign encryption", "private and
  local". Verified by grep over all rewritten files: zero matches (the only
  remaining "zenith" strings are the real deployed domain
  `zenith-flow-zeta.vercel.app` in metadata/OG URLs and two historic code
  comments). No invented testimonials, stats, users or screenshots; the
  landing page's task-list preview is a static HTML mock labelled
  "Example — what your list looks like".
- Footer (landing + dashboard) credits "Built by Muhammad Sarim" with real
  links to https://github.com/SarimArain99 and
  https://portfoliosarim.vercel.app. "Precision Systems" is gone.
- Toasts now say "Task created / updated / deleted / completed / marked as
  not done" (`frontend/lib/toast.ts`). Auth error handling from the backend
  pass (plain-English mapper, forgot/reset endpoints) was kept unchanged.

### 2. Bugs fixed
- (a) 8–10s blank entrance: ALL GSAP/Framer entrance animations that set
  opacity 0 / blur on page content were removed from the landing page,
  all four auth pages, dashboard shell/client, task form/list/item, edit
  dialog, confirm dialog, logout button and theme toggle. Pages are plain
  server-rendered HTML, visible immediately without JS (verified by
  curling the production server: headline, form labels and buttons are in
  the SSR HTML). `prefers-reduced-motion` is respected (see globals.css).
  Framer Motion remains a dependency and is still used by the shadcn
  `Input` glow and `Button` press scale only — neither hides content.
- (b) Light theme contrast: fixed by the `@theme` + token work above.
  Contrast ratios computed (OKLCH → sRGB, WCAG formula) — light: body
  text 17.08:1, muted text 7.31:1, white on primary button 6.55:1, primary
  text on white 6.55:1, danger 7.23:1, priority medium 8.49:1, priority
  high 8.03:1, input text 18.08:1 (all AA ≥ 4.5:1; placeholder 4.27:1,
  placeholder-only). Dark: body 17.11:1, muted 8.34:1, dark text on
  primary button 9.60:1, primary text on surface 8.74:1, danger 6.25:1.
  Default theme is now light (`defaultTheme="light"` in
  `app/layout.tsx`); dark and system remain available via the toggle.
- (c) Show-password toggle: new shared `PasswordField` in
  `components/auth-shell.tsx` — button labelled "Show password" /
  "Hide password" (aria-label + aria-pressed) that toggles the input
  between `type="password"` and `type="text"`. Used on sign-in, sign-up
  (both password fields) and reset-password (both fields). The dead
  `Bypass_Init` button is gone. Verified by a temporary jest test
  (2 tests passed, then removed): click → type becomes `text`, label
  becomes "Hide password", click again → back to `password`.
- (d) Floating chat button was already deleted; confirmed no fixed-position
  element remains in the rewritten UI (the only `fixed` uses are the
  edit/confirm dialogs, rendered only when open, and an unused shadcn
  `ui/dialog.tsx`). Nothing covers the footer.
- (e) Footer items are real links (GitHub, portfolio) or removed — no dead
  text links remain on landing or dashboard.
- (f) ONE empty state: `components/empty-state.tsx` now renders the same
  copy in both cases — title "No tasks to show", message "There are no
  tasks here yet. Add a task to get started, or clear your search and
  filters to see more." Only the actions differ: "Add your first task"
  (scrolls to and focuses the add-task form) when the list is truly empty,
  "Clear filters" when filters/search are active. The second, different
  empty state ("Workspace Synchronized / No pending objectives…") is gone.
- (g) Slanted grey bar / overlapping decoration removed: the add-task form
  is now always visible (no collapsed trigger button), the gradient top
  bars, rotated-Plus dropdown chevrons and `decoration-line` bars are
  gone; selects use a normal ChevronDown icon.

### 3. Design / layout
- Clean, mobile-first, single-column dashboard (max-w-5xl): sticky header
  (logo, Tasks nav, user name, theme toggle, Log out), "Your tasks"
  heading, always-visible add-task form, search/status/priority row,
  date-filter presets (All / Today / This week / This month) + sort row,
  visible task count ("N tasks · M completed", aria-live), task list.
- Task list supports add, edit (dialog + inline title edit), complete /
  mark-as-not-done toggle, delete with confirm dialog, priority, due date
  (with "overdue" label), search, filters, sort, tags, and repeat
  (stored `recurrence_rule`; the form notes completing a repeating task
  completes that task only). The reminder field was REMOVED from the form
  — nothing sends reminders, so no UI implies otherwise.
- Removed the false "Efficiency Metric / Core Synchronized / OS_v3.0.1"
  insight card from the dashboard and the "Global Sync Enabled /
  Sub-second Response" claims.
- Mobile: controls stack vertically below `lg`/`sm` breakpoints; the logo
  wordmark hides below `sm` in headers (icon only) so the dashboard header
  fits a 360px screen; tap targets are ≥ 44px on primary actions.
  Verified by class inspection and served-HTML checks (no live-browser
  render was available to this subagent — see limitations).

### Notifications + chat removal
- Deleted `components/notification-bell.tsx`,
  `components/notification-dropdown.tsx` and the orphaned
  `components/chat-input.tsx` (unused since chat was removed). Removed
  their use from `dashboard-shell.tsx`. No bell, dropdown, chat button,
  link or status indicator remains in the UI. `notificationsApi` in
  `lib/api.ts` is still present but unused (it still points at the dead
  proxy backend); deleting the API client was out of scope. No reference
  to `/chat`, `chatApi` or `FloatingChatButton` remains in app/components.

### 4. README
- Rewrote root `README.md` honestly: what the app does today (auth,
  task CRUD, priorities/due dates/tags/repeat, search/filters/sort,
  themes), the real stack (Next.js 16.1.1, Better Auth 1.4, Neon
  Postgres, Tailwind 4), how to run locally with the env vars
  (`DATABASE_URL`, `BETTER_AUTH_SECRET` required; `RESEND_API_KEY`
  optional; `BETTER_AUTH_URL`, `BETTER_AUTH_TRUSTED_ORIGINS` optional),
  and a Planned section (AI chat, reminders/notifications, recurring
  expansion) explicitly marked as not shipped. Removed the "cloud-native
  AI chatbot deployed on Kubernetes" claim, the JWT claim, the SQLite
  persistence note, and the Hugging Face backend as the live backend
  (noted as unused/kept in `backend/`).

### Files changed (frontend unless noted)
- Rewritten: `app/globals.css`, `app/layout.tsx`, `app/page.tsx`,
  `app/(auth)/sign-in/page.tsx`, `app/(auth)/sign-up/page.tsx`,
  `app/(auth)/forgot-password/page.tsx`,
  `app/(auth)/reset-password/[token]/page.tsx`,
  `app/(protected)/dashboard/dashboard-shell.tsx`,
  `app/(protected)/dashboard/dashboard-client.tsx`,
  `components/task-form.tsx`, `components/task-list.tsx`,
  `components/task-item.tsx`, `components/task-edit-dialog.tsx`,
  `components/empty-state.tsx`, `components/confirm-dialog.tsx`,
  `components/task-skeleton.tsx`, `components/logout-button.tsx`,
  `components/theme-toggle.tsx`, `components/auth-shell.tsx` (new,
  shared logo/auth card/password field/error + notice boxes),
  `README.md` (root).
- Edited: `components/task-filter-controls.tsx` ("All Tasks" → "All"),
  `components/task-sort-controls.tsx` (select `id="sort-by"` to match its
  label), `lib/toast.ts` (Task wording).
- Deleted: `components/notification-bell.tsx`,
  `components/notification-dropdown.tsx`, `components/chat-input.tsx`.
- Untouched by design: `lib/auth.ts`, `lib/auth-client.ts`,
  `lib/api.ts` (tasksApi), `lib/db.ts`, `lib/server-auth.ts`,
  `app/api/tasks/**`, `app/api/health`, backend code.

### Build check — PASSES
- `npm run build` in `frontend/` (with
  `NEXT_TURBOPACK_EXPERIMENTAL_USE_SYSTEM_TLS_CERTS=1`, same env note as
  the backend pass — the sandbox TLS fetch for Google Fonts) exits 0.
  Route table confirms `/chat` is gone and `/api/tasks*`, `/api/health`
  remain. No new dependencies were added.
- Temporary jest smoke test (`__tests__/redesign-smoke.test.tsx`, 2
  tests: empty-state copy/actions, show-password toggle) passed and was
  removed afterwards.
- Production server smoke test (`next start`, no env vars): `/`, `/sign-in`,
  `/sign-up`, `/forgot-password` all serve correct SSR content with the
  new copy; the jargon scan of served HTML matches only the real domain
  `zenith-flow-zeta.vercel.app` in OG URLs.

### Limitations / NOT verified here
- Logged-in dashboard render and task CRUD end-to-end were NOT re-tested
  in this pass: the sandbox has no Postgres (the backend pass's local
  `pgserver` setup is no longer present) and no `DATABASE_URL` /
  `BETTER_AUTH_SECRET`, so `/dashboard` returns 500 with the intentional
  "BETTER_AUTH_SECRET environment variable is required" error from
  `lib/auth.ts` — pre-existing behaviour, not caused by these changes.
  The dashboard shell/client compile (build passes) and the task
  components are unchanged in their API usage (`tasksApi` calls, props),
  but a live signed-in check on desktop + mobile still needs to happen
  after deploy (or with a real DB) before calling the dashboard done.
- No live-browser render was available to this subagent, so mobile layout
  and light/dark rendering were verified by class/token inspection,
  computed contrast ratios, built-CSS checks and SSR HTML — not by
  screenshots. A visual pass on a real device/browser is still worth
  doing after deploy.
- `components/motion/*` (unused page-transition helpers, one comment
  mentions "AI Chat") and `components/ui/emoji-picker.tsx` (unused) were
  left in place; they render nothing. `lib/theme.ts` still exports an
  unused `zenithColors` constant. Cosmetic only.

## Coordinator / push & live verify
- Fixed Zenith branding in auth emails (frontend/lib/auth.ts): "Reset Your Todo Evolution Password", "Welcome to Todo Evolution!", "© 2026 Todo Evolution". Sender fallback noreply@zenith-flow.com kept deliberately (presumed Resend-verified domain; overridable via RESEND_FROM_EMAIL).
- Staged all deletions (git add -A); rebuilt frontend — npm run build exit 0.
- Snapshot push: 405 files, commit af307f8ea73de9f0b27da9b26081832d700cfb6f (remote head verified 4536a47 first, no drift). 16 deletions via delete_file. Final HEAD 126964c313e6b54201f243d9133fa52333cfadf3.
- Live verify (curl): / 200 with new headline, 0 jargon; /sign-in, /sign-up, /forgot-password 200; /chat 404; /api/health 200 database/tasks/auth ok, backend/chat unavailable; /dashboard logged out 307 to /sign-in.
- Still needs a live browser dummy-account pass on the live domain (subagents cannot run one).

## Fix 2026-11-07 — live /api/tasks 500s (tasks fix)

Live browser QA found the rebuilt app's task flow broken on the live domain
(sign-up/login fine, but GET/POST /api/tasks → 500 every time), while the
same production build passed the full dummy flow locally against Postgres 16.
Diagnosis: /api/health only ran SELECT 1, so it reported tasks "ok" while
every tasks query failed; the pool/auth worked live, so the failure was in
the tasks storage layer itself (Vercel runtime logs + env vars are not
readable via the connector — 403, team scope re-auth needed).
Fix (frontend/lib/db.ts, app/api/health/route.ts, app/api/tasks/[id]/route.ts):
- ensureTasksTable now runs one statement per query instead of a single
  multi-statement string (fragile behind the Neon PgBouncer pooler), and
  heals a pre-existing `tasks` table with the wrong shape: ADD COLUMN IF
  NOT EXISTS for every expected column, and a mistyped `tags` column is
  preserved as `tags_legacy` and replaced with a proper TEXT[] column.
- /api/health now probes the table for real (ensure + SELECT 1 FROM tasks)
  and reports only the Postgres SQLSTATE code on failure — no more false ok.
- /api/tasks/[id] GET/DELETE now return plain-English JSON 500s instead of
  unhandled empty 500s.
Verified locally (production build, Postgres 16, legacy table with no
`context` and tags as TEXT): healing ran, full flow passed (sign-up, list,
create with tags/due date, get, patch, complete, delete, ownership 404s).
Live re-verification (health + signed-in curl flow) still required after deploy.
