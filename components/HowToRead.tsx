"use client";

import { useState } from "react";

const BULLETS = [
  "Scenarios are paths, not predictions.",
  "Probabilities reflect current evidence, not certainty.",
  "Evidence is computed weekly from tracked indicators.",
  "Alignment shows whether price is inside scenario bands.",
  "Forecast updates ship as new versions, not edits to old ones.",
];

interface HowToReadProps {
  /** When true, show expanded by default and hide toggle. */
  defaultExpanded?: boolean;
}

export function HowToRead({ defaultExpanded = false }: HowToReadProps) {
  const [open, setOpen] = useState(defaultExpanded);

  return (
    <section className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between text-left text-sm font-medium text-zinc-300 hover:text-white"
        aria-expanded={open}
      >
        <span>How to read this</span>
        <span className="text-zinc-500">{open ? "▼" : "▶"}</span>
      </button>
      {open && (
        <ul className="mt-3 space-y-1.5 text-sm text-zinc-400">
          {BULLETS.map((line, i) => (
            <li key={i} className="list-disc pl-4">
              {line}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
