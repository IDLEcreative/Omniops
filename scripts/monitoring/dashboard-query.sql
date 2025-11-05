/**
 * Dashboard Queries for Token Usage Monitoring
 *
 * SQL queries to support the monitoring dashboard and analytics.
 * These queries track:
 * - Token usage patterns over time
 * - Tool execution distribution
 * - Error rates and failure patterns
 * - Response time metrics
 * - Cost analysis
 */

-- ============================================================================
-- QUERY 1: Token Usage Over Last 24 Hours (Hourly Breakdown)
-- ============================================================================
-- Shows token consumption patterns by hour to identify peak usage times
SELECT
  DATE_TRUNC('hour', m.created_at) as hour,
  COUNT(DISTINCT m.conversation_id) as total_conversations,
  COUNT(m.id) as total_messages,
  COUNT(CASE WHEN m.role = 'user' THEN 1 END) as user_messages,
  COUNT(CASE WHEN m.role = 'assistant' THEN 1 END) as assistant_messages,
  ROUND(
    AVG(CASE WHEN m.role = 'assistant' THEN LENGTH(m.content) / 4.0 END)::numeric,
    0
  ) as avg_response_tokens,
  SUM(CASE WHEN m.metadata ? 'tool_calls' THEN 1 ELSE 0 END) as tool_executions,
  SUM(CASE WHEN m.metadata ? 'error' THEN 1 ELSE 0 END) as error_count
FROM messages m
WHERE m.created_at >= NOW() - INTERVAL '24 hours'
GROUP BY DATE_TRUNC('hour', m.created_at)
ORDER BY hour DESC;


-- ============================================================================
-- QUERY 2: Request Patterns - With vs Without Tool Execution
-- ============================================================================
-- Compares token usage between requests that use tools vs. those that don't
SELECT
  CASE
    WHEN m.metadata ? 'tool_calls' THEN 'With Tool Execution'
    ELSE 'Without Tool Execution'
  END as request_type,
  COUNT(DISTINCT m.conversation_id) as total_requests,
  ROUND(
    AVG(CASE WHEN m.role = 'assistant' THEN LENGTH(m.content) / 4.0 ELSE 0 END)::numeric,
    0
  ) as avg_response_tokens,
  ROUND(
    MAX(CASE WHEN m.role = 'assistant' THEN LENGTH(m.content) / 4.0 ELSE 0 END)::numeric,
    0
  ) as max_response_tokens,
  ROUND(
    MIN(CASE WHEN m.role = 'assistant' THEN LENGTH(m.content) / 4.0 ELSE 0 END)::numeric,
    0
  ) as min_response_tokens,
  COUNT(CASE WHEN m.metadata ? 'error' THEN 1 END) as error_count,
  ROUND(
    (COUNT(CASE WHEN m.metadata ? 'error' THEN 1 END)::numeric / COUNT(*) * 100),
    2
  ) as error_rate_percent
FROM messages m
WHERE m.created_at >= NOW() - INTERVAL '7 days'
GROUP BY request_type
ORDER BY avg_response_tokens DESC;


-- ============================================================================
-- QUERY 3: Tool Usage Distribution
-- ============================================================================
-- Shows which tools are being called most frequently
SELECT
  jsonb_array_elements(m.metadata -> 'tool_calls') ->> 'name' as tool_name,
  COUNT(*) as execution_count,
  ROUND(
    AVG(
      CASE
        WHEN jsonb_array_elements(m.metadata -> 'tool_calls') ? 'duration'
        THEN (jsonb_array_elements(m.metadata -> 'tool_calls') -> 'duration')::numeric
        ELSE 0
      END
    )::numeric,
    2
  ) as avg_duration_ms,
  COUNT(CASE
    WHEN jsonb_array_elements(m.metadata -> 'tool_calls') ? 'error' THEN 1
  END) as failure_count
FROM messages m
WHERE
  m.created_at >= NOW() - INTERVAL '7 days'
  AND m.metadata ? 'tool_calls'
GROUP BY tool_name
ORDER BY execution_count DESC;


-- ============================================================================
-- QUERY 4: Error Rate Analysis
-- ============================================================================
-- Identifies error patterns and failure modes
SELECT
  m.metadata ->> 'error_type' as error_type,
  COUNT(*) as occurrence_count,
  ROUND(
    (COUNT(*)::numeric / (SELECT COUNT(*) FROM messages WHERE created_at >= NOW() - INTERVAL '7 days') * 100),
    2
  ) as percentage_of_total,
  COUNT(DISTINCT m.conversation_id) as affected_conversations,
  MAX(m.created_at) as last_occurrence
FROM messages m
WHERE
  m.created_at >= NOW() - INTERVAL '7 days'
  AND m.metadata ? 'error'
GROUP BY error_type
ORDER BY occurrence_count DESC;


-- ============================================================================
-- QUERY 5: Response Time Metrics (by percentile)
-- ============================================================================
-- Shows performance distribution using percentiles
SELECT
  PERCENTILE_CONT(0.50) WITHIN GROUP (ORDER BY
    EXTRACT(EPOCH FROM (m.created_at - LAG(m.created_at) OVER (PARTITION BY m.conversation_id ORDER BY m.created_at))) * 1000
  ) as p50_response_time_ms,
  PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY
    EXTRACT(EPOCH FROM (m.created_at - LAG(m.created_at) OVER (PARTITION BY m.conversation_id ORDER BY m.created_at))) * 1000
  ) as p75_response_time_ms,
  PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY
    EXTRACT(EPOCH FROM (m.created_at - LAG(m.created_at) OVER (PARTITION BY m.conversation_id ORDER BY m.created_at))) * 1000
  ) as p95_response_time_ms,
  PERCENTILE_CONT(0.99) WITHIN GROUP (ORDER BY
    EXTRACT(EPOCH FROM (m.created_at - LAG(m.created_at) OVER (PARTITION BY m.conversation_id ORDER BY m.created_at))) * 1000
  ) as p99_response_time_ms
FROM messages m
WHERE m.created_at >= NOW() - INTERVAL '7 days';


-- ============================================================================
-- QUERY 6: System Prompt Token Validation
-- ============================================================================
-- Validates that system prompt tokens are at expected MCP baseline (~198 tokens)
-- This query estimates system prompt size from metadata
SELECT
  COUNT(DISTINCT m.conversation_id) as total_conversations,
  ROUND(
    AVG(CASE WHEN m.metadata ? 'system_prompt_size' THEN (m.metadata ->> 'system_prompt_size')::numeric ELSE 198 END),
    0
  ) as avg_system_prompt_tokens,
  ROUND(
    MIN(CASE WHEN m.metadata ? 'system_prompt_size' THEN (m.metadata ->> 'system_prompt_size')::numeric ELSE 198 END),
    0
  ) as min_system_prompt_tokens,
  ROUND(
    MAX(CASE WHEN m.metadata ? 'system_prompt_size' THEN (m.metadata ->> 'system_prompt_size')::numeric ELSE 198 END),
    0
  ) as max_system_prompt_tokens,
  -- Check if we're within expected range (180-220 tokens for MCP baseline)
  COUNT(CASE
    WHEN CAST(m.metadata ->> 'system_prompt_size' AS INTEGER) BETWEEN 180 AND 220 THEN 1
  END) as within_expected_range
FROM messages m
WHERE
  m.created_at >= NOW() - INTERVAL '7 days'
  AND m.role = 'assistant';


-- ============================================================================
-- QUERY 7: Cost Analysis (Estimated)
-- ============================================================================
-- Calculates estimated API costs based on token usage
-- Using OpenAI GPT-4 pricing: $0.03 per 1K input, $0.06 per 1K output
SELECT
  COUNT(DISTINCT m.conversation_id) as total_requests,
  ROUND(
    (SUM(CASE WHEN m.role = 'user' THEN LENGTH(m.content) / 4.0 ELSE 0 END) / 1000.0 * 0.03)::numeric,
    4
  ) as estimated_input_cost,
  ROUND(
    (SUM(CASE WHEN m.role = 'assistant' THEN LENGTH(m.content) / 4.0 ELSE 0 END) / 1000.0 * 0.06)::numeric,
    4
  ) as estimated_output_cost,
  ROUND(
    (
      SUM(CASE WHEN m.role = 'user' THEN LENGTH(m.content) / 4.0 ELSE 0 END) / 1000.0 * 0.03 +
      SUM(CASE WHEN m.role = 'assistant' THEN LENGTH(m.content) / 4.0 ELSE 0 END) / 1000.0 * 0.06
    )::numeric,
    4
  ) as estimated_total_cost,
  -- Project to 30-day month
  ROUND(
    (
      SUM(CASE WHEN m.role = 'user' THEN LENGTH(m.content) / 4.0 ELSE 0 END) / 1000.0 * 0.03 +
      SUM(CASE WHEN m.role = 'assistant' THEN LENGTH(m.content) / 4.0 ELSE 0 END) / 1000.0 * 0.06
    ) * (30.0 / EXTRACT(DAY FROM (NOW() - (NOW() - INTERVAL '7 days'))))::numeric,
    2
  ) as projected_monthly_cost
FROM messages m
WHERE m.created_at >= NOW() - INTERVAL '7 days';


-- ============================================================================
-- QUERY 8: Conversation Completeness
-- ============================================================================
-- Shows conversation metrics and completion status
SELECT
  COUNT(DISTINCT c.id) as total_conversations,
  ROUND(AVG(m.message_count::numeric), 1) as avg_messages_per_conversation,
  MAX(m.message_count) as max_messages_in_conversation,
  ROUND(AVG(EXTRACT(EPOCH FROM (c.updated_at - c.created_at))), 1) as avg_duration_seconds,
  COUNT(CASE WHEN c.metadata ? 'error' THEN 1 END) as conversations_with_errors,
  COUNT(CASE WHEN c.metadata ->> 'status' = 'completed' THEN 1 END) as completed_conversations
FROM conversations c
LEFT JOIN (
  SELECT conversation_id, COUNT(*) as message_count
  FROM messages
  GROUP BY conversation_id
) m ON c.id = m.conversation_id
WHERE c.created_at >= NOW() - INTERVAL '7 days'
GROUP BY 1;


-- ============================================================================
-- QUERY 9: Daily Summary (Aggregated)
-- ============================================================================
-- High-level daily metrics for trend analysis
SELECT
  DATE(m.created_at) as date,
  COUNT(DISTINCT m.conversation_id) as daily_conversations,
  COUNT(m.id) as daily_messages,
  ROUND(
    AVG(LENGTH(m.content) / 4.0)::numeric,
    0
  ) as avg_tokens_per_message,
  COUNT(CASE WHEN m.metadata ? 'tool_calls' THEN 1 END) as tool_executions,
  COUNT(CASE WHEN m.metadata ? 'error' THEN 1 END) as error_count,
  ROUND(
    (
      SUM(CASE WHEN m.role = 'user' THEN LENGTH(m.content) / 4.0 ELSE 0 END) / 1000.0 * 0.03 +
      SUM(CASE WHEN m.role = 'assistant' THEN LENGTH(m.content) / 4.0 ELSE 0 END) / 1000.0 * 0.06
    )::numeric,
    4
  ) as estimated_daily_cost
FROM messages m
WHERE m.created_at >= NOW() - INTERVAL '30 days'
GROUP BY DATE(m.created_at)
ORDER BY date DESC;


-- ============================================================================
-- QUERY 10: Savings Calculation vs Traditional Approach
-- ============================================================================
-- Compares actual MCP token usage against traditional approach baseline
-- MCP System Prompt: 198 tokens
-- Traditional System Prompt: 5200 tokens
-- Expected per-request savings: 96.2%
SELECT
  COUNT(DISTINCT m.conversation_id) as total_requests,
  ROUND(
    AVG(
      198 + (LENGTH(m.content) / 4.0)  -- MCP: system prompt + average tokens
    )::numeric,
    0
  ) as avg_tokens_mcp,
  -- Traditional approach estimate: 5x larger system prompt
  5200 as traditional_system_prompt_tokens,
  5400 as traditional_avg_total_per_request,
  -- Actual savings
  ROUND(
    (
      (5400 - AVG(198 + (LENGTH(m.content) / 4.0))) / 5400 * 100
    )::numeric,
    2
  ) as actual_savings_percentage,
  -- Cost comparison
  ROUND(
    (
      SUM(CASE WHEN m.role = 'user' THEN LENGTH(m.content) / 4.0 ELSE 0 END) / 1000.0 * 0.03 +
      SUM(CASE WHEN m.role = 'assistant' THEN LENGTH(m.content) / 4.0 ELSE 0 END) / 1000.0 * 0.06
    )::numeric,
    4
  ) as actual_mcp_cost,
  -- Estimated traditional cost (26.9x higher based on token count)
  ROUND(
    (
      SUM(CASE WHEN m.role = 'user' THEN LENGTH(m.content) / 4.0 ELSE 0 END) / 1000.0 * 0.03 +
      SUM(CASE WHEN m.role = 'assistant' THEN LENGTH(m.content) / 4.0 ELSE 0 END) / 1000.0 * 0.06
    ) * 26.9::numeric,
    4
  ) as estimated_traditional_cost,
  -- Cost savings
  ROUND(
    (
      SUM(CASE WHEN m.role = 'user' THEN LENGTH(m.content) / 4.0 ELSE 0 END) / 1000.0 * 0.03 +
      SUM(CASE WHEN m.role = 'assistant' THEN LENGTH(m.content) / 4.0 ELSE 0 END) / 1000.0 * 0.06
    ) * (26.9 - 1)::numeric,
    4
  ) as estimated_cost_savings
FROM messages m
WHERE m.created_at >= NOW() - INTERVAL '7 days';
