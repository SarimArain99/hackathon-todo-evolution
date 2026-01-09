# next-themes Skill

**Source**: Context7 MCP - `/pacocoursey/next-themes`
**Benchmark Score**: 86.2 | **Code Snippets**: 78 | **Reputation**: High

## Overview

next-themes is a lightweight (~2KB gzipped) theme management library for Next.js that handles SSR/hydration, prevents flash of wrong theme, and supports system preference detection.

## Key Concepts

### 1. ThemeProvider Setup

```typescript
// app/layout.tsx
import { ThemeProvider } from 'next-themes'

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
      </body>
    </html>
  )
}
```

**Important**: Use `suppressHydrationWarning` on `<html>` tag to prevent console warnings during SSR.

### 2. useTheme Hook

```typescript
'use client'

import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'

export function ThemeToggle() {
  const [mounted, setMounted] = useState(false)
  const { theme, setTheme, resolvedTheme } = useTheme()

  // Prevent hydration mismatch
  useEffect(() => setMounted(true), [])

  if (!mounted) return null

  return (
    <div>
      <p>Current theme: {theme}</p>
      <p>Resolved theme: {resolvedTheme}</p>
      <button onClick={() => setTheme('light')}>Light</button>
      <button onClick={() => setTheme('dark')}>Dark</button>
      <button onClick={() => setTheme('system')}>System</button>
    </div>
  )
}
```

### 3. ThemeProvider Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `attribute` | `'class' \| 'data-theme'` | `'class'` | HTML attribute for theme |
| `defaultTheme` | `string` | `'system'` | Default theme if none stored |
| `enableSystem` | `boolean` | `false` | Enable system theme detection |
| `disableTransitionOnChange` | `boolean` | `false` | Disable transitions during theme change |

### 4. useTheme Return Values

| Property | Type | Description |
|----------|------|-------------|
| `theme` | `string \| undefined` | Current theme ('light', 'dark', 'system') |
| `setTheme` | `(theme: string) => void` | Function to change theme |
| `resolvedTheme` | `string \| undefined` | Actual applied theme ('light' or 'dark') |
| `systemTheme` | `string \| undefined` | System preference ('light' or 'dark') |
| `themes` | `string[]` | Available themes |

### 5. Mounted Pattern (Hydration Fix)

```typescript
const [mounted, setMounted] = useState(false)

useEffect(() => {
  setMounted(true)
}, [])

if (!mounted) {
  return null  // or a placeholder
}
```

**Why**: `useTheme` reads from localStorage which is not available during SSR. This prevents hydration mismatches.

### 6. System Theme Detection

next-themes automatically listens for system preference changes:

```typescript
// When theme is 'system', resolvedTheme updates automatically
const { resolvedTheme } = useTheme()

// If OS changes from light to dark, resolvedTheme changes too
// No manual mediaQuery listener needed
```

## CSS Integration

### Tailwind CSS (Recommended)

```css
/* app/globals.css */
@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
  }

  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
  }
}
```

### Usage in Components

```tsx
<div className="bg-background text-foreground">
  Content adapts to theme
</div>
```

## Common Patterns

### Theme Toggle Dropdown

```tsx
'use client'

import { useTheme } from 'next-themes'

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  return (
    <select value={theme} onChange={(e) => setTheme(e.target.value)}>
      <option value="light">Light</option>
      <option value="dark">Dark</option>
      <option value="system">System</option>
    </select>
  )
}
```

### Force Theme (e.g., for demos)

```tsx
<ThemeProvider forcedTheme="dark">
  {/* App always in dark mode */}
</ThemeProvider>
```

## Storage

- **Storage**: localStorage
- **Key**: `theme`
- **Format**: JSON string of theme value

## Browser Support

- All modern browsers supporting `matchMedia` API
- Falls back gracefully if localStorage unavailable

## Installation

```bash
npm install next-themes
# or
yarn add next-themes
# or
pnpm add next-themes
```

## Best Practices

1. Always use `suppressHydrationWarning` on `<html>` tag
2. Implement mounted check to prevent hydration errors
3. Use `attribute="class"` for Tailwind CSS integration
4. Set `disableTransitionOnChange` to prevent jarring theme switches
5. Provide 'system' option for accessibility

## Known Issues

- **Hydration mismatch**: Solved by mounted check pattern
- **Flash of wrong theme**: Solved by `suppressHydrationWarning`
- **SSR**: Theme value is undefined on server, use `resolvedTheme` for actual applied theme

## References

- [GitHub Repository](https://github.com/pacocoursey/next-themes)
- Documentation: https://github.com/pacocoursey/next-themes#readme
