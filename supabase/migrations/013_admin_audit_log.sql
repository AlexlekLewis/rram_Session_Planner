-- ============================================================
-- Admin Audit Log — tracks all admin AI tool executions
-- ============================================================

-- Check if user_is_head_coach function exists first, if not create it
-- (it may already exist from the RLS policies)

CREATE TABLE IF NOT EXISTS sp_admin_audit_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  tool_name TEXT NOT NULL,
  input JSONB NOT NULL DEFAULT '{}',
  result TEXT,
  affected_records INTEGER DEFAULT 0,
  thread_id UUID REFERENCES sp_assistant_threads(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_admin_audit_user ON sp_admin_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_created ON sp_admin_audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_audit_tool ON sp_admin_audit_log(tool_name);

-- RLS: only head coaches can view/insert audit log
ALTER TABLE sp_admin_audit_log ENABLE ROW LEVEL SECURITY;

-- Need to check if the function user_is_head_coach exists, create if not
-- Use the sp_coaches table to check role
CREATE OR REPLACE FUNCTION user_is_sp_head_coach()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM sp_coaches
    WHERE user_id = auth.uid()
    AND role = 'head_coach'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE POLICY "audit_select" ON sp_admin_audit_log
  FOR SELECT TO authenticated
  USING (user_is_sp_head_coach());

CREATE POLICY "audit_insert" ON sp_admin_audit_log
  FOR INSERT TO authenticated
  WITH CHECK (user_is_sp_head_coach());

-- Enable realtime for audit log (optional, for live dashboard)
ALTER PUBLICATION supabase_realtime ADD TABLE sp_admin_audit_log;
