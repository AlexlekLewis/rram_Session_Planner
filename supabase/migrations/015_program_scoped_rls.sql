-- ============================================================
-- Program-Scoped RLS — New helper functions + updated policies
-- Adds program-aware authorization alongside existing global functions
-- ============================================================

-- ============================================================
-- NEW HELPER FUNCTIONS (program-scoped)
-- These work alongside existing global functions for backward compat
-- ============================================================

-- Returns the user's role within a specific program (or null)
CREATE OR REPLACE FUNCTION user_program_role(p_program_id UUID)
RETURNS TEXT AS $$
  SELECT role FROM public.sp_program_members
  WHERE user_id = auth.uid()
    AND program_id = p_program_id
    AND status = 'active'
  LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Is user a member of this program?
CREATE OR REPLACE FUNCTION user_is_program_member(p_program_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.sp_program_members
    WHERE user_id = auth.uid()
      AND program_id = p_program_id
      AND status = 'active'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Can user edit within this program? (head_coach or assistant_coach)
CREATE OR REPLACE FUNCTION user_can_edit_program(p_program_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.sp_program_members
    WHERE user_id = auth.uid()
      AND program_id = p_program_id
      AND status = 'active'
      AND role IN ('head_coach', 'assistant_coach')
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Is user head_coach in this program?
CREATE OR REPLACE FUNCTION user_is_program_head_coach(p_program_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.sp_program_members
    WHERE user_id = auth.uid()
      AND program_id = p_program_id
      AND status = 'active'
      AND role = 'head_coach'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Is user a member of ANY program? (for tables like sp_programs that need broad access)
CREATE OR REPLACE FUNCTION user_is_any_program_member()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.sp_program_members
    WHERE user_id = auth.uid()
      AND status = 'active'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ============================================================
-- SP_PROGRAMS — Read: members of that program | Write: head_coach of that program
-- (Updated from: any authenticated user can read all programs)
-- ============================================================
DROP POLICY IF EXISTS "sp_programs_select" ON sp_programs;
DROP POLICY IF EXISTS "sp_programs_insert" ON sp_programs;
DROP POLICY IF EXISTS "sp_programs_update" ON sp_programs;
DROP POLICY IF EXISTS "sp_programs_delete" ON sp_programs;

-- Users can see programs they belong to
CREATE POLICY "sp_programs_select" ON sp_programs
  FOR SELECT USING (
    user_is_program_member(id)
    OR user_is_any_program_member()  -- Allow listing for program switcher
  );

CREATE POLICY "sp_programs_insert" ON sp_programs
  FOR INSERT WITH CHECK (
    -- Any authenticated user can create a program (they become head_coach via trigger/app logic)
    auth.uid() IS NOT NULL
  );

CREATE POLICY "sp_programs_update" ON sp_programs
  FOR UPDATE USING (user_is_program_head_coach(id));

CREATE POLICY "sp_programs_delete" ON sp_programs
  FOR DELETE USING (user_is_program_head_coach(id));

-- ============================================================
-- SP_PHASES — Read: program members | Write: program head_coach
-- ============================================================
DROP POLICY IF EXISTS "sp_phases_select" ON sp_phases;
DROP POLICY IF EXISTS "sp_phases_insert" ON sp_phases;
DROP POLICY IF EXISTS "sp_phases_update" ON sp_phases;
DROP POLICY IF EXISTS "sp_phases_delete" ON sp_phases;

CREATE POLICY "sp_phases_select" ON sp_phases
  FOR SELECT USING (user_is_program_member(program_id));

CREATE POLICY "sp_phases_insert" ON sp_phases
  FOR INSERT WITH CHECK (user_is_program_head_coach(program_id));

CREATE POLICY "sp_phases_update" ON sp_phases
  FOR UPDATE USING (user_is_program_head_coach(program_id));

CREATE POLICY "sp_phases_delete" ON sp_phases
  FOR DELETE USING (user_is_program_head_coach(program_id));

-- ============================================================
-- SP_SQUADS — Read: program members | Write: program head_coach
-- ============================================================
DROP POLICY IF EXISTS "sp_squads_select" ON sp_squads;
DROP POLICY IF EXISTS "sp_squads_insert" ON sp_squads;
DROP POLICY IF EXISTS "sp_squads_update" ON sp_squads;
DROP POLICY IF EXISTS "sp_squads_delete" ON sp_squads;

CREATE POLICY "sp_squads_select" ON sp_squads
  FOR SELECT USING (user_is_program_member(program_id));

CREATE POLICY "sp_squads_insert" ON sp_squads
  FOR INSERT WITH CHECK (user_is_program_head_coach(program_id));

CREATE POLICY "sp_squads_update" ON sp_squads
  FOR UPDATE USING (user_is_program_head_coach(program_id));

CREATE POLICY "sp_squads_delete" ON sp_squads
  FOR DELETE USING (user_is_program_head_coach(program_id));

-- ============================================================
-- SP_SESSIONS — Read: program members | Write: program editors
-- ============================================================
DROP POLICY IF EXISTS "sp_sessions_select" ON sp_sessions;
DROP POLICY IF EXISTS "sp_sessions_insert" ON sp_sessions;
DROP POLICY IF EXISTS "sp_sessions_update" ON sp_sessions;
DROP POLICY IF EXISTS "sp_sessions_delete" ON sp_sessions;

CREATE POLICY "sp_sessions_select" ON sp_sessions
  FOR SELECT USING (user_is_program_member(program_id));

CREATE POLICY "sp_sessions_insert" ON sp_sessions
  FOR INSERT WITH CHECK (user_can_edit_program(program_id));

CREATE POLICY "sp_sessions_update" ON sp_sessions
  FOR UPDATE USING (user_can_edit_program(program_id));

CREATE POLICY "sp_sessions_delete" ON sp_sessions
  FOR DELETE USING (user_is_program_head_coach(program_id));

-- ============================================================
-- SP_SESSION_BLOCKS — Read: program members (via session) | Write: program editors
-- session_blocks don't have program_id directly, so join through session
-- ============================================================
DROP POLICY IF EXISTS "sp_blocks_select" ON sp_session_blocks;
DROP POLICY IF EXISTS "sp_blocks_insert" ON sp_session_blocks;
DROP POLICY IF EXISTS "sp_blocks_update" ON sp_session_blocks;
DROP POLICY IF EXISTS "sp_blocks_delete" ON sp_session_blocks;

CREATE POLICY "sp_blocks_select" ON sp_session_blocks
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM sp_sessions s
      WHERE s.id = sp_session_blocks.session_id
        AND user_is_program_member(s.program_id)
    )
  );

CREATE POLICY "sp_blocks_insert" ON sp_session_blocks
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM sp_sessions s
      WHERE s.id = sp_session_blocks.session_id
        AND user_can_edit_program(s.program_id)
    )
  );

