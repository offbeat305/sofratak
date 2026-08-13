"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { MessageSquareText, SendHorizontal, X } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { ASSISTANT_KB, type KbEntry } from "@/content/assistant-kb";
import { cn } from "@/lib/cn";

type ChatMessage = { role: "user" | "bot"; text: string; fallback?: boolean };

function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[ً-ٰٟ]/g, "") // Arabic diacritics
    .replace(/[أإآ]/g, "ا")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Keyword scorer over the curated KB — best entry above threshold wins.
 * Single-word keywords match on word boundaries only (so "deliver" never
 * matches the keyword "live"); multi-word keywords match as phrases.
 */
function match(query: string): KbEntry | null {
  const q = normalize(query);
  if (!q) return null;
  const tokens = q.split(/[^\p{L}\p{N}$%¢]+/u).filter(Boolean);
  let best: KbEntry | null = null;
  let bestScore = 0;
  for (const entry of ASSISTANT_KB) {
    let score = 0;
    for (const raw of entry.keywords) {
      const keyword = normalize(raw);
      if (keyword.includes(" ")) {
        if (q.includes(keyword)) score += 3;
      } else if (tokens.includes(keyword)) {
        score += 2;
      } else if (
        keyword.length >= 5 &&
        tokens.some((token) => token.startsWith(keyword))
      ) {
        score += 1; // plurals/suffixes: "pricing" → "price"… only for long stems
      }
    }
    if (score > bestScore) {
      bestScore = score;
      best = entry;
    }
  }
  return bestScore >= 2 ? best : null;
}

export function Assistant({ whatsappNumber }: { whatsappNumber: string | null }) {
  const t = useTranslations("site.assistant");
  const locale = useLocale() as "en" | "ar";
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open && messages.length === 0) {
      setMessages([{ role: "bot", text: t("greeting") }]);
    }
  }, [open, messages.length, t]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [messages]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  const ask = (text: string, entry?: KbEntry) => {
    const found = entry ?? match(text);
    setMessages((prev) => [
      ...prev,
      { role: "user", text },
      found
        ? { role: "bot", text: found.answer[locale] }
        : { role: "bot", text: t("fallback"), fallback: true },
    ]);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text) return;
    setInput("");
    ask(text);
  };

  const quickChips = ASSISTANT_KB.filter((entry) => entry.quick);

  return (
    <>
      {/* launcher — sits above the WhatsApp bubble on desktop */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-label={open ? t("close") : t("open")}
        className={cn(
          "fixed end-5 z-40 flex items-center gap-2 rounded-full bg-olive px-4 py-3 font-bold text-ivory shadow-[0_10px_30px_rgba(24,38,31,0.35)] transition-transform hover:scale-105 motion-reduce:transition-none",
          "bottom-20 md:bottom-24",
        )}
      >
        <MessageSquareText className="size-5" aria-hidden />
        <span className="hidden text-sm sm:inline">{t("open")}</span>
      </button>

      {open && (
        <div
          role="dialog"
          aria-label={t("title")}
          className="animate-rise-in fixed inset-x-3 bottom-36 z-50 mx-auto flex max-h-[70vh] w-auto max-w-sm flex-col overflow-hidden rounded-card border border-olive/15 bg-ivory shadow-[0_30px_70px_rgba(24,38,31,0.4)] sm:end-5 sm:start-auto sm:bottom-40 sm:w-96"
        >
          {/* header */}
          <div className="flex items-start justify-between gap-3 bg-olive p-4 text-ivory">
            <div>
              <p className="font-display text-lg font-semibold">{t("title")}</p>
              <p className="text-xs text-ivory/70">{t("subtitle")}</p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label={t("close")}
              className="rounded-full p-1.5 text-ivory/80 hover:bg-ivory/10 hover:text-ivory"
            >
              <X className="size-5" aria-hidden />
            </button>
          </div>

          {/* messages */}
          <div ref={listRef} className="flex-1 overflow-y-auto p-4">
            <div className="flex flex-col gap-3">
              {messages.map((message, i) => (
                <div
                  key={i}
                  className={cn(
                    "max-w-[85%] rounded-2xl px-4 py-2.5 text-[14px] leading-relaxed",
                    message.role === "user"
                      ? "self-end rounded-ee-md bg-olive text-ivory"
                      : "self-start rounded-es-md border border-olive/10 bg-white text-charcoal",
                  )}
                >
                  {message.text}
                  {message.fallback && (
                    <span className="mt-3 flex flex-wrap gap-2">
                      {whatsappNumber && (
                        <a
                          href={`https://wa.me/${whatsappNumber}`}
                          target="_blank"
                          rel="noreferrer"
                          className="rounded-full bg-[#25D366] px-3 py-1.5 text-xs font-bold text-white"
                        >
                          {t("whatsapp")}
                        </a>
                      )}
                      <Link
                        href="/demo"
                        onClick={() => setOpen(false)}
                        className="rounded-full bg-brass px-3 py-1.5 text-xs font-bold text-olive"
                      >
                        {t("bookDemo")}
                      </Link>
                    </span>
                  )}
                </div>
              ))}
            </div>

            {/* quick replies */}
            <div className="mt-4 flex flex-wrap gap-2">
              {quickChips.map((entry) => (
                <button
                  key={entry.id}
                  type="button"
                  onClick={() => ask(entry.question[locale], entry)}
                  className="rounded-full border border-olive/25 px-3 py-1.5 text-xs font-semibold text-olive transition-colors hover:border-olive hover:bg-olive/5"
                >
                  {entry.quick![locale]}
                </button>
              ))}
            </div>
          </div>

          {/* input */}
          <form
            onSubmit={submit}
            className="flex gap-2 border-t border-olive/10 bg-white p-3"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={t("placeholder")}
              aria-label={t("placeholder")}
              className="h-11 flex-1 rounded-field border border-olive/20 bg-white px-3.5 text-[14px] focus:outline-none focus-visible:ring-2 focus-visible:ring-olive/25"
            />
            <button
              type="submit"
              aria-label={t("send")}
              className="flex size-11 items-center justify-center rounded-field bg-olive text-ivory transition-opacity hover:opacity-90"
            >
              <SendHorizontal className="size-5 rtl:-scale-x-100" aria-hidden />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
