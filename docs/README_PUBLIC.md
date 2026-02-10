# ScenarioLedger — Public Readme (for normal humans)

Welcome to **ScenarioLedger**.

It’s a **scenario tracker**, not a crystal ball.  
It does **not** predict the future. It keeps score.

If you want hype, go watch a YouTube thumbnail with laser eyes. This isn’t that.

---

## What this is

ScenarioLedger tracks **three possible paths** (Bull / Base / Bear) and checks **weekly evidence** against them.

It answers:
- “Which scenario is most aligned with the evidence right now?”
- “Are we staying inside the original forecast bands, or drifting outside?”
- “What evidence is pushing the model toward Bull/Base/Bear this week?”

---

## What this is NOT

- Not a “buy/sell” tool  
- Not investment advice  
- Not a magic model that knows the future  
- Not a machine that rewrites history to stay right

---

## How to use it (30 seconds)

1. Open the site.
2. Look at the **Active Scenario** (Bull/Base/Bear).
3. Check the **Probabilities** (these are evidence-weighted, not destiny).
4. Read the **Evidence summary** (short, human-readable).
5. If you care about “did we stay on the planned road?” go to **Alignment**.

That’s it.

---

## Share mode (recommended for friends)

Use:

`/?share=1`

Share mode is the “no nerd clutter” view:
- Keeps it friend-readable
- Hides admin/run pages
- Keeps advanced details off by default

---

## Advanced Details (Nerd Mode)

If you want receipts:
- Click **“Advanced Details (Nerd Mode)”** in normal view (not share mode)

Nerd Mode unlocks:
- deeper evidence tables (“receipts”)
- data health + run history
- admin tooling (if you have access)

This exists because transparency matters.
Also because some of us enjoy pain.

---

## What the probabilities mean

They’re a **scoreboard**, not a prophecy.

Example:  
If it shows **Base 55% / Bull 30% / Bear 15%**, it means:

> “Given this week’s evidence, Base fits best.”

Not:
> “Base will happen.”

Markets are allowed to do whatever they want.
They often do.

---

## What Alignment means

Alignment checks:  
- Did BTC and SPY (and the SPX-equivalent display) stay **inside** the forecast bands?

If a scenario says:
- “BTC should be between X and Y”  
- “SPX-equivalent should be between A and B”

…Alignment tells you if reality stayed in that lane or drifted out.

---

## Forecast versions (important)

Forecasts are **immutable**.

That means:
- v1 stays v1 forever.
- Updates ship as **v2, v3, …**
- The app keeps an audit trail so we can’t quietly retcon the past.

This is a feature. Not negotiable.

---

## Data sources (in plain English)

ScenarioLedger pulls data from a few public sources:
- BTC price (CoinGecko)
- SPY price (Stooq primary; other fallbacks if needed)
- Macro series like real yields, volatility, credit spreads (FRED)

If a source is delayed or closed (weekends/holidays), the app may label a series as **Stale**.

---

## Disclaimer

This is **educational scenario analysis**.  
It’s not investment advice.  
It’s a structured way to track evidence without narrative drift.

---

If you want to understand how the engine works:
- `docs/PRINCIPLES.md`
- `docs/SCORING_MODEL.md`
- `docs/DATA_SOURCES.md`
