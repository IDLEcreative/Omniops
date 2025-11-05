-- =============================================
-- Search Telemetry Tables
-- =============================================
-- Purpose: Track retry patterns, provider health, and domain lookup effectiveness
-- Created: 2025-11-05
-- Related: lib/telemetry/search-telemetry.ts

-- Provider Resolution Telemetry
-- Tracks each attempt to resolve a commerce provider (WooCommerce, Shopify)
CREATE TABLE IF NOT EXISTS provider_resolution_telemetry (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  domain TEXT NOT NULL,
  attempt INTEGER NOT NULL CHECK (attempt > 0),
  success BOOLEAN NOT NULL,
  duration_ms INTEGER NOT NULL CHECK (duration_ms >= 0),
  platform TEXT, -- 'woocommerce', 'shopify', or null if failed
  error_message TEXT,
  cache_hit BOOLEAN NOT NULL DEFAULT false,
  circuit_breaker_state TEXT NOT NULL DEFAULT 'closed' CHECK (circuit_breaker_state IN ('closed', 'open', 'half-open')),
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_provider_resolution_domain ON provider_resolution_telemetry(domain);
CREATE INDEX IF NOT EXISTS idx_provider_resolution_timestamp ON provider_resolution_telemetry(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_provider_resolution_platform ON provider_resolution_telemetry(platform) WHERE platform IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_provider_resolution_success ON provider_resolution_telemetry(success);
CREATE INDEX IF NOT EXISTS idx_provider_resolution_cache_hit ON provider_resolution_telemetry(cache_hit);

-- Domain Lookup Telemetry
-- Tracks domain resolution with various fallback methods
CREATE TABLE IF NOT EXISTS domain_lookup_telemetry (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  domain TEXT NOT NULL,
  method TEXT NOT NULL CHECK (method IN ('cache-hit', 'cache-alternative', 'direct-db-fuzzy', 'failed')),
  success BOOLEAN NOT NULL,
  duration_ms INTEGER NOT NULL CHECK (duration_ms >= 0),
  attempts_before_success INTEGER NOT NULL CHECK (attempts_before_success > 0),
  alternative_domains_tried TEXT[], -- Array of alternative domains attempted
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_domain_lookup_domain ON domain_lookup_telemetry(domain);
CREATE INDEX IF NOT EXISTS idx_domain_lookup_timestamp ON domain_lookup_telemetry(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_domain_lookup_method ON domain_lookup_telemetry(method);
CREATE INDEX IF NOT EXISTS idx_domain_lookup_success ON domain_lookup_telemetry(success);

-- Retry Pattern Telemetry
-- Aggregates retry attempts for provider resolution
CREATE TABLE IF NOT EXISTS retry_telemetry (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  domain TEXT NOT NULL,
  retry_count INTEGER NOT NULL CHECK (retry_count >= 0),
  final_success BOOLEAN NOT NULL,
  total_duration_ms INTEGER NOT NULL CHECK (total_duration_ms >= 0),
  platform TEXT, -- Final platform resolved, or null if failed
  error_message TEXT,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_retry_telemetry_domain ON retry_telemetry(domain);
CREATE INDEX IF NOT EXISTS idx_retry_telemetry_timestamp ON retry_telemetry(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_retry_telemetry_success ON retry_telemetry(final_success);
CREATE INDEX IF NOT EXISTS idx_retry_telemetry_retry_count ON retry_telemetry(retry_count);

-- Circuit Breaker Telemetry
-- Tracks circuit breaker state transitions
CREATE TABLE IF NOT EXISTS circuit_breaker_telemetry (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  circuit_name TEXT NOT NULL,
  previous_state TEXT NOT NULL CHECK (previous_state IN ('closed', 'open', 'half-open')),
  new_state TEXT NOT NULL CHECK (new_state IN ('closed', 'open', 'half-open')),
  failure_count INTEGER NOT NULL CHECK (failure_count >= 0),
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_circuit_breaker_circuit_name ON circuit_breaker_telemetry(circuit_name);
CREATE INDEX IF NOT EXISTS idx_circuit_breaker_timestamp ON circuit_breaker_telemetry(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_circuit_breaker_new_state ON circuit_breaker_telemetry(new_state);

-- Enable Row Level Security (RLS)
ALTER TABLE provider_resolution_telemetry ENABLE ROW LEVEL SECURITY;
ALTER TABLE domain_lookup_telemetry ENABLE ROW LEVEL SECURITY;
ALTER TABLE retry_telemetry ENABLE ROW LEVEL SECURITY;
ALTER TABLE circuit_breaker_telemetry ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Admin-only access
-- Telemetry data should only be accessible to admin users via service role

-- Provider Resolution Telemetry Policies
CREATE POLICY "Service role can read provider resolution telemetry"
  ON provider_resolution_telemetry
  FOR SELECT
  USING (auth.role() = 'service_role');

CREATE POLICY "Service role can insert provider resolution telemetry"
  ON provider_resolution_telemetry
  FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

-- Domain Lookup Telemetry Policies
CREATE POLICY "Service role can read domain lookup telemetry"
  ON domain_lookup_telemetry
  FOR SELECT
  USING (auth.role() = 'service_role');

CREATE POLICY "Service role can insert domain lookup telemetry"
  ON domain_lookup_telemetry
  FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

-- Retry Telemetry Policies
CREATE POLICY "Service role can read retry telemetry"
  ON retry_telemetry
  FOR SELECT
  USING (auth.role() = 'service_role');

CREATE POLICY "Service role can insert retry telemetry"
  ON retry_telemetry
  FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

-- Circuit Breaker Telemetry Policies
CREATE POLICY "Service role can read circuit breaker telemetry"
  ON circuit_breaker_telemetry
  FOR SELECT
  USING (auth.role() = 'service_role');

CREATE POLICY "Service role can insert circuit breaker telemetry"
  ON circuit_breaker_telemetry
  FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

-- Automatic cleanup: Delete telemetry data older than 30 days
-- This prevents unbounded growth of telemetry tables
CREATE OR REPLACE FUNCTION cleanup_search_telemetry()
RETURNS void AS $$
BEGIN
  DELETE FROM provider_resolution_telemetry WHERE timestamp < NOW() - INTERVAL '30 days';
  DELETE FROM domain_lookup_telemetry WHERE timestamp < NOW() - INTERVAL '30 days';
  DELETE FROM retry_telemetry WHERE timestamp < NOW() - INTERVAL '30 days';
  DELETE FROM circuit_breaker_telemetry WHERE timestamp < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comments for documentation
COMMENT ON TABLE provider_resolution_telemetry IS 'Tracks each provider resolution attempt with timing and success metrics';
COMMENT ON TABLE domain_lookup_telemetry IS 'Tracks domain lookup methods and fallback effectiveness';
COMMENT ON TABLE retry_telemetry IS 'Aggregates retry patterns for provider resolution';
COMMENT ON TABLE circuit_breaker_telemetry IS 'Tracks circuit breaker state transitions to prevent cascading failures';
COMMENT ON FUNCTION cleanup_search_telemetry IS 'Removes telemetry data older than 30 days to prevent unbounded growth';
