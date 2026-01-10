'use client'

import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import { Moon, Sun, Monitor } from 'lucide-react'
import { motion } from 'framer-motion'

/**
 * Zenith Theme Toggle - Master Version
 * Features:
 * - Shared Layout "Pill" Animation
 * - Spring-physics haptics
 * - Fluid scaling for mobile-first headers
 */
export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // useEffect only runs on client, preventing hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="w-[108px] sm:w-[132px] h-9 sm:h-11 rounded-xl bg-white/10 dark:bg-gray-800/50 backdrop-blur-md border border-white/20 dark:border-gray-700/30" />
    )
  }

  const themes = [
    { value: 'light', icon: Sun, label: 'Light' },
    { value: 'dark', icon: Moon, label: 'Dark' },
    { value: 'system', icon: Monitor, label: 'System' },
  ] as const

  return (
    <div 
      className="flex items-center gap-1 p-1 rounded-xl bg-white/20 dark:bg-gray-950/40 backdrop-blur-md border border-white/20 dark:border-white/5 shadow-sm"
      aria-label="Theme selection"
    >
      {themes.map(({ value, icon: Icon, label }) => {
        const isActive = theme === value
        
        return (
          <button
            key={value}
            onClick={() => setTheme(value)}
            className={`
              relative flex items-center justify-center
              p-1.5 sm:p-2 rounded-lg 
              transition-colors duration-300
              ${isActive ? 'text-white' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}
            `}
            title={`${label} Mode`}
            aria-label={`Switch to ${label} theme`}
            aria-pressed={isActive}
          >
            {/* ADVANCED: Shared Layout Background Pill */}
            {isActive && (
              <motion.div
                layoutId="activeTheme"
                className="absolute inset-0 bg-indigo-600 rounded-lg shadow-lg shadow-indigo-500/20"
                transition={{
                  type: "spring",
                  stiffness: 380,
                  damping: 30
                }}
              />
            )}

            {/* Icon remains relative to stay above the animated pill */}
            <Icon className="relative z-10 w-4 h-4 sm:w-5 sm:h-5" />
            
            <span className="sr-only">{label}</span>
          </button>
        )
      })}
    </div>
  )
}