# Tasks: Frontend Design Improvements

**Input**: Design documents from `/specs/001-frontend-design-improvements/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, quickstart.md

**Tests**: Visual testing and manual accessibility audit. No automated test tasks included.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

Frontend web application structure: `frontend/app/`, `frontend/components/`, `frontend/lib/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Verify development environment and create backup point

- [X] T001 Verify development server starts in `frontend/` (run `npm run dev`)
- [X] T002 Run TypeScript type check in `frontend/` (run `npx tsc --noEmit`)
- [X] T003 Create backup branch before making changes (run `git checkout -b backup-before-improvements`)

**Checkpoint**: Development environment verified, backup created

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core shared utilities that all user stories depend on

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T004 [P] Create Skeleton component in `frontend/components/task-skeleton.tsx`
- [X] T005 [P] Create ConfirmDialog component in `frontend/components/confirm-dialog.tsx`

**Checkpoint**: Shared components ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Fix Broken Visual Elements (Priority: P1) 🎯 MVP

**Goal**: Fix invalid CSS classes so all visual elements render correctly

**Independent Test**: View landing page, dashboard, and task items to verify gradients, sizing, and colors display correctly

### Implementation for User Story 1

- [X] T006 [P] [US1] Fix gradient text class in `frontend/app/page.tsx` line 84 (`bg-linear-to-r` → `bg-gradient-to-r`)
- [X] T007 [P] [US1] Fix separator gradient in `frontend/app/(protected)/dashboard/dashboard-client.tsx` line 98 (`bg-linear-to-r` → `bg-gradient-to-r`)
- [X] T008 [P] [US1] Fix overdue indicator gradient in `frontend/components/task-item.tsx` line 96 (`bg-linear-to-b` → `bg-gradient-to-b`)
- [X] T009 [P] [US1] Fix min-height in `frontend/components/task-list.tsx` line 115 (`min-h-75` → `min-h-[18.75rem]`)
- [X] T010 [P] [US1] Fix theme toggle width in `frontend/components/theme-toggle.tsx` line 26 (`w-27` → `w-[108px]`)
- [X] T011 [US1] Fix Indigo 600 OKLCH color in `frontend/app/globals.css` line 9 (add chroma value)

**Checkpoint**: Visual elements render correctly - gradients display, sizing is correct, colors are accurate

---

## Phase 4: User Story 2 - Accessible Interface for All Users (Priority: P1)

**Goal**: All interactive elements are accessible via screen reader and keyboard

**Independent Test**: Navigate with screen reader to verify aria-labels announce button purposes; tab through interface to verify focus states are visible

### Implementation for User Story 2

- [X] T012 [P] [US2] Add aria-label to edit button in `frontend/components/task-item.tsx`
- [X] T013 [P] [US2] Add aria-label to delete button in `frontend/components/task-item.tsx`
- [X] T014 [P] [US2] Add aria-label to close form button in `frontend/components/task-form.tsx`
- [X] T015 [P] [US2] Add aria-label to theme toggle buttons in `frontend/components/theme-toggle.tsx`
- [X] T016 [P] [US2] Add aria-pressed to active theme button in `frontend/components/theme-toggle.tsx`
- [X] T017 [P] [US2] Add aria-label to filter dropdowns in `frontend/components/task-list.tsx`
- [X] T018 [US2] Verify focus states are visible on all interactive elements in `frontend/app/(auth)/sign-in/page.tsx`

**Checkpoint**: Screen reader announces all interactive elements; keyboard navigation works with visible focus indicators

---

## Phase 5: User Story 3 - Consistent Design Language (Priority: P2)

**Goal**: Unified border radius, glass effects, and hover animations across all components

**Independent Test**: Visually inspect all pages and components to verify consistent styling patterns

### Implementation for User Story 3

- [X] T019 [P] [US3] Replace `rounded-[2.5rem]` with `rounded-3xl` in `frontend/app/page.tsx`
- [X] T020 [P] [US3] Replace `rounded-[2.5rem]` with `rounded-3xl` in `frontend/app/(auth)/sign-in/page.tsx`
- [X] T021 [P] [US3] Replace `rounded-[2.5rem]` with `rounded-3xl` in `frontend/app/(auth)/sign-up/page.tsx`
- [X] T022 [P] [US3] Replace `rounded-[2.5rem]` with `rounded-3xl` in `frontend/app/(protected)/dashboard/page.tsx`
- [X] T023 [P] [US3] Replace `rounded-[2.5rem]` with `rounded-3xl` in `frontend/components/task-form.tsx`
- [X] T024 [P] [US3] Replace `rounded-[2.5rem]` with `rounded-3xl` in `frontend/components/task-list.tsx`
- [X] T025 [P] [US3] Standardize button hover scale to `scale-1.01` in `frontend/app/page.tsx` (currently `scale-[1.03]`)

**Checkpoint**: All border radii use standard scale; all hover animations use consistent scale

---

