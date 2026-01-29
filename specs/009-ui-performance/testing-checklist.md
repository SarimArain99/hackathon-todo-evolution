# Testing Checklist: UI Performance and Animation Optimization

**Feature:** 005-ui-performance
**Date:** 2026-01-17
**Preparation:** Run `cd frontend && npm run dev`

---

## Quick Reference

| Test | How | Target |
|------|-----|--------|
| Scroll FPS | Chrome DevTools → Performance tab | 55-60 FPS |
| Lighthouse | Chrome DevTools → Lighthouse | 90+ score |
| LCP | Lighthouse report | < 2.5s |
| CLS | Lighthouse report | < 0.1 |
| FID | Lighthouse report | < 100ms |

---

## Phase 3: Scroll Performance Testing (T011-T014)

### Test Setup
1. Open Chrome DevTools (F12)
2. Go to **Performance** tab
3. Check **Screenshots** and **Memory** boxes
4. Click **Record** (circle icon)
5. Scroll the page vigorously for 3-5 seconds
6. Click **Stop**
7. Look at **FPS** chart (should stay in green 55-60 FPS range)

### Pages to Test

| Page | URL | Expected | Actual | Pass/Fail |
|------|-----|----------|--------|-----------|
| Homepage | http://localhost:3000 | Smooth 60 FPS | | [ ] |
| Sign-in | http://localhost:3000/sign-in | Smooth 60 FPS | | [ ] |
| Sign-up | http://localhost:3000/sign-up | Smooth 60 FPS | | [ ] |
| Dashboard | http://localhost:3000/dashboard | Smooth 60 FPS | | [ ] |

---

## Phase 4: Page Load & Interaction Testing (T021-T022)

### Lighthouse Test (T021)
1. Open DevTools → **Lighthouse** tab
2. Uncheck all boxes except **Performance**
3. Click **Analyze page load**
4. Wait for report

| Page | LCP Target | LCP Actual | Pass/Fail |
|------|------------|------------|-----------|
| Homepage | < 2.5s | | [ ] |
| Sign-in | < 2.5s | | [ ] |
| Sign-up | < 2.5s | | [ ] |
| Dashboard | < 2.5s | | [ ] |
| Chatbot | < 2.5s | | [ ] |

### Interaction Responsiveness (T022)
Click buttons/links and verify visual feedback appears within 100ms (feels instant):

| Element | Expected | Pass/Fail |
|---------|----------|-----------|
| Theme toggle | < 100ms feedback | [ ] |
| Form submit buttons | < 100ms feedback | [ ] |
| Navigation links | < 100ms feedback | [ ] |

---

## Phase 5: Device Consistency Testing (T026-T029)

### Fixed Position Elements (T026)
Verify no heavy blur on elements that stay fixed during scroll:
- [ ] No fixed elements have blur > 40px

### Low-End Device Simulation (T027)
1. DevTools → **Performance** tab
2. Click **Network** dropdown → Select **Fast 3G**
3. Click **CPU** dropdown → Select **6x slowdown**
4. Test scrolling
- [ ] Scroll remains smooth even with 6x CPU slowdown

### Mobile Viewport (T028)
1. DevTools → **Device Toolbar** (Ctrl+Shift+M)
2. Select iPhone SE or similar (width < 768px)
3. Test scrolling
- [ ] Scroll smooth on mobile viewport

---

## Phase 6: Visual Quality Testing (T030-T034)

### Ambient Effects Check

| Page | Ambient Effects Visible? | Polished? | Pass/Fail |
|------|--------------------------|-----------|-----------|
| Homepage | Glows present? | Smooth animations? | [ ] |
| Sign-in | Background effects? | Subtle & smooth? | [ ] |
| Sign-up | Background effects? | Subtle & smooth? | [ ] |
| Dashboard | Glass cards? | Smooth hover? | [ ] |

### Animation Feel (T033)
- [ ] Animations feel natural (not rushed)
- [ ] Theme transition smooth (< 300ms)
- [ ] Chat messages animate smoothly

### Screenshots (T034)
Take screenshots of light/dark themes:
- [ ] Homepage light theme
- [ ] Homepage dark theme
- [ ] Dashboard light theme
- [ ] Dashboard dark theme

---

## Phase 7: Accessibility Testing (T036-T037)

### Reduced Motion Test (T036)
1. **OS Settings:** Enable "Reduce motion" / "prefers-reduced-motion"
   - macOS: System Settings → Accessibility → Display → Reduce motion
   - Windows: Settings → Ease of Access → Display → Show animations
2. Reload the page
3. Verify:
- [ ] Background glows do NOT animate
- [ ] Page transitions are instant
- [ ] All content is accessible without motion

### Content Without Animation (T037)
- [ ] All information visible even with animations disabled
- [ ] No information conveyed ONLY through motion

---

## Phase 8: Full Lighthouse Audit (T038-T046)

### Lighthouse Performance Score (T038-T042)

| Page | Target Score | Actual | Pass/Fail |
|------|-------------|--------|-----------|
| Homepage | 90+ | | [ ] |
| Sign-in | 90+ | | [ ] |
| Sign-up | 90+ | | [ ] |
| Dashboard | 90+ | | [ ] |
| Chatbot | 90+ | | [ ] |

### Web Vitals Verification (T044)

| Metric | Target | Actual | Pass/Fail |
|--------|--------|--------|-----------|
| LCP | < 2.5s | | [ ] |
| CLS | < 0.1 | | [ ] |
| FID | < 100ms | | [ ] |

### Cross-Browser Testing (T045)

| Browser | Scroll Smooth? | Animations OK? | Pass/Fail |
|---------|---------------|----------------|-----------|
| Chrome | | | [ ] |
| Firefox | | | [ ] |
| Safari (if available) | | | [ ] |
| Edge | | | [ ] |

---

## Final Summary

**Total Tests:** 33
**Passed:** _____ / 33
**Failed:** _____ / 33

### Issues Found:
1.
2.
3.

### Recommendation:
- [ ] Ready to deploy
- [ ] Needs fixes before deployment

---

## Notes

- Tests T023-T025 and T035 are already complete (no code changes needed)
- All blur values are optimized (Homepage: 40/50px, Auth: 50/60px, Dashboard: 50/60px)
- prefers-reduced-motion support is already in globals.css:481
