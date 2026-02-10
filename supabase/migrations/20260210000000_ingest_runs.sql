-- ingest_runs: one row per daily or weekly ingest with status and summary
create table if not exists ingest_runs (
  id uuid primary key default gen_random_uuid(),
  job text not null check (job in ('daily', 'weekly')),
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  status text not null default 'running' check (status in ('running','success','failure','partial')),
  target_date date,
  week_ending date,
  summary jsonb not null default '{}'::jsonb
);

create index if not exists ingest_runs_job_started_at_idx
  on ingest_runs(job, started_at desc);

-- data_fetch_logs already has run_id; ensure index for lookups by run_id
create index if not exists data_fetch_logs_run_id_idx
  on data_fetch_logs(run_id);

-- Public read for run history UI (/runs, /runs/[id])
alter table public.ingest_runs enable row level security;

create policy "public read ingest_runs"
  on public.ingest_runs for select
  to anon
  using (true);
