-- Create demo_attempts table to track lead generation
-- This table logs every website URL entered into the demo feature

CREATE TABLE IF NOT EXISTS demo_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Website information
  url TEXT NOT NULL,
  domain TEXT NOT NULL,

  -- Scraping results
  pages_scraped INTEGER DEFAULT 0,
  content_chunks INTEGER DEFAULT 0,
  scrape_duration_ms INTEGER,
  scrape_success BOOLEAN DEFAULT false,

  -- Tracking info
  ip_address TEXT,
  user_agent TEXT,
  session_id TEXT,

  -- Lead enrichment (for future use)
  company_name TEXT,
  industry TEXT,
  email TEXT,
  phone TEXT,

  -- Engagement metrics
  messages_sent INTEGER DEFAULT 0,
  conversation_duration_seconds INTEGER DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_message_at TIMESTAMPTZ,

  -- Indexes for queries
  CONSTRAINT demo_attempts_url_check CHECK (url ~ '^https?://')
);

-- Indexes for fast querying
CREATE INDEX idx_demo_attempts_created_at ON demo_attempts(created_at DESC);
CREATE INDEX idx_demo_attempts_domain ON demo_attempts(domain);
CREATE INDEX idx_demo_attempts_success ON demo_attempts(scrape_success);
CREATE INDEX idx_demo_attempts_ip ON demo_attempts(ip_address);

-- View for daily leads
CREATE OR REPLACE VIEW demo_leads_daily AS
SELECT
  DATE(created_at) as date,
  COUNT(*) as total_attempts,
  COUNT(*) FILTER (WHERE scrape_success = true) as successful_attempts,
  COUNT(DISTINCT domain) as unique_domains,
  COUNT(DISTINCT ip_address) as unique_visitors,
  AVG(scrape_duration_ms) as avg_scrape_time_ms,
  SUM(messages_sent) as total_messages
FROM demo_attempts
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- View for top domains
CREATE OR REPLACE VIEW demo_top_domains AS
SELECT
  domain,
  COUNT(*) as attempt_count,
  MAX(created_at) as last_attempt,
  AVG(messages_sent) as avg_messages,
  BOOL_OR(scrape_success) as ever_successful
FROM demo_attempts
GROUP BY domain
ORDER BY attempt_count DESC
LIMIT 100;

COMMENT ON TABLE demo_attempts IS 'Tracks all demo feature attempts for lead generation and marketing';
COMMENT ON COLUMN demo_attempts.url IS 'Full URL entered by user';
COMMENT ON COLUMN demo_attempts.domain IS 'Extracted domain name for grouping';
COMMENT ON COLUMN demo_attempts.ip_address IS 'User IP for tracking unique visitors';
COMMENT ON COLUMN demo_attempts.messages_sent IS 'Number of chat messages sent in this demo session';
