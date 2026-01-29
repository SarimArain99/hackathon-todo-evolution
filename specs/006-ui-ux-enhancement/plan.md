# Implementation Plan: UI/UX Enhancement

**Branch**: `002-ui-ux-enhancement` | **Date**: 2026-01-09 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/002-ui-ux-enhancement/spec.md`

## Summary

Enhance the Task Evolution web application (branded as **Zenith**) with modern UI/UX features including:
1. **Theme Management** - Light/Dark/System theme switching with persistent storage
2. **Animations** - Smooth transitions using Framer Motion for list items, page transitions, and micro-interactions
3. **Toast Notifications** - Shadcn/Sonner toasts for success/error feedback with stacking and undo actions
4. **Component System** - Consistent UI components (buttons, inputs, cards, dialogs) via Shadcn/UI

**IMPORTANT**: This enhancement MUST preserve the existing Zenith design aesthetic (glassmorphism, indigo/purple brand colors, specific typography and spacing).

## Technical Context

**Language/Version**: TypeScript 5+, React 19, Next.js 16.1.1
**Primary Dependencies**:
- `next-themes` - Theme provider and hooks
- `framer-motion` - Animation library
- `sonner` - Toast notifications
- `@radix-ui/*` - Headless UI primitives (via shadcn/ui)
- `tailwindcss` v4 - Styling

**Storage**: localStorage (client-side theme preference)
**Testing**: Vitest + Testing Library (frontend)
**Target Platform**: Modern browsers (Chrome 90+, Firefox 88+, Safari 14+, Edge 90+)
**Project Type**: Web application (Next.js App Router)
**Performance Goals**:
- Theme switch: <100ms (SC-001)
- Page transitions: <300ms (SC-003)
- List animations: <200ms (SC-004)
- Toast appearance: <50ms (SC-005)

**Constraints**:
- WCAG AA contrast ratios (4.5:1 for text)
- Support `prefers-reduced-motion`
- Zero layout shifts during theme transitions
- Maximum 3 visible toasts simultaneously
- **PRESERVE ZENITH DESIGN AESTHETIC**

**Scale/Scope**:
- Single-page application with authenticated routes
- ~5 core components to enhance
- 4 user stories across 2 priorities (P1-P2)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| **Spec-Driven Development** | ✅ PASS | Spec complete with 4 user stories, 20 FRs, 10 SCs |
| **Skills & Subagents First** | ✅ PASS | Context7 queried for framer-motion, shadcn/ui, next-themes |
| **Technology Constraints** | ✅ PASS | Next.js 15+, TypeScript, Tailwind CSS - all compliant |
| **Clean Architecture** | ✅ PASS | Components in `/components`, lib in `/lib`, App Router structure |
| **TypeScript Strict Mode** | ✅ PASS | All new components will use strict types |
| **No Manual Coding** | ✅ PASS | Plan will drive /sp.implement, not manual edits |

**Re-check Post-Design**: No changes to constitution compliance.

## Project Structure

### Documentation (this feature)

```text
specs/002-ui-ux-enhancement/
├── plan.md              # This file
├── research.md          # Phase 0: Technology research and decisions
├── data-model.md        # Phase 1: Client-side state model
├── quickstart.md        # Phase 1: Developer setup guide
├── contracts/           # Phase 1: Component contracts
│   ├── theme-provider.md
│   ├── theme-toggle.md
│   ├── toast-system.md
│   ├── animations.md
│   └── design-system.md  # NEW: Zenith design system reference
└── tasks.md             # Phase 2: /sp.tasks output
```

### Source Code (repository root)

```text
frontend/
├── app/
│   ├── layout.tsx              # Add ThemeProvider wrapper
│   ├── globals.css             # Already has Zenith color tokens
│   ├── (auth)/                 # Auth pages (already use dark: prefix)
│   └── (protected)/
│       ├── layout.tsx          # Add header with theme toggle
│       └── dashboard/          # Dashboard pages
├── components/
│   ├── ui/                     # NEW: Shadcn components
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── card.tsx
│   │   ├── dialog.tsx
│   │   ├── sonner.tsx          # Toast component
│   │   └── theme-toggle.tsx    # Theme selector (NEW)
│   ├── task-form.tsx           # EXISTING: Enhance with animations
│   ├── task-list.tsx           # EXISTING: Enhance with Framer Motion
│   └── task-item.tsx           # EXISTING: Enhance with animations
├── lib/
│   ├── theme.ts                # NEW: Theme utilities
│   └── api.ts                  # EXISTING: Add toast triggers
└── package.json                # Add new dependencies
```

**Structure Decision**: Web application structure (frontend + backend). Theme and animation work is entirely frontend - no backend changes required. All state is client-side (localStorage for theme, React state for notifications).

---

## ZENITH DESIGN SYSTEM

**CRITICAL**: The following design system MUST be preserved during implementation. All new components (shadcn/ui) should be configured to match this aesthetic.

### Brand Identity

- **Product Name**: Zenith
- **Typography**: Inter (from `--font-sans`)
- **Primary Color**: Indigo 600 (#4f46e5)
- **Secondary Color**: Purple 600 (#9333ea)

### Existing Color Tokens (from globals.css)

**Light Mode** (currently unused, will be activated):
```css
--background: #f8fafc;    /* Slate 50 */
--foreground: #0f172a;    /* Slate 900 */
--primary: #4f46e5;       /* Indigo 600 */
--secondary: #9333ea;     /* Purple 600 */
--glass-bg: rgba(255, 255, 255, 0.4);
--glass-border: rgba(255, 255, 255, 0.2);
```

**Dark Mode** (currently active via className="dark"):
```css
--background: #020617;    /* Slate 950 */
--foreground: #f1f5f9;    /* Slate 100 */
--glass-bg: rgba(15, 23, 42, 0.4);
--glass-border: rgba(255, 255, 255, 0.05);
```

### Design Patterns

#### 1. Glassmorphism Cards
**Pattern**: Used for all container components (forms, task items, auth pages)
```tsx
className="bg-white/40 dark:bg-gray-900/40 backdrop-blur-2xl border border-white/20 dark:border-gray-800/50"
```

#### 2. Border Radius System
| Element | Radius | Tailwind Class |
|---------|--------|----------------|
| Inputs, small buttons | 16px | `rounded-2xl` |
| Cards, main containers | 24px | `rounded-3xl` |
| Auth cards (mobile) | 32px | `rounded-4xl` (sm) → `rounded-3xl` (desktop) |

#### 3. Primary Button Style
**Zenith signature button** (used in auth pages, task form):
```tsx
className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold
           rounded-2xl shadow-lg shadow-indigo-500/30
           transition-all duration-300
           transform hover:scale-[1.01] active:scale-[0.98]"
