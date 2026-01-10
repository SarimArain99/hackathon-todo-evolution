---
id: 017
title: Add Forgot Password Feature
stage: general
date: 2026-01-10
surface: agent
model: claude-opus-4-5-20251101
feature: none
branch: main
user: sarimarain99
command: /sp.implement
labels: ["feature","authentication","password-reset","email-otp"]
links:
  spec: null
  ticket: null
  adr: null
  pr: null
files:
  - frontend/lib/auth.ts
  - frontend/lib/auth-client.ts
  - frontend/app/(auth)/forgot-password/page.tsx
  - frontend/app/(auth)/reset-password/page.tsx
  - frontend/app/(auth)/sign-in/page.tsx
tests:
  - Manual testing of password reset flow required
---

## Prompt

set the forget password functionality.

## Response snapshot

Implemented complete forgot password functionality using Better Auth's Email OTP plugin.

**Implementation Details:**

1. **Server Configuration (frontend/lib/auth.ts):**
   - Added `emailOTP` plugin with 6-digit OTP, 10-minute expiry
   - Implemented `sendVerificationOTP` function that logs OTP to console in development
   - TODO comment added for production email service integration (Resend, SendGrid)

2. **Client Configuration (frontend/lib/auth-client.ts):**
   - Added `emailOTPClient` plugin to enable client-side OTP methods

3. **UI Pages Created:**
   - `/forgot-password` - Request reset code via email
   - `/reset-password` - Enter OTP and new password
   - Both pages match the existing Zenith design system with animations

4. **Sign-In Page Update:**
   - Updated "Forgot?" link to point to `/forgot-password`

**Password Reset Flow:**
1. User enters email on `/forgot-password`
2. OTP is generated and logged to server console (development)
3. User enters email, OTP, and new password on `/reset-password`
4. Password is reset and user is redirected to sign-in

## Outcome

- ✅ Impact: Added complete forgot password functionality using Better Auth Email OTP plugin. Works with stateless mode (no database required).
- 🧪 Tests: Manual testing required. In development, check server console for OTP codes.
- 📁 Files: Created 2 new pages, modified 3 files (5 files changed, 617 insertions, 1 deletion)
- 🔁 Next prompts: Configure production email service in `sendVerificationOTP` function when ready for production
- 🧠 Reflection: Email OTP approach was chosen because it works well with stateless mode. The traditional link-based password reset requires storing tokens in a database, which we don't have in the current stateless setup.

## Evaluation notes (flywheel)

- Failure modes observed: None
- Graders run and results (PASS/FAIL): N/A (feature implementation, no graders run)
- Prompt variant (if applicable): N/A
- Next experiment (smallest change to try): In production, integrate Resend or SendGrid email service in the `sendVerificationOTP` function to send actual emails instead of console logging.
