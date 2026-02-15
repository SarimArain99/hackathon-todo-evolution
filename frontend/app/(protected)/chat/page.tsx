"use client";

import { useState, useEffect, useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { toast } from "sonner";
import {
  ArrowLeft,
  History,
  Sparkles,
  Send,
  Plus,
  Trash2,
  X,
  Terminal,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

import { chatApi } from "@/lib/api/chat";
import type { Conversation } from "@/lib/api/chat";

if (typeof window !== "undefined") gsap.registerPlugin(useGSAP);

// --- Zenith System Status Words ---
const STATUS_WORDS = [
  "Thinking...",
  "Analyzing context...",
  "Structuring logic...",
  "Synthesizing response...",
  "Optimizing flow...",
  "Calibrating insights...",
  "Polishing syntax...",
  "Refining workspace data...",
  "Finalizing directive...",
];

interface DisplayMessage {
  role: "user" | "assistant";
  content: string;
  isLoading?: boolean;
}

/**
 * ThinkingStatus Component
 * Cycles through the status words with a smooth GSAP transition.
 */
function ThinkingStatus() {
  const [index, setIndex] = useState(0);
  const textRef = useRef(null);

  useEffect(() => {
    const interval = setInterval(() => {
      const tl = gsap.timeline();
      tl.to(textRef.current, {
        opacity: 0,
        y: -5,
        duration: 0.3,
        ease: "power2.in",
      })
        .call(() => setIndex((prev) => (prev + 1) % STATUS_WORDS.length))
        .to(textRef.current, {
          opacity: 1,
          y: 0,
          duration: 0.3,
          ease: "power2.out",
        });
    }, 1800);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center gap-3">
      <div className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--primary)] opacity-75"></span>
        <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--primary)]"></span>
      </div>
      <span
        ref={textRef}
        className="text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-[var(--primary)]"
      >
        {STATUS_WORDS[index]}
      </span>
    </div>
  );
}

