---
id: 0006
title: Backend Session Cookie Authentication
stage: green
date: 2026-01-30
surface: agent
model: claude-opus-4-5-20251101
feature: 010-credential-persistence
branch: 010-credential-persistence
user: sarimarain99
command: /sp.implement "Would you like me to update the backend to validate Better Auth session cookies instead of JWT tokens? update it"
labels: [backend,auth,better-auth,session-cookies]
links:
  spec: specs/010-credential-persistence/spec.md
  ticket: null
  adr: null
  pr: null
files:
  - backend/app/auth.py
  - backend/app/main.py
  - backend/app/models.py
tests:
  - Manual test: curl -b "todo_app_session_token=<token>" http://localhost:8000/api/tasks (200 OK)
  - Manual test: curl -b "todo_app_session_token=<token>" http://localhost:8000/api/auth/me (returns user data)
---

## Prompt

Would you like me to update the backend to validate Better Auth session cookies instead of JWT tokens? update it

## Response snapshot

Updated the backend FastAPI application to validate Better Auth session cookies instead of JWT tokens. Key changes:

1. **backend/app/auth.py**: Complete rewrite of authentication module to:
   - Read `todo_app_session_token` cookie from requests
   - Validate session tokens against Better Auth PostgreSQL database
   - Use `asyncpg` connection pool for database queries
   - Return user information from validated sessions

2. **backend/app/models.py**: Updated User model to match Better Auth schema:
   - Changed column names from snake_case to camelCase (createdAt, updatedAt, emailVerified)
   - Removed password_hash field (not used by Better Auth)
   - Updated UserRead schema to use camelCase

3. **backend/app/main.py**: Added cleanup for Better Auth connection pool on shutdown

4. **Verified working**:
   - Backend successfully validates session cookies
   - Returns 200 OK for authenticated requests
   - Returns user data from `/api/auth/me` endpoint

## Outcome

- ✅ Impact: Backend now validates Better Auth session cookies instead of JWT tokens, enabling proper session-based authentication flow
- 🧪 Tests: Manual curl tests passing - 200 OK with valid session cookie, 401 without cookie
- 📁 Files: 3 files modified (auth.py, main.py, models.py)
- 🔁 Next prompts: Test full frontend-to-backend authentication flow
- 🧠 Reflection: Better Auth uses camelCase column names which required model updates. Session cookie name format is `{prefix}_session_token`

## Evaluation notes (flywheel)

- Failure modes observed: None - authentication working correctly
- Graders run and results (PASS/FAIL): Manual tests PASS
- Prompt variant (if applicable): N/A
- Next experiment (smallest change to try): Test with real browser session to ensure cookies are sent correctly
