"use client"

import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { motion } from "framer-motion"

import { cn } from "@/lib/utils"

/**
 * Zenith Button Component v2.1
 * Refined for high-end tactile feedback and theme-agnostic contrast.
 */
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2.5 whitespace-nowrap font-bold transition-all duration-300 disabled:pointer-events-none disabled:opacity-40 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4.5 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-4 focus-visible:ring-primary/20",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground shadow-xl shadow-primary/10 hover:shadow-primary/20 button-shine",
        destructive: "bg-danger text-white shadow-lg shadow-danger/10 hover:bg-danger/90",
        outline: "border-2 border-border bg-transparent text-foreground hover:bg-surface hover:border-border-strong backdrop-blur-sm",
        secondary: "glass-panel bg-surface/50 text-foreground border-border/50 hover:bg-surface/80 hover:border-primary/30",
        ghost: "hover:bg-primary/5 text-foreground hover:text-primary",
        link: "text-primary underline-offset-8 hover:underline decoration-2 font-black tracking-tight",
      },
      size: {
        default: "h-12 px-7 py-4 sm:h-11 rounded-[var(--radius-lg)] sm:text-sm text-base tracking-tight",
        sm: "h-10 px-4 py-2 rounded-[var(--radius-md)] text-xs uppercase tracking-widest",
        lg: "h-14 px-10 py-5 rounded-[var(--radius-xl)] text-base sm:text-lg font-black tracking-tight",
        icon: "size-12 sm:size-11 rounded-[var(--radius-lg)]",
        "icon-sm": "size-10 sm:size-9 rounded-[var(--radius-md)]",
        "icon-lg": "size-14 sm:size-13 rounded-[var(--radius-xl)]",
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
        /* ZENITH TACTILE PHYSICS:
           - whileHover: Subtle lift and internal shadow adjustment
           - whileTap: Deep haptic press for confirmation
        */
        whileHover={{ 
          scale: 1.015,
          y: -1
        }}
        whileTap={{ scale: 0.96 }}
        transition={{ 
          type: "spring", 
          stiffness: 500, 
          damping: 20,
          mass: 0.8 
        }}

        data-slot="button"
        data-variant={variant}
        data-size={size}
        className={cn(buttonVariants({ variant, size, className }))}
        disabled={disabled}
        type={type}
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        {...(props as any)}
      >
        {children}
      </motion.button>
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }