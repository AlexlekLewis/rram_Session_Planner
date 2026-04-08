-- ============================================================
-- Coach Availability & Session Rostering
-- Adds coach availability tracking and structured session rosters
-- ============================================================

-- ============================================================
-- 1. COACH AVAILABILITY (per-date availability for program members)
-- ============================================================
CREATE TABLE sp_coach_availability (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  program_id UUID NOT NULL REFERENCES sp_programs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'unavailable', 'tentative')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(program_id, user_id, date)
);

-- ============================================================
-- 2. SESSION COACHES (roster coaches onto specific sessions)
-- ============================================================
CREATE TABLE sp_session_coaches (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES sp_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'assistant_coach' CHECK (role IN ('head_coach', 'assistant_coach', 'guest_coach')),
  confirmed BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(session_id, user_id)
);

-- ============================================================
-- 3. EXTEND PROGRAM MEMBERS with coach profile fields
-- ============================================================
ALTER TABLE sp_program_members ADD COLUMN IF NOT EXISTS display_name TEXT;
ALTER TABLE sp_program_members ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE sp_program_members ADD COLUMN IF NOT EXISTS speciality TEXT;
ALTER TABLE sp_program_members ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- ============================================================
-- 4. MIGRATE display_name from sp_coaches where possible
-- ============================================================
UPDATE sp_program_members pm
SET display_name = c.name,
    speciality = c.speciality
FROM sp_coaches c
WHERE c.user_id = pm.user_id
  AND c.is_active = true
  AND pm.display_name IS NULL;

-- ============================================================
-- 5. INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_coach_availability_program_date ON sp_coach_availability(program_id, date);
CREATE INDEX IF NOT EXISTS idx_coach_availability_user ON sp_coach_availability(user_id);
CREATE INDEX IF NOT EXISTS idx_session_coaches_session ON sp_session_coaches(session_id);
CREATE INDEX IF NOT EXISTS idx_session_coaches_user ON sp_session_coaches(user_id);

-- ============================================================
-- 6. TRIGGERS
-- ============================================================
CREATE TRIGGER sp_coach_availability_updated_at
  BEFORE UPDATE ON sp_coach_availability
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- 7. ENABLE RLS
-- ============================================================
ALTER TABLE sp_coach_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE sp_session_coaches ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 8. RLS POLICIES — sp_coach_availability
-- ============================================================

-- All program members can view availability
CREATE POLICY "sp_coach_availability_select" ON sp_coach_availability
  FOR SELECT USING (user_is_program_member(program_id));

-- Coaches can set their own availability; head coaches can set anyone's
CREATE POLICY "sp_coach_availability_insert" ON sp_coach_availability
  FOR INSERT WITH CHECK (
    user_is_program_member(program_id)
    AND (user_id = auth.uid() OR user_is_program_head_coach(program_id))
  );

CREATE POLICY "sp_coach_availability_update" ON sp_coach_availability
  FOR UPDATE USING (
    user_id = auth.uid() OR user_is_program_head_coach(program_id)
  );

CREATE POLICY "sp_coach_availability_delete" ON sp_coach_availability
  FOR DELETE USING (
    user_id = auth.uid() OR user_is_program_head_coach(program_id)
  );

-- ============================================================
-- 9. RLS POLICIES — sp_session_coaches
-- ============================================================

-- All program members can see who's rostered
CREATE POLICY "sp_session_coaches_select" ON sp_session_coaches
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM sp_sessions s
      WHERE s.id = sp_session_coaches.session_id
        AND user_is_program_member(s.program_id)
    )
  );

-- Editors can roster coaches
CREATE POLICY "sp_session_coaches_insert" ON sp_session_coaches
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM sp_sessions s
      WHERE s.id = sp_session_coaches.session_id
        AND user_can_edit_program(s.program_id)
    )
  );

CREATE POLICY "sp_session_coaches_update" ON sp_session_coaches
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM sp_sessions s
      WHERE s.id = sp_session_coaches.session_id
        AND user_can_edit_program(s.program_id)
    )
  );

CREATE POLICY "sp_session_coaches_delete" ON sp_session_coaches
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM sp_sessions s
      WHERE s.id = sp_session_coaches.session_id
        AND user_can_edit_program(s.program_id)
    )
  );

-- ============================================================
-- 10. ENABLE REALTIME
-- ============================================================
ALTER PUBLICATION supabase_realtime ADD TABLE sp_coach_availability;
ALTER PUBLICATION supabase_realtime ADD TABLE sp_session_coaches;
