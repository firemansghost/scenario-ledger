"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface CreateForecastFormProps {
  nextVersion: number;
  defaultConfig: unknown;
}

export function CreateForecastForm({ nextVersion, defaultConfig }: CreateForecastFormProps) {
  const router = useRouter();
  const [configJson, setConfigJson] = useState(
    () => JSON.stringify(defaultConfig, null, 2)
  );
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setError(null);
    let config: unknown;
    try {
      config = JSON.parse(configJson);
    } catch {
      setError("Invalid JSON");
      return;
    }

    const res = await fetch("/api/forecasts/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ version: nextVersion, name: `Forecast v${nextVersion}`, config }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? res.statusText);
      return;
    }
    router.push("/forecasts");
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <textarea
        className="w-full rounded border border-zinc-700 bg-zinc-900 p-3 font-mono text-sm"
        rows={20}
        value={configJson}
        onChange={(e) => setConfigJson(e.target.value)}
      />
      {error && <p className="text-sm text-rose-400">{error}</p>}
      <button
        onClick={submit}
        className="rounded bg-zinc-700 px-4 py-2 text-sm font-medium hover:bg-zinc-600"
      >
        Create forecast v{nextVersion}
      </button>
    </div>
  );
}
