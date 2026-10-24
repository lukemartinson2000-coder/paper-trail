-- Paper Trail cloud backup: one row per uploaded version of a user's books.
-- Run once in Supabase → SQL Editor. Safe to re-run.
create table if not exists public.book_versions (
  id          bigint generated always as identity primary key,
  user_id     uuid not null default auth.uid() references auth.users(id) on delete cascade,
  created_at  timestamptz not null default now(),
  device_id   text not null,
  app_version text,
  bytes       integer,
  tx_count    integer,
  hash        text not null,
  payload     text not null check (octet_length(payload) < 5000000)
);
create index if not exists book_versions_user_id_idx on public.book_versions (user_id, id desc);

alter table public.book_versions enable row level security;

-- Helper: true when the signed-in user has a verified second factor.
create or replace function public.pt_has_verified_factor() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from auth.mfa_factors f
                 where f.user_id = auth.uid() and f.status = 'verified');
$$;

-- Own rows only. If two-step sign-in is on, the session must have passed it (aal2).
drop policy if exists "own rows select" on public.book_versions;
create policy "own rows select" on public.book_versions for select to authenticated
  using (user_id = auth.uid()
         and ((auth.jwt()->>'aal') = 'aal2' or not public.pt_has_verified_factor()));
drop policy if exists "own rows insert" on public.book_versions;
create policy "own rows insert" on public.book_versions for insert to authenticated
  with check (user_id = auth.uid()
         and ((auth.jwt()->>'aal') = 'aal2' or not public.pt_has_verified_factor()));
drop policy if exists "own rows delete" on public.book_versions;
create policy "own rows delete" on public.book_versions for delete to authenticated
  using (user_id = auth.uid()
         and ((auth.jwt()->>'aal') = 'aal2' or not public.pt_has_verified_factor()));
-- No update policy: versions are append-only.

-- Keep only the newest 10 versions per user.
create or replace function public.pt_trim_versions() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  delete from public.book_versions
   where user_id = new.user_id
     and id not in (select id from public.book_versions
                     where user_id = new.user_id order by id desc limit 10);
  return null;
end $$;
drop trigger if exists pt_trim_versions on public.book_versions;
create trigger pt_trim_versions after insert on public.book_versions
  for each row execute function public.pt_trim_versions();

revoke all on public.book_versions from anon;
grant select, insert, delete on public.book_versions to authenticated;
