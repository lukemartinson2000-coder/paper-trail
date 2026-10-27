-- Paper Trail 002 — server-side email-code lock (production since v37.5.62). Run after 001.
-- Safe to run more than once. Run in Supabase → SQL Editor → New query → paste all → Run.
-- No service_role key involved; this only adds rules.
--
-- What it does: a session may touch public.book_versions or call delete_my_account() only if its JWT
-- "amr" (authentication methods, carried over on token refresh from auth.mfa_amr_claims) includes an
-- email-proof method. Per supabase/auth source (internal/models/factor.go, internal/api/verify.go):
--   POST /auth/v1/verify (any type: email, signup, recovery, magiclink) and link clicks issue method "otp".
--   Password grant issues "password" -> denied. Older GoTrue versions used "magiclink", "recovery",
--   "email/signup", "invite" for link flows; those are email proofs too, so they're allowed.
-- Uses a RESTRICTIVE policy, which is AND-ed with the existing per-user (auth.uid() = user_id) policies,
-- so those stay exactly as they are and their names don't matter.

create or replace function public.pt_email_code_ok()
returns boolean
language sql
stable
set search_path = ''
as $$
  select exists (
    select 1
    from jsonb_array_elements(coalesce(auth.jwt() -> 'amr', '[]'::jsonb)) as e
    where (case jsonb_typeof(e) when 'string' then e #>> '{}' else e ->> 'method' end)
          in ('otp', 'magiclink', 'recovery', 'email/signup', 'invite')
  );
$$;
revoke all on function public.pt_email_code_ok() from public, anon;
grant execute on function public.pt_email_code_ok() to authenticated;

alter table public.book_versions enable row level security;

drop policy if exists "pt_require_email_code" on public.book_versions;
create policy "pt_require_email_code" on public.book_versions
  as restrictive
  for all
  to authenticated
  using (public.pt_email_code_ok())
  with check (public.pt_email_code_ok());

-- Anon must never see rows (should already be true; restrictive guard for anon too).
drop policy if exists "pt_no_anon" on public.book_versions;
create policy "pt_no_anon" on public.book_versions
  as restrictive
  for all
  to anon
  using (false)
  with check (false);

-- Check (should list pt_require_email_code as RESTRICTIVE):
-- select policyname, permissive, cmd, roles from pg_policies where tablename = 'book_versions';

-- Rollback (undo only):
-- drop policy if exists "pt_require_email_code" on public.book_versions;
-- drop policy if exists "pt_no_anon" on public.book_versions;
-- (003 depends on pt_email_code_ok(); drop or replace delete_my_account() before dropping it.)
