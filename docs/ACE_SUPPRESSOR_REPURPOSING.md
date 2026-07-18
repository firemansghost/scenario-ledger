# Ace Suppressor repurposing plan

## Decision

Keep this repository and its current Vercel project as the preserved ScenarioLedger site. The site
shows a prominent on-hold notice and its scheduled ingestion jobs are disabled on the next
production deployment.

Create a separate GitHub repository and Vercel project for The Ace Suppressor. Reuse the existing
Supabase project, but put all new MLB objects in dedicated schemas. Do not delete or rename the
legacy ScenarioLedger tables during the first phase.

## Inventory snapshot (2026-07-18)

- Application: Next.js App Router, TypeScript, React, Tailwind CSS, Recharts, Supabase JS.
- Hosting: Vercel project `scenario-ledger`, connected to `firemansghost/scenario-ledger` main.
- Runtime: Node.js 24.x.
- Domains: `scenario-ledger.vercel.app` plus Vercel-generated aliases.
- Schedules: daily weekday ingestion and Friday weekly model run, both defined in `vercel.json`.
- Supabase: Postgres 17 in `us-east-1`, project ref `wgzdtqzkkbiqjqekmgoz`.
- Auth: no application users.
- Storage: no buckets or objects.
- Edge Functions: none.
- Database cron: `pg_cron` is not installed.
- Legacy data: nine public tables, approximately 15.5 MB total database size.
- Latest observed legacy update: 2026-07-18 UTC; latest weekly snapshot: 2026-07-17.

## Preserve

- The Git history, source code, docs, migrations, and current production domain.
- All existing Supabase tables and rows.
- Existing Vercel environment variables until the legacy site has been verified after the on-hold
  deployment.
- The four applied Supabase migration records.

## Immediate reversible changes

1. Add an on-hold notice to every ScenarioLedger page.
2. Remove the two Vercel schedules by deploying an empty `crons` configuration.
3. Remove the `next.config.mjs` `env` block so the service-role key is not configured as a bundle-time
   value. Server code continues to read it from Vercel's runtime environment.
4. Disable every legacy data-changing route through a single archive-mode guard.
5. Deploy through a pull request so rollback remains a normal Vercel redeploy or Git revert.

## Security follow-up before MLB work

The legacy `public.indicator_definitions` table has RLS disabled while `anon` and `authenticated`
have broad table grants. Before reusing the project, create and test a migration that:

1. Enables RLS on `public.indicator_definitions`.
2. Adds an explicit anonymous read policy if the legacy site still needs public reads.
3. Revokes INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, and TRIGGER from `anon` and
   `authenticated` on every legacy table.
4. Retains only the SELECT grants required by the legacy site.
5. Changes default privileges so future tables are private unless intentionally exposed.
6. Runs Supabase security and performance advisors and verifies the public site before deployment.

Do not apply this migration directly to production without a tested preview or a transaction-safe
rollback script.

The legacy forecast creation and activation endpoints previously had no authentication while using
the service-role client. Archive mode blocks them now. If ScenarioLedger is ever resumed, add
fail-closed server-side authorization to those handlers before re-enabling writes.

## Ace Suppressor database boundaries

- `ace_raw`: immutable or lightly normalized source payload metadata; private.
- `ace_core`: games, teams, pitchers, sportsbooks, markets, and normalized odds; private.
- `ace_features`: point-in-time starter, lineup, bullpen, park, and weather features; private.
- `ace_model`: model versions, runs, simulations, recommendations, outcomes, and backtests; private.
- `ace_api`: deliberately exposed read-only views or functions for the web app.

Keep `public` out of new MLB development. Expose only `ace_api`, use least-privilege grants, enable
RLS on exposed relations, and use security-invoker views.

## New application foundation

- New private GitHub repository: `firemansghost/ace-suppressor`.
- New Vercel project connected to that repository.
- Next.js App Router, TypeScript, Tailwind CSS, shadcn/ui, and Recharts.
- Server-only The Odds API and Supabase secret keys.
- Python ingestion, feature-engineering, simulation, and backtest jobs.
- Immutable model runs tied to model version, data timestamp, odds timestamp, and feature version.
- Start with the pick tracker, source health, and V1 Duel Filter before building polished predictions.

## Cutover sequence

1. Merge and deploy the ScenarioLedger on-hold change.
2. Verify the banner, existing read-only pages, and absence of active Vercel cron jobs.
3. Rotate legacy secrets after the bundle configuration is fixed; update Vercel with sensitive
   secret types and verify the legacy site again.
4. Apply the tested legacy RLS/grant hardening migration.
5. Create the new Ace Suppressor repository and Vercel project.
6. Add the new private schemas through versioned migrations; do not alter legacy rows.
7. Configure The Odds API and Supabase credentials only in the new Vercel project and job runner.
8. Run ingestion and models in paper mode before enabling recommendations or alerts.

## Rollback

- Code: revert the pull request or redeploy the previous Vercel production deployment.
- Schedules: restore the two entries in `vercel.json` and redeploy.
- Database: no data deletion or schema move occurs in the on-hold change.
- Ace Suppressor: new schemas and a separate app keep rollback independent from ScenarioLedger.
