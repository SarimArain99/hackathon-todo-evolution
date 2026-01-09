# Data Model: UI/UX Enhancement

**Feature**: 002-ui-ux-enhancement
**Date**: 2026-01-08
**Phase**: 1 - Design & Contracts

## Overview

This feature is entirely client-side. No backend schema changes required. All state is managed in the browser.

---

## 1. ThemePreference Entity

**Storage**: localStorage (managed by next-themes)
**Key**: `theme`

### Schema

```typescript
type ThemeValue = 'light' | 'dark' | 'system';

interface ThemePreference {
  value: ThemeValue;
  timestamp: number;      // Last change timestamp (ISO string)
  userAgent?: string;     // Optional: browser user agent
}
```

### Lifecycle

| Event | Action |
|-------|--------|
| **Initial Load** | Read from localStorage, fall back to `matchMedia('(prefers-color-scheme: dark)')` |
| **User Change** | Write to localStorage, apply theme immediately |
| **System Change** | If value is 'system', re-evaluate `matchMedia`, update applied theme |
| **Clear Storage** | Fall back to 'system' (default) |

### Persistence

- **Storage Medium**: Browser localStorage
- **Key**: `theme` (set by next-themes)
- **Default**: `'system'` (per spec assumption)
- **Sync**: No cross-tab sync needed (localStorage is per-origin)

---

## 2. NotificationState Entity

**Storage**: In-memory React state (no persistence)
**Manager**: sonner library

### Schema

```typescript
type NotificationVariant = 'success' | 'error' | 'info' | 'warning';

interface Notification {
  id: string;                  // Auto-generated UUID
  variant: NotificationVariant;
  title: string;
  description?: string;
  duration: number;            // Milliseconds before auto-dismiss
  action?: NotificationAction;
  timestamp: number;
}

interface NotificationAction {
  label: string;
  onClick: () => void;
}
```

### Queue State

```typescript
interface NotificationQueue {
  active: Notification[];      // Currently visible (max 3)
  pending: Notification[];     // Waiting to display
  dismissed: string[];         // IDs of dismissed notifications
}
```

### Lifecycle

| Event | Action |
|-------|--------|
| **Trigger** | Add to queue, display if slots available |
| **Full Queue** | Oldest notification auto-dismisses when new arrives |
| **User Dismiss** | Remove from active, show next pending |
| **Auto-Dismiss** | After duration expires, remove from active |
| **Hover Pause** | Pause auto-dismiss timer while hovering |
| **Action Click** | Execute action callback, dismiss notification |

### Constraints

- **Max Visible**: 3 (per spec clarification)
- **Default Duration**: 4000ms
- **Position**: Bottom-right corner
- **Stack Order**: Newest at bottom

---

## 3. AnimationState Entity

**Storage**: In-memory React state (framer-motion internal)

### Schema

```typescript
type AnimationState = 'idle' | 'entering' | 'entered' | 'exiting' | 'exited';

interface ElementAnimation {
  elementId: string;
  state: AnimationState;
  duration: number;            // Milliseconds
  easing: string;              // CSS easing function
  prefersReducedMotion: boolean; // From matchMedia
}
```

### Reduced Motion Detection

```typescript
const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
const prefersReducedMotion = mediaQuery.matches;

// Listen for changes
mediaQuery.addEventListener('change', (e) => {
  const shouldReduceMotion = e.matches;
  // Update animation behavior
});
```

### Animation Configurations

| Purpose | Duration | Easing | Properties |
|---------|----------|--------|------------|
| **List Item Enter** | 200ms | easeOut | opacity, y |
| **List Item Exit** | 200ms | easeIn | opacity, x |
| **Page Transition** | 300ms | easeInOut | opacity |
| **Button Hover** | 150ms | easeOut | backgroundColor, transform |
| **Focus Ring** | 200ms | easeOut | boxShadow, scale |

---

## 4. Component State Models

### ThemeToggle Component

```typescript
interface ThemeToggleState {
  mounted: boolean;           // Prevent hydration mismatch
  currentTheme: ThemeValue;
  resolvedTheme: 'light' | 'dark';  // Actual applied theme
  isOpen: boolean;            // Dropdown state (if using dropdown)
}
```

### TaskList Component (Enhanced)

```typescript
interface TaskListState {
  tasks: Task[];
  filter: 'all' | 'active' | 'completed';
  searchQuery: string;
  refreshTrigger: number;     // Existing prop for refetching
  // NEW:
  isAnimating: boolean;       // Track animation state
}
```

### TaskForm Component (Enhanced)

```typescript
interface TaskFormState {
  // Existing fields...
  // NEW:
  isSubmitting: boolean;      // Loading state with animation
  submitAnimation: 'idle' | 'success' | 'error';
}
```

---

## 5. CSS Variable Schema

### Light Theme (Default)

```css
:root {
  /* Base */
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;

  /* Components */
  --card: 0 0% 100%;
  --card-foreground: 222.2 84% 4.9%;
  --popover: 0 0% 100%;
  --popover-foreground: 222.2 84% 4.9%;

  /* Primary */
  --primary: 221.2 83.2% 53.3%;
  --primary-foreground: 210 40% 98%;

  /* Secondary */
  --secondary: 210 40% 96.1%;
  --secondary-foreground: 222.2 47.4% 11.2%;

  /* Muted */
  --muted: 210 40% 96.1%;
  --muted-foreground: 215.4 16.3% 46.9%;

  /* Accent */
  --accent: 210 40% 96.1%;
  --accent-foreground: 222.2 47.4% 11.2%;

  /* UI Elements */
  --destructive: 0 84.2% 60.2%;
  --destructive-foreground: 210 40% 98%;
  --border: 214.3 31.8% 91.4%;
  --input: 214.3 31.8% 91.4%;
  --ring: 221.2 83.2% 53.3%;

  /* Radius */
  --radius: 0.5rem;
}
```

### Dark Theme

```css
.dark {
  /* Base */
  --background: 222.2 84% 4.9%;
  --foreground: 210 40% 98%;

  /* Components */
  --card: 222.2 84% 4.9%;
  --card-foreground: 210 40% 98%;
  --popover: 222.2 84% 4.9%;
  --popover-foreground: 210 40% 98%;

  /* Primary */
  --primary: 217.2 91.2% 59.8%;
  --primary-foreground: 222.2 47.4% 11.2%;

  /* Secondary */
  --secondary: 217.2 32.6% 17.5%;
  --secondary-foreground: 210 40% 98%;

  /* Muted */
  --muted: 217.2 32.6% 17.5%;
  --muted-foreground: 215 20.2% 65.1%;

  /* Accent */
  --accent: 217.2 32.6% 17.5%;
  --accent-foreground: 210 40% 98%;

  /* UI Elements */
  --destructive: 0 62.8% 30.6%;
  --destructive-foreground: 210 40% 98%;
  --border: 217.2 32.6% 17.5%;
  --input: 217.2 32.6% 17.5%;
  --ring: 224.3 76.3% 94.1%;
}
```

### Usage in Tailwind

```tsx
// These map to Tailwind classes
<div className="bg-background text-foreground">
<div className="border border-input rounded-lg">
<button className="bg-primary text-primary-foreground">
```

---

## 6. Type Definitions

### Exported Types

```typescript
// lib/theme.ts
export type ThemeValue = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

export interface ThemeContextValue {
  theme: ThemeValue;
  setTheme: (theme: ThemeValue) => void;
  resolvedTheme: ResolvedTheme;
}

// lib/toast.ts
export interface ToastOptions {
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  duration?: number;
}

export interface ToastHelpers {
  success: (message: string, options?: ToastOptions) => void;
  error: (message: string, options?: ToastOptions) => void;
  info: (message: string, options?: ToastOptions) => void;
  promise: <T>(
    promise: Promise<T>,
    messages: {
      loading: string;
      success: string;
      error: string;
    }
  ) => Promise<T>;
}

// lib/animations.ts
export interface AnimationConfig {
  duration: number;
  easing?: string;
  delay?: number;
}

export interface AnimationVariants {
  initial: any;
  animate: any;
  exit?: any;
  transition?: AnimationConfig;
}
```

---

## 7. State Flow Diagrams

### Theme Selection Flow

```
┌─────────────┐
│   User      │
│  Action     │
└──────┬──────┘
       │ clicks theme toggle
       ▼
┌─────────────────┐
│ ThemeToggle     │
│ Component       │
└──────┬──────────┘
       │ calls setTheme('dark' | 'light' | 'system')
       ▼
┌─────────────────┐
│ next-themes     │
│ ThemeProvider   │
└──────┬──────────┘
       │ 1. Writes to localStorage
       │ 2. Updates React Context
       │ 3. Toggles 'dark' class on <html>
       ▼
┌─────────────────┐
│  All Components │
│  Re-render with │
│  new theme      │
└─────────────────┘
```

### Toast Notification Flow

```
┌─────────────┐
│   Action    │
│  (create)   │
└──────┬──────┘
       │ calls toast.success/error/info
       ▼
┌─────────────────┐
│   Sonner        │
│   Manager       │
└──────┬──────────┘
       │ 1. Create notification object
       │ 2. Add to queue
       │ 3. Render if < 3 visible
       ▼
┌─────────────────┐
│   Toaster UI    │
│   (fixed)       │
└─────────────────┘
       │
       │ After duration OR user dismiss
       ▼
┌─────────────────┐
│   Remove from   │
│   DOM + Queue   │
└─────────────────┘
```

---

## 8. Edge Cases & Error Handling

| Edge Case | Handling |
|-----------|----------|
| localStorage unavailable | next-themes falls back to system preference |
| Rapid theme changes | Debounce updates, last write wins |
| Notification queue overflow | Oldest auto-dismisses (per spec) |
| Framer Motion not loaded | Fallback to CSS-only transitions |
| prefers-reduced-motion changes | Re-evaluate, disable animations |
| JavaScript disabled | Graceful degradation - static HTML |

---

## 9. Validation Rules

### Theme Validation
- Value must be one of: 'light', 'dark', 'system'
- System preference must resolve to 'light' or 'dark'
- localStorage write failures are silent (fallback to system)

### Notification Validation
- Title required (non-empty string)
- Duration must be positive number (or undefined for default)
- Max 3 visible at once (enforced by sonner)

### Animation Validation
- Duration must not exceed spec limits (200ms for lists, 300ms for pages)
- Reduced motion override takes precedence over all animations

---

## 10. Migration Notes

### No Data Migration Required
- This is a new feature with no existing schema
- Theme preference is optional, defaults to 'system'
- No user data is affected

### Backward Compatibility
- Existing components work without changes
- Theme is applied via CSS classes (no breaking changes)
- Animations are progressive enhancements
