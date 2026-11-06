'use client'

import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import { Moon, Sun, Monitor } from 'lucide-react'
import { cn } from '@/lib/utils'

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="h-10 w-[132px] rounded-xl border border-border bg-surface" aria-hidden="true" />
    )
  }

  const themes = [
    { value: 'light', icon: Sun, label: 'Light' },
    { value: 'dark', icon: Moon, label: 'Dark' },
    { value: 'system', icon: Monitor, label: 'System' },
  ] as const

  return (
    <div
      className="flex items-center gap-1 rounded-xl border border-border bg-surface p-1"
      role="group"
      aria-label="Theme"
    >
      {themes.map(({ value, icon: Icon, label }) => {
        const isActive = theme === value
        return (
          <button
            key={value}
            onClick={() => setTheme(value)}
            className={cn(
              "flex h-8 items-center justify-center rounded-lg px-2.5 transition-colors",
              isActive
                ? "bg-primary text-primary-foreground"
                : "text-foreground-muted hover:bg-hover-bg hover:text-foreground"
            )}
            title={`${label} theme`}
            aria-label={`Switch to ${label} theme`}
            aria-pressed={isActive}
          >
            <Icon className="h-4 w-4" aria-hidden="true" />
            <span className="sr-only">{label}</span>
          </button>
        )
      })}
    </div>
  )
}
