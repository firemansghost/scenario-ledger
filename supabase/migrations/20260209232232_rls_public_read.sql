-- Enable RLS (Row Level Security)
alter table public.forecasts enable row level security;
alter table public.weekly_snapshots enable row level security;
alter table public.indicator_weekly enable row level security;

alter table public.daily_series enable row level security;
alter table public.data_fetch_logs enable row level security;
alter table public.manual_overrides enable row level security;

-- Public read policies (anon can SELECT)
create policy "public read forecasts"
on public.forecasts for select
to anon
using (true);

create policy "public read weekly_snapshots"
on public.weekly_snapshots for select
to anon
using (true);

create policy "public read indicator_weekly"
on public.indicator_weekly for select
to anon
using (true);

-- No public policies for daily_series, data_fetch_logs, manual_overrides
-- (Without a SELECT policy, anon cannot read these tables.)
