/* Paper Trail account + cloud backup settings. Leave url and anonKey empty and the Account section stays hidden
 * (the app is local-only). Fill in your Supabase project's URL and its public "anon" key to turn accounts on.
 * Only the anon key belongs here — never the service_role key. Row-level security keeps each account's rows private.
 * phoneMfa: set true only after an SMS provider (e.g. Twilio) is connected in Supabase › Auth › Phone. */
window.PT_CLOUD = { url: "", anonKey: "", phoneMfa: false };