```

#### 4. Input Fields
**Consistent input styling**:
```tsx
className="w-full px-4 py-3 sm:py-3.5 rounded-2xl
           border border-gray-200 dark:border-gray-700
           bg-white/50 dark:bg-gray-800/50
           text-gray-900 dark:text-white
           focus:ring-2 focus:ring-indigo-500 outline-none
           transition-all"
```

#### 5. Typography Scale
| Element | Size | Weight | Tracking |
|---------|------|--------|----------|
| Page titles | 2xl/3xl | Bold | tracking-tight |
| Labels | xs/sm | Semibold | - |
| Uppercase headers | xs/10px | Black | tracking-[0.2em] |
| Body text | sm/base | Medium | - |

#### 6. Decorative Elements
**Auth page background blobs** (create ambient color):
```tsx
<div className="absolute top-[-5%] right-[-10%] w-[70%] sm:w-[50%] h-[40%]
            rounded-full bg-indigo-400/20 blur-[80px] sm:blur-[120px]
            pointer-events-none" />
<div className="absolute bottom-[-5%] left-[-10%] w-[70%] sm:w-[50%] h-[40%]
            rounded-full bg-purple-400/20 blur-[80px] sm:blur-[120px]
            pointer-events-none" />
```

#### 7. Priority Color System
| Priority | Background | Text | Border |
|----------|------------|------|--------|
| Low | `bg-emerald-500/10` | `text-emerald-600` | `border-emerald-500/20` |
| Medium | `bg-amber-500/10` | `text-amber-600` | `border-amber-500/20` |
| High | `bg-rose-500/10` | `text-rose-600` | `border-rose-500/20` |

### Theme Compatibility Note

**GOOD NEWS**: All existing components already use Tailwind's `dark:` prefix. This means they will automatically support theme switching once:
1. The hardcoded `className="dark"` is removed from `app/layout.tsx`
2. The `ThemeProvider` from next-themes is added

Files confirmed compatible:
- ✅ `app/(auth)/sign-in/page.tsx` - Uses `dark:` throughout
- ✅ `app/(auth)/sign-up/page.tsx` - Uses `dark:` throughout
- ✅ `components/task-form.tsx` - Uses `dark:` throughout
- ✅ `components/task-item.tsx` - Uses `dark:` throughout
- ✅ `components/task-list.tsx` - Uses `dark:` throughout

---

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| N/A | No violations | All work follows existing patterns and constitution principles |

---

## Phase 0: Research & Decisions

### Technology Decisions

**Theme Management**: `next-themes`
- **Decision**: Use next-themes for theme provider and `useTheme` hook
- **Rationale**: Purpose-built for Next.js, handles SSR/hydration, prevents flash of wrong theme, supports system preference detection
- **Alternatives Considered**:
  - Manual CSS variables + localStorage: Re-inventing the wheel, hydration issues
  - Custom React Context: Requires careful SSR handling

**Animations**: `framer-motion`
- **Decision**: Use framer-motion for all animations
- **Rationale**: Declarative API, excellent React integration, AnimatePresence for exit animations, built-in gesture support, respects `prefers-reduced-motion`
- **Alternatives Considered**:
  - CSS transitions only: Limited for complex sequences, no exit animations
  - React Transition Group: Less feature-rich, smaller ecosystem

**Toast Notifications**: `sonner` (via shadcn/ui)
- **Decision**: Use sonner library with shadcn/ui wrapper
- **Rationale**: Lightweight, Promise support, excellent DX, stacks automatically, dismissible on hover, action buttons built-in
- **Alternatives Considered**:
  - react-hot-toast: Similar features, less active maintenance
  - react-toastify: Heavier bundle, more configuration needed

**Component System**: `shadcn/ui`
- **Decision**: Copy shadcn/ui components for buttons, inputs, cards, dialogs
- **Rationale**: Not a library but code you own, based on Radix UI (accessible), Tailwind-based (matches our stack), TypeScript first
- **Alternatives Considered**:
  - Chakra UI: Larger bundle, opinionated theming
  - Mantine: Heavy, more dependencies

### Bundle Size Considerations

| Package | Size (gzipped) | Notes |
|---------|----------------|-------|
| framer-motion | ~38KB | Largest dependency, but powerful |
| sonner | ~3KB | Very small |
| next-themes | ~2KB | Minimal |
| @radix-ui/* | ~10KB total | Required by shadcn, tree-shakeable |

**Total addition**: ~53KB gzipped for all UI/UX enhancements

---

## Phase 1: Design & Contracts

### Data Model (Client-Side State)

See [data-model.md](./data-model.md) for detailed entity definitions.

**Key Entities**:
1. **ThemePreference** - Stored in localStorage
2. **NotificationState** - In-memory React state (no persistence needed)

### Component Contracts

See `/contracts/` directory for detailed component interfaces.

#### 1. ThemeProvider Contract

**Location**: `app/layout.tsx` (wrap existing layout)

**Props**: None (wraps entire app)

**Behavior**:
- Reads theme from localStorage on mount
- Falls back to system preference via `matchMedia`
- Applies `dark` class to `<html>` element when dark theme active
- Listens for system preference changes (media query listener)
- No flash of wrong theme (suppressHydrationWarning on html)

**API Surface**:
```typescript
// Available to consumers via useTheme hook
interface ThemeContextValue {
  theme: 'light' | 'dark' | 'system'
  setTheme: (theme: 'light' | 'dark' | 'system') => void
  resolvedTheme: 'light' | 'dark'  // Actual applied theme
}
```

#### 2. ThemeToggle Contract

**Location**: `components/ui/theme-toggle.tsx`

**Props**: None

**Behavior**:
- Displays dropdown or button group with 3 options: Light, Dark, System
- Shows current selection with visual indicator
- Updates theme via `setTheme()` from next-themes
- Renders in header (per clarification)

#### 3. Toaster Contract

**Location**: `components/ui/sonner.tsx` (shadcn component)

**Props**: None (placed once in layout)

**Behavior**:
- Renders fixed-position container (typically bottom-right)
- Manages notification queue (max 3 visible)
- Auto-dismisses after duration (default 4000ms)
- Pauses auto-dismiss on hover
- Supports action buttons (Undo, etc.)

**API Surface**:
```typescript
// Usage from anywhere in app
import { toast } from 'sonner'

