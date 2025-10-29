-- ROLLBACK MIGRATION
-- File: 20251029_rollback_chat_table_removal.sql
-- Purpose: Restore chat_sessions and chat_messages tables if removal causes issues
-- Only run this if the removal migration (20251029_remove_duplicate_chat_tables.sql) needs to be reverted
--
-- Note: This is a safety net. Do not apply unless the removal migration caused actual problems.
-- The tables are not actively used by the application.

-- Recreate the update timestamp trigger function (if it doesn't exist)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate chat_sessions table
CREATE TABLE IF NOT EXISTS chat_sessions (
  session_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  title TEXT,
  session_metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  message_count INTEGER DEFAULT 0,
  last_message_at TIMESTAMPTZ,
  context_summary TEXT
);

-- Recreate chat_messages table
CREATE TABLE IF NOT EXISTS chat_messages (
  message_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES chat_sessions(session_id) ON DELETE CASCADE,
  user_id UUID,
  role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  sequence_number INTEGER NOT NULL,
  token_count INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Recreate indexes for performance
CREATE INDEX IF NOT EXISTS idx_chat_sessions_user_id ON chat_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_created_at ON chat_sessions(created_at);
CREATE INDEX IF NOT EXISTS idx_chat_messages_session_id ON chat_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_sequence ON chat_messages(session_id, sequence_number);

-- Enable RLS on both tables
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Recreate RLS policies for chat_sessions
CREATE POLICY "Enable read access for all users" ON chat_sessions
  FOR SELECT USING (true);

CREATE POLICY "Enable insert for all users" ON chat_sessions
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update for all users" ON chat_sessions
  FOR UPDATE USING (true);

-- Recreate RLS policies for chat_messages
CREATE POLICY "Enable read access for all users" ON chat_messages
  FOR SELECT USING (true);

CREATE POLICY "Enable insert for all users" ON chat_messages
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update for all users" ON chat_messages
  FOR UPDATE USING (true);

-- Recreate triggers for automatic timestamp updates
CREATE TRIGGER update_chat_sessions_updated_at BEFORE UPDATE ON chat_sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_chat_messages_updated_at BEFORE UPDATE ON chat_messages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Verification message
DO $$
BEGIN
  RAISE NOTICE 'ROLLBACK COMPLETE: chat_sessions and chat_messages tables have been restored';
  RAISE NOTICE 'Note: These tables remain deprecated. Recommend re-applying removal after investigation.';
END $$;
