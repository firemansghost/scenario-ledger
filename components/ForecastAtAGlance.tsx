"use client";

import { useState } from "react";
import { assignBulletsToSeasons, derivePeriodLabel, isLongSingleYearPeriod } from "@/lib/periodLabels";
import type { ForecastConfig, PeriodBand, ScenarioKey } from "@/lib/types";

interface ForecastAtAGlanceProps {
  config: ForecastConfig;
  forecastName?: string;
  version?: number;
  currentPeriodIndex?: number;
}

const SCENARIOS: { key: ScenarioKey; label: string }[] = [
  { key: "bull", label: "Bull" },
  { key: "base", label: "Base" },
  { key: "bear", label: "Bear" },
];

type TimelinePhase = { label: string; bullets: string[] };

function getTimelineForScenario(
  config: ForecastConfig,
  scenarioKey: ScenarioKey
): TimelinePhase[] {
  const scenario = config.scenarios?.[scenarioKey] as
    | { timeline?: TimelinePhase[]; timeline_by_year?: TimelinePhase[] }
    | undefined;
  const scenarioTimeline = scenario?.timeline_by_year ?? scenario?.timeline;
  const configTimeline = config.timeline ?? config.timeline_by_year;
  return (scenarioTimeline ?? configTimeline) ?? [];
}

function PeriodBlock({ p, isCurrent, id }: { p: PeriodBand; isCurrent?: boolean; id?: string }) {
  const label = derivePeriodLabel(p.start, p.end, p.label);
  return (
    <div
      id={id}
      className={`rounded border p-2 text-sm ${isCurrent ? "border-amber-500/70 bg-amber-950/30" : "border-zinc-700"}`}
    >
      <div className="flex items-center gap-2">
        <span className="font-medium text-zinc-300">{label}</span>
        {isCurrent && (
          <span className="rounded bg-amber-600/50 px-1.5 py-0.5 text-xs font-medium text-amber-200">Current</span>
        )}
      </div>
      <span className="text-zinc-500"> {p.start} → {p.end}</span>
      <div className="mt-1 text-zinc-400">
        BTC: ${(p.btcRangeUsd.low / 1000).toFixed(0)}k–${(p.btcRangeUsd.high / 1000).toFixed(0)}k · SPX: {p.spxRange.low}–{p.spxRange.high}
      </div>
      {p.notes?.length ? <p className="mt-1 text-xs text-zinc-500">{p.notes.join(" ")}</p> : null}
    </div>
  );
}

function SeasonalBreakdown({
  year,
  timeline,
}: {
  year: number;
  timeline: TimelinePhase[];
}) {
  const yearSection = timeline.find(
    (t) => t.label === String(year) || t.label.startsWith(String(year))
  );
  const bullets = yearSection?.bullets ?? timeline[0]?.bullets ?? [];

  if (bullets.length === 0) {
    return (
      <p className="text-sm italic text-zinc-500">
        No near-term timeline published in this forecast version.
      </p>
    );
  }

  const bySeason = assignBulletsToSeasons(bullets, year);
  const seasonOrder = ["Spring", "Summer", "Fall", "Winter"] as const;

  return (
    <div className="space-y-3">
      {seasonOrder.map((season) => {
        const items = bySeason[season];
        if (items.length === 0) return null;
        return (
          <div key={season}>
            <h4 className="mb-1 text-xs font-medium text-zinc-500">{season}</h4>
            <ul className="list-disc pl-4 text-sm text-zinc-400">
              {items.slice(0, 4).map((b, i) => (
                <li key={i}>{b}</li>
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
}

export function ForecastAtAGlance({ config, forecastName, version, currentPeriodIndex }: ForecastAtAGlanceProps) {
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
            <div className="space-y-2">
              {(scenario.periods ?? []).map((p, i) => (
                <PeriodBlock key={i} p={p} isCurrent={i === currentPeriodIndex} id={`timebox-${i}`} />
              ))}
            </div>
            {isLongSingleYearPeriod(scenario.periods ?? []) && (() => {
              const firstPeriod = scenario.periods![0];
              const year = new Date(firstPeriod.start).getFullYear();
              const timeline = getTimelineForScenario(config, tab);
              return (
                <div className="mt-4">
                  <h3 className="mb-2 text-sm font-medium text-zinc-400">{year} breakdown</h3>
                  <SeasonalBreakdown year={year} timeline={timeline} />
                </div>
              );
            })()}
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
