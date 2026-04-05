-- ============================================================================
-- Migration 010: Player Management System
-- Adds roles, skills, bowling tracking to sp_players
-- Creates sp_player_block_assignments for activity/load tracking
-- ============================================================================

-- 1. Add role and skill columns to sp_players
ALTER TABLE sp_players
  ADD COLUMN IF NOT EXISTS role TEXT CHECK (role IN (
    'batsman', 'bowler', 'all_rounder', 'wicketkeeper', 'wicketkeeper_batsman'
  )),
  ADD COLUMN IF NOT EXISTS batting_hand TEXT CHECK (batting_hand IN ('right', 'left')),
  ADD COLUMN IF NOT EXISTS bowling_style TEXT CHECK (bowling_style IN (
    'right_arm_fast', 'right_arm_medium', 'right_arm_offspin', 'right_arm_legspin',
    'left_arm_fast', 'left_arm_medium', 'left_arm_orthodox', 'left_arm_wrist'
  )),
  ADD COLUMN IF NOT EXISTS skills JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS notes TEXT,
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 2. Create player-block assignment table for tracking activity participation
CREATE TABLE IF NOT EXISTS sp_player_block_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID NOT NULL REFERENCES sp_players(id) ON DELETE CASCADE,
  block_id UUID NOT NULL REFERENCES sp_session_blocks(id) ON DELETE CASCADE,
  session_id UUID NOT NULL REFERENCES sp_sessions(id) ON DELETE CASCADE,
  -- Denormalised for fast aggregation queries
  category TEXT,              -- from block: batting, pace_bowling, spin_bowling, etc
  activity_name TEXT,         -- from block name
  duration_mins INTEGER,      -- calculated from block time_start/time_end
  balls_bowled INTEGER,       -- manual entry for bowling load tracking
  intensity TEXT CHECK (intensity IN ('low', 'medium', 'high', 'match')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(player_id, block_id) -- a player can only be assigned once per block
);

-- 3. Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_pba_player ON sp_player_block_assignments(player_id);
CREATE INDEX IF NOT EXISTS idx_pba_session ON sp_player_block_assignments(session_id);
CREATE INDEX IF NOT EXISTS idx_pba_block ON sp_player_block_assignments(block_id);
CREATE INDEX IF NOT EXISTS idx_pba_category ON sp_player_block_assignments(category);
CREATE INDEX IF NOT EXISTS idx_players_role ON sp_players(role);
CREATE INDEX IF NOT EXISTS idx_players_active ON sp_players(is_active);

-- 4. Enable RLS
ALTER TABLE sp_player_block_assignments ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read
CREATE POLICY "pba_select" ON sp_player_block_assignments
  FOR SELECT TO authenticated USING (true);

-- Head coach and assistant coach can manage
CREATE POLICY "pba_insert" ON sp_player_block_assignments
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM sp_coaches
      WHERE sp_coaches.user_id = auth.uid()
      AND sp_coaches.role IN ('head_coach', 'assistant_coach')
    )
  );

CREATE POLICY "pba_update" ON sp_player_block_assignments
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM sp_coaches
      WHERE sp_coaches.user_id = auth.uid()
      AND sp_coaches.role IN ('head_coach', 'assistant_coach')
    )
  );

CREATE POLICY "pba_delete" ON sp_player_block_assignments
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM sp_coaches
      WHERE sp_coaches.user_id = auth.uid()
      AND sp_coaches.role IN ('head_coach', 'assistant_coach')
    )
  );

-- 5. Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE sp_player_block_assignments;

-- 6. Updated_at trigger
CREATE TRIGGER set_updated_at_pba
  BEFORE UPDATE ON sp_player_block_assignments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_updated_at_players
  BEFORE UPDATE ON sp_players
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 7. Useful view for player activity summary (aggregated)
CREATE OR REPLACE VIEW v_player_activity_summary AS
SELECT
  pba.player_id,
  p.first_name,
  p.last_name,
  p.role AS player_role,
  pba.category,
  COUNT(*) AS block_count,
  COALESCE(SUM(pba.duration_mins), 0) AS total_minutes,
  COALESCE(SUM(pba.balls_bowled), 0) AS total_balls_bowled,
  MIN(s.date) AS first_session,
  MAX(s.date) AS last_session
FROM sp_player_block_assignments pba
JOIN sp_players p ON p.id = pba.player_id
JOIN sp_sessions s ON s.id = pba.session_id
GROUP BY pba.player_id, p.first_name, p.last_name, p.role, pba.category;
