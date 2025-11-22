-- Manual Supabase Optimizations Application
-- Combines migrations #3, #4, #5 with fixes for problematic sections

-- =====================================================================
-- FROM MIGRATION #3: Telemetry Analytics Optimization
-- =====================================================================

-- Add composite indexes for common dashboard query patterns
CREATE INDEX IF NOT EXISTS idx_chat_telemetry_rollups_bucket_granularity
ON chat_telemetry_rollups(bucket_start DESC, granularity)
WHERE granularity = 'hour' OR granularity = 'day';

-- REMOVED: idx_chat_telemetry_rollups_recent (used NOW() which isn't IMMUTABLE)

-- Index for domain rollups - cost analysis by domain + time
CREATE INDEX IF NOT EXISTS idx_chat_telemetry_domain_rollups_cost
ON chat_telemetry_domain_rollups(domain, bucket_start DESC, total_cost_usd DESC);

-- Index for model rollups - performance by model
CREATE INDEX IF NOT EXISTS idx_chat_telemetry_model_rollups_perf
ON chat_telemetry_model_rollups(model, bucket_start DESC, avg_duration_ms);

-- Domain Summary Materialized View (without NOW() in aggregations)
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

-- Model Summary Materialized View
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

-- Refresh function
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

-- Refresh initial data
REFRESH MATERIALIZED VIEW chat_telemetry_domain_summary;
REFRESH MATERIALIZED VIEW chat_telemetry_model_summary;

-- =====================================================================
-- FROM MIGRATION #4: Additional Analytics Materialized Views
-- =====================================================================

-- Conversation Analytics Summary
CREATE MATERIALIZED VIEW IF NOT EXISTS conversation_analytics_summary AS
SELECT
  DATE(c.started_at) as date,
  d.domain,
  COUNT(*) as total_conversations,
  COUNT(*) FILTER (WHERE c.status = 'active') as active_conversations,
  COUNT(*) FILTER (WHERE c.status = 'waiting') as waiting_conversations,
  COUNT(*) FILTER (WHERE c.status = 'resolved') as resolved_conversations,
  AVG(EXTRACT(EPOCH FROM (c.last_message_at - c.started_at)) / 60) as avg_duration_minutes,
  AVG(c.satisfaction_score) FILTER (WHERE c.satisfaction_score IS NOT NULL) as avg_satisfaction_score,
  COUNT(*) FILTER (WHERE c.satisfaction_score IS NOT NULL) as rated_conversations,
  CURRENT_TIMESTAMP as materialized_at
FROM conversations c
JOIN domains d ON d.id = c.domain_id
WHERE c.started_at >= CURRENT_DATE - INTERVAL '90 days'
GROUP BY DATE(c.started_at), d.domain
ORDER BY date DESC, d.domain;

CREATE INDEX IF NOT EXISTS idx_conversation_analytics_summary_date_domain
  ON conversation_analytics_summary(date DESC, domain);

CREATE INDEX IF NOT EXISTS idx_conversation_analytics_summary_domain_date
  ON conversation_analytics_summary(domain, date DESC);

GRANT SELECT ON conversation_analytics_summary TO service_role;

-- Conversation Volume By Hour
CREATE MATERIALIZED VIEW IF NOT EXISTS conversation_volume_by_hour AS
SELECT
  d.domain,
  EXTRACT(HOUR FROM c.started_at)::int as hour_of_day,
  COUNT(*) as conversation_count,
  AVG(EXTRACT(EPOCH FROM (c.last_message_at - c.started_at)) / 60) as avg_duration_minutes,
  CURRENT_TIMESTAMP as materialized_at
FROM conversations c
JOIN domains d ON d.id = c.domain_id
WHERE c.started_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY d.domain, EXTRACT(HOUR FROM c.started_at)::int
ORDER BY d.domain, hour_of_day;

CREATE INDEX IF NOT EXISTS idx_conversation_volume_hour_domain
  ON conversation_volume_by_hour(domain, hour_of_day);

GRANT SELECT ON conversation_volume_by_hour TO service_role;

-- Conversation Status Daily
CREATE MATERIALIZED VIEW IF NOT EXISTS conversation_status_daily AS
SELECT
  d.domain,
  DATE(c.started_at) as date,
  COUNT(*) FILTER (WHERE c.status = 'active') as active_count,
  COUNT(*) FILTER (WHERE c.status = 'waiting') as waiting_count,
  COUNT(*) FILTER (WHERE c.status = 'resolved') as resolved_count,
  COUNT(*) FILTER (WHERE c.status = 'closed') as closed_count,
  COUNT(*) as total_count,
  ROUND(
    COUNT(*) FILTER (WHERE c.status = 'resolved')::numeric /
    NULLIF(COUNT(*), 0) * 100,
    2
  ) as resolution_rate_percent,
  CURRENT_TIMESTAMP as materialized_at
FROM conversations c
JOIN domains d ON d.id = c.domain_id
WHERE c.started_at >= CURRENT_DATE - INTERVAL '90 days'
GROUP BY d.domain, DATE(c.started_at)
ORDER BY date DESC, d.domain;

CREATE INDEX IF NOT EXISTS idx_conversation_status_daily_domain_date
  ON conversation_status_daily(domain, date DESC);

CREATE INDEX IF NOT EXISTS idx_conversation_status_daily_date
  ON conversation_status_daily(date DESC);

GRANT SELECT ON conversation_status_daily TO service_role;

-- Refresh all analytics views
REFRESH MATERIALIZED VIEW conversation_analytics_summary;
REFRESH MATERIALIZED VIEW conversation_volume_by_hour;
REFRESH MATERIALIZED VIEW conversation_status_daily;