CREATE POLICY "sp_blocks_update" ON sp_session_blocks
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM sp_sessions s
      WHERE s.id = sp_session_blocks.session_id
        AND user_can_edit_program(s.program_id)
    )
  );

CREATE POLICY "sp_blocks_delete" ON sp_session_blocks
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM sp_sessions s
      WHERE s.id = sp_session_blocks.session_id
        AND user_can_edit_program(s.program_id)
    )
  );

-- ============================================================
-- SP_ACTIVITIES — Read: global OR program member | Write: program editors
-- Global activities (program_id IS NULL) are readable by all program members
-- Program-specific activities only visible to that program's members
-- ============================================================
DROP POLICY IF EXISTS "sp_activities_select" ON sp_activities;
DROP POLICY IF EXISTS "sp_activities_insert" ON sp_activities;
DROP POLICY IF EXISTS "sp_activities_update" ON sp_activities;
DROP POLICY IF EXISTS "sp_activities_delete" ON sp_activities;

CREATE POLICY "sp_activities_select" ON sp_activities
  FOR SELECT USING (
    (program_id IS NULL AND user_is_any_program_member())
    OR user_is_program_member(program_id)
  );

CREATE POLICY "sp_activities_insert" ON sp_activities
  FOR INSERT WITH CHECK (
    -- Global activities: any editor in any program
    (program_id IS NULL AND user_is_any_program_member())
    OR user_can_edit_program(program_id)
  );

CREATE POLICY "sp_activities_update" ON sp_activities
  FOR UPDATE USING (
    (program_id IS NULL AND user_is_any_program_member())
    OR user_can_edit_program(program_id)
  );

CREATE POLICY "sp_activities_delete" ON sp_activities
  FOR DELETE USING (
    (program_id IS NULL AND user_is_any_program_member())
    OR user_is_program_head_coach(program_id)
  );

-- ============================================================
-- SP_COACHES — Keep existing policies (backward compat during transition)
-- No changes needed — sp_coaches remains for legacy lookups
-- ============================================================

-- ============================================================
-- SP_VENUES — Read: any program member | Write: any head_coach
-- Venues are shared across programs (location-based, not program-based)
-- ============================================================
DROP POLICY IF EXISTS "sp_venues_select" ON sp_venues;
DROP POLICY IF EXISTS "sp_venues_insert" ON sp_venues;
DROP POLICY IF EXISTS "sp_venues_update" ON sp_venues;

CREATE POLICY "sp_venues_select" ON sp_venues
  FOR SELECT USING (user_is_any_program_member());

CREATE POLICY "sp_venues_insert" ON sp_venues
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM sp_program_members
      WHERE user_id = auth.uid() AND status = 'active' AND role = 'head_coach'
    )
  );

CREATE POLICY "sp_venues_update" ON sp_venues
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM sp_program_members
      WHERE user_id = auth.uid() AND status = 'active' AND role = 'head_coach'
    )
  );

-- ============================================================
-- SP_PROGRAM_MEMBERS — RLS
-- Members can see other members of their programs
-- Head coaches can manage membership
-- ============================================================
CREATE POLICY "sp_program_members_select" ON sp_program_members
  FOR SELECT USING (
    user_is_program_member(program_id)
    OR user_id = auth.uid()  -- Users can always see their own memberships
  );

CREATE POLICY "sp_program_members_insert" ON sp_program_members
  FOR INSERT WITH CHECK (
    user_is_program_head_coach(program_id)
    OR user_id = auth.uid()  -- Users can accept invites (insert their own record)
  );

CREATE POLICY "sp_program_members_update" ON sp_program_members
  FOR UPDATE USING (
    user_is_program_head_coach(program_id)
    OR user_id = auth.uid()  -- Users can update their own membership (e.g., accept invite)
  );

CREATE POLICY "sp_program_members_delete" ON sp_program_members
  FOR DELETE USING (user_is_program_head_coach(program_id));

-- ============================================================
-- SP_PROGRAM_INVITES — RLS
-- Head coaches of the program can manage invites
-- Anyone can read an invite by token (for accepting)
-- ============================================================
CREATE POLICY "sp_program_invites_select" ON sp_program_invites
  FOR SELECT USING (
    user_is_program_head_coach(program_id)
    OR auth.uid() IS NOT NULL  -- Anyone authenticated can look up an invite (by token in app code)
  );

CREATE POLICY "sp_program_invites_insert" ON sp_program_invites
  FOR INSERT WITH CHECK (user_is_program_head_coach(program_id));

CREATE POLICY "sp_program_invites_update" ON sp_program_invites
  FOR UPDATE USING (
    user_is_program_head_coach(program_id)
    OR auth.uid() IS NOT NULL  -- Anyone can accept (update accepted_by/accepted_at)
  );

CREATE POLICY "sp_program_invites_delete" ON sp_program_invites
  FOR DELETE USING (user_is_program_head_coach(program_id));
