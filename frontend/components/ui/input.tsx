"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

/**
 * Zenith Input Component
 * Features:
 * - Motion-enhanced focus states (glow & lift)
 * - iOS-friendly font scaling (prevents auto-zoom)
 * - Glassmorphism surface with dynamic border
 */

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <motion.div
        className="relative w-full"
        initial={false}
        whileFocus="focused"
      >
        {/* Subtle background glow effect on focus */}
        <motion.div
          variants={{
            focused: { opacity: 1, scale: 1.02 },
            initial: { opacity: 0, scale: 1 }
          }}
          className="absolute -inset-1 bg-indigo-500/10 rounded-[1.4rem] blur-md pointer-events-none"
        />

        <input
          ref={ref}
          type={type}
          data-slot="input"
          
          className={cn(
            // Zenith glassmorphism base
            "relative w-full px-5 py-3.5 rounded-2xl",
            "border border-gray-200 dark:border-white/10",
            "bg-white/50 dark:bg-gray-900/50 backdrop-blur-xl",
            "text-gray-900 dark:text-white",
            "placeholder:text-gray-400 placeholder:font-medium",
            
            // Interaction logic
            "transition-colors duration-300",
            "focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/5",
            "outline-none",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            
            /* RESPONSIVENESS:
               - text-base (16px) on mobile prevents iOS Safari from auto-zooming 
               - py-3.5 provides a larger touch target for mobile users
            */
            "text-base sm:text-sm", 
            
            // File input logic
            "file:border-0 file:bg-transparent file:text-sm file:font-bold file:text-indigo-600 dark:file:text-indigo-400",
            className
          )}
          {...props}
        />
      </motion.div>
    )
  }
)
Input.displayName = "Input"

export { Input }