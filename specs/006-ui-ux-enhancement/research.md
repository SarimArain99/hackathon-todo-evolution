# Research: UI/UX Enhancement

**Feature**: 002-ui-ux-enhancement
**Date**: 2026-01-08
**Phase**: 0 - Research & Technology Decisions

## Overview

This document captures research findings and technology decisions for the UI/UX enhancement feature. All technologies were evaluated against:
- Constitution compliance
- Integration with existing Next.js + Tailwind setup
- Performance impact (bundle size, runtime)
- Developer experience
- Community support and documentation

---

## 1. Theme Management

### Decision: `next-themes`

**Research Summary**:
| Criteria | Finding |
|----------|---------|
| **Purpose** | Theme management for Next.js with SSR support |
| **Bundle Size** | ~2KB gzipped |
| **Documentation** | Excellent, clear examples for App Router |
| **Maintenance** | Active, 2.5k+ GitHub stars |
| **SSR Support** | Built-in, prevents flash of wrong theme |

**Why next-themes?**
1. Designed specifically for Next.js - handles hydration gracefully
2. System preference detection via `matchMedia` built-in
3. localStorage persistence automatic
4. No flash of unstyled content (FOUC) with `suppressHydrationWarning` pattern
5. Simple API: `useTheme()` hook with `theme`, `setTheme`, `resolvedTheme`

**Alternatives Rejected**:
- **Manual implementation**: Requires handling SSR hydration, system preference listeners, localStorage - all solved by next-themes
- **Custom Context**: Re-inventing wheel, hard to get SSR right

**Implementation Notes**:
- Wrap app in `ThemeProvider` in `app/layout.tsx`
- Add `suppressHydrationWarning` to `<html>` tag
- Use `useTheme()` hook in components
- Handle mounted state to avoid hydration mismatches

---

## 2. Animations

### Decision: `framer-motion`

**Research Summary**:
| Criteria | Finding |
|----------|---------|
| **Purpose** | Production-ready animation library for React |
| **Bundle Size** | ~38KB gzipped (largest dependency) |
| **Documentation** | Excellent, extensive examples |
| **Maintenance** | Very active, 19k+ GitHub stars |
| **Features** | Gestures, layout animations, exit animations, reduced motion support |

**Why framer-motion?**
1. **AnimatePresence**: Unique feature for exit animations (elements leaving DOM)
2. **Declarative API**: `initial`, `animate`, `exit` props on motion components
3. **Performance**: GPU-accelerated by default (uses transform/opacity)
4. **Accessibility**: Respects `prefers-reduced-motion` media query
5. **Variants**: Reusable animation definitions, stagger support
6. **Gesture support**: Built-in drag, hover, tap (future-proofing)

**Alternatives Rejected**:
- **CSS transitions only**: No exit animations, less control over sequencing
- **React Transition Group**: Smaller but less feature-rich, no gesture support
- **Auto Animate**: More focused on layout animations, less flexible

**Implementation Notes**:
- Use `motion.div` instead of regular `div` for animated elements
- Wrap lists in `AnimatePresence` for exit animations
- Keep duration under 200ms per spec (SC-004)
- Use `transform` and `opacity` only (GPU-accelerated properties)

**Animation Presets**:
```typescript
// Fade in from top
const fadeInDown = {
  initial: { opacity: 0, y: -10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, x: -100 },
  transition: { duration: 0.2 }
}

// Page transition
const pageTransition = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.3 }
}
```

---

## 3. Toast Notifications

### Decision: `sonner` (via shadcn/ui)

**Research Summary**:
| Criteria | Finding |
|----------|---------|
| **Purpose** | Lightweight toast notifications for React |
| **Bundle Size** | ~3KB gzipped |
| **Documentation** | Clean, straightforward API |
| **Maintenance** | Active, 6k+ GitHub stars |
| **Features** | Promise support, auto-dismiss, action buttons, stacking |

**Why sonner?**
1. **Tiny bundle**: Only 3KB compared to react-toastify's 15KB
2. **Promise support**: `toast.promise()` for async operations
3. **Rich API**: Built-in action buttons, descriptions, custom icons
4. **Auto-stacking**: Handles multiple toasts gracefully (max 3 per spec)
5. **Hover pause**: Auto-dismiss pauses on hover (FR-015)
6. **Shadcn integration**: Native component available

