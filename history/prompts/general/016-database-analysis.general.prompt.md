---
id: 016
title: Database Analysis Neon vs SQLite
stage: general
date: 2026-01-10
surface: agent
model: claude-opus-4-5-20251101
feature: none
branch: main
user: sarimarain99
command: /sp.analyze
labels: ["database","analysis","neon","sqlite"]
links:
  spec: null
  ticket: null
  adr: null
  pr: null
files:
  - backend/app/database.py
  - backend/app/models.py
  - backend/.env
  - backend/README.md
tests:
  - N/A (analysis only)
---

## Prompt

analyze the files and tell me have you used neon database to store the user and user's data?

## Response snapshot

**NO - Neon database is NOT currently being used.**

**Current Configuration:**
- Local: SQLite (`./todo.db`)
- HuggingFace Spaces: SQLite (ephemeral storage)

**Evidence:**
- `backend/.env:2`: `DATABASE_URL=sqlite:///./todo.db`
- `backend/app/database.py:17`: Falls back to SQLite if `DATABASE_URL` not set

**The Problem:**
HuggingFace Spaces uses ephemeral storage - the SQLite database gets reset on Space restart/redeployment, losing all user data and tasks.

**Code Support:**
The backend code (`backend/app/database.py`) DOES support PostgreSQL/Neon - it has connection string parsing for `postgresql://` URLs and uses `asyncpg` driver. But it's not configured.

**Planned vs Actual:**
`README.md:36` mentions "Phase III Solution: Migrate to Neon Serverless Postgres" - but this migration has NOT been completed.

**Recommendation:**
1. Create free Neon account at https://neon.tech
2. Get connection string: `postgresql://user:pass@ep-xxx.aws.neon.tech/neondb?sslmode=require`
3. Set `DATABASE_URL` environment variable in HuggingFace Spaces Settings

## Outcome

- ✅ Impact: Identified that production is using ephemeral SQLite instead of persistent Neon PostgreSQL. User data is lost on HuggingFace Space restarts.
- 🧪 Tests: N/A (analysis)
- 📁 Files: Reviewed backend/app/database.py, backend/.env, backend/README.md
- 🔁 Next prompts: User needs to decide whether to migrate to Neon for persistent storage
- 🧠 Reflection: The code was written to support both SQLite (dev) and PostgreSQL (production), but the production deployment never had the DATABASE_URL configured for Neon.

## Evaluation notes (flywheel)

- Failure modes observed: None
- Graders run and results (PASS/FAIL): N/A
- Prompt variant (if applicable): N/A
- Next experiment (smallest change to try): If user wants persistent storage, the fix is simple - just set DATABASE_URL environment variable in HuggingFace Spaces to point to Neon. No code changes required.
