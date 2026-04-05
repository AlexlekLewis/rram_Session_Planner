-- ============================================================
-- AI Coach Memory System
-- Conversation history + Coaching knowledge base
-- ============================================================

-- Conversation threads (one per chat session)
CREATE TABLE sp_assistant_threads (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  title TEXT, -- Auto-generated from first message
  session_id UUID REFERENCES sp_sessions(id) ON DELETE SET NULL, -- If started from a specific session
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Individual messages in a thread
CREATE TABLE sp_assistant_messages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  thread_id UUID REFERENCES sp_assistant_threads(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  tool_calls JSONB DEFAULT '[]', -- Stored tool calls for audit trail
  actions_applied BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Coaching knowledge base — persistent memory
-- The AI reads this on every conversation and can add to it
CREATE TABLE sp_coaching_knowledge (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  category TEXT NOT NULL CHECK (category IN (
    'coaching_philosophy', -- How the coach approaches training
    'player_note',         -- Notes about specific players
    'drill_feedback',      -- What worked/didn't work for specific drills
    'session_template',    -- Preferred session structures
    'program_decision',    -- Key decisions made about the program
    'preference',          -- General preferences (e.g., "always start with Daily Vitamins")
    'rule',                -- Rules to always follow (e.g., "max 3 balls per batter")
    'learning'             -- Things learned from experience
  )),
  title TEXT NOT NULL,      -- Short description for the AI to scan
  content TEXT NOT NULL,    -- Full detail
  tags TEXT[] DEFAULT '{}', -- Searchable tags
  created_by UUID REFERENCES auth.users(id),
  source TEXT,              -- Where this knowledge came from (e.g., "conversation on 2026-04-05")
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_sp_threads_user ON sp_assistant_threads(user_id);
CREATE INDEX idx_sp_messages_thread ON sp_assistant_messages(thread_id);
CREATE INDEX idx_sp_knowledge_category ON sp_coaching_knowledge(category);
CREATE INDEX idx_sp_knowledge_active ON sp_coaching_knowledge(is_active) WHERE is_active = true;

-- Triggers
CREATE TRIGGER sp_threads_updated_at BEFORE UPDATE ON sp_assistant_threads FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER sp_knowledge_updated_at BEFORE UPDATE ON sp_coaching_knowledge FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS
ALTER TABLE sp_assistant_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE sp_assistant_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE sp_coaching_knowledge ENABLE ROW LEVEL SECURITY;

-- Coaches can manage their own threads
CREATE POLICY "sp_threads_select" ON sp_assistant_threads FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "sp_threads_insert" ON sp_assistant_threads FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "sp_threads_delete" ON sp_assistant_threads FOR DELETE USING (user_id = auth.uid());

-- Messages follow thread access
CREATE POLICY "sp_messages_select" ON sp_assistant_messages FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "sp_messages_insert" ON sp_assistant_messages FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Knowledge base — all coaches can read, head_coach + assistant can write
CREATE POLICY "sp_knowledge_select" ON sp_coaching_knowledge FOR SELECT USING (user_is_sp_coach());
CREATE POLICY "sp_knowledge_insert" ON sp_coaching_knowledge FOR INSERT WITH CHECK (user_can_edit_sessions());
CREATE POLICY "sp_knowledge_update" ON sp_coaching_knowledge FOR UPDATE USING (user_can_edit_sessions());
CREATE POLICY "sp_knowledge_delete" ON sp_coaching_knowledge FOR DELETE USING (user_is_head_coach());
