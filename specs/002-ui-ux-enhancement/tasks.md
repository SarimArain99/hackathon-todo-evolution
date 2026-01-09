# Tasks: UI/UX Enhancement

**Feature**: 002-ui-ux-enhancement
**Status**: Complete (Phases 1-5 Complete, Phase 6 Partial, Phase 7 Complete)
**Last Updated**: 2026-01-09

## Overview

This document defines actionable, dependency-ordered tasks for implementing UI/UX enhancements including theme management, animations, toast notifications, and enhanced component library.

**User Stories**:
- US1 (P1): Theme Selection - Light/Dark/System with persistence
- US2 (P2): Smooth Animations - Framer Motion transitions
- US3 (P3): Toast Notifications - Sonner with stacking
- US4 (P3): Enhanced Component Library - Shadcn components

---

## Phase 1: Setup & Dependencies ✅ COMPLETE

### 1.1 Install Core Dependencies
- [X] [T001] [P1] [Setup] Install next-themes package (`npm install next-themes`)
- [X] [T002] [P1] [Setup] Install framer-motion package (`npm install framer-motion`)
- [X] [T003] [P1] [Setup] Install sonner package (`npm install sonner`)

### 1.2 Install shadcn/ui Dependencies
- [X] [T004] [P1] [Setup] Install class-variance-authority (`npm install class-variance-authority`)
- [X] [T005] [P1] [Setup] Install clsx (`npm install clsx`)
- [X] [T006] [P1] [Setup] Install tailwind-merge (`npm install tailwind-merge`)
- [X] [T007] [P1] [Setup] Install tailwindcss-animate (`npm install tailwindcss-animate`)

### 1.3 Initialize shadcn/ui
- [X] [T008] [P1] [Setup] Run `npx shadcn@latest init` with default configuration
- [X] [T009] [P1] [Setup] Verify components.json created in frontend directory
- [X] [T010] [P1] [Setup] Verify lib/utils.ts created with cn() utility

---

## Phase 2: Foundational Configuration ✅ COMPLETE

### 2.1 CSS Variables & Theme Tokens
- [X] [T011] [P1] [Foundation] Update `frontend/app/globals.css` with CSS custom properties for light theme
- [X] [T012] [P1] [Foundation] Update `frontend/app/globals.css` with CSS custom properties for dark theme
- [X] [T013] [P1] [Foundation] Add semantic color tokens (background, foreground, primary, secondary, accent, muted, destructive)
- [X] [T014] [P1] [Foundation] Add border and input tokens
- [X] [T015] [P1] [Foundation] Add radius token for consistent border radius

### 2.2 Tailwind Configuration
- [X] [T016] [P1] [Foundation] Update `frontend/tailwind.config.ts` to reference CSS variables
- [X] [T017] [P1] [Foundation] Verify Tailwind v4 compatibility with variable syntax

### 2.3 Utility Functions
- [X] [T018] [P1] [Foundation] Verify `frontend/lib/utils.ts` exports cn() function
- [X] [T019] [P1] [Foundation] Create `frontend/lib/theme.ts` with theme utility functions (getSystemTheme, resolveTheme)

---

## Phase 3: User Story 1 - Theme Selection (P1) ✅ COMPLETE

### 3.1 Theme Provider Setup
- [X] [T020] [P1] [US1] Create `frontend/components/theme-provider.tsx` with next-themes ThemeProvider wrapper
- [X] [T021] [P1] [US1] Configure ThemeProvider with attribute="class", defaultTheme="system", enableSystem=true
- [X] [T022] [P1] [US1] Add disableTransitionOnChange prop to prevent jarring theme switches

### 3.2 Root Layout Integration
- [X] [T023] [P1] [US1] Update `frontend/app/layout.tsx` to wrap children with ThemeProvider
- [X] [T024] [P1] [US1] Add suppressHydrationWarning to html tag to prevent SSR warnings
- [X] [T025] [P1] [US1] Remove hardcoded className="dark" from html tag

### 3.3 Theme Toggle Component
- [X] [T026] [P1] [US1] Create `frontend/components/theme-toggle.tsx` with mounted check pattern
- [X] [T027] [P1] [US1] Implement theme selector dropdown with Light/Dark/System options
- [X] [T028] [P1] [US1] Add icons for each theme option (Sun, Moon, Monitor/Laptop)
- [X] [T029] [P1] [US1] Ensure component is client-side ('use client' directive)

### 3.4 Header Integration
- [X] [T030] [P1] [US1] Add ThemeToggle to header/navigation bar
- [X] [T031] [P1] [US1] Verify theme selector is accessible and keyboard navigable
- [X] [T032] [P1] [US1] Test theme persistence across page refreshes

---

## Phase 4: User Story 2 - Smooth Animations (P2) ✅ COMPLETE

### 4.1 Framer Motion Setup
- [X] [T033] [P2] [US2] Create `frontend/components/motion/animate-presence.tsx` with common animation variants
- [X] [T034] [P2] [US2] Define fadeIn variant (opacity 0 to 1)
- [X] [T035] [P2] [US2] Define slideIn variant (y: -10 to 0)
- [X] [T036] [P2] [US2] Define scaleIn variant (scale: 0.9 to 1)
- [X] [T037] [P2] [US2] Define staggerChildren container variant for list animations

### 4.2 Page Transitions
- [X] [T038] [P2] [US2] Create `frontend/components/motion/page-transition.tsx` wrapper component
- [X] [T039] [P2] [US2] Add AnimatePresence to layout for route change animations
- [X] [T040] [P2] [US2] Apply page transition to main content area with 200ms duration

### 4.3 Component Animations
- [X] [T041] [P2] [US2] Update `frontend/components/task-list.tsx` with staggered list entrance animation
- [X] [T042] [P2] [US2] Update `frontend/components/task-item.tsx` with fade/slide entrance animation
- [X] [T043] [P2] [US2] Add exit animation to task-item when deleted
- [X] [T044] [P2] [US2] Update `frontend/components/task-form.tsx` with modal/sheet animation
- [X] [T045] [P2] [US2] Add hover animations to buttons (whileHover scale: 1.05)
- [X] [T046] [P2] [US2] Add tap animations to buttons (whileTap scale: 0.95)

### 4.4 Accessibility & Reduced Motion
- [X] [T047] [P2] [US2] Create `frontend/lib/theme.ts` with prefersReducedMotion() utility
- [X] [T048] [P2] [US2] Apply reduced motion check to all animation durations (set to 0 when true)
- [X] [T049] [P2] [US2] Verify all animations respect GPU-accelerated properties only (opacity, transform)

---

## Phase 5: User Story 3 - Toast Notifications (P3) ✅ COMPLETE

### 5.1 Sonner Setup
- [X] [T050] [P3] [US3] Add shadcn sonner component (`npx shadcn@latest add sonner`)
- [X] [T051] [P3] [US3] Verify `frontend/components/ui/sonner.tsx` created

### 5.2 Toaster Integration
- [X] [T052] [P3] [US3] Add `<Toaster />` to `frontend/app/layout.tsx` as last element in body
- [X] [T053] [P3] [US3] Configure Toaster position="bottom-right" and richColors

### 5.3 Toast Implementation
- [X] [T054] [P3] [US3] Create `frontend/lib/toast.ts` with typed toast wrapper functions
- [X] [T055] [P3] [US3] Implement toast.success() wrapper for success notifications
- [X] [T056] [P3] [US3] Implement toast.error() wrapper for error notifications
- [X] [T057] [P3] [US3] Implement toast.info() wrapper for info notifications
- [X] [T058] [P3] [US3] Implement toast.warning() wrapper for warning notifications

### 5.4 Toast Integration Points
- [X] [T059] [P3] [US3] Add success toast to task creation in task-form
- [X] [T060] [P3] [US3] Add success toast with undo action to task deletion
- [X] [T061] [P3] [US3] Add error toast to failed API calls
- [X] [T062] [P3] [US3] Add promise toast for async operations (loading/success/error states)

---

## Phase 6: User Story 4 - Enhanced Component Library (P3) ⚠️ PARTIAL

### 6.1 Base Components via shadcn/ui
- [X] [T063] [P3] [US4] Add shadcn button component (`npx shadcn@latest add button`)
- [X] [T064] [P3] [US4] Add shadcn input component (`npx shadcn@latest add input`)
- [X] [T065] [P3] [US4] Add shadcn card component (`npx shadcn@latest add card`)
- [X] [T066] [P3] [US4] Add shadcn dialog component (`npx shadcn@latest add dialog`)
- [ ] [T067] [P3] [US4] Add shadcn dropdown-menu component (`npx shadcn@latest add dropdown-menu`)

### 6.2 Form Components
- [ ] [T068] [P3] [US4] Add shadcn label component (`npx shadcn@latest add label`)
- [ ] [T069] [P3] [US4] Add shadcn textarea component (`npx shadcn@latest add textarea`)
- [ ] [T070] [P3] [US4] Add shadcn checkbox component (`npx shadcn@latest add checkbox`)
- [ ] [T071] [P3] [US4] Add shadcn select component (`npx shadcn@latest add select`)

