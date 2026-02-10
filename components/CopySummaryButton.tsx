"use client";

import { useState } from "react";

interface CopySummaryButtonProps {
  summaryText: string;
  className?: string;
}

export function CopySummaryButton({ summaryText, className = "" }: CopySummaryButtonProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(summaryText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={`rounded border border-zinc-600 bg-zinc-800 px-3 py-1.5 text-sm text-zinc-200 hover:bg-zinc-700 hover:text-white ${className}`}
    >
      {copied ? "Copied!" : "Copy summary"}
    </button>
  );
}
