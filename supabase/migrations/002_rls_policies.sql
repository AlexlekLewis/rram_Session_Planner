-- ============================================================
-- RRA Session Planner — Row Level Security Policies
-- Fresh project: rrfghjhzdevmzzttvith
-- ============================================================

-- ============================================================
-- HELPER FUNCTIONS
-- ============================================================

-- Returns the user's role from sp_coaches (or null if not found)
CREATE OR REPLACE FUNCTION user_sp_role()
RETURNS TEXT AS $$
  SELECT role FROM public.sp_coaches
  WHERE user_id = auth.uid() AND is_active = true
  LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Is user any type of coach? (head_coach, assistant_coach, guest_coach)
CREATE OR REPLACE FUNCTION user_is_sp_coach()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.sp_coaches
    WHERE user_id = auth.uid()
    AND is_active = true
    AND role IN ('head_coach', 'assistant_coach', 'guest_coach')
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Can user edit sessions and blocks? (head_coach or assistant_coach only)
CREATE OR REPLACE FUNCTION user_can_edit_sessions()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.sp_coaches
    WHERE user_id = auth.uid()
    AND is_active = true
    AND role IN ('head_coach', 'assistant_coach')
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Is user the head coach? (admin-level access)
CREATE OR REPLACE FUNCTION user_is_head_coach()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.sp_coaches
    WHERE user_id = auth.uid()
    AND is_active = true
    AND role = 'head_coach'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ============================================================
-- ENABLE RLS ON ALL TABLES
-- ============================================================
ALTER TABLE sp_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE sp_phases ENABLE ROW LEVEL SECURITY;
ALTER TABLE sp_venues ENABLE ROW LEVEL SECURITY;
ALTER TABLE sp_squads ENABLE ROW LEVEL SECURITY;
ALTER TABLE sp_coaches ENABLE ROW LEVEL SECURITY;
ALTER TABLE sp_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE sp_session_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE sp_activities ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- SP_PROGRAMS — Read: all authenticated | Write: head_coach only
-- ============================================================
CREATE POLICY "sp_programs_select" ON sp_programs
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "sp_programs_insert" ON sp_programs
  FOR INSERT WITH CHECK (user_is_head_coach());

CREATE POLICY "sp_programs_update" ON sp_programs
  FOR UPDATE USING (user_is_head_coach());

CREATE POLICY "sp_programs_delete" ON sp_programs
  FOR DELETE USING (user_is_head_coach());

-- ============================================================
-- SP_PHASES — Read: all authenticated | Write: head_coach only
-- ============================================================
CREATE POLICY "sp_phases_select" ON sp_phases
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "sp_phases_insert" ON sp_phases
  FOR INSERT WITH CHECK (user_is_head_coach());

CREATE POLICY "sp_phases_update" ON sp_phases
  FOR UPDATE USING (user_is_head_coach());

CREATE POLICY "sp_phases_delete" ON sp_phases
  FOR DELETE USING (user_is_head_coach());

-- ============================================================
-- SP_VENUES — Read: all authenticated | Write: head_coach only
-- ============================================================
CREATE POLICY "sp_venues_select" ON sp_venues
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "sp_venues_insert" ON sp_venues
  FOR INSERT WITH CHECK (user_is_head_coach());

CREATE POLICY "sp_venues_update" ON sp_venues
  FOR UPDATE USING (user_is_head_coach());

-- ============================================================
-- SP_SQUADS — Read: all authenticated | Write: head_coach only
-- ============================================================
CREATE POLICY "sp_squads_select" ON sp_squads
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "sp_squads_insert" ON sp_squads
  FOR INSERT WITH CHECK (user_is_head_coach());

CREATE POLICY "sp_squads_update" ON sp_squads
  FOR UPDATE USING (user_is_head_coach());

CREATE POLICY "sp_squads_delete" ON sp_squads
  FOR DELETE USING (user_is_head_coach());

-- ============================================================
-- SP_COACHES — Read: all authenticated | Write: head_coach only
-- ============================================================
CREATE POLICY "sp_coaches_select" ON sp_coaches
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "sp_coaches_insert" ON sp_coaches
  FOR INSERT WITH CHECK (user_is_head_coach());

CREATE POLICY "sp_coaches_update" ON sp_coaches
  FOR UPDATE USING (user_is_head_coach());

CREATE POLICY "sp_coaches_delete" ON sp_coaches
  FOR DELETE USING (user_is_head_coach());

-- ============================================================
-- SP_SESSIONS — Read: all authenticated | Write: head_coach + assistant_coach
-- ============================================================
CREATE POLICY "sp_sessions_select" ON sp_sessions
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "sp_sessions_insert" ON sp_sessions
  FOR INSERT WITH CHECK (user_can_edit_sessions());

CREATE POLICY "sp_sessions_update" ON sp_sessions
  FOR UPDATE USING (user_can_edit_sessions());

CREATE POLICY "sp_sessions_delete" ON sp_sessions
  FOR DELETE USING (user_is_head_coach());

-- ============================================================
-- SP_SESSION_BLOCKS — Read: all authenticated | Write: head_coach + assistant_coach
-- ============================================================
CREATE POLICY "sp_blocks_select" ON sp_session_blocks
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "sp_blocks_insert" ON sp_session_blocks
  FOR INSERT WITH CHECK (user_can_edit_sessions());

CREATE POLICY "sp_blocks_update" ON sp_session_blocks
  FOR UPDATE USING (user_can_edit_sessions());

CREATE POLICY "sp_blocks_delete" ON sp_session_blocks
  FOR DELETE USING (user_can_edit_sessions());

-- ============================================================
-- SP_ACTIVITIES — Read: all coaches | Write: head_coach + assistant_coach
-- ============================================================
CREATE POLICY "sp_activities_select" ON sp_activities
  FOR SELECT USING (user_is_sp_coach());

CREATE POLICY "sp_activities_insert" ON sp_activities
  FOR INSERT WITH CHECK (user_can_edit_sessions());

CREATE POLICY "sp_activities_update" ON sp_activities
  FOR UPDATE USING (user_can_edit_sessions());

CREATE POLICY "sp_activities_delete" ON sp_activities
  FOR DELETE USING (user_is_head_coach());
