"use client"

import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { motion } from "framer-motion"

import { cn } from "@/lib/utils"

/**
 * Zenith Button Component
 * Features: 
 * - Adaptive sizing for mobile (larger touch targets on sm screens)
 * - Spring-based haptic feedback via Framer Motion
 * - Glassmorphism support in 'secondary' and 'outline' variants
 */
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap font-bold transition-colors duration-300 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-indigo-500",
  {
    variants: {
      variant: {
        default: "bg-indigo-600 text-white shadow-lg shadow-indigo-500/30 hover:bg-indigo-700",
        destructive: "bg-rose-600 text-white shadow-lg shadow-rose-500/30 hover:bg-rose-700",
        outline: "border border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50 text-gray-900 dark:text-white hover:bg-white/80 dark:hover:bg-gray-700/80 backdrop-blur-sm",
        secondary: "bg-white/10 dark:bg-gray-800/40 backdrop-blur-md border border-white/20 dark:border-gray-800/50 text-gray-700 dark:text-gray-300 hover:bg-white/20 dark:hover:bg-gray-700/60",
        ghost: "hover:bg-white/10 dark:hover:bg-gray-800/40 text-gray-700 dark:text-gray-300",
        link: "text-indigo-600 dark:text-indigo-400 underline-offset-4 hover:underline",
      },
      size: {
        // Mobile-first sizing: default is slightly larger for thumbs
        default: "h-11 px-6 py-3.5 sm:h-10 rounded-2xl sm:text-sm text-base",
        sm: "h-10 px-4 py-2 sm:h-9 rounded-xl text-sm",
        lg: "h-12 px-8 py-4 sm:h-11 rounded-2xl text-base sm:text-lg",
        icon: "size-11 sm:size-10 rounded-xl",
        "icon-sm": "size-10 sm:size-9 rounded-lg",
        "icon-lg": "size-12 sm:size-11 rounded-xl",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

type ButtonElementProps = VariantProps<typeof buttonVariants> & {
  asChild?: boolean
} & Omit<React.ComponentProps<"button">, "ref">

const Button = React.forwardRef<HTMLButtonElement, ButtonElementProps>(
  ({ className, variant, size, asChild = false, children, disabled, type, ...props }, ref) => {
    // If asChild is used (usually for Links), we can't use motion directly on it easily
    // so we handle standard button logic
    if (asChild) {
      return (
        <Slot
          className={cn(buttonVariants({ variant, size, className }))}
          ref={ref}
          {...props}
        >
          {children}
        </Slot>
      )
    }

    return (
      <motion.button
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ref={ref as any}
        /* MOTION LOGIC:
           - whileHover: Subtle scale up with spring physics
           - whileTap: Haptic 'sink' effect (active state)
        */
        whileHover={{ scale: 1.015 }}
        whileTap={{ scale: 0.97 }}
        transition={{ type: "spring", stiffness: 400, damping: 17 }}

        data-slot="button"
        data-variant={variant}
        data-size={size}
        className={cn(buttonVariants({ variant, size, className }))}
        disabled={disabled}
        type={type}
      >
        {children}
      </motion.button>
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }