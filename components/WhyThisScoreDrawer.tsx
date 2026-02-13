"use client";

import Link from "next/link";
import { useCallback } from "react";
import type { PathIntegrity } from "@/lib/pathIntegrity";
import type { PathIntegrityExplain } from "@/lib/pathIntegrityExplain";

interface WhyThisScoreDrawerProps {
  explain: PathIntegrityExplain;
  integrity: PathIntegrity;
  shareMode: boolean;
  weekEnding: string;
  canonicalUrl: string;
  compact?: boolean;
}

function buildCopyText(params: {
  explain: PathIntegrityExplain;
  integrity: PathIntegrity;
  weekEnding: string;
  canonicalUrl: string;
  shareMode: boolean;
}): string {
  const { explain, integrity, weekEnding, canonicalUrl, shareMode } = params;
  const qs = shareMode ? "?share=1" : "";
  const baseUrl =
    typeof window !== "undefined" ? window.location.origin : "";
  const url = `${baseUrl}${canonicalUrl}${qs}`;

  const lines: string[] = [
    `Path Integrity: ${integrity.score}/100 (${integrity.grade} ${integrity.label})`,
    `Week ending ${weekEnding}`,
    "",
    "Components:",
    `  Alignment: ${integrity.components.alignment}/40`,
    `  Evidence: ${integrity.components.evidence}/30`,
    `  Tripwires: ${integrity.components.tripwires}/20`,
    `  Confidence: ${integrity.components.confidence}/10`,
    "",
    ...explain.sections.flatMap((s) =>
      s.lines.map((l) => `  ${l}`)
    ),
    "",
    "What would change it:",
    ...explain.whatChangesIt.map((b) => `  • ${b}`),
    "",
    ...explain.disclaimers,
    "",
    url,
  ];
  return lines.join("\n");
}

export function WhyThisScoreDrawer({
  explain,
  integrity,
  shareMode,
  weekEnding,
  canonicalUrl,
  compact = false,
}: WhyThisScoreDrawerProps) {
  const qs = shareMode ? "?share=1" : "";
  const briefHref = `/briefs/${weekEnding}${qs}`;

  const handleCopy = useCallback(async () => {
    const text = buildCopyText({
      explain,
      integrity,
      weekEnding,
      canonicalUrl,
      shareMode,
    });
    await navigator.clipboard.writeText(text);
  }, [explain, integrity, weekEnding, canonicalUrl, shareMode]);

  if (compact) {
    return (
      <details className="group mt-2">
        <summary className="cursor-pointer list-none text-xs text-zinc-500 hover:text-zinc-300 [&::-webkit-details-marker]:hidden">
          Why? <span className="text-zinc-600">(show inputs)</span>
        </summary>
        <div className="mt-2 space-y-2 border-t border-zinc-800 pt-2">
          <p className="text-xs text-zinc-400">{explain.headline}</p>
          <div className="flex flex-wrap gap-2">
            {explain.sections.map((s, i) => (
              <span
                key={i}
                className="rounded bg-zinc-700/50 px-1.5 py-0.5 text-xs text-zinc-500"
              >
                {s.points}
              </span>
            ))}
          </div>
          <Link
            href={briefHref}
            className="inline-block text-xs text-zinc-500 underline hover:text-zinc-300"
          >
            Open full explanation →
          </Link>
        </div>
      </details>
    );
  }

  return (
    <details className="group mt-4 border-t border-zinc-800 pt-4">
      <summary className="cursor-pointer list-none text-sm font-medium text-zinc-400 hover:text-zinc-300 [&::-webkit-details-marker]:hidden">
        Why this score?{" "}
        <span className="text-xs font-normal text-zinc-500">
          (Show the inputs + the point math.)
        </span>
      </summary>
      <div className="mt-4 space-y-4">
        <p className="text-sm text-zinc-300">{explain.headline}</p>

        <div className="grid gap-4 md:grid-cols-2">
          {explain.sections.map((s, i) => (
            <div
              key={i}
              className="rounded border border-zinc-800 bg-zinc-900/30 p-3"
            >
              <div className="mb-2 flex items-center justify-between">
                <h4 className="text-xs font-medium text-zinc-500">{s.title}</h4>
                {s.points && (
                  <span className="rounded bg-zinc-700/50 px-1.5 py-0.5 text-xs font-medium text-zinc-400">
                    {s.points}
                  </span>
                )}
              </div>
              <ul className="space-y-1 text-xs text-zinc-400">
                {s.lines.map((l, j) => (
                  <li key={j}>{l}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div>
          <h4 className="mb-2 text-xs font-medium text-zinc-500">
            What would change it
          </h4>
          <ul className="list-disc space-y-1 pl-4 text-xs text-zinc-400">
            {explain.whatChangesIt.map((b, i) => (
              <li key={i}>{b}</li>
            ))}
          </ul>
        </div>

        <div className="space-y-1 text-xs text-zinc-500">
          {explain.disclaimers.map((d, i) => (
            <p key={i}>{d}</p>
          ))}
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleCopy}
            className="rounded-md border border-zinc-600 px-3 py-2 text-sm font-medium text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 focus:outline-none"
          >
            Copy explanation
          </button>
          <Link
            href={briefHref}
            className="inline-flex items-center justify-center rounded-md border border-zinc-600 px-3 py-2 text-sm font-medium text-zinc-300 hover:bg-zinc-800 focus:outline-none"
          >
            Open full brief
          </Link>
        </div>
      </div>
    </details>
  );
}
