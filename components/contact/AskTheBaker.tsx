"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { WhatsAppIcon } from "@/components/ui/icons";
import { whatsappLink } from "@/config/site";

const MAX = 500;

export function askTheBakerText(question: string) {
  return `Hi SM Delights! ${question.trim()}`;
}

/** One question box that opens WhatsApp with the question typed in. Nothing is sent to our server. */
export function AskTheBaker() {
  const [question, setQuestion] = useState("");
  const empty = !question.trim();

  return (
    <form
      className="rounded-[var(--radius-card)] border border-line bg-paper p-5 shadow-soft sm:p-7"
      onSubmit={(e) => {
        e.preventDefault();
        if (empty) return;
        window.open(whatsappLink(undefined, askTheBakerText(question)), "_blank", "noopener,noreferrer");
      }}
    >
      <label htmlFor="question" className="font-serif text-2xl">Ask the baker</label>
      <textarea
        id="question"
        className="field mt-3 min-h-32"
        maxLength={MAX}
        placeholder="Type your question…"
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
      />
      <p className="mt-1 text-right text-xs text-muted" aria-live="polite">{question.length}/{MAX}</p>
      <Button type="submit" size="lg" disabled={empty} className="mt-2 w-full sm:w-auto">
        <WhatsAppIcon width={20} height={20} /> Send on WhatsApp
      </Button>
      <p className="mt-3 text-sm text-muted">We usually reply on WhatsApp during business hours.</p>
    </form>
  );
}
