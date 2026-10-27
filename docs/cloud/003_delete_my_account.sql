-- Paper Trail 003 — in-app account deletion (production since v37.5.60; email-code guard since v37.5.62).
-- Run after 002. Called by the app as POST /rest/v1/rpc/delete_my_account with the user's own session.
-- Takes no arguments: it can only ever delete the caller (auth.uid()), and only from a session that
-- came from an emailed code (pt_email_code_ok(), see 002).

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
  if not public.pt_email_code_ok() then
    raise exception 'email code required' using errcode = '42501';
  end if;
  delete from public.book_versions where user_id = uid;
  delete from auth.users where id = uid;   -- cascades to auth.identities / sessions / mfa_factors
end;
$$;
revoke all on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;
