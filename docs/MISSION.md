# Mission

<!-- Add mission statement and project purpose here. -->
# ScenarioLedger — Mission

## What this is
ScenarioLedger is a **scenario tracker** for BTC + equities (SPY / SPX-equivalent).  
It’s designed to keep us honest about what we thought would happen, what actually happened, and whether our **evidence** still supports the scenario we’re riding.

**This is a scenario tracker, not a crystal ball.**

## Why it exists
Markets don’t just punish bad calls. They punish **narrative drift**:
- “We *meant* something else.”
- “That didn’t count.”
- “Actually our base case was always the bull case if you squint.”

ScenarioLedger exists to prevent that. It makes forecasts **auditable** and updates **explicit**.

## The core promise
1) **Forecasts are frozen.**  
   A forecast version (v1, v2…) is an immutable artifact once published.

2) **Reality is logged.**  
   Daily/weekly ingest writes what the data was at the time it ran (with source + run history).

3) **Scenario selection is mechanical.**  
   Each week, indicators produce states → weights → scenario scores → probabilities.

4) **Updates are new versions.**  
   If the model must change, it becomes **Forecast v2**—never a quiet edit to v1.

## What “success” looks like
- You can answer: “What did we say, when did we say it, and how did it perform?”
- You can share a clean view with friends that’s understandable without a Bloomberg terminal implant.
- You can click into “Nerd Mode” and see the receipts: indicators, calculations, ingest runs, data health.

## Non-goals (things we refuse to become)
- A “signals” product that pretends it can predict next week.
- A backtest machine that fits history until it looks smart.
- A chart gallery that’s long on vibes and short on accountability.
- Financial advice, trade calls, or “do X now” recommendations.

## Operating model
- **Daily**: ingest key series (BTC, SPY, VIX, USD proxy, real yields proxy, credit spreads proxy).  
- **Weekly**: compute indicator states and scenario probabilities for the last completed week (Friday close logic).
- **Review cadence**: weekly check + optional monthly/quarterly forecast versioning if the world materially changed.

## Share mode
Use `/?share=1` to show a clean “friends view”:
- Minimal, readable summary
- No admin / run logs
- No nerd knobs by default

## Advanced Details (Nerd Mode)
Nerd Mode exists because we should be proud of the receipts:
- indicator_weekly values + states
- run history, run summaries
- data freshness and ingest health

Nerd Mode is **opt-in**. If someone wants the engine room, we’ll show it.  
If they don’t, we won’t smack them with pipes and gauges.

## Disclaimer
This app provides **educational scenario analysis**, not investment advice.  
It tracks evidence and alignment; it does not predict the future, and it does not tell anyone what to buy or sell.


ScenarioLedger is a scenario tracker, not a crystal ball. It tracks evidence, computes scenario probabilities, and records alignment against immutable forecasts—for transparency and learning, not prediction.
