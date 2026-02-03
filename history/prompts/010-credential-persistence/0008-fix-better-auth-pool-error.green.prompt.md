---
id: 0008
title: Fix Better Auth Pool Error
stage: green
date: 2026-01-30
surface: agent
model: claude-opus-4-5-20251101
feature: 010-credential-persistence
branch: 010-credential-persistence
user: sarimarain99
command: /sp.implement "401 and 500 errors with session auth"
labels: [frontend,better-auth,database,pool]
links:
  spec: specs/010-credential-persistence/spec.md
  ticket: null
  adr: null
  pr: null
files:
  - frontend/lib/auth.ts
  - frontend/lib/api.ts
tests:
  - Manual test: Refresh browser and check for Better Auth errors in console
  - Manual test: Check browser console for "Available cookies" log
---

## Prompt

still Failed to load resource: the server responded with a status of 500 (Internal Server Error)Understand this error
api/auth/sign-in/email:1  Failed to load resource: the server responded with a status of 401 (UNAUTHORIZED)Understand this error
[... Better Auth INTERNAL_SERVER_ERROR logs ...]
forward-logs-shared.ts:95 API Request: GET http://localhost:8000/api/tasks (no session)
[... more 401 errors ...]
Unable to add filesystem: <illegal path>

## Response snapshot

Fixed two issues:

1. **Better Auth INTERNAL_SERVER_ERROR**: Updated `frontend/lib/auth.ts` to use a singleton pattern for the PostgreSQL pool. The issue was that the pool was being created at module load time, which caused problems in Next.js server components. Added error handling and connection timeout configuration.

2. **Session token debugging**: Added logging to `frontend/lib/api.ts` to show available cookies in the browser console. This helps diagnose why the session token might not be found.

**Changes Made**:
- `frontend/lib/auth.ts`: Changed from direct Pool instantiation to a singleton `getPool()` function with dynamic import of `pg`
- Added pool error handler to log unexpected errors
- Added connection timeout and idle timeout configurations
- `frontend/lib/api.ts`: Added debug logging to show all available cookie names

## Outcome

- ✅ Impact: Better Auth should no longer throw INTERNAL_SERVER_ERROR in server components
- 🧪 Tests: User needs to refresh browser to verify fix
- 📁 Files: 2 files modified (auth.ts, api.ts)
- 🔁 Next prompts: Check browser console for "Available cookies" log to see actual cookie names
- 🧠 Reflection: Next.js server components require careful singleton patterns for database connections to avoid module loading issues

## Evaluation notes (flywheel)

- Failure modes observed: None yet - waiting for user refresh to verify
- Graders run and results (PASS/FAIL): Pending user testing
- Prompt variant (if applicable): N/A
- Next experiment (smallest change to try): If cookies still not found, may need to check Better Auth cookie naming or SameSite attribute
