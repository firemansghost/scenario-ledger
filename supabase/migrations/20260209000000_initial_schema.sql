create extension if not exists pgcrypto;

create table if not exists forecasts (
  id uuid primary key default gen_random_uuid(),
  version int not null unique,
  name text not null,
  created_at timestamptz not null default now(),
  is_active boolean not null default false,
  notes text,
  config jsonb not null
);

create or replace function prevent_forecast_config_update()
returns trigger as $$
begin
  if new.config is distinct from old.config then
    raise exception 'forecasts.config is immutable; create a new forecast version instead';
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_prevent_forecast_config_update on forecasts;

create trigger trg_prevent_forecast_config_update
before update on forecasts
for each row execute function prevent_forecast_config_update();

create table if not exists daily_series (
  id uuid primary key default gen_random_uuid(),
  series_key text not null,
  source text not null,
  dt date not null,
  value numeric not null,
  created_at timestamptz not null default now(),
  unique(series_key, source, dt)
);

create index if not exists daily_series_key_dt_idx on daily_series(series_key, dt);

create table if not exists manual_overrides (
  id uuid primary key default gen_random_uuid(),
  series_key text not null,
  dt date not null,
  value numeric not null,
  reason text,
  created_at timestamptz not null default now(),
  unique(series_key, dt)
);

create index if not exists manual_overrides_key_dt_idx on manual_overrides(series_key, dt);

create table if not exists indicator_definitions (
  key text primary key,
  name text not null,
  description text,
  calc jsonb not null,
  thresholds jsonb not null,
  weights jsonb not null,
  enabled boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists indicator_weekly (
  id uuid primary key default gen_random_uuid(),
  week_ending date not null,
  indicator_key text not null references indicator_definitions(key) on delete cascade,
  value numeric,
  delta numeric,
  state text not null,
  details jsonb,
  created_at timestamptz not null default now(),
  unique(week_ending, indicator_key)
);

create index if not exists indicator_weekly_week_idx on indicator_weekly(week_ending);

create table if not exists weekly_snapshots (
  id uuid primary key default gen_random_uuid(),
  week_ending date not null unique,
  forecast_id uuid not null references forecasts(id) on delete restrict,
  btc_close numeric,
  spy_close numeric,
  spx_equiv numeric,
  spx_factor numeric,
  scenario_scores jsonb not null,
  scenario_probs jsonb not null,
  active_scenario text not null,
  confidence text not null,
  alignment jsonb not null,
  top_contributors jsonb not null,
  data_completeness numeric not null default 1.0,
  created_at timestamptz not null default now()
);

create table if not exists data_fetch_logs (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null default gen_random_uuid(),
  job text not null,
  source text not null,
  series_key text,
  status text not null,
  message text,
  meta jsonb,
  created_at timestamptz not null default now()
);

create index if not exists data_fetch_logs_created_idx on data_fetch_logs(created_at desc);
