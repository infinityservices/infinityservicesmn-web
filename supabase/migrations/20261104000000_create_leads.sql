-- Leads inbox: one row per contact form or project wizard submission.
-- Written by api/contact.ts with the service role key; read by the /admin area.

create table public.leads (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  kind text not null check (kind in ('quick', 'project', 'beta')),
  name text not null,
  email text not null,
  message text not null,
  status text not null default 'new'
    check (status in ('new', 'contacted', 'won', 'lost', 'spam')),
  notes text,
  -- Set when a lead is converted; the clients table arrives in step 2.
  client_id uuid
);

create index leads_status_created_at_idx on public.leads (status, created_at desc);

create function public.set_updated_at() returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger leads_set_updated_at
before update on public.leads
for each row execute function public.set_updated_at();

-- Row-level security on, with no policies yet: anonymous and signed-in users
-- see nothing. The service role (used only server-side) bypasses RLS.
-- The admin-only read/write policy is added with the /admin login in the next step.
alter table public.leads enable row level security;

-- The project does not auto-expose new tables to the Data API, so grant access
-- explicitly. Only the server-side service role can touch leads for now; the
-- signed-in admin role is granted alongside its RLS policy in the next step.
grant select, insert, update, delete on public.leads to service_role;
