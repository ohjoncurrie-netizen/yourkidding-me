"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useVibeStore } from "@/store/vibeStore";

interface Message {
  role: "user" | "assistant";
  content: string;
  streaming?: boolean;
}

const SUGGESTED: Record<string, string[]> = {
  corporate: [
    "What's your experience with Stripe integrations?",
    "Why PostgreSQL over MongoDB for HotelDeposit?",
    "How do you approach API security?",
    "What's your preferred deployment stack?",
  ],
  data: [
    "Walk me through the Montana Blotter scraping pipeline.",
    "How do you handle rate limits and politeness in Scrapy?",
    "What does your PostgreSQL schema look like for news data?",
    "How do you handle deduplication across sources?",
  ],
  chaos: [
    "Be honest — what's the worst code you've ever shipped?",
    "What's your actual hot take on TypeScript?",
    "Why is the domain yourkidding.me?",
    "What would you build if money wasn't a factor?",
  ],
};

const GREETING =
  "Hey. I'm the AI clone of Jon Currie. Ask me anything — technical decisions, project architecture, opinions, or why that domain name. Go ahead.";

export default function Terminal() {
  const { vibe } = useVibeStore();
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: GREETING },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const submit = useCallback(
    async (question?: string) => {
      const q = (question ?? input).trim();
      if (!q || loading) return;

      setInput("");
      setShowSuggestions(false);
      setLoading(true);

      const userMsg: Message = { role: "user", content: q };
      const assistantMsg: Message = { role: "assistant", content: "", streaming: true };

      setMessages((prev) => [...prev, userMsg, assistantMsg]);

      abortRef.current = new AbortController();

      try {
        const history = messages.map((m) => ({ role: m.role, content: m.content }));
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: [...history, { role: "user", content: q }] }),
          signal: abortRef.current.signal,
        });

        if (!res.body) throw new Error("No stream body");
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let accumulated = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const text = decoder.decode(value, { stream: true });
          const lines = text.split("\n");

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const payload = line.slice(6).trim();
            if (payload === "[DONE]") break;
            try {
              const parsed = JSON.parse(payload);
              if (parsed.token) {
                accumulated += parsed.token;
                setMessages((prev) => {
                  const updated = [...prev];
                  updated[updated.length - 1] = {
                    role: "assistant",
                    content: accumulated,
                    streaming: true,
                  };
                  return updated;
                });
              }
            } catch {}
          }
        }

        // Mark streaming done
        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = {
            role: "assistant",
            content: accumulated || "Something went wrong — check the API key.",
            streaming: false,
          };
          return updated;
        });
      } catch (err: unknown) {
        if (err instanceof Error && err.name === "AbortError") return;
        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = {
            role: "assistant",
            content: "Connection error. Check OPENAI_API_KEY in .env.local.",
            streaming: false,
          };
          return updated;
        });
      } finally {
        setLoading(false);
        abortRef.current = null;
        setTimeout(() => inputRef.current?.focus(), 50);
      }
    },
    [input, loading, messages]
  );

  const suggestions = SUGGESTED[vibe] ?? SUGGESTED.data;

  return (
    <div className="w-full max-w-2xl mx-auto space-y-3">
      {/* Suggested questions */}
      <AnimatePresence>
        {showSuggestions && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="flex flex-wrap gap-2"
          >
            {suggestions.map((s) => (
              <motion.button
                key={s}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => submit(s)}
                className="text-[11px] px-3 py-1.5 rounded-full border transition-colors cursor-pointer"
                style={{
                  borderColor: "var(--accent2)",
                  color: "var(--accent2)",
                  background: "var(--glow)",
                }}
              >
                {s}
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Terminal window */}
      <div
        className="w-full rounded-xl border overflow-hidden"
        style={{ borderColor: "var(--accent2)", background: "rgba(0,0,0,0.65)" }}
        onClick={() => inputRef.current?.focus()}
      >
        {/* Title bar */}
        <div
          className="flex items-center gap-2 px-4 py-2 border-b"
          style={{ borderColor: "var(--accent2)" }}
        >
          <div className="w-2.5 h-2.5 rounded-full bg-red-500 opacity-70" />
          <div className="w-2.5 h-2.5 rounded-full bg-yellow-400 opacity-70" />
          <div className="w-2.5 h-2.5 rounded-full bg-green-500 opacity-70" />
          <span
            className="ml-2 text-[10px] tracking-[0.25em] uppercase"
            style={{ color: "var(--accent2)" }}
          >
            interview_me.exe
          </span>
          {loading && (
            <span
              className="ml-auto text-[10px] tracking-widest"
              style={{ color: "var(--accent)" }}
            >
              ● thinking
            </span>
          )}
          {messages.length > 1 && !loading && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setMessages([{ role: "assistant", content: GREETING }]);
                setShowSuggestions(true);
              }}
              className="ml-auto text-[10px] tracking-widest opacity-30 hover:opacity-70 transition-opacity"
            >
              clear
            </button>
          )}
        </div>

        {/* Messages */}
        <div className="h-72 overflow-y-auto p-4 space-y-4 font-mono text-sm">
          <AnimatePresence initial={false}>
            {messages.map((m, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className="flex gap-2"
              >
                <span
                  className="shrink-0 font-bold text-xs mt-0.5"
                  style={{
                    color:
                      m.role === "assistant" ? "var(--accent)" : "var(--accent2)",
                  }}
                >
                  {m.role === "assistant" ? "ai@yourkidding.me $" : "you $"}
                </span>
                <span
                  className="leading-relaxed"
                  style={{ color: "var(--fg)", whiteSpace: "pre-wrap" }}
                >
                  {m.content}
                  {m.streaming && (
                    <span
                      className="cursor-blink ml-0.5"
                      style={{ color: "var(--accent)" }}
                    >
                      ▊
                    </span>
                  )}
                </span>
              </motion.div>
            ))}
          </AnimatePresence>
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <form
          onSubmit={(e) => { e.preventDefault(); submit(); }}
          className="flex items-center gap-2 border-t px-4 py-2.5"
          style={{ borderColor: "var(--accent2)" }}
        >
          <span
            className="font-bold text-sm shrink-0"
            style={{ color: "var(--accent2)" }}
          >
            &gt;
          </span>
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={loading ? "waiting..." : "ask me anything..."}
            className="flex-1 bg-transparent outline-none text-sm placeholder:opacity-25"
            style={{ color: "var(--fg)", caretColor: "var(--accent)" }}
            disabled={loading}
            autoComplete="off"
            spellCheck={false}
          />
          {input && !loading && (
            <button
              type="submit"
              className="text-[10px] tracking-widest opacity-50 hover:opacity-100 transition-opacity shrink-0"
              style={{ color: "var(--accent)" }}
            >
              enter ↵
            </button>
          )}
          {loading && (
            <button
              type="button"
              onClick={() => abortRef.current?.abort()}
              className="text-[10px] tracking-widest opacity-40 hover:opacity-80 shrink-0"
            >
              stop
            </button>
          )}
        </form>
      </div>
    </div>
  );
}
