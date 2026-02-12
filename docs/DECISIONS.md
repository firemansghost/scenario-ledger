# Decisions
# ScenarioLedger — Decisions Log

This file records the **why** behind major product, data, and architecture choices.
It exists so future-us doesn’t have to reverse engineer intent from commit messages and vibes.

**Format**
- **Decision**: what we chose
- **Status**: Accepted / Superseded / Deprecated
- **Date**: YYYY-MM-DD
- **Context**: what problem we were solving
- **Choice**: what we did
- **Rationale**: why we did it
- **Consequences**: what this enables / what it costs
- **Follow-ups**: any next steps

---

## 001 — Project name: ScenarioLedger
- **Status:** Accepted  
- **Date:** 2026-02-09  
- **Context:** Needed a name that fits the product’s job: track scenarios with receipts and versioning.  
- **Choice:** Project is named **ScenarioLedger**.  
- **Rationale:** “Ledger” implies audit trail, immutability, and accountability—exactly the point.  
- **Consequences:** All branding, repo, and UI references use ScenarioLedger.  
- **Follow-ups:** None.

---

## 002 — Standalone app (not embedded in Ghost Allocator)
- **Status:** Accepted  
- **Date:** 2026-02-09  
- **Context:** Avoid confusion with existing GhostRegime / Ghost Allocator site features and keep scope clean.  
- **Choice:** ScenarioLedger ships as a **standalone web app**.  
- **Rationale:** Reduces coupling, keeps mission pure, allows later linking without forced integration.  
- **Consequences:** Separate deployment, separate Supabase project, separate docs.  
- **Follow-ups:** Consider linking back to Ghost Allocator later if it provides value.

---

## 003 — Mission guardrail banner
- **Status:** Accepted  
- **Date:** 2026-02-10  
- **Context:** Public sharing requires clear expectations and anti-hype guardrails.  
- **Choice:** Display a small banner: **“This is a scenario tracker, not a crystal ball.”**  
- **Rationale:** Prevents users from treating probabilities as prophecy; reinforces educational framing.  
- **Consequences:** UI includes an always-visible, low-friction reminder (especially in share mode).  
- **Follow-ups:** Ensure banner appears in share mode.

---

## 004 — Forecast immutability + versioning
- **Status:** Accepted  
- **Date:** 2026-02-09  
- **Context:** Prevent “silent rewrites” and narrative drift; keep forecasts auditable.  
- **Choice:** Forecasts are **immutable** once created; changes require a **new version (v2, v3…)**.  
- **Rationale:** Auditability is the core product promise.  
- **Consequences:** DB schema includes versioned `forecasts`; weekly snapshots reference forecast version used.  
- **Follow-ups:** Provide forecast diff view (future enhancement).

---

## 025 — Forecasts stored in DB JSON, published via new versions
- **Status:** Accepted  
- **Date:** 2026-02-09  
- **Context:** No `forecasts.config` file on disk; forecast config lives in Supabase `forecasts.config` (jsonb).  
- **Choice:** Forecast config is JSON in the DB; we publish via `npm run forecast:publish` (reads seed JSON, inserts new row, deactivates prior active).  
- **Rationale:** Immutability + audit trail; version history is explicit; no file sync issues.  
- **Consequences:** Edits must be made to seed files; publishing requires running the script.  
- **Follow-ups:** None.

---

## 026 — Timeboxed periods (seasonal / quarterly / yearly)
- **Status:** Accepted  
- **Date:** 2026-02-09  
- **Context:** One giant "2026" band is vague; users want "when within the year."  
- **Choice:** Replace single long periods with **timeboxed periods** (Spring/Summer/Fall/Winter, or quarters, or explicit years).  
- **Rationale:** Readability; prevents vague year-wide bands; UI already supports derived labels (PR4).  
- **Consequences:** Forecast v2+ uses timeboxed periods; alignment uses index-based period lookup.  
- **Follow-ups:** None.

---

## 005 — Evidence-first approach (“checkbox evidence”)
- **Status:** Accepted  
- **Date:** 2026-02-09  
- **Context:** Narrative explanations drift; checklists don’t.  
- **Choice:** Weekly scenario selection is derived from **indicator states** mapped to **scenario weights**.  
- **Rationale:** Keeps decision process mechanical, debuggable, and repeatable.  
- **Consequences:** Indicators + thresholds must be well-defined; UI must show receipts.  
- **Follow-ups:** Keep indicator set lean; expand only when stable.

