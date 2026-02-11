"use client";

import { useState } from "react";
import { BuildRollupsButton } from "./BuildRollupsButton";
import { ForceIngestButton } from "./force-ingest-button";
import { RunWeeklyButton } from "./run-weekly-button";
import { ManualOverrides } from "./manual-overrides";

interface Override {
  id: string;
  series_key: string;
  dt: string;
  value: number;
  reason: string | null;
  created_at: string;
}

interface SeriesCoverage {
  present: boolean;
  rowCount?: number;
  minDt?: string;
  maxDt?: string;
}

interface AdminToolsProps {
  overrides: Override[];
  lastRollupBuildAt: string | null;
  spxCoverage: SeriesCoverage;
  spyCoverage: SeriesCoverage;
}

export function AdminTools({ overrides, lastRollupBuildAt, spxCoverage, spyCoverage }: AdminToolsProps) {
  const [adminSecret, setAdminSecret] = useState("");

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
        <label className="mb-2 block text-sm font-medium text-zinc-400">
          Admin secret (optional; required when ADMIN_SECRET is set)
        </label>
        <input
          type="password"
          placeholder="Admin secret"
          className="w-full max-w-xs rounded border border-zinc-700 bg-zinc-800 px-2 py-1.5 text-sm"
          value={adminSecret}
          onChange={(e) => setAdminSecret(e.target.value)}
        />
      </div>

      <section>
        <h2 className="mb-2 font-medium">Coverage</h2>
        <div className="space-y-1 text-sm text-zinc-400">
          <p>
            SPX: {spxCoverage.present
              ? `Present: ${spxCoverage.rowCount?.toLocaleString() ?? "—"} rows (${spxCoverage.minDt ?? "—"} → ${spxCoverage.maxDt ?? "—"})`
              : "Missing"}
          </p>
          <p>
            SPY: {spyCoverage.present
              ? `Present: ${spyCoverage.rowCount?.toLocaleString() ?? "—"} rows (${spyCoverage.minDt ?? "—"} → ${spyCoverage.maxDt ?? "—"})`
              : "Missing"}
          </p>
        </div>
        <p className="mt-1 text-xs text-zinc-500">SPX backfill: <code className="rounded bg-zinc-800 px-1">npm run backfill:spx-history</code></p>
      </section>

      <section>
        <h2 className="mb-2 font-medium">History rollups</h2>
        <p className="mb-2 text-sm text-zinc-500">
          Powers /learn/btc-cycle and /learn/equity-cycle. Prefers SPX for equity when present; else SPY.
        </p>
        <p className="mb-2 text-sm text-zinc-400">
          Last rollup build: {lastRollupBuildAt ? new Date(lastRollupBuildAt).toLocaleString() : "never"}
        </p>
        <BuildRollupsButton adminSecret={adminSecret || undefined} />
      </section>

      <section>
        <h2 className="mb-2 font-medium">Force-run daily ingest</h2>
        <ForceIngestButton adminSecret={adminSecret || undefined} />
      </section>

      <section>
        <h2 className="mb-2 font-medium">Run weekly ingest</h2>
        <p className="mb-2 text-sm text-zinc-500">
          Computes most recent Friday week-ending, indicators, snapshot, and alignment.
        </p>
        <RunWeeklyButton adminSecret={adminSecret || undefined} />
      </section>

      <section>
        <h2 className="mb-2 font-medium">Manual overrides</h2>
        <ManualOverrides overrides={overrides} adminSecret={adminSecret || undefined} />
      </section>
    </div>
  );
}
