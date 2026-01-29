# Feature Specification: Theme System and Cross-Page Consistency

**Feature Branch**: `004-theme-system`
**Created**: 2026-01-17
**Status**: Draft
**Input**: User description: "the theme system is very poor spacially light theme the home page is going light but signin, signup,dashboard and the complete chatbot are not converting into light theme"

## Overview

This specification defines a unified theming system that ensures consistent light and dark mode appearance across all pages of the Zenith productivity application. The current implementation has hardcoded colors on several pages, preventing proper theme switching.

**Scope**: Unified CSS variable-based theming system for all application pages.

**Out of Scope**: Custom theme colors by users, theme marketplace, brand color customization (future enhancements).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Global Theme Toggle (Priority: P1)

Users can toggle between light and dark themes from any page in the application, and the theme preference applies consistently across all pages.

**Why this priority**: Theme consistency is a core UX requirement. Users expect their theme preference to work everywhere in the app, not just on certain pages. Inconsistent theming creates a broken, unprofessional impression.

**Independent Test**: Can be fully tested by toggling the theme switch on each page and verifying all colors change appropriately across the entire visible page.

**Acceptance Scenarios**:

1. **Given** a user is on any page (homepage, sign-in, sign-up, dashboard, or chatbot), **When** they click the theme toggle button, **Then** the entire page switches between light and dark mode
2. **Given** a user has selected light theme on one page, **When** they navigate to any other page, **Then** the light theme persists and is applied correctly
3. **Given** a user has selected dark theme on one page, **When** they navigate to any other page, **Then** the dark theme persists and is applied correctly
4. **Given** a user's system is set to light mode, **When** they first visit the application with "system" theme selected, **Then** the app displays in light mode
5. **Given** a user's system is set to dark mode, **When** they first visit the application with "system" theme selected, **Then** the app displays in dark mode

---

### User Story 2 - Readable Text in All Themes (Priority: P1)

Users can read all text content clearly in both light and dark themes without color contrast issues.

**Why this priority**: Text readability is fundamental to usability. Poor contrast makes the application unusable for users, especially those with visual impairments.

**Independent Test**: Can be fully tested by viewing each page in both themes and verifying all text is clearly legible against its background.

**Acceptance Scenarios**:

1. **Given** a user is viewing the homepage in light theme, **When** the page loads, **Then** all text is dark-colored on a light background with WCAG AA compliant contrast
2. **Given** a user is viewing the homepage in dark theme, **When** the page loads, **Then** all text is light-colored on a dark background with WCAG AA compliant contrast
3. **Given** a user is viewing the sign-in page in light theme, **When** the page loads, **Then** form labels, inputs, and buttons have proper contrast
4. **Given** a user is viewing the chatbot interface in dark theme, **When** messages are displayed, **Then** both user and AI messages are clearly readable
5. **Given** a user is viewing the dashboard in either theme, **When** the page loads, **Then** all UI elements including navigation, cards, and text are readable

---

### User Story 3 - Consistent Visual Language (Priority: P2)

Users see a consistent visual design language (colors, borders, shadows, spacing) across all pages regardless of the selected theme.

**Why this priority**: Visual consistency builds trust and makes the application feel cohesive. Inconsistent styling creates confusion about page boundaries and feature relationships.

**Independent Test**: Can be fully tested by navigating between pages and comparing the appearance of common UI elements (buttons, cards, borders).

**Acceptance Scenarios**:

1. **Given** a user navigates from homepage to sign-in, **When** both pages use the same theme, **Then** buttons, borders, and shadows have consistent styling
2. **Given** a user navigates from dashboard to chatbot, **When** both pages use the same theme, **Then** background colors, text colors, and surface colors match
3. **Given** a user views cards/panels on different pages, **When** comparing them, **Then** all cards use the same border radius, shadow, and surface color
4. **Given** a user views input fields on sign-up and chatbot pages, **When** comparing them, **Then** all inputs have consistent borders, focus states, and placeholder styling

---

### User Story 4 - Persistent Theme Preference (Priority: P2)

Users' theme preference persists across browser sessions, so they don't need to reselect their preferred theme on each visit.

**Why this priority**: Remembering user preferences is a standard expectation for modern web applications. Forcing users to reselect their theme creates friction.

**Independent Test**: Can be fully tested by selecting a theme, closing the browser, reopening, and verifying the theme persists.

**Acceptance Scenarios**:

1. **Given** a user has selected light theme, **When** they close and reopen the browser, **Then** the application loads in light theme
2. **Given** a user has selected dark theme, **When** they close and reopen the browser, **Then** the application loads in dark theme
3. **Given** a user has selected "system" theme, **When** their OS theme changes between light and dark, **Then** the application theme updates to match

---

### Edge Cases

- What happens when a user has JavaScript disabled (theme toggle uses JS for state management)?
- How does the system handle a flash of unstyled content (FOUC) or flash of wrong theme during page load?
- What happens when CSS variables fail to load (fallback colors)?
- How does the theming system handle printing (should it use light mode regardless of selected theme)?
- What happens when the application is embedded in an iframe with different theme context?
- How does the system handle high contrast mode or OS-level accessibility themes?
- What happens when a user's system theme changes while the application is open?
- How does the system handle theme transitions for users with photosensitivity (motion preferences)?

## Requirements *(mandatory)*

### Functional Requirements

**Theme Definition**
- **FR-001**: System MUST define a complete set of CSS custom properties (variables) for all colors used in the application
- **FR-002**: System MUST define separate color variable values for light and dark themes
- **FR-003**: System MUST support three theme modes: light, dark, and system (follows OS preference)

**Theme Application**
- **FR-004**: System MUST apply the selected theme to all pages: homepage, sign-in, sign-up, dashboard, and chatbot
- **FR-005**: System MUST use CSS variables for all color references (backgrounds, text, borders, shadows)
- **FR-006**: System MUST NOT use hardcoded color values (hex codes, named colors) in component styles
- **FR-007**: System MUST apply theme through a data-attribute or class on a root element (html or body tag)
- **FR-008**: System MUST support smooth transitions between theme changes with configurable duration

**Theme Persistence**
- **FR-009**: System MUST store user's theme preference in browser local storage
- **FR-010**: System MUST read stored theme preference on application load
- **FR-011**: System MUST fall back to "system" theme when no preference is stored
- **FR-012**: System MUST listen for OS theme changes when "system" mode is selected

**Theme Toggle Control**
- **FR-013**: System MUST provide a theme toggle button visible on all authenticated pages
- **FR-014**: System MUST display current theme state visually in the toggle control
- **FR-015**: System MUST allow users to cycle through light, dark, and system options

**Color System**
- **FR-016**: System MUST define semantic color variables for: background, foreground, primary, secondary, muted, accent, border, input, card
- **FR-017**: System MUST define opacity variants for semantic colors (e.g., primary/10, primary/20 for backgrounds)
- **FR-018**: System MUST ensure WCAG AA contrast ratios (4.5:1 for normal text, 3:1 for large text) in both themes

**Page-Specific Requirements**
- **FR-019**: Homepage MUST use CSS variables for all gradient backgrounds and ambient glow effects
- **FR-020**: Sign-in page MUST use CSS variables for all card, input, button, and background colors
- **FR-021**: Sign-up page MUST use CSS variables for all card, input, button, and background colors
- **FR-022**: Dashboard MUST use CSS variables for all background, text, card, and navigation colors
- **FR-023**: Chatbot interface MUST use CSS variables for all message bubbles, input areas, and sidebar colors

**Transition Handling**
- **FR-024**: System MUST apply theme immediately on page load (no flash of wrong theme)
- **FR-025**: System MUST suppress theme transitions during initial page render to prevent FOUC

### Key Entities

- **Theme Mode**: Enumeration of three possible values (light, dark, system) representing the user's theme preference
- **Color Variable**: Named CSS custom property representing a semantic color (e.g., --background, --foreground) with different values in each theme
- **Theme State**: The currently active theme configuration applied to the application

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: All pages (homepage, sign-in, sign-up, dashboard, chatbot) display correctly in both light and dark themes with zero color inconsistencies
- **SC-002**: Zero hardcoded color values remain in production CSS/SCSS files (100% CSS variable coverage)
- **SC-003**: Theme toggle works within 100ms of user click on all pages
- **SC-004**: Theme preference persists across browser sessions (100% reliability)
- **SC-005**: All text meets WCAG AA contrast standards in both themes (verified by contrast checker)
- **SC-006**: No flash of unstyled content or wrong theme on page load (FOUC < 50ms if measurable)
- **SC-007**: Users can successfully switch themes on any page with 100% success rate
- **SC-008**: Theme changes apply consistently to all visible UI elements (buttons, cards, inputs, text)

## Assumptions

1. The application uses a CSS-in-JS or utility-first CSS framework that supports CSS custom properties (Tailwind CSS v4)
2. Users have modern browsers that support CSS custom properties (all browsers since 2017)
3. The application has a theme toggle component already implemented that needs to be connected to the variable system
4. Users prefer light theme during daytime hours and dark theme during nighttime hours (based on OS usage patterns)
5. The "system" theme should be the default for new users
6. Color palette (OKLCH color space) has been designed and documented in previous work (001-frontend-design-improvements)
7. Ambient background effects (glows, gradients) should have reduced opacity/intensity in light mode for readability

## Dependencies

- Phase II Web Application (Next.js frontend with existing pages)
- CSS framework: Tailwind CSS v4 with CSS variable support
- next-themes library for theme state management
- Existing color palette design from 001-frontend-design-improvements
- Theme toggle component (already implemented)
