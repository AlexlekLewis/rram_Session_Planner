-- ============================================================
-- RRA Session Planner — Complete Schema (Fresh Project)
-- Run this on a brand new Supabase project: rrfghjhzdevmzzttvith
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- 1. PROGRAMS (one per year/season)
-- ============================================================
CREATE TABLE sp_programs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 2. PHASES within a program
-- ============================================================
CREATE TABLE sp_phases (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  program_id UUID REFERENCES sp_programs(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  goals JSONB DEFAULT '[]',
  sort_order INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 3. VENUES
-- ============================================================
CREATE TABLE sp_venues (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  short_name TEXT,
  address TEXT,
  lanes JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 4. SQUADS
-- ============================================================
CREATE TABLE sp_squads (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  program_id UUID REFERENCES sp_programs(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  colour TEXT NOT NULL,
  description TEXT,
  session_days JSONB,
  max_players INTEGER DEFAULT 12,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 5. COACHES (users with coach roles)
-- ============================================================
CREATE TABLE sp_coaches (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  name TEXT NOT NULL,
  email TEXT,
  role TEXT NOT NULL CHECK (role IN ('head_coach', 'assistant_coach', 'guest_coach', 'player')),
  speciality TEXT,
  bio TEXT,
  avatar_url TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 6. SESSIONS (individual training sessions)
-- ============================================================
CREATE TABLE sp_sessions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  program_id UUID REFERENCES sp_programs(id) ON DELETE CASCADE,
  phase_id UUID REFERENCES sp_phases(id),
  venue_id UUID REFERENCES sp_venues(id),
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  squad_ids UUID[] DEFAULT '{}',
  specialist_coaches JSONB DEFAULT '[]',
  theme TEXT,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'completed')),
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 7. ACTIVITIES LIBRARY (with R/P/E/G tier system)
-- ============================================================
CREATE TABLE sp_activities (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  sub_category TEXT,
  description TEXT,
  regression JSONB DEFAULT '{}',
  progression JSONB DEFAULT '{}',
  elite JSONB DEFAULT '{}',
  gamify JSONB DEFAULT '{}',
  default_duration_mins INTEGER DEFAULT 15,
  default_lanes INTEGER DEFAULT 1,
  equipment JSONB DEFAULT '[]',
  tags TEXT[] DEFAULT '{}',
  youtube_reference TEXT,
  constraints_cla TEXT,
  coaching_framework JSONB DEFAULT '{}',
  max_balls_per_batter INTEGER,
  between_sets_activity TEXT,
  created_by UUID REFERENCES auth.users(id),
  is_global BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 8. SESSION BLOCKS (the core — individual blocks on the grid)
-- ============================================================
CREATE TABLE sp_session_blocks (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  session_id UUID REFERENCES sp_sessions(id) ON DELETE CASCADE,
  activity_id UUID REFERENCES sp_activities(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  lane_start INTEGER NOT NULL CHECK (lane_start >= 1 AND lane_start <= 8),
  lane_end INTEGER NOT NULL CHECK (lane_end >= 1 AND lane_end <= 8),
  time_start TIME NOT NULL,
  time_end TIME NOT NULL,
  colour TEXT DEFAULT '#3B82F6',
  category TEXT DEFAULT 'other',
  tier TEXT DEFAULT 'R' CHECK (tier IN ('R', 'P', 'E', 'G')),
  other_location TEXT,
  coaching_notes TEXT,
  coaching_points JSONB DEFAULT '[]',
  player_groups JSONB DEFAULT '[]',
  equipment JSONB DEFAULT '[]',
  coach_assigned TEXT,
  sort_order INTEGER DEFAULT 0,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT valid_lane_range CHECK (lane_end >= lane_start),
  CONSTRAINT valid_time_range CHECK (time_end > time_start)
);

-- ============================================================
-- INDEXES for performance
-- ============================================================
CREATE INDEX idx_sp_sessions_date ON sp_sessions(date);
CREATE INDEX idx_sp_sessions_program ON sp_sessions(program_id);
CREATE INDEX idx_sp_sessions_phase ON sp_sessions(phase_id);
CREATE INDEX idx_sp_session_blocks_session ON sp_session_blocks(session_id);
CREATE INDEX idx_sp_session_blocks_activity ON sp_session_blocks(activity_id);
CREATE INDEX idx_sp_activities_category ON sp_activities(category);
CREATE INDEX idx_sp_phases_program ON sp_phases(program_id);
CREATE INDEX idx_sp_squads_program ON sp_squads(program_id);
CREATE INDEX idx_sp_coaches_user ON sp_coaches(user_id);

-- ============================================================
-- UPDATED_AT trigger (auto-update timestamp on row modification)
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER sp_programs_updated_at BEFORE UPDATE ON sp_programs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER sp_phases_updated_at BEFORE UPDATE ON sp_phases FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER sp_sessions_updated_at BEFORE UPDATE ON sp_sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER sp_session_blocks_updated_at BEFORE UPDATE ON sp_session_blocks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER sp_activities_updated_at BEFORE UPDATE ON sp_activities FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- ENABLE REALTIME on session_blocks and sessions
-- ============================================================
ALTER PUBLICATION supabase_realtime ADD TABLE sp_session_blocks;
ALTER PUBLICATION supabase_realtime ADD TABLE sp_sessions;
