-- ============================================================
-- Create sp_players table for player roster tracking
-- Each player has squad_ids[] linking them to session groups
-- ============================================================

CREATE TABLE sp_players (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  program_id UUID REFERENCES sp_programs(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  squad_ids UUID[] DEFAULT '{}',
  cricket_type TEXT CHECK (cricket_type IN ('male', 'female')),
  dob DATE,
  club TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_sp_players_program ON sp_players(program_id);

-- Enable RLS
ALTER TABLE sp_players ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sp_players_select" ON sp_players
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "sp_players_insert" ON sp_players
  FOR INSERT WITH CHECK (user_is_head_coach());

CREATE POLICY "sp_players_update" ON sp_players
  FOR UPDATE USING (user_is_head_coach());

CREATE POLICY "sp_players_delete" ON sp_players
  FOR DELETE USING (user_is_head_coach());

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE sp_players;
