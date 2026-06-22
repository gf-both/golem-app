-- GOLEM: Persistence migration 003
-- Adds issued_reports, agent_results, journal_entries — all RLS-scoped per user.
-- Run in the Supabase SQL editor for project zsnnmgdebebqkmntgcss, or via
-- `supabase db push` once the CLI is authenticated.

-- ============================================================
-- ISSUED REPORTS  (full multi-framework reports issued for a subject)
-- ============================================================
CREATE TABLE IF NOT EXISTS issued_reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,   -- who issued it
  subject_user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,    -- the client's account (if any)
  subject_profile_id UUID REFERENCES birth_profiles(id) ON DELETE SET NULL,
  subject_key TEXT,                 -- client-side grouping key (e.g. 'client_<id>' or 'self')
  subject_name TEXT NOT NULL DEFAULT 'Profile',
  practitioner_name TEXT,
  section_count INTEGER DEFAULT 0,
  computed_count INTEGER DEFAULT 0,
  html TEXT,                        -- self-contained report HTML (inline)
  issued_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE issued_reports ENABLE ROW LEVEL SECURITY;

-- Issuer manages their own reports
CREATE POLICY "Owners manage own issued reports" ON issued_reports
  FOR ALL USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);

-- The subject (client) can read reports issued for them
CREATE POLICY "Subjects can view their issued reports" ON issued_reports
  FOR SELECT USING (auth.uid() = subject_user_id);

CREATE INDEX IF NOT EXISTS idx_issued_reports_owner ON issued_reports(owner_id);
CREATE INDEX IF NOT EXISTS idx_issued_reports_subject ON issued_reports(subject_user_id);

-- ============================================================
-- AGENT RESULTS  (persist AI outputs previously kept only in localStorage)
-- ============================================================
CREATE TABLE IF NOT EXISTS agent_results (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  profile_key TEXT NOT NULL,        -- e.g. dob or person id
  kind TEXT NOT NULL,               -- 'identity' | 'relationship' | 'simulation'
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (owner_id, profile_key, kind)
);

ALTER TABLE agent_results ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own agent results" ON agent_results
  FOR ALL USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);
CREATE INDEX IF NOT EXISTS idx_agent_results_owner ON agent_results(owner_id);

-- ============================================================
-- JOURNAL ENTRIES  (dream journal + synchronicity log)
-- ============================================================
CREATE TABLE IF NOT EXISTS journal_entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  kind TEXT NOT NULL,               -- 'dream' | 'sync'
  entry JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own journal entries" ON journal_entries
  FOR ALL USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);
CREATE INDEX IF NOT EXISTS idx_journal_owner ON journal_entries(owner_id);

-- ============================================================
-- ACCOUNT DELETION (GDPR) — lets a user delete their own account + data.
-- All owned rows cascade via ON DELETE CASCADE from auth.users → profiles.
-- ============================================================
CREATE OR REPLACE FUNCTION delete_own_account()
RETURNS void AS $$
BEGIN
  DELETE FROM auth.users WHERE id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

REVOKE EXECUTE ON FUNCTION delete_own_account() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION delete_own_account() TO authenticated;
