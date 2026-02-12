/** Forecast config (JSON) stored in forecasts.config */
export interface ForecastMeta {
  name?: string;
  asOf?: string;
  timeZone?: string;
  displayPreference?: "SPX";
  equityInstrument?: string;
  spxToSpyFactor?: number;
  spxEqFormula?: string;
  spyApproxFormula?: string;
  equityProxyNote?: string;
}

export interface PeriodBand {
  label?: string;
  start: string;
  end: string;
  btcRangeUsd: { low: number; high: number };
  spxRange: { low: number; high: number };
  /** Optional: computed at snapshot time from spxRange * spx_factor when not in config */
  spyRangeApprox?: { low: number; high: number };
  notes?: string[];
}

export interface ScenarioConfig {
  label: string;
  drivers: string[];
  periods: PeriodBand[];
  checkpoints: string[];
  invalidations: string[];
}

export interface ScoringConfig {
  priors?: Partial<Record<ScenarioKey, number>>;
  temperature?: number;
}

export interface ForecastConfig {
  meta: ForecastMeta;
  timeline2026?: unknown[];
  /** Phases with label + bullets (e.g. 2026, 2027, 2028+). Rendered as "Timeline {label}" sections. */
  timeline?: { label: string; bullets: string[] }[];
  /** Alias for timeline; same structure. */
  timeline_by_year?: { label: string; bullets: string[] }[];
  rangeInterpretation?: unknown;
  scenarios: {
    base: ScenarioConfig;
    bull: ScenarioConfig;
    bear: ScenarioConfig;
  };
  scoring?: ScoringConfig;
  athMeta?: unknown;
  athWindows?: unknown[];
}

export type ScenarioKey = "bull" | "base" | "bear";
export type IndicatorState = "bullish" | "neutral" | "bearish";

/** DB: forecasts */
export interface Forecast {
  id: string;
  version: number;
  name: string;
  created_at: string;
  is_active: boolean;
  notes: string | null;
  config: ForecastConfig;
}

/** DB: weekly_snapshots */
export interface WeeklySnapshot {
  id: string;
  week_ending: string;
  forecast_id: string;
  btc_close: number | null;
  spy_close: number | null;
  spx_equiv: number | null;
  spx_factor: number | null;
  scenario_scores: Record<ScenarioKey, number>;
  scenario_probs: Record<ScenarioKey, number>;
  active_scenario: ScenarioKey;
  confidence: "high" | "medium" | "low";
  alignment: AlignmentResult;
  top_contributors: TopContributor[];
  data_completeness: number;
  created_at: string;
}

export interface TopContributor {
  indicator_key: string;
  contribution: number;
}

/** Per-scenario alignment for one week */
export interface ScenarioAlignment {
  btc: { inBand: boolean; conservative: boolean; mid: boolean; stretch: boolean; driftPct?: number };
  spy: { inBand: boolean; conservative: boolean; mid: boolean; stretch: boolean; driftPct?: number };
  periodLabel?: string;
  spxRange?: { low: number; high: number };
  spyRangeApprox?: { low: number; high: number };
}

export type AlignmentResult = Record<ScenarioKey, ScenarioAlignment>;

/** DB: daily_series */
export interface DailySeriesRow {
  id: string;
  series_key: string;
  source: string;
  dt: string;
  value: number;
  created_at: string;
}

/** DB: manual_overrides */
export interface ManualOverride {
  id: string;
  series_key: string;
  dt: string;
  value: number;
  reason: string | null;
  created_at: string;
}

/** DB: indicator_definitions */
export interface IndicatorDefinition {
  key: string;
  name: string;
  description: string | null;
  calc: unknown;
  thresholds: unknown;
  weights: Record<IndicatorState, Partial<Record<ScenarioKey, number>>>;
  enabled: boolean;
  created_at: string;
}

/** DB: indicator_weekly */
export interface IndicatorWeeklyRow {
  id: string;
  week_ending: string;
  indicator_key: string;
  value: number | null;
  delta: number | null;
  state: IndicatorState;
  details: unknown;
  created_at: string;
}

/** DB: data_fetch_logs */
export interface DataFetchLog {
  id: string;
  run_id: string;
  job: string;
  source: string;
  series_key: string | null;
  status: string;
  message: string | null;
  meta: unknown;
  created_at: string;
}

/** Fetcher output: one data point */
export interface DailyDataPoint {
  series_key: string;
  source: string;
  dt: string;
  value: number;
}
