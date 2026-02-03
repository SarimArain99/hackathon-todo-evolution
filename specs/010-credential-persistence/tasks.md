# Tasks: Credential Persistence & Account Recovery

**Input**: Design documents from `/specs/010-credential-persistence/`
**Prerequisites**: plan.md, spec.md (user stories P1-P3), research.md, data-model.md, contracts/credential-api.yaml

**Tests**: Tests are NOT included in this specification. The feature spec does not explicitly request TDD.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Frontend**: `frontend/` (Next.js 15+ with App Router)
- **Backend**: `backend/` (FastAPI/Python)
- **Shared**: Environment variables in `.env`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and dependency installation

- [X] T001 Install PostgreSQL client dependencies in frontend (`npm install pg @types/pg`)
- [X] T002 Install Better Auth CLI for database migrations in frontend (`npm install -D @better-auth/cli`)
- [X] T003 [P] Install Resend email SDK in frontend (`npm install resend`)
- [X] T004 [P] Add `DATABASE_URL` environment variable to `.env` file
- [X] T005 [P] Add `RESEND_API_KEY` environment variable to `.env` file
- [X] T006 [P] Add `BETTER_AUTH_SECRET` environment variable to `.env` file (min 32 chars)
- [X] T007 [P] Add `BETTER_AUTH_URL` environment variable to `.env` file
- [X] T008 [P] Add `REQUIRE_EMAIL_VERIFICATION` environment variable to `.env` file
- [X] T009 [P] Add `BETTER_AUTH_TRUSTED_ORIGINS` environment variable to `.env` file

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

**⚠️ PREREQUISITE**: DATABASE_URL environment variable must be set before running migrations (T012-T013).

- [X] T010 Create email service module in `frontend/lib/email.ts` with Resend client initialization
- [X] T011 [P] Implement rate limiting utility in `frontend/lib/email.ts` with `checkRateLimit` function (3 req/hour)
- [ ] T012 Run Better Auth migration generation in frontend (`npx @better-auth/cli generate`) - REQUIRES DATABASE_URL
- [ ] T013 Run Better Auth database migrations in frontend (`npx @better-auth/cli migrate`) - REQUIRES DATABASE_URL
- [X] T014 Update Better Auth configuration in `frontend/lib/auth.ts` to use PostgreSQL adapter (remove stateless mode)
- [X] T015 Configure JWT plugin session duration to 7 days in `frontend/lib/auth.ts`
- [ ] T016 Verify database tables created: `user`, `session`, `account`, `verification` - REQUIRES DATABASE_URL

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Persistent Sign-In Across Sessions (Priority: P1) 🎯 MVP

**Goal**: Enable users to sign in with email/password credentials stored in PostgreSQL, surviving browser closure and device switches.

**Independent Test**: Create an account, close browser, reopen and sign in with same credentials. Success = access to same account with all data intact.

### Implementation for User Story 1

- [X] T017 [P] [US1] Update sign-in page in `frontend/app/(auth)/sign-in/page.tsx` to use database-backed authentication
- [X] T018 [P] [US1] Update sign-up page in `frontend/app/(auth)/sign-up/page.tsx` to create database user records
- [X] T019 [US1] Remove `cookieCache` configuration from `frontend/lib/auth.ts` session settings
- [X] T020 [US1] Remove `storeStateStrategy: "cookie"` from `frontend/lib/auth.ts` account configuration
- [ ] T021 [US1] Verify sign-in creates session in database with 7-day expiration - REQUIRES DATABASE_URL
- [ ] T022 [US1] Test cross-device sign-in: sign in on browser A, close, sign in on browser B with same credentials - REQUIRES DATABASE_URL

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently

---

## Phase 4: User Story 2 - Password Recovery via Email (Priority: P2)

**Goal**: Enable users to reset forgotten passwords via email reset link.

**Independent Test**: Request password reset, receive email, click link, set new password. Success = can sign in with new password.

### Implementation for User Story 2

- [X] T023 [P] [US2] Configure `sendResetPassword` callback in `frontend/lib/auth.ts` to use Resend email service
- [X] T024 [P] [US2] Create forgot-password page in `frontend/app/(auth)/forgot-password/page.tsx` with email form
- [X] T025 [P] [US2] Create reset-password page in `frontend/app/(auth)/reset-password/[token]/page.tsx` with new password form
- [X] T026 [US2] Add rate limit check to password reset flow (3 requests/hour per email)
- [X] T027 [US2] Implement email enumeration protection in password reset (always returns success message)
- [X] T028 [US2] Update sign-in page in `frontend/app/(auth)/sign-in/page.tsx` to enable "Forgot Password" button
- [X] T029 [US2] Configure 1-hour token expiration in `frontend/lib/auth.ts` emailAndPassword settings
- [ ] T030 [US2] Test password reset flow: request → email → click link → new password → sign in - REQUIRES DATABASE_URL & RESEND_API_KEY
- [ ] T031 [US2] Test expired token behavior (request reset, wait >1 hour, attempt to use link) - REQUIRES DATABASE_URL

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently

---

## Phase 5: User Story 3 - Email Verification (Priority: P3)

**Goal**: Require email verification for new accounts to enable reliable password recovery.

**Independent Test**: Register new account, receive verification email, click link. Success = account marked verified, status displayed.

### Implementation for User Story 3

- [X] T032 [P] [US3] Configure `sendVerificationEmail` callback in `frontend/lib/auth.ts` to use Resend email service
- [ ] T033 [P] [US3] Set `requireEmailVerification: true` in `frontend/lib/auth.ts` emailAndPassword configuration - OPTIONAL (controlled by env var)
- [ ] T034 [US3] Add email verification status indicator to user profile/dashboard - DEFERRED (dashboard not in scope)
- [ ] T035 [US3] Handle unverified user state in password reset (show "verify email first" message if applicable) - HANDLED by Better Auth
- [ ] T036 [US3] Test verification flow: sign up → receive email → click link → account verified - REQUIRES DATABASE_URL & RESEND_API_KEY
- [ ] T037 [US3] Test password reset with unverified email (should prompt verification first) - REQUIRES DATABASE_URL
- [ ] T038 [US3] Test verification link expiration (request new sign-up, wait >1 hour, attempt expired link) - REQUIRES DATABASE_URL

**Checkpoint**: All user stories should now be independently functional

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [X] T039 [P] Add environment variable documentation to README with all required variables - SEE .env.local.example
- [X] T040 [P] Update `frontend/.env.example` with new credential persistence variables
- [ ] T041 Add error boundaries for auth-related failures - DEFERRED (Next.js error handling)
- [ ] T042 Verify all success criteria from spec.md are met (sign-in <5s, email delivery <2min 95%, 100% persistence) - REQUIRES DATABASE_URL
- [ ] T043 Run quickstart.md validation to ensure setup guide works end-to-end - REQUIRES DATABASE_URL
- [X] T044 Security audit: verify HTTPS-only cookies in production configuration (useSecureCookies in auth.ts)
- [ ] T045 Performance test: verify database queries complete within SLA - REQUIRES DATABASE_URL

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-5)**: All depend on Foundational phase completion
  - User Story 1 (US1): Can proceed independently after Foundational
  - User Story 2 (US2): Can proceed independently after Foundational (integrates with US1 but independently testable)
  - User Story 3 (US3): Can proceed independently after Foundational (integrates with US1/US2 but independently testable)
- **Polish (Phase 6)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1 - Persistent Sign-In)**: No dependencies on other user stories. Foundational blocking only.
- **User Story 2 (P2 - Password Recovery)**: Requires US1 database tables to exist. Integrates with existing users but independently testable.
- **User Story 3 (P3 - Email Verification)**: Requires US1 database tables. Adds verification requirement to US1 sign-up flow. Independently testable.

### Within Each User Story

- US1: Remove stateless config (T019, T020) BEFORE testing sign-in flow (T021, T022)
- US2: Configure email callback (T023) BEFORE creating reset pages (T024, T025)
- US3: Configure verification callback (T032) BEFORE enabling requirement (T033)

### Parallel Opportunities

- **Setup (Phase 1)**: T003, T004-T009 can all run in parallel (independent environment variables)
- **Foundational (Phase 2)**: T011 can run in parallel with T012-T013 (rate limiter independent of migrations)
- **US1**: T017, T018 can run in parallel (sign-in and sign-up pages are different files)
- **US2**: T024, T025 can run in parallel (forgot-password and reset-password pages are different files)
- **US3**: T034 can run in parallel with T032, T033 (UI indicator independent of backend config)

---

## Parallel Example: User Story 2 (Password Recovery)

```bash
# Launch UI pages in parallel:
Task: "Create forgot-password page in frontend/app/(auth)/forgot-password/page.tsx"
Task: "Create reset-password page in frontend/app/(auth)/reset-password/[token]/page.tsx"

# After UI complete, configure backend:
Task: "Configure sendResetPassword callback in frontend/lib/auth.ts"
Task: "Add rate limit check to password reset flow"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (install dependencies, configure env vars)
2. Complete Phase 2: Foundational (database migrations, email service, auth config)
3. Complete Phase 3: User Story 1 (remove stateless, enable persistent sign-in)
4. **STOP and VALIDATE**: Test User Story 1 independently
   - Create account, close browser, sign in again with same credentials
   - Verify session persists in database
5. Deploy/demo MVP if ready

**MVP Value**: Users can now sign in again after closing browser. Core issue resolved.

### Incremental Delivery

1. **Foundation**: Setup + Foundational → Database ready, email service configured
2. **MVP (US1)**: Add User Story 1 → Test independently → **Deploy/Demo**
   - Value: Persistent sign-in, zero account loss from cookie clearance
3. **Recovery (US2)**: Add User Story 2 → Test independently → Deploy/Demo
   - Value: Users can recover forgotten passwords
4. **Verification (US3)**: Add User Story 3 → Test independently → Deploy/Demo
   - Value: Verified emails ensure reliable password recovery
5. **Polish**: Add Phase 6 improvements → Final release

Each story adds value without breaking previous stories.

### Parallel Team Strategy

With multiple developers (future-proofing):

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - **Developer A**: User Story 1 (persistent sign-in)
   - **Developer B**: User Story 2 (password reset)
   - **Developer C**: User Story 3 (email verification)
3. Stories complete and integrate independently via shared database schema

---

## Notes

- [P] tasks = different files, no dependencies on incomplete tasks
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Better Auth CLI generates migration files automatically - review before applying
- Email service (Resend) requires API key and verified domain for production
- Rate limiting is in-memory per server instance; consider Redis for multi-instance deployments
- All passwords hashed via Bcrypt (Better Auth default)
- JWT cookies maintained for backend API authentication compatibility

---

## Task Summary

- **Total Tasks**: 45
- **Setup (Phase 1)**: 9 tasks
- **Foundational (Phase 2)**: 7 tasks
- **User Story 1 (Phase 3)**: 6 tasks
- **User Story 2 (Phase 4)**: 9 tasks
- **User Story 3 (Phase 5)**: 7 tasks
- **Polish (Phase 6)**: 7 tasks
- **Parallelizable**: 21 tasks marked [P]

**MVP Scope**: Phases 1-3 (Tasks T001-T022) = 22 tasks for persistent sign-in capability
