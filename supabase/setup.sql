-- Run once in a prepared Supabase project's SQL editor.
-- This uses separate NPQH table/bucket names and does not modify a QTS app.
begin;
create table if not exists public.npqh_workspaces (
  user_id uuid primary key references auth.users(id) on delete cascade,
  data jsonb not null check (jsonb_typeof(data) = 'object' and (data->>'schema' = '1') is true),
  revision bigint not null default 1 check (revision > 0),
  updated_at timestamptz not null default now()
);
alter table public.npqh_workspaces enable row level security;
revoke all on public.npqh_workspaces from public;
revoke all on public.npqh_workspaces from anon;
revoke all on public.npqh_workspaces from authenticated;
grant select, insert, update, delete on public.npqh_workspaces to authenticated;
create policy "npqh_select_own" on public.npqh_workspaces for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "npqh_insert_own" on public.npqh_workspaces for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy "npqh_update_own" on public.npqh_workspaces for update to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "npqh_delete_own" on public.npqh_workspaces for delete to authenticated
  using ((select auth.uid()) = user_id);

insert into storage.buckets (id, name, public, file_size_limit)
values ('npqh-evidence', 'npqh-evidence', false, 26214400)
on conflict (id) do update set public = false, file_size_limit = 26214400;
create policy "npqh_files_select_own" on storage.objects for select to authenticated
  using (bucket_id = 'npqh-evidence' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "npqh_files_insert_own" on storage.objects for insert to authenticated
  with check (bucket_id = 'npqh-evidence' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "npqh_files_delete_own" on storage.objects for delete to authenticated
  using (bucket_id = 'npqh-evidence' and (storage.foldername(name))[1] = (select auth.uid())::text);
commit;

-- Policy audit: there should be exactly four NPQH table policies and three NPQH
-- storage policies. Inspect any other storage policies before using this project.
select schemaname, tablename, policyname, roles, cmd, qual, with_check
from pg_policies
where (schemaname = 'public' and tablename = 'npqh_workspaces')
   or (schemaname = 'storage' and tablename = 'objects');
