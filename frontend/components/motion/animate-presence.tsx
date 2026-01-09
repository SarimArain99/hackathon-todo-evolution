'use client'

import { motion, AnimatePresence, type Variants } from 'framer-motion'
import { prefersReducedMotion } from '@/lib/theme'

/**
 * Fade In Animation Variants
 */
export const fadeInVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
}

/**
 * Slide In From Top Animation Variants
 */
export const slideInFromTopVariants: Variants = {
  hidden: { opacity: 0, y: -20 },
  visible: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
}

/**
 * Slide In From Bottom Animation Variants
 */
export const slideInFromBottomVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 20 },
}

/**
 * Slide In From Left Animation Variants
 */
export const slideInFromLeftVariants: Variants = {
  hidden: { opacity: 0, x: -20 },
  visible: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -20 },
}

/**
 * Scale In Animation Variants
 */
export const scaleInVariants: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.95 },
}

/**
 * Stagger Children Animation Variants
 */
export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
  exit: { opacity: 0 },
}

export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
}

/**
 * Default transition settings respecting reduced motion preference
 */
export const defaultTransition = {
  duration: prefersReducedMotion() ? 0 : 0.2,
  ease: 'easeOut' as const,
}

/**
 * Page transition settings (slower for smoother feel)
 */
export const pageTransition = {
  duration: prefersReducedMotion() ? 0 : 0.3,
  ease: 'easeOut' as const,
}

/**
 * Animated Presence Wrapper
 *
 * Wraps children with AnimatePresence for enter/exit animations
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
      transition={{ ...defaultTransition, delay }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

/**
 * Slide In Component (from bottom by default)
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
    left: slideInFromLeftVariants,
    right: {
      hidden: { opacity: 0, x: 20 },
      visible: { opacity: 1, x: 0 },
      exit: { opacity: 0, x: 20 },
    },
  }[direction]

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      exit="exit"
      variants={variants}
      transition={{ ...defaultTransition, delay }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

/**
 * Scale In Component
 */
export function ScaleIn({
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
      variants={scaleInVariants}
      transition={{ ...defaultTransition, delay }}
      className={className}
    >
      {children}
    </motion.div>
  )
}
