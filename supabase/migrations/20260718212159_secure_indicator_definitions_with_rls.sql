-- Protect the definition catalog while preserving the archived site's public reads.
alter table public.indicator_definitions enable row level security;

create policy "public read indicator_definitions"
on public.indicator_definitions for select
to anon
using (true);