---

## 006 — Weekly anchor: “last completed week” ending Friday (America/Chicago)
- **Status:** Accepted  
- **Date:** 2026-02-09  
- **Context:** Week-ending logic must be consistent and not “float” depending on run time.  
- **Choice:** Weekly pipeline computes for the **most recent Friday on or before ‘now’** in **America/Chicago**.  
- **Rationale:** Consistent cadence; avoids partial-week artifacts; aligns with “completed week” framing.  
- **Consequences:** Weekly snapshots are keyed by `week_ending` Friday; backfills use the same rule.  
- **Follow-ups:** None.

---

## 007 — Show both “SPY actual” and “SPX equivalent (approx)”
- **Status:** Accepted  
- **Date:** 2026-02-09  
- **Context:** Friends understand SPX, but data plumbing and licensing risk favor SPY.  
- **Choice:** Track **SPY** as the ingest/truth series, and display **SPX-equivalent (approx)** using a factor.  
- **Rationale:** Best of both: robust ingest + friend-readable output.  
- **Consequences:** Alignment/scenario display uses SPX-equivalent for readability; DB stores `spx_equiv` + factor.  
- **Follow-ups:** Periodically validate the factor (future: compute from SPY/SPX when available).

---

## 008 — Data sources: free-first with fallback; reliability over perfection
- **Status:** Accepted  
- **Date:** 2026-02-09  
- **Context:** “Cheap/free but might break” is acceptable, but app must be resilient.  
- **Choice:**  
  - BTC: **CoinGecko**  
  - SPY: **Stooq** (primary) + **Alpha Vantage** (fallback when available)  
  - VIX/DXY proxies + macro series: **FRED** (use latest on/before date when needed)  
- **Rationale:** Simple, low-cost, stable enough; explicit logging when data is stale or delayed.  
- **Consequences:** Must implement data health, logging, and manual overrides; FRED timing quirks must be handled.  
- **Follow-ups:** Add additional paid adapters only if needed.

---

## 009 — Ingest orchestration: Vercel Cron with GET support on cron routes
- **Status:** Accepted  
- **Date:** 2026-02-10  
- **Context:** Manual ingests are fine for dev, but public app needs automation.  
- **Choice:** Use **Vercel Cron** calling `/api/cron/daily` and `/api/cron/weekly`.  
  - Routes support **GET** (Vercel cron) delegating to POST logic.  
- **Rationale:** Native to Vercel, low ops overhead, good enough reliability.  
- **Consequences:** Secrets must be set correctly; cron schedule is UTC and must be documented.  
- **Follow-ups:** Confirm cron schedules match Chicago post-market timing.

---

## 010 — Secrets model: CRON_SECRET + ADMIN_SECRET
- **Status:** Accepted  
- **Date:** 2026-02-09  
- **Context:** Public app cannot expose admin actions or allow random people to trigger ingests.  
- **Choice:**  
  - Cron routes require `Authorization: Bearer <CRON_SECRET>`  
  - Admin actions require `x-admin-secret: <ADMIN_SECRET>` when configured  
- **Rationale:** Simple, effective access control without full auth in v1.  
- **Consequences:** Admin UI requires secret entry; share mode must never expose secrets.  
- **Follow-ups:** Consider proper auth later if needed.

---

## 011 — “Receipts” = show `indicator_weekly` values (nerdy on purpose)
- **Status:** Accepted  
- **Date:** 2026-02-09  
- **Context:** Need transparent evidence without overwhelming casual viewers.  
- **Choice:** Store and display `indicator_weekly` values + state + details as receipts.  
- **Rationale:** Debuggable and defensible; prevents magical probability outputs.  
- **Consequences:** Requires indicator definitions and consistent calculation pipeline.  
- **Follow-ups:** Keep details structured, not free-form walls of text.

---

