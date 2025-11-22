-- =====================================================================
-- Supabase Optimizations - Working Subset
-- =====================================================================
-- Only includes optimizations that match actual database schema
--
-- SKIPPED:
-- - Migration #3: RLS optimization (RAISE statement issues)
-- - Migration #4-5: Conversation analytics (columns don't exist)
--
-- INCLUDED:
-- - Telemetry materialized views (chat_telemetry table exists)
-- - Telemetry indexes
-- =====================================================================

-- =====================================================================
-- PART 1: TELEMETRY ROLLUP INDEXES
-- =====================================================================

-- Index for time-range queries on base rollups
CREATE INDEX IF NOT EXISTS idx_chat_telemetry_rollups_bucket_granularity
ON chat_telemetry_rollups(bucket_start DESC, granularity)
WHERE granularity = 'hour' OR granularity = 'day';

-- Index for domain rollups - cost analysis
CREATE INDEX IF NOT EXISTS idx_chat_telemetry_domain_rollups_cost
ON chat_telemetry_domain_rollups(domain, bucket_start DESC, total_cost_usd DESC);

-- Index for model rollups - performance
CREATE INDEX IF NOT EXISTS idx_chat_telemetry_model_rollups_perf
ON chat_telemetry_model_rollups(model, bucket_start DESC, avg_duration_ms);

-- =====================================================================
-- PART 2: DOMAIN SUMMARY MATERIALIZED VIEW
-- =====================================================================

CREATE MATERIALIZED VIEW IF NOT EXISTS chat_telemetry_domain_summary AS
SELECT
  domain,
  COUNT(*) as total_requests_all_time,
  SUM(CASE WHEN success THEN 1 ELSE 0 END) as successful_requests_all_time,
  ROUND((SUM(CASE WHEN success THEN 1 ELSE 0 END)::NUMERIC / NULLIF(COUNT(*), 0)) * 100, 2) as success_rate_pct,
  SUM(COALESCE(cost_usd, 0)) as total_cost_usd_all_time,
  AVG(COALESCE(cost_usd, 0)) as avg_cost_per_request,
  MAX(cost_usd) as max_cost_single_request,
  SUM(COALESCE(input_tokens, 0)) as total_input_tokens,
  SUM(COALESCE(output_tokens, 0)) as total_output_tokens,
  SUM(COALESCE(total_tokens, 0)) as total_tokens,
  AVG(COALESCE(total_tokens, 0)) as avg_tokens_per_request,
  AVG(duration_ms) as avg_duration_ms,
  PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY duration_ms) as median_duration_ms,
  PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY duration_ms) as p95_duration_ms,
  MAX(duration_ms) as max_duration_ms,
  AVG(search_count) as avg_searches_per_request,
  SUM(search_count) as total_searches,
  AVG(iterations) as avg_iterations_per_request,
  MODE() WITHIN GROUP (ORDER BY model) as most_used_model,
  COUNT(DISTINCT model) as unique_models_used,
  MIN(created_at) as first_request_at,
  MAX(created_at) as last_request_at,
  CURRENT_TIMESTAMP as materialized_at
FROM chat_telemetry
WHERE domain IS NOT NULL AND TRIM(domain) != ''
GROUP BY domain;

CREATE UNIQUE INDEX IF NOT EXISTS idx_chat_telemetry_domain_summary_domain
ON chat_telemetry_domain_summary(domain);

CREATE INDEX IF NOT EXISTS idx_chat_telemetry_domain_summary_cost
ON chat_telemetry_domain_summary(total_cost_usd_all_time DESC);

GRANT SELECT ON chat_telemetry_domain_summary TO authenticated;

COMMENT ON MATERIALIZED VIEW chat_telemetry_domain_summary IS
'Pre-aggregated domain-level summary statistics from chat_telemetry. Refresh hourly.';

-- =====================================================================
-- PART 3: MODEL SUMMARY MATERIALIZED VIEW
-- =====================================================================

