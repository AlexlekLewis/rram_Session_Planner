-- ============================================================
-- Fix RLS Security Holes on AI Assistant Tables
-- + Add missing ON DELETE actions for session foreign keys
-- ============================================================

-- ============================================================
-- 1. sp_assistant_threads SELECT — own threads OR coaches
-- ============================================================
DROP POLICY IF EXISTS "sp_threads_select" ON sp_assistant_threads;
CREATE POLICY "sp_threads_select" ON sp_assistant_threads
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR EXISTS (
    SELECT 1 FROM sp_coaches WHERE sp_coaches.user_id = auth.uid()
    AND sp_coaches.role IN ('head_coach', 'assistant_coach')
  ));

-- ============================================================
-- 2. sp_assistant_threads INSERT — enforce user_id = auth.uid()
-- ============================================================
DROP POLICY IF EXISTS "sp_threads_insert" ON sp_assistant_threads;
CREATE POLICY "sp_threads_insert" ON sp_assistant_threads
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- ============================================================
-- 3. sp_assistant_messages INSERT — thread ownership check
-- ============================================================
DROP POLICY IF EXISTS "sp_messages_insert" ON sp_assistant_messages;
CREATE POLICY "sp_messages_insert" ON sp_assistant_messages
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM sp_assistant_threads t
    WHERE t.id = thread_id AND t.user_id = auth.uid()
  ));

-- ============================================================
-- 4. sp_assistant_messages SELECT — thread ownership or coach
-- ============================================================
DROP POLICY IF EXISTS "sp_messages_select" ON sp_assistant_messages;
CREATE POLICY "sp_messages_select" ON sp_assistant_messages
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM sp_assistant_threads t
    WHERE t.id = thread_id AND (t.user_id = auth.uid() OR EXISTS (
      SELECT 1 FROM sp_coaches c WHERE c.user_id = auth.uid()
      AND c.role IN ('head_coach', 'assistant_coach')
    ))
  ));

-- ============================================================
-- 5. sp_assistant_messages UPDATE — already correct in 007,
--    but re-scope to TO authenticated for consistency
-- ============================================================
DROP POLICY IF EXISTS "sp_messages_update" ON sp_assistant_messages;
CREATE POLICY "sp_messages_update" ON sp_assistant_messages
  FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM sp_assistant_threads t
    WHERE t.id = sp_assistant_messages.thread_id
    AND t.user_id = auth.uid()
  ));

-- ============================================================
-- 6. Fix missing ON DELETE actions for sp_sessions foreign keys
-- ============================================================
ALTER TABLE sp_sessions ALTER COLUMN phase_id SET DEFAULT NULL;
ALTER TABLE sp_sessions DROP CONSTRAINT IF EXISTS sp_sessions_phase_id_fkey;
ALTER TABLE sp_sessions ADD CONSTRAINT sp_sessions_phase_id_fkey
  FOREIGN KEY (phase_id) REFERENCES sp_phases(id) ON DELETE SET NULL;

ALTER TABLE sp_sessions DROP CONSTRAINT IF EXISTS sp_sessions_venue_id_fkey;
ALTER TABLE sp_sessions ADD CONSTRAINT sp_sessions_venue_id_fkey
  FOREIGN KEY (venue_id) REFERENCES sp_venues(id) ON DELETE SET NULL;
