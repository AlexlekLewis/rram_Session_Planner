-- ============================================================================
-- Migration 017: Session-level coach availability
-- ============================================================================
-- Changes availability from date-level to session-level granularity.
-- Coaches can now mark availability per session slot (e.g., Tue 5-7pm vs Tue 7-9pm)
-- instead of per date, enabling split-coaching across time slots on the same day.
-- ============================================================================

-- 1. Add session_id column to sp_coach_availability
ALTER TABLE sp_coach_availability
  ADD COLUMN session_id UUID REFERENCES sp_sessions(id) ON DELETE CASCADE;

-- 2. Backfill session_id where possible (match on program_id + date)
-- If multiple sessions exist for the same date, this maps to the first match.
-- Any availability without a matching session will be cleaned up.
UPDATE sp_coach_availability a
SET session_id = (
  SELECT s.id FROM sp_sessions s
  WHERE s.program_id = a.program_id AND s.date = a.date
  ORDER BY s.start_time ASC
  LIMIT 1
)
WHERE a.session_id IS NULL;

-- 3. Remove any availability records that couldn't be mapped
DELETE FROM sp_coach_availability WHERE session_id IS NULL;

-- 4. Make session_id NOT NULL now that all rows are backfilled
ALTER TABLE sp_coach_availability
  ALTER COLUMN session_id SET NOT NULL;

-- 5. Drop old unique constraint and add new session-level one
ALTER TABLE sp_coach_availability
  DROP CONSTRAINT IF EXISTS sp_coach_availability_program_id_user_id_date_key;

ALTER TABLE sp_coach_availability
  ADD CONSTRAINT sp_coach_availability_session_user_unique UNIQUE (session_id, user_id);

-- 6. Add index for fast lookups by session
CREATE INDEX IF NOT EXISTS idx_coach_availability_session
  ON sp_coach_availability(session_id);

-- 7. Keep the date column for convenience but it's now derived from the session.
-- Add a trigger to auto-populate date + program_id from the session on insert/update.
CREATE OR REPLACE FUNCTION fn_coach_availability_sync_session()
RETURNS TRIGGER AS $$
BEGIN
  SELECT date, program_id INTO NEW.date, NEW.program_id
  FROM sp_sessions WHERE id = NEW.session_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_coach_availability_sync_session
  BEFORE INSERT OR UPDATE ON sp_coach_availability
  FOR EACH ROW
  EXECUTE FUNCTION fn_coach_availability_sync_session();

-- 8. Update RLS policies to also allow access via session_id joins
-- (Existing policies use program_id which is still populated via trigger, so they still work)
