/**
 * Build history_rollups (btc_cycle_daycounts_v1, spy_presidential_cycle_v1).
 * Used by scripts/build-history-rollups.ts and API POST /api/admin/build-rollups.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import { BITCOIN_CYCLE_REFERENCE } from "@/lib/education/bitcoinCycle";

function toDate(s: string): Date {
  if (s.length === 7) return new Date(s + "-01");
  return new Date(s + "-01-01");
}

function daysBetween(a: string, b: string): number {
  const d1 = toDate(a).getTime();
  const d2 = toDate(b).getTime();
  return Math.round((d2 - d1) / (24 * 60 * 60 * 1000));
}

export interface BuildRollupsResult {
  lastComputedAt: string;
  btcWritten: boolean;
  spyWritten: boolean;
}

export async function buildHistoryRollups(
  supabase: SupabaseClient
): Promise<BuildRollupsResult> {
  const now = new Date();
  const computedAt = now.toISOString();
  const today = now.toISOString().slice(0, 10);
  let btcWritten = false;
  let spyWritten = false;

  const btcCycles = BITCOIN_CYCLE_REFERENCE.map((row) => ({
    ...row,
    bullDays: daysBetween(row.bottom, row.peak),
    bearDays: daysBetween(row.peak, row.nextBottom),
    halvingToPeakDays: daysBetween(row.halving, row.peak),
  }));
  await supabase.from("history_rollups").upsert(
    {
      key: "btc_cycle_daycounts_v1",
      computed_at: computedAt,
      as_of_date: today,
      data: { cycles: btcCycles },
      meta: { source: "static" },
    },
    { onConflict: "key" }
  );
  btcWritten = true;

  const { data: spyRows } = await supabase
    .from("daily_series")
    .select("dt, value")
    .eq("series_key", "spy")
    .eq("source", "stooq")
    .order("dt", { ascending: true });

  if (spyRows && spyRows.length >= 365) {
    type Row = { dt: string; value: number };
    const rows = spyRows as Row[];
    const byYear = new Map<number, { first: Row; last: Row; prices: number[] }>();
    for (const r of rows) {
      const y = parseInt(r.dt.slice(0, 4), 10);
      if (!byYear.has(y)) byYear.set(y, { first: r, last: r, prices: [] });
      const cell = byYear.get(y)!;
      if (r.dt < cell.first.dt) cell.first = r;
      if (r.dt > cell.last.dt) cell.last = r;
      cell.prices.push(r.value);
    }
    const years = [...byYear.keys()].filter((y) => y >= 1994).sort((a, b) => a - b);
    const annualReturns: { year: number; cycleYear: number; returnPct: number }[] = [];
    for (let i = 1; i < years.length; i++) {
      const y = years[i]!;
      const prevY = years[i - 1]!;
      const prevLast = byYear.get(prevY)?.last?.value;
      const currLast = byYear.get(y)?.last?.value;
      if (prevLast != null && currLast != null && prevLast > 0) {
        const returnPct = ((currLast - prevLast) / prevLast) * 100;
        const cycleYear = (y % 4) || 4;
        annualReturns.push({ year: y, cycleYear, returnPct });
      }
    }
    const byCycleYear = new Map<number, number[]>();
    for (const r of annualReturns) {
      const list = byCycleYear.get(r.cycleYear) ?? [];
      list.push(r.returnPct);
      byCycleYear.set(r.cycleYear, list);
    }
    const avgByCycleYear: Record<number, number> = {};
    const medianByCycleYear: Record<number, number> = {};
    for (let cy = 1; cy <= 4; cy++) {
      const list = byCycleYear.get(cy) ?? [];
      if (list.length) {
        const sum = list.reduce((a, b) => a + b, 0);
        avgByCycleYear[cy] = Math.round((sum / list.length) * 100) / 100;
        const sorted = [...list].sort((a, b) => a - b);
        medianByCycleYear[cy] = sorted[Math.floor(sorted.length / 2)] ?? 0;
      }
    }
    const midtermYears = annualReturns.filter((r) => r.cycleYear === 2);
    const midtermDrawdowns: number[] = [];
    for (const r of midtermYears) {
      const cell = byYear.get(r.year);
      if (cell?.prices.length) {
        const max = Math.max(...cell.prices);
        const min = Math.min(...cell.prices);
        if (max > 0) midtermDrawdowns.push(((max - min) / max) * 100);
      }
    }
    const spyRollup = {
      avgReturnByCycleYear: avgByCycleYear,
      medianReturnByCycleYear: medianByCycleYear,
      midtermDrawdownPct: midtermDrawdowns.length
        ? {
            min: Math.min(...midtermDrawdowns),
            max: Math.max(...midtermDrawdowns),
            avg: midtermDrawdowns.reduce((a, b) => a + b, 0) / midtermDrawdowns.length,
            count: midtermDrawdowns.length,
          }
        : null,
      yearly: annualReturns.map((r) => ({
        year: r.year,
        cycleYear: r.cycleYear,
        returnPct: Math.round(r.returnPct * 100) / 100,
      })),
      coverage: {
        startDate: rows[0]?.dt,
        endDate: rows[rows.length - 1]?.dt,
        years: years.length,
      },
      note: "SPY price return only (no dividends). Cycle year: 4=election, 1=post-election, 2=midterm, 3=pre-election.",
    };
    await supabase.from("history_rollups").upsert(
      {
        key: "spy_presidential_cycle_v1",
        computed_at: computedAt,
        as_of_date: today,
        data: spyRollup,
        meta: { source: "daily_series", rowCount: spyRows.length },
      },
      { onConflict: "key" }
    );
    spyWritten = true;
  }

  return { lastComputedAt: computedAt, btcWritten, spyWritten };
}
