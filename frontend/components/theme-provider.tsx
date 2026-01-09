'use client'

import { ThemeProvider as NextThemesProvider } from 'next-themes'
import type { ThemeProviderProps } from 'next-themes'

/**
 * Theme Provider Wrapper
 *
 * Wraps next-themes ThemeProvider with Zenith configuration.
 * Handles SSR/hydration and prevents flash of wrong theme.
 *
 * Place in app/layout.tsx as the outermost wrapper.
 */
export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}
