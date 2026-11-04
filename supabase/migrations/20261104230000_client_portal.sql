-- Client portal: lets a client sign in (magic link) and see their own
-- projects, invoices and support plan, and nothing else.
--
-- Access is granted per email in public.portal_members, the same way
-- private.admin_users grants admin access. Clients never read the tables
-- directly: public.portal_overview() returns only client-safe columns for
-- the clients the signed-in email belongs to, so Jeremy's internal notes,
-- hosting notes, activity log and draft invoices stay private.

create table public.portal_members (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  client_id uuid not null references public.clients (id) on delete cascade,
  email text not null check (email = lower(btrim(email)) and email like '%_@_%'),
  invited_at timestamptz,
  unique (client_id, email)
);
create index portal_members_email_idx on public.portal_members (email);

alter table public.portal_members enable row level security;
create policy "admin full access" on public.portal_members
  for all to authenticated using (private.is_admin()) with check (private.is_admin());
grant select, insert, update, delete on public.portal_members to authenticated, service_role;
revoke all on public.portal_members from anon;

-- Client IDs the signed-in email has portal access to. The email comes from
-- the verified auth token (magic links prove ownership of the address).
create function private.portal_client_ids() returns setof uuid
language sql
stable
security definer
set search_path = ''
as $$
  select m.client_id from public.portal_members m
  where m.email = lower(coalesce(auth.jwt() ->> 'email', ''));
$$;
revoke execute on function private.portal_client_ids() from public, anon;
grant execute on function private.portal_client_ids() to authenticated;

-- Everything the portal shows, in one call. Returns empty lists when the
-- signed-in email has no portal access.
create function public.portal_overview() returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  with mine as (select private.portal_client_ids() as id)
  select jsonb_build_object(
    'clients', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', c.id, 'name', c.name, 'business', c.business, 'support_tier', c.support_tier
      ) order by c.name)
      from public.clients c where c.id in (select id from mine)
    ), '[]'::jsonb),
    'projects', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', p.id, 'client_id', p.client_id, 'title', p.title, 'kind', p.kind,
        'status', p.status, 'quoted_amount', p.quoted_amount,
        'start_date', p.start_date, 'due_date', p.due_date, 'updated_at', p.updated_at
      ) order by (p.status in ('done', 'cancelled')), p.due_date nulls last, p.created_at desc)
      from public.projects p where p.client_id in (select id from mine)
    ), '[]'::jsonb),
    'invoices', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', i.id, 'client_id', i.client_id, 'project_id', i.project_id,
        'invoice_number', i.invoice_number, 'title', i.title, 'amount', i.amount,
        'status', i.status, 'due_date', i.due_date, 'paid_at', i.paid_at,
        'public_url', i.public_url
      ) order by i.due_date desc nulls last, i.created_at desc)
      from public.invoices i
      where i.client_id in (select id from mine) and i.status <> 'draft'
    ), '[]'::jsonb),
    'subscriptions', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', s.id, 'client_id', s.client_id, 'plan_name', s.plan_name, 'amount', s.amount,
        'billing_interval', s.billing_interval, 'status', s.status,
        'current_period_end', s.current_period_end,
        'cancel_at_period_end', s.cancel_at_period_end
      ) order by s.created_at desc)
      from public.subscriptions s
      where s.client_id in (select id from mine)
        and s.status not in ('incomplete_expired')
    ), '[]'::jsonb)
  );
$$;
revoke execute on function public.portal_overview() from public, anon;
grant execute on function public.portal_overview() to authenticated;
