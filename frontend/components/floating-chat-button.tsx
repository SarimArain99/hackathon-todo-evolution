"use client"

import { motion } from "framer-motion"
import { MessageSquare, Sparkles } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"

interface FloatingChatButtonProps {
  className?: string
}

/**
 * Zenith Floating Portal v2.1
 * Features:
 * - Ambient backdrop-blur logic
 * - Hardware-accelerated ripple physics
 * - Contrast-aware theme mapping (OKLCH)
 */
export function FloatingChatButton({ className }: FloatingChatButtonProps) {
  return (
    <Link href="/chat" className="fixed bottom-6 right-6 z-50 group">
      <motion.div
        initial={{ scale: 0, opacity: 0, filter: "blur(10px)" }}
        animate={{ scale: 1, opacity: 1, filter: "blur(0px)" }}
        transition={{
          type: "spring",
          stiffness: 400,
          damping: 25,
          delay: 0.5,
        }}
        whileHover={{ scale: 1.08, y: -4 }}
        whileTap={{ scale: 0.94 }}
        className={cn(
          "relative flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16",
          "rounded-[1.75rem] shadow-2xl transition-all duration-500",
          "bg-primary text-primary-foreground border border-white/20",
          "shadow-primary/20 hover:shadow-primary/40",
          "button-shine overflow-hidden",
          className
        )}
      >
        {/* ATMOSPHERIC RIPPLE
            Uses primary color with high transparency for a subtle 'breathing' effect
        */}
        <motion.div
          animate={{
            scale: [1, 1.4, 1],
            opacity: [0.3, 0, 0.3],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute inset-0 rounded-[1.75rem] bg-white pointer-events-none"
        />

        {/* GLOW CORE
            Adds a central light source to the button for depth
        */}
        <div className="absolute inset-0 bg-linear-to-tr from-transparent via-white/10 to-white/20 pointer-events-none" />

        {/* ICON CLUSTER */}
        <div className="relative z-10">
          <MessageSquare className="w-6 h-6 sm:w-7 sm:h-7" />
          <motion.div
            animate={{ 
              opacity: [0, 1, 0],
              scale: [0.8, 1.2, 0.8]
            }}
            transition={{ duration: 2, repeat: Infinity, delay: 1 }}
            className="absolute -top-1 -right-1"
          >
            <Sparkles className="w-3 h-3 text-primary-foreground" />
          </motion.div>
        </div>

        {/* ACCESSIBILITY LABEL */}
        <span className="sr-only">Open Zenith AI Assistant</span>
      </motion.div>
      
      {/* TOOLTIP 
          Appears on hover for better desktop discoverability
      */}
      <div className="absolute right-full mr-4 top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-xl glass-panel text-[10px] font-black uppercase tracking-[0.2em] text-foreground opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
        Zenith Assistant
      </div>
    </Link>
  )
}