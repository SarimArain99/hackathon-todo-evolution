'use client'

import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'

/**
 * PRODUCTION-GRADE TRANSITION TOKENS
 * Fast entry, smooth landing, and subtle blur for depth.
 */
const PAGE_TRANSITION_EASE: [number, number, number, number] = [0.16, 1, 0.3, 1]; // Expo-Out
const SPRING_TRANSITION = { type: "spring" as const, damping: 30, stiffness: 150 };

/**
 * UTILITY: Responsive Offset
 * Ensures that motion distance feels appropriate for the screen size.
 */
const useResponsiveOffset = (base = 40) => {
  const [offset, setOffset] = useState(base)

  useEffect(() => {
    const handleResize = () => {
      setOffset(window.innerWidth < 768 ? base / 2 : base)
    }
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [base])

  return offset
}

/**
 * Standard Page Transition
 * Best for: General dashboard views.
 * Features: Soft scale-in and opacity fade with background blur.
 */
export function PageTransition({
  children,
  className = '',
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.99, filter: 'blur(10px)' }}
      animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
      exit={{ opacity: 0, scale: 1.01, filter: 'blur(5px)' }}
      transition={{ duration: 0.5, ease: PAGE_TRANSITION_EASE }}
      className={className}
      layout="position"
    >
      {children}
    </motion.div>
  )
}

/**
 * Slide Page Transition
 * Best for: Wizard flows or "Next Step" navigations.
 * Features: Responsive x/y translation and hardware-accelerated transforms.
 */
export function SlidePageTransition({
  children,
  direction = 'left',
  className = '',
}: {
  children: React.ReactNode
  direction?: 'left' | 'right' | 'up' | 'down'
  className?: string
}) {
  const offset = useResponsiveOffset(30)

  const variants = {
    left: { 
      initial: { x: offset, opacity: 0 }, 
      animate: { x: 0, opacity: 1 }, 
      exit: { x: -offset, opacity: 0 } 
    },
    right: { 
      initial: { x: -offset, opacity: 0 }, 
      animate: { x: 0, opacity: 1 }, 
      exit: { x: offset, opacity: 0 } 
    },
    up: { 
      initial: { y: offset, opacity: 0 }, 
      animate: { y: 0, opacity: 1 }, 
      exit: { y: -offset, opacity: 0 } 
    },
    down: { 
      initial: { y: -offset, opacity: 0 }, 
      animate: { y: 0, opacity: 1 }, 
      exit: { y: offset, opacity: 0 } 
    },
  }[direction]

  return (
    <motion.div
      initial={variants.initial}
      animate={variants.animate}
      exit={variants.exit}
      transition={{ 
        opacity: { duration: 0.3, ease: 'linear' },
        default: SPRING_TRANSITION 
      }}
      className={className}
      style={{ width: '100%', willChange: 'transform, opacity' }}
    >
      {children}
    </motion.div>
  )
}

/**
 * Glass View Transition (New Production Utility)
 * Best for: Opening the AI Chat or deep-dive task details.
 * Features: High-end "Glass" reveal effect using Backdrop Filters.
 */
export function GlassTransition({
  children,
  className = '',
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <motion.div
      initial={{ opacity: 0, backdropFilter: 'blur(0px)' }}
      animate={{ opacity: 1, backdropFilter: 'blur(12px)' }}
      exit={{ opacity: 0, backdropFilter: 'blur(0px)' }}
      transition={{ duration: 0.6, ease: PAGE_TRANSITION_EASE }}
      className={className}
    >
      {children}
    </motion.div>
  )
}