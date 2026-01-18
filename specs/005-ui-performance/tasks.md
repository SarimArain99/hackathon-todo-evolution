# Tasks: UI Performance and Animation Optimization

**Input**: Design documents from `/specs/005-ui-performance/`
**Prerequisites**: plan.md, spec.md, research.md, quickstart.md

**Tests**: Performance testing tasks included as part of implementation (Lighthouse, scroll FPS, Web Vitals).

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3, US4)
- Include exact file paths in descriptions

## Path Conventions

- **Web app**: `frontend/app/`, `frontend/components/` at repository root

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization - HOTFIX APPROACH (code changes already applied)

- [X] T001 Verify current branch is 005-ui-performance (Note: On 004-theme-system, changes already applied)
- [X] T002 Create feature documentation directory if needed (specs/005-ui-performance/)

**Note**: Code changes were already applied as hotfix before spec creation. Tasks below document and validate the changes.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core performance infrastructure that MUST be in place before page-specific optimizations

- [X] T003 Audit frontend/app/globals.css for existing animation and transition rules
- [X] T004 Verify Framer Motion is installed in frontend/package.json
- [X] T005 Document current blur values across all pages in frontend/app/

**Checkpoint**: Foundation ready - page-specific optimizations can now proceed

---

## Phase 3: User Story 1 - Smooth Scrolling on All Pages (Priority: P1) 🎯 MVP

**Goal**: Users can scroll through any page smoothly without stuttering, lag, or frame drops.

**Independent Test**: Scroll on each page and verify frame rate stays smooth (no visible stuttering).

### Implementation for User Story 1

- [X] T006 [P] [US1] Reduce blur value from 120px to 40px (mobile) / 50px (sm breakpoint) in frontend/app/page.tsx
- [X] T007 [P] [US1] Reduce blur value from 120px to 50px (mobile) / 60px (sm breakpoint) in frontend/app/(auth)/sign-in/page.tsx
- [X] T008 [P] [US1] Reduce blur value from 120px to 50px (mobile) / 60px (sm breakpoint) in frontend/app/(auth)/sign-up/page.tsx
- [X] T009 [P] [US1] Reduce blur value from 120px to 50px (mobile) / 60px (sm breakpoint) in frontend/app/(protected)/dashboard/page.tsx
- [X] T010 [US1] Verify chatbot blur values are ≤ 40px in frontend/app/(protected)/chat/page.tsx, reduce if needed
- [ ] T011 [US1] Test scroll performance on homepage - verify smooth 60 FPS scrolling
- [ ] T012 [US1] Test scroll performance on sign-in page - verify smooth 60 FPS scrolling
- [ ] T013 [US1] Test scroll performance on sign-up page - verify smooth 60 FPS scrolling
- [ ] T014 [US1] Test scroll performance on dashboard - verify smooth 60 FPS scrolling

**Checkpoint**: At this point, all pages should scroll smoothly at 60 FPS. User Story 1 is fully functional.

---

## Phase 4: User Story 2 - Fast Page Load and Interaction (Priority: P1)

**Goal**: Users experience fast page loads and responsive interactions without waiting for animations.

**Independent Test**: Measure page load time and interaction responsiveness across pages.

### Implementation for User Story 2

- [X] T015 [US2] Audit frontend/components/ for Framer Motion animations - ensure only transform/opacity properties used
- [X] T016 [P] [US2] Review and optimize animations in frontend/components/chat.tsx (use transform/opacity only)
- [X] T017 [P] [US2] Review and optimize animations in frontend/components/chat-input.tsx (use transform/opacity only)
- [X] T018 [P] [US2] Review and optimize animations in frontend/components/theme-toggle.tsx (ensure <300ms transitions)
- [X] T019 [US2] Add CSS containment for isolated animated components in frontend/app/globals.css
- [X] T020 [US2] Defer non-critical animations using requestAnimationFrame or setTimeout in affected components
- [ ] T021 [US2] Test page load times - verify LCP < 2.5s on all pages
- [ ] T022 [US2] Test interaction responsiveness - verify feedback appears within 100ms

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently.

---

## Phase 5: User Story 3 - Consistent Performance Across Devices (Priority: P2)

**Goal**: Users experience consistent scrolling and interaction performance regardless of device capabilities.

**Independent Test**: Measure performance on low-end and high-end devices.

### Implementation for User Story 3

- [X] T023 [US3] Audit all scroll event listeners in frontend/app/ and frontend/components/ for passive flag (No custom scroll listeners found)
- [X] T024 [P] [US3] Add passive: true to any scroll event listeners in frontend/components/ (N/A - no scroll listeners)
- [X] T025 [P] [US3] Add passive: true to any touch event listeners in frontend/components/ (N/A - no touch listeners)
- [ ] T026 [US3] Verify fixed position elements don't have heavy blur that causes repaint during scroll
- [ ] T027 [US3] Test scroll performance on simulated low-end device (Chrome DevTools CPU throttling)
- [ ] T028 [US3] Test scroll performance on mobile viewport (< 768px width)
- [ ] T029 [US3] Verify animations run smoothly on integrated GPU scenarios

**Checkpoint**: All user stories should now be independently functional.

---

## Phase 6: User Story 4 - Visual Quality Maintained (Priority: P2)

**Goal**: Users see a visually polished interface with ambient effects that enhance without degrading performance.

**Independent Test**: Visually inspect each page and confirm ambient effects are present and smooth.

### Implementation for User Story 4