## 012 — “Advanced Details (Nerd Mode)” instead of hiding receipts
- **Status:** Accepted  
- **Date:** 2026-02-10  
- **Context:** We want to be proud of the mechanics, but not shove them at everyone.  
- **Choice:** Provide an **“Advanced Details (Nerd Mode)”** link/toggle (opt-in).  
- **Rationale:** Friend-readable by default; transparent for those who want to verify.  
- **Consequences:** UI needs a clear, non-scary entry point; share mode defaults to off.  
- **Follow-ups:** Ensure Nerd Mode works cleanly on mobile.

---

## 013 — Run history + ingest_runs table (one run = one unit of truth)
- **Status:** Accepted  
- **Date:** 2026-02-10  
- **Context:** Data fetch logs existed, but “what happened during that run?” was messy.  
- **Choice:** Add `ingest_runs` to record start/finish/status/summary per daily/weekly run and link logs via `run_id`.  
- **Rationale:** Auditable ops history; makes debugging and trust easier.  
- **Consequences:** New pages `/runs` and `/runs/[id]`; data health anchored to latest run.  
- **Follow-ups:** Add “retry run” (admin-only) later if needed.

---

## 014 — Share mode: `/?share=1`
- **Status:** Accepted  
- **Date:** 2026-02-10  
- **Context:** Public sharing needs a clean view that doesn’t expose admin or operational clutter.  
- **Choice:** `/?share=1` enables a simplified, friend-readable dashboard view.  
- **Rationale:** Lets Bobby share without explaining the engine room first.  
- **Consequences:** Share mode hides admin/run surfaces and defaults Nerd Mode off.  
- **Follow-ups:** Consider a dedicated `/share` route later if preferred.

---

## 015 — “Copy summary” feature for sharing
- **Status:** Accepted  
- **Date:** 2026-02-10  
- **Context:** People want a quick text summary to paste into a group chat.  
- **Choice:** Add a “Copy summary” button that outputs: week ending, scenario, probabilities, key evidence lines.  
- **Rationale:** Increases shareability; keeps messaging consistent with the app’s receipts.  
- **Consequences:** Must be careful about wording (educational, not advice).  
- **Follow-ups:** Add “Copy link with share=1” later.

---

## 016 — Public RLS read policies for non-sensitive tables
- **Status:** Accepted  
- **Date:** 2026-02-10  
- **Context:** Public viewing requires anon reads without forcing auth.  
- **Choice:** Enable anon/public read on:
  - `forecasts` (all versions; public sharing)
  - `weekly_snapshots`
  - `indicator_weekly`
  - `ingest_runs` (high-level run info)
  - `daily_series` (if needed for charts; otherwise keep limited)
- **Rationale:** Public app needs data access; admin actions stay protected by secrets.  
- **Consequences:** Must ensure no secrets are stored in readable rows; sanitize logs.  
- **Follow-ups:** Re-review RLS if adding user accounts/auth.

---

## 017 — Log hygiene: sanitize and truncate messages
- **Status:** Accepted  
- **Date:** 2026-02-10  
- **Context:** Logs can accidentally include tokens, giant payload errors, or noisy strings.  
- **Choice:** Sanitize log messages (collapse whitespace, redact bearer tokens, truncate length).  
- **Rationale:** Security + readability.  
- **Consequences:** Debugging still possible; deep debugging uses source reproduction not raw secrets.  
- **Follow-ups:** None.

---

## 018 — Caching strategy: revalidate 60s for public pages
- **Status:** Accepted  
- **Date:** 2026-02-10  
- **Context:** Public app needs decent performance without stale-for-days content.  
- **Choice:** Public pages use `revalidate = 60` instead of `force-dynamic`.  
- **Rationale:** Better performance and fewer DB hits; updates still appear quickly.  
- **Consequences:** Users may see up to ~60s delay on refresh.  
- **Follow-ups:** Tune revalidate later if needed.

---

## 019 — Indicators MVP: 6-pack with simple trend structure
- **Status:** Accepted  
- **Date:** 2026-02-09  
- **Context:** Too many indicators = brittle model and endless knob-twiddling.  
- **Choice:** Start with 6:
  - real yields direction
  - USD index proxy direction
  - credit spreads direction
  - VIX regime
  - BTC trend structure
  - SPY trend structure
- **Rationale:** Covers macro conditions + risk appetite + trend confirmation with minimal complexity.  
- **Consequences:** Model may miss some nuance; that’s fine—add carefully later.  
- **Follow-ups:** Consider adding a liquidity proxy in a later version once stable.

