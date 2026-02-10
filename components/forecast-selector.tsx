"use client";

import { useRouter } from "next/navigation";

interface Forecast {
  id: string;
  version: number;
  name: string;
  is_active: boolean;
  created_at: string;
}

interface ForecastSelectorProps {
  forecasts: Forecast[];
}

export function ForecastSelector({ forecasts }: ForecastSelectorProps) {
  const router = useRouter();

  async function setActive(forecastId: string) {
    await fetch("/api/forecasts/set-active", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ forecast_id: forecastId }),
    });
    router.refresh();
  }

  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
      <h2 className="mb-2 text-sm font-medium text-zinc-400">Set active forecast</h2>
      <div className="flex flex-wrap gap-2">
        {forecasts.map((f) => (
          <button
            key={f.id}
            onClick={() => setActive(f.id)}
            className={`rounded px-3 py-1.5 text-sm ${f.is_active ? "bg-emerald-800 text-white" : "bg-zinc-700 text-zinc-300 hover:bg-zinc-600"}`}
          >
            v{f.version} {f.name}
          </button>
        ))}
      </div>
    </div>
  );
}
