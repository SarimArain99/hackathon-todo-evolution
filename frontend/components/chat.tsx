"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Bot, User, Loader2, Sparkles, Check, Trash2, Zap, Clock } from "lucide-react"
import { cn } from "@/lib/utils"
import type { ToolCall } from "@/lib/api/chat"

/* --- INTERFACES --- */

interface ChatMessageProps {
  role: "user" | "assistant"
  content: string
  toolCalls?: ToolCall[]
  isLoading?: boolean
}

interface ChatContainerProps {
  children: React.ReactNode
  className?: string
}

interface ChatMessagesProps {
  children: React.ReactNode
  className?: string
}

interface EmptyStateProps {
  title?: string
  subtitle?: string
  suggestions?: string[]
  onSelectSuggestion?: (suggestion: string) => void
}

/* --- COMPONENTS --- */

/**
 * Zenith Message Component v2.1
 * Features:
 * - Differentiated spatial alignment
 * - Dynamic "Action Chips" for tool calls
 * - Ethereal avatar glows
 */
export function ChatMessage({ role, content, toolCalls, isLoading }: ChatMessageProps) {
  const isUser = role === "user"

  const getToolIcon = (name: string) => {
    switch (name) {
      case "add_task": return <Sparkles className="w-3 h-3 text-primary" />
      case "complete_task": return <Check className="w-3 h-3 text-success" />
      case "delete_task": return <Trash2 className="w-3 h-3 text-danger" />
      default: return <Zap className="w-3 h-3 text-secondary" />
    }
  }

  const getToolLabel = (name: string) => {
    const labels: Record<string, string> = {
      add_task: "Objective Created",
      complete_task: "Task Finalized",
      delete_task: "Record Removed",
      update_task: "Context Updated",
      list_tasks: "Workspace Synced"
    }
    return labels[name] || name
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 15, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", damping: 25, stiffness: 200 }}
      className={cn(
        "flex gap-4 mb-8 relative group",
        isUser ? "flex-row-reverse" : "flex-row"
      )}
    >
      {/* Visual Identity (Avatar) */}
      <div className="relative shrink-0">
        {!isUser && (
          <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full animate-pulse-soft" />
        )}
        <motion.div
          whileHover={{ scale: 1.1, rotate: isUser ? 5 : -5 }}
          className={cn(
            "relative w-10 h-10 sm:w-11 sm:h-11 rounded-2xl flex items-center justify-center shadow-lg border",
            isUser 
              ? "bg-surface-elevated border-border/50 text-secondary" 
              : "bg-primary text-primary-foreground border-white/20"
          )}
        >
          {isUser ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
        </motion.div>
      </div>

      {/* Message Bubble */}
      <div className={cn(
        "flex flex-col gap-2 max-w-[85%] sm:max-w-[70%]",
        isUser ? "items-end" : "items-start"
      )}>
        <div className={cn(
          "relative px-5 py-3.5 rounded-[1.75rem] shadow-sm transition-all duration-500",
          isUser
            ? "bg-primary text-primary-foreground rounded-tr-none shadow-primary/10"
            : "glass-panel text-foreground rounded-tl-none border-border/30"
        )}>
          {isLoading ? (
            <div className="flex items-center gap-1.5 py-2 px-1">
              {[0, 0.2, 0.4].map((delay) => (
                <motion.div
                  key={delay}
                  animate={{ y: [0, -4, 0], opacity: [0.4, 1, 0.4] }}
                  transition={{ duration: 0.8, repeat: Infinity, delay }}
                  className="w-1.5 h-1.5 rounded-full bg-current"
                />
              ))}
            </div>
          ) : (
            <p className="text-sm sm:text-base leading-relaxed font-body whitespace-pre-wrap">
              {content}
            </p>
          )}
        </div>

        {/* Action Meta (Tool Calls) */}
        <AnimatePresence>
          {toolCalls && toolCalls.length > 0 && !isUser && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex flex-wrap gap-2 mt-1"
            >
              {toolCalls.map((call, idx) => (
                <div 
                  key={idx}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface/50 border border-border/40 shadow-sm"
                >
                  <div className="p-1 rounded-full bg-background">
                    {getToolIcon(call.name)}
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-foreground-muted">
                    {getToolLabel(call.name)}
                  </span>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}

export function ChatContainer({ children, className }: ChatContainerProps) {
  return <div className={cn("flex flex-col h-full relative overflow-hidden", className)}>{children}</div>
}

export function ChatMessages({ children, className }: ChatMessagesProps) {
  return (
    <div className={cn("flex-1 overflow-y-auto px-4 sm:px-8 py-6 custom-scrollbar scroll-smooth", className)}>
      <div className="max-w-4xl mx-auto space-y-2">{children}</div>
    </div>
  )
}

/**
 * EmptyState - The Zenith Welcome
 * High-fidelity entrance for new conversations
 */
export function EmptyState({
  title = "Design your Zenith.",
  subtitle = "How can I assist your productivity today?",
  suggestions = [
    "Draft a project roadmap for next week",
    "Set a high-priority task for market research",
    "List all objectives due tomorrow",
    "Summarize my pending workflow"
  ],
  onSelectSuggestion,
}: EmptyStateProps) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 relative">
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg aspect-square bg-primary/5 blur-[120px] rounded-full animate-pulse-soft" />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative z-10 text-center space-y-8"
      >
        <div className="relative inline-block">
          <div className="w-24 h-24 sm:w-28 sm:h-28 mx-auto rounded-[2.5rem] bg-linear-to-br from-primary to-primary-light flex items-center justify-center shadow-2xl shadow-primary/20 border border-white/20">
            <Bot className="w-12 h-12 text-primary-foreground" />
          </div>
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
            className="absolute -inset-4 border border-dashed border-primary/20 rounded-full"
          />
        </div>

        <div className="space-y-3">
          <h2 className="text-3xl sm:text-5xl font-display font-bold tracking-tightest gradient-text-ethereal">
            {title}
          </h2>
          <p className="text-base sm:text-xl text-foreground-muted font-light max-w-md mx-auto leading-relaxed">
            {subtitle}
          </p>
        </div>

        {onSelectSuggestion && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-2xl mx-auto pt-4">
            {suggestions.map((suggestion, idx) => (
              <motion.button
                key={idx}
                whileHover={{ y: -3, scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onSelectSuggestion(suggestion)}
                className="px-5 py-4 text-sm font-bold glass-panel rounded-2xl border border-border/40 hover:border-primary/30 hover:bg-primary/5 transition-all text-foreground text-left flex items-center gap-3 group"
              >
                <div className="w-8 h-8 rounded-lg bg-surface flex items-center justify-center border border-border/50 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                   <Zap className="w-4 h-4" />
                </div>
                <span className="flex-1 leading-tight tracking-tight">{suggestion}</span>
              </motion.button>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  )
}

export function TypingIndicator() {
  return (
    <div className="flex items-center gap-3 px-4 py-8 animate-reveal">
      <div className="w-10 h-10 rounded-xl bg-surface border border-border/50 flex items-center justify-center">
        <Bot className="w-5 h-5 text-primary animate-pulse" />
      </div>
      <div className="px-4 py-2.5 rounded-2xl glass-panel border-primary/10">
        <div className="flex gap-1.5">
          {[1, 2, 3].map((i) => (
            <motion.div
              key={i}
              animate={{ scale: [0.8, 1.2, 0.8], opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 1, repeat: Infinity, delay: i * 0.15 }}
              className="w-1.5 h-1.5 rounded-full bg-primary"
            />
          ))}
        </div>
      </div>
    </div>
  )
}