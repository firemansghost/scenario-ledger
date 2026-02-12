"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import { buildBriefCopyText, getBriefSharePath, type WeeklyBriefResult } from "@/lib/weeklyBrief";

interface WeeklyBriefCardProps {
  brief: WeeklyBriefResult;
  shareMode?: boolean;
}

export function WeeklyBriefCard({ brief, shareMode }: WeeklyBriefCardProps) {
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied" | "share-copied">("idle");
  const primaryHref = shareMode ? "/predictions?share=1#this-week" : brief.ctas.primaryHref;

  const handleCopyBrief = useCallback(async () => {
    const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
    const text = buildBriefCopyText(brief, baseUrl);
    await navigator.clipboard.writeText(text);
    setCopyStatus("copied");
    setTimeout(() => setCopyStatus("idle"), 2000);
  }, [brief]);

  const handleShareLink = useCallback(async () => {
    const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
    const url = `${baseUrl}${getBriefSharePath(brief.weekEnding)}`;
    await navigator.clipboard.writeText(url);
    setCopyStatus("share-copied");
    setTimeout(() => setCopyStatus("idle"), 2000);
  }, [brief]);

  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
      <h2 className="text-lg font-medium">{brief.title}</h2>
      <p className="mb-3 text-sm text-zinc-500">{brief.subtitle}</p>
      {(brief.computedOnForecastVersion != null || brief.activeForecastVersion != null) && (
        <div className="mb-2 flex flex-wrap items-center gap-2">
          {brief.computedOnForecastVersion != null && (
            <span className="text-xs text-zinc-500">
              Computed on Forecast v{brief.computedOnForecastVersion}
            </span>
          )}
          {brief.activeForecastVersion != null && (
            <Link
              href="/predictions#forecast-brief"
              className="rounded-full bg-amber-600/30 px-2 py-0.5 text-xs font-medium text-amber-200 hover:bg-amber-600/50"
            >
              New forecast v{brief.activeForecastVersion} published →
            </Link>
          )}
        </div>
      )}
      <p className="mb-3 font-medium text-zinc-200">{brief.headline}</p>
      {brief.bullets.length > 0 && (
        <ul className="mb-4 list-disc space-y-1 pl-4 text-sm text-zinc-400">
          {brief.bullets.map((b, i) => (
            <li key={i}>{b}</li>
          ))}
        </ul>
      )}
      <div className="mb-4 flex flex-wrap gap-4 text-xs text-zinc-500">
        <span>Read: {brief.stats.scenarioLabel}</span>
        <span>
          Probs: Base {brief.stats.probDeltas.base >= 0 ? "+" : ""}{brief.stats.probDeltas.base}pp | Bull {brief.stats.probDeltas.bull >= 0 ? "+" : ""}{brief.stats.probDeltas.bull}pp | Bear {brief.stats.probDeltas.bear >= 0 ? "+" : ""}{brief.stats.probDeltas.bear}pp
        </span>
        {brief.stats.btcStatus != null && brief.stats.eqStatus != null && (
          <span>
            Alignment: BTC {brief.stats.btcStatus} · Equity {brief.stats.eqStatus}
          </span>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Link
          href={primaryHref}
          className="inline-flex items-center justify-center rounded-md bg-zinc-100 px-3 py-2 text-sm font-medium text-zinc-900 hover:bg-white focus:outline-none focus:ring-2 focus:ring-zinc-400 focus:ring-offset-2 focus:ring-offset-black"
        >
          Open Forecast Brief
        </Link>
        <Link
          href={brief.ctas.secondaryHref}
          className="inline-flex items-center justify-center rounded-md border border-zinc-600 px-3 py-2 text-sm font-medium text-zinc-300 hover:bg-zinc-800 focus:outline-none"
        >
          See alignment
        </Link>
        <button
          type="button"
          onClick={handleCopyBrief}
          className="rounded-md border border-zinc-600 px-3 py-2 text-sm font-medium text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 focus:outline-none"
        >
          {copyStatus === "copied" ? "Copied!" : "Copy brief"}
        </button>
        <button
          type="button"
          onClick={handleShareLink}
          className="rounded-md border border-zinc-600 px-3 py-2 text-sm font-medium text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 focus:outline-none"
        >
          {copyStatus === "share-copied" ? "Link copied!" : "Share link"}
        </button>
        <Link
          href="/briefs"
          className="text-sm text-zinc-500 hover:text-zinc-300"
        >
          View archive
        </Link>
      </div>
    </div>
  );
}
