# Quickstart: UI/UX Enhancement

**Feature**: 002-ui-ux-enhancement
**Date**: 2026-01-08
**Phase**: 1 - Developer Setup Guide

## Overview

This guide helps developers set up their local environment for implementing the UI/UX enhancements.

---

## Prerequisites

- Node.js 20+ installed
- Project cloned and dependencies installed (`npm install` in `frontend/`)
- Basic familiarity with Next.js App Router, TypeScript, Tailwind CSS

---

## Setup Steps

### 1. Install Dependencies

From the `frontend/` directory:

```bash
cd frontend
npm install next-themes framer-motion sonner
npm install -D @radix-ui/react-dialog @radix-ui/react-slot class-variance-authority clsx tailwind-merge
```

### 2. Initialize shadcn/ui

```bash
npx shadcn@latest init
```

**Configuration choices**:
- TypeScript: Yes
- Style: Default (uses CSS variables + Tailwind)
- Base color: Slate (recommended)
- CSS variables: Yes
- Import alias: `@/components`

This creates:
- `components.json` configuration
- `lib/utils.ts` with `cn()` utility
- Updates `tailwind.config.js`

### 3. Add shadcn Components

```bash
npx shadcn@latest add button input card dialog sonner
```

This adds components to `components/ui/`:
- `button.tsx`
- `input.tsx`
- `card.tsx`
- `dialog.tsx`
- `sonner.tsx`

### 4. Update Tailwind Configuration

Add to `tailwind.config.js` (or `app/globals.css` for Tailwind v4):

```css
@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --card: 0 0% 100%;
    --card-foreground: 222.2 84% 4.9%;
    --popover: 0 0% 100%;
    --popover-foreground: 222.2 84% 4.9%;
    --primary: 221.2 83.2% 53.3%;
    --primary-foreground: 210 40% 98%;
    --secondary: 210 40% 96.1%;
    --secondary-foreground: 222.2 47.4% 11.2%;
    --muted: 210 40% 96.1%;
    --muted-foreground: 215.4 16.3% 46.9%;
    --accent: 210 40% 96.1%;
    --accent-foreground: 222.2 47.4% 11.2%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 210 40% 98%;
    --border: 214.3 31.8% 91.4%;
    --input: 214.3 31.8% 91.4%;
    --ring: 221.2 83.2% 53.3%;
    --radius: 0.5rem;
  }

  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
    --card: 222.2 84% 4.9%;
    --card-foreground: 210 40% 98%;
    --popover: 222.2 84% 4.9%;
    --popover-foreground: 210 40% 98%;
    --primary: 217.2 91.2% 59.8%;
    --primary-foreground: 222.2 47.4% 11.2%;
    --secondary: 217.2 32.6% 17.5%;
    --secondary-foreground: 210 40% 98%;
    --muted: 217.2 32.6% 17.5%;
    --muted-foreground: 215 20.2% 65.1%;
    --accent: 217.2 32.6% 17.5%;
    --accent-foreground: 210 40% 98%;
    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 210 40% 98%;
    --border: 217.2 32.6% 17.5%;
    --input: 217.2 32.6% 17.5%;
    --ring: 224.3 76.3% 94.1%;
  }
}
```

### 5. Update Root Layout

Edit `app/layout.tsx`:

```tsx
import { ThemeProvider } from 'next-themes'
import { Toaster } from '@/components/ui/sonner'

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
        <Toaster />
      </body>
    </html>
  )
}
```

### 6. Create Theme Toggle Component

Create `components/ui/theme-toggle.tsx`:

```tsx
"use client"

import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'

export function ThemeToggle() {
  const [mounted, setMounted] = useState(false)
  const { theme, setTheme } = useTheme()

  // Prevent hydration mismatch
  useEffect(() => setMounted(true), [])

  if (!mounted) return null

  return (
    <div className="flex gap-2">
      <button
        onClick={() => setTheme('light')}
        className={theme === 'light' ? 'ring-2 ring-primary' : ''}
      >
        Light
      </button>
      <button
        onClick={() => setTheme('dark')}
        className={theme === 'dark' ? 'ring-2 ring-primary' : ''}
      >
        Dark
      </button>
      <button
        onClick={() => setTheme('system')}
        className={theme === 'system' ? 'ring-2 ring-primary' : ''}
      >
        System
      </button>
    </div>
  )
}
```

### 7. Test Toast Notifications

```tsx
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'

export function TestToast() {
  return (
    <Button
      onClick={() => toast.success('Task created!', {
        description: 'Your task has been added.',
        action: {
          label: 'Undo',
          onClick: () => console.log('Undo clicked')
        }
      })}
    >
      Show Toast
    </Button>
  )
}
```

### 8. Test Animations

```tsx
import { motion, AnimatePresence } from 'framer-motion'

export function AnimatedList({ items }: { items: string[] }) {
  return (
    <AnimatePresence>
      {items.map((item) => (
        <motion.div
          key={item}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, x: -100 }}
          transition={{ duration: 0.2 }}
        >
          {item}
        </motion.div>
      ))}
    </AnimatePresence>
  )
}
```

---

## Verification

### Theme Switching
1. Start dev server: `npm run dev`
2. Open http://localhost:3000
3. Click theme toggle buttons
4. Verify:
   - Theme changes immediately (<100ms)
   - No flash of wrong theme on refresh
   - System preference is detected

### Toast Notifications
1. Click a button that triggers a toast
2. Verify:
   - Toast appears in bottom-right
   - Auto-dismisses after 4 seconds
   - Hover pauses auto-dismiss
   - Action button works

### Animations
1. Create/delete a task
2. Verify:
   - Smooth enter/exit animations
   - Duration <200ms
   - Reduced motion is respected (check OS settings)

---

## Troubleshooting

### Theme Flash on Load
- Ensure `suppressHydrationWarning` is on `<html>` tag
- Check that `ThemeProvider` wraps all content

### Toast Not Showing
- Ensure `<Toaster />` is rendered once in layout
- Check for z-index conflicts with other fixed elements

### Animation Not Working
- Ensure `framer-motion` is installed
- Check for `AnimatePresence` wrapper for exit animations
- Verify `key` prop on animated items

### Styles Not Applied
- Ensure CSS variables are defined in globals.css
- Check that Tailwind is processing `@layer base`
- Verify `class` attribute (not `className`) on ThemeProvider

---

## Development Workflow

1. **Create feature branch**: `git checkout -b 002-ui-ux-enhancement`
2. **Install dependencies**: See step 1 above
3. **Implement by priority**:
   - P1: Theme system
   - P2: Animations
   - P3: Toasts + Components
4. **Test**: Run through verification steps
5. **Commit**: Reference task IDs from tasks.md

---

## Resources

- [next-themes](https://github.com/pacocoursey/next-themes)
- [framer-motion](https://www.framer.com/motion/)
- [sonner](https://sonner.emilkowal.ski/)
- [shadcn/ui](https://ui.shadcn.com/)
- [Tailwind CSS](https://tailwindcss.com/docs)
