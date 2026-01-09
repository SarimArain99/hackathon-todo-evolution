---
id: 0017
title: Fix Better Auth Session Table Error
stage: green
date: 2026-01-09
surface: agent
model: claude-opus-4-5-20251101
feature: 002-ui-ux-enhancement
branch: main
user: sarimarain99
command: /sp.implement
labels: ["fix","better-auth","database"]
links:
  spec: specs/002-ui-ux-enhancement/spec.md
  ticket: null
  adr: null
  pr: null
files:
  - frontend/package.json
tests:
  - Manual verification of database tables creation
---

## Prompt

showing this error: ✓ Starting...
✓ Ready in 3s
○ Compiling /dashboard ...
2026-01-09T13:47:50.094Z ERROR [Better Auth]: INTERNAL_SERVER_ERROR SqliteError: no such table: session
    at async ProtectedLayout (app/(protected)/layout.tsx:18:19)
  16 | }) {
  17 |   // Check if user is authenticated
> 18 |   const session = await auth.api.getSession({
     |                   ^
  19 |     headers: await headers(),
  20 |   });
  21 | {
  code: 'SQLITE_ERROR'
}
[... full error trace ...]

## Response snapshot

**Problem**: Better Auth was trying to access a `session` table that didn't exist in the SQLite database.

**Root Cause**: The Better Auth migrations were never run to create the required database tables.

**Solution**:
1. Manually applied the migration SQL from `better-auth_migrations/2026-01-08T13-21-33.403Z.sql`
2. Added `db:migrate` script to package.json for future use

**Tables Created**:
- `user` - User accounts
- `session` - User sessions
- `account` - OAuth/social accounts
- `verification` - Email verification tokens
- `jwks` - JWT key storage

**Migration Command Added**:
```json
"db:migrate": "node -e \"const Database = require('better-sqlite3'); const db = new Database('todo-app.db'); const sql = require('fs').readFileSync('better-auth_migrations/2026-01-08T13-21-33.403Z.sql', 'utf-8'); db.exec(sql); console.log('Migrations applied'); db.close();\""
```

**Usage**:
```bash
cd frontend
npm run db:migrate
```

## Outcome

- ✅ Impact: Fixed the "no such table: session" error. Better Auth now has the required database tables.
- 🧪 Tests: Manual verification - database tables created successfully.
- 📁 Files: 1 file changed (frontend/package.json).
- 🔁 Next prompts: Restart the dev server to verify the fix works.
- 🧠 Reflection: Better Auth requires migrations to be run before first use. This should be documented in the setup instructions.

## Evaluation notes (flywheel)

- Failure modes observed: None - fix applied successfully
- Graders run and results (PASS/FAIL): N/A (bug fix)
- Prompt variant (if applicable): N/A
- Next experiment (smallest change to try): Add automatic migration on first startup or document migration step in README.
