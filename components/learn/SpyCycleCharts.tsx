"use client";

export interface SpyPresidentialRollup {
  avgReturnByCycleYear: Record<number, number>;
  medianReturnByCycleYear: Record<number, number>;
  midtermDrawdownPct: {
    min: number;
    max: number;
    avg: number;
    count: number;
  } | null;
  yearly?: { year: number; cycleYear: number; returnPct: number }[];
  coverage: { startDate?: string; endDate?: string; years: number };
  note?: string;
}

interface SpyCycleChartsProps {
  data: SpyPresidentialRollup;
}

const CYCLE_LABEL: Record<number, string> = {
  1: "Year 1 (post-election)",
  2: "Year 2 (midterm)",
  3: "Year 3 (pre-election)",
  4: "Year 4 (election)",
};

export function SpyCycleCharts({ data }: SpyCycleChartsProps) {
  return (
    <div className="space-y-6">
      <p className="text-sm text-zinc-400">
        This is <strong>SPY price return</strong> (no dividends). Cycle year: Year 4 = election (year % 4 === 0), Year 1 = post-election, Year 2 = midterm, Year 3 = pre-election.
      </p>
      <section className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
        <h3 className="mb-2 font-medium">Average SPY annual return by presidential cycle year</h3>
        <div className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
          {[1, 2, 3, 4].map((cy) => (
            <div key={cy} className="rounded border border-zinc-700 p-2">
              <div className="text-zinc-400">{CYCLE_LABEL[cy] ?? `Year ${cy}`}</div>
              <div className="font-mono text-zinc-200">
                {data.avgReturnByCycleYear[cy] != null ? `${data.avgReturnByCycleYear[cy]}%` : "—"}
              </div>
            </div>
          ))}
        </div>
      </section>
      {data.midtermDrawdownPct && (
        <section className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
          <h3 className="mb-2 font-medium">Midterm year (Year 2) drawdown stats</h3>
          <p className="mb-2 text-xs text-zinc-500">Peak-to-trough decline within each midterm year (%).</p>
          <dl className="grid gap-2 text-sm">
            <div><dt className="text-zinc-500">Min</dt><dd className="font-mono">{data.midtermDrawdownPct.min.toFixed(1)}%</dd></div>
            <div><dt className="text-zinc-500">Max</dt><dd className="font-mono">{data.midtermDrawdownPct.max.toFixed(1)}%</dd></div>
            <div><dt className="text-zinc-500">Avg</dt><dd className="font-mono">{data.midtermDrawdownPct.avg.toFixed(1)}%</dd></div>
            <div><dt className="text-zinc-500">Years</dt><dd className="font-mono">{data.midtermDrawdownPct.count}</dd></div>
          </dl>
        </section>
      )}
      {data.yearly && data.yearly.length > 0 && (
        <section className="overflow-x-auto rounded-lg border border-zinc-800">
          <h3 className="mb-2 p-2 font-medium">SPY annual return by year (since 1994)</h3>
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-700 bg-zinc-900/50">
                <th className="p-2 font-medium">Year</th>
                <th className="p-2 font-medium">Cycle year</th>
                <th className="p-2 font-medium">Return %</th>
              </tr>
            </thead>
            <tbody>
              {data.yearly.map((r, i) => (
                <tr key={i} className="border-b border-zinc-800">
                  <td className="p-2 font-mono">{r.year}</td>
                  <td className="p-2">{CYCLE_LABEL[r.cycleYear] ?? r.cycleYear}</td>
                  <td className="p-2 font-mono">{r.returnPct}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
      {data.coverage?.startDate && (
        <p className="text-xs text-zinc-500">
          Coverage: {data.coverage.startDate} → {data.coverage.endDate} ({data.coverage.years} years).
        </p>
      )}
    </div>
  );
}
