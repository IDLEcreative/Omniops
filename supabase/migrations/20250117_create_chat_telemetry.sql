-- Create chat_telemetry table for observability and monitoring
CREATE TABLE IF NOT EXISTS public.chat_telemetry (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL,
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE,
  model TEXT NOT NULL,
  
  -- Timing information
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ,
  duration_ms INTEGER,
  
  -- AI execution details
  iterations INTEGER DEFAULT 0,
  max_iterations INTEGER DEFAULT 3,
  
  -- Search statistics
  search_count INTEGER DEFAULT 0,
  total_results INTEGER DEFAULT 0,
  searches JSONB DEFAULT '[]'::JSONB, -- Array of search operations
  
  -- Token usage (optional, for cost tracking)
  tokens_used INTEGER,
  
  -- Response information
  success BOOLEAN DEFAULT false,
  error TEXT,
  final_response_length INTEGER,
  
  -- Detailed logs (optional, for debugging)
  logs JSONB DEFAULT '[]'::JSONB,
  
  -- Metadata
  domain TEXT,
  user_agent TEXT,
  ip_address TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_chat_telemetry_session_id ON public.chat_telemetry(session_id);
CREATE INDEX IF NOT EXISTS idx_chat_telemetry_conversation_id ON public.chat_telemetry(conversation_id);
CREATE INDEX IF NOT EXISTS idx_chat_telemetry_created_at ON public.chat_telemetry(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_telemetry_success ON public.chat_telemetry(success);
CREATE INDEX IF NOT EXISTS idx_chat_telemetry_duration ON public.chat_telemetry(duration_ms);
CREATE INDEX IF NOT EXISTS idx_chat_telemetry_search_count ON public.chat_telemetry(search_count);
CREATE INDEX IF NOT EXISTS idx_chat_telemetry_domain ON public.chat_telemetry(domain);

-- Create composite index for common queries
CREATE INDEX IF NOT EXISTS idx_chat_telemetry_domain_created ON public.chat_telemetry(domain, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_telemetry_success_duration ON public.chat_telemetry(success, duration_ms);

-- Add GIN index for JSONB columns for efficient JSON queries
CREATE INDEX IF NOT EXISTS idx_chat_telemetry_searches_gin ON public.chat_telemetry USING GIN(searches);
CREATE INDEX IF NOT EXISTS idx_chat_telemetry_logs_gin ON public.chat_telemetry USING GIN(logs);

-- Create aggregated view for quick metrics
CREATE OR REPLACE VIEW public.chat_telemetry_metrics AS
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

-- Create function to clean old telemetry data (keep last 30 days)
CREATE OR REPLACE FUNCTION public.cleanup_old_telemetry()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.chat_telemetry
  WHERE created_at < NOW() - INTERVAL '30 days';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Create RLS policies
ALTER TABLE public.chat_telemetry ENABLE ROW LEVEL SECURITY;

-- Policy for service role (full access)
CREATE POLICY "Service role can manage all telemetry" ON public.chat_telemetry
  FOR ALL
  USING (auth.role() = 'service_role');

-- Policy for authenticated users to view their own session telemetry
CREATE POLICY "Users can view their own telemetry" ON public.chat_telemetry
  FOR SELECT
  USING (
    auth.role() = 'authenticated' AND 
    session_id IN (
      SELECT DISTINCT session_id 
      FROM public.conversations 
      WHERE user_id = auth.uid()
    )
  );

-- Add comment to table
COMMENT ON TABLE public.chat_telemetry IS 'Stores telemetry and observability data for chat sessions including searches, performance metrics, and debugging information';

-- Add comments to important columns
COMMENT ON COLUMN public.chat_telemetry.session_id IS 'Unique session identifier from the client';
COMMENT ON COLUMN public.chat_telemetry.searches IS 'JSONB array of search operations with tool, query, results, duration, and source';
COMMENT ON COLUMN public.chat_telemetry.duration_ms IS 'Total duration of the chat request in milliseconds';
COMMENT ON COLUMN public.chat_telemetry.success IS 'Whether the chat request completed successfully';
COMMENT ON COLUMN public.chat_telemetry.logs IS 'Detailed logs for debugging (only populated in development or debug mode)';