"use client";

import { useState } from "react";
import type { ForecastConfig, PeriodBand, ScenarioKey } from "@/lib/types";

interface ForecastAtAGlanceProps {
  config: ForecastConfig;
  forecastName?: string;
  version?: number;
}

const SCENARIOS: { key: ScenarioKey; label: string }[] = [
  { key: "bull", label: "Bull" },
  { key: "base", label: "Base" },
  { key: "bear", label: "Bear" },
];

function PeriodBlock({ p }: { p: PeriodBand }) {
  return (
    <div className="rounded border border-zinc-700 p-2 text-sm">
      <span className="font-medium text-zinc-300">{p.label}</span> {p.start} → {p.end}
      <div className="mt-1 text-zinc-400">
        BTC: ${(p.btcRangeUsd.low / 1000).toFixed(0)}k–${(p.btcRangeUsd.high / 1000).toFixed(0)}k · SPX: {p.spxRange.low}–{p.spxRange.high}
      </div>
      {p.notes?.length ? <p className="mt-1 text-xs text-zinc-500">{p.notes.join(" ")}</p> : null}
    </div>
  );
}

export function ForecastAtAGlance({ config, forecastName, version }: ForecastAtAGlanceProps) {
  const [tab, setTab] = useState<ScenarioKey>("base");
  const scenario = config.scenarios?.[tab];
  const timeline = config.timeline ?? config.timeline_by_year;
  const athWindows = config.athWindows as { key?: string; label?: string; displayRange?: string }[] | undefined;

  return (
    <div className="space-y-4">
      {(forecastName || version != null) && (
        <p className="text-sm text-zinc-500">{forecastName ?? "Active forecast"}{version != null && ` · v${version}`}</p>
      )}
      <div className="flex gap-2 border-b border-zinc-700 pb-2">
        {SCENARIOS.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={`rounded px-3 py-1.5 text-sm font-medium ${tab === key ? "bg-zinc-600 text-white" : "bg-zinc-800 text-zinc-400 hover:text-white"}`}
          >
            {label}
          </button>
        ))}
      </div>
      {scenario && (
        <>
          <section>
            <h3 className="mb-1 text-sm font-medium text-zinc-400">Label</h3>
            <p className="text-zinc-200">{scenario.label}</p>
          </section>
          <section>
            <h3 className="mb-2 text-sm font-medium text-zinc-400">Period bands</h3>
            <p className="mb-2 text-xs text-zinc-500">These are wide on purpose. Use checkpoints + invalidations to track the path.</p>
            <div className="space-y-2">{(scenario.periods ?? []).map((p, i) => <PeriodBlock key={i} p={p} />)}</div>
          </section>
          {(athWindows?.length ?? 0) > 0 && (
            <section>
              <h3 className="mb-1 text-sm font-medium text-zinc-400">ATH windows</h3>
              <ul className="list-disc pl-4 text-sm text-zinc-400">
                {(athWindows ?? []).map((w, i) => <li key={w.key ?? i}>{w.label}: {w.displayRange}</li>)}
              </ul>
            </section>
          )}
          {(timeline?.length ?? 0) > 0 && (
            <section>
              <div className="space-y-3">
                {(timeline ?? []).map((phase, i) => (
                  <div key={i}>
                    <h3 className="mb-1 text-sm font-medium text-zinc-400">Timeline {phase.label}</h3>
                    <ul className="list-disc pl-4 text-sm text-zinc-400">
                      {phase.bullets.map((b, j) => <li key={j}>{b}</li>)}
                    </ul>
                  </div>
                ))}
              </div>
            </section>
          )}
          {scenario.checkpoints?.length > 0 && (
            <section>
              <h3 className="mb-1 text-sm font-medium text-zinc-400">Checkpoints</h3>
              <ul className="list-disc pl-4 text-sm text-zinc-400">
                {scenario.checkpoints.map((c, i) => <li key={i}>{c}</li>)}
              </ul>
            </section>
          )}
          {scenario.invalidations?.length > 0 && (
            <section>
              <h3 className="mb-1 text-sm font-medium text-zinc-400">Invalidations</h3>
              <ul className="list-disc pl-4 text-sm text-rose-400/80">
                {scenario.invalidations.map((inv, i) => <li key={i}>{inv}</li>)}
              </ul>
            </section>
          )}
        </>
      )}
    </div>
  );
}
