"use client"

import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Smile, X, Sparkles } from "lucide-react"
import data from "@emoji-mart/data"
import Picker from "@emoji-mart/react"
import { cn } from "@/lib/utils"

interface EmojiPickerProps {
  onEmojiSelect: (emoji: string) => void
  className?: string
}

interface QuickEmojiRowProps {
  onEmojiSelect: (emoji: string) => void
  className?: string
}

/**
 * Zenith Emoji Intelligence
 * Features: 
 * - Adaptive glassmorphic container
 * - Perception-based category navigation
 * - Spring-physics interactions
 */
export function EmojiPicker({ onEmojiSelect, className }: EmojiPickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const pickerRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        pickerRef.current &&
        !pickerRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }
    if (isOpen) document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [isOpen])

  const handleEmojiSelect = (emoji: { native: string }) => {
    onEmojiSelect(emoji.native)
    setIsOpen(false)
  }

  return (
    <div className={cn("relative", className)}>
      <motion.button
        ref={buttonRef}
        whileHover={{ scale: 1.1, y: -1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "shrink-0 p-2.5 rounded-xl transition-all duration-300",
          isOpen
            ? "text-primary bg-primary/10 shadow-inner"
            : "text-foreground-muted hover:text-primary hover:bg-primary/5"
        )}
        type="button"
        aria-label="Add emoji"
      >
        <Smile className={cn("w-5 h-5", isOpen && "animate-pulse")} />
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={pickerRef}
            initial={{ opacity: 0, scale: 0.9, y: 10, filter: "blur(10px)" }}
            animate={{ opacity: 1, scale: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, scale: 0.9, y: 10, filter: "blur(10px)" }}
            transition={{ type: "spring", damping: 20, stiffness: 300 }}
            className="absolute bottom-full left-0 mb-4 z-50 origin-bottom-left"
          >
            <div className="glass-panel rounded-3xl p-1.5 shadow-2xl shadow-primary/10 border-primary/10 overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between px-3 py-2 border-b border-border/40">
                <div className="flex items-center gap-2">
                   <Sparkles className="w-3 h-3 text-primary" />
                   <span className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground-muted">
                    Zenith Expression
                  </span>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded-lg text-foreground-muted hover:text-foreground hover:bg-surface-elevated transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Emoji Picker Integration */}
              <div className="bg-surface/50 rounded-xl overflow-hidden mt-1.5">
                <Picker
                  data={data}
                  onEmojiSelect={handleEmojiSelect}
                  theme="auto"
                  previewPosition="none"
                  skinTonePosition="none"
                  navPosition="bottom"
                  searchPosition="none"
                  maxFrequentRows={1}
                  perLine={8}
                  emojiSize={22}
                  emojiButtonSize={32}
                  style={{ 
                    '--em-background': 'transparent',
                    '--em-border-color': 'transparent',
                    '--em-color-border': 'transparent'
                  }}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/**
 * QuickEmojiRow - Contextual Selection
 * Optimized for horizontal flow and touch targets.
 */
export function QuickEmojiRow({ onEmojiSelect, className }: QuickEmojiRowProps) {
  const quickEmojis = [
    "✅", "🎯", "🔥", "🚀", "💡", "⏳", "📅", "📝",
    "✨", "⭐", "💯", "🎉", "👍", "🙏", "💪", "🧠"
  ]

  return (
    <div className={cn("flex items-center gap-1.5 overflow-x-auto hide-scrollbar py-3 px-1", className)}>
      {quickEmojis.map((emoji, idx) => (
        <motion.button
          key={idx}
          whileHover={{ scale: 1.2, y: -2 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => onEmojiSelect(emoji)}
          className="shrink-0 w-10 h-10 flex items-center justify-center rounded-xl bg-surface/40 border border-border/20 hover:border-primary/30 hover:bg-primary/5 transition-all text-xl"
          type="button"
        >
          {emoji}
        </motion.button>
      ))}
    </div>
  )
}