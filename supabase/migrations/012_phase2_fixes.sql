-- ============================================================
-- Phase 2 Fixes: H6 (coaches UNIQUE), F2 (messages DELETE), H5 (atomic date shift)
-- ============================================================

-- H6: UNIQUE partial index on sp_coaches.user_id
-- Prevents non-deterministic role resolution when duplicate user_id entries exist
-- First remove any existing duplicates (keep the newest)
DELETE FROM sp_coaches a USING sp_coaches b
  WHERE a.user_id = b.user_id
  AND a.user_id IS NOT NULL
  AND a.created_at < b.created_at;

CREATE UNIQUE INDEX IF NOT EXISTS idx_sp_coaches_user_unique
  ON sp_coaches(user_id)
  WHERE user_id IS NOT NULL;

-- F2: DELETE policy on sp_assistant_messages (scoped to thread owner)
CREATE POLICY "sp_messages_delete" ON sp_assistant_messages
  FOR DELETE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM sp_assistant_threads t
    WHERE t.id = sp_assistant_messages.thread_id
    AND t.user_id = auth.uid()
  ));

-- H5: Atomic shift_program_dates function
-- Replaces sequential frontend awaits with a single DB transaction
-- If any UPDATE fails, the entire operation rolls back
CREATE OR REPLACE FUNCTION shift_program_dates(
  p_program_id UUID,
  p_days INTEGER
)
RETURNS VOID AS $$
BEGIN
  UPDATE sp_programs
  SET start_date = start_date + p_days,
      end_date = end_date + p_days
  WHERE id = p_program_id;

  UPDATE sp_phases
  SET start_date = start_date + p_days,
      end_date = end_date + p_days
  WHERE program_id = p_program_id;

  UPDATE sp_sessions
  SET date = date + p_days
  WHERE program_id = p_program_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
