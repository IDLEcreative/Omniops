-- Fix security advisor issues: Remove SECURITY DEFINER from views and enable RLS on tables
-- This migration addresses 12 security warnings from Supabase database linter

-- =============================================================================
-- PART 1: Fix SECURITY DEFINER views
-- =============================================================================
-- Recreate telemetry views without SECURITY DEFINER (use SECURITY INVOKER explicitly)

-- Drop and recreate chat_telemetry_metrics view
DROP VIEW IF EXISTS public.chat_telemetry_metrics;
CREATE OR REPLACE VIEW public.chat_telemetry_metrics
SECURITY INVOKER
AS
SELECT
  DATE_TRUNC('hour', created_at) as hour,
  COUNT(*) as total_sessions,
  COUNT(DISTINCT domain) as unique_domains,
  AVG(duration_ms)::INTEGER as avg_duration_ms,
  PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY duration_ms)::INTEGER as median_duration_ms,
  PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY duration_ms)::INTEGER as p95_duration_ms,
  AVG(iterations)::NUMERIC(3,1) as avg_iterations,
  AVG(search_count)::NUMERIC(4,1) as avg_searches,
  AVG(total_results)::NUMERIC(5,1) as avg_results,
  SUM(CASE WHEN success THEN 1 ELSE 0 END)::NUMERIC / COUNT(*)::NUMERIC * 100 as success_rate,
  COUNT(CASE WHEN error IS NOT NULL THEN 1 END) as error_count
FROM public.chat_telemetry
WHERE created_at >= NOW() - INTERVAL '7 days'
GROUP BY hour
ORDER BY hour DESC;

-- Drop and recreate chat_telemetry_domain_costs view
DROP VIEW IF EXISTS public.chat_telemetry_domain_costs;
CREATE OR REPLACE VIEW public.chat_telemetry_domain_costs
SECURITY INVOKER
AS
SELECT
  domain,
  DATE_TRUNC('month', created_at) as month,
  COUNT(*) as total_requests,
  COUNT(DISTINCT session_id) as unique_sessions,

  -- Token usage
  SUM(COALESCE(input_tokens, 0)) as total_input_tokens,
  SUM(COALESCE(output_tokens, 0)) as total_output_tokens,

  -- Costs
  SUM(COALESCE(cost_usd, 0)) as total_cost_usd,
  AVG(COALESCE(cost_usd, 0))::NUMERIC(10, 6) as avg_cost_per_request,

  -- Model breakdown
  JSONB_OBJECT_AGG(
    model,
    JSONB_BUILD_OBJECT(
      'requests', COUNT(*),
      'cost_usd', SUM(COALESCE(cost_usd, 0)),
      'tokens', SUM(COALESCE(total_tokens, 0))
    )
  ) FILTER (WHERE model IS NOT NULL) as model_breakdown,

  -- Quality metrics
  (SUM(CASE WHEN success THEN 1 ELSE 0 END)::NUMERIC / COUNT(*)::NUMERIC * 100) as success_rate,
  AVG(duration_ms)::INTEGER as avg_response_time_ms

FROM public.chat_telemetry
WHERE domain IS NOT NULL
  AND created_at >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '3 months')
GROUP BY domain, month
ORDER BY month DESC, total_cost_usd DESC;

-- Drop and recreate chat_telemetry_cost_analytics view
DROP VIEW IF EXISTS public.chat_telemetry_cost_analytics;
CREATE OR REPLACE VIEW public.chat_telemetry_cost_analytics
SECURITY INVOKER
AS
SELECT
  DATE_TRUNC('day', created_at) as day,
  model,
  COUNT(*) as total_requests,
  COUNT(DISTINCT session_id) as unique_sessions,
  COUNT(DISTINCT domain) as unique_domains,

  -- Token usage statistics
  SUM(COALESCE(input_tokens, 0)) as total_input_tokens,
  SUM(COALESCE(output_tokens, 0)) as total_output_tokens,
  SUM(COALESCE(total_tokens, 0)) as total_tokens_used,
  AVG(COALESCE(input_tokens, 0))::INTEGER as avg_input_tokens,
  AVG(COALESCE(output_tokens, 0))::INTEGER as avg_output_tokens,
  AVG(COALESCE(total_tokens, 0))::INTEGER as avg_total_tokens,

  -- Cost statistics
  SUM(COALESCE(cost_usd, 0)) as total_cost_usd,
  AVG(COALESCE(cost_usd, 0))::NUMERIC(10, 6) as avg_cost_usd,
  MAX(cost_usd) as max_cost_usd,
  MIN(cost_usd) FILTER (WHERE cost_usd > 0) as min_cost_usd,

  -- Performance correlation
  AVG(duration_ms) FILTER (WHERE cost_usd IS NOT NULL) as avg_duration_with_cost,
  AVG(search_count) FILTER (WHERE cost_usd IS NOT NULL) as avg_searches_with_cost,
  AVG(iterations) FILTER (WHERE cost_usd IS NOT NULL) as avg_iterations_with_cost,

  -- Success rate
  (SUM(CASE WHEN success THEN 1 ELSE 0 END)::NUMERIC / COUNT(*)::NUMERIC * 100) as success_rate

FROM public.chat_telemetry
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY day, model
ORDER BY day DESC, model;

-- Drop and recreate chat_telemetry_hourly_costs view
DROP VIEW IF EXISTS public.chat_telemetry_hourly_costs;
CREATE OR REPLACE VIEW public.chat_telemetry_hourly_costs
SECURITY INVOKER
AS
SELECT
  DATE_TRUNC('hour', created_at) as hour,
  model,
  COUNT(*) as requests_per_hour,
  SUM(COALESCE(input_tokens, 0)) as input_tokens_per_hour,
  SUM(COALESCE(output_tokens, 0)) as output_tokens_per_hour,
  SUM(COALESCE(cost_usd, 0)) as cost_per_hour,
  AVG(COALESCE(cost_usd, 0))::NUMERIC(10, 6) as avg_cost_per_request,
  MAX(cost_usd) as peak_request_cost,

  -- Calculate cost rate (cost per minute) for alerting
  (SUM(COALESCE(cost_usd, 0)) / 60)::NUMERIC(10, 6) as cost_per_minute,

  -- Token utilization efficiency (results per token)
  CASE
    WHEN SUM(COALESCE(total_tokens, 0)) > 0
    THEN (SUM(COALESCE(total_results, 0))::NUMERIC / SUM(COALESCE(total_tokens, 0)))::NUMERIC(10, 4)
    ELSE 0
  END as results_per_token_efficiency

FROM public.chat_telemetry
WHERE created_at >= NOW() - INTERVAL '24 hours'
GROUP BY hour, model
ORDER BY hour DESC, model;

COMMENT ON VIEW public.chat_telemetry_metrics IS 'Hourly aggregated chat telemetry metrics (SECURITY INVOKER - respects RLS)';
COMMENT ON VIEW public.chat_telemetry_domain_costs IS 'Monthly cost breakdown by domain (SECURITY INVOKER - respects RLS)';
COMMENT ON VIEW public.chat_telemetry_cost_analytics IS 'Daily cost analytics by model (SECURITY INVOKER - respects RLS)';
COMMENT ON VIEW public.chat_telemetry_hourly_costs IS 'Hourly cost tracking for monitoring (SECURITY INVOKER - respects RLS)';

-- =============================================================================
-- PART 2: Enable RLS on tables without it
-- =============================================================================

-- Enable RLS on chat_telemetry_rollups
ALTER TABLE public.chat_telemetry_rollups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage all telemetry rollups"
ON public.chat_telemetry_rollups
FOR ALL
USING (auth.role() = 'service_role');

CREATE POLICY "Authenticated users can view telemetry rollups"
ON public.chat_telemetry_rollups
FOR SELECT
USING (auth.role() = 'authenticated');

-- Enable RLS on chat_telemetry_domain_rollups
ALTER TABLE public.chat_telemetry_domain_rollups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage domain rollups"
ON public.chat_telemetry_domain_rollups
FOR ALL
USING (auth.role() = 'service_role');

CREATE POLICY "Authenticated users can view their domain rollups"
ON public.chat_telemetry_domain_rollups
FOR SELECT
USING (
  auth.role() = 'authenticated' AND
  domain IN (
    SELECT domain FROM public.customer_configs
    WHERE organization_id IN (
      SELECT organization_id FROM public.organization_members
      WHERE user_id = auth.uid()
    )
  )
);

-- Enable RLS on chat_telemetry_model_rollups
ALTER TABLE public.chat_telemetry_model_rollups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage model rollups"
ON public.chat_telemetry_model_rollups
FOR ALL
USING (auth.role() = 'service_role');

CREATE POLICY "Authenticated users can view their model rollups"
ON public.chat_telemetry_model_rollups
FOR SELECT
USING (
  auth.role() = 'authenticated' AND
  (domain IS NULL OR domain IN (
    SELECT domain FROM public.customer_configs
    WHERE organization_id IN (
      SELECT organization_id FROM public.organization_members
      WHERE user_id = auth.uid()
    )
  ))
);

-- Enable RLS on demo_attempts
ALTER TABLE public.demo_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage demo attempts"
ON public.demo_attempts
FOR ALL
USING (auth.role() = 'service_role');

CREATE POLICY "Authenticated users can view demo attempts"
ON public.demo_attempts
FOR SELECT
USING (auth.role() = 'authenticated');

-- Enable RLS on gdpr_audit_log
ALTER TABLE public.gdpr_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage GDPR audit log"
ON public.gdpr_audit_log
FOR ALL
USING (auth.role() = 'service_role');

CREATE POLICY "Authenticated users can view their domain GDPR logs"
ON public.gdpr_audit_log
FOR SELECT
USING (
  auth.role() = 'authenticated' AND
  domain IN (
    SELECT domain FROM public.customer_configs
    WHERE organization_id IN (
      SELECT organization_id FROM public.organization_members
      WHERE user_id = auth.uid()
    )
  )
);

-- Enable RLS on widget_configs (if table exists)
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'widget_configs') THEN
    ALTER TABLE public.widget_configs ENABLE ROW LEVEL SECURITY;

    -- Drop existing policies if they exist
    DROP POLICY IF EXISTS "Service role can manage widget configs" ON public.widget_configs;
    DROP POLICY IF EXISTS "Users can view their organization widget configs" ON public.widget_configs;
    DROP POLICY IF EXISTS "Users can update their organization widget configs" ON public.widget_configs;

    CREATE POLICY "Service role can manage widget configs"
    ON public.widget_configs
    FOR ALL
    USING (auth.role() = 'service_role');

    CREATE POLICY "Users can view their organization widget configs"
    ON public.widget_configs
    FOR SELECT
    USING (
      auth.role() = 'authenticated' AND
      domain IN (
        SELECT domain FROM public.customer_configs
        WHERE organization_id IN (
          SELECT organization_id FROM public.organization_members
          WHERE user_id = auth.uid()
        )
      )
    );

    CREATE POLICY "Users can update their organization widget configs"
    ON public.widget_configs
    FOR UPDATE
    USING (
      auth.role() = 'authenticated' AND
      domain IN (
        SELECT domain FROM public.customer_configs
        WHERE organization_id IN (
          SELECT organization_id FROM public.organization_members
          WHERE user_id = auth.uid()
        )
      )
    );
  END IF;
END $$;

-- Enable RLS on widget_config_history (if table exists)
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'widget_config_history') THEN
    ALTER TABLE public.widget_config_history ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "Service role can manage widget config history" ON public.widget_config_history;
    DROP POLICY IF EXISTS "Users can view their organization widget history" ON public.widget_config_history;

    CREATE POLICY "Service role can manage widget config history"
    ON public.widget_config_history
    FOR ALL
    USING (auth.role() = 'service_role');

    CREATE POLICY "Users can view their organization widget history"
    ON public.widget_config_history
    FOR SELECT
    USING (
      auth.role() = 'authenticated' AND
      domain IN (
        SELECT domain FROM public.customer_configs
        WHERE organization_id IN (
          SELECT organization_id FROM public.organization_members
          WHERE user_id = auth.uid()
        )
      )
    );
  END IF;
END $$;

-- Enable RLS on widget_config_variants (if table exists)
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'widget_config_variants') THEN
    ALTER TABLE public.widget_config_variants ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "Service role can manage widget config variants" ON public.widget_config_variants;
    DROP POLICY IF EXISTS "Users can view their organization widget variants" ON public.widget_config_variants;
    DROP POLICY IF EXISTS "Users can manage their organization widget variants" ON public.widget_config_variants;

    CREATE POLICY "Service role can manage widget config variants"
    ON public.widget_config_variants
    FOR ALL
    USING (auth.role() = 'service_role');

    CREATE POLICY "Users can view their organization widget variants"
    ON public.widget_config_variants
    FOR SELECT
    USING (
      auth.role() = 'authenticated' AND
      domain IN (
        SELECT domain FROM public.customer_configs
        WHERE organization_id IN (
          SELECT organization_id FROM public.organization_members
          WHERE user_id = auth.uid()
        )
      )
    );

    CREATE POLICY "Users can manage their organization widget variants"
    ON public.widget_config_variants
    FOR INSERT
    WITH CHECK (
      auth.role() = 'authenticated' AND
      domain IN (
        SELECT domain FROM public.customer_configs
        WHERE organization_id IN (
          SELECT organization_id FROM public.organization_members
          WHERE user_id = auth.uid()
        )
      )
    );
  END IF;
END $$;

-- =============================================================================
-- PART 3: Add comments documenting the security model
-- =============================================================================

COMMENT ON TABLE public.chat_telemetry_rollups IS
'Materialized rollups of chat telemetry. RLS enabled - service role has full access, authenticated users can read all rollups.';

COMMENT ON TABLE public.chat_telemetry_domain_rollups IS
'Domain-specific telemetry rollups. RLS enabled - users can only view rollups for domains in their organization.';

COMMENT ON TABLE public.chat_telemetry_model_rollups IS
'Model-specific telemetry rollups. RLS enabled - users can view rollups for their organization domains or global rollups (domain=NULL).';

COMMENT ON TABLE public.demo_attempts IS
'Lead tracking for demo feature. RLS enabled - service role has full access, authenticated users can read all attempts.';

COMMENT ON TABLE public.gdpr_audit_log IS
'GDPR compliance audit trail. RLS enabled - users can only view logs for domains in their organization.';

-- =============================================================================
-- VERIFICATION
-- =============================================================================

-- Display summary of changes
DO $$
DECLARE
  view_count INTEGER;
  rls_table_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO view_count
  FROM pg_views
  WHERE schemaname = 'public'
  AND viewname IN ('chat_telemetry_metrics', 'chat_telemetry_domain_costs',
                   'chat_telemetry_cost_analytics', 'chat_telemetry_hourly_costs');

  SELECT COUNT(*) INTO rls_table_count
  FROM pg_tables t
  JOIN pg_class c ON c.relname = t.tablename
  WHERE t.schemaname = 'public'
  AND t.tablename IN ('chat_telemetry_rollups', 'chat_telemetry_domain_rollups',
                      'chat_telemetry_model_rollups', 'demo_attempts', 'gdpr_audit_log',
                      'widget_configs', 'widget_config_history', 'widget_config_variants')
  AND c.relrowsecurity = true;

  RAISE NOTICE 'Security advisory fix complete:';
  RAISE NOTICE '  - Recreated % views with SECURITY INVOKER', view_count;
  RAISE NOTICE '  - Enabled RLS on % tables', rls_table_count;
  RAISE NOTICE '  - Created RLS policies for organization-based access control';
END $$;
