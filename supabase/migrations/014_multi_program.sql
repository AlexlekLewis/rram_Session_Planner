-- ============================================================
-- Multi-Program Support — Schema Changes
-- Adds sp_program_members junction table for program-scoped roles
-- Adds program_id to sp_activities for program-specific activities
-- Adds sp_program_invites for invite/onboarding flow
-- ============================================================

-- ============================================================
-- 1. PROGRAM MEMBERS (program-scoped role assignments)
-- Replaces the global sp_coaches role model with per-program membership
-- ============================================================
CREATE TABLE sp_program_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  program_id UUID NOT NULL REFERENCES sp_programs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('head_coach', 'assistant_coach', 'guest_coach', 'player')),
  invited_by UUID REFERENCES auth.users(id),
  invited_at TIMESTAMPTZ DEFAULT now(),
  accepted_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('invited', 'active', 'inactive')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(program_id, user_id)
);

-- ============================================================
-- 2. PROGRAM INVITES (token-based onboarding)
-- ============================================================
CREATE TABLE sp_program_invites (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  program_id UUID NOT NULL REFERENCES sp_programs(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  email TEXT,
  role TEXT NOT NULL DEFAULT 'player' CHECK (role IN ('head_coach', 'assistant_coach', 'guest_coach', 'player')),
  invited_by UUID NOT NULL REFERENCES auth.users(id),
  accepted_by UUID REFERENCES auth.users(id),
  accepted_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ DEFAULT (now() + interval '30 days'),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 3. ADD program_id TO ACTIVITIES (null = global/shared)
-- ============================================================
ALTER TABLE sp_activities ADD COLUMN IF NOT EXISTS program_id UUID REFERENCES sp_programs(id) ON DELETE CASCADE;

-- ============================================================
-- 4. MIGRATE EXISTING COACHES TO PROGRAM MEMBERS
-- Assigns all active coaches with user_id to the first (current) program
-- ============================================================
INSERT INTO sp_program_members (program_id, user_id, role, status, accepted_at)
SELECT
  (SELECT id FROM sp_programs ORDER BY created_at ASC LIMIT 1),
  c.user_id,
  c.role,
  'active',
  now()
FROM sp_coaches c
WHERE c.is_active = true
  AND c.user_id IS NOT NULL
ON CONFLICT (program_id, user_id) DO NOTHING;

-- ============================================================
-- 5. INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_program_members_user ON sp_program_members(user_id);
CREATE INDEX IF NOT EXISTS idx_program_members_program ON sp_program_members(program_id);
CREATE INDEX IF NOT EXISTS idx_program_members_status ON sp_program_members(status);
CREATE INDEX IF NOT EXISTS idx_activities_program ON sp_activities(program_id);
CREATE INDEX IF NOT EXISTS idx_program_invites_token ON sp_program_invites(token);
CREATE INDEX IF NOT EXISTS idx_program_invites_program ON sp_program_invites(program_id);

-- ============================================================
-- 6. UPDATED_AT TRIGGER
-- ============================================================
CREATE TRIGGER sp_program_members_updated_at
  BEFORE UPDATE ON sp_program_members
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- 7. ENABLE RLS
-- ============================================================
ALTER TABLE sp_program_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE sp_program_invites ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 8. ENABLE REALTIME on program_members (for live member updates)
-- ============================================================
ALTER PUBLICATION supabase_realtime ADD TABLE sp_program_members;
