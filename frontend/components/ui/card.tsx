"use client"

import * as React from "react"
import { motion, HTMLMotionProps } from "framer-motion"
import { cn } from "@/lib/utils"

/**
 * Zenith Card Component
 * Features:
 * - Backdrop-blur-3xl for premium frosted glass feel
 * - Responsive padding scales (px-4 to px-8)
 * - Spring-based hover interactions
 * - Container-query aware header
 */

const Card = React.forwardRef<HTMLDivElement, HTMLMotionProps<"div">>(
  ({ className, ...props }, ref) => (
    <motion.div
      ref={ref}
      data-slot="card"
      /* MOTION: Subtle entrance and hover "lift" */
      initial={{ opacity: 0, y: 15 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      
      className={cn(
        // Glassmorphism Base
        "bg-white/40 dark:bg-gray-900/40 backdrop-blur-3xl",
        "border border-white/20 dark:border-gray-800/50",
        "rounded-[2rem] sm:rounded-3xl shadow-xl hover:shadow-2xl hover:shadow-indigo-500/10",
        "flex flex-col overflow-hidden transition-colors duration-500",
        "@container/card", // Define container for internal responsive logic
        className
      )}
      {...props}
    />
  )
)
Card.displayName = "Card"

function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-header"
      /* RESPONSIVENESS: 
         Uses @container queries to stack title/actions if the card gets too narrow
      */
      className={cn(
        "grid auto-rows-min items-start gap-2",
        "px-5 sm:px-8 pt-6 sm:pt-8 pb-4",
        "grid-cols-1 @[20rem]/card:grid-cols-[1fr_auto]", 
        className
      )}
      {...props}
    />
  )
}

function CardTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-title"
      className={cn(
        "font-black tracking-tight text-gray-900 dark:text-white leading-tight",
        "text-xl sm:text-2xl", // Fluid font size
        className
      )}
      {...props}
    />
  )
}

function CardDescription({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-description"
      className={cn(
        "text-gray-600 dark:text-gray-400 font-medium leading-relaxed",
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
        "self-start justify-self-end flex items-center gap-2",
        // Position at top right in wide cards, or below title in tiny cards
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
        "px-5 sm:px-8 py-4 sm:py-6 flex-1",
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
        "flex items-center gap-4 px-5 sm:px-8 py-6 sm:py-8 mt-auto",
        "border-t border-white/10 dark:border-gray-800/50 bg-white/5 dark:bg-black/5",
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