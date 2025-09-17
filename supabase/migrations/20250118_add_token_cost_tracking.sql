-- Add comprehensive token tracking and cost calculation to chat_telemetry table

-- Add new columns for detailed token tracking
ALTER TABLE public.chat_telemetry 
ADD COLUMN IF NOT EXISTS input_tokens INTEGER,
ADD COLUMN IF NOT EXISTS output_tokens INTEGER,
ADD COLUMN IF NOT EXISTS total_tokens INTEGER GENERATED ALWAYS AS (COALESCE(input_tokens, 0) + COALESCE(output_tokens, 0)) STORED,
ADD COLUMN IF NOT EXISTS cost_usd NUMERIC(10, 6),
ADD COLUMN IF NOT EXISTS model_config JSONB DEFAULT '{}'::JSONB;

-- Update existing tokens_used column comment to indicate deprecation
COMMENT ON COLUMN public.chat_telemetry.tokens_used IS 'DEPRECATED: Use input_tokens and output_tokens instead. Kept for backward compatibility.';

-- Add comments for new columns
COMMENT ON COLUMN public.chat_telemetry.input_tokens IS 'Number of input tokens used in the request';
COMMENT ON COLUMN public.chat_telemetry.output_tokens IS 'Number of output tokens generated in the response';
COMMENT ON COLUMN public.chat_telemetry.total_tokens IS 'Total tokens (input + output) - computed column';
COMMENT ON COLUMN public.chat_telemetry.cost_usd IS 'Estimated cost in USD based on model pricing';
COMMENT ON COLUMN public.chat_telemetry.model_config IS 'Model configuration including temperature, max_tokens, etc.';

-- Create index for cost analysis
CREATE INDEX IF NOT EXISTS idx_chat_telemetry_cost ON public.chat_telemetry(cost_usd) WHERE cost_usd IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_chat_telemetry_total_tokens ON public.chat_telemetry(total_tokens) WHERE total_tokens IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_chat_telemetry_model_cost ON public.chat_telemetry(model, cost_usd);

-- Create cost analytics view
CREATE OR REPLACE VIEW public.chat_telemetry_cost_analytics AS
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

-- Create hourly cost tracking view for real-time monitoring
CREATE OR REPLACE VIEW public.chat_telemetry_hourly_costs AS
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

-- Create domain-based cost tracking for customer billing
CREATE OR REPLACE VIEW public.chat_telemetry_domain_costs AS
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

-- Create function to calculate estimated cost based on model and tokens
CREATE OR REPLACE FUNCTION public.calculate_chat_cost(
  p_model TEXT,
  p_input_tokens INTEGER,
  p_output_tokens INTEGER
) RETURNS NUMERIC AS $$
DECLARE
  v_cost NUMERIC(10, 6);
BEGIN
  -- GPT-5-mini pricing: $0.25 per 1M input tokens, $2.00 per 1M output tokens
  IF p_model = 'gpt-5-mini' THEN
    v_cost := (p_input_tokens::NUMERIC / 1000000 * 0.25) + 
              (p_output_tokens::NUMERIC / 1000000 * 2.00);
  
  -- GPT-4.1 pricing (estimated based on GPT-4 Turbo)
  ELSIF p_model = 'gpt-4.1' OR p_model = 'gpt-4-turbo' THEN
    v_cost := (p_input_tokens::NUMERIC / 1000000 * 10.00) + 
              (p_output_tokens::NUMERIC / 1000000 * 30.00);
  
  -- GPT-4 pricing
  ELSIF p_model LIKE 'gpt-4%' THEN
    v_cost := (p_input_tokens::NUMERIC / 1000000 * 30.00) + 
              (p_output_tokens::NUMERIC / 1000000 * 60.00);
  
  -- GPT-3.5 pricing
  ELSIF p_model LIKE 'gpt-3.5%' THEN
    v_cost := (p_input_tokens::NUMERIC / 1000000 * 0.50) + 
              (p_output_tokens::NUMERIC / 1000000 * 1.50);
  
  -- Default/unknown model - use conservative estimate
  ELSE
    v_cost := (p_input_tokens::NUMERIC / 1000000 * 5.00) + 
              (p_output_tokens::NUMERIC / 1000000 * 15.00);
  END IF;
  
  RETURN v_cost;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Create trigger to auto-calculate cost when tokens are inserted
CREATE OR REPLACE FUNCTION public.auto_calculate_chat_cost()
RETURNS TRIGGER AS $$
BEGIN
  -- Only calculate if we have token data and no cost yet
  IF NEW.input_tokens IS NOT NULL 
     AND NEW.output_tokens IS NOT NULL 
     AND NEW.cost_usd IS NULL THEN
    NEW.cost_usd := public.calculate_chat_cost(
      NEW.model, 
      NEW.input_tokens, 
      NEW.output_tokens
    );
  END IF;
  
  -- Also update deprecated tokens_used field for backward compatibility
  IF NEW.input_tokens IS NOT NULL AND NEW.output_tokens IS NOT NULL THEN
    NEW.tokens_used := NEW.input_tokens + NEW.output_tokens;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
DROP TRIGGER IF EXISTS auto_calculate_cost_trigger ON public.chat_telemetry;
CREATE TRIGGER auto_calculate_cost_trigger
  BEFORE INSERT OR UPDATE ON public.chat_telemetry
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_calculate_chat_cost();

-- Create cost alert thresholds table
CREATE TABLE IF NOT EXISTS public.chat_cost_alerts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  domain TEXT,
  alert_type TEXT NOT NULL CHECK (alert_type IN ('hourly', 'daily', 'monthly', 'per_request')),
  threshold_usd NUMERIC(10, 2) NOT NULL,
  current_value NUMERIC(10, 6),
  last_triggered TIMESTAMPTZ,
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cost_alerts_domain ON public.chat_cost_alerts(domain);
CREATE INDEX IF NOT EXISTS idx_cost_alerts_enabled ON public.chat_cost_alerts(enabled) WHERE enabled = true;

-- Add RLS for cost alerts
ALTER TABLE public.chat_cost_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage cost alerts" ON public.chat_cost_alerts
  FOR ALL
  USING (auth.role() = 'service_role');

-- Function to check cost thresholds
CREATE OR REPLACE FUNCTION public.check_cost_thresholds()
RETURNS TABLE(
  alert_id UUID,
  domain TEXT,
  alert_type TEXT,
  threshold_usd NUMERIC,
  current_value NUMERIC,
  exceeded BOOLEAN,
  message TEXT
) AS $$
BEGIN
  RETURN QUERY
  WITH current_costs AS (
    -- Calculate current costs for each domain and period
    SELECT 
      ct.domain,
      'hourly' as period,
      SUM(ct.cost_usd) FILTER (WHERE ct.created_at >= NOW() - INTERVAL '1 hour') as cost
    FROM public.chat_telemetry ct
    WHERE ct.created_at >= NOW() - INTERVAL '1 hour'
    GROUP BY ct.domain
    
    UNION ALL
    
    SELECT 
      ct.domain,
      'daily' as period,
      SUM(ct.cost_usd) FILTER (WHERE ct.created_at >= DATE_TRUNC('day', NOW())) as cost
    FROM public.chat_telemetry ct
    WHERE ct.created_at >= DATE_TRUNC('day', NOW())
    GROUP BY ct.domain
    
    UNION ALL
    
    SELECT 
      ct.domain,
      'monthly' as period,
      SUM(ct.cost_usd) FILTER (WHERE ct.created_at >= DATE_TRUNC('month', NOW())) as cost
    FROM public.chat_telemetry ct
    WHERE ct.created_at >= DATE_TRUNC('month', NOW())
    GROUP BY ct.domain
    
    UNION ALL
    
    SELECT 
      ct.domain,
      'per_request' as period,
      MAX(ct.cost_usd) as cost
    FROM public.chat_telemetry ct
    WHERE ct.created_at >= NOW() - INTERVAL '1 hour'
    GROUP BY ct.domain
  )
  SELECT 
    ca.id,
    ca.domain,
    ca.alert_type,
    ca.threshold_usd,
    cc.cost::NUMERIC(10, 6),
    cc.cost > ca.threshold_usd as exceeded,
    CASE 
      WHEN cc.cost > ca.threshold_usd THEN
        'ALERT: ' || ca.alert_type || ' cost threshold exceeded for ' || 
        COALESCE(ca.domain, 'all domains') || 
        ': $' || cc.cost::NUMERIC(10, 2)::TEXT || ' > $' || ca.threshold_usd::TEXT
      ELSE
        'OK: Within threshold (' || 
        ROUND((cc.cost / ca.threshold_usd * 100)::NUMERIC, 1)::TEXT || '% of limit)'
    END as message
  FROM public.chat_cost_alerts ca
  LEFT JOIN current_costs cc ON 
    (ca.domain IS NULL OR ca.domain = cc.domain) AND 
    ca.alert_type = cc.period
  WHERE ca.enabled = true;
