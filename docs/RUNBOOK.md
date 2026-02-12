# Runbook

## Deploy / first run

1. Apply all migrations in `supabase/migrations/` (order by filename).
2. Set env vars (see `.env.example` and README).
3. `npm run seed` to create forecast v1 and indicator definitions.
4. Run `npm run backfill:daily` once so weekly pipeline has data; then trigger weekly ingest (cron or Admin “Run weekly”) to populate snapshots.

## Cron

- **Daily** (e.g. 23:20 UTC Mon–Fri): `GET/POST /api/cron/daily` with `Authorization: Bearer <CRON_SECRET>`.
- **Weekly** (e.g. 23:35 UTC Friday): `GET/POST /api/cron/weekly` with same header.

## Publishing a new forecast

1. Edit `seeds/forecast_v2.json` (or create a new seed file).
2. Run `npm run forecast:publish` (default: `seeds/forecast_v2.json`) or `npm run forecast:publish path/to/forecast.json`.
3. Verify `/predictions` shows vX + timeboxes and Dashboard “Current read” shows the new pinned version.

## Scripts

- `npm run seed` – Forecast v1 + indicator definitions.
- `npm run forecast:publish` – Publish a forecast from JSON (e.g. `seeds/forecast_v2.json`) to Supabase.
- `npm run backfill:daily` – Backfill daily_series (SPY, BTC, FRED).
- `tsx scripts/backfill-weekly.ts [start] [end]` – Backfill weekly snapshots.
- `npx tsx scripts/run-daily-ingest.ts` – One-off daily ingest (writes to `ingest_runs` + `data_fetch_logs`).

## Admin / Nerd Mode

- Admin and Runs are gated: enable “Advanced Details (Nerd Mode)” from the Dashboard (or nav). Sets cookie `scenarioledger_nerd=1`.
- Share mode (`?share=1`) hides advanced pages and disables Nerd Mode in that view.
