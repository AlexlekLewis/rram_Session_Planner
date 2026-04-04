-- ============================================================
-- BUG-001 FIX: Add squad-level RLS filtering for players
-- Players should only see sessions for their assigned squad.
--
-- BLAST RADIUS:
-- - Adds squad_id column to sp_coaches (nullable, no breaking change)
-- - Updates sp_sessions SELECT policy (additive, coaches unaffected)
-- - Creates helper function user_player_squad_ids()
-- - Does NOT affect any existing policies for coach roles
-- ============================================================

-- Step 1: Add squad_id column to sp_coaches (nullable FK to sp_squads)
ALTER TABLE sp_coaches ADD COLUMN IF NOT EXISTS squad_id UUID REFERENCES sp_squads(id);

-- Step 2: Populate squad_id for existing players based on speciality text
UPDATE sp_coaches SET squad_id = (
  SELECT id FROM sp_squads WHERE name = sp_coaches.speciality LIMIT 1
) WHERE role = 'player' AND squad_id IS NULL;

-- Step 3: Create function to get the player's squad ID
CREATE OR REPLACE FUNCTION user_player_squad_id()
RETURNS UUID AS $$
  SELECT squad_id FROM public.sp_coaches
  WHERE user_id = auth.uid()
  AND is_active = true
  AND role = 'player'
  LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Step 4: Drop and recreate the sp_sessions SELECT policy
-- Old policy: any authenticated user sees all sessions
-- New policy: coaches see all sessions, players see only their squad's sessions
DROP POLICY IF EXISTS "sp_sessions_select" ON sp_sessions;

CREATE POLICY "sp_sessions_select" ON sp_sessions
  FOR SELECT USING (
    -- Coaches (head, assistant, guest) see all sessions
    user_is_sp_coach()
    OR
    -- Players see only sessions that include their squad
    (auth.uid() IS NOT NULL AND squad_ids @> ARRAY[user_player_squad_id()])
  );

-- Step 5: Same for sp_session_blocks — players should only see blocks for their squad's sessions
DROP POLICY IF EXISTS "sp_blocks_select" ON sp_session_blocks;

CREATE POLICY "sp_blocks_select" ON sp_session_blocks
  FOR SELECT USING (
    -- Coaches see all blocks
    user_is_sp_coach()
    OR
    -- Players see blocks only for sessions they can access
    (auth.uid() IS NOT NULL AND EXISTS (
      SELECT 1 FROM sp_sessions s
      WHERE s.id = sp_session_blocks.session_id
      AND s.squad_ids @> ARRAY[user_player_squad_id()]
    ))
  );