END;
$$ LANGUAGE plpgsql;

-- Add comment about the migration
COMMENT ON TABLE public.chat_cost_alerts IS 'Cost threshold alerts for monitoring chat API usage costs';

-- Create summary statistics function for dashboards
CREATE OR REPLACE FUNCTION public.get_chat_cost_summary(
  p_domain TEXT DEFAULT NULL,
  p_days INTEGER DEFAULT 7
) RETURNS JSON AS $$
DECLARE
  v_result JSON;
BEGIN
  WITH summary AS (
    SELECT 
      COUNT(*) as total_requests,
      COUNT(DISTINCT session_id) as unique_sessions,
      SUM(COALESCE(input_tokens, 0)) as total_input_tokens,
      SUM(COALESCE(output_tokens, 0)) as total_output_tokens,
      SUM(COALESCE(cost_usd, 0)) as total_cost,
      AVG(COALESCE(cost_usd, 0)) as avg_cost_per_request,
      MAX(cost_usd) as max_single_request_cost,
      
      -- Model breakdown
      JSONB_OBJECT_AGG(
        model, 
        JSONB_BUILD_OBJECT(
          'requests', request_count,
          'cost', model_cost,
          'avg_cost', avg_model_cost
        )
      ) as model_costs
    FROM (
      SELECT 
        model,
        COUNT(*) as request_count,
        SUM(COALESCE(cost_usd, 0)) as model_cost,
        AVG(COALESCE(cost_usd, 0)) as avg_model_cost
      FROM public.chat_telemetry
      WHERE created_at >= CURRENT_DATE - INTERVAL '1 day' * p_days
        AND (p_domain IS NULL OR domain = p_domain)
      GROUP BY model
    ) model_stats,
    LATERAL (
      SELECT * FROM public.chat_telemetry
      WHERE created_at >= CURRENT_DATE - INTERVAL '1 day' * p_days
        AND (p_domain IS NULL OR domain = p_domain)
    ) ct
  )
  SELECT json_build_object(
    'period_days', p_days,
    'domain', p_domain,
    'total_requests', total_requests,
    'unique_sessions', unique_sessions,
    'tokens', json_build_object(
      'input', total_input_tokens,
      'output', total_output_tokens,
      'total', total_input_tokens + total_output_tokens
    ),
    'cost', json_build_object(
      'total_usd', ROUND(total_cost::NUMERIC, 4),
      'avg_per_request_usd', ROUND(avg_cost_per_request::NUMERIC, 6),
      'max_single_request_usd', ROUND(max_single_request_cost::NUMERIC, 4),
      'projected_monthly_usd', ROUND((total_cost / p_days * 30)::NUMERIC, 2)
    ),
    'model_breakdown', model_costs,
    'timestamp', NOW()
  ) INTO v_result
  FROM summary;
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- Migrate existing data to set reasonable defaults for cost calculation
UPDATE public.chat_telemetry
SET 
  input_tokens = CASE 
    WHEN tokens_used IS NOT NULL THEN (tokens_used * 0.3)::INTEGER  -- Estimate 30% input
    ELSE NULL
  END,
  output_tokens = CASE 
    WHEN tokens_used IS NOT NULL THEN (tokens_used * 0.7)::INTEGER  -- Estimate 70% output
    ELSE NULL
  END
WHERE input_tokens IS NULL 
  AND output_tokens IS NULL 
  AND tokens_used IS NOT NULL;

-- Add cost calculation for existing records
UPDATE public.chat_telemetry
SET cost_usd = public.calculate_chat_cost(model, input_tokens, output_tokens)
WHERE input_tokens IS NOT NULL 
  AND output_tokens IS NOT NULL 
  AND cost_usd IS NULL;