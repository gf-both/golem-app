# GOLEM — Persistence & User-Management Plan

*Goal: every user's profiles and quiz results are saved to their account and never lost on a cache reset, with proper login/password isolation so no user can see another's data.*

---

## 1. Diagnosis — why data is lost today

The app persists state with Zustand → `localStorage` (key `golem-store`). That is the **only** place most data lands, so clearing the browser cache wipes it. Supabase is wired in places, but the write-through is incomplete:

| Data | Saved to Supabase today? | Why it's lost |
|------|--------------------------|---------------|
| Primary profile (birth data) | ✅ `ProfilePanel` → `upsertBirthProfile` | Persisted **only if logged in** |
| Quiz results (Enneagram, MBTI, Dosha, Archetype, Love Language) | ❌ | `upsertBirthProfile` payload omits the quiz columns; quiz setters (`setEnneagramType`, etc.) write to local state only |
| Additional people | ❌ | `addPerson` never calls the DB |
| Issued reports (new feature) | ❌ | Stored in `localStorage` only; no table yet |
| Practitioner clients / sessions | ❌ | `db.js` helpers exist but aren't called from the UI |
| Anonymous (logged-out) usage | ❌ | Nothing syncs; `localStorage` only |

**Root causes:** (a) incomplete write-through, (b) no migration of existing local data into an account, (c) the app is usable without logging in, so anonymous data is never bound to a user.

---

## 2. What already exists (do NOT rebuild)

- **Schema** — `supabase/migrations/001_initial.sql` + `002_security_hardening.sql`: 8 tables (`profiles`, `birth_profiles`, `practitioner_clients`, `sessions`, `family_constellations`, `shared_charts`, `subscriptions`) with **Row-Level Security enabled** and per-user policies (`auth.uid() = owner_id`).
- **Quiz columns already on `birth_profiles`**: `enneagram_type`, `enneagram_wing`, `mbti_type`, `dosha_type`, `archetype_type`, `love_language`, plus `notes`, `is_primary`.
- **Auth** — `src/lib/auth.js`: email/password sign-up & sign-in, Google OAuth, sign-out, session listener. `AuthModal` UI exists. `App.jsx` already subscribes to `onAuthStateChange` and hydrates on login via `loadProfilesFromDB`.
- **Data layer** — `src/lib/db.js`: `upsertBirthProfile`, `getAllBirthProfiles`, sessions, practitioner clients, user profile.
- **Project** — Supabase project `zsnnmgdebebqkmntgcss` is linked; `.env.local` has `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY`.

So **"user management" is ~80% built.** The work is finishing the sync and hardening it.

---

## 3. Target architecture

**Source of truth:** Supabase (Postgres + Auth). **`localStorage` becomes an offline cache**, not the store of record.

```
  UI action (add profile / finish quiz / issue report)
        │
        ├─► Zustand store (instant UI update + localStorage cache)
        │
        └─► syncService (debounced) ─► Supabase (RLS-scoped to auth.uid())
                                          │
  On login / refresh:  loadFromDB ◄───────┘   (Supabase → store, reconcile)
```

- **Write-through, optimistic:** update the store immediately, then persist; on failure, queue and retry.
- **Reconciliation on login:** last-write-wins by `updated_at`; any local-only rows (created while logged out) are uploaded once and tagged.
- **Offline tolerance:** if Supabase is unreachable, keep working from cache and flush the queue when back online.

---

## 4. Schema changes (one new migration: `003_persistence.sql`)

1. **`issued_reports`** (new) — backs the report-issuance feature:
   `id, owner_id (practitioner/user), subject_profile_id, subject_name, practitioner_name, section_count, computed_count, html (or storage path), issued_at`. RLS: owner can CRUD; the subject's user can SELECT.
2. **`agent_results`** (new, optional) — persists AI outputs now kept in `localStorage` (`identitySynthesis`, `relationshipAnalysis`, `simulationResults`) keyed by `owner_id` + `profile_key`.
3. **`journal_entries`** (new, optional) — `dreams` and `syncs` logs, per `owner_id`.
4. Confirm **RLS + policies** on every new table (mirror existing `birth_profiles` pattern).
5. For large report HTML, prefer **Supabase Storage** (private bucket `reports/{user_id}/...`) over a big `text` column; store the path in `issued_reports`.

> Quiz columns already exist — no schema change needed for quizzes, only wiring.

---

## 5. Implementation phases

### Phase 0 — Verify the pipe (highest impact, fastest)
- Confirm `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` are set in **Vercel** (Production + Preview), not just `.env.local`.
- Confirm migrations `001`/`002` are applied to project `zsnnmgdebebqkmntgcss`.
- Add a tiny health check on boot that logs (dev only) whether Supabase is reachable, so "offline mode" is never silent.

### Phase 1 — Complete profile + quiz write-through
- Extend `upsertBirthProfile` payload to include `enneagram_type`, `enneagram_wing`, `mbti_type`, `dosha_type`, `archetype_type`, `love_language`, `notes`.
- Make quiz setters (`setEnneagramType`, `setMbtiType`, `setDoshaType`, `setArchetype`, `setLoveLang`) and `setPrimaryProfile` trigger a debounced sync of the active profile.
- Map quiz columns back into the store in `loadProfilesFromDB` (partly done — extend to all five).

### Phase 2 — Multi-profile (people) sync
- `addPerson` / `updatePerson` / `deletePerson` → `upsertBirthProfile(..., isPrimary=false)` / delete. Use the DB row `id` as the stable key.
- `loadProfilesFromDB` already returns non-primary people — ensure ids round-trip.

### Phase 3 — Auth enforcement + one-time migration
- **Decision (locked): require login.** The app is gated behind sign-in; an unauthenticated visitor sees only the auth screen. This guarantees no profile or quiz data is ever created anonymously, so nothing can be stranded in `localStorage`.
  - `App.jsx`: while `authLoading`, show a splash; if no `user`, render the auth gate (sign-in / sign-up / Google / reset) instead of the app shell.
  - Routes/portals are unreachable until authenticated; deep links bounce to the gate and resume after login.
  - Keep a lightweight public marketing/landing route if desired, but all data features stay gated.
- One-time `migrateLocalToAccount(userId)`: for existing users who already have profiles in `localStorage` from before this change, upload them to the account on their first authenticated load, dedupe by name+dob, then mark migrated. (Covers the transition; not an ongoing anonymous path.)
- Password reset flow (`supabase.auth.resetPasswordForEmail`), email verification ON, and a sign-out that clears the local cache so a shared device leaks nothing.

### Phase 4 — Practitioner & reports persistence
- Wire `practitioner_clients` + `sessions` `db.js` helpers into the Practitioner portal.
- Persist issued reports to `issued_reports` (+ Storage); the Client and Practitioner portals read from it instead of `localStorage`.

### Phase 5 — Security / data-leak hardening
- **RLS audit:** every table has SELECT/INSERT/UPDATE/DELETE policies scoped to `auth.uid()`; new tables included. Test cross-account access is denied.
- **Keys:** only the **anon** key in the client; never the service-role key. Confirm `.env*` is git-ignored.
- **Auth policy:** enable email confirmation, set a minimum password length, enable leaked-password protection (Supabase Auth setting), and reasonable rate limits.
- **PII minimization:** birth data is personal — keep it behind RLS, never in URLs/logs; shareable charts use the existing token table, not raw ids.
- **Account deletion (GDPR):** a "delete my account & data" path (cascades via `ON DELETE CASCADE`).
- **Storage:** private buckets per user for palm photos and report files; signed URLs only.

### Phase 6 — Reliability
- Offline write queue with retry/backoff; surface a subtle "saved / saving / offline" indicator.
- Conflict rule: last-write-wins by `updated_at`; never silently overwrite newer cloud data with stale local data on login.

---

## 6. Files that will change

- `supabase/migrations/003_persistence.sql` *(new)* — `issued_reports`, optional `agent_results`, `journal_entries`, RLS.
- `src/lib/db.js` — add quiz fields to upsert; add people delete, issued-reports CRUD, agent-results CRUD.
- `src/lib/syncService.js` *(new)* — debounced write-through, offline queue, `migrateLocalToAccount`.
- `src/store/useGolemStore.js` — call sync from profile/people/quiz actions; keep `localStorage` as cache.
- `src/lib/reportIssuance.js` + `ReportIssuance.jsx` — read/write `issued_reports` instead of store-only.
- `src/App.jsx` — migration-on-first-login; "saving/offline" status.
- `src/components/auth/AuthModal.jsx` — add password-reset; verification messaging.

---

## 7. Verification

- Manual: sign up → add profile + finish a quiz → **clear cache / different browser** → log in → data restored.
- Cross-account: User B cannot read User A's `birth_profiles` (RLS test, expect empty/denied).
- Build: `npm run build` clean (watch the apostrophe-in-single-quote esbuild rule).
- Automated: a small script hitting the REST endpoint with User A's token against User B's rows (expect 0 rows).

---

## 8. Decisions

1. **Auth gating: REQUIRE LOGIN** ✅ *(decided)* — app fully gated behind sign-in; no anonymous data path. See Phase 3.
2. **Report storage: INLINE HTML COLUMN** ✅ *(decided)* — `issued_reports.html` (Postgres TEXT). Self-contained, no bucket provisioning. Can migrate to a private Storage bucket later if report volume grows.
3. **Status: plan only for now** ✅ *(decided)* — no code yet; implementation begins on your go. Suggested first slice when ready: Phase 0 → 1 → 3.
