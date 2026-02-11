-- History rollups: cached computed stats for /learn history pages (SPY presidential cycle, BTC cycle day counts).
-- Public read; service-role write only.

create table if not exists history_rollups (
  key text primary key,
  computed_at timestamptz not null default now(),
  as_of_date date not null,
  data jsonb not null,
  meta jsonb
);

comment on table history_rollups is 'Cached rollups for learn pages: spy_presidential_cycle_v1, btc_cycle_daycounts_v1';

alter table history_rollups enable row level security;

create policy "history_rollups_anon_read"
  on history_rollups for select
  to anon
  using (true);

-- Only service role can insert/update/delete (no policy for authenticated; use service key in scripts).
-- RLS allows anon read so /learn pages can load without auth.
