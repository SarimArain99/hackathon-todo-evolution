'use client'

import { motion } from 'framer-motion'
import { pageTransition } from './animate-presence'
import { useEffect, useState } from 'react'

/**
 * UTILITY: Responsive Offset
 * Calculates a proportional slide distance based on screen width.
 */
const useResponsiveOffset = (base = 20) => {
  const [offset, setOffset] = useState(base)

  useEffect(() => {
    const handleResize = () => {
      // Small mobile (640px) gets a smaller 10px slide for a tighter feel
      setOffset(window.innerWidth < 640 ? base / 2 : base)
    }
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [base])

  return offset
}

/**
 * Page Transition Wrapper
 * Features: Fluid opacity fade and layout stabilization
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
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={pageTransition}
      className={className}
      // Layout ensures that if the page height changes, the transition remains smooth
      layout="size"
    >
      {children}
    </motion.div>
  )
}

/**
 * Slide Page Transition
 * Features: Dynamic direction-based sliding with responsive distance
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
  const offset = useResponsiveOffset(20)

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
      transition={pageTransition}
      className={className}
      // prevents layout shift on mobile when switching views
      style={{ width: '100%' }}
    >
      {children}
    </motion.div>
  )
}