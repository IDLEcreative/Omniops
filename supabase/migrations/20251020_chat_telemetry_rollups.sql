-- Ensure pg_cron extension is available for scheduling
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;

-- Rollup table storing aggregated telemetry metrics for fast dashboard reads
CREATE TABLE IF NOT EXISTS public.chat_telemetry_rollups (
  bucket_start TIMESTAMPTZ NOT NULL,
  bucket_end TIMESTAMPTZ NOT NULL,
  granularity TEXT NOT NULL CHECK (granularity IN ('hour', 'day')),
  total_requests INTEGER NOT NULL,
  success_count INTEGER NOT NULL,
  failure_count INTEGER NOT NULL,
  total_input_tokens BIGINT NOT NULL,
  total_output_tokens BIGINT NOT NULL,
  total_cost_usd NUMERIC(16, 6) NOT NULL,
  avg_duration_ms INTEGER,
  avg_searches NUMERIC(8, 3),
  avg_iterations NUMERIC(8, 3),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chat_telemetry_rollups_pkey PRIMARY KEY (granularity, bucket_start)
);

COMMENT ON TABLE public.chat_telemetry_rollups IS 'Materialized rollups of chat telemetry for hour/day buckets.';
COMMENT ON COLUMN public.chat_telemetry_rollups.granularity IS 'Aggregation grain (hour or day).';
COMMENT ON COLUMN public.chat_telemetry_rollups.bucket_start IS 'Inclusive window start for the aggregate.';
COMMENT ON COLUMN public.chat_telemetry_rollups.bucket_end IS 'Exclusive window end for the aggregate.';

-- Function to refresh rollups; defaults to the trailing 7 days for hourly and 90 days for daily
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

  -- Retention: keep 90 days of hourly data and 400 days of daily data
  IF p_granularity = 'hour' THEN
    DELETE FROM public.chat_telemetry_rollups
    WHERE granularity = 'hour'
      AND bucket_start < NOW() - INTERVAL '90 days';
  ELSE
    DELETE FROM public.chat_telemetry_rollups
    WHERE granularity = 'day'
      AND bucket_start < NOW() - INTERVAL '400 days';
  END IF;

  RETURN v_rows;
END;
$$;

COMMENT ON FUNCTION public.refresh_chat_telemetry_rollups(TEXT, TIMESTAMPTZ) IS
'Aggregates chat telemetry into hour/day buckets for dashboard performance. Returns rows inserted/updated.';

GRANT EXECUTE ON FUNCTION public.refresh_chat_telemetry_rollups(TEXT, TIMESTAMPTZ) TO service_role;

-- Schedule automatic refreshes via pg_cron (runs as postgres on Supabase)
DO $$
DECLARE
  job RECORD;
BEGIN
  FOR job IN SELECT jobid FROM cron.job WHERE jobname IN ('refresh-chat-telemetry-hourly', 'refresh-chat-telemetry-daily')
  LOOP
    PERFORM cron.unschedule(job.jobid);
  END LOOP;
END;
$$;

SELECT cron.schedule(
  'refresh-chat-telemetry-hourly',
  '*/15 * * * *',
  $$SELECT public.refresh_chat_telemetry_rollups('hour')$$
);

SELECT cron.schedule(
  'refresh-chat-telemetry-daily',
  '5 1 * * *',
  $$SELECT public.refresh_chat_telemetry_rollups('day')$$
);

-- Seed rollups immediately so dashboards have historical data
SELECT public.refresh_chat_telemetry_rollups('hour', NOW() - INTERVAL '14 days');
SELECT public.refresh_chat_telemetry_rollups('day', NOW() - INTERVAL '365 days');
