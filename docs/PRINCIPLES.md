# Principles

<!-- Add guiding principles here. -->
# ScenarioLedger — Principles

These are the rules that keep ScenarioLedger from turning into another “trust me bro” dashboard.

## 1) No narrative drift
If reality disagrees with us, we don’t “reinterpret” the forecast.  
We either:
- accept the miss, or
- publish a new version with explicit changes.

## 2) Freeze the artifact
Forecast versions are immutable once published:
- v1 remains v1 forever
- edits require v2

If someone asks “what changed,” we show a diff, not a story.

## 3) Receipts over vibes
Every weekly scenario outcome must be explainable via:
- indicator values
- indicator states
- weights
- scoring → probabilities
- top contributors

If we can’t explain it in plain English, the model is too cute and needs simplification.

## 4) Mechanical scoring, human judgment only at version boundaries
Weekly scenario updates are mechanical.  
Human discretion is allowed only when creating a **new forecast version** (model changes), not in the weekly scoring.

Translation: no “manual steering” because feelings.

## 5) Data can break; the app must admit it
Data sources fail. Markets close. FRED lags. APIs rate-limit.

So the app must:
- log failures per run
- display data health (OK / Stale / Degraded)
- allow manual overrides with clear labeling
- avoid pretending “no data” = “no risk”

## 6) Friend-readable first, nerd-readable always
Default UX must be understandable by a normal human:
- what scenario
- what probabilities
- what evidence changed this week
- whether price is inside or outside bands

But Nerd Mode must always exist for transparency:
- calculations
- raw values
- run logs

## 7) Don’t confuse precision with accuracy
We can show numbers without pretending they’re sacred:
- probabilities are not prophecy
- bands are not guarantees
- indicator thresholds are not laws of physics

We prefer “clear and honest” over “complex and fragile.”

## 8) Versioning is a feature, not an embarrassment
Publishing v2 is not “admitting defeat.”  
It’s documenting that the world changed—or that our model was wrong.

ScenarioLedger treats versioning like change-control:
- documented
- attributable
- reviewable

## 9) Alignment is measured against the forecast, not our ego
Alignment answers one question:
- Did reality stay within the forecast bands?

It does not answer:
- “Were we geniuses?”
- “Did we nail the exact top?”

If price blows through a band, we record drift. We don’t cope.

## 10) Keep it lightweight and durable
We prefer:
- few indicators that matter
- clear thresholds
- stable data sources
- simple scoring

Over:
- huge feature sets
- brittle signals
- complex dependencies
- endless knobs

## 11) No trade instructions
The app is not allowed to say:
- “buy/sell now”
- “enter here, exit here”
- “this guarantees X”

It may say:
- “evidence supports base/bull/bear”
- “alignment drifted outside band”
- “data health is degraded”
- “forecast version updated”

## 12) Public sharing should never leak internals by accident
Share mode must:
- hide admin/run surfaces
- hide secrets
- hide operational details
- present a clean summary

Nerd Mode is opt-in—and disabled in share mode by default.

---

If a new feature violates these principles, it doesn’t ship.


- **Immutability**: Forecasts are versioned; updates ship as new versions, not edits.
- **Transparency**: Evidence and run history are visible to those who opt in (Nerd Mode).
- **Friend-readable first**: Default and share views stay clean; advanced details are opt-in.