---

## 020 — Disclaimers: “educational speculation, not investment advice”
- **Status:** Accepted  
- **Date:** 2026-02-10  
- **Context:** Public sharing requires explicit framing.  
- **Choice:** Share mode includes a disclaimer: “Educational speculation. Not investment advice.”  
- **Rationale:** Clarity, safety, and expectation management.  
- **Consequences:** Avoids “you told me to…” problems.  
- **Follow-ups:** Keep language short and consistent.

---

## 021 — history_rollups cache for learn pages
- **Status:** Accepted  
- **Date:** 2026-02-11  
- **Context:** /learn/btc-cycle and /learn/equity-cycle need computed stats; computing on every request from raw daily_series is slow.  
- **Choice:** New table `history_rollups` (key, computed_at, as_of_date, data, meta). Script `npm run history:build` writes `btc_cycle_daycounts_v1` (from static ref) and `spy_presidential_cycle_v1` (from daily_series SPY). Pages read rollups; if missing, show “History pack not built yet.”  
- **Rationale:** Fast page loads; single source of truth for cycle stats.  
- **Consequences:** Admin must run backfill:spy-history then history:build for equity-cycle to show data.  
- **Follow-ups:** Optional: schedule history:build after backfills.

---

## 022 — SPY (price only) for equity-cycle stats
- **Status:** Accepted  
- **Date:** 2026-02-11  
- **Context:** Equity 4-year cycle explainer needs historical returns; we don’t have licensed SPX index data.  
- **Choice:** Use **SPY price history** (Stooq) for presidential-cycle stats. Label clearly: “SPY price return (no dividends).”  
- **Rationale:** Free, available; definitions (cycle year 1–4) are clear so we don’t get roasted.  
- **Consequences:** Returns are price-only, not total return.  
- **Follow-ups:** None.

---

## 023 — Neutral indicator weights = zero (no fake certainty)
- **Status:** Accepted  
- **Date:** 2026-02-11  
- **Context:** When all indicators were “neutral,” base scenario received +1 repeatedly and softmax produced ~99%+ base (fake certainty).  
- **Choice:** Neutral weights set to `{ bull: 0, base: 0, bear: 0 }` for all indicators. Priors + temperature in scoring keep low-signal weeks from looking overconfident.  
- **Rationale:** Neutral = no evidence for any scenario.  
- **Consequences:** Low-signal weeks show more balanced probabilities.  
- **Follow-ups:** Document in SCORING_MODEL.md.

---

## 024 — Alignment default: SPY-only; SPX-equivalent in Nerd Mode only
- **Status:** Accepted  
- **Date:** 2026-02-11  
- **Context:** Alignment page mixed “SPX band,” “SPX-equiv,” “SPY actual,” “factor” — confusing for non-nerds.  
- **Choice:** Default copy: “Alignment uses SPY price. Drift = % outside forecast band.” Show SPY close and BTC; SPX-equivalent and factor only in a Nerd Mode–only toggle (“Show SPX-equivalent (approx)”).  
- **Rationale:** Human-readable by default; power users still get the math.  
- **Consequences:** AlignmentNerdExtra component gates SPX block on client-side nerd cookie.  
- **Follow-ups:** None.

---

## Backlog Decisions (not decided yet)
These are real candidates, but not locked:
- Forecast diff viewer (v1 vs v2) and explicit change notes UI
- Auth (Supabase Auth) vs secret-only admin gating
- More robust paid data providers (if Stooq/CoinGecko become unreliable)
- More indicators (liquidity proxy, breadth, earnings revisions) once MVP stays stable


- **Snapshot by week_ending**: “Latest” snapshot is `max(week_ending)`, not latest `created_at`, so backfills don’t change what the dashboard shows.
- **Stooq no-rows = stale**: When Stooq returns no rows (e.g. market closed), we log a clear message and show “Stale” in Data Health, not a hard failure.
- **Nerd Mode via cookie**: So server-rendered /runs and /admin can gate without client JS; share mode overrides.
- **One run record per ingest**: `ingest_runs` row per daily/weekly run with status and summary; `data_fetch_logs` reference `run_id`.
- **Log message sanitization**: All messages written to `data_fetch_logs` are truncated and sanitized (no Bearer tokens, max length).
