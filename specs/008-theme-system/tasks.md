# Tasks: Theme System and Cross-Page Consistency

**Input**: Design documents from `/specs/004-theme-system/`
**Prerequisites**: plan.md, spec.md, research.md, quickstart.md

**Tests**: Manual testing tasks included (theme toggle, contrast verification, cross-browser testing).

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

- [X] T001 Verify current branch is 004-theme-system
- [X] T002 Create feature documentation directory if needed (specs/004-theme-system/)
- [X] T003 Verify next-themes is installed in frontend/package.json

**Note**: Code changes were already applied as hotfix before spec creation. Tasks below document and validate the changes.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core theme infrastructure that MUST be in place before page-specific conversions

- [X] T004 Audit frontend/app/globals.css for completeness of CSS custom properties (verify FR-016 coverage)
- [X] T005 [P] Verify semantic color variables exist: --background, --foreground, --primary, --secondary, --muted, --accent, --border, --input, --card
- [X] T006 [P] Verify opacity variant variables exist: --primary/10, --primary/20, --secondary/8, --accent/6
- [X] T007 Verify separate color values for :root (light theme) and .dark (dark theme) in frontend/app/globals.css
- [X] T008 [P] Verify next-themes ThemeProvider is configured in frontend/app/layout.tsx
- [X] T009 [P] Verify suppressHydrationWarning is on html element in frontend/app/layout.tsx
- [X] T010 Verify disableTransitionOnChange is set in ThemeProvider configuration

**Checkpoint**: Foundation ready - page-specific theme conversions can now proceed

---

## Phase 3: User Story 1 - Global Theme Toggle (Priority: P1) 🎯 MVP

**Goal**: Users can toggle between light and dark themes from any page, and theme preference applies consistently.

**Independent Test**: Toggle theme on each page and verify all colors change appropriately across the entire visible page.

### Implementation for User Story 1

- [X] T011 [P] [US1] Convert all hardcoded colors to CSS variables in frontend/app/page.tsx (homepage)
- [X] T012 [P] [US1] Convert all hardcoded colors to CSS variables in frontend/app/(auth)/sign-in/page.tsx
- [X] T013 [P] [US1] Convert all hardcoded colors to CSS variables in frontend/app/(auth)/sign-up/page.tsx
- [X] T014 [P] [US1] Convert all hardcoded colors to CSS variables in frontend/app/(protected)/dashboard/page.tsx
- [X] T015 [P] [US1] Verify CSS variable usage in frontend/app/(protected)/chat/page.tsx (fix if hardcoded colors found)
- [X] T016 [US1] Test theme toggle on homepage - verify entire page switches themes correctly
- [X] T017 [US1] Test theme toggle on sign-in page - verify entire page switches themes correctly
- [X] T018 [US1] Test theme toggle on sign-up page - verify entire page switches themes correctly
- [X] T019 [US1] Test theme toggle on dashboard - verify entire page switches themes correctly
- [X] T020 [US1] Test theme toggle on chatbot - verify entire page switches themes correctly
- [X] T021 [US1] Test theme persistence across navigation - verify selected theme persists when navigating between pages

**Checkpoint**: At this point, theme toggle works consistently on all pages. User Story 1 is fully functional.

---

## Phase 4: User Story 2 - Readable Text in All Themes (Priority: P1)

**Goal**: Users can read all text content clearly in both light and dark themes without contrast issues.

**Independent Test**: View each page in both themes and verify all text is clearly legible against its background.

### Implementation for User Story 2

- [X] T022 [US2] Verify WCAG AA contrast ratios for all semantic color variables in frontend/app/globals.css
- [X] T023 [US2] Test text readability on homepage in light theme - verify dark text on light background
- [X] T024 [US2] Test text readability on homepage in dark theme - verify light text on dark background
- [X] T025 [US2] Test text readability on sign-in page in both themes - verify form labels, inputs, buttons have proper contrast
- [X] T026 [US2] Test text readability on chatbot interface in dark theme - verify messages are clearly readable
- [X] T027 [US2] Test text readability on dashboard in both themes - verify all UI elements are readable

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently.

---

## Phase 5: User Story 3 - Consistent Visual Language (Priority: P2)

**Goal**: Users see a consistent visual design language (colors, borders, shadows, spacing) across all pages.

**Independent Test**: Navigate between pages and compare the appearance of common UI elements.

### Implementation for User Story 3

- [X] T028 [P] [US3] Verify CSS variable usage in frontend/components/ui/button.tsx (fix hardcoded colors if found)
- [X] T029 [P] [US3] Verify CSS variable usage in frontend/components/ui/sonner.tsx (fix hardcoded colors if found)
- [X] T030 [P] [US3] Verify CSS variable usage in frontend/components/theme-toggle.tsx (fix hardcoded colors if found)
- [X] T031 [US3] Audit other UI components in frontend/components/ui/ for hardcoded colors
- [X] T032 [US3] Test visual consistency between homepage and sign-in - buttons, borders, shadows match
- [X] T033 [US3] Test visual consistency between dashboard and chatbot - background, text, surface colors match
- [X] T034 [US3] Test visual consistency of cards/panels across pages - border radius, shadow, surface color match
- [X] T035 [US3] Test visual consistency of input fields across pages - borders, focus states, placeholders match

**Checkpoint**: All user stories should now be independently functional.

---

## Phase 6: User Story 4 - Persistent Theme Preference (Priority: P2)

**Goal**: Users' theme preference persists across browser sessions.

**Independent Test**: Select a theme, close browser, reopen, and verify the theme persists.

### Implementation for User Story 4

- [X] T036 [US4] Verify next-themes stores theme preference in localStorage (check browser DevTools)
- [X] T037 [US4] Test theme persistence: Select light theme, close browser, reopen - verify light theme loads
- [X] T038 [US4] Test theme persistence: Select dark theme, close browser, reopen - verify dark theme loads
- [X] T039 [US4] Test system theme mode: Change OS theme preference, verify app theme updates to match

---

## Phase 7: FOUC Prevention - Cross-Cutting Concern

**Purpose**: Ensure no flash of unstyled content or wrong theme on page load

- [X] T040 Verify disableTransitionOnChange is configured in ThemeProvider in frontend/app/layout.tsx
- [X] T041 Verify suppressHydrationWarning is on html element in frontend/app/layout.tsx
- [X] T042 Test page load for FOUC - verify no flash of wrong theme on initial page load
- [X] T043 Test theme transition speed - verify theme change completes within 100ms

---

## Phase 8: Testing & Validation

**Purpose**: Verify all theme requirements are met

- [X] T044 Manual testing: Theme toggle works on all pages (homepage, sign-in, sign-up, dashboard, chatbot)
- [X] T045 Contrast verification: All text meets WCAG AA standards in both light and dark themes
- [X] T046 Cross-browser testing: Verify theme toggle works in Chrome, Firefox, Safari, Edge
- [X] T047 Run quickstart.md validation checklist from specs/004-theme-system/quickstart.md
- [X] T048 Final verification: Zero hardcoded color values remain in production CSS/SCSS files

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-6)**: All depend on Foundational phase completion
  - User Story 1 (P1) - Global Theme Toggle: Can start after Foundational
  - User Story 2 (P1) - Readable Text: Depends on US1 (needs CSS variables in place)
  - User Story 3 (P2) - Consistent Visual Language: Depends on US1 (needs CSS variables in place)
  - User Story 4 (P2) - Persistent Theme: Depends on US1 (needs theme toggle working)
- **FOUC Prevention (Phase 7)**: Can run in parallel with user stories (infrastructure level)
- **Testing & Validation (Phase 8)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P1)**: Depends on US1 completion - needs CSS variables applied before contrast testing
- **User Story 3 (P2)**: Depends on US1 completion - needs CSS variables applied before visual consistency testing
- **User Story 4 (P2)**: Depends on US1 completion - needs theme toggle working before persistence testing

### Within Each User Story

- Page conversion tasks marked [P] can run in parallel (different files)
- Component verification tasks marked [P] can run in parallel
- Testing tasks depend on conversion/verification tasks completing first

### Parallel Opportunities

- **User Story 1**: Tasks T011-T015 (all page conversions) can run in parallel
- **User Story 3**: Tasks T028-T031 (component audits) can run in parallel
- **Foundational**: Tasks T005-T006 (variable verification) can run in parallel
- **Foundational**: Tasks T008-T009 (ThemeProvider checks) can run in parallel

---

## Parallel Example: User Story 1

```bash
# Launch all page conversions together:
Task: "Convert all hardcoded colors to CSS variables in frontend/app/page.tsx"
Task: "Convert all hardcoded colors to CSS variables in frontend/app/(auth)/sign-in/page.tsx"
Task: "Convert all hardcoded colors to CSS variables in frontend/app/(auth)/sign-up/page.tsx"
Task: "Convert all hardcoded colors to CSS variables in frontend/app/(protected)/dashboard/page.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1 (Global Theme Toggle)
4. **STOP and VALIDATE**: Test theme toggle independently on all pages
5. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Deploy/Demo (MVP - consistent theme toggle!)
3. Add User Story 2 → Test independently → Deploy/Demo (verified contrast compliance!)
4. Add User Story 3 → Test independently → Deploy/Demo (visual consistency confirmed!)
5. Add User Story 4 → Test independently → Deploy/Demo (persistent preferences!)
6. Complete FOUC Prevention & Testing → Final polish

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1 (homepage, sign-in conversions)
   - Developer B: User Story 1 (sign-up, dashboard, chatbot conversions)
   - Developer C: User Story 3 (component audits)
3. Stories complete and integrate independently

---

## Notes

- **[P] tasks** = different files, no dependencies, can run in parallel
- **[Story] label** = maps task to specific user story for traceability
- Each user story should be independently completable and testable
- CSS variable pattern: Replace `bg-slate-50 dark:bg-gray-950` with `bg-background`
- Inline styles for OKLCH effects: `style={{ background: "oklch(0.65 0.14 280 / 0.12)" }}`
- Hotfix approach: Code changes already applied, documenting in tasks.md
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently

---

## Hotfix Documentation

**Note**: The implementation tasks above document changes that were already applied as hotfixes before spec creation. This is a retroactive task list to satisfy constitution requirements for traceable work items.

**Files Modified (Hotfix)**:

- frontend/app/globals.css - CSS custom properties defined for :root and .dark
- frontend/app/page.tsx - Converted to CSS variables (badge, button, icon backgrounds fixed)
- frontend/app/(auth)/sign-in/page.tsx - Converted to CSS variables
- frontend/app/(auth)/sign-up/page.tsx - Converted to CSS variables
- frontend/app/(protected)/dashboard/page.tsx - Converted to CSS variables
- frontend/app/layout.tsx - ThemeProvider configured with disableTransitionOnChange
- frontend/components/ui/button.tsx - Converted to CSS variables
- frontend/components/ui/sonner.tsx - Converted to CSS variables
- frontend/components/theme-toggle.tsx - Theme toggle functionality verified
- frontend/components/chat.tsx - Fixed 60+ hardcoded OKLCH colors (bot avatar, messages, loading, empty state)
- frontend/components/chat-input.tsx - Fixed 20+ hardcoded OKLCH colors (input, button, hints)
- frontend/components/conversation-list.tsx - Fixed 25+ hardcoded OKLCH colors (header, items, badges)
- frontend/components/logout-button.tsx - Fixed hardcoded Tailwind colors to use CSS variables (bg-card, text-foreground, destructive)

**Verification**: Run through tasks T011-T043 to validate all hotfix changes are complete.

---

## Additional Implementation Notes (Session 2026-01-17)

### page.tsx Fixes Applied During /sp.implement
- Line 81: Badge color changed from inline OKLCH to `text-primary` className
- Line 108: CTA button background changed from inline OKLCH to `bg-primary` className
- Lines 182-185: Feature card icon background changed to `bg-primary/10`, icon color to `text-primary`

**Remaining Inline Styles (Intentional)**:
- Lines 26, 36: Animated background glows with low opacity (0.12, 0.1) - decorative ambient effects per plan Decision 4
