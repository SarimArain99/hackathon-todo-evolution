# Contract: ThemeProvider

**Component**: ThemeProvider wrapper
**Location**: `frontend/app/layout.tsx`
**Priority**: P1

## Purpose

Wraps the Next.js application with theme management capabilities via next-themes.

## Interface

### Props

```typescript
interface ThemeProviderProps {
  children: React.ReactNode;
  // All other props are optional with defaults
}
```

### Configuration

```typescript
interface ThemeProviderConfig {
  attribute: 'class';           // Apply theme as CSS class
  defaultTheme: 'system';       // Default to system preference
  enableSystem: boolean;        // Enable system theme detection
  disableTransitionOnChange: boolean; // Prevent jarring transitions
}
```

## Behavior Specification

### Mount Behavior
1. Reads `theme` from localStorage (key: `theme`)
2. If not found, defaults to `'system'`
3. Evaluates `matchMedia('(prefers-color-scheme: dark)')`
4. Applies `'dark'` class to `<html>` if dark theme active
5. Sets up listener for system preference changes

### Theme Change Behavior
1. User calls `setTheme(value)` where value is `'light' | 'dark' | 'system'`
2. Writes value to localStorage
3. Re-evaluates resolved theme (for 'system' option)
4. Updates `<html>` class attribute
5. All consumers re-render via Context

### System Preference Change
1. `matchMedia` fires change event
2. If current theme is `'system'`, re-evaluate
3. Update `<html>` class accordingly
4. All consumers re-render

## Requirements Mapping

| FR | Coverage |
|----|----------|
| FR-001 | ✅ Three theme options provided |
| FR-002 | ✅ localStorage persistence |
| FR-003 | ✅ Automatic system theme update |
| FR-004 | ✅ CSS class applies to all elements |
| FR-005 | ✅ suppressHydrationWarning prevents flash |

## Usage Example

```tsx
import { ThemeProvider } from 'next-themes'

export default function Layout({ children }) {
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
      </body>
    </html>
  )
}
```

## Testing

- Verify localStorage write on theme change
- Verify system preference detection
- Verify no flash of wrong theme on refresh
- Verify 'system' option responds to OS changes

## Non-Goals

- Theme customization beyond light/dark (out of scope)
- Per-page theme overrides (not needed)
- Theme transition animations (handled by CSS)
