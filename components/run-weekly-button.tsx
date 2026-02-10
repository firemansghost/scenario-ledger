"use client";

import { useState } from "react";

interface RunWeeklyButtonProps {
  adminSecret?: string;
}

export function RunWeeklyButton({ adminSecret }: RunWeeklyButtonProps) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function run() {
    setLoading(true);
    setMessage(null);
    try {
      const headers: HeadersInit = {};
      if (adminSecret) headers["x-admin-secret"] = adminSecret;
      const res = await fetch("/api/admin/force-weekly", { method: "POST", headers });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setMessage(`Weekly snapshot: ${data.week_ending} (${data.active_scenario})`);
      } else {
        setMessage(data.error ?? `HTTP ${res.status}`);
      }
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Request failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={run}
        disabled={loading}
        className="rounded bg-zinc-700 px-3 py-2 text-sm hover:bg-zinc-600 disabled:opacity-50"
      >
        {loading ? "Running…" : "Run weekly ingest"}
      </button>
      {message && <span className="text-sm text-zinc-400">{message}</span>}
    </div>
  );
}
