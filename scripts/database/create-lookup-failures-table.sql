-- Table for tracking failed product/order lookups
CREATE TABLE IF NOT EXISTS lookup_failures (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  query TEXT NOT NULL,
  query_type TEXT NOT NULL CHECK (query_type IN ('sku', 'product_name', 'order_id', 'unknown')),
  error_type TEXT NOT NULL CHECK (error_type IN ('not_found', 'api_error', 'timeout', 'invalid_input')),
  platform TEXT NOT NULL,
  suggestions TEXT[] DEFAULT '{}',
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  domain_id UUID REFERENCES customer_configs(id) ON DELETE CASCADE,
  session_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_lookup_failures_timestamp ON lookup_failures(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_lookup_failures_domain ON lookup_failures(domain_id);
CREATE INDEX IF NOT EXISTS idx_lookup_failures_query ON lookup_failures(query);
CREATE INDEX IF NOT EXISTS idx_lookup_failures_error_type ON lookup_failures(error_type);

-- RLS Policies (allow service role to write, admins to read)
ALTER TABLE lookup_failures ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can insert lookup failures"
ON lookup_failures FOR INSERT
TO service_role
WITH CHECK (true);

CREATE POLICY "Service role can view all lookup failures"
ON lookup_failures FOR SELECT
TO service_role
USING (true);
