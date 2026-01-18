"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"

/**
 * Zenith Intelligent Input v2.1
 * Features:
 * - Dynamic focus halo using OKLCH primary token
 * - Blur-to-Clear placeholder transitions
 * - iOS Zoom-prevention (16px base text)
 * - Semantic glassmorphic surface
 */

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    const [isFocused, setIsFocused] = React.useState(false);

    return (
      <div className="relative w-full group">
        {/* EXTERNAL GLOW HALO
            Animates on focus to create a sense of 'activation'
        */}
        <AnimatePresence>
          {isFocused && (
            <motion.div
              layoutId="input-glow"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1.01 }}
              exit={{ opacity: 0, scale: 1.02 }}
              className="absolute -inset-0.75 rounded-[1.4rem] blur-md pointer-events-none z-0"
              style={{ 
                background: 'var(--primary)', 
                opacity: 0.15 
              }}
            />
          )}
        </AnimatePresence>

        <input
          ref={ref}
          type={type}
          data-slot="input"
          onFocus={(e) => {
            setIsFocused(true);
            props.onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            props.onBlur?.(e);
          }}
          className={cn(
            // Zenith Base Material
            "relative z-10 w-full px-5 py-4 rounded-2xl",
            "bg-surface/40 dark:bg-surface/20 backdrop-blur-xl",
            "border-2 border-border/40",
            "text-foreground",
            
            // Typography
            "placeholder:text-foreground-muted/40 placeholder:font-light",
            "text-base sm:text-sm tracking-tight",
            
            // Interaction States
            "transition-all duration-300 ease-out",
            "focus:border-primary/40 focus:bg-surface/60",
            "outline-none",
            "disabled:opacity-40 disabled:cursor-not-allowed",
            
            // Mobile Optimization
            "appearance-none", // Removes default iOS styling
            
            // File input logic
            "file:border-0 file:bg-primary/10 file:rounded-lg file:px-3 file:py-1 file:mr-4 file:text-xs file:font-bold file:text-primary",
            className
          )}
          {...props}
        />
        
        {/* BOTTOM ACCENT LINE
            A subtle detail that adds to the 'Premium' feel
        */}
        <motion.div 
          initial={false}
          animate={{ 
            scaleX: isFocused ? 1 : 0,
            opacity: isFocused ? 1 : 0 
          }}
          className="absolute bottom-0 left-6 right-6 h-0.5 bg-primary/30 blur-[1px] z-20 origin-center rounded-full"
        />
      </div>
    )
  }
)
Input.displayName = "Input"

export { Input }