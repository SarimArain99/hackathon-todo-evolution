# Contract: ThemeToggle

**Component**: ThemeToggle
**Location**: `frontend/components/ui/theme-toggle.tsx`
**Priority**: P1

## Purpose

Provides user interface for selecting between Light, Dark, and System themes. Renders in the header per spec clarification.

## Interface

### Props

```typescript
interface ThemeToggleProps {
  // No props - uses useTheme hook internally
}
```

### Hook Usage

```typescript
interface UseThemeReturn {
  theme: 'light' | 'dark' | 'system' | undefined;
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  resolvedTheme: 'light' | 'dark' | undefined;
  // Other fields available but not used
}
```

## Behavior Specification

### Render Behavior
1. Returns `null` until client-side mounted (prevents hydration mismatch)
2. Displays three options: Light, Dark, System
3. Shows visual indicator (ring/check) for active selection
4. Positioned in header (per clarification)

### Interaction Behavior
1. Click option → call `setTheme(option)`
2. Theme updates immediately
3. Visual feedback shows new selection
4. All themed components re-render

### Visual States

```typescript
type ButtonState = 'default' | 'active' | 'hover' | 'focus';

interface VisualSpec {
  default: string;      // Gray background, no ring
  active: string;       // Primary ring-2, bold text
  hover: string;        // Slightly darker background
  focus: string;        // Focus ring visible
}
```

## Requirements Mapping

| FR | Coverage |
|----|----------|
| FR-001 | ✅ Exposes three theme options |
| SC-001 | ✅ Updates within 100ms (setTheme is synchronous) |
| SC-010 | ✅ Visible in header for discoverability |

## Usage Example

```tsx
"use client"

import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'

export function ThemeToggle() {
  const [mounted, setMounted] = useState(false)
  const { theme, setTheme } = useTheme()

  useEffect(() => setMounted(true), [])

  if (!mounted) return null

  return (
    <div className="flex items-center gap-2">
      <Button
        variant={theme === 'light' ? 'default' : 'outline'}
        size="sm"
        onClick={() => setTheme('light')}
      >
        Light
      </Button>
      <Button
        variant={theme === 'dark' ? 'default' : 'outline'}
        size="sm"
        onClick={() => setTheme('dark')}
      >
        Dark
      </Button>
      <Button
        variant={theme === 'system' ? 'default' : 'outline'}
        size="sm"
        onClick={() => setTheme('system')}
      >
        System
      </Button>
    </div>
  )
}
```

## Accessibility

- Keyboard navigation: Tab through options, Enter/Space to select
- Screen reader: Announce current theme and available options
- Focus indicators: Visible ring on focused button
- Labels: Clear button text ("Light", "Dark", "System")

## Testing

- Mount without hydration errors
- Click each option, verify theme changes
- Verify active state is visually distinct
- Verify keyboard navigation
- Verify screen reader announcements
