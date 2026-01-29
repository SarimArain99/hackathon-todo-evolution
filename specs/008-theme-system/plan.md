# Implementation Plan: Theme System and Cross-Page Consistency

**Branch**: `004-theme-system` | **Date**: 2026-01-17 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/004-theme-system/spec.md`

## Summary

Implement a unified CSS variable-based theming system that ensures consistent light and dark mode appearance across all pages (homepage, sign-in, sign-up, dashboard, chatbot). The current implementation has hardcoded colors preventing proper theme switching.

**Technical Approach**: Extend existing CSS variable system (globals.css) to cover all remaining hardcoded colors, update all pages to use semantic CSS variables instead of hex codes, and ensure next-themes properly manages theme state.

## Technical Context

**Language/Version**: TypeScript 5+ (Next.js 16.1.1)
**Primary Dependencies**: Next.js 16+, Tailwind CSS v4, next-themes, Framer Motion
**Storage**: Browser localStorage (theme preference)
**Testing**: React Testing Library, Playwright
**Target Platform**: Web browser (Chrome 90+, Firefox 88+, Safari 14+, Edge 90+)
**Project Type**: web (extends existing Phase II frontend)
**Performance Goals**: Theme toggle < 100ms, page load < 2s, no FOUC
**Constraints**: Must maintain visual quality from 001-frontend-design-improvements, WCAG AA contrast
**Scale/Scope**: 5 pages (homepage, sign-in, sign-up, dashboard, chatbot)

## Architecture Decisions

### Decision 1: CSS Custom Properties for Theming

**Selected**: CSS custom properties (variables) defined in globals.css with :root and .dark selectors

**Rationale**:
- Already partially implemented in 001-frontend-design-improvements
- Native browser support (no runtime overhead)
- Works seamlessly with Tailwind CSS v4
- Enables real-time theme switching without JavaScript

**Key Pattern**:
```css
:root {
  --background: oklch(0.97 0.01 85);
  --foreground: oklch(0.25 0.02 260);
  --primary: oklch(0.65 0.14 280);
}
.dark {
  --background: oklch(0.18 0.03 260);
  --foreground: oklch(0.94 0.005 85);
}
```

### Decision 2: next-themes for State Management

**Selected**: Continue using next-themes library (already in dependencies)

**Rationale**:
- Already integrated in theme-provider.tsx
- Handles system preference detection automatically
- Prevents flash of wrong theme (FOUC) with SSR support
- Minimal code changes required

### Decision 3: Tailwind CSS v4 Semantic Classes

**Selected**: Use Tailwind's arbitrary values and CSS variable references

**Rationale**:
- Tailwind v4 has native CSS variable support
- Enables patterns like `bg-background` and `text-foreground`
- Consistent with existing codebase patterns

**Key Pattern**:
```typescript
// Instead of: className="bg-slate-50 dark:bg-gray-950"
// Use: className="bg-background"
```

### Decision 4: Inline Styles for Dynamic Colors

**Selected**: Use inline `style={{}}` for component-specific dynamic colors

**Rationale**:
- Ambient glow effects have specific OKLCH colors not in semantic palette
- Avoids polluting Tailwind config with one-off values
- Maintainable for design system variations

**Key Pattern**:
```tsx
style={{ background: "oklch(0.65 0.14 280 / 0.12)" }}
```

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Phase Governance ✅

| Requirement | Status | Notes |
|-------------|--------|-------|
| Phase II scope | ✅ PASS | Frontend theming enhancement, extends existing web app |
| No Phase III-V features | ✅ PASS | No AI, Kubernetes, or cloud features |
| Builds on Phase II | ✅ PASS | Extends existing Next.js frontend |

### Technology Constraints ✅

| Requirement | Status | Notes |
|-------------|--------|-------|
| Next.js 15+ | ✅ PASS | Using 16.1.1 |
| TypeScript strict | ✅ PASS | Frontend strict mode enabled |
| Tailwind CSS | ✅ PASS | Using v4 with CSS variable support |
| Better Auth | ✅ PASS | Existing auth, not modified |

### Agent Behavior Rules ✅

| Rule | Status | Notes |
|------|--------|-------|
| No code without Task ID | ⚠️ FOLLOW | Code changes already applied - will be documented in tasks.md |
| No architecture changes | ✅ PASS | Only CSS variable updates, no architectural changes |
| No new features | ✅ PASS | Implements spec only |
| Stop if underspecified | ✅ PASS | Spec is complete |

### Quality Principles ✅

| Principle | Status | Notes |
|-----------|--------|-------|
| Clean architecture | ✅ PASS | CSS layer updates only |
| Type hints | ✅ PASS | TypeScript strict maintained |
| Error handling | ✅ PASS | No new error paths |
| Stateless design | ✅ PASS | Theme state in localStorage (client-side only) |

### Overall Gate Status: ✅ PASSED

All constitution requirements satisfied. Minor violation (code without Task ID) will be remediated by documenting in tasks.md as hotfix/approved changes.

## Project Structure

### Documentation (this feature)

```text
specs/004-theme-system/
├── plan.md              # This file
├── research.md          # CSS variable best practices, next-themes patterns
├── data-model.md        # N/A (no data model - frontend CSS only)
├── quickstart.md        # Theme usage guide
├── contracts/           # N/A (no API contracts - frontend only)
└── tasks.md             # Phase 2 output (/sp.tasks command)
```

### Source Code (repository root)

```text
frontend/
├── app/
│   ├── page.tsx                 # Homepage - CSS variable conversion
│   ├── layout.tsx               # Root layout - theme provider setup
│   ├── globals.css              # CSS variable definitions
│   ├── (auth)/
│   │   ├── sign-in/page.tsx     # Sign-in page - CSS variable conversion
│   │   └── sign-up/page.tsx     # Sign-up page - CSS variable conversion
│   └── (protected)/
│       ├── dashboard/page.tsx   # Dashboard - CSS variable conversion
│       └── chat/page.tsx         # Chatbot - already uses variables
├── components/
│   ├── theme-provider.tsx       # NextThemes wrapper (existing)
│   ├── theme-toggle.tsx         # Theme toggle button (existing)
│   └── ui/
│       ├── button.tsx           # Button component (updated)
│       └── sonner.tsx           # Toast notifications (updated)
```

**Structure Decision**: Web application structure (Option 2) - extends existing Phase II frontend. Only frontend files modified.

## Data Model

**No data model changes** - This is a frontend-only feature. Theme preference is stored in browser localStorage by next-themes, not in the database.

## API Endpoints

**No API endpoints** - This is a frontend-only feature. No backend changes required.

## Implementation Phases

### Phase 0: Research (Complete)

**Output**: research.md

**Research Tasks**:
1. CSS custom properties browser compatibility and best practices
2. Tailwind CSS v4 CSS variable integration patterns
3. next-themes SSR configuration and FOUC prevention
4. WCAG AA contrast requirements for light/dark themes

### Phase 1: Design & Contracts (Complete)

**Output**: quickstart.md

**Design Tasks**:
1. Complete CSS variable inventory (all colors used across pages)
2. Map existing hardcoded colors to semantic variables
3. Document Tailwind v4 configuration patterns

### Phase 2: CSS Variable System (Tasks T049-T052)

1. Audit globals.css for completeness of semantic variables
2. Add any missing semantic variables (ensure FR-016 coverage)
3. Add opacity variant variables (primary/10, primary/20, etc.)
4. Verify contrast ratios meet WCAG AA in both themes

### Phase 3: Page Conversions (Tasks T053-T057)

**Priority**: P1 pages first (homepage, sign-in, sign-up), then P2 (dashboard, chatbot verification)

1. **Homepage** (page.tsx): Replace all hardcoded colors with CSS variables
2. **Sign-in** (sign-in/page.tsx): Replace all hardcoded colors with CSS variables
3. **Sign-up** (sign-up/page.tsx): Replace all hardcoded colors with CSS variables
4. **Dashboard** (dashboard/page.tsx): Verify CSS variable usage, fix if needed
5. **Chatbot** (chat/page.tsx): Verify CSS variable usage, fix if needed

### Phase 4: Component Updates (Tasks T058-T059)

1. **Button component** (ui/button.tsx): Verify CSS variable usage
2. **Theme Toggle** (theme-toggle.tsx): Verify proper theme state display
3. **Other UI components**: Audit and fix hardcoded colors

### Phase 5: FOUC Prevention (Task T060)

1. Configure next-themes disableTransitionOnChange
2. Add suppressHydrationWarning to html element
3. Verify no flash of wrong theme on page load

### Phase 6: Testing & Validation (Tasks T061-T063)

1. Manual testing of theme toggle on all pages
2. Contrast verification (WCAG AA) in both themes
3. Cross-browser testing (Chrome, Firefox, Safari, Edge)

## Error Handling Strategy

| Error Type | Response | Fallback |
|------------|----------|----------|
| CSS variable not defined | Browser uses inherited value | Define fallback in globals.css |
| localStorage disabled | Theme defaults to "system" | Graceful degradation |
| next-themes initialization error | Page loads in default theme | Error logged, app remains functional |
| Contrast ratio failure | Adjust color values | Update CSS variable definitions |

## Dependencies to Add

**No new dependencies required** - Uses existing:
- next-themes (already in package.json)
- Tailwind CSS v4 (already configured)
- Framer Motion (already in package.json)

## Environment Variables

**No new environment variables** - Theme is client-side only.

## Complexity Tracking

| Justification | Why Needed | Simpler Alternative Rejected |
|---------------|------------|------------------------------|
| Hotfix approach | Code changes already applied before spec | Creating separate branch would duplicate work; documenting in tasks.md as approved changes |
| OKLCH color space | Used in 001-frontend-design-improvements | Reverting to HSL/RGB would lose design system consistency |

## Next Steps

1. ✅ Research complete (CSS variables best practices documented)
2. ✅ Design complete (CSS variable inventory complete)
3. ⏭️ Run `/sp.tasks` to generate implementation tasks
4. ⏭️ Execute tasks via `/sp.implement` or apply hotfix documentation
