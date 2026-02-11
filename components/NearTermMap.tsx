import type { ForecastConfig, ScenarioKey } from "@/lib/types";

type TimelinePhase = { label: string; bullets: string[] };

interface NearTermMapProps {
  config: ForecastConfig;
  activeScenario: ScenarioKey;
  maxBullets?: number;
}

function getTimelineFromConfig(
  config: ForecastConfig,
  activeScenario: ScenarioKey
): TimelinePhase[] {
  const scenario = config.scenarios?.[activeScenario] as
    | { timeline_by_year?: TimelinePhase[]; timeline?: TimelinePhase[] }
    | undefined;
  const scenarioTimeline = scenario?.timeline_by_year ?? scenario?.timeline;
  const configTimeline = config.timeline ?? config.timeline_by_year;
  return (scenarioTimeline ?? configTimeline) ?? [];
}

export function NearTermMap({
  config,
  activeScenario,
  maxBullets = 6,
}: NearTermMapProps) {
  const timeline = getTimelineFromConfig(config, activeScenario);

  if (!timeline?.length) {
    return (
      <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
        <h2 className="text-lg font-medium">Near-term map</h2>
        <p className="mt-1 text-sm text-zinc-500">
          Timeboxes, not price targets. Use this to know what &quot;should be happening&quot; next.
        </p>
        <p className="mt-4 text-sm text-zinc-500 italic">
          No near-term timeline published in this forecast version.
        </p>
      </div>
    );
  }

  const firstPhase = timeline[0];
  const bullets = (firstPhase?.bullets ?? []).slice(0, maxBullets);

  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
      <h2 className="text-lg font-medium">Near-term map</h2>
      <p className="mt-1 text-sm text-zinc-500">
        Timeboxes, not price targets. Use this to know what &quot;should be happening&quot; next.
      </p>
      {firstPhase && bullets.length > 0 && (
        <div className="mt-4">
          <h3 className="mb-2 text-sm font-medium text-zinc-400">
            {firstPhase.label}
          </h3>
          <ul className="list-disc pl-4 space-y-1 text-sm text-zinc-300">
            {bullets.map((b, i) => (
              <li key={i}>{b}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
