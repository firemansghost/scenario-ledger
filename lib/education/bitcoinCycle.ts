/**
 * Reference Bitcoin 4-year cycle dates (Bottom → Halving → Peak → Next Bottom).
 * Used for /learn/bitcoin-cycle. Small sample; definitions vary; structural change risk.
 */
export interface CycleRow {
  cycleLabel: string;
  bottom: string;
  halving: string;
  peak: string;
  nextBottom: string;
}

export const BITCOIN_CYCLE_REFERENCE: CycleRow[] = [
  { cycleLabel: "2012–2016", bottom: "2011-11", halving: "2012-11", peak: "2013-11", nextBottom: "2015-01" },
  { cycleLabel: "2016–2020", bottom: "2015-01", halving: "2016-07", peak: "2017-12", nextBottom: "2018-12" },
  { cycleLabel: "2020–2024", bottom: "2018-12", halving: "2020-05", peak: "2021-11", nextBottom: "2022-11" },
];

export const CYCLE_RULE_OF_THUMB = "Rough rule of thumb: bull ~3y, bear ~1y, halving→peak ~17–18 months. Small sample size; structural change risk; definitions vary.";
