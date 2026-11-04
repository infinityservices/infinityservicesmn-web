-- Cover foreign keys flagged by the Supabase performance advisor.
create index activity_project_id_idx on public.activity (project_id);
create index invoices_project_id_idx on public.invoices (project_id);
create index leads_client_id_idx on public.leads (client_id);
