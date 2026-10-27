# Paper Trail accounts & cloud backup: setup

Accounts stay hidden until `cloud-config.js` is filled in. Nothing here needs the `service_role` / secret key.

1. Create a free project at https://supabase.com (pick a US region and save the database password somewhere safe).
2. **SQL Editor → New query**: run these in order (each is safe to re-run):
   1. `001_book_versions.sql`: the backup table, own-rows policies, keep-newest-10 trigger.
   2. `002_require_email_code.sql`: a RESTRICTIVE policy so only sessions that came from an emailed code
      (JWT `amr` has `otp`, or a legacy email-link method) can read or write backups. A password-only
      session gets no rows. Anonymous access is denied.
   3. `003_delete_my_account.sql`: in-app account deletion (takes no arguments, deletes only the caller,
      and only from an email-code session).
3. **Authentication → Sign In / Providers → Email**: keep Email enabled with "Confirm email" on.
   Set **Email OTP length to 6**.
4. **Authentication → Emails → SMTP Settings**: turn on custom SMTP (the built-in sender is limited to a few
   emails an hour, and every sign-in now sends one). Use the support mailbox with an app password; keep that
   password only in Supabase, never in this repo.
5. **Authentication → Emails → Templates**: the **Confirm signup** and **Magic Link** templates must include the
   6-digit code, `{{ .Token }}`, because the app asks the user to type it. Template edits can take a minute or
   more to apply; send a test email after saving.
6. **Authentication → URL Configuration**:
   - Site URL: `https://lukemartinson2000-coder.github.io/paper-trail/`
   - Redirect URLs: add the same URL. The app passes `redirect_to` (its own origin + path) on every auth email.
7. **Do not** turn on TOTP or phone MFA. Paper Trail's second step is the emailed code (see 002). Supabase has no
   native email MFA, so the inbox is the real factor, and the Privacy Policy says so.
8. **Project Settings → API**: copy the **Project URL** and the **publishable** key into `cloud-config.js`:
   ```js
   window.PT_CLOUD = { url: "https://YOURPROJECT.supabase.co", anonKey: "sb_publishable_…" };
   ```
   Never copy the `service_role` / secret key anywhere in this app.
9. Bump the version (`node tools/set-version.js 37.x.y`), commit and push. On the phone: Profile → Account →
   Create account, then **Back up now** when asked.

How sign-in works: the app checks the password, immediately revokes that password session
(`/auth/v1/logout?scope=local`), emails a code, and keeps only the session from `/auth/v1/verify`.

Check the live rules: `select policyname, permissive, cmd, roles from pg_policies where tablename = 'book_versions';`
should list `pt_require_email_code` and `pt_no_anon` as RESTRICTIVE. Production may still carry the older
own-rows policies with an `aal2` clause and the `pt_has_verified_factor()` helper from an earlier 001; with no
authenticator factors they pass for every own-row session, and the restrictive email-code policy still applies.

The publishable key is designed to be public. Row-level security is what keeps each account's rows private.
