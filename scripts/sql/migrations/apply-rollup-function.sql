-- Complete refresh function for telemetry rollups
-- This function aggregates raw telemetry data into hourly/daily rollups
-- for faster dashboard queries

CREATE OR REPLACE FUNCTION public.refresh_chat_telemetry_rollups(
  p_granularity TEXT DEFAULT 'hour',
  p_since TIMESTAMPTZ DEFAULT NULL
) RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_interval INTERVAL;
  v_cutoff TIMESTAMPTZ;
  v_rows INTEGER := 0;
BEGIN
  IF p_granularity NOT IN ('hour', 'day') THEN
    RAISE EXCEPTION 'Unsupported granularity: %', p_granularity;
  END IF;

  v_interval := CASE WHEN p_granularity = 'hour' THEN INTERVAL '1 hour' ELSE INTERVAL '1 day' END;
  v_cutoff := COALESCE(
    p_since,
    CASE
      WHEN p_granularity = 'hour' THEN NOW() - INTERVAL '7 days'
      ELSE NOW() - INTERVAL '90 days'
    END
  );

  WITH aggregated AS (
    SELECT
      DATE_TRUNC(p_granularity, created_at) AS bucket_start,
      DATE_TRUNC(p_granularity, created_at) + v_interval AS bucket_end,
      COUNT(*) AS total_requests,
      SUM(CASE WHEN success THEN 1 ELSE 0 END) AS success_count,
      SUM(CASE WHEN success THEN 0 ELSE 1 END) AS failure_count,
      SUM(COALESCE(input_tokens, 0)) AS total_input_tokens,
      SUM(COALESCE(output_tokens, 0)) AS total_output_tokens,
      SUM(COALESCE(cost_usd, 0)) AS total_cost_usd,
      AVG(duration_ms)::INTEGER AS avg_duration_ms,
      AVG(search_count)::NUMERIC(8, 3) AS avg_searches,
      AVG(iterations)::NUMERIC(8, 3) AS avg_iterations
    FROM public.chat_telemetry
    WHERE created_at >= v_cutoff
    GROUP BY 1, 2
  ),
  domain_rollups AS (
    SELECT
      DATE_TRUNC(p_granularity, created_at) AS bucket_start,
      DATE_TRUNC(p_granularity, created_at) + v_interval AS bucket_end,
      COALESCE(NULLIF(TRIM(domain), ''), 'unknown') AS domain,
      COUNT(*) AS total_requests,
      SUM(CASE WHEN success THEN 1 ELSE 0 END) AS success_count,
      SUM(CASE WHEN success THEN 0 ELSE 1 END) AS failure_count,
      SUM(COALESCE(input_tokens, 0)) AS total_input_tokens,
      SUM(COALESCE(output_tokens, 0)) AS total_output_tokens,
      SUM(COALESCE(cost_usd, 0)) AS total_cost_usd,
      AVG(duration_ms)::INTEGER AS avg_duration_ms,
      AVG(search_count)::NUMERIC(8, 3) AS avg_searches,
      AVG(iterations)::NUMERIC(8, 3) AS avg_iterations
    FROM public.chat_telemetry
    WHERE created_at >= v_cutoff
    GROUP BY 1, 2, 3
  ),
  model_rollups AS (
    SELECT
      DATE_TRUNC(p_granularity, created_at) AS bucket_start,
      DATE_TRUNC(p_granularity, created_at) + v_interval AS bucket_end,
      COALESCE(NULLIF(TRIM(domain), ''), '') AS domain,
      COALESCE(NULLIF(TRIM(model), ''), 'unknown') AS model,
      COUNT(*) AS total_requests,
      SUM(CASE WHEN success THEN 1 ELSE 0 END) AS success_count,
      SUM(CASE WHEN success THEN 0 ELSE 1 END) AS failure_count,
      SUM(COALESCE(input_tokens, 0)) AS total_input_tokens,
      SUM(COALESCE(output_tokens, 0)) AS total_output_tokens,
      SUM(COALESCE(cost_usd, 0)) AS total_cost_usd,
      AVG(duration_ms)::INTEGER AS avg_duration_ms,
      AVG(search_count)::NUMERIC(8, 3) AS avg_searches,
      AVG(iterations)::NUMERIC(8, 3) AS avg_iterations
    FROM public.chat_telemetry
    WHERE created_at >= v_cutoff
    GROUP BY 1, 2, 3, 4
  )
  INSERT INTO public.chat_telemetry_rollups (
    bucket_start,
    bucket_end,
    granularity,
    total_requests,
    success_count,
    failure_count,
    total_input_tokens,
    total_output_tokens,
    total_cost_usd,
    avg_duration_ms,
    avg_searches,
    avg_iterations,
    created_at,
    updated_at
  )
  SELECT
    a.bucket_start,
    a.bucket_end,
    p_granularity,
    a.total_requests,
    a.success_count,
    a.failure_count,
    a.total_input_tokens,
    a.total_output_tokens,
    a.total_cost_usd,
    a.avg_duration_ms,
    a.avg_searches,
    a.avg_iterations,
    NOW(),
    NOW()
  FROM aggregated a
  ON CONFLICT (granularity, bucket_start)
  DO UPDATE SET
    bucket_end = EXCLUDED.bucket_end,
    total_requests = EXCLUDED.total_requests,
    success_count = EXCLUDED.success_count,
    failure_count = EXCLUDED.failure_count,
    total_input_tokens = EXCLUDED.total_input_tokens,
    total_output_tokens = EXCLUDED.total_output_tokens,
    total_cost_usd = EXCLUDED.total_cost_usd,
    avg_duration_ms = EXCLUDED.avg_duration_ms,
    avg_searches = EXCLUDED.avg_searches,
    avg_iterations = EXCLUDED.avg_iterations,
    updated_at = NOW();

  GET DIAGNOSTICS v_rows = ROW_COUNT;

  INSERT INTO public.chat_telemetry_domain_rollups (
    bucket_start,
    bucket_end,
    granularity,
    domain,
    total_requests,
    success_count,
    failure_count,
    total_input_tokens,
    total_output_tokens,
    total_cost_usd,
    avg_duration_ms,
    avg_searches,
    avg_iterations,
    created_at,
    updated_at
  )
  SELECT
    d.bucket_start,
    d.bucket_end,
    p_granularity,
    d.domain,
    d.total_requests,
    d.success_count,
    d.failure_count,
    d.total_input_tokens,
    d.total_output_tokens,
    d.total_cost_usd,
    d.avg_duration_ms,
    d.avg_searches,
    d.avg_iterations,
    NOW(),
    NOW()
  FROM domain_rollups d
  ON CONFLICT (granularity, bucket_start, domain)
  DO UPDATE SET
    bucket_end = EXCLUDED.bucket_end,
    total_requests = EXCLUDED.total_requests,
    success_count = EXCLUDED.success_count,
    failure_count = EXCLUDED.failure_count,
    total_input_tokens = EXCLUDED.total_input_tokens,
    total_output_tokens = EXCLUDED.total_output_tokens,
    total_cost_usd = EXCLUDED.total_cost_usd,
    avg_duration_ms = EXCLUDED.avg_duration_ms,
    avg_searches = EXCLUDED.avg_searches,
    avg_iterations = EXCLUDED.avg_iterations,
    updated_at = NOW();

  INSERT INTO public.chat_telemetry_model_rollups (
    bucket_start,
    bucket_end,
    granularity,
    domain,
    model,
    total_requests,
    success_count,
    failure_count,
    total_input_tokens,
    total_output_tokens,
    total_cost_usd,
    avg_duration_ms,
    avg_searches,
    avg_iterations,
    created_at,
    updated_at
  )
  SELECT
    m.bucket_start,
    m.bucket_end,
    p_granularity,
    m.domain,
    m.model,
    m.total_requests,
    m.success_count,
    m.failure_count,
    m.total_input_tokens,
    m.total_output_tokens,
    m.total_cost_usd,
    m.avg_duration_ms,
    m.avg_searches,
    m.avg_iterations,
    NOW(),
    NOW()
  FROM model_rollups m
  ON CONFLICT (granularity, bucket_start, domain, model)
  DO UPDATE SET
    bucket_end = EXCLUDED.bucket_end,
    total_requests = EXCLUDED.total_requests,
    success_count = EXCLUDED.success_count,
    failure_count = EXCLUDED.failure_count,
    total_input_tokens = EXCLUDED.total_input_tokens,
    total_output_tokens = EXCLUDED.total_output_tokens,
    total_cost_usd = EXCLUDED.total_cost_usd,
    avg_duration_ms = EXCLUDED.avg_duration_ms,
    avg_searches = EXCLUDED.avg_searches,
    avg_iterations = EXCLUDED.avg_iterations,
    updated_at = NOW();

  IF p_granularity = 'hour' THEN
    DELETE FROM public.chat_telemetry_rollups
    WHERE granularity = 'hour'
      AND bucket_start < NOW() - INTERVAL '90 days';

    DELETE FROM public.chat_telemetry_domain_rollups
    WHERE granularity = 'hour'
      AND bucket_start < NOW() - INTERVAL '90 days';

    DELETE FROM public.chat_telemetry_model_rollups
    WHERE granularity = 'hour'
      AND bucket_start < NOW() - INTERVAL '90 days';
  ELSE
    DELETE FROM public.chat_telemetry_rollups
    WHERE granularity = 'day'
      AND bucket_start < NOW() - INTERVAL '400 days';

    DELETE FROM public.chat_telemetry_domain_rollups
    WHERE granularity = 'day'
      AND bucket_start < NOW() - INTERVAL '400 days';

    DELETE FROM public.chat_telemetry_model_rollups
    WHERE granularity = 'day'
      AND bucket_start < NOW() - INTERVAL '400 days';
  END IF;

  RETURN v_rows;
END;
$$;

-- Grant execution permission to service role
GRANT EXECUTE ON FUNCTION public.refresh_chat_telemetry_rollups(TEXT, TIMESTAMPTZ) TO service_role;
