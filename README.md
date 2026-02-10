# ScenarioLedger

Frozen forecasts. Weekly receipts.

Next.js 14 app for storing immutable forecast versions, ingesting daily market/macro data, computing weekly scenario probabilities, and tracking alignment vs forecast bands (BTC + SPY/SPX).

## Setup

1. Copy `.env.example` to `.env` and set:
   - `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
   - `FRED_API_KEY` (recommended for real yields + credit spreads)
   - `CRON_SECRET` (for securing cron routes)
   - Optional: `ALPHAVANTAGE_API_KEY`

2. Apply the database schema in Supabase (SQL Editor or CLI):
   - Run `supabase/migrations/20260209000000_initial_schema.sql`

3. Seed forecast v1 and indicator definitions:
   - `npm run seed`

4. Run the app:
   - `npm run dev`

## Cron (Vercel or external)

- **Daily**: `GET` or `POST /api/cron/daily` with header `Authorization: Bearer <CRON_SECRET>` (or `x-cron-secret`). Fetches BTC, SPY, VIX, DXY, FRED series and upserts into `daily_series`.
- **Weekly**: `GET` or `POST /api/cron/weekly` with same auth. Computes most recent Friday week-ending, 6 indicators, scoring, alignment, and writes `weekly_snapshots` + `indicator_weekly`.

**Vercel Cron**: `vercel.json` defines schedules (UTC). Daily runs at 23:20 Mon–Fri; weekly at 23:35 Friday. Set `CRON_SECRET` in Vercel Project → Settings → Environment Variables; Vercel sends `Authorization: Bearer <CRON_SECRET>` to cron routes.

## Scripts

- `npm run seed` – Insert/update forecast v1 and indicator definitions (merge ATH windows into config).
- `npm run backfill:daily` – Backfill `daily_series` (SPY 60 days, BTC 60 days, FRED 90 days). Run once after deploy so weekly has data; then run `tsx scripts/backfill-weekly.ts` or trigger weekly ingest to populate snapshots.
- `npm run test` – Unit tests (getSpxEquiv, softmax, dates, alignment).
- `tsx scripts/backfill-weekly.ts [start_week_ending] [end_week_ending]` – Optional backfill of weekly snapshots for past weeks.

## SPX display

- All SPX-equivalent values use the single helper `getSpxEquiv(spy, factor)` from `lib/spxEquiv.ts`. Factor is stored in forecast `config.meta.spxToSpyFactor` (default 0.10). Alignment uses SPY vs `spyRangeApprox`; UI shows SPX bands and SPX-equiv for readability.
