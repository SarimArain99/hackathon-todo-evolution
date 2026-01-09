/**
 * Theme utilities for Zenith application
 * Provides theme constants and helper functions for theme management
 */

export type Theme = 'light' | 'dark' | 'system'

export const themes: Theme[] = ['light', 'dark', 'system']

export const themeLabels: Record<Theme, string> = {
  light: 'Light',
  dark: 'Dark',
  system: 'System',
}

/**
 * Check if user prefers reduced motion
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/**
 * Get the resolved theme (actual applied theme, accounting for system preference)
 */
export function getResolvedTheme(theme: Theme): 'light' | 'dark' {
  if (theme !== 'system') return theme
  if (typeof window === 'undefined') return 'dark' // Default SSR
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

/**
 * Get animation duration based on reduced motion preference
 */
export function getAnimationDuration(defaultMs: number): number {
  return prefersReducedMotion() ? 0 : defaultMs
}

/**
 * Zenith brand colors for reference
 */
export const zenithColors = {
  primary: '#4f46e5', // Indigo 600
  secondary: '#9333ea', // Purple 600
  light: {
    background: '#f8fafc', // Slate 50
    foreground: '#0f172a', // Slate 900
    glassBg: 'rgba(255, 255, 255, 0.4)',
    glassBorder: 'rgba(255, 255, 255, 0.2)',
  },
  dark: {
    background: '#020617', // Slate 950
    foreground: '#f1f5f9', // Slate 100
    glassBg: 'rgba(15, 23, 42, 0.4)',
    glassBorder: 'rgba(255, 255, 255, 0.05)',
  },
} as const
