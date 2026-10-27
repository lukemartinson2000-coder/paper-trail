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

-- Own rows only. (v37.5.64: the old TOTP/aal2 clause is gone; the email-code requirement lives in
-- 002_require_email_code.sql as a RESTRICTIVE policy that is AND-ed with these.)
drop policy if exists "own rows select" on public.book_versions;
create policy "own rows select" on public.book_versions for select to authenticated
  using (user_id = auth.uid());
drop policy if exists "own rows insert" on public.book_versions;
create policy "own rows insert" on public.book_versions for insert to authenticated
  with check (user_id = auth.uid());
drop policy if exists "own rows delete" on public.book_versions;
create policy "own rows delete" on public.book_versions for delete to authenticated
  using (user_id = auth.uid());
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
