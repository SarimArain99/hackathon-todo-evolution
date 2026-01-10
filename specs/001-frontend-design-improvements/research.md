# Research: Frontend Design Improvements

**Feature**: Frontend Design Improvements
**Date**: 2026-01-11
**Status**: Complete

## Overview

This document consolidates research findings for implementing the frontend design improvements. All technical decisions are based on Tailwind CSS v4, Next.js 16+, and modern accessibility standards.

---

## CSS Class Fixes

### Issue: Invalid Gradient Classes

**Problem**: Code uses `bg-linear-to-r` which is not valid Tailwind CSS syntax.

**Finding**: Tailwind CSS v4 uses `bg-gradient-to-r` for gradient backgrounds. The correct syntax pattern is:
- `bg-gradient-to-r` (left to right)
- `bg-gradient-to-l` (right to left)
- `bg-gradient-to-t` (bottom to top)
- `bg-gradient-to-b` (top to bottom)
- `bg-gradient-to-br` (top-left to bottom-right)

**From** (inline direction) and `via` (intermediate color) modifiers can be added for multi-stop gradients.

**Decision**: Replace all `bg-linear-to-*` with `bg-gradient-to-*`.

**Files Affected**:
- `frontend/app/page.tsx` (line 84)
- `frontend/app/(protected)/dashboard/dashboard-client.tsx` (line 98)
- `frontend/components/task-item.tsx` (line 96)

---

### Issue: Invalid Sizing Units

**Problem**: Code uses non-standard Tailwind classes like `min-h-75` and `w-27`.

**Finding**: Tailwind CSS v4 requires arbitrary values to be bracketed:
- `min-h-75` → `min-h-[18.75rem]` (75 * 0.25rem)
- `w-27` → `w-[108px]` or use standard spacing scale

**Standard Tailwind spacing scale** (in rem):
- `h-4` = 1rem, `h-6` = 1.5rem, `h-8` = 2rem, `h-12` = 3rem, `h-16` = 4rem
- For custom values, use bracket notation: `h-[value]`

**Decision**: Use bracket notation for arbitrary values or map to nearest standard class.

**Files Affected**:
- `frontend/app/(protected)/dashboard/task-list.tsx` (line 115)
- `frontend/components/theme-toggle.tsx` (line 26)

---

### Issue: Invalid CSS Color Values

**Problem**: `globals.css` has `oklch(0.205 0 0)` for Indigo 600, which is grayscale (C=0).

**Finding**: OKLCH format is `oklch(L C H)` where:
- L = lightness (0-1)
- C = chroma/colorfulness (0-0.4+)
- H = hue (0-360)

For Indigo 600 (purple-blue), valid values are approximately:
- `oklch(0.45 0.22 264)` or
- `oklch(0.455 0.24 264)`

**Alternative**: Use HSL format which is more widely supported:
- `hsl(234, 89%, 60%)` for Indigo 600

**Decision**: Use correct OKLCH values with chroma > 0 for brand colors.

**Files Affected**:
- `frontend/app/globals.css` (line 9)

---

## Accessibility Best Practices

### ARIA Labels for Icon-Only Buttons

**Standard**: All interactive elements with icons but no text must have `aria-label` or `aria-labelledby`.

**Pattern**:
```tsx
<button aria-label="Delete task" onClick={handleDelete}>
  <TrashIcon />
</button>
```

**For toggle buttons**, use `aria-pressed`:
```tsx
<button
  aria-label="Toggle theme"
  aria-pressed={isActive}
>
  {isActive ? <MoonIcon /> : <SunIcon />}
</button>
```

**Decision**: Add descriptive `aria-label` to all icon-only buttons. Use `aria-pressed` for toggle/active states.

**Files Affected**:
- All components with icon-only buttons
- Theme toggle (needs `aria-pressed`)

---

### Keyboard Navigation

**Standard**: All interactive elements must be keyboard accessible with visible focus states.

**Tailwind Focus Pattern**:
```tsx
className="focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 outline-none"
```

**For custom components**, ensure:
- `tabIndex` is properly set (0 for interactive, -1 for focusable but not in tab order)
- Focus styles are visible in both light and dark modes
- Enter/Space keys activate buttons and links

**Decision**: Verify all interactive elements have visible `focus:` classes.

---

## Design Tokens & Consistency

### Border Radius Scale

**Standard Tailwind Radius Values**:
| Class | Value | Use Case |
|-------|-------|----------|
| `rounded-sm` | 0.125rem | Small elements |
| `rounded` | 0.25rem | Default |
| `rounded-md` | 0.375rem | Medium |
| `rounded-lg` | 0.5rem | Large |
| `rounded-xl` | 0.75rem | Extra large |
| `rounded-2xl` | 1rem | Cards, buttons |
| `rounded-3xl` | 1.5rem | Large cards |

