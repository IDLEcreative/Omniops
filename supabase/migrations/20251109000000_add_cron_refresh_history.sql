-- Track all scheduled refresh runs
CREATE TABLE IF NOT EXISTS cron_refresh_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL CHECK (status IN ('running', 'completed', 'failed')),
  domains_processed INTEGER DEFAULT 0,
  domains_failed INTEGER DEFAULT 0,
  pages_refreshed INTEGER DEFAULT 0,
  total_duration_ms INTEGER,
  error_message TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Index for quick status lookups
CREATE INDEX idx_cron_history_status ON cron_refresh_history(status, started_at DESC);
CREATE INDEX idx_cron_history_started ON cron_refresh_history(started_at DESC);

-- Enable RLS
ALTER TABLE cron_refresh_history ENABLE ROW LEVEL SECURITY;

-- Allow service role full access
CREATE POLICY "Service role can manage cron history"
  ON cron_refresh_history
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
