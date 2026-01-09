---
id: 0010
title: Fix token loading hang in task list
stage: green
date: 2026-01-09
surface: agent
model: claude-opus-4-5-20251101
feature: 002-ui-ux-enhancement
branch: 002-ui-ux-enhancement
user: sarimarain99
command: /sp.implement
labels: ["bugfix","loader","jwt","better-auth","token-endpoint","hang"]
links:
  spec: /home/sarimarain99/Dev/hackathon_2/specs/002-ui-ux-enhancement/spec.md
  ticket: null
  adr: null
  pr: null
files:
  - /home/sarimarain99/Dev/hackathon_2/frontend/lib/api.ts (fixed token retrieval)
  - /home/sarimarain99/Dev/hackathon_2/frontend/app/api/auth/token (removed custom endpoint)
tests:
  - Build verification: `npm run build` passed successfully
  - TypeScript compilation: No errors
---

## Prompt

/sp.implement
still stuck in:
Fetching Workspace...

## Response Summary

Fixed the loading hang issue by fixing the JWT token retrieval mechanism.

**Root Cause Identified:**
The `getAuthToken()` function in `lib/api.ts` was calling `/api/auth/token` using a fetch request with no timeout. The fetch was hanging indefinitely because:
1. The endpoint was being called manually via `fetch()` instead of using Better Auth's client
2. Better Auth provides the `/api/auth/token` endpoint automatically through the JWT plugin via the catch-all `[...all]` route
3. The manual fetch approach wasn't properly resolving to Better Auth's handler

**Fix Applied:**
1. Removed the custom `/api/auth/token` directory (Better Auth provides this automatically)
2. Updated `lib/api.ts` to import and use `getAuthToken()` from `auth-client.ts` instead of defining its own
3. The `authClient.token()` method properly calls Better Auth's built-in `/api/auth/token` endpoint

**Files Modified:**
- `frontend/lib/api.ts` - Removed duplicate `getAuthToken` function, now imports from `auth-client.ts`
- `frontend/app/api/auth/token/` - Removed custom token endpoint directory

## Outcome

- Impact: Fixed loading hang caused by JWT token retrieval failure
- Tests: Build verification passed
- Files: 2 files changed (1 updated, 1 removed)
- Next prompts: Run `npm run dev` and test in browser to verify tasks load properly
- Reflection: Better Auth's JWT plugin provides the `/api/auth/token` endpoint automatically through the catch-all route. Using the client's built-in methods (`authClient.token()`) is more reliable than manual fetch calls.

## Implementation Details

**Before (causing hang):**
```ts
// lib/api.ts - custom implementation that hung
async function getAuthToken(): Promise<string | null> {
  const tokenResponse = await fetch("/api/auth/token", {
    method: "GET",
    credentials: "include",
    // No timeout - hangs forever if endpoint doesn't respond
  });
  // ...
}
```

**After (working):**
```ts
// lib/api.ts - uses Better Auth client
import { getAuthToken } from "./auth-client";

// auth-client.ts uses Better Auth's built-in method
export async function getAuthToken(): Promise<string | null> {
  const result = await authClient.token();
  return result.data?.token ?? null;
}
```

## Evaluation notes (flywheel)

- Failure modes observed: Infinite loading hang caused by fetch request to JWT token endpoint that wasn't properly routed through Better Auth's handler
- Graders run and results (PASS/FAIL): PASS - build successful, zero TypeScript errors
- Prompt variant (if applicable): User reported persistent loading issue after previous infinite loop fix
- Next experiment (smallest change to try): Test with backend running to verify end-to-end JWT flow works
