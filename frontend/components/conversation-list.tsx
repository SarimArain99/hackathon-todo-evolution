"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { MessageSquare, Trash2, Loader2, Plus, Sprout, Clock, Sparkles, X, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "./ui/button"
import type { Conversation } from "@/lib/api/chat"

/* --- INTERFACES --- */

interface ConversationListProps {
  conversations: Conversation[]
  activeConversationId?: number
  onSelectConversation: (conversationId: number) => void
  onNewConversation: () => void
  onDeleteConversation?: (conversationId: number) => void
  onClose?: () => void
  isLoading?: boolean
  className?: string
}

interface ConversationListToggleProps {
  isOpen: boolean
  onToggle: () => void
  count?: number
}

/* --- COMPONENTS --- */

/**
 * Zenith Conversation History v2.1
 * Features: 
 * - Staggered entrance physics
 * - Contrast-aware active states
 * - Contextual item previews
 */
export function ConversationList({
  conversations,
  activeConversationId,
  onSelectConversation,
  onNewConversation,
  onDeleteConversation,
  onClose,
  isLoading = false,
  className,
}: ConversationListProps) {
  const [deletingId, setDeletingId] = useState<number | null>(null)

  const handleDelete = async (e: React.MouseEvent, conversationId: number) => {
    e.stopPropagation()
    if (!onDeleteConversation || deletingId) return
    setDeletingId(conversationId)
    try {
      await onDeleteConversation(conversationId)
    } finally {
      setDeletingId(null)
    }
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffDays === 0) return "Today"
    if (diffDays === 1) return "Yesterday"
    if (diffDays < 7) return date.toLocaleDateString("en-US", { weekday: "short" })
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
  }

  return (
    <div className={cn(
      "flex flex-col h-full bg-background/50 backdrop-blur-xl border-r border-border/40",
      className
    )}>
      {/* Sidebar Header */}
      <div className="p-6 border-b border-border/30">
        <div className="flex items-center justify-between mb-6 sm:hidden">
           <span className="text-[10px] font-black uppercase tracking-[0.3em] text-foreground-muted">History</span>
           <button onClick={onClose} className="p-2 rounded-xl hover:bg-surface-elevated transition-colors">
              <X className="w-4 h-4" />
           </button>
        </div>

        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Button
            onClick={onNewConversation}
            variant="default"
            className="w-full justify-center gap-3 shadow-2xl shadow-primary/20"
            size="lg"
          >
            <Plus className="w-4 h-4" />
            <span className="tracking-tight">New Conversation</span>
          </Button>
        </motion.div>
      </div>

      {/* List Engine */}
      <div className="flex-1 overflow-y-auto custom-scrollbar px-3 py-4">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4 opacity-40">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
            <span className="text-[10px] font-bold uppercase tracking-widest">Syncing History</span>
          </div>
        ) : conversations.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="py-12 px-6 text-center"
          >
            <div className="w-16 h-16 mx-auto mb-6 rounded-4xl flex items-center justify-center bg-surface-elevated border border-border/50 shadow-inner">
              <Sprout className="w-7 h-7 text-primary/40" />
            </div>
            <h4 className="text-sm font-bold text-foreground mb-1">Silence is workspace.</h4>
            <p className="text-xs text-foreground-muted font-light leading-relaxed">
              Start a new dialogue to populate your productivity timeline.
            </p>
          </motion.div>
        ) : (
          <div className="space-y-1.5">
            <AnimatePresence initial={false}>
              {conversations.map((conversation, idx) => {
                const isActive = activeConversationId === conversation.id;
                return (
                  <motion.div
                    key={conversation.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.3, delay: idx * 0.03 }}
                    onClick={() => onSelectConversation(conversation.id)}
                    className={cn(
                      "group relative flex items-center gap-4 px-4 py-3.5 cursor-pointer transition-all duration-500 rounded-2xl border",
                      isActive
                        ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20 z-10"
                        : "bg-transparent border-transparent hover:bg-surface-elevated hover:border-border/60"
                    )}
                  >
                    {/* Active Floating Pill */}
                    {isActive && (
                      <motion.div
                        layoutId="active-pill"
                        className="absolute -left-1 w-1.5 h-8 bg-primary-foreground rounded-full shadow-sm"
                      />
                    )}

                    <div className={cn(
                      "shrink-0 w-10 h-10 rounded-xl flex items-center justify-center shadow-sm transition-transform duration-500 group-hover:scale-110",
                      isActive ? "bg-white/20" : "bg-surface border border-border/50"
                    )}>
                      <MessageSquare className={cn("w-4.5 h-4.5", isActive ? "text-primary-foreground" : "text-primary")} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-0.5">
                        <p className={cn("text-sm font-bold truncate tracking-tight", isActive ? "text-primary-foreground" : "text-foreground")}>
                          {formatDate(conversation.updated_at)}
                        </p>
                        {!isActive && idx < 3 && (
                          <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-secondary/10 border border-secondary/20">
                            <Sparkles className="w-2 h-2 text-secondary" />
                            <span className="text-[8px] font-black uppercase text-secondary">New</span>
                          </div>
                        )}
                      </div>
                      <p className={cn("text-[11px] truncate flex items-center gap-1.5 font-light", isActive ? "text-primary-foreground/70" : "text-foreground-muted")}>
                        <Clock className="w-2.5 h-2.5" />
                        AI Session Alpha
                      </p>
                    </div>

                    {/* Quick Action: Delete */}
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {onDeleteConversation && (
                        <button
                          onClick={(e) => handleDelete(e, conversation.id)}
                          disabled={deletingId === conversation.id}
                          className={cn(
                            "p-2 rounded-lg transition-all",
                            isActive 
                              ? "hover:bg-white/20 text-primary-foreground" 
                              : "hover:bg-danger/10 text-foreground-muted hover:text-danger"
                          )}
                        >
                          {deletingId === conversation.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="w-3.5 h-3.5" />
                          )}
                        </button>
                      )}
                      <ChevronRight className={cn("w-3.5 h-3.5 opacity-30", isActive && "hidden")} />
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Persistence Footer */}
      <div className="p-6 border-t border-border/30 bg-surface/30">
        <div className="flex items-center justify-between px-2">
           <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-success animate-pulse-soft" />
              <span className="text-[10px] font-bold text-foreground-muted uppercase tracking-widest">
                {conversations.length} Logs
              </span>
           </div>
           <span className="text-[9px] font-mono text-foreground-muted/40 italic">End-to-end encrypted</span>
        </div>
      </div>
    </div>
  )
}

/**
 * Toggle Component - The Entry Point
 */
export function ConversationListToggle({ isOpen, onToggle, count }: ConversationListToggleProps) {
  return (
    <motion.button
      whileHover={{ scale: 1.05, y: -1 }}
      whileTap={{ scale: 0.95 }}
      onClick={onToggle}
      className={cn(
        "relative p-3 rounded-2xl border transition-all duration-500",
        isOpen 
          ? "bg-primary text-primary-foreground border-primary shadow-xl shadow-primary/20" 
          : "glass-panel bg-surface/80 border-border/50 text-foreground hover:border-primary/30"
      )}
    >
      <div className="relative">
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div key="open" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }}>
              <ChevronRight className="w-5 h-5 rotate-180" />
            </motion.div>
          ) : (
            <motion.div key="closed" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }}>
              <Clock className="w-5 h-5" />
            </motion.div>
          )}
        </AnimatePresence>

        {count !== undefined && count > 0 && !isOpen && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-4 -right-4 min-w-5 h-5 rounded-full bg-accent text-white text-[10px] font-black flex items-center justify-center px-1.5 shadow-lg border-2 border-background"
          >
            {count}
          </motion.span>
        )}
      </div>
    </motion.button>
  )
}