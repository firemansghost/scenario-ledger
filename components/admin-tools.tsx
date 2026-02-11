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

interface AdminToolsProps {
  overrides: Override[];
  lastRollupBuildAt: string | null;
}

export function AdminTools({ overrides, lastRollupBuildAt }: AdminToolsProps) {
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
        <h2 className="mb-2 font-medium">History rollups</h2>
        <p className="mb-2 text-sm text-zinc-500">
          Powers /learn/btc-cycle and /learn/equity-cycle. Run after backfilling SPY history.
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
