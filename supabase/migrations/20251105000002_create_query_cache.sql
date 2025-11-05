-- Migration: Create query_cache table for search result caching
-- Created: 2025-11-05
-- Purpose: Cache expensive search queries to improve performance and reduce costs

-- Create query_cache table
CREATE TABLE IF NOT EXISTS query_cache (
  -- Identity
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  domain_id UUID REFERENCES domains(id) ON DELETE CASCADE,

  -- Query identification
  query_hash TEXT NOT NULL,
  query_text TEXT,

  -- Cached data
  results JSONB NOT NULL,

  -- Usage tracking
  hit_count INTEGER DEFAULT 0,

  -- Expiration
  expires_at TIMESTAMPTZ NOT NULL,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Ensure unique query per domain
  UNIQUE(domain_id, query_hash)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_query_cache_domain_id
  ON query_cache(domain_id);

CREATE INDEX IF NOT EXISTS idx_query_cache_query_hash
  ON query_cache(query_hash);

CREATE INDEX IF NOT EXISTS idx_query_cache_expires_at
  ON query_cache(expires_at);

CREATE INDEX IF NOT EXISTS idx_query_cache_created_at
  ON query_cache(created_at DESC);

-- Composite index for cache lookups
CREATE INDEX IF NOT EXISTS idx_query_cache_domain_hash_expires
  ON query_cache(domain_id, query_hash, expires_at);

-- Index for hit count analytics
CREATE INDEX IF NOT EXISTS idx_query_cache_hit_count
  ON query_cache(hit_count DESC)
  WHERE hit_count > 0;

-- Enable Row Level Security
ALTER TABLE query_cache ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Service role has full access
CREATE POLICY query_cache_service_role_policy ON query_cache
  USING (auth.jwt()->>'role' = 'service_role');

-- RLS Policy: Users can view cache entries for their organization's domains
CREATE POLICY query_cache_select_policy ON query_cache
  FOR SELECT
  USING (
    domain_id IN (
      SELECT id FROM domains
      WHERE organization_id IN (
        SELECT organization_id
        FROM organization_members
        WHERE user_id = auth.uid()
      )
    )
  );

-- RLS Policy: Users can insert cache entries for their organization's domains
CREATE POLICY query_cache_insert_policy ON query_cache
  FOR INSERT
  WITH CHECK (
    domain_id IN (
      SELECT id FROM domains
      WHERE organization_id IN (
        SELECT organization_id
        FROM organization_members
        WHERE user_id = auth.uid()
      )
    )
  );

-- RLS Policy: Users can update cache entries (for hit_count) for their organization's domains
CREATE POLICY query_cache_update_policy ON query_cache
  FOR UPDATE
  USING (
    domain_id IN (
      SELECT id FROM domains
      WHERE organization_id IN (
        SELECT organization_id
        FROM organization_members
        WHERE user_id = auth.uid()
      )
    )
  );

-- RLS Policy: Users can delete expired cache entries for their organization's domains
CREATE POLICY query_cache_delete_policy ON query_cache
  FOR DELETE
  USING (
    domain_id IN (
      SELECT id FROM domains
      WHERE organization_id IN (
        SELECT organization_id
        FROM organization_members
        WHERE user_id = auth.uid()
      )
    )
  );

-- Create function to cleanup expired cache entries
CREATE OR REPLACE FUNCTION cleanup_expired_query_cache()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM query_cache
  WHERE expires_at < NOW();

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION cleanup_expired_query_cache() IS 'Removes expired cache entries and returns count of deleted rows';

-- Create function to get cache statistics
CREATE OR REPLACE FUNCTION get_query_cache_stats(p_domain_id UUID DEFAULT NULL)
RETURNS TABLE (
  total_entries BIGINT,
  active_entries BIGINT,
  expired_entries BIGINT,
  total_hits BIGINT,
  avg_hits NUMERIC,
  cache_size_bytes BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::BIGINT as total_entries,
    COUNT(*) FILTER (WHERE expires_at > NOW())::BIGINT as active_entries,
    COUNT(*) FILTER (WHERE expires_at <= NOW())::BIGINT as expired_entries,
    SUM(hit_count)::BIGINT as total_hits,
    AVG(hit_count) as avg_hits,
    SUM(pg_column_size(results))::BIGINT as cache_size_bytes
  FROM query_cache
  WHERE p_domain_id IS NULL OR domain_id = p_domain_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_query_cache_stats(UUID) IS 'Returns cache statistics for all domains or a specific domain';

-- Create trigger to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_query_cache_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER query_cache_updated_at_trigger
  BEFORE UPDATE ON query_cache
  FOR EACH ROW
  EXECUTE FUNCTION update_query_cache_updated_at();

-- Add helpful comments
COMMENT ON TABLE query_cache IS 'Caches expensive search query results to improve performance and reduce API costs';
COMMENT ON COLUMN query_cache.domain_id IS 'Reference to domains table for multi-tenant cache isolation';
COMMENT ON COLUMN query_cache.query_hash IS 'SHA-256 hash of normalized query for fast lookup';
COMMENT ON COLUMN query_cache.query_text IS 'Original query text (optional, for debugging and analytics)';
COMMENT ON COLUMN query_cache.results IS 'Cached query results as JSONB';
COMMENT ON COLUMN query_cache.hit_count IS 'Number of times this cached result has been returned (incremented on cache hit)';
COMMENT ON COLUMN query_cache.expires_at IS 'When this cache entry expires and should be removed';

-- Note: Automatic cleanup can be scheduled using pg_cron extension:
-- SELECT cron.schedule('cleanup-query-cache', '0 * * * *', 'SELECT cleanup_expired_query_cache()');
-- This would run the cleanup function every hour