CREATE MATERIALIZED VIEW IF NOT EXISTS chat_telemetry_model_summary AS
SELECT
  model,
  COUNT(*) as total_uses,
  COUNT(DISTINCT domain) as unique_domains,
  SUM(CASE WHEN success THEN 1 ELSE 0 END) as successful_requests,
  ROUND((SUM(CASE WHEN success THEN 1 ELSE 0 END)::NUMERIC / NULLIF(COUNT(*), 0)) * 100, 2) as success_rate_pct,
  SUM(COALESCE(cost_usd, 0)) as total_cost,
  AVG(COALESCE(cost_usd, 0)) as avg_cost_per_request,
  SUM(COALESCE(cost_usd, 0)) / NULLIF(SUM(COALESCE(total_tokens, 0)), 0) as cost_per_1k_tokens,
  AVG(duration_ms) as avg_duration_ms,
  PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY duration_ms) as p95_duration_ms,
  AVG(COALESCE(total_tokens, 0)) as avg_tokens_per_request,
  AVG(COALESCE(input_tokens, 0)) as avg_input_tokens,
  AVG(COALESCE(output_tokens, 0)) as avg_output_tokens,
  SUM(COALESCE(total_tokens, 0)) as total_tokens,
  AVG(search_count) as avg_searches_per_request,
  AVG(iterations) as avg_iterations_per_request,
  MIN(created_at) as first_used_at,
  MAX(created_at) as last_used_at,
  CURRENT_TIMESTAMP as materialized_at
FROM chat_telemetry
WHERE model IS NOT NULL AND TRIM(model) != ''
GROUP BY model;

CREATE UNIQUE INDEX IF NOT EXISTS idx_chat_telemetry_model_summary_model
ON chat_telemetry_model_summary(model);

CREATE INDEX IF NOT EXISTS idx_chat_telemetry_model_summary_cost
ON chat_telemetry_model_summary(total_cost DESC);

CREATE INDEX IF NOT EXISTS idx_chat_telemetry_model_summary_performance
ON chat_telemetry_model_summary(avg_duration_ms ASC);

GRANT SELECT ON chat_telemetry_model_summary TO authenticated;

COMMENT ON MATERIALIZED VIEW chat_telemetry_model_summary IS
'Pre-aggregated model performance statistics. Refresh daily.';

-- =====================================================================
-- PART 4: REFRESH FUNCTION
-- =====================================================================

CREATE OR REPLACE FUNCTION refresh_telemetry_summary_views()
RETURNS TABLE(view_name text, refresh_time_ms numeric, status text) AS $$
DECLARE
  start_time timestamp;
  end_time timestamp;
BEGIN
  start_time := clock_timestamp();
  BEGIN
    REFRESH MATERIALIZED VIEW chat_telemetry_domain_summary;
    end_time := clock_timestamp();
    RETURN QUERY SELECT
      'chat_telemetry_domain_summary'::text,
      EXTRACT(EPOCH FROM (end_time - start_time)) * 1000,
      'SUCCESS'::text;
  EXCEPTION WHEN OTHERS THEN
    RETURN QUERY SELECT
      'chat_telemetry_domain_summary'::text,
      -1::numeric,
      SQLERRM::text;
  END;

  start_time := clock_timestamp();
  BEGIN
    REFRESH MATERIALIZED VIEW chat_telemetry_model_summary;
    end_time := clock_timestamp();
    RETURN QUERY SELECT
      'chat_telemetry_model_summary'::text,
      EXTRACT(EPOCH FROM (end_time - start_time)) * 1000,
      'SUCCESS'::text;
  EXCEPTION WHEN OTHERS THEN
    RETURN QUERY SELECT
      'chat_telemetry_model_summary'::text,
      -1::numeric,
      SQLERRM::text;
  END;
END;
$$ LANGUAGE plpgsql;

GRANT EXECUTE ON FUNCTION refresh_telemetry_summary_views() TO service_role;

COMMENT ON FUNCTION refresh_telemetry_summary_views() IS
'Refreshes chat_telemetry summary materialized views. Returns timing and status.';

-- =====================================================================
-- PART 5: INITIAL REFRESH
-- =====================================================================

REFRESH MATERIALIZED VIEW chat_telemetry_domain_summary;
REFRESH MATERIALIZED VIEW chat_telemetry_model_summary;