## Phase 6: User Story 4 - Improved User Interactions (Priority: P2)

**Goal**: Replace browser dialogs with custom modals; use router for smooth navigation

**Independent Test**: Click delete button to verify custom modal appears; logout to verify smooth redirect

### Implementation for User Story 4

- [X] T026 [US4] Replace `window.confirm()` with ConfirmDialog in `frontend/components/task-item.tsx`
- [X] T027 [US4] Replace `window.location.href` with `router.push()` in `frontend/components/logout-button.tsx`

**Checkpoint**: Delete confirmation uses styled modal; logout uses smooth router navigation

---

## Phase 7: User Story 5 - Loading and Empty States (Priority: P3)

**Goal**: Display skeleton during loading; show helpful message when list is empty

**Independent Test**: Load task list to verify skeleton shows; filter to show empty state message

### Implementation for User Story 5

- [X] T028 [P] [US5] Add skeleton loading display to `frontend/components/task-list.tsx` (use TaskSkeleton component)
- [X] T029 [US5] Enhance empty state message in `frontend/components/task-list.tsx` (add helpful guidance text)

**Checkpoint**: Loading shows skeleton animation; empty list shows helpful message

---

## Phase 8: User Story 6 - Metadata and Configuration Updates (Priority: P3)

**Goal**: Update production URLs and correct version claims in metadata

**Independent Test**: View page source to verify URLs are correct; check tech stack claims match installed versions

### Implementation for User Story 6

- [X] T030 [P] [US6] Update `metadataBase` URL in `frontend/app/layout.tsx` (replace placeholder with actual Vercel URL)
- [X] T031 [P] [US6] Update tech stack claim from "Next.js 15" to "Next.js 16" in `frontend/app/page.tsx`

**Checkpoint**: Metadata contains production URLs; tech stack claims are accurate

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Code quality improvements and validation

- [X] T032 [P] Wrap console logs in development check in `frontend/lib/api.ts`
- [X] T033 Run TypeScript type check in `frontend/` (run `npx tsc --noEmit`)
- [X] T034 Run production build in `frontend/` (run `npm run build`)
- [X] T035 Run quickstart.md validation checklist

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phases 3-8)**: All depend on Foundational phase completion
  - User stories can proceed in parallel (different files)
  - Or sequentially in priority order (P1 → P2 → P3 → P2 → P3)
- **Polish (Phase 9)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 3 (P2)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 4 (P2)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 5 (P3)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 6 (P3)**: Can start after Foundational (Phase 2) - No dependencies on other stories

### Within Each User Story

- Tasks marked [P] within a story can run in parallel (different files)
- No task within a story depends on another task in the same story

### Parallel Opportunities

- All Foundational tasks marked [P] can run in parallel (T004, T005)
- Once Foundational phase completes, all user stories can start in parallel
- All tasks within User Story 1 marked [P] can run in parallel (T006-T011)
- All tasks within User Story 2 marked [P] can run in parallel (T012-T017)
- All tasks within User Story 3 marked [P] can run in parallel (T019-T025)
- Tasks T028, T029 within User Story 5 can run in parallel
- Tasks T030, T031 within User Story 6 can run in parallel
- Tasks T032, T033, T034 within Polish can run in parallel

---

## Parallel Example: User Story 1

```bash
# Launch all CSS fixes for User Story 1 together:
T006: Fix gradient in frontend/app/page.tsx
T007: Fix gradient in frontend/app/(protected)/dashboard/dashboard-client.tsx
T008: Fix gradient in frontend/components/task-item.tsx
T009: Fix min-height in frontend/components/task-list.tsx
T010: Fix width in frontend/components/theme-toggle.tsx
T011: Fix color in frontend/app/globals.css
```

---

## Parallel Example: User Story 3

```bash
# Launch all border radius fixes for User Story 3 together:
T019: Fix radius in frontend/app/page.tsx
T020: Fix radius in frontend/app/(auth)/sign-in/page.tsx
T021: Fix radius in frontend/app/(auth)/sign-up/page.tsx
T022: Fix radius in frontend/app/(protected)/dashboard/page.tsx
T023: Fix radius in frontend/components/task-form.tsx
T024: Fix radius in frontend/components/task-list.tsx
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Test User Story 1 independently (visual elements render correctly)
5. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Deploy/Demo (MVP - visual fixes complete)
3. Add User Story 2 → Test independently → Deploy/Demo (accessibility improved)
4. Add User Story 3 → Test independently → Deploy/Demo (design consistent)
5. Add User Story 4 → Test independently → Deploy/Demo (UX improved)
6. Add User Story 5 → Test independently → Deploy/Demo (loading states added)
7. Add User Story 6 → Test independently → Deploy/Demo (metadata updated)
8. Polish → Final deployment

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1 (visual fixes)
   - Developer B: User Story 2 (accessibility)
   - Developer C: User Story 3 (consistency)
3. Stories complete and integrate independently

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence
