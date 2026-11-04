-- Admin tool schema: admin access rules, clients, projects, activity,
-- and billing mirrors (Square invoices, Stripe subscriptions).
-- Only emails listed in private.admin_users can read or write anything.

create schema if not exists private;
grant usage on schema private to authenticated;

create table private.admin_users (
  email text primary key,
  created_at timestamptz not null default now()
);
insert into private.admin_users (email) values ('jeremy@infinityservicesmn.com');

create function private.is_admin() returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from private.admin_users a
    where lower(a.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;
revoke execute on function private.is_admin() from public, anon;
grant execute on function private.is_admin() to authenticated;

-- Lets the admin app check, after sign-in, whether this login is an admin.
create function public.am_i_admin() returns boolean
language sql
stable
set search_path = ''
as $$ select private.is_admin(); $$;
revoke execute on function public.am_i_admin() from public, anon;
grant execute on function public.am_i_admin() to authenticated;

-- Clients ---------------------------------------------------------------

create table public.clients (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  name text not null,
  business text,
  email text,
  phone text,
  website text,
  hosting_notes text,
  support_tier text not null default 'none'
    check (support_tier in ('none', 'basic', 'standard', 'priority')),
  square_customer_id text unique,
  stripe_customer_id text unique,
  notes text
);
create index clients_email_idx on public.clients (lower(email));

alter table public.leads
  add constraint leads_client_id_fkey
  foreign key (client_id) references public.clients (id) on delete set null;

-- Projects --------------------------------------------------------------

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  client_id uuid not null references public.clients (id) on delete cascade,
  title text not null,
  kind text not null default 'small_task'
    check (kind in ('quick_fix', 'small_task', 'integration', 'custom_tool', 'hourly')),
  status text not null default 'quoted'
    check (status in ('quoted', 'active', 'waiting', 'done', 'cancelled')),
  quoted_amount numeric(10, 2),
  start_date date,
  due_date date,
  notes text
);
create index projects_client_id_idx on public.projects (client_id);
create index projects_status_idx on public.projects (status);

-- Activity timeline -----------------------------------------------------

create table public.activity (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  client_id uuid references public.clients (id) on delete cascade,
  lead_id uuid references public.leads (id) on delete cascade,
  project_id uuid references public.projects (id) on delete set null,
  kind text not null default 'note'
    check (kind in ('note', 'call', 'email', 'status_change')),
  body text not null
);
create index activity_client_id_idx on public.activity (client_id, created_at desc);
create index activity_lead_id_idx on public.activity (lead_id, created_at desc);

-- Billing mirrors (written only by webhooks) ----------------------------

create table public.invoices (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  square_invoice_id text not null unique,
  square_customer_id text,
  client_id uuid references public.clients (id) on delete set null,
  project_id uuid references public.projects (id) on delete set null,
  invoice_number text,
  title text,
  recipient_name text,
  recipient_email text,
  amount numeric(10, 2),
  status text not null,
  due_date date,
  paid_at timestamptz,
  public_url text
);
create index invoices_client_id_idx on public.invoices (client_id);
create index invoices_status_idx on public.invoices (status);

create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  stripe_subscription_id text not null unique,
  stripe_customer_id text not null,
  client_id uuid references public.clients (id) on delete set null,
  plan_name text,
  amount numeric(10, 2),
  billing_interval text,
  status text not null,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false
);
create index subscriptions_client_id_idx on public.subscriptions (client_id);

-- updated_at triggers ---------------------------------------------------

create trigger clients_set_updated_at before update on public.clients
  for each row execute function public.set_updated_at();
create trigger projects_set_updated_at before update on public.projects
  for each row execute function public.set_updated_at();
create trigger invoices_set_updated_at before update on public.invoices
  for each row execute function public.set_updated_at();
create trigger subscriptions_set_updated_at before update on public.subscriptions
  for each row execute function public.set_updated_at();

-- When a client gets a Square or Stripe customer ID, attach any billing
-- records that arrived before the link existed.
create function public.link_client_billing() returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.square_customer_id is not null then
    update public.invoices set client_id = new.id
    where square_customer_id = new.square_customer_id and client_id is null;
  end if;
  if new.stripe_customer_id is not null then
    update public.subscriptions set client_id = new.id
    where stripe_customer_id = new.stripe_customer_id and client_id is null;
  end if;
  return new;
end;
$$;
revoke execute on function public.link_client_billing() from public, anon, authenticated;

create trigger clients_link_billing
after insert or update of square_customer_id, stripe_customer_id on public.clients
for each row execute function public.link_client_billing();

-- Access: admin only ----------------------------------------------------

alter table public.clients enable row level security;
alter table public.projects enable row level security;
alter table public.activity enable row level security;
alter table public.invoices enable row level security;
alter table public.subscriptions enable row level security;

create policy "admin full access" on public.leads
  for all to authenticated using (private.is_admin()) with check (private.is_admin());
create policy "admin full access" on public.clients
  for all to authenticated using (private.is_admin()) with check (private.is_admin());
create policy "admin full access" on public.projects
  for all to authenticated using (private.is_admin()) with check (private.is_admin());
create policy "admin full access" on public.activity
  for all to authenticated using (private.is_admin()) with check (private.is_admin());
-- Billing rows come from Square and Stripe; the admin may only link them.
create policy "admin read" on public.invoices
  for select to authenticated using (private.is_admin());
create policy "admin link" on public.invoices
  for update to authenticated using (private.is_admin()) with check (private.is_admin());
create policy "admin read" on public.subscriptions
  for select to authenticated using (private.is_admin());
create policy "admin link" on public.subscriptions
  for update to authenticated using (private.is_admin()) with check (private.is_admin());

grant select, insert, update, delete on public.leads, public.clients, public.projects,
  public.activity to authenticated;
grant select, update (client_id, project_id) on public.invoices to authenticated;
grant select, update (client_id) on public.subscriptions to authenticated;
grant select, insert, update, delete on public.clients, public.projects, public.activity,
  public.invoices, public.subscriptions to service_role;
revoke all on public.clients, public.projects, public.activity, public.invoices,
  public.subscriptions from anon;
