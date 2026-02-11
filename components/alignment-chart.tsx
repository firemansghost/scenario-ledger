"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface Snapshot {
  week_ending: string;
  alignment?: Record<
    string,
    { btc?: { driftPct?: number }; spy?: { driftPct?: number } }
  >;
  spx_equiv?: number | null;
  spy_close?: number | null;
  btc_close?: number | null;
}

interface AlignmentChartProps {
  snapshots: Snapshot[];
  factor: number;
}

export function AlignmentChart({ snapshots, factor }: AlignmentChartProps) {
  const chartData = snapshots.map((s) => {
    const align = s.alignment ?? {};
    const base = align.base;
    const bull = align.bull;
    const bear = align.bear;
    return {
      week_ending: s.week_ending,
      "Base SPY drift %": base?.spy?.driftPct ?? null,
      "Bull SPY drift %": bull?.spy?.driftPct ?? null,
      "Bear SPY drift %": bear?.spy?.driftPct ?? null,
      "Base BTC drift %": base?.btc?.driftPct ?? null,
      "Bull BTC drift %": bull?.btc?.driftPct ?? null,
      "Bear BTC drift %": bear?.btc?.driftPct ?? null,
      spx_equiv: s.spx_equiv != null ? Number(s.spx_equiv) : null,
      spy_close: s.spy_close != null ? Number(s.spy_close) : null,
      btc_close: s.btc_close != null ? Number(s.btc_close) : null,
    };
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-medium">SPY drift over time (% outside band)</h2>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
              <XAxis dataKey="week_ending" tick={{ fontSize: 10 }} stroke="#71717a" />
              <YAxis tick={{ fontSize: 10 }} stroke="#71717a" />
              <Tooltip
                contentStyle={{ backgroundColor: "#18181b", border: "1px solid #27272a" }}
                labelStyle={{ color: "#a1a1aa" }}
              />
              <Legend />
              <Line type="monotone" dataKey="Base SPY drift %" stroke="#eab308" dot={true} />
              <Line type="monotone" dataKey="Bull SPY drift %" stroke="#22c55e" dot={true} />
              <Line type="monotone" dataKey="Bear SPY drift %" stroke="#f43f5e" dot={true} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div>
        <h2 className="text-lg font-medium">BTC drift over time (% outside band)</h2>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
              <XAxis dataKey="week_ending" tick={{ fontSize: 10 }} stroke="#71717a" />
              <YAxis tick={{ fontSize: 10 }} stroke="#71717a" />
              <Tooltip
                contentStyle={{ backgroundColor: "#18181b", border: "1px solid #27272a" }}
                labelStyle={{ color: "#a1a1aa" }}
              />
              <Legend />
              <Line type="monotone" dataKey="Base BTC drift %" stroke="#eab308" dot={true} />
              <Line type="monotone" dataKey="Bull BTC drift %" stroke="#22c55e" dot={true} />
              <Line type="monotone" dataKey="Bear BTC drift %" stroke="#f43f5e" dot={true} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
      <p className="text-xs text-zinc-500">
        Drift = % outside scenario band (null when in band).
      </p>
    </div>
  );
}
