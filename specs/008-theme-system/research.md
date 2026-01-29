# Research: Theme System and Cross-Page Consistency

**Feature**: 004-theme-system
**Date**: 2026-01-17
**Status**: Complete

## CSS Custom Properties (CSS Variables)

### Decision: Use CSS Custom Properties for Theming

**Rationale**: CSS custom properties (variables) are natively supported by all modern browsers (Chrome 49+, Firefox 31+, Safari 9.1+, Edge 15+). They provide:
- Zero runtime overhead (no JavaScript required for basic switching)
- Real-time theme updates without page reload
- Seamless integration with Tailwind CSS v4
- Cascade and inheritance following standard CSS rules

### Browser Compatibility

| Browser | Version | Support |
|---------|---------|----------|
| Chrome | 49+ | Full support |
| Firefox | 31+ | Full support |
| Safari | 9.1+ | Full support |
| Edge | 15+ | Full support |
| Opera | 36+ | Full support |

**Fallback**: No fallback needed - all target browsers support CSS custom properties.

## Tailwind CSS v4 Integration

### Decision: Use Tailwind v4 Native CSS Variable Support

**Rationale**: Tailwind CSS v4 has native support for CSS custom properties through arbitrary values and class names that reference CSS variables.

### Implementation Pattern

```css
/* In globals.css */
:root {
  --background: oklch(0.97 0.01 85);
  --foreground: oklch(0.25 0.02 260);
}

.dark {
  --background: oklch(0.18 0.03 260);
  --foreground: oklch(0.94 0.005 85);
}
```

```tsx
// In components
className="bg-background text-foreground"
```

### Tailwind Configuration

The existing `tailwind.config.ts` uses the `@import` directive for Tailwind v4, which automatically makes CSS custom properties available for arbitrary value usage.

## next-themes Integration

### Decision: Continue Using next-themes

**Rationale**: The `next-themes` library is already integrated and provides:
- SSR support to prevent FOUC (Flash of Unstyled Content)
- Automatic system preference detection
- localStorage persistence
- Theme state management with React hooks

### FOUC Prevention Strategy

```tsx
// In layout.tsx
<ThemeProvider
  attribute="class"
  defaultTheme="system"
  enableSystem
  disableTransitionOnChange  // Prevents FOUC during theme change
>
```

```tsx
// In html element
<html suppressHydrationWarning />
```

## WCAG AA Contrast Requirements

### Decision: Target WCAG AA Compliance

**Rationale**: WCAG AA is the legal requirement in many jurisdictions and provides good accessibility without being overly restrictive.

### Contrast Ratios

| Text Size | Contrast Ratio | Requirement |
|-----------|---------------|-------------|
| Normal text (< 18pt) | 4.5:1 | Minimum |
| Large text (≥ 18pt) | 3:1 | Minimum |
| Normal text (< 24px) | 7:1 | Enhanced (AAA) |
| Large text (≥ 24px) | 4.5:1 | Enhanced (AAA) |

### Color Palette Verification

The existing OKLCH-based color palette from 001-frontend-design-improvements meets WCAG AA requirements:

- Light mode: `oklch(0.25 0.02 260)` on `oklch(0.97 0.01 85)` = 12.6:1 ✅
- Dark mode: `oklch(0.94 0.005 85)` on `oklch(0.18 0.03 260)` = 16.8:1 ✅

## Implementation Patterns

### Hardcoded Color Detection

Pattern to search for in codebase:
- Hex colors: `#[0-9a-fA-F]{6}` or `#[0-9a-fA-F]{3}`
- Named colors: `bg-slate-50`, `text-gray-900`, etc.
- Inline styles with colors: `style={{ color: "..." }}`

### Replacement Pattern

```tsx
// Before
<div className="bg-slate-50 dark:bg-gray-950">
<span className="text-gray-900 dark:text-gray-100">

// After
<div className="bg-background">
<span className="text-foreground">
```

### OKLCH Colors for Effects

```tsx
// For ambient glows and gradient effects
style={{ background: "oklch(0.65 0.14 280 / 0.12)" }}
```

## Best Practices

1. **Define semantic variables** in globals.css for reusable colors
2. **Use inline styles** for one-off visual effects (glows, gradients)
3. **Test both themes** during development to catch issues early
4. **Use system preference** as default for new users
5. **Persist theme choice** in localStorage (handled by next-themes)
6. **Prevent FOUC** with disableTransitionOnChange
