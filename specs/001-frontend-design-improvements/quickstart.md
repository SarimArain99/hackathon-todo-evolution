# Quickstart: Frontend Design Improvements

**Feature**: Frontend Design Improvements
**Date**: 2026-01-11

## Prerequisites

- Node.js 18+ installed
- Frontend dependencies installed (`cd frontend && npm install`)
- Git branch checked out: `001-frontend-design-improvements`

## Development Workflow

### 1. Start Development Server

```bash
cd frontend
npm run dev
```

Server runs at `http://localhost:3000`

### 2. Run Type Checking

```bash
cd frontend
npx tsc --noEmit
```

### 3. Build for Production

```bash
cd frontend
npm run build
```

## File Modification Checklist

### Phase 1: CSS Fixes (Priority P1)

| File | Line(s) | Change |
|------|---------|--------|
| `app/page.tsx` | 84 | `bg-linear-to-r` → `bg-gradient-to-r` |
| `app/(protected)/dashboard/dashboard-client.tsx` | 98 | `bg-linear-to-r` → `bg-gradient-to-r` |
| `components/task-item.tsx` | 96 | `bg-linear-to-b` → `bg-gradient-to-b` |
| `components/task-list.tsx` | 115 | `min-h-75` → `min-h-[18.75rem]` |
| `components/theme-toggle.tsx` | 26 | `w-27` → `w-[108px]` |
| `app/globals.css` | 9 | Fix OKLCH color value for Indigo 600 |

### Phase 2: Accessibility (Priority P1)

| File | Change |
|------|--------|
| `components/task-item.tsx` | Add `aria-label` to edit/delete buttons |
| `components/task-list.tsx` | Add `aria-label` to filter dropdowns |
| `components/theme-toggle.tsx` | Add `aria-pressed` to theme buttons |

### Phase 3: Design Consistency (Priority P2)

| File | Change |
|------|--------|
| All components | Replace `rounded-[2.5rem]` with `rounded-3xl` |
| All components | Standardize `backdrop-blur-xl` for cards |
| All components | Standardize `hover:scale-1.01` for buttons |

### Phase 4: UX Improvements (Priority P2)

| File | Change |
|------|--------|
| `components/task-item.tsx` | Replace `confirm()` with custom modal |
| `components/logout-button.tsx` | Use `router.push()` instead of `window.location.href` |
| `components/task-list.tsx` | Add skeleton loading component |

### Phase 5: Metadata (Priority P3)

| File | Change |
|------|--------|
| `app/layout.tsx` | Update `metadataBase` URL |
| `app/page.tsx` | Update "Next.js 15" → "Next.js 16" |
| `lib/api.ts` | Remove or conditionally wrap console logs |

## Testing Checklist

- [ ] Visual: Gradients display correctly on landing page
- [ ] Visual: Dashboard separator gradient displays
- [ ] Visual: Overdue task indicator gradient displays
- [ ] Visual: Theme toggle has correct width
- [ ] A11y: All icon buttons have aria-labels
- [ ] A11y: Keyboard navigation works throughout
- [ ] A11y: Screen reader announces theme state
- [ ] Consistency: Border radii are uniform
- [ ] Consistency: Glass effects use consistent blur
- [ ] UX: Custom modal appears on delete
- [ ] UX: Logout uses smooth router navigation
- [ ] UX: Skeleton shows during loading
- [ ] Build: TypeScript compilation succeeds
- [ ] Build: Production build succeeds

## Verification Commands

```bash
# Type check
cd frontend && npx tsc --noEmit

# Build check
cd frontend && npm run build

# Run linter (if configured)
cd frontend && npm run lint
```

## Notes

- No backend changes required
- No database migrations needed
- All changes are frontend-only
- Existing functionality must be preserved
