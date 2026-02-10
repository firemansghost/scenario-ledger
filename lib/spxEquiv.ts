/**
 * Single canonical helper for SPX-equivalent from SPY close.
 * Use this everywhere; do not duplicate spy/factor logic.
 */
export function getSpxEquiv(spy: number, factor = 0.1): number {
  if (factor === 0) return 0;
  return spy / factor;
}