**Current Issues Found**:
- Mixed use of `rounded-2xl` (1rem) and `rounded-[2.5rem]`
- Some use `2.5rem` which is not on the standard scale

**Decision**: Standardize on:
- `rounded-xl` (0.75rem) for small elements
- `rounded-2xl` (1rem) for cards, buttons
- `rounded-3xl` (1.5rem) for large cards
- Remove arbitrary `rounded-[2.5rem]` → `rounded-3xl`

---

### Glassmorphism (Backdrop Blur)

**Standard Tailwind Blur Values**:
| Class | Blur Radius | Use Case |
|-------|-------------|----------|
| `backdrop-blur-sm` | 12px (0.75rem) | Subtle |
| `backdrop-blur` | 24px (1.5rem) | Default |
| `backdrop-blur-md` | 32px (2rem) | Medium |
| `backdrop-blur-lg` | 40px (2.5rem) | Strong |
| `backdrop-blur-xl` | 48px (3rem) | Extra strong |
| `backdrop-blur-2xl` | 64px (4rem) | Heavy |

**Current Issues Found**:
- Mixed `backdrop-blur-md`, `backdrop-blur-xl`, `backdrop-blur-2xl`

**Decision**:
- Cards: `backdrop-blur-xl`
- Overlays/modals: `backdrop-blur-2xl`
- Remove `backdrop-blur-md` for glass cards

---

### Button Hover Scale

**Standard Pattern**: Consistent micro-interaction scale of `1.01` (1%) or `1.02` (2%).

**Current Issues Found**:
- `scale-[1.03]` (3%) on landing page
- `scale-1.01` (1%) elsewhere

**Decision**: Standardize on `hover:scale-1.01` for all button hovers.

---

## UX Improvements

### Custom Confirmation Modal

**Problem**: Using browser `confirm()` is jarring and breaks design consistency.

**Pattern**: Use existing `ui/dialog.tsx` (shadcn/ui pattern) or create custom modal.

**Implementation**:
```tsx
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"

function ConfirmDeleteDialog({ isOpen, onClose, onConfirm, taskTitle }) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Task?</DialogTitle>
        </DialogHeader>
        <p>Are you sure you want to delete "{taskTitle}"? This action cannot be undone.</p>
        <DialogFooter>
          <button onClick={onClose}>Cancel</button>
          <button onClick={onConfirm} className="bg-rose-600">Delete</button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
```

**Decision**: Create reusable confirm dialog component. Replace `window.confirm()` in task-item.tsx.

---

### Logout with Router

**Problem**: Current logout uses `window.location.href = "/"` which causes hard reload.

**Pattern**: Use Next.js `useRouter` for smooth client-side navigation.

**Implementation**:
```tsx
import { useRouter } from "next/navigation"
import { signOut } from "@/lib/auth-client"

export function LogoutButton() {
  const router = useRouter()

  async function handleLogout() {
    await signOut()
    router.push("/") // Smooth navigation instead of hard reload
  }

  return <button onClick={handleLogout}>Sign Out</button>
}
```

**Decision**: Replace `window.location.href` with `router.push()`.

---

### Skeleton Loading States

**Pattern**: Use Framer Motion for animated skeleton or create simple skeleton component.

**Simple Skeleton**:
```tsx
function TaskSkeleton() {
  return (
    <div className="p-5 bg-white/40 rounded-2xl animate-pulse">
      <div className="flex gap-4">
        <div className="w-6 h-6 bg-gray-300 rounded" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-gray-300 rounded w-3/4" />
          <div className="h-3 bg-gray-300 rounded w-1/2" />
        </div>
      </div>
    </div>
  )
}
```

**Decision**: Add skeleton component. Show during `isLoading` state in task-list.

---

## Metadata & Configuration

### Production URLs

**Current**: Placeholder URLs like `https://your-zenith-app.com`

**Decision**: Update with actual Vercel deployment URL: `https://zenith-flow-zeta.vercel.app`

---

### Tech Stack Version Accuracy

**Current Claim**: "Next.js 15" on landing page
**Actual**: `next@16.1.1` per package.json

**Decision**: Update to "Next.js 16" for accuracy.

---

## Code Quality

### Console Logging

**Pattern**: Use environment-based logging.

```tsx
const isDev = process.env.NODE_ENV === "development"

function apiRequest<T>(...) {
  if (isDev) {
    console.log(`API Request: ${options.method || "GET"} ${API_URL}${endpoint}`)
  }
  // ... rest of function
}
```

**Decision**: Wrap console logs in development check or remove entirely.

---

## References

- Tailwind CSS v4 Documentation: https://tailwindcss.com/docs
- WCAG 2.1 Level AA: https://www.w3.org/WAI/WCAG21/quickref/
- Next.js 16 Documentation: https://nextjs.org/docs
- Framer Motion: https://www.framer.com/motion/
