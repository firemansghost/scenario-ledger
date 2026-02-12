"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const STORAGE_KEY = "scenarioledger_intro_dismissed";

interface DashboardIntroProps {
  shareMode?: boolean;
}

export function DashboardIntro({ shareMode = false }: DashboardIntroProps) {
  const [expanded, setExpanded] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || shareMode) return;
    const val = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
    setExpanded(val !== "1");
  }, [mounted, shareMode]);

  const handleDismiss = () => {
    if (shareMode) return;
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, "1");
    }
    setExpanded(false);
  };

  const handleExpand = () => {
    setExpanded(true);
  };

  const q = shareMode ? "?share=1" : "";
  const primaryHref = `/predictions${q}#forecast-brief`;
  const secondaryHref = `/alignment${q}`;
  const tertiaryHref = `/learn${q}#start`;

  // Share mode: always expanded, no localStorage
  const isExpanded = shareMode ? true : expanded;

  return (
    <section className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
      <div className="flex items-center justify-between gap-2">
        {isExpanded ? (
          <h2 className="text-base font-medium text-zinc-200">
            ScenarioLedger is a weekly &quot;read&quot; on BTC + equities — based on evidence, not vibes.
          </h2>
        ) : (
          <p className="text-sm text-zinc-400">What is ScenarioLedger?</p>
        )}
        <button
          type="button"
          onClick={() => {
            if (shareMode) {
              setExpanded((e) => !e);
            } else if (isExpanded) {
              handleDismiss();
            } else {
              handleExpand();
            }
          }}
          className="shrink-0 rounded px-2 py-1 text-xs font-medium text-zinc-500 hover:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2 focus:ring-offset-black"
          aria-expanded={isExpanded}
        >
          {isExpanded ? "Hide" : "Why"}
        </button>
      </div>

      {isExpanded && (
        <>
          <ul className="mt-3 space-y-1 list-disc pl-4 text-sm text-zinc-400">
            <li>
              <strong className="text-zinc-300">Pinned Forecast:</strong> timeboxes + wide bands (frozen on purpose).
            </li>
            <li>
              <strong className="text-zinc-300">Weekly Read:</strong> best-fit scenario based on fresh evidence (can change).
            </li>
            <li>
              <strong className="text-zinc-300">Alignment:</strong> are prices behaving inside the band? Drift shows how far outside.
            </li>
          </ul>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Link
              href={primaryHref}
              className="inline-flex items-center justify-center rounded-md bg-zinc-100 px-3 py-2 text-sm font-medium text-zinc-900 hover:bg-white focus:outline-none focus:ring-2 focus:ring-zinc-400 focus:ring-offset-2 focus:ring-offset-black"
            >
              Open Forecast Brief
            </Link>
            <Link
              href={secondaryHref}
              className="inline-flex items-center justify-center rounded-md border border-zinc-600 px-3 py-2 text-sm font-medium text-zinc-300 hover:bg-zinc-800 focus:outline-none"
            >
              See Alignment
            </Link>
            <Link
              href={tertiaryHref}
              className="text-sm text-zinc-400 underline hover:text-zinc-200"
            >
              Start Here (60 seconds)
            </Link>
          </div>

          <p className="mt-3 text-xs text-zinc-500">
            Not trade signals. Not financial advice. Just a structured way to track the path.
          </p>

          {!shareMode && (
            <button
              type="button"
              onClick={handleDismiss}
              className="mt-2 text-xs text-zinc-500 hover:text-zinc-400 focus:outline-none"
            >
              Don&apos;t show again
            </button>
          )}
        </>
      )}

    </section>
  );
}
