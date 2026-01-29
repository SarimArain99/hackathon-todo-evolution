# Quick Start: Theme System and Cross-Page Consistency

**Feature**: 004-theme-system
**Date**: 2026-01-17

## Overview

This guide explains how to use and extend the unified theme system across the Zenith productivity application.

## Theme Modes

The application supports three theme modes:

| Mode | Description |
|------|-------------|
| **Light** | Light background with dark text |
| **Dark** | Dark background with light text |
| **System** | Follows OS preference (default for new users) |

## CSS Variable Reference

### Semantic Color Variables

```css
/* Background & Surface */
--background          /* Main page background */
--surface             /* Elevated surfaces (cards, panels) */
--hover-bg            /* Hover state background */

/* Text Colors */
--foreground          /* Primary text */
--muted-foreground    /* Secondary text */
--foreground-muted    /* Tertiary text/disabled */

/* Brand Colors */
--primary             /* Primary brand color (lavender) */
--primary-foreground  /* Text on primary background */
--secondary           /* Secondary brand color (sage) */
--accent              /* Accent color (terracotta) */

/* UI Elements */
--border              /* Borders and dividers */
--input-bg            /* Input field background */
--card                /* Card/panel background */
```

### Opacity Variants

```css
--primary/10          /* 10% opacity primary */
--primary/20          /* 20% opacity primary */
--secondary/8         /* 8% opacity secondary */
--accent/6            /* 6% opacity accent */
```

## Usage in Components

### Basic Theme Classes

```tsx
// Background and text
<div className="bg-background text-foreground">

// Elevated surface
<div className="bg-surface border border-border">

// Interactive elements
<button className="bg-primary text-primary-foreground hover:opacity-90">

// Muted text
<p className="text-muted-foreground">
```

### Inline Styles for Effects

```tsx
// Ambient glow effects
<div style={{ background: "oklch(0.65 0.14 280 / 0.12)" }} />

// Custom opacity
<span style={{ color: "oklch(0.65 0.14 280 / 0.5)" }} />
```

## Theme Toggle Implementation

The theme toggle component is located at `components/theme-toggle.tsx`:

```tsx
import { ThemeToggle } from "@/components/theme-toggle"

// In your header or navigation
<ThemeToggle />
```

## Adding New Colors

### Step 1: Define CSS Variables

Add to `globals.css`:

```css
:root {
  --your-new-color: oklch(...);
}
.dark {
  --your-new-color: oklch(...);
}
```

### Step 2: Update Tailwind Config (Optional)

If you want a utility class, add to `tailwind.config.ts`:

```ts
theme: {
  extend: {
    colors: {
      "your-new": "var(--your-new-color)",
    }
  }
}
```

### Step 3: Use in Component

```tsx
<div className="bg-your-new text-your-new-foreground">
```

## Testing Themes

### Manual Testing

1. Open the application
2. Click the theme toggle button
3. Navigate between pages (homepage, sign-in, sign-up, dashboard, chatbot)
4. Verify all colors update consistently
5. Check text contrast is readable in both themes

### Automated Testing

```tsx
import { render } from '@testing-library/react'
import { ThemeProvider } from 'next-themes'

test('theme toggle switches classes', () => {
  const { getByRole } = render(
    <ThemeProvider attribute="class" defaultTheme="light">
      <App />
    </ThemeProvider>
  )
  // Test theme switching
})
```

## Troubleshooting

### Issue: Colors Not Changing

**Cause**: Hardcoded color values in component

**Fix**: Search for hex codes (`#...`) and replace with CSS variables

### Issue: Flash of Wrong Theme

**Cause**: Missing FOUC prevention

**Fix**: Ensure `disableTransitionOnChange` is set in ThemeProvider

### Issue: Contrast Too Low

**Cause**: Color values don't meet WCAG AA

**Fix**: Adjust OKLCH values in globals.css for better contrast

## Related Documentation

- [WCAG 2.1 Contrast Requirements](https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum)
- [next-themes Documentation](https://github.com/pacocoursey/next-themes)
- [Tailwind CSS v4 Documentation](https://tailwindcss.com/docs/customizing-colors)
- [OKLCH Color Space](https://oklch.com/)
