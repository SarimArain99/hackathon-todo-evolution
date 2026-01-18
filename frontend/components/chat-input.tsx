"use client"

import { useState, KeyboardEvent, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Send, Loader2, Paperclip, Command, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "./ui/button"
import { EmojiPicker, QuickEmojiRow } from "./ui/emoji-picker"

interface ChatInputProps {
  onSendMessage: (message: string) => void
  isLoading?: boolean
  disabled?: boolean
  placeholder?: string
  className?: string
  showEmojiPicker?: boolean
}

export function ChatInput({
  onSendMessage,
  isLoading = false,
  disabled = false,
  placeholder = "Plant a new task or ask me anything...",
  className,
  showEmojiPicker = true,
}: ChatInputProps) {
  const [input, setInput] = useState("")
  const [isFocused, setIsFocused] = useState(false)
  const [showQuickEmojis, setShowQuickEmojis] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = "auto"
      textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`
    }
  }, [input])

  const handleSend = () => {
    const trimmed = input.trim()
    if (trimmed && !isLoading && !disabled) {
      onSendMessage(trimmed)
      setInput("")
      setShowQuickEmojis(false)
      if (textareaRef.current) textareaRef.current.style.height = "auto"
    }
  }

  const handleEmojiSelect = (emoji: string) => {
    setInput((prev) => prev + emoji)
    textareaRef.current?.focus()
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const canSend = input.trim().length > 0 && !isLoading && !disabled

  return (
    <div className={cn("relative z-10", className)}>
      <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
        {/* Main Input Container */}
        <motion.div
          animate={isFocused ? { y: -4 } : { y: 0 }}
          className={cn(
            "relative flex items-end gap-2 p-2 rounded-4xl transition-all duration-500",
            "glass-panel border-2",
            isFocused 
              ? "border-primary/40 shadow-[0_20px_50px_-12px_var(--ring)]" 
              : "border-border/40 shadow-xl shadow-primary/5"
          )}
        >
          {/* Subtle Focus Glow */}
          <AnimatePresence>
            {isFocused && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute -inset-1 rounded-[2.1rem] bg-primary/5 blur-xl pointer-events-none"
              />
            )}
          </AnimatePresence>

          {/* Attachment (Hidden on mobile for cleaner UI) */}
          <motion.button
            whileHover={{ scale: 1.1, rotate: 15 }}
            whileTap={{ scale: 0.9 }}
            className="shrink-0 p-3 rounded-2xl text-foreground-muted hover:text-primary hover:bg-primary/5 transition-all hidden sm:flex"
            type="button"
          >
            <Paperclip className="w-5 h-5" />
          </motion.button>

          {/* Text Area Engine */}
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder={placeholder}
              disabled={disabled || isLoading}
              rows={1}
              className={cn(
                "w-full px-4 py-3.5 rounded-2xl resize-none bg-transparent",
                "text-base sm:text-sm text-foreground placeholder:text-foreground-muted/40",
                "focus:outline-none disabled:opacity-50 font-body leading-relaxed",
                "scrollbar-none"
              )}
              style={{ minHeight: "52px", maxHeight: "200px" }}
            />
            
            {/* Visual indicator of "Active" input */}
            <div className={cn(
              "absolute bottom-0 left-4 right-4 h-0.5 rounded-full transition-all duration-700",
              isFocused ? "bg-primary/20 scale-x-100" : "bg-transparent scale-x-0"
            )} />
          </div>

          {/* Action Cluster */}
          <div className="flex items-center gap-1.5 pr-1 pb-1">
            {showEmojiPicker && (
              <EmojiPicker onEmojiSelect={handleEmojiSelect} />
            )}

            <Button
              size="icon"
              onClick={handleSend}
              disabled={!canSend}
              className={cn(
                "h-11 w-11 sm:h-12 sm:w-12 rounded-[1.25rem] transition-all duration-500",
                canSend 
                  ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20 hover:scale-105" 
                  : "bg-surface-elevated text-foreground-muted/30 opacity-50 grayscale"
              )}
            >
              <AnimatePresence mode="wait">
                {isLoading ? (
                  <motion.div
                    key="loading"
                    initial={{ rotate: -90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: 90, opacity: 0 }}
                  >
                    <Loader2 className="w-5 h-5 animate-spin" />
                  </motion.div>
                ) : (
                  <motion.div
                    key="send"
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 1.2, opacity: 0 }}
                  >
                    <Send className={cn("w-5 h-5", canSend && "animate-reveal")} />
                  </motion.div>
                )}
              </AnimatePresence>
            </Button>
          </div>
        </motion.div>

        {/* Dynamic Shortcut Helper */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="hidden sm:flex items-center justify-between mt-4 px-4"
        >
          <div className="flex items-center gap-6">
            <ShortcutKey label="Send" keys={["Enter"]} color="var(--primary)" />
            <ShortcutKey label="New Line" keys={["Shift", "Enter"]} color="var(--secondary)" />
          </div>

          <motion.button
            whileHover={{ scale: 1.05, y: -1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowQuickEmojis(!showQuickEmojis)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.2em] transition-all",
              showQuickEmojis 
                ? "bg-primary text-primary-foreground" 
                : "bg-surface/50 text-foreground-muted hover:bg-surface-elevated border border-border/40"
            )}
          >
            <Sparkles className="w-3 h-3" />
            Express
          </motion.button>
        </motion.div>

        {/* Quick Expression Row */}
        <AnimatePresence>
          {showQuickEmojis && (
            <motion.div
              initial={{ opacity: 0, height: 0, filter: 'blur(10px)' }}
              animate={{ opacity: 1, height: "auto", filter: 'blur(0px)' }}
              exit={{ opacity: 0, height: 0, filter: 'blur(10px)' }}
              className="mt-4 glass-panel rounded-3xl overflow-hidden p-2"
            >
              <QuickEmojiRow onEmojiSelect={handleEmojiSelect} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

function ShortcutKey({ label, keys, color }: { label: string; keys: string[]; color: string }) {
  return (
    <div className="flex items-center gap-2 opacity-50 hover:opacity-100 transition-opacity cursor-default">
      <span className="text-[10px] font-bold uppercase tracking-widest text-foreground-muted">{label}</span>
      <div className="flex items-center gap-1">
        {keys.map((k) => (
          <kbd key={k} className="px-1.5 py-0.5 rounded-md border border-border/60 bg-surface/50 text-[9px] font-mono shadow-sm">
            {k === "Command" ? <Command className="w-2.5 h-2.5" /> : k}
          </kbd>
        ))}
      </div>
    </div>
  )
}

export function QuickReplies({ suggestions, onSelect, className }: { suggestions: string[]; onSelect: (s: string) => void; className?: string }) {
  return (
    <div className={cn("flex flex-wrap justify-center gap-3 px-4 py-6", className)}>
      {suggestions.map((suggestion, idx) => (
        <motion.button
          key={suggestion}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: idx * 0.04, type: "spring", damping: 20 }}
          whileHover={{ y: -3, scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onSelect(suggestion)}
          className="px-6 py-3 text-xs font-bold glass-panel rounded-2xl border border-border/40 hover:border-primary/30 hover:bg-primary/5 transition-all text-foreground shadow-sm uppercase tracking-widest"
        >
          {suggestion}
        </motion.button>
      ))}
    </div>
  )
}