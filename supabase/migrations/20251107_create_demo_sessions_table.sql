-- Create demo_sessions table for storing temporary landing page chat data

CREATE TABLE IF NOT EXISTS demo_sessions (
  session_id TEXT PRIMARY KEY,
  domain TEXT NOT NULL,
  session_data JSONB NOT NULL,
  message_count INTEGER DEFAULT 0,
  max_messages INTEGER DEFAULT 20,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_demo_sessions_expires_at
  ON demo_sessions (expires_at);

CREATE INDEX IF NOT EXISTS idx_demo_sessions_domain
  ON demo_sessions (domain);

COMMENT ON TABLE demo_sessions IS 'Temporary storage for instant demo chat sessions shown on landing page';
COMMENT ON COLUMN demo_sessions.session_data IS 'Serialized session payload including chunks, embeddings, and metadata';
COMMENT ON COLUMN demo_sessions.expires_at IS 'Timestamp after which the session should be purged';
