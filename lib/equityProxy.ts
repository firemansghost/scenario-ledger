/**
 * Equity proxy helpers: compute SPY/SPX factor from actual closes,
 * derive SPY-approx bands from SPX bands.
 * Used for alignment so we don't rely on hardcoded factors.
 */

export const DEFAULT_SPX_FACTOR = 0.1;

export function computeSpxFactor(spyClose: number, spxClose: number): number | null {
  if (!Number.isFinite(spyClose) || !Number.isFinite(spxClose)) return null;
  if (spxClose <= 0) return null;
  return spyClose / spxClose;
}

export function approxSpyBandFromSpxBand(
  spxRange: { low: number; high: number },
  factor: number
): { low: number; high: number } {
  return {
    low: Math.round(spxRange.low * factor * 100) / 100,
    high: Math.round(spxRange.high * factor * 100) / 100,
  };
}
