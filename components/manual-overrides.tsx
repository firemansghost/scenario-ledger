"use client";

import { useState } from "react";

interface Override {
  id: string;
  series_key: string;
  dt: string;
  value: number;
  reason: string | null;
  created_at: string;
}

interface ManualOverridesProps {
  overrides: Override[];
  adminSecret?: string;
}

export function ManualOverrides({ overrides: initialOverrides, adminSecret }: ManualOverridesProps) {
  const [overrides, setOverrides] = useState(initialOverrides);
  const [series_key, setSeriesKey] = useState("");
  const [dt, setDt] = useState("");
  const [value, setValue] = useState("");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  const headers: HeadersInit = { "Content-Type": "application/json" };
  if (adminSecret) headers["x-admin-secret"] = adminSecret;

  async function addOverride() {
    if (!series_key.trim() || !dt || value === "") return;
    setLoading(true);
    try {
      const res = await fetch("/api/admin/overrides", {
        method: "POST",
        headers,
        body: JSON.stringify({
          series_key: series_key.trim(),
          dt,
          value: parseFloat(value),
          reason: reason.trim() || null,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setOverrides((prev) => [data, ...prev]);
      setSeriesKey("");
      setDt("");
      setValue("");
      setReason("");
    } finally {
      setLoading(false);
    }
  }

  async function removeOverride(id: string) {
    const res = await fetch("/api/admin/overrides", {
      method: "DELETE",
      headers,
      body: JSON.stringify({ id }),
    });
    if (!res.ok) return;
    setOverrides((prev) => prev.filter((o) => o.id !== id));
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
        <input
          placeholder="series_key"
          className="rounded border border-zinc-700 bg-zinc-800 px-2 py-1.5 text-sm"
          value={series_key}
          onChange={(e) => setSeriesKey(e.target.value)}
        />
        <input
          type="date"
          placeholder="dt"
          className="rounded border border-zinc-700 bg-zinc-800 px-2 py-1.5 text-sm"
          value={dt}
          onChange={(e) => setDt(e.target.value)}
        />
        <input
          type="number"
          step="any"
          placeholder="value"
          className="rounded border border-zinc-700 bg-zinc-800 px-2 py-1.5 text-sm"
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
        <input
          placeholder="reason (optional)"
          className="rounded border border-zinc-700 bg-zinc-800 px-2 py-1.5 text-sm"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
        <button
          onClick={addOverride}
          disabled={loading}
          className="rounded bg-zinc-700 px-3 py-1.5 text-sm hover:bg-zinc-600 disabled:opacity-50"
        >
          Add override
        </button>
      </div>
      <ul className="space-y-2">
        {overrides.map((o) => (
          <li
            key={o.id}
            className="flex items-center justify-between rounded border border-zinc-800 p-2 text-sm"
          >
            <span className="font-mono">{o.series_key}</span> {o.dt} = {o.value}
            {o.reason && <span className="text-zinc-500">({o.reason})</span>}
            <button
              onClick={() => removeOverride(o.id)}
              className="text-rose-400 hover:underline"
            >
              Remove
            </button>
          </li>
        ))}
      </ul>
      {overrides.length === 0 && (
        <p className="text-sm text-zinc-500">No overrides. Overrides take precedence over daily_series.</p>
      )}
    </div>
  );
}
