-- Create analytics_events table for real-time tracking
-- This table stores real-time events for the analytics dashboard

-- Enable UUID generation if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create analytics_events table
CREATE TABLE IF NOT EXISTS analytics_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_type TEXT NOT NULL CHECK (event_type IN (
    'session_started',
    'session_ended',
    'message_sent',
    'message_received',
    'response_completed',
    'error_occurred',
    'search_performed',
    'connection_established',
    'connection_closed'
  )),
  session_id TEXT,
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  domain_id UUID REFERENCES domains(id) ON DELETE CASCADE,
  data JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_analytics_events_created
  ON analytics_events(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_analytics_events_type
  ON analytics_events(event_type);

CREATE INDEX IF NOT EXISTS idx_analytics_events_session
  ON analytics_events(session_id)
  WHERE session_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_analytics_events_conversation
  ON analytics_events(conversation_id)
  WHERE conversation_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_analytics_events_domain
  ON analytics_events(domain_id)
  WHERE domain_id IS NOT NULL;

-- GIN index for JSONB data queries
CREATE INDEX IF NOT EXISTS idx_analytics_events_data_gin
  ON analytics_events USING gin(data);

-- Enable Row Level Security
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;

-- RLS policy: Allow service role full access
CREATE POLICY "Service role has full access to analytics_events"
  ON analytics_events
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- RLS policy: Allow authenticated users to read their domain's events
CREATE POLICY "Users can read their domain analytics events"
  ON analytics_events
  FOR SELECT
  USING (
    auth.uid() IN (
      SELECT user_id FROM organization_members
      WHERE organization_id IN (
        SELECT organization_id FROM domains
        WHERE id = analytics_events.domain_id
      )
    )
  );

-- Function to clean up old events (older than 30 days)
CREATE OR REPLACE FUNCTION cleanup_old_analytics_events()
RETURNS void AS $$
BEGIN
  DELETE FROM analytics_events
  WHERE created_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;

-- Comment the table for documentation
COMMENT ON TABLE analytics_events IS 'Stores real-time analytics events for dashboard metrics';
COMMENT ON COLUMN analytics_events.event_type IS 'Type of analytics event';
COMMENT ON COLUMN analytics_events.session_id IS 'Session identifier from conversations';
COMMENT ON COLUMN analytics_events.data IS 'Additional event data (response_time_ms, tokens_used, etc.)';

-- Grant permissions for Supabase realtime
GRANT ALL ON analytics_events TO postgres, anon, authenticated, service_role;