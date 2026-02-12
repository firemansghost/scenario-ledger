# Checks

Before release or after schema changes:

- [ ] All migrations applied in order.
- [ ] Dashboard shows "Current read" / "Forecast version used" and immutability note when snapshot exists.
- [ ] Dashboard "Current read" shows pinned vX with date and "Next band" reflects first timebox period.
- [ ] /predictions shows "Pinned: vX · date" and "Next timeboxes" (multiple entries).
- [ ] ForecastAtAGlance shows seasonal labels or derived labels (Spring/Summer/Fall/Winter, or period labels).
- [ ] ScenarioComparisonGrid shows multiple periods.
- [ ] Share mode (`/?share=1`): banner, How to read expanded, no Runs/Admin; Nerd link shows disabled message when clicked.
- [ ] Nerd Mode: enabling from Dashboard reveals Runs/Admin, Data Health, Receipts; persists across reloads (cookie).
- [ ] Direct visit to /runs or /admin without Nerd Mode shows gate page; with `?share=1` shows "Not available in share view."
- [ ] Run history and run detail pages load when Nerd Mode is enabled and not in share mode.
- [ ] History backfill done: SPY rows in `daily_series` (series_key=spy, source=stooq) >= ~8,000 (or run `npm run backfill:spy-history`).
- [ ] History rollups built: `npm run history:build` creates `btc_cycle_daycounts_v1` and `spy_presidential_cycle_v1` in `history_rollups`; /learn/btc-cycle and /learn/equity-cycle load without "not built yet."
- [ ] /learn, /learn/btc-cycle, /learn/equity-cycle, /learn/scoring load in normal and share mode.
- [ ] Neutral week (all indicators neutral) shows non-extreme probabilities (not ~100% base).
