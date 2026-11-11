"use client";

import { useEffect, useRef, useState } from "react";
import { Send } from "lucide-react";
import { chatApi, type ChatMessage } from "@/lib/api";

const SUGGESTIONS = [
  "What is due today?",
  "What is overdue?",
  "What did I finish?",
  "Add buy milk tomorrow",
] as const;

export default function ChatClient() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [chatAvailable, setChatAvailable] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const nearBottomRef = useRef(true);

  useEffect(() => {
    let cancelled = false;
    chatApi
      .history()
      .then((data) => {
        if (cancelled) return;
        setMessages(data.messages);
        setChatAvailable(data.chatAvailable ?? null);
      })
      .catch((err: Error) => {
        if (cancelled) return;
        setError(err.message || "Could not load chat history.");
      })
      .finally(() => {
        if (!cancelled) setHistoryLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Auto-scroll only if the user is already at the bottom; otherwise
  // a new message never yanks the view away from what they are reading.
  useEffect(() => {
    if (nearBottomRef.current) {
      // scrollIntoView is a no-op where it does not exist (jsdom).
      bottomRef.current?.scrollIntoView?.({ behavior: "smooth", block: "end" });
    }
  }, [messages, loading]);

  const handleScroll = () => {
    const el = listRef.current;
    if (!el) return;
    nearBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 120;
  };

  async function sendMessage(text: string) {
    const trimmed = text.trim();
    if (!trimmed || loading) return;
    setInput("");
    setError(null);
    setLoading(true);
    try {
      const data = await chatApi.send(trimmed);
      setMessages((prev) => [...prev, ...data.messages]);
      setChatAvailable(data.chatAvailable ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send message.");
      setInput(trimmed);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {chatAvailable === false && (
        <p
          role="status"
          className="rounded-xl border border-state-warning-border bg-state-warning-bg px-4 py-3 text-sm leading-relaxed text-state-warning-text"
        >
          The Assistant is not set up yet — it needs an OpenAI API key
          before it can answer from your tasks. Anything you send is still
          saved in your chat history.
        </p>
      )}

      {error && (
        <p
          role="alert"
          className="rounded-xl border border-state-error-border bg-state-error-bg px-4 py-3 text-sm leading-relaxed text-state-error-text"
        >
          {error}
        </p>
      )}

      <div
        ref={listRef}
        onScroll={handleScroll}
        role="log"
        aria-live="polite"
        aria-label="Chat messages"
        className="flex max-h-[62dvh] min-h-64 flex-col gap-3 overflow-y-auto rounded-3xl border border-border bg-surface p-4 sm:p-5"
      >
        {historyLoading ? (
          <div className="space-y-3" aria-label="Loading chat">
            <div className="h-12 w-3/4 animate-pulse rounded-2xl bg-surface-sunken" />
            <div className="ml-auto h-12 w-2/3 animate-pulse rounded-2xl bg-surface-sunken" />
            <div className="h-12 w-3/4 animate-pulse rounded-2xl bg-surface-sunken" />
          </div>
        ) : messages.length === 0 ? (
          <div>
            <p className="text-sm leading-relaxed text-foreground-muted">
              Ask about your tasks — what is due today, what is overdue, or
              what you finished. You can also say something like “add buy
              milk tomorrow” and the Assistant will add it to your list.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => sendMessage(s)}
                  disabled={loading}
                  className="min-h-11 rounded-full border border-secondary-border bg-secondary px-4 py-2 text-sm font-medium text-secondary-foreground transition-colors hover:bg-secondary-hover disabled:opacity-50"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] break-words whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm leading-relaxed sm:max-w-[75%] ${
                  message.role === "user"
                    ? "rounded-br-md bg-primary text-primary-foreground"
                    : "rounded-bl-md border border-border bg-background text-foreground"
                }`}
              >
                {message.content}
              </div>
            </div>
          ))
        )}
        {loading && (
          <div className="flex justify-start">
            <div
              className="flex items-center gap-1.5 rounded-2xl rounded-bl-md border border-border bg-background px-4 py-3"
              aria-label="Assistant is thinking"
            >
              <span className="typing-dot h-2 w-2 rounded-full bg-foreground-muted" aria-hidden="true" />
              <span className="typing-dot h-2 w-2 rounded-full bg-foreground-muted" aria-hidden="true" />
              <span className="typing-dot h-2 w-2 rounded-full bg-foreground-muted" aria-hidden="true" />
              <span className="sr-only">Thinking…</span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          sendMessage(input);
        }}
        className="glass-float sticky bottom-20 flex items-end gap-2 rounded-3xl p-2 sm:bottom-6 lg:bottom-6"
        style={{ paddingBottom: "calc(0.5rem + env(safe-area-inset-bottom))" }}
      >
        <label htmlFor="chat-input" className="sr-only">
          Ask about your tasks
        </label>
        <textarea
          id="chat-input"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              sendMessage(input);
            }
          }}
          placeholder="Ask about your tasks, or say 'add buy milk tomorrow'"
          maxLength={2000}
          disabled={loading}
          autoComplete="off"
          rows={1}
          className="min-w-0 flex-1 resize-none rounded-2xl border border-transparent bg-transparent px-4 py-3 text-base text-input-text placeholder:text-input-placeholder focus:border-primary focus:outline-none focus:ring-2 focus:ring-input-focus-ring disabled:opacity-60"
          style={{ fieldSizing: "content", maxHeight: "10rem" } as React.CSSProperties}
        />
        <button
          type="submit"
          disabled={loading || input.trim() === ""}
          aria-label="Send message"
          className="btn-press flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground transition-colors hover:bg-primary-hover disabled:opacity-50"
        >
          <Send className="h-5 w-5" aria-hidden="true" />
        </button>
      </form>
      <p className="text-center text-xs text-foreground-muted">
        Enter sends · Shift + Enter adds a new line
      </p>
    </div>
  );
}