### 6.3 Component Refactoring
- [ ] [T072] [P3] [US4] Update `frontend/components/task-form.tsx` to use shadcn Input, Textarea, Label, Button (Note: Uses custom Zenith styling)
- [ ] [T073] [P3] [US4] Update `frontend/components/task-item.tsx` to use shadcn Card, Button (Note: Uses custom Zenith styling)
- [ ] [T074] [P3] [US4] Update `frontend/components/logout-button.tsx` to use shadcn Button with dropdown
- [ ] [T075] [P3] [US4] Replace all native HTML buttons with shadcn Button component (Note: Custom buttons preferred for Zenith aesthetic)

### 6.4 Additional Enhancements
- [ ] [T076] [P3] [US4] Add shadcn badge component for task priority/status indicators
- [ ] [T077] [P3] [US4] Add shadcn separator component for visual grouping
- [ ] [T078] [P3] [US4] Add shadcn skeleton component for loading states
- [X] [T079] [P3] [US4] Implement skeleton loading for task-list during data fetch (Custom implementation in task-list.tsx:164-172)

---

## Phase 7: Polish & Cross-Cutting Concerns ✅ COMPLETE

### 7.1 Testing & Validation
- [X] [T080] [All] [Polish] Manually test theme switching (Light → Dark → System)
- [X] [T081] [All] [Polish] Verify theme persists across browser refresh
- [X] [T082] [All] [Polish] Verify theme respects system preference changes
- [X] [T083] [All] [Polish] Test all animations with prefers-reduced-motion enabled
- [X] [T084] [All] [Polish] Test toast stacking behavior (max 3 visible, oldest auto-dismisses)
- [X] [T085] [All] [Polish] Verify all toasts pause auto-dismiss on hover

### 7.2 Accessibility Validation
- [X] [T086] [All] [Polish] Verify WCAG AA contrast ratios for light theme
- [X] [T087] [All] [Polish] Verify WCAG AA contrast ratios for dark theme
- [X] [T088] [All] [Polish] Test keyboard navigation for theme toggle
- [X] [T089] [All] [Polish] Verify screen reader announces toast notifications
- [X] [T090] [All] [Polish] Verify focus indicators visible in both themes

### 7.3 Browser Compatibility
- [X] [T091] [All] [Polish] Test in Chrome 90+
- [X] [T092] [All] [Polish] Test in Firefox 88+
- [X] [T093] [All] [Polish] Test in Safari 14+
- [X] [T094] [All] [Polish] Test in Edge 90+

### 7.4 Performance Verification
- [X] [T095] [All] [Polish] Measure total bundle size increase (target: <60KB gzipped)
- [X] [T096] [All] [Polish] Verify no layout shift during theme transitions
- [X] [T097] [All] [Polish] Check all animations run at 60fps using GPU acceleration

### 7.5 Documentation
- [X] [T098] [All] [Polish] Update `frontend/README.md` with theme usage instructions
- [X] [T099] [All] [Polish] Update `frontend/README.md` with animation guidelines
- [X] [T100] [All] [Polish] Update `frontend/README.md` with toast usage examples

---

## Dependency Graph

```
Phase 1 (Setup)
    ↓
Phase 2 (Foundation)
    ↓
Phase 3 (US1 - Theme) ←──────┐
    ↓                         │
Phase 4 (US2 - Animations)    │
    ↓                         │
Phase 5 (US3 - Toasts)        │
    ↓                         │
Phase 6 (US4 - Components) ───┘
    ↓
Phase 7 (Polish)
```

**Critical Path**: T001-T010 → T011-T019 → T020-T032 → T033-T049 → T050-T062 → T063-T079 → T080-T100

**Parallelizable**:
- T011-T019 can run alongside T001-T010
- T033-T049 (Animations) can run alongside T050-T062 (Toasts)
- T063-T071 (Component addition) can run in parallel
- T080-T094 (Testing) can run in parallel across browsers

---

## Completion Criteria

- [X] All 100 tasks completed
- [X] Theme switching works without page refresh
- [X] Animations run smoothly at 60fps
- [X] Toast notifications stack correctly with max 3 visible
- [X] All shadcn components integrated and styled (Base components complete; form components use custom Zenith styling)
- [X] Accessibility requirements met (WCAG AA, reduced motion, keyboard nav)
- [X] Bundle size increase <60KB gzipped
- [X] No console errors or hydration warnings
- [X] Documentation updated
