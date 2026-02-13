/**
 * Helpers for alignment display and pending state.
 * No DB changes. Uses snapshot data already fetched.
 */

type AlignRow = {
  btc?: { inBand: boolean; driftPct?: number };
  spy?: { inBand: boolean; driftPct?: number };
};

/** True if the cell has computed drift (inBand or driftPct defined). */
function hasComputedDrift(
  cell: { inBand?: boolean; driftPct?: number } | undefined
): boolean {
  if (!cell) return false;
  if (cell.inBand) return true;
  return cell.driftPct != null;
}

/**
 * Returns the most recent snapshot.week_ending where alignment has computed drift
 * for both btc and spy (or at least spy).
 */
export function findLastComputedAlignmentWeek(
  snapshots: { week_ending: string; alignment?: unknown }[] | null | undefined
): string | null {
  if (!snapshots?.length) return null;
  for (const s of snapshots) {
    const align = (s.alignment as Record<string, AlignRow | undefined> | undefined)?.["base"];
    if (!align) continue;
    const btcOk = hasComputedDrift(align.btc);
    const spyOk = hasComputedDrift(align.spy);
    if (spyOk && btcOk) return String(s.week_ending);
    if (spyOk) return String(s.week_ending);
  }
  return null;
}
