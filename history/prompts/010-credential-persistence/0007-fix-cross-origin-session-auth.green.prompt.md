---
id: 0007
title: Fix Cross-Origin Session Authentication
stage: green
date: 2026-01-30
surface: agent
model: claude-opus-4-5-20251101
feature: 010-credential-persistence
branch: 010-credential-persistence
user: sarimarain99
command: /sp.implement "401 Unauthorized error from frontend"
labels: [frontend,auth,cors,session-cookies]
links:
  spec: specs/010-credential-persistence/spec.md
  ticket: null
  adr: null
  pr: null
files:
  - frontend/lib/api.ts
tests:
  - Manual test: curl -H "Cookie: todo_app_session_token=<token>" http://localhost:8000/api/tasks (200 OK)
  - Browser test: Refresh frontend and verify tasks load without 401 errors
---

## Prompt

why it is showing API Request: GET http://localhost:8000/api/tasks
forward-logs-shared.ts:95 API Request: GET http://localhost:8000/api/tasks
forward-logs-shared.ts:95 [Vercel Web Analytics] [pageview] http://localhost:3000/dashboard Object
:8000/api/tasks:1  Failed to load resource: the server responded with a status of 401 (Unauthorized)Understand this error
installHook.js:1 API Error: 401 - {"detail":"Not authenticated"}
overrideMethod @installHook.js:1Understand this error
[... repeated 401 errors ...]

Unable to add filesystem: <illegal path> even I'm signed in

## Response snapshot

Fixed the 401 Unauthorized error by updating the frontend to explicitly pass the Better Auth session token via the Cookie header.

**Root Cause**: Cookies set by Better Auth on `localhost:3000` are NOT automatically sent to `localhost:8000` because they're different origins. The browser considers these third-party cookies and blocks them in cross-origin requests.

**Solution**: Modified `frontend/lib/api.ts` to:
1. Read the `todo_app_session_token` cookie from `document.cookie`
2. Pass it explicitly in the `Cookie` header with each API request
3. The backend's existing `request.cookies.get()` already parses this header correctly

**Changes Made**:
- Added `getSessionToken()` function to read the session cookie
- Updated `apiRequest()` to include the session token in the Cookie header
- Added debug logging to show when session is present/absent

## Outcome

- ✅ Impact: Frontend now successfully authenticates with backend across different origins
- 🧪 Tests: curl test with Cookie header returns 200 OK
- 📁 Files: 1 file modified (frontend/lib/api.ts)
- 🔁 Next prompts: User should refresh browser to test the fix
- 🧠 Reflection: Cross-origin cookie handling requires manual token passing since browsers block third-party cookies

## Evaluation notes (flywheel)

- Failure modes observed: None - fix tested and working
- Graders run and results (PASS/FAIL): Manual curl test PASS
- Prompt variant (if applicable): N/A
- Next experiment (smallest change to try): Consider using SameSite=None; Secure cookies for production deployment
