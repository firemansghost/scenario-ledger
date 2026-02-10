# Runbook

## Deploy / first run

1. Apply all migrations in `supabase/migrations/` (order by filename).
2. Set env vars (see `.env.example` and README).
3. `npm run seed` to create forecast v1 and indicator definitions.
4. Run `npm run backfill:daily` once so weekly pipeline has data; then trigger weekly ingest (cron or Admin “Run weekly”) to populate snapshots.

## Cron

- **Daily** (e.g. 23:20 UTC Mon–Fri): `GET/POST /api/cron/daily` with `Authorization: Bearer <CRON_SECRET>`.
- **Weekly** (e.g. 23:35 UTC Friday): `GET/POST /api/cron/weekly` with same header.

## Scripts

- `npm run seed` – Forecast v1 + indicator definitions.
- `npm run backfill:daily` – Backfill daily_series (SPY, BTC, FRED).
- `tsx scripts/backfill-weekly.ts [start] [end]` – Backfill weekly snapshots.
- `npx tsx scripts/run-daily-ingest.ts` – One-off daily ingest (writes to `ingest_runs` + `data_fetch_logs`).

## Admin / Nerd Mode

- Admin and Runs are gated: enable “Advanced Details (Nerd Mode)” from the Dashboard (or nav). Sets cookie `scenarioledger_nerd=1`.
- Share mode (`?share=1`) hides advanced pages and disables Nerd Mode in that view.
