/**
 * Build history_rollups (btc_cycle_daycounts_v1, spx_presidential_cycle_v1 or spy_presidential_cycle_v1).
 * Prefers SPX for equity when >= 10 years coverage; else falls back to SPY.
 * Uses pagination to fetch all daily_series rows (Supabase default limit is 1000).
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import { BITCOIN_CYCLE_REFERENCE } from "@/lib/education/bitcoinCycle";

const MIN_EQUITY_YEARS = 10;
const MIN_EQUITY_ROWS = 365 * MIN_EQUITY_YEARS;
const PAGE_SIZE = 1000;

async function fetchAllDailySeries(
  supabase: SupabaseClient,
  seriesKey: string,
  source = "stooq"
): Promise<Array<{ dt: string; value: number }>> {
  const all: Array<{ dt: string; value: number }> = [];
  let from = 0;

  while (true) {
    const { data, error } = await supabase
      .from("daily_series")
      .select("dt, value")
      .eq("series_key", seriesKey)
      .eq("source", source)
      .order("dt", { ascending: true })
      .range(from, from + PAGE_SIZE - 1);

    if (error) throw error;
    if (!data || data.length === 0) break;

    all.push(...(data as Array<{ dt: string; value: number }>));

    if (data.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }

  return all;
}

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
  spxWritten: boolean;
}

type EquityRow = { dt: string; value: number };

/** Year is complete if we have data through Dec 15 (year-end proxy). Excludes current year. */
function isCompleteYear(year: number, lastDt: string, thisYear: number): boolean {
  if (year >= thisYear) return false;
  return lastDt >= `${year}-12-15`;
}

function buildEquityRollupFromRows(
  rows: EquityRow[],
  seriesKeyUsed: "spx" | "spy"
): {
  data: {
    avgReturnByCycleYear: Record<number, number>;
    medianReturnByCycleYear: Record<number, number>;
    midtermDrawdownPct: { min: number; max: number; avg: number; count: number } | null;
    yearly: { year: number; cycleYear: number; returnPct: number }[];
    coverage: { startDate?: string; endDate?: string; years: number };
    note: string;
  };
  meta: {
    series_key_used: string;
    min_dt: string;
    max_dt: string;
    years_covered: number;
    rowCount: number;
    complete_years_used?: number[];
    excluded_years?: number[];
    as_of_complete_year?: number;
  };
} {
  const thisYear = new Date().getFullYear();
  const byYear = new Map<number, { first: EquityRow; last: EquityRow; prices: number[] }>();
  for (const r of rows) {
    const y = parseInt(r.dt.slice(0, 4), 10);
    if (!byYear.has(y)) byYear.set(y, { first: r, last: r, prices: [] });
    const cell = byYear.get(y)!;
    if (r.dt < cell.first.dt) cell.first = r;
    if (r.dt > cell.last.dt) cell.last = r;
    cell.prices.push(r.value);
  }
  const minYear = seriesKeyUsed === "spy" ? 1994 : Math.min(...byYear.keys());
  const allYears = [...byYear.keys()].filter((y) => y >= minYear).sort((a, b) => a - b);
  const completeYears = allYears.filter(
    (y) => isCompleteYear(y, byYear.get(y)!.last.dt, thisYear)
  );
  const excludedYears = allYears.filter((y) => !completeYears.includes(y));

  const annualReturns: { year: number; cycleYear: number; returnPct: number }[] = [];
  for (let i = 1; i < completeYears.length; i++) {
    const y = completeYears[i]!;
    const prevY = completeYears[i - 1]!;
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
    if (!completeYears.includes(r.year)) continue;
    if (cell?.prices.length) {
      const max = Math.max(...cell.prices);
      const min = Math.min(...cell.prices);
      if (max > 0) midtermDrawdowns.push(((max - min) / max) * 100);
    }
  }
  const minDt = rows[0]?.dt ?? "";
  const maxDt = rows[rows.length - 1]?.dt ?? "";
  const note =
    seriesKeyUsed === "spx"
      ? "S&P 500 Index (SPX) price return, no dividends. Cycle year: 4=election, 1=post-election, 2=midterm, 3=pre-election."
      : "SPY ETF price return only (no dividends). Cycle year: 4=election, 1=post-election, 2=midterm, 3=pre-election.";
  return {
    data: {
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
      coverage: { startDate: minDt, endDate: maxDt, years: completeYears.length },
      note,
    },
    meta: {
      series_key_used: seriesKeyUsed,
      min_dt: minDt,
      max_dt: maxDt,
      years_covered: completeYears.length,
      rowCount: rows.length,
      complete_years_used: completeYears,
      excluded_years: excludedYears,
      as_of_complete_year: completeYears.length > 0 ? completeYears[completeYears.length - 1] : undefined,
    },
  };
}

export async function buildHistoryRollups(
  supabase: SupabaseClient
): Promise<BuildRollupsResult> {
  const now = new Date();
  const computedAt = now.toISOString();
  const today = now.toISOString().slice(0, 10);
  let btcWritten = false;
  let spyWritten = false;
  let spxWritten = false;

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

  const [spxRows, spyRows] = await Promise.all([
    fetchAllDailySeries(supabase, "spx"),
    fetchAllDailySeries(supabase, "spy"),
  ]);

  const useSpx = spxRows.length >= MIN_EQUITY_ROWS;
  const equityRows = useSpx
    ? spxRows
    : spyRows.length >= 365
      ? spyRows
      : null;

  if (equityRows && equityRows.length >= 365) {
    const seriesKeyUsed = useSpx ? "spx" : "spy";
    const rollupKey = useSpx ? "spx_presidential_cycle_v1" : "spy_presidential_cycle_v1";
    const { data, meta } = buildEquityRollupFromRows(equityRows, seriesKeyUsed);
    await supabase.from("history_rollups").upsert(
      {
        key: rollupKey,
        computed_at: computedAt,
        as_of_date: today,
        data,
        meta,
      },
      { onConflict: "key" }
    );
    if (useSpx) spxWritten = true;
    else spyWritten = true;
  }

  return { lastComputedAt: computedAt, btcWritten, spyWritten, spxWritten };
}
