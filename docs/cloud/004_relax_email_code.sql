-- Paper Trail 004 — verify email once, then password sign-in (v37.5.65). Run after 001–003.
-- Safe to run more than once. Supabase → SQL Editor → New query → paste all → Run.
-- No service_role key involved. Per-user policies (auth.uid() = user_id) from 001 are untouched.
--
-- What changes:
--   * book_versions no longer needs an emailed-code session. Instead a RESTRICTIVE policy requires the
--     signed-in user's email to be confirmed (they typed the sign-up code or opened the confirm link).
--   * pt_no_anon (anon can never see rows) is kept / re-created.
--   * delete_my_account() still needs a FRESH emailed code: an otp/link proof in the JWT amr that is
--     less than 15 minutes old. A password-only session, or the old sign-up code from days ago, can't delete.

-- 1) Confirmed-email check (reads only the caller's own auth row).
create or replace function public.pt_email_confirmed()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from auth.users u
    where u.id = auth.uid() and u.email_confirmed_at is not null
  );
$$;
revoke all on function public.pt_email_confirmed() from public, anon;
grant execute on function public.pt_email_confirmed() to authenticated;

-- 2) Recent emailed-code check, used only for account deletion.
create or replace function public.pt_recent_email_code(max_age_seconds integer default 900)
returns boolean
language sql
stable
set search_path = ''
as $$
  select exists (
    select 1
    from jsonb_array_elements(coalesce(auth.jwt() -> 'amr', '[]'::jsonb)) as e
    where jsonb_typeof(e) = 'object'
      and (e ->> 'method') in ('otp', 'magiclink', 'recovery', 'email/signup', 'invite')
      and coalesce((e ->> 'timestamp')::bigint, 0) >= extract(epoch from now())::bigint - max_age_seconds
  );
$$;
revoke all on function public.pt_recent_email_code(integer) from public, anon;
grant execute on function public.pt_recent_email_code(integer) to authenticated;

alter table public.book_versions enable row level security;

-- 3) Swap the every-sign-in code rule for the confirmed-email rule (same transaction, no open window).
begin;
drop policy if exists "pt_require_email_code" on public.book_versions;
drop policy if exists "pt_require_confirmed_email" on public.book_versions;
create policy "pt_require_confirmed_email" on public.book_versions
  as restrictive
  for all
  to authenticated
  using (public.pt_email_confirmed())
  with check (public.pt_email_confirmed());

drop policy if exists "pt_no_anon" on public.book_versions;
create policy "pt_no_anon" on public.book_versions
  as restrictive
  for all
  to anon
  using (false)
  with check (false);
commit;

-- 4) Account deletion: caller only, fresh emailed code only.
create or replace function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then
    raise exception 'not signed in' using errcode = '28000';
  end if;
  if not public.pt_recent_email_code(900) then
    raise exception 'email code required' using errcode = '42501';
  end if;
  delete from public.book_versions where user_id = uid;
  delete from auth.users where id = uid;
end;
$$;
revoke all on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;

-- Check: should list pt_require_confirmed_email and pt_no_anon as RESTRICTIVE (permissive = 'RESTRICTIVE'),
-- plus the per-user policies from 001; pt_require_email_code should be gone.
-- select policyname, permissive, cmd, roles from pg_policies where tablename = 'book_versions';

-- Rollback (back to a code at every sign-in; also re-deploy an app build from before v37.5.65):
--   re-run 002_require_email_code.sql, then 003_delete_my_account.sql, then:
--   drop policy if exists "pt_require_confirmed_email" on public.book_versions;
--   (pt_email_confirmed() and pt_recent_email_code() can stay; they're harmless.)
