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
   4. `004_relax_email_code.sql` (v37.5.65+): replaces the code-at-every-sign-in rule from 002 with
      "email must be confirmed", keeps anon denied, and makes deletion need a code emailed in the last 15 minutes.
      (002 and 003 are kept for history; 004 supersedes their rules.)
3. **Authentication → Sign In / Providers → Email**: keep Email enabled with "Confirm email" on.
   Set **Email OTP length to 6**.
4. **Authentication → Emails → SMTP Settings**: turn on custom SMTP (the built-in sender is limited to a few
   emails an hour and only reaches your own team). Use the support mailbox with an app password; keep that
   password only in Supabase, never in this repo.
5. **Authentication → Emails → Templates** (v37.5.65+: code-only emails): paste the HTML from
   `qa-scratch/v37565/email-templates/` (copies are kept outside the repo):
   - **Confirm signup** (sign-up): subject `Confirm your Paper Trail email`, body `confirm-signup.html`.
   - **Magic Link** (account deletion): keep the subject `Your sign-in link` (the app's delete screen names it), body `magic-link.html`.
   Both show the 6-digit `{{ .Token }}` large and say "Enter this code in Paper Trail. If you requested more than one
   code, use the newest email." They must **not** contain `{{ .ConfirmationURL }}`: one way to verify, so nobody lands
   on the wrong screen. Each new request replaces the old code. If someone opens an old link anyway, the app shows
   "Email confirmed. Sign in to continue" or "That link expired. Use the newest code we emailed you, or tap Resend code."
   Template edits can take a minute or more to apply; send a test email after saving.
6. **Authentication → URL Configuration**:
   - Site URL: `https://lukemartinson2000-coder.github.io/paper-trail/`
   - Redirect URLs: add the same URL. The app passes `redirect_to` (its own origin + path) on every auth email.
7. **Do not** turn on TOTP or phone MFA (not used). **Authentication → Sessions**: leave time-box and
   inactivity timeout off, so people stay signed in until they tap Sign out.
8. **Project Settings → API**: copy the **Project URL** and the **publishable** key into `cloud-config.js`:
   ```js
   window.PT_CLOUD = { url: "https://YOURPROJECT.supabase.co", anonKey: "sb_publishable_…" };
   ```
   Never copy the `service_role` / secret key anywhere in this app.
9. Bump the version (`node tools/set-version.js 37.x.y`), commit and push. On the phone: Profile → Account →
   Create account, then **Back up now** when asked.

How sign-in works (v37.5.65+): sign-up emails a 6-digit code once to confirm the email. After that, email +
password signs in and the session refreshes quietly until Sign out. If the refresh token is revoked (password
reset, signed out elsewhere) the app shows a sign-in prompt. Deleting the account emails a fresh code.

Check the live rules: `select policyname, permissive, cmd, roles from pg_policies where tablename = 'book_versions';`
should list `pt_require_confirmed_email` and `pt_no_anon` as RESTRICTIVE (after 004). Production may still carry the older
own-rows policies with an `aal2` clause and the `pt_has_verified_factor()` helper from an earlier 001; with no
authenticator factors they pass for every own-row session, and the restrictive confirmed-email policy still applies.

The publishable key is designed to be public. Row-level security is what keeps each account's rows private.