export default function ChatPage() {
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<
    number | undefined
  >();
  const [isLoading, setIsLoading] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");

  const container = useRef(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // --- GSAP Entrance ---
  useGSAP(
    () => {
      gsap.from(".chat-header", {
        y: -20,
        opacity: 0,
        duration: 1,
        ease: "expo.out",
      });
      gsap.from(".input-area", {
        y: 20,
        opacity: 0,
        duration: 1,
        delay: 0.2,
        ease: "expo.out",
      });
    },
    { scope: container },
  );

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const loadConversations = async () => {
    try {
      const convs = await chatApi.listConversations();
      setConversations(convs);
    } catch (error) {
      toast.error("History sync failed");
    }
  };

  const loadConversation = async (id: number) => {
    try {
      const data = await chatApi.getConversation(id);
      setMessages(
        data.messages.map((msg) => ({
          role: msg.role as "user" | "assistant",
          content: msg.content || "",
        })),
      );
      setActiveConversationId(id);
      setHistoryOpen(false);
    } catch (error) {
      toast.error("Failed to load stream");
    }
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    const text = inputValue;
    setInputValue("");
    setMessages((prev) => [...prev, { role: "user", content: text }]);

    setIsLoading(true);
    setMessages((prev) => [
      ...prev,
      { role: "assistant", content: "", isLoading: true },
    ]);

    try {
      const response = await chatApi.sendMessage({
        message: text,
        conversation_id: activeConversationId,
      });
      setMessages((prev) => [
        ...prev.slice(0, -1),
        { role: "assistant", content: response.message },
      ]);
      setActiveConversationId(response.conversation_id);
      loadConversations();
    } catch (error) {
      setMessages((prev) => prev.slice(0, -1));
      toast.error("Assistant disconnected");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main
      ref={container}
      className="relative h-screen w-full bg-[var(--background)] text-[var(--foreground)] overflow-hidden flex flex-col noise-overlay"
    >
      {/* Dynamic Aura Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[20%] w-[60%] h-[40%] bg-[var(--primary)]/5 blur-[120px] rounded-full" />
      </div>

      {/* Zenith Header */}
      <header className="chat-header relative z-50 flex items-center justify-between px-6 py-4 border-b border-[var(--glass-border)] bg-[var(--glass-bg)] backdrop-blur-md">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard"
            className="p-2 hover:bg-[var(--glass-bg)] rounded-full transition-colors group"
          >
            <ArrowLeft className="w-5 h-5 text-[var(--foreground-muted)] group-hover:text-[var(--primary)]" />
          </Link>
          <div className="flex flex-col">
            <span className="text-[10px] font-bold tracking-[0.3em] uppercase text-[var(--primary)]">
              Zenith Assistant
            </span>
            <span className="text-[9px] font-mono text-foreground-muted uppercase tracking-widest">
              Core Status: Active
            </span>
          </div>
        </div>

        <button
          onClick={() => setHistoryOpen(!historyOpen)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--glass-bg)] border border-[var(--glass-border)] hover:border-[var(--primary)]/40 transition-all"
        >
          <History className="w-4 h-4 text-[var(--primary)]" />
          <span className="text-xs font-bold uppercase tracking-widest hidden sm:block">
            History
          </span>
        </button>
      </header>

      <div className="flex-1 relative flex overflow-hidden">
        {/* History Drawer */}
        <aside
          className={cn(
            "absolute inset-y-0 left-0 z-40 w-80 bg-[var(--background)]/98 backdrop-blur-3xl border-r border-[var(--glass-border)] transform transition-transform duration-500 ease-[cubic-bezier(0.19,1,0.22,1)]",
            historyOpen ? "translate-x-0" : "-translate-x-full",
          )}
        >
          <div className="p-6 h-full flex flex-col">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--foreground-muted)]">
                Memory Fragments
              </h3>
              <button
                onClick={() => setHistoryOpen(false)}
                className="hover:text-[var(--primary)] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <button
              onClick={() => {
                setMessages([]);
                setActiveConversationId(undefined);
                setHistoryOpen(false);
              }}
              className="w-full flex items-center justify-center gap-2 p-4 rounded-xl bg-[var(--primary)] text-[var(--primary-foreground)] font-bold text-xs uppercase tracking-widest mb-6 hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-[var(--primary)]/10"
            >
              <Plus className="w-4 h-4" /> New Sequence
            </button>

            <div className="flex-1 overflow-y-auto space-y-2 custom-scrollbar pr-2">
              {conversations.map((conv) => (
                <div key={conv.id} className="group flex items-center gap-2">
                  <button
                    onClick={() => loadConversation(conv.id)}
                    className={cn(
                      "flex-1 text-left p-4 rounded-xl text-xs transition-all border",
                      activeConversationId === conv.id
                        ? "bg-[var(--primary)]/10 border-[var(--primary)]/40 text-[var(--primary)]"
                        : "hover:bg-[var(--glass-bg)] border-transparent text-[var(--foreground-muted)]",
                    )}
                  >
                    {conv.title || "Untitled Directive"}
                  </button>
                  <button
                    onClick={() =>
                      chatApi
                        .deleteConversation(conv.id)
                        .then(loadConversations)
                    }
                    className="opacity-0 group-hover:opacity-100 p-2 hover:text-[var(--state-error-text)] transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </aside>

        {/* Chat Stream Area */}
        <section className="flex-1 flex flex-col items-center overflow-hidden">
          <div
            className="w-full max-w-3xl flex-1 overflow-y-auto px-6 pt-10 custom-scrollbar scroll-smooth"
            ref={scrollRef}
          >
            {messages.length > 0 ? (
              <div className="space-y-10 pb-12">
                {messages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={cn(
                      "flex flex-col gap-4",
                      msg.role === "user" ? "items-end" : "items-start",
                    )}
                  >
                    {msg.isLoading ? (
                      <div className="bg-[var(--glass-bg)] border border-[var(--glass-border)] p-5 rounded-2xl min-w-[200px]">
                        <ThinkingStatus />
                      </div>
                    ) : (
                      <div
                        className={cn(
                          "max-w-[90%] px-6 py-4 rounded-2xl text-[15px] leading-relaxed shadow-sm transition-all",
                          msg.role === "user"
                            ? "bg-[var(--primary)] text-[var(--primary-foreground)] font-medium"
                            : "bg-[var(--glass-bg)] border border-[var(--glass-border)] text-[var(--foreground)]",
                        )}
                      >
                        {msg.content}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center opacity-40">
                <Terminal className="w-12 h-12 text-[var(--primary)] mb-6" />
                <h2 className="text-xl font-display font-medium tracking-widest uppercase mb-2">
                  Terminal Ready
                </h2>
                <p className="text-xs font-light max-w-[240px]">
                  Awaiting system directives. Context encryption is active.
                </p>
              </div>
            )}
          </div>

          {/* Persistent Action Bar */}
          <div className="input-area w-full max-w-3xl px-6 pb-10 pt-4">
            <form
              onSubmit={handleSendMessage}
              className="relative glass-panel rounded-2xl border-[var(--glass-border)] bg-[var(--glass-bg)] p-1.5 shadow-2xl focus-within:border-[var(--primary)]/40 transition-all"
            >
              <input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Transmit new directive..."
                className="w-full bg-transparent px-6 py-4 text-sm outline-none placeholder:text-[var(--input-placeholder)]"
              />
              <button
                type="submit"
                disabled={isLoading || !inputValue.trim()}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-3.5 bg-[var(--primary)] text-[var(--primary-foreground)] rounded-xl hover:scale-105 active:scale-95 transition-all disabled:opacity-20 shadow-lg shadow-[var(--primary)]/10"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
            <div className="mt-6 flex justify-center items-center gap-8">
              <div className="flex items-center gap-2">
                <div className="w-1 h-1 rounded-full bg-[var(--primary)] animate-pulse" />
                <span className="text-[9px] font-bold text-[var(--foreground-muted)]/50 uppercase tracking-[0.2em]">
                  Neural Encryption
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-1 h-1 rounded-full bg-[var(--primary)] animate-pulse" />
                <span className="text-[9px] font-bold text-foreground-muted/50 uppercase tracking-[0.2em]">
                  Uplink v3.0
                </span>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
