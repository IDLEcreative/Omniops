-- =====================================================================
-- Analytics Materialized Views Migration
-- =====================================================================
-- Purpose: Create materialized views and indexes to optimize analytics
--          queries by 70-80% for large date ranges (30+ days)
-- Created: 2025-11-07
--
-- Performance Goals:
-- - 30-day queries: 70-80% faster
-- - 90-day queries: 70-80% faster
-- - Enable dashboard loading without timeouts
--
-- Maintenance:
-- - Views should be refreshed nightly via cron job
-- - Use CONCURRENTLY to avoid blocking queries
-- =====================================================================

-- =====================================================================
-- PART 1: CRITICAL INDEXES FOR RAW QUERIES
-- =====================================================================
-- These indexes improve both raw queries and materialized view creation

-- Index for filtering messages by date and role (most common query pattern)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_messages_created_at_role
  ON messages(created_at DESC, role);

-- Index for sentiment analysis (metadata JSONB field)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_messages_metadata_sentiment
  ON messages((metadata->>'sentiment'))
  WHERE metadata->>'sentiment' IS NOT NULL;

-- Index for response time analysis (metadata JSONB field)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_messages_metadata_response_time
  ON messages((metadata->>'response_time_ms'))
  WHERE metadata->>'response_time_ms' IS NOT NULL;

-- Composite index for conversation filtering by domain and date
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_conversations_domain_started
  ON conversations(domain_id, started_at DESC);

-- Index for conversation metadata filtering
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_conversations_metadata
  ON conversations USING GIN(metadata);

-- =====================================================================
-- PART 2: DAILY ANALYTICS SUMMARY MATERIALIZED VIEW
-- =====================================================================
-- Purpose: Pre-aggregate daily statistics to avoid scanning all messages
-- Refresh: Nightly via cron job
-- Usage: Dashboard overview, trend analysis, date range reports

CREATE MATERIALIZED VIEW IF NOT EXISTS daily_analytics_summary AS
SELECT
  -- Date grouping (truncate to day in UTC)
  DATE(c.started_at) as date,

  -- Domain for multi-tenant filtering
  c.domain_id,

  -- Conversation metrics
  COUNT(DISTINCT c.id) as total_conversations,
  COUNT(DISTINCT c.session_id) as unique_sessions,
  AVG(EXTRACT(EPOCH FROM (c.ended_at - c.started_at)) / 60.0) as avg_conversation_duration_minutes,

  -- Message volume metrics
  COUNT(m.id) as total_messages,
  COUNT(m.id) FILTER (WHERE m.role = 'user') as user_messages,
  COUNT(m.id) FILTER (WHERE m.role = 'assistant') as assistant_messages,
  COUNT(m.id) FILTER (WHERE m.role = 'system') as system_messages,

  -- Average messages per conversation
  ROUND(COUNT(m.id)::numeric / NULLIF(COUNT(DISTINCT c.id), 0), 2) as avg_messages_per_conversation,

  -- Response time metrics (from metadata)
  AVG((m.metadata->>'response_time_ms')::numeric) FILTER (WHERE m.role = 'assistant') as avg_response_time_ms,
  PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY (m.metadata->>'response_time_ms')::numeric)
    FILTER (WHERE m.role = 'assistant') as median_response_time_ms,
  PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY (m.metadata->>'response_time_ms')::numeric)
    FILTER (WHERE m.role = 'assistant') as p95_response_time_ms,

  -- Sentiment analysis (from metadata)
  COUNT(m.id) FILTER (WHERE m.metadata->>'sentiment' = 'positive') as positive_sentiment_count,
  COUNT(m.id) FILTER (WHERE m.metadata->>'sentiment' = 'neutral') as neutral_sentiment_count,
  COUNT(m.id) FILTER (WHERE m.metadata->>'sentiment' = 'negative') as negative_sentiment_count,

  -- Error tracking
  COUNT(m.id) FILTER (WHERE m.metadata->>'error' IS NOT NULL) as error_count,

  -- Token usage tracking (from metadata)
  SUM((m.metadata->>'tokens_used')::integer) FILTER (WHERE m.metadata->>'tokens_used' IS NOT NULL) as total_tokens_used,
  AVG((m.metadata->>'tokens_used')::numeric) FILTER (WHERE m.metadata->>'tokens_used' IS NOT NULL) as avg_tokens_per_message

FROM conversations c
LEFT JOIN messages m ON m.conversation_id = c.id
WHERE c.started_at IS NOT NULL
GROUP BY DATE(c.started_at), c.domain_id;

-- Create indexes on materialized view for fast filtering
CREATE UNIQUE INDEX IF NOT EXISTS idx_daily_analytics_date_domain
  ON daily_analytics_summary(date DESC, domain_id);

CREATE INDEX IF NOT EXISTS idx_daily_analytics_date
  ON daily_analytics_summary(date DESC);

CREATE INDEX IF NOT EXISTS idx_daily_analytics_domain
  ON daily_analytics_summary(domain_id);

-- =====================================================================
-- PART 3: HOURLY USAGE STATS MATERIALIZED VIEW
-- =====================================================================
-- Purpose: Analyze usage patterns by hour of day and day of week
-- Refresh: Nightly via cron job
-- Usage: Peak usage analysis, capacity planning, support staffing

CREATE MATERIALIZED VIEW IF NOT EXISTS hourly_usage_stats AS
SELECT
  -- Time dimensions
  DATE(m.created_at) as date,
  EXTRACT(HOUR FROM m.created_at) as hour_of_day,
  EXTRACT(DOW FROM m.created_at) as day_of_week, -- 0 = Sunday, 6 = Saturday
  TO_CHAR(m.created_at, 'Day') as day_name,

  -- Domain for multi-tenant filtering
  c.domain_id,

  -- Message volume
  COUNT(m.id) as message_count,
  COUNT(m.id) FILTER (WHERE m.role = 'user') as user_message_count,
  COUNT(m.id) FILTER (WHERE m.role = 'assistant') as assistant_message_count,

  -- Conversation volume
  COUNT(DISTINCT m.conversation_id) as conversation_count,

  -- Performance metrics
  AVG((m.metadata->>'response_time_ms')::numeric) FILTER (WHERE m.role = 'assistant') as avg_response_time_ms,
  PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY (m.metadata->>'response_time_ms')::numeric)
    FILTER (WHERE m.role = 'assistant') as p95_response_time_ms,

  -- Error rate
  COUNT(m.id) FILTER (WHERE m.metadata->>'error' IS NOT NULL) as error_count,
  ROUND(
    (COUNT(m.id) FILTER (WHERE m.metadata->>'error' IS NOT NULL)::numeric / NULLIF(COUNT(m.id), 0)) * 100,
    2
  ) as error_rate_percent,

  -- Token usage
  SUM((m.metadata->>'tokens_used')::integer) FILTER (WHERE m.metadata->>'tokens_used' IS NOT NULL) as total_tokens_used

FROM messages m
JOIN conversations c ON c.id = m.conversation_id
WHERE m.created_at IS NOT NULL
GROUP BY
  DATE(m.created_at),
  EXTRACT(HOUR FROM m.created_at),
  EXTRACT(DOW FROM m.created_at),
  TO_CHAR(m.created_at, 'Day'),
  c.domain_id;

-- Create indexes on materialized view for fast filtering
CREATE UNIQUE INDEX IF NOT EXISTS idx_hourly_usage_date_hour_domain
  ON hourly_usage_stats(date DESC, hour_of_day, domain_id);

CREATE INDEX IF NOT EXISTS idx_hourly_usage_hour_domain
  ON hourly_usage_stats(hour_of_day, domain_id);

CREATE INDEX IF NOT EXISTS idx_hourly_usage_dow
  ON hourly_usage_stats(day_of_week);

CREATE INDEX IF NOT EXISTS idx_hourly_usage_domain
  ON hourly_usage_stats(domain_id);

-- =====================================================================
-- PART 4: WEEKLY SUMMARY MATERIALIZED VIEW
-- =====================================================================
-- Purpose: Pre-aggregate weekly trends for long-range analytics
-- Refresh: Weekly via cron job
-- Usage: Monthly/quarterly reports, executive dashboards

CREATE MATERIALIZED VIEW IF NOT EXISTS weekly_analytics_summary AS
SELECT
  -- Week grouping (ISO week, Monday start)
  DATE_TRUNC('week', c.started_at)::date as week_start_date,
  EXTRACT(YEAR FROM c.started_at) as year,
  EXTRACT(WEEK FROM c.started_at) as week_number,

  -- Domain for multi-tenant filtering
  c.domain_id,

  -- Conversation metrics
  COUNT(DISTINCT c.id) as total_conversations,
  COUNT(DISTINCT c.session_id) as unique_sessions,
  AVG(EXTRACT(EPOCH FROM (c.ended_at - c.started_at)) / 60.0) as avg_conversation_duration_minutes,

  -- Message volume metrics
  COUNT(m.id) as total_messages,
  COUNT(m.id) FILTER (WHERE m.role = 'user') as user_messages,
  COUNT(m.id) FILTER (WHERE m.role = 'assistant') as assistant_messages,
  ROUND(COUNT(m.id)::numeric / NULLIF(COUNT(DISTINCT c.id), 0), 2) as avg_messages_per_conversation,

  -- Response time metrics
  AVG((m.metadata->>'response_time_ms')::numeric) FILTER (WHERE m.role = 'assistant') as avg_response_time_ms,
  PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY (m.metadata->>'response_time_ms')::numeric)
    FILTER (WHERE m.role = 'assistant') as median_response_time_ms,
  PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY (m.metadata->>'response_time_ms')::numeric)
    FILTER (WHERE m.role = 'assistant') as p95_response_time_ms,

  -- Sentiment analysis
  COUNT(m.id) FILTER (WHERE m.metadata->>'sentiment' = 'positive') as positive_sentiment_count,
  COUNT(m.id) FILTER (WHERE m.metadata->>'sentiment' = 'neutral') as neutral_sentiment_count,
  COUNT(m.id) FILTER (WHERE m.metadata->>'sentiment' = 'negative') as negative_sentiment_count,
  ROUND(
    (COUNT(m.id) FILTER (WHERE m.metadata->>'sentiment' = 'positive')::numeric /
     NULLIF(COUNT(m.id) FILTER (WHERE m.metadata->>'sentiment' IS NOT NULL), 0)) * 100,
    2
  ) as positive_sentiment_percent,

  -- Error tracking
  COUNT(m.id) FILTER (WHERE m.metadata->>'error' IS NOT NULL) as error_count,
  ROUND(
    (COUNT(m.id) FILTER (WHERE m.metadata->>'error' IS NOT NULL)::numeric / NULLIF(COUNT(m.id), 0)) * 100,
    2
  ) as error_rate_percent,

  -- Token usage
  SUM((m.metadata->>'tokens_used')::integer) FILTER (WHERE m.metadata->>'tokens_used' IS NOT NULL) as total_tokens_used,
  AVG((m.metadata->>'tokens_used')::numeric) FILTER (WHERE m.metadata->>'tokens_used' IS NOT NULL) as avg_tokens_per_message

FROM conversations c
LEFT JOIN messages m ON m.conversation_id = c.id
WHERE c.started_at IS NOT NULL
GROUP BY
  DATE_TRUNC('week', c.started_at),
  EXTRACT(YEAR FROM c.started_at),
  EXTRACT(WEEK FROM c.started_at),
  c.domain_id;

-- Create indexes on materialized view
CREATE UNIQUE INDEX IF NOT EXISTS idx_weekly_analytics_week_domain
  ON weekly_analytics_summary(week_start_date DESC, domain_id);

CREATE INDEX IF NOT EXISTS idx_weekly_analytics_week
  ON weekly_analytics_summary(week_start_date DESC);

CREATE INDEX IF NOT EXISTS idx_weekly_analytics_domain
  ON weekly_analytics_summary(domain_id);

-- =====================================================================
-- PART 5: HELPER FUNCTIONS FOR REFRESH
-- =====================================================================

-- Function to refresh all analytics views concurrently (non-blocking)
CREATE OR REPLACE FUNCTION refresh_analytics_views()
RETURNS TABLE(view_name text, refresh_time_ms numeric, status text) AS $$
DECLARE
  start_time timestamp;
  end_time timestamp;
BEGIN
  -- Refresh daily summary
  start_time := clock_timestamp();
  BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY daily_analytics_summary;
    end_time := clock_timestamp();
    RETURN QUERY SELECT
      'daily_analytics_summary'::text,
      EXTRACT(EPOCH FROM (end_time - start_time)) * 1000,
      'SUCCESS'::text;
  EXCEPTION WHEN OTHERS THEN
    RETURN QUERY SELECT
      'daily_analytics_summary'::text,
      -1::numeric,
      SQLERRM::text;
  END;

  -- Refresh hourly stats
  start_time := clock_timestamp();
  BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY hourly_usage_stats;
    end_time := clock_timestamp();
    RETURN QUERY SELECT
      'hourly_usage_stats'::text,
      EXTRACT(EPOCH FROM (end_time - start_time)) * 1000,
      'SUCCESS'::text;
  EXCEPTION WHEN OTHERS THEN
    RETURN QUERY SELECT
      'hourly_usage_stats'::text,
      -1::numeric,
      SQLERRM::text;
  END;

  -- Refresh weekly summary
  start_time := clock_timestamp();
  BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY weekly_analytics_summary;
    end_time := clock_timestamp();
    RETURN QUERY SELECT
      'weekly_analytics_summary'::text,
      EXTRACT(EPOCH FROM (end_time - start_time)) * 1000,
      'SUCCESS'::text;
  EXCEPTION WHEN OTHERS THEN
    RETURN QUERY SELECT
      'weekly_analytics_summary'::text,
      -1::numeric,
      SQLERRM::text;
  END;
END;
$$ LANGUAGE plpgsql;

-- Function to get last refresh time for a materialized view
CREATE OR REPLACE FUNCTION get_view_last_refresh(view_name text)
RETURNS timestamptz AS $$
DECLARE
  last_refresh timestamptz;
BEGIN
  SELECT
    GREATEST(
      pg_stat_get_last_analyze_time(c.oid),
      pg_stat_get_last_autoanalyze_time(c.oid)
    )
  INTO last_refresh
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public'
    AND c.relname = view_name
    AND c.relkind = 'm'; -- materialized view

  RETURN last_refresh;
END;
$$ LANGUAGE plpgsql;

-- =====================================================================
-- PART 6: INITIAL REFRESH
-- =====================================================================
-- Populate the materialized views with initial data

-- Note: First refresh cannot use CONCURRENTLY (view must have data first)
REFRESH MATERIALIZED VIEW daily_analytics_summary;
REFRESH MATERIALIZED VIEW hourly_usage_stats;
REFRESH MATERIALIZED VIEW weekly_analytics_summary;

-- =====================================================================
-- MIGRATION COMPLETE
-- =====================================================================

-- Verification queries:
-- SELECT * FROM daily_analytics_summary ORDER BY date DESC LIMIT 10;
-- SELECT * FROM hourly_usage_stats WHERE hour_of_day = 14 ORDER BY date DESC LIMIT 10;
-- SELECT * FROM weekly_analytics_summary ORDER BY week_start_date DESC LIMIT 10;
-- SELECT * FROM refresh_analytics_views(); -- Test refresh function