**Alternatives Rejected**:
- **react-hot-toast**: Similar features but less active maintenance
- **react-toastify**: Heavier (15KB), more boilerplate

**Implementation Notes**:
- Add `<Toaster />` component once in `app/layout.tsx`
- Import `toast` from `sonner` anywhere
- Use `toast.success()`, `toast.error()`, `toast()` for variants
- Specify `duration` (default 4000ms)
- Add `action` button for undo functionality

---

## 4. Component System

### Decision: `shadcn/ui`

**Research Summary**:
| Criteria | Finding |
|----------|---------|
| **Purpose** | Copy-paste components, not a library |
| **Bundle Size** | Only what you use (Radix primitives ~10KB total) |
| **Documentation** | Excellent, live examples |
| **Maintenance** | Very active, 65k+ GitHub stars |
| **Approach** | Code you own, customize freely |

**Why shadcn/ui?**
1. **Not a package**: Components are copied into your codebase
2. **Radix UI foundation**: Accessible, unstyled components
3. **Tailwind native**: Uses CSS variables, easy theme integration
4. **TypeScript first**: Full type safety
5. **CLI installation**: `npx shadcn@latest add <component>`
6. **Customizable**: Edit components directly, no waiting for upstream

**Alternatives Rejected**:
- **Chakra UI**: 200KB+ bundle, opinionated theming system
- **Mantine**: Heavy, more dependencies to manage
- **Headless UI (Tailwind)**: Good but less accessible than Radix

**Components Needed**:
| Component | Radix Primitive | Priority |
|-----------|----------------|----------|
| Button | @radix-ui/react-slot | P3 |
| Input | (native) | P3 |
| Card | (native div) | P3 |
| Dialog | @radix-ui/react-dialog | P3 |
| Sonner | sonner | P3 |
| ThemeToggle | custom | P1 |

**Implementation Notes**:
- Run `npx shadcn@latest init` first (sets up `components.json`)
- Then `npx shadcn@latest add <component>` for each needed
- Components go in `components/ui/`
- Uses `cn()` utility for className merging
- CSS variables defined in `app/globals.css`

---

## 5. Bundle Size Analysis

### Total Addition

| Package | Gzip | Notes |
|---------|------|-------|
| next-themes | 2KB | Theme provider |
| sonner | 3KB | Toast notifications |
| framer-motion | 38KB | Animations |
| @radix-ui/react-dialog | 5KB | Dialog primitive |
| @radix-ui/react-slot | 1KB | Button composition |
| class-variance-authority | 1KB | Variant system |
| clsx + tailwind-merge | 2KB | className utilities |
| **Total** | **~52KB** | Acceptable for UI/UX gains |

### Mitigation Strategies
1. Tree-shaking: Framer Motion is modular
2. Lazy loading: Animations could be code-split if needed
3. Radix primitives are very small individually

---

## 6. Accessibility Considerations

### WCAG AA Compliance
- **Contrast ratios**: All color tokens meet 4.5:1 for text
- **Focus states**: Visible ring on all interactive elements
- **Screen readers**: Radix primitives have ARIA built-in
- **Keyboard navigation**: All components keyboard-accessible
- **Reduced motion**: Framer Motion respects `prefers-reduced-motion`

### Testing Plan
- `axe-core` for automated contrast testing
- Manual keyboard navigation testing
- Screen reader testing with NVDA/VoiceOver

---

## 7. Browser Compatibility

### Minimum Versions (per spec dependencies)
- Chrome 90+: All features supported
- Firefox 88+: All features supported
- Safari 14+: All features supported
- Edge 90+: All features supported

### Progressive Enhancement
- CSS fallbacks for custom properties
- Animations disable gracefully
- localStorage failure handled by next-themes

---

## 8. Risks & Unknowns

| Risk | Mitigation | Status |
|------|------------|--------|
| Framer Motion hydration errors | Use mounted check pattern | Documented |
| Theme flash on page load | suppressHydrationWarning pattern | Documented |
| Bundle size bloat | Tree-shaking, only import used | Acceptable |
| Shadcn setup complexity | Use CLI, documented steps | Low risk |

---

## 9. References

- [next-themes docs](https://github.com/pacocoursey/next-themes)
- [framer-motion docs](https://www.framer.com/motion/)
- [sonner docs](https://sonner.emilkowal.ski/)
- [shadcn/ui docs](https://ui.shadcn.com/)
- [Radix UI docs](https://www.radix-ui.com/)
