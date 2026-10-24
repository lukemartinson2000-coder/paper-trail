# Paper Trail accounts & cloud backup: setup

Accounts stay hidden until `cloud-config.js` is filled in.

1. Create a free project at https://supabase.com (pick a US region and save the database password somewhere safe).
2. **SQL Editor → New query**: paste `001_book_versions.sql` and run it.
3. **Authentication → Sign In / Providers → Email**: keep Email enabled with "Confirm email" on.
4. **Authentication → URL Configuration**:
   - Site URL: `https://lukemartinson2000-coder.github.io/paper-trail/`
   - Redirect URLs: add the same URL (password-reset links come back here).
5. **Authentication → Multi-Factor**: turn on **TOTP (authenticator app)**, which is free.
   Optional: turn on **Phone** too. That needs an SMS provider (Twilio, MessageBird, Vonage or Textlocal) under Authentication → Sign In / Providers → Phone.
6. **Project Settings → API**: copy the **Project URL** and the **anon / publishable** key.
   Never copy the `service_role` / secret key anywhere in this app.
7. Put them in `cloud-config.js`:
   ```js
   window.PT_CLOUD = { url: "https://YOURPROJECT.supabase.co", anonKey: "eyJ…", phoneMfa: false };
   ```
   Set `phoneMfa: true` only after step 5's SMS provider works.
8. Bump the version, commit and push. On the phone: Profile → Account → Create account, then **Back up now** when asked.

The anon key is designed to be public. Row-level security in the SQL is what keeps each account's rows private.
