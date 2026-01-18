"use client"

import * as React from "react"
import { motion, HTMLMotionProps } from "framer-motion"
import { cn } from "@/lib/utils"

/**
 * Zenith Card Component v2.1
 * Production-ready container system with semantic OKLCH support,
 * internal container queries (@container), and high-fidelity glassmorphism.
 */

const Card = React.forwardRef<
  HTMLDivElement,
  HTMLMotionProps<"div"> & { children?: React.ReactNode }
>(
  ({ className, children, ...props }, ref) => (
    <motion.div
      ref={ref}
      data-slot="card"
      /* ZENITH SPATIAL PHYSICS:
         - Subtle lift on entry
         - Hover interaction that expands the drop-shadow
      */
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      whileHover={{ 
        y: -6, 
        transition: { type: "spring", stiffness: 400, damping: 25 } 
      }}
      
      className={cn(
        // Use semantic glass utilities
        "glass-panel rounded-[2.5rem] sm:rounded-4xl",
        "shadow-xl shadow-primary/5 hover:shadow-2xl hover:shadow-primary/10",
        "flex flex-col overflow-hidden transition-all duration-500",
        "@container/card", // Critical for responsive internal components
        className
      )}
      {...props}
    >
      {/* Visual Polish: Internal Shine/Glare */}
      <div className="absolute inset-0 pointer-events-none bg-linear-to-br from-white/5 to-transparent dark:from-white/2" />
      <div className="relative z-10 flex flex-col h-full">
        {children}
      </div>
    </motion.div>
  )
)
Card.displayName = "Card"

function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-header"
      className={cn(
        "grid auto-rows-min items-start gap-1.5",
        "px-6 sm:px-10 pt-8 sm:pt-10 pb-5",
        // Stacks title and actions if the card is narrow (< 320px)
        "grid-cols-1 @[20rem]/card:grid-cols-[1fr_auto]", 
        className
      )}
      {...props}
    />
  )
}

function CardTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <h3
      data-slot="card-title"
      className={cn(
        "font-display font-bold tracking-tightest text-foreground leading-[1.1]",
        "text-2xl sm:text-3xl", 
        className
      )}
      {...props}
    />
  )
}

function CardDescription({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <p
      data-slot="card-description"
      className={cn(
        "text-foreground-muted font-light leading-relaxed",
        "text-sm sm:text-base", 
        className
      )}
      {...props}
    />
  )
}

function CardAction({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-action"
      className={cn(
        "self-start justify-self-end flex items-center gap-3",
        // Smart positioning: top right on desktop, flows naturally on mobile
        "row-start-1 @[20rem]/card:col-start-2 @[20rem]/card:row-span-2",
        className
      )}
      {...props}
    />
  )
}

function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-content"
      className={cn(
        "px-6 sm:px-10 py-5 sm:py-6 flex-1",
        className
      )}
      {...props}
    />
  )
}

function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-footer"
      className={cn(
        "flex items-center gap-4 px-6 sm:px-10 py-6 sm:py-8 mt-auto",
        "border-t border-border/40 bg-surface/30 backdrop-blur-sm",
        className
      )}
      {...props}
    />
  )
}

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardAction,
  CardDescription,
  CardContent,
}