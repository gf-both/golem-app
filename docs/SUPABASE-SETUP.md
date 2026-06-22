# GOLEM — Supabase setup & security checklist

The persistence + login system is implemented in code. Three things require your
Supabase / Vercel access (they can't be done from the codebase). Everything else
is wired and builds clean.

## 1. Apply the database migration (one time)

Project: `zsnnmgdebebqkmntgcss`

Run `supabase/migrations/003_persistence.sql` — either:
- **Dashboard:** Supabase → SQL Editor → paste the file → Run, **or**
- **CLI:** `supabase db push` (after `supabase login` + `supabase link`).

It creates `issued_reports`, `agent_results`, `journal_entries` (all with RLS) and
the `delete_own_account()` GDPR function. Migrations `001`/`002` should already be applied.

## 2. Set env vars in Vercel (Production + Preview)

These exist in local `.env.local` but must also be in Vercel or every cloud write
silently no-ops in production:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

(Only the **anon** key — never the service-role key — belongs in the client.)

## 3. Auth settings (Supabase dashboard → Authentication)

- **Confirm email:** ON (verification before first login).
- **Minimum password length:** ≥ 8.
- **Leaked password protection:** ON (Auth → Policies).
- **Site URL / Redirect URLs:** add your production domain (for password-reset and
  Google OAuth redirects) — currently the app uses `window.location.origin`.
- **Google OAuth:** add client id/secret if you want the "Continue with Google" button live.

## What's already done in code

- **Login required:** the app is gated behind sign-in (`AuthGate` in `App.jsx`).
  If the Supabase env is missing, the gate is bypassed so a misconfig can't brick the app.
- **Per-user isolation:** every table has RLS scoped to `auth.uid()`. No user can read another's rows.
- **Write-through sync:** profiles, all five quiz results, and additional people sync to
  `birth_profiles`; issued reports sync to `issued_reports`. `localStorage` is now just an offline cache.
- **First-login migration:** any profiles left in a returning user's local cache upload to their account once.
- **Password reset** (email link), **sign-out clears the local cache**, and **account deletion** (`deleteAccount()` → `delete_own_account()` RPC) are implemented.
- **Offline tolerance:** failed writes queue and retry when the connection returns.

## Verify it works

1. Sign up → add a profile + finish a quiz.
2. Clear the browser cache (or open another browser) → log in → data is restored.
3. As a second account, confirm you cannot see the first account's profiles.