toast(message: string, options?: {
  description?: string
  action?: {
    label: string
    onClick: () => void
  }
  duration?: number
})
```

#### 4. Animation Contracts

**List Item Animations**:
- Uses `AnimatePresence` + `motion.div` wrapper
- `initial`: { opacity: 0, y: -10 }
- `animate`: { opacity: 1, y: 0 }
- `exit`: { opacity: 0, x: -100 }
- `transition`: { duration: 0.2 }

**Page Transitions**:
- Uses template-based route animation
- `initial`: { opacity: 0 }
- `animate`: { opacity: 1 }
- `exit`: { opacity: 0 }
- `transition`: { duration: 0.3 }

**Reduced Motion**:
- Detects via `window.matchMedia('(prefers-reduced-motion: reduce)')`
- Falls back to instant transitions (duration: 0)

---

## Phase 2: Implementation Overview

### Implementation Sequence

**Priority 1: Theme System (P1)**
1. Install dependencies (`next-themes`)
2. Create `components/theme-provider.tsx`
3. Update `app/layout.tsx` with ThemeProvider
4. Remove hardcoded `className="dark"` from html tag
5. Create `components/ui/theme-toggle.tsx`
6. Add theme toggle to header in `(protected)/layout.tsx`

**Priority 2: Animations (P2)**
1. Install `framer-motion`
2. Create `components/motion/animate-presence.tsx` (wrapper)
3. Update `components/task-list.tsx` with list animations
4. Update `components/task-item.tsx` with exit animations
5. Create `components/motion/page-transition.tsx`
6. Add page transitions to layout

**Priority 3: Toast Notifications (P3)**
1. Install `sonner`
2. Run `npx shadcn@latest add sonner`
3. Add `<Toaster />` to `app/layout.tsx`
4. Update `components/task-form.tsx` to trigger toasts
5. Update `lib/api.ts` with toast helpers

**Priority 4: Component System (P3)**
1. Run `npx shadcn@latest add button input card dialog`
2. **CUSTOMIZE shadcn components to match Zenith aesthetic**
3. Update existing components to use shadcn variants
4. Ensure consistent styling across all components

### Migration Notes

**No Breaking Changes**: All enhancements are additive. Existing components work as-is during migration.

**Staged Rollout**: Can implement by user story priority. Theme system (P1) can ship independently before animations (P2).

---

## Testing Strategy

### Unit Tests
- Theme toggle component: Verifies `setTheme` called with correct value
- Toast helpers: Verifies `toast()` called with correct options

### Integration Tests
- Theme persistence: Verify localStorage read/write
- System preference: Simulate media query change
- Notification queue: Trigger rapid toasts, verify max 3 visible

### Visual Regression
- Screenshot tests for light/dark themes
- Animation timing verification (manual)

### Accessibility Tests
- Keyboard navigation for theme toggle
- Screen reader announcements for toasts
- Contrast ratio validation (automated)

---

## Success Criteria Validation

| Criterion | How to Verify |
|-----------|---------------|
| SC-001: Theme switch <100ms | Performance.mark() around theme change |
| SC-002: 100% persistence | Reload page, verify theme persists |
| SC-003: Page transitions <300ms | Measure Framer Motion transition duration |
| SC-004: List animations <200ms | Configure Framer Motion with max duration |
| SC-005: Toasts <50ms | Toast fires immediately on action, async render |
| SC-006: Visible focus states | Manual test with Tab navigation |
| SC-007: Functional without animations | Test with `prefers-reduced-motion` |
| SC-008: WCAG AA contrast | Automated axe-core tests |
| SC-009: Zero layout shifts | CLS metric in Lighthouse |
| SC-010: 95% find theme in 10s | User testing or heuristic evaluation |

---

## Dependencies Required

```json
{
  "dependencies": {
    "next-themes": "^0.4.0",
    "framer-motion": "^11.0.0",
    "sonner": "^1.5.0"
  },
  "devDependencies": {
    "@radix-ui/react-dialog": "^1.1.0",
    "@radix-ui/react-slot": "^1.1.0",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.1.0",
    "tailwind-merge": "^2.5.0"
  }
}
```

---

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Animation performance on low-end | Use `transform`/`opacity` only, GPU-accelerated |
| Bundle size increase | Code splitting, tree-shaking, consider loading animations lazily |
| Theme flash on navigation | next-themes handles this with suppressHydrationWarning |
| Framer Motion hydration errors | Use mounted check pattern, client-only components |
| Shadcn setup complexity | Use CLI (`npx shadcn@latest add`) |
| **Zenith aesthetic not preserved** | **Create design-system.md contract; customize all shadcn components** |

---

## Next Steps

1. ✅ Research complete (original plan)
2. ✅ Design system documented (this refinement)
3. ⏭️ Run `/sp.implement` to generate code

**NEW**: Added Zenith design system section to ensure existing aesthetic is preserved during implementation.
