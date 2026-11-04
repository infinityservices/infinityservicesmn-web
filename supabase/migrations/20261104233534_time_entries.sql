-- Time log for support plans and project work.
-- Support entries count against the client's monthly plan allowance.

create table public.time_entries (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  client_id uuid not null references public.clients (id) on delete cascade,
  project_id uuid references public.projects (id) on delete set null,
  work_date date not null default current_date,
  minutes integer not null check (minutes > 0 and minutes <= 1440),
  category text not null default 'support'
    check (category in ('support', 'project', 'hourly')),
  description text not null
);
create index time_entries_client_date_idx on public.time_entries (client_id, work_date desc);
create index time_entries_project_id_idx on public.time_entries (project_id);
create index time_entries_work_date_idx on public.time_entries (work_date);

alter table public.time_entries enable row level security;
create policy "admin full access" on public.time_entries
  for all to authenticated using (private.is_admin()) with check (private.is_admin());

grant select, insert, update, delete on public.time_entries to authenticated, service_role;
revoke all on public.time_entries from anon;
