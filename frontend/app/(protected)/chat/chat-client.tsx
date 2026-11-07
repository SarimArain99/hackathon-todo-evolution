"use client";

import { useEffect, useRef, useState } from "react";
import { chatApi, type ChatMessage, type ChatResponse } from "@/lib/api";

export default function ChatClient() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [chatAvailable, setChatAvailable] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, loading]);

  async function sendMessage(event: React.FormEvent) {
    event.preventDefault();
    const text = input.trim();
    if (!text || loading) return;
    setInput("");
    setError(null);
    setLoading(true);
    try {
      const data = await chatApi.send(text);
      setMessages((prev) => [...prev, ...data.messages]);
      setChatAvailable(data.chatAvailable ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send message.");
      setInput(text);
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
        className="flex min-h-64 flex-col gap-3 rounded-2xl border border-border bg-surface p-4 sm:p-5"
        aria-live="polite"
        aria-label="Chat messages"
      >
        {historyLoading ? (
          <p className="text-sm text-foreground-muted">Loading your chat…</p>
        ) : messages.length === 0 ? (
          <p className="text-sm leading-relaxed text-foreground-muted">
            Ask about your tasks — what is due today, what is overdue, or
            what you finished. You can also say something like “add buy
            milk tomorrow” and the Assistant will add it to your list.
          </p>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm leading-relaxed sm:max-w-[75%] ${
                  message.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "border border-border bg-background text-foreground"
                }`}
              >
                {message.content}
              </div>
            </div>
          ))
        )}
        {loading && (
          <div className="flex justify-start">
            <div className="rounded-2xl border border-border bg-background px-4 py-3 text-sm text-foreground-muted">
              Thinking…
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={sendMessage} className="flex gap-2">
        <label htmlFor="chat-input" className="sr-only">
          Ask about your tasks
        </label>
        <input
          id="chat-input"
          type="text"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="Ask about your tasks, or say 'add buy milk tomorrow'"
          maxLength={2000}
          disabled={loading}
          autoComplete="off"
          className="min-w-0 flex-1 rounded-xl border border-input-border bg-input-bg px-4 py-3 text-sm text-input-text placeholder:text-input-placeholder focus:border-input-focus-ring focus:outline-none focus:ring-2 focus:ring-input-focus-ring disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={loading || input.trim() === ""}
          className="shrink-0 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary-hover disabled:opacity-50"
        >
          Send
        </button>
      </form>
    </div>
  );
}
