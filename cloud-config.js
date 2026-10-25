/* Paper Trail account + cloud backup settings. Leave url and anonKey empty and the Account section stays hidden
 * (the app is local-only). Fill in your Supabase project's URL and its publishable key (sb_publishable_…, or a legacy public "anon" key) to turn accounts on.
 * Only the publishable/anon key belongs here — never a secret or service_role key. Row-level security keeps each account's rows private.
 * Two-step sign-in is a required 6-digit email code (Supabase email OTP); no authenticator apps. */
window.PT_CLOUD = { url: "https://rfytcychbjlioshqibpw.supabase.co", anonKey: "sb_publishable_w0sCMeaNZEUpHFeGOhGy8w_gOI15k0V" };
