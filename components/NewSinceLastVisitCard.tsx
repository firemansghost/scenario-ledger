"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { buildWeeklyBrief } from "@/lib/weeklyBrief";
import type { ScenarioKey } from "@/lib/types";

const STORAGE_KEY = "scenarioledger_last_seen_week_ending";

type AlignRow = {
  btc?: { inBand: boolean; driftPct?: number };
  spy?: { inBand: boolean; driftPct?: number };
};

interface NewSinceLastVisitCardProps {
  latestWeekEnding: string;
  prevSnapshot: {
    week_ending: string;
    active_scenario: ScenarioKey;
    confidence: string;
    scenario_probs: Record<ScenarioKey, number>;
    alignment?: Record<string, AlignRow | undefined>;
    top_contributors?: { indicator_key: string; contribution: number }[];
  } | null;
  latestSnapshot: {
    week_ending: string;
    active_scenario: ScenarioKey;
    confidence: string;
    scenario_probs: Record<ScenarioKey, number>;
    alignment?: Record<string, AlignRow | undefined>;
    top_contributors?: { indicator_key: string; contribution: number }[];
  };
  indicatorLatest: { indicator_key: string; value: number | null; delta: number | null; state: string }[];
  indicatorPrev: { indicator_key: string; value: number | null; delta: number | null; state: string }[];
  defsByKey: Record<string, string>;
  shareMode: boolean;
}

export function NewSinceLastVisitCard({
  latestWeekEnding,
  prevSnapshot,
  latestSnapshot,
  indicatorLatest,
  indicatorPrev,
  defsByKey,
  shareMode,
}: NewSinceLastVisitCardProps) {
  const [visible, setVisible] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || shareMode) return;
    const lastSeen = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
    const hasNew = lastSeen && latestWeekEnding > lastSeen;
    if (hasNew) {
      setVisible(true);
    } else if (typeof window !== "undefined") {
      // Store current week when no "new" state (first visit or already seen)
      localStorage.setItem(STORAGE_KEY, latestWeekEnding);
    }
  }, [mounted, shareMode, latestWeekEnding]);

  const handleDismiss = () => {
    if (shareMode) return;
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, latestWeekEnding);
    }
    setVisible(false);
  };

  if (!visible || shareMode) return null;

  const brief = buildWeeklyBrief({
    latestSnapshot: {
      week_ending: latestSnapshot.week_ending,
      active_scenario: latestSnapshot.active_scenario,
      confidence: latestSnapshot.confidence,
      scenario_probs: latestSnapshot.scenario_probs ?? {},
      alignment: latestSnapshot.alignment,
      top_contributors: latestSnapshot.top_contributors ?? [],
    },
    prevSnapshot: prevSnapshot
      ? {
          week_ending: prevSnapshot.week_ending,
          active_scenario: prevSnapshot.active_scenario,
          confidence: prevSnapshot.confidence,
          scenario_probs: prevSnapshot.scenario_probs ?? {},
          alignment: prevSnapshot.alignment,
          top_contributors: prevSnapshot.top_contributors ?? [],
        }
      : null,
    indicatorLatest,
    indicatorPrev,
    defsByKey,
  });

  const bullets = brief.bullets.slice(0, 3);

  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
      <h2 className="mb-1 text-base font-medium">New since your last visit</h2>
      <p className="mb-3 text-sm text-zinc-500">Week ending {latestWeekEnding}</p>
      {bullets.length > 0 && (
        <ul className="mb-4 list-disc space-y-1 pl-4 text-sm text-zinc-400">
          {bullets.map((b, i) => (
            <li key={i}>{b}</li>
          ))}
        </ul>
      )}
      <div className="flex flex-wrap items-center gap-2">
        <Link
          href={`/briefs/${latestWeekEnding}`}
          className="inline-flex items-center justify-center rounded-md bg-zinc-100 px-3 py-2 text-sm font-medium text-zinc-900 hover:bg-white focus:outline-none focus:ring-2 focus:ring-zinc-400 focus:ring-offset-2 focus:ring-offset-black"
        >
          Open this week&apos;s brief
        </Link>
        <Link
          href="/alignment"
          className="inline-flex items-center justify-center rounded-md border border-zinc-600 px-3 py-2 text-sm font-medium text-zinc-300 hover:bg-zinc-800 focus:outline-none"
        >
          See alignment
        </Link>
        <button
          type="button"
          onClick={handleDismiss}
          className="rounded-md border border-zinc-600 px-3 py-2 text-sm font-medium text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 focus:outline-none"
        >
          Got it
        </button>
      </div>
    </div>
  );
}
