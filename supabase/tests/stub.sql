-- Minimal stand-in for the pieces of Supabase the migrations rely on, so the
-- migrations and tests can run on plain Postgres (CI or a laptop without the
-- Supabase CLI). Not needed with `supabase start`.
create role anon nologin;
create role authenticated nologin;
create role service_role nologin bypassrls;
create schema auth;
grant usage on schema auth, public to anon, authenticated, service_role;
create function auth.jwt() returns jsonb language sql stable as $$
  select coalesce(nullif(current_setting('request.jwt.claims', true), ''), '{}')::jsonb
$$;
