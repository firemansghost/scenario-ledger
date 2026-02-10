# Scoring Model

- **Indicators**: Six weekly indicators (e.g. SPY trend, BTC structure, real yields, credit spreads, volatility regime, USD proxy). Each produces a state (e.g. bullish / neutral / bearish).
- **Weights**: Each indicator has weights per state toward bull/base/bear scenarios (stored in `indicator_definitions.weights`).
- **Scoring**: Sum weighted contributions from indicator states; apply softmax to get scenario probabilities.
- **Active scenario**: The scenario with highest probability. Confidence and top contributors are derived from the same scoring run.
- **Data completeness**: Fraction of indicators with non-null values; affects scoring and is shown in the UI.

Details live in `lib/scoring.ts`, `lib/indicators/`, and `lib/weeklyPipeline.ts`.
