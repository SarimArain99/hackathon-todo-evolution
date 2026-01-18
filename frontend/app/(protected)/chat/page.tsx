"use client"

import { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { toast } from "sonner"
import { ArrowLeft, Menu, X, Sparkles, Command } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"

import { ChatContainer, ChatMessages, ChatMessage, EmptyState } from "@/components/chat"
import { ChatInput } from "@/components/chat-input"
import { ConversationList, ConversationListToggle } from "@/components/conversation-list"
import { chatApi } from "@/lib/api/chat"
import type { ChatMessage as MessageType, Conversation, ToolCall } from "@/lib/api/chat"

interface DisplayMessage {
  role: "user" | "assistant"
  content: string
  toolCalls?: unknown[]
  isLoading?: boolean
}

export default function ChatPage() {
  const [messages, setMessages] = useState<DisplayMessage[]>([])
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [activeConversationId, setActiveConversationId] = useState<number | undefined>()
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingConversations, setIsLoadingConversations] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  useEffect(() => {
    loadConversations()
  }, [])

  const loadConversations = async () => {
    setIsLoadingConversations(true)
    try {
      const convs = await chatApi.listConversations()
      setConversations(convs)
    } catch (error) {
      toast.error("Failed to load history")
    } finally {
      setIsLoadingConversations(false)
    }
  }

  const loadConversation = async (conversationId: number) => {
    try {
      const data = await chatApi.getConversation(conversationId)
      const displayMessages: DisplayMessage[] = data.messages.map((msg) => ({
        role: msg.role as "user" | "assistant",
        content: msg.content || "",
        toolCalls: msg.tool_calls || [],
      }))
      setMessages(displayMessages)
      setActiveConversationId(conversationId)
      if (isMobile) setSidebarOpen(false)
    } catch (error) {
      toast.error("Failed to sync conversation")
    }
  }

  const handleSendMessage = async (message: string) => {
    const userMessage: DisplayMessage = { role: "user", content: message }
    setMessages((prev) => [...prev, userMessage])

    const loadingMessage: DisplayMessage = {
      role: "assistant",
      content: "",
      isLoading: true,
    }
    setMessages((prev) => [...prev, loadingMessage])
    setIsLoading(true)

    try {
      const response = await chatApi.sendMessage({
        message,
        conversation_id: activeConversationId,
      })

      setMessages((prev) => [
        ...prev.slice(0, -1),
        {
          role: "assistant",
          content: response.message,
          toolCalls: response.tool_calls,
        },
      ])

      setActiveConversationId(response.conversation_id)
      await loadConversations()
    } catch (error) {
      setMessages((prev) => prev.slice(0, -1))
      toast.error("Assistant encountered an error")
    } finally {
      setIsLoading(false)
    }
  }

  const handleNewConversation = () => {
    setMessages([])
    setActiveConversationId(undefined)
    if (isMobile) setSidebarOpen(false)
  }

  const handleDeleteConversation = async (conversationId: number) => {
    try {
      await chatApi.deleteConversation(conversationId)
      await loadConversations()
      if (activeConversationId === conversationId) {
        setMessages([])
        setActiveConversationId(undefined)
      }
      toast.success("Memory cleared")
    } catch (error) {
      toast.error("Could not delete")
    }
  }

  const handleSelectSuggestion = useCallback((suggestion: string) => {
    handleSendMessage(suggestion)
  }, [])

  const hasMessages = messages.length > 0

  return (
    <div className="flex h-screen bg-background overflow-hidden selection:bg-primary/10">
      {/* Background Ambience */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-48 bg-linear-to-b from-primary/10 via-primary/5 to-transparent" />
        <div className="absolute top-0 right-0 w-1/2 h-64 bg-accent/5 rounded-full blur-[100px] translate-x-1/2 -translate-y-1/2" />
      </div>

      {/* Sidebar Navigation */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            {isMobile && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setSidebarOpen(false)}
                className="fixed inset-0 bg-background/60 z-40 md:hidden backdrop-blur-md"
              />
            )}
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 32 }}
              className={cn(
                "fixed md:relative inset-y-0 left-0 z-50 h-full",
                "glass-panel border-r border-border/40",
                isMobile ? "w-[85%] max-w-sm" : "w-80 shrink-0"
              )}
            >
              <ConversationList
                conversations={conversations}
                activeConversationId={activeConversationId}
                onSelectConversation={loadConversation}
                onNewConversation={handleNewConversation}
                onDeleteConversation={handleDeleteConversation}
                onClose={isMobile ? () => setSidebarOpen(false) : undefined}
                isLoading={isLoadingConversations}
              />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Conversation Hub */}
      <motion.main
        className="flex-1 flex flex-col min-w-0 overflow-hidden relative z-10"
        animate={{
          marginLeft: !isMobile && sidebarOpen ? "0rem" : "0rem",
        }}
        transition={{ type: "spring", stiffness: 300, damping: 32 }}
      >
        {/* REFINED GLASSY HEADER */}
        <header className="sticky top-0 z-50 w-full flex items-center justify-between p-4 border-b border-border/20 bg-background/40 backdrop-blur-2xl shadow-sm shadow-primary/5">
          <div className="flex items-center gap-4 min-w-0">
            <Link href="/dashboard" className="shrink-0">
              <motion.button
                whileHover={{ scale: 1.02, x: -2 }}
                whileTap={{ scale: 0.98 }}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl hover:bg-surface/60 border border-transparent hover:border-border/50 transition-all duration-200 group"
              >
                <ArrowLeft className="w-4 h-4 text-foreground-muted group-hover:text-primary transition-colors" />
                <span className="text-[11px] font-black uppercase tracking-widest text-foreground-muted group-hover:text-foreground hidden xs:inline">Exit</span>
              </motion.button>
            </Link>
            
            <div className="h-5 w-px bg-border/30 hidden xs:block shrink-0" />
            
            <div className="flex items-center gap-3 min-w-0">
              <div className="relative shrink-0">
                <Sparkles className="w-4 h-4 text-primary animate-pulse" />
                <div className="absolute inset-0 bg-primary/20 blur-md rounded-full" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[12px] font-black uppercase tracking-[0.25em] gradient-text-ethereal drop-shadow-sm truncate">
                  Zenith Assistant
                </span>
                <span className="text-[8px] font-bold text-success/70 uppercase tracking-widest leading-none mt-0.5">
                  AI Context Active
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0 ml-4">
            {/* DESKTOP TOGGLE: Only shows on screens larger than mobile */}
            <div className="hidden md:block">
              <ConversationListToggle
                isOpen={sidebarOpen}
                onToggle={() => setSidebarOpen(!sidebarOpen)}
                count={conversations.length}
              />
            </div>

            {/* MOBILE HAMBURGER: Only shows on mobile/tablet screens */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="md:hidden p-2 rounded-xl bg-primary/10 border border-primary/20 backdrop-blur-sm transition-colors hover:bg-primary/20"
            >
              {sidebarOpen ? <X className="w-5 h-5 text-primary" /> : <Menu className="w-5 h-5 text-primary" />}
            </motion.button>
          </div>
        </header>

        {/* MESSAGING STREAM */}
        <div className="flex-1 relative flex flex-col min-h-0 bg-transparent">
          <ChatContainer>
            <div className="flex-1 overflow-y-auto custom-scrollbar scroll-smooth pt-4">
              {hasMessages ? (
                <ChatMessages>
                  <AnimatePresence initial={false} mode="popLayout">
                    {messages.map((msg, idx) => (
                      <motion.div
                        key={`${msg.role}-${idx}`}
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                      >
                        <ChatMessage
                          role={msg.role}
                          content={msg.content}
                          toolCalls={msg.toolCalls as ToolCall[] | undefined}
                          isLoading={msg.isLoading}
                        />
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </ChatMessages>
              ) : (
                <EmptyState onSelectSuggestion={handleSelectSuggestion} />
              )}
            </div>

            {/* INPUT SECTION */}
            <div className="p-4 sm:p-8 bg-linear-to-t from-background via-background/95 to-transparent backdrop-blur-sm">
              <div className="max-w-3xl mx-auto">
                <div className="mb-4 flex justify-center">
                  <div className="px-3 py-1.5 rounded-full bg-surface/50 border border-border/30 flex items-center gap-2.5 shadow-sm transition-transform hover:scale-105">
                    <Command className="w-3 h-3 text-primary/80" />
                    <span className="text-[9px] font-black text-foreground-muted uppercase tracking-widest">
                      Shift + Enter for New Line
                    </span>
                  </div>
                </div>
                <ChatInput
                  onSendMessage={handleSendMessage}
                  isLoading={isLoading}
                  placeholder="Ask Zenith about your workflow..."
                />
              </div>
            </div>
          </ChatContainer>
        </div>
      </motion.main>
    </div>
  )
}