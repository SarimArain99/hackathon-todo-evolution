'use client'

import { motion, AnimatePresence, type Variants } from 'framer-motion'
import { prefersReducedMotion } from '@/lib/theme'

/**
 * PRODUCTION-GRADE MOTION TOKENS
 * Aligned with Zenith Design System v2.1
 */
const EXPO_OUT = [0.16, 1, 0.3, 1] as const;
const SPRING_PHYSICS = { type: "spring", damping: 25, stiffness: 120 } as const;

/**
 * Fade In Animation Variants
 */
export const fadeInVariants: Variants = {
  hidden: { opacity: 0, filter: 'blur(4px)' },
  visible: { 
    opacity: 1, 
    filter: 'blur(0px)',
    transition: { duration: 0.5, ease: EXPO_OUT } 
  },
  exit: { opacity: 0, filter: 'blur(4px)', transition: { duration: 0.3 } },
}

/**
 * Slide In From Top Animation Variants
 */
export const slideInFromTopVariants: Variants = {
  hidden: { opacity: 0, y: -30 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: SPRING_PHYSICS
  },
  exit: { opacity: 0, y: -20, transition: { duration: 0.2 } },
}

/**
 * Slide In From Bottom Animation Variants
 */
export const slideInFromBottomVariants: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: SPRING_PHYSICS
  },
  exit: { opacity: 0, y: 20, transition: { duration: 0.2 } },
}

/**
 * Scale In Animation Variants (Used for Dialogs/Modals)
 */
export const scaleInVariants: Variants = {
  hidden: { opacity: 0, scale: 0.92, filter: 'blur(8px)' },
  visible: { 
    opacity: 1, 
    scale: 1, 
    filter: 'blur(0px)',
    transition: {
      opacity: { duration: 0.4, ease: EXPO_OUT },
      scale: SPRING_PHYSICS
    }
  },
  exit: { opacity: 0, scale: 0.95, transition: { duration: 0.2 } },
}

/**
 * Stagger Container (Used for Task Lists)
 */
export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.05,
    },
  },
}

export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 15 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: SPRING_PHYSICS
  },
}

/**
 * Default transition settings respecting reduced motion
 */
export const defaultTransition = {
  duration: prefersReducedMotion() ? 0 : 0.4,
  ease: EXPO_OUT,
}

// --- REFINED ANIMATION WRAPPERS ---

/**
 * Animated Presence Wrapper
 */
export function AnimatedPresence({
  children,
  mode = 'wait',
}: {
  children: React.ReactNode
  mode?: 'wait' | 'sync' | 'popLayout'
}) {
  return <AnimatePresence mode={mode}>{children}</AnimatePresence>
}

/**
 * Fade In Component
 */
export function FadeIn({
  children,
  className = '',
  delay = 0,
}: {
  children: React.ReactNode
  className?: string
  delay?: number
}) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      exit="exit"
      variants={fadeInVariants}
      transition={{ delay }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

/**
 * Slide In Component
 */
export function SlideIn({
  children,
  className = '',
  direction = 'bottom',
  delay = 0,
}: {
  children: React.ReactNode
  className?: string
  direction?: 'top' | 'bottom' | 'left' | 'right'
  delay?: number
}) {
  const variants = {
    top: slideInFromTopVariants,
    bottom: slideInFromBottomVariants,
    left: { hidden: { opacity: 0, x: -30 }, visible: { opacity: 1, x: 0 }, exit: { opacity: 0, x: -20 } },
    right: { hidden: { opacity: 0, x: 30 }, visible: { opacity: 1, x: 0 }, exit: { opacity: 0, x: 20 } },
  }[direction]

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      exit="exit"
      variants={variants}
      transition={{ delay }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

/**
 * List Stagger Wrapper (New Production Utility)
 */
export function StaggerContainer({
  children,
  className = '',
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={staggerContainer}
      className={className}
    >
      {children}
    </motion.div>
  )
}