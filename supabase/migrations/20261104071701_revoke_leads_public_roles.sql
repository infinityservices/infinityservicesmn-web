-- Applied live right after create_leads. Kept so this folder matches the
-- project's migration history (versions must match for `supabase db push`).
revoke all on public.leads from anon, authenticated;
