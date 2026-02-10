import type { TopContributor } from "@/lib/types";

interface ScenarioCardProps {
  activeScenario: string;
  confidence: string;
  topContributors: TopContributor[];
}

export function ScenarioCard({ activeScenario, confidence, topContributors }: ScenarioCardProps) {
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
      <h2 className="text-lg font-medium">Active scenario</h2>
      <p className="mt-1 text-2xl font-semibold capitalize">{activeScenario}</p>
      <p className="text-sm text-zinc-400">Confidence: {confidence}</p>
      {topContributors.length > 0 && (
        <div className="mt-3">
          <p className="text-xs text-zinc-500">Top contributors</p>
          <ul className="mt-1 list-inside list-disc text-sm">
            {topContributors.slice(0, 3).map((c) => (
              <li key={c.indicator_key}>
                {c.indicator_key} ({c.contribution > 0 ? "+" : ""}
                {c.contribution.toFixed(2)})
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
