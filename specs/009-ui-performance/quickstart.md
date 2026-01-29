# Quick Start: UI Performance and Animation Optimization

**Feature**: 005-ui-performance
**Date**: 2026-01-17

## Overview

This guide explains how to maintain and test performance optimizations for smooth scrolling and animations across the Zenith productivity application.

## Blur Value Guidelines

### Maximum Blur Values by Page Type

| Page Type | Desktop Blur | Mobile Blur | Notes |
|-----------|--------------|-------------|-------|
| Homepage | 40px | 40px (sm: 50px) | Minimal blur for fast scrolling |
| Auth Pages (sign-in/sign-up) | 60px | 50px (sm: 60px) | Moderate blur for visual polish |
| Dashboard | 60px | 50px (sm: 60px) | Moderate blur for ambient effects |
| Chatbot | 40px | 40px | Minimal blur for real-time performance |

### Tailwind Blur Classes

```tsx
// Homepage - minimal blur
<div className="blur-[40px] sm:blur-[50px]" />

// Auth pages - moderate blur
<div className="blur-[50px] sm:blur-[60px]" />

// Mobile-only reduced blur
<div className="blur-[40px] sm:blur-[60px]" />
```

### Inline Style Approach

```tsx
// For dynamic blur values
<div style={{ backdropFilter: 'blur(40px)' }} />
```

## Animation Performance Rules

### DO: Use GPU-Accelerated Properties

```tsx
// transform - always GPU accelerated
<motion.div animate={{ x: 100, scale: 1.5, rotate: 90 }} />

// opacity - always GPU accelerated
<motion.div animate={{ opacity: 1 }} />

// Combining both - ideal
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.3 }}
/>
```

### DON'T: Use Layout-Triggering Properties

```tsx
// BAD - triggers layout recalculation
<motion.div animate={{ width: '100%', height: 'auto' }} />

// BAD - triggers paint
<motion.div animate={{ boxShadow: '0 10px 20px' }} />

// BAD - triggers layout
<motion.div animate={{ top: 100, left: 50 }} />
```

### Layout Animation Pattern

For layout animations, use Framer Motion's `layout` prop:

```tsx
<motion.div layout transition={{ duration: 0.3 }} />
```

This uses FLIP technique under the hood for optimal performance.

## Scrolling Performance

### Passive Event Listeners

Always use `{ passive: true }` for scroll/touch handlers:

```typescript
'use client';

import { useEffect } from 'react';

export function ScrollTracker() {
  useEffect(() => {
    const handleScroll = () => {
      // Read-only scroll operations
      console.log(window.scrollY);
    };

    // Passive: true allows smooth scrolling
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return null;
}
```

### Fixed Position Elements with Blur

```tsx
// Minimize blur on fixed elements during scroll
<div className="fixed top-0 left-0 right-0 blur-[40px]" />

// Consider removing blur during scroll for better performance
const [isScrolling, setIsScrolling] = useState(false);

useEffect(() => {
  let timeout: NodeJS.Timeout;
  const handleScroll = () => {
    setIsScrolling(true);
    clearTimeout(timeout);
    timeout = setTimeout(() => setIsScrolling(false), 150);
  };
  window.addEventListener('scroll', handleScroll, { passive: true });
  return () => window.removeEventListener('scroll', handleScroll);
}, []);

<div className={`fixed inset-0 ${isScrolling ? 'blur-0' : 'blur-[40px]'}`} />
```

## prefers-reduced-motion Support

The globals.css includes reduced-motion support:

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

### JavaScript Detection

```typescript
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Conditionally disable animations
const animationConfig = prefersReducedMotion
  ? { duration: 0 }
  : { duration: 0.3 };

<motion.div animate={{ opacity: 1 }} transition={animationConfig} />
```

## Performance Testing

### Manual FPS Testing

1. Open Chrome DevTools (F12)
2. Go to Performance tab
3. Click Record
4. Scroll the page
5. Stop recording
6. Check FPS - should be 55-60 FPS consistently

### Lighthouse Audit

```bash
# Run Lighthouse from command line
npx lighthouse http://localhost:3000 --view
```

Target scores:
- Performance: 90+
- Accessibility: 100
- Best Practices: 90+

### Web Vitals Measurement

```typescript
// Add to _app.tsx or layout.tsx
import { onCLS, onFID, onLCP } from 'web-vitals';

export function reportWebVitals(metric: any) {
  console.log(metric);
  // Send to analytics
}

onCLS(reportWebVitals);
onFID(reportWebVitals);
onLCP(reportWebVitals);
```

## Performance Checklist

Before deploying, verify:

- [ ] All blur values ≤ 60px (≤ 50px on mobile)
- [ ] Animations use only transform and opacity
- [ ] Scroll event listeners use passive: true
- [ ] Fixed elements have minimal blur
- [ ] prefers-reduced-motion is respected
- [ ] Lighthouse Performance score ≥ 90
- [ ] Manual scroll test shows 55-60 FPS
- [ ] Tested on low-end device/integrated GPU

## Common Performance Issues

### Issue: Scrolling is laggy

**Diagnosis**: Open Chrome DevTools Performance tab, record while scrolling. Look for long tasks (> 50ms).

**Fixes**:
1. Reduce blur values
2. Ensure passive event listeners
3. Remove will-change from too many elements
4. Check for layout thrashing (read/write cycles)

### Issue: Animations are choppy

**Diagnosis**: Check if non-GPU properties are being animated.

**Fixes**:
1. Replace width/height/top/left with transform
2. Use opacity instead of visibility
3. Reduce number of concurrent animations
4. Use layout prop for layout animations

### Issue: Page load is slow

**Diagnosis**: Check Lighthouse "Reduce JavaScript execution time" recommendation.

**Fixes**:
1. Defer non-critical animations
2. Lazy load heavy components
3. Code split Framer Motion
4. Use content-visibility for off-screen content

## Related Documentation

- [Web.dev Performance Patterns](https://web.dev/fast/)
- [Framer Motion Performance Guide](https://www.framer.com/motion/guide-reduce-bundle-size/)
- [CSS Filter Effects Specification](https://drafts.fxtf.org/filter-effects/)
- [WCAG 2.3.3 Animation from Interactions](https://www.w3.org/WAI/WCAG21/Understanding/animation-from-interactions)
