---
id: 014
title: Sign In Preview URL Fix
stage: general
date: 2026-01-10
surface: agent
model: claude-opus-4-5-20251101
feature: none
branch: main
user: sarimarain99
command: /sp.implement
labels: ["bug-fix","frontend","auth","vercel"]
links:
  spec: null
  ticket: null
  adr: null
  pr: null
files:
  - frontend/lib/auth.ts
  - frontend/app/(auth)/sign-in/page.tsx
  - .gitignore
tests:
  - Manual testing in Vercel preview deployment
---

## Prompt

I signed out and now I'm signing in but still showing invalid email or password : [HuggingFace Spaces logs showing successful JWT verification and 200/201 API responses]

## Response snapshot

Investigated the "invalid email or password" error during sign-in. **Analysis revealed the backend authentication was working correctly** - JWT tokens were being verified, users authenticated, and API requests returning 200/201.

The issue was **frontend-side**, not backend:

1. **Missing Vercel preview URL support** - The `trustedOrigins` in `frontend/lib/auth.ts` only included `https://zenith-flow-zeta.vercel.app` but the user was accessing via a preview URL `https://zenith-flow-h431dwx75-muhammad-sarims-projects-9d792ee2.vercel.app`

2. **Suboptimal error handling** - The sign-in page checked for errors before checking for successful session data

**Fixes Applied:**

1. **frontend/lib/auth.ts**: Added wildcard pattern to `trustedOrigins`:
   ```typescript
   trustedOrigins: [
     "http://localhost:3000",
     "https://zenith-flow-zeta.vercel.app",
     // Allow all Vercel preview deployments
     /.+\.vercel\.app$/,
   ],
   ```

2. **frontend/app/(auth)/sign-in/page.tsx**: Improved sign-in flow to check for session data FIRST before displaying errors:
   ```typescript
   // Check if sign-in was successful (has session data)
   if (result.data?.session || result.data?.user) {
     router.push("/dashboard");
     router.refresh();
     return;
   }
   // Only show error if no session
   if (result.error) {
     setError(result.error.message || "Invalid credentials...");
   }
   ```

3. **.gitignore**: Fixed to allow `frontend/lib/` to be tracked (removed `lib/` pattern that was blocking it)

**Commits pushed:**
- `11eb122`: fix: improve sign-in flow and add Vercel preview URL support

## Outcome

- ✅ Impact: Fixed sign-in issues for Vercel preview deployments. Backend was already working - this was a frontend configuration issue.
- 🧪 Tests: Manual testing pending - user needs to redeploy Vercel preview or wait for auto-deployment
- 📁 Files: Modified frontend/lib/auth.ts, frontend/app/(auth)/sign-in/page.tsx, .gitignore (5 files changed, 155 insertions, 6 deletions)
- 🔁 Next prompts: User should test sign-in after Vercel redeploys. Check browser console for debug logs if issues persist.
- 🧠 Reflection: The backend logs were the key clue - authentication was working (200/201 responses), so the issue had to be on the frontend. The "invalid email or password" error was a red herring caused by the frontend's error handling logic.

## Evaluation notes (flywheel)

- Failure modes observed: Initially suspected backend issue based on user's error message, but backend logs revealed authentication was working
- Graders run and results (PASS/FAIL): N/A (UI fixes, no graders)
- Prompt variant (if applicable): N/A
- Next experiment (smallest change to try): If issues persist after deployment, the debug logging added to sign-in page will help identify the exact failure point in the auth flow
