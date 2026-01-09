# Design System Contract: Zenith

**Feature**: 002-ui-ux-enhancement
**Status**: Active
**Last Updated**: 2026-01-09

## Overview

This document defines the **Zenith** design system that MUST be preserved during the UI/UX enhancement implementation. All new components (especially shadcn/ui) should be customized to match this aesthetic.

---

## Brand Identity

| Property | Value | Source |
|----------|-------|--------|
| **Product Name** | Zenith | Across all auth pages and dashboard |
| **Typography** | Inter | `--font-sans` from globals.css |
| **Primary Color** | Indigo 600 (#4f46e5) | `--primary` CSS variable |
| **Secondary Color** | Purple 600 (#9333ea) | `--secondary` CSS variable |

---

## Color Tokens

### Light Mode (from globals.css)

```css
--background: #f8fafc;    /* Slate 50 */
--foreground: #0f172a;    /* Slate 900 */
--primary: #4f46e5;       /* Indigo 600 */
--secondary: #9333ea;     /* Purple 600 */
--glass-bg: rgba(255, 255, 255, 0.4);
--glass-border: rgba(255, 255, 255, 0.2);
```

### Dark Mode (from globals.css)

```css
--background: #020617;    /* Slate 950 */
--foreground: #f1f5f9;    /* Slate 100 */
--glass-bg: rgba(15, 23, 42, 0.4);
--glass-border: rgba(255, 255, 255, 0.05);
```

### Usage Pattern
All components use Tailwind's `dark:` prefix for theme switching:
```tsx
className="bg-white/40 dark:bg-gray-900/40 ..."
```

---

## Design Patterns

### 1. Glassmorphism Cards

**Used for**: All container components (forms, task items, auth pages, filter bars)

**Pattern**:
```tsx
className="bg-white/40 dark:bg-gray-900/40 backdrop-blur-2xl
           border border-white/20 dark:border-gray-800/50"
```

**Components using this**:
- `sign-in/page.tsx` - Main card
- `sign-up/page.tsx` - Main card
- `task-form.tsx` - Form container
- `task-item.tsx` - Individual task cards
- `task-list.tsx` - Filter bar

### 2. Border Radius System

| Element | Radius | Tailwind Class | Example Usage |
|---------|--------|----------------|---------------|
| Inputs | 16px | `rounded-2xl` | Email, password inputs |
| Buttons (primary) | 16px | `rounded-2xl` | Sign in, create task buttons |
| Cards | 24px | `rounded-3xl` | Task form, task items |
| Auth cards (mobile) | 32px | `rounded-4xl` | Sign-in/up cards (sm only) |
| Checkbox | 12px | `rounded-xl` | Task completion checkbox |

### 3. Primary Button (Zenith Signature)

**The distinctive Zenith button style**:
```tsx
className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold
           rounded-2xl shadow-lg shadow-indigo-500/30
           transition-all duration-300
           transform hover:scale-[1.01] active:scale-[0.98]"
```

**Interactive states**:
- `hover:bg-indigo-700` - Slightly darker on hover
- `hover:scale-[1.01]` - Subtle grow effect
- `active:scale-[0.98]` - Shrink on click/tap
- `shadow-lg shadow-indigo-500/30` - Colored glow shadow

**Variants**:
```tsx
// Secondary / Cancel button
className="bg-white/10 dark:bg-gray-800/40 backdrop-blur-md
           border border-white/20 dark:border-gray-800/50
           text-gray-700 dark:text-gray-300 font-bold rounded-2xl
           hover:bg-white/20 dark:hover:bg-gray-700/60"
```

### 4. Input Fields

**Consistent input styling across all forms**:
```tsx
className="w-full px-4 py-3 sm:py-3.5 rounded-2xl
           border border-gray-200 dark:border-gray-700
           bg-white/50 dark:bg-gray-800/50
           text-gray-900 dark:text-white
           focus:ring-2 focus:ring-indigo-500 outline-none
           transition-all placeholder:text-gray-400"
```

**Key characteristics**:
- Padding: `px-4 py-3` (mobile) → `py-3.5` (desktop)
- Border: `border-gray-200 dark:border-gray-700`
- Background: Semi-transparent for glass effect
- Focus: `focus:ring-2 focus:ring-indigo-500`

### 5. Typography Scale

| Element | Size | Weight | Tracking | Line Height |
|---------|------|--------|----------|-------------|
| Page titles | `text-2xl sm:text-3xl` | Bold | `tracking-tight` | Leading-tight |
| Labels | `text-xs sm:text-sm` | Semibold | - | - |
| Uppercase headers | `text-xs text-[10px]` | Black | `tracking-[0.2em]` | - |
| Body text | `text-sm sm:text-base` | Medium | - | `leading-relaxed` |

**Font family**: Inter (from Geist Sans fallback chain)

### 6. Decorative Background Elements

**Ambient color blobs** (auth pages):
```tsx
// Top-right indigo blob
<div className="absolute top-[-5%] right-[-10%] w-[70%] sm:w-[50%] h-[40%]
            rounded-full bg-indigo-400/20 blur-[80px] sm:blur-[120px]
            pointer-events-none" />

// Bottom-left purple blob
<div className="absolute bottom-[-5%] left-[-10%] w-[70%] sm:w-[50%] h-[40%]
            rounded-full bg-purple-400/20 blur-[80px] sm:blur-[120px]
            pointer-events-none" />
```

**Gradient mesh** (globals.css body background):
```css
background-image:
  radial-gradient(at 0% 0%, rgba(79, 70, 229, 0.05) 0px, transparent 50%),
  radial-gradient(at 100% 100%, rgba(147, 51, 234, 0.05) 0px, transparent 50%);
background-attachment: fixed;
```

### 7. Priority Color System

| Priority | Background | Text | Border | Used In |
|----------|------------|------|--------|---------|
| Low | `bg-emerald-500/10` | `text-emerald-600 dark:text-emerald-400` | `border-emerald-500/20` | task-item.tsx |
| Medium | `bg-amber-500/10` | `text-amber-600 dark:text-amber-400` | `border-amber-500/20` | task-item.tsx |
| High | `bg-rose-500/10` | `text-rose-600 dark:text-rose-400` | `border-rose-500/20` | task-item.tsx |
| Overdue | `bg-rose-500/10` | `text-rose-600` | `border-rose-500/20` | task-item.tsx |

---

## Component Customization Guide

When adding shadcn/ui components, customize them to match Zenith:

### Button Component

**After running** `npx shadcn@latest add button`, modify `components/ui/button.tsx`:

```tsx
// Add Zenith variants to buttonVariants
const buttonVariants = cva(
  // ... base classes
  {
    variants: {
      variant: {
        default: 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/30',
        destructive: 'bg-rose-600 hover:bg-rose-700 text-white',
        outline: 'border border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50',
        ghost: 'hover:bg-white/10 dark:hover:bg-gray-800/40',
        link: 'text-indigo-600 dark:text-indigo-400 underline-offset-4 hover:underline',
      },
      // ... sizes
    },
  }
);
```

### Input Component

**After running** `npx shadcn@latest add input`, modify `components/ui/input.tsx`:

```tsx
// Use Zenith input styling
<input
  className={cn(
    "flex h-10 w-full rounded-2xl border border-gray-200 dark:border-gray-700",
    "bg-white/50 dark:bg-gray-800/50",
    "px-4 py-3 text-sm",
    "text-gray-900 dark:text-white",
    "focus:ring-2 focus:ring-indigo-500 focus-visible:ring-indigo-500",
    "outline-none transition-all",
    className
  )}
  {...props}
/>
```

### Card Component

**After running** `npx shadcn@latest add card`, modify `components/ui/card.tsx`:

```tsx
// Use Zenith glassmorphism
const Card = React.forwardRef<
  HTMLDivElement,
  React.CardProps
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "rounded-3xl",
      "bg-white/40 dark:bg-gray-900/40 backdrop-blur-2xl",
      "border border-white/20 dark:border-gray-800/50",
      "shadow-xl",
      className
    )}
    {...props}
  />
));
```

---

## Spacing System

| Context | Mobile | Tablet | Desktop |
|---------|--------|--------|---------|
| Card padding | `p-6` | `p-8` | `p-10` |
| Form gaps | `space-y-4` | `space-y-5` | `space-y-5` |
| Section spacing | `mb-6` | `mb-8` | `mb-10` |
| Button padding | `py-3.5 px-6` | `py-4 px-6` | `py-4 px-6` |

---

## Responsive Breakpoints

| Breakpoint | Width | Usage |
|------------|-------|-------|
| `sm` | 640px | Adjust padding, show hidden elements |
| `md` | 768px | Stack to side-by-side layouts |
| `lg` | 1024px | Dashboard grid, reorder columns |
| `xs` (custom) | ~480px | Very small mobile optimizations |

---

## Accessibility Requirements

- **WCAG AA contrast**: 4.5:1 for normal text
- **Focus states**: `focus:ring-2 focus:ring-indigo-500` on all interactive elements
- **Reduced motion**: Respect `prefers-reduced-motion`
- **Keyboard navigation**: All actions accessible via Tab

---

## Animation Timing

| Type | Duration | Easing | Usage |
|------|----------|--------|-------|
| Button hover | 300ms | ease-out | `transition-all duration-300` |
| Scale effects | 300ms | ease-out | `hover:scale-[1.01]` |
| Page transitions | <300ms | - | Framer Motion |
| List items | <200ms | - | Framer Motion |

---

## Files Reference

| File | Purpose |
|------|---------|
| `frontend/app/globals.css` | CSS variables, global styles |
| `frontend/app/layout.tsx` | Root layout with fonts |
| `frontend/app/(auth)/sign-in/page.tsx` | Auth page example |
| `frontend/app/(auth)/sign-up/page.tsx` | Auth page example |
| `frontend/components/task-form.tsx` | Form component example |
| `frontend/components/task-item.tsx` | Card component example |
| `frontend/components/task-list.tsx` | Filter bar example |
