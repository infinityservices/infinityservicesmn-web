-- Checks that the client portal only shows a client their own, client-safe data.
-- Run against a database with all migrations applied (e.g. `supabase db reset`
-- locally, or a scratch Postgres with the stub in supabase/tests/stub.sql), then:
--   psql -v ON_ERROR_STOP=1 -f supabase/tests/portal_access.sql
-- Everything runs in a transaction that is rolled back.

begin;

insert into public.clients (id, name, business, notes, hosting_notes) values
  ('00000000-0000-0000-0000-00000000000a', 'Alice', 'Acme', 'SECRET NOTE', 'SECRET HOSTING'),
  ('00000000-0000-0000-0000-00000000000b', 'Bob', 'Bobco', null, null);
insert into public.projects (client_id, title, notes) values
  ('00000000-0000-0000-0000-00000000000a', 'Acme site', 'SECRET PROJECT NOTE'),
  ('00000000-0000-0000-0000-00000000000b', 'Bob tool', null);
insert into public.invoices (square_invoice_id, client_id, status, amount) values
  ('sq_1', '00000000-0000-0000-0000-00000000000a', 'unpaid', 100),
  ('sq_2', '00000000-0000-0000-0000-00000000000a', 'draft', 50),
  ('sq_3', '00000000-0000-0000-0000-00000000000b', 'paid', 75);
insert into public.subscriptions (stripe_subscription_id, stripe_customer_id, client_id, status, plan_name) values
  ('sub_1', 'cus_1', '00000000-0000-0000-0000-00000000000a', 'active', 'Standard support'),
  ('sub_2', 'cus_2', '00000000-0000-0000-0000-00000000000b', 'active', 'Basic support');
insert into public.portal_members (client_id, email) values
  ('00000000-0000-0000-0000-00000000000a', 'alice@example.com');
insert into public.activity (client_id, body) values
  ('00000000-0000-0000-0000-00000000000a', 'SECRET ACTIVITY');

do $$ begin
  assert not has_function_privilege('anon', 'public.portal_overview()', 'execute'),
    'anon must not call portal_overview';
end $$;

set local role authenticated;

-- Alice (email case differs from the stored one) sees only Acme.
select set_config('request.jwt.claims', '{"email":"Alice@Example.com"}', true);
do $$
declare o jsonb := public.portal_overview();
begin
  assert jsonb_array_length(o -> 'clients') = 1, 'alice sees one client';
  assert o -> 'clients' -> 0 ->> 'business' = 'Acme', 'alice sees Acme';
  assert jsonb_array_length(o -> 'projects') = 1, 'alice sees one project';
  assert jsonb_array_length(o -> 'invoices') = 1, 'draft invoice hidden';
  assert o -> 'invoices' -> 0 ->> 'status' = 'unpaid', 'alice sees her unpaid invoice';
  assert jsonb_array_length(o -> 'subscriptions') = 1, 'alice sees her plan';
  assert position('SECRET' in o::text) = 0, 'no internal notes leak';
  assert (select count(*) from public.clients) = 0, 'no direct table access';
  assert (select count(*) from public.activity) = 0, 'no activity access';
  assert (select count(*) from public.portal_members) = 0, 'no member list access';
end $$;

-- A signed-in stranger sees nothing.
select set_config('request.jwt.claims', '{"email":"stranger@example.com"}', true);
do $$
declare o jsonb := public.portal_overview();
begin
  assert o = '{"clients":[],"projects":[],"invoices":[],"subscriptions":[]}'::jsonb,
    'stranger sees nothing';
end $$;

-- A portal client cannot grant themselves access to another client.
do $$ begin
  begin
    insert into public.portal_members (client_id, email)
      values ('00000000-0000-0000-0000-00000000000b', 'stranger@example.com');
    assert false, 'insert should have been refused';
  exception when insufficient_privilege then null;
  end;
end $$;

-- The admin still sees everything.
select set_config('request.jwt.claims', '{"email":"jeremy@infinityservicesmn.com"}', true);
do $$ begin
  assert (select count(*) from public.portal_members) = 1, 'admin sees members';
  assert (select count(*) from public.clients) = 2, 'admin sees clients';
end $$;

select 'portal access checks passed' as result;
rollback;