- [ ] T030 [US4] Visual inspection of homepage - verify ambient gradient/glow effects are visible
- [ ] T031 [US4] Visual inspection of sign-in page - verify background ambient effects are subtle
- [ ] T032 [US4] Visual inspection of all pages - verify shadows, borders, hover effects are polished
- [ ] T033 [US4] Verify animations feel natural (not rushed or choppy) across all components
- [ ] T034 [US4] Take screenshots of light/dark themes to document visual quality baseline

---

## Phase 7: Accessibility - Cross-Cutting Concern

**Purpose**: Ensure accessibility compliance for motion preferences

- [X] T035 Add @media (prefers-reduced-motion: reduce) styles to frontend/app/globals.css (Already present at line 481)
- [ ] T036 Test with OS reduced-motion setting enabled - verify animations are skipped
- [ ] T037 Verify all content is accessible without animations (information not conveyed only through motion)

---

## Phase 8: Performance Testing & Validation

**Purpose**: Verify all performance targets are met

- [ ] T038 Run Lighthouse audit on homepage - target 90+ performance score
- [ ] T039 Run Lighthouse audit on sign-in page - target 90+ performance score
- [ ] T040 Run Lighthouse audit on sign-up page - target 90+ performance score
- [ ] T041 Run Lighthouse audit on dashboard - target 90+ performance score
- [ ] T042 Run Lighthouse audit on chatbot - target 90+ performance score
- [ ] T043 Measure scroll FPS using Chrome DevTools Performance tab - verify 55-60 FPS
- [ ] T044 Verify Web Vitals: LCP < 2.5s, CLS < 0.1, FID < 100ms
- [ ] T045 Cross-browser testing: Firefox, Safari, Edge - verify consistent performance
- [ ] T046 Run quickstart.md validation checklist from specs/005-ui-performance/quickstart.md

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-6)**: All depend on Foundational phase completion
  - User Story 1 (P1) - Smooth Scrolling: Can start after Foundational
  - User Story 2 (P1) - Fast Page Load: Can start after Foundational (parallel with US1)
  - User Story 3 (P2) - Consistent Performance: Can start after Foundational (parallel with US1, US2)
  - User Story 4 (P2) - Visual Quality: Can start after US1 blur optimizations complete
- **Accessibility (Phase 7)**: Depends on all animation optimizations being complete
- **Performance Testing (Phase 8)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P1)**: Can start after Foundational (Phase 2) - Independent of US1
- **User Story 3 (P2)**: Can start after Foundational (Phase 2) - Independent of US1, US2
- **User Story 4 (P2)**: Should complete after US1 (needs blur reductions in place for visual quality assessment)

### Within Each User Story

- Page-specific tasks marked [P] can run in parallel (different files)
- Testing tasks depend on optimization tasks completing first
- Visual inspection (US4) should happen after blur optimizations (US1)

### Parallel Opportunities

- **User Story 1**: Tasks T006-T010 (all page blur optimizations) can run in parallel
- **User Story 2**: Tasks T016-T018 (component animation reviews) can run in parallel
- **User Story 3**: Tasks T024-T025 (passive event listener additions) can run in parallel
- **Lighthouse audits**: Tasks T038-T042 can run in parallel

---

## Parallel Example: User Story 1

```bash
# Launch all page blur optimizations together:
Task: "Reduce blur value from 120px to 40px (mobile) / 50px (sm breakpoint) in frontend/app/page.tsx"
Task: "Reduce blur value from 120px to 50px (mobile) / 60px (sm breakpoint) in frontend/app/(auth)/sign-in/page.tsx"
Task: "Reduce blur value from 120px to 50px (mobile) / 60px (sm breakpoint) in frontend/app/(auth)/sign-up/page.tsx"
Task: "Reduce blur value from 120px to 50px (mobile) / 60px (sm breakpoint) in frontend/app/(protected)/dashboard/page.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1 (Smooth Scrolling)
4. **STOP and VALIDATE**: Test scrolling independently on all pages
5. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Deploy/Demo (MVP - smooth scrolling!)
3. Add User Story 2 → Test independently → Deploy/Demo (fast interactions!)
4. Add User Story 3 → Test independently → Deploy/Demo (consistent performance!)
5. Add User Story 4 → Test independently → Deploy/Demo (visual quality verified!)
6. Complete Accessibility & Performance Testing → Final polish

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1 (page blur optimizations)
   - Developer B: User Story 2 (animation optimizations)
   - Developer C: User Story 3 (scroll listeners, passive events)
3. Stories complete and integrate independently

---

## Notes

- **[P] tasks** = different files, no dependencies, can run in parallel
- **[Story] label** = maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Blur value targets: Homepage 40/50px, Auth pages 50/60px, Dashboard 50/60px, Chatbot ≤40px
- GPU properties only: transform, opacity for all animations
- Hotfix approach: Code changes already applied, documenting in tasks.md
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently

---

## Hotfix Documentation

**Note**: The implementation tasks above document changes that were already applied as hotfixes before spec creation. This is a retroactive task list to satisfy constitution requirements for traceable work items.

**Files Modified (Hotfix)**:

- frontend/app/page.tsx - Blur value reduced to 40/50px
- frontend/app/(auth)/sign-in/page.tsx - Blur value reduced to 50/60px
- frontend/app/(auth)/sign-up/page.tsx - Blur value reduced to 50/60px
- frontend/app/(protected)/dashboard/page.tsx - Blur value reduced to 50/60px
- frontend/app/globals.css - Added prefers-reduced-motion support

**Verification**: Run through tasks T006-T037 to validate all hotfix changes are complete.
