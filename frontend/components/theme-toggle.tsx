/**
 * Zenith Multi-Mode Switcher v2.2
 * Features:
 * - Shared Layout "Sliding Pill" Physics
 * - White-bordered Glassmorphism
 * - Hardware-accelerated Spring Haptics
 */

'use client'

import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import { Moon, Sun, Monitor } from 'lucide-react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // Critical for Next.js hydration safety
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="w-[120px] sm:w-[144px] h-10 sm:h-12 rounded-2xl glass-panel border-white/10" />
    )
  }

  const themes = [
    { value: 'light', icon: Sun, label: 'Light' },
    { value: 'dark', icon: Moon, label: 'Dark' },
    { value: 'system', icon: Monitor, label: 'System' },
  ] as const

  return (
    <div
      className={cn(
        "flex items-center gap-1.5 p-1.5 rounded-[1.25rem]",
        "glass-panel border-white/10 shadow-lg shadow-black/5"
      )}
      aria-label="Theme selection"
    >
      {themes.map(({ value, icon: Icon, label }) => {
        const isActive = theme === value

        return (
          <button
            key={value}
            onClick={() => setTheme(value)}
            className={cn(
              "relative flex items-center justify-center flex-1",
              "h-8 sm:h-10 rounded-[0.8rem] transition-all duration-500",
              "outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
              isActive 
                ? "text-primary-foreground" 
                : "text-foreground-muted hover:text-foreground hover:bg-white/5"
            )}
            title={`${label} Mode`}
            aria-label={`Switch to ${label} theme`}
            aria-pressed={isActive}
          >
            {/* THE SLIDING PILL: Animates across the layout */}
            {isActive && (
              <motion.div
                layoutId="activeThemePill"
                className="absolute inset-0 bg-primary rounded-[0.8rem] shadow-xl shadow-primary/20"
                transition={{
                  type: "spring",
                  stiffness: 400,
                  damping: 32,
                  mass: 1
                }}
              />
            )}

            {/* Icon: Lifted above the sliding pill */}
            <motion.div
              animate={{ 
                scale: isActive ? 1.1 : 1,
                rotate: isActive && value === 'light' ? 90 : 0 
              }}
              className="relative z-10"
            >
              <Icon className="w-4 h-4 sm:w-4.5 sm:h-4.5 stroke-[2.5]" />
            </motion.div>

            <span className="sr-only">{label}</span>
          </button>
        )
      })}
    </div>
  )
}