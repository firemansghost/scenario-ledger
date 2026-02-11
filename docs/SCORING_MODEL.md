# Scoring Model

- **Indicators**: Six weekly indicators (e.g. SPY trend, BTC structure, real yields, credit spreads, volatility regime, USD proxy). Each produces a state (e.g. bullish / neutral / bearish).
- **Weights**: Each indicator has weights per state toward bull/base/bear scenarios (stored in `indicator_definitions.weights`). **Neutral** is explicitly given **zero** weight toward all scenarios (`{ bull: 0, base: 0, bear: 0 }`) so that low-signal (all-neutral) weeks do not produce fake certainty (e.g. ~99% base).
- **Priors + temperature**: Forecast config may include `scoring.priors` (e.g. bull 0.2, base 0.6, bear 0.2) and `scoring.temperature` (e.g. 1.4). Scores are initialized with log(prior); evidence is added; final probabilities use softmax with temperature. Higher temperature = softer probabilities.
- **Scoring**: Sum weighted contributions from indicator states plus prior (log); apply softmax with temperature to get scenario probabilities.
- **Active scenario**: The scenario with highest probability. Confidence and top contributors are derived from the same scoring run.
- **Data completeness**: Fraction of indicators with non-null values; affects scoring and is shown in the UI.

Details live in `lib/scoring.ts`, `lib/softmax.ts`, `lib/indicators/`, and `lib/weeklyPipeline.ts`. See also `docs/DECISIONS.md` (023 — neutral weights).
