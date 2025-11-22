-- Migration: Add scrape job audit trail for permanent job history
-- Created: 2025-11-22
-- Purpose: Persist scraping job metadata and results beyond Redis TTL for audit and analytics

-- Create scrape_jobs table for job metadata and status tracking
CREATE TABLE IF NOT EXISTS public.scrape_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id TEXT NOT NULL UNIQUE,
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  domain TEXT NOT NULL,
  job_type TEXT NOT NULL CHECK (job_type IN ('full_crawl', 'incremental', 'single_page', 'refresh')),
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'running', 'completed', 'failed', 'cancelled')),
  priority INTEGER DEFAULT 0,
  config JSONB,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3
);

-- Create scrape_job_results table for detailed page-level results
CREATE TABLE IF NOT EXISTS public.scrape_job_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id TEXT NOT NULL REFERENCES public.scrape_jobs(job_id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('success', 'failed', 'skipped')),
  http_status INTEGER,
  content_hash TEXT,
  page_id UUID REFERENCES public.scraped_pages(id) ON DELETE SET NULL,
  error_message TEXT,
  processing_time_ms INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create scrape_job_stats table for aggregated job statistics
CREATE TABLE IF NOT EXISTS public.scrape_job_stats (
  job_id TEXT PRIMARY KEY REFERENCES public.scrape_jobs(job_id) ON DELETE CASCADE,
  total_pages INTEGER DEFAULT 0,
  successful_pages INTEGER DEFAULT 0,
  failed_pages INTEGER DEFAULT 0,
  skipped_pages INTEGER DEFAULT 0,
  total_processing_time_ms BIGINT DEFAULT 0,
  avg_processing_time_ms INTEGER DEFAULT 0,
  pages_per_second DECIMAL(10, 2) DEFAULT 0,
  total_bytes BIGINT DEFAULT 0,
  embeddings_generated INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_scrape_jobs_customer_id ON public.scrape_jobs(customer_id);
CREATE INDEX IF NOT EXISTS idx_scrape_jobs_domain ON public.scrape_jobs(domain);
CREATE INDEX IF NOT EXISTS idx_scrape_jobs_status ON public.scrape_jobs(status);
CREATE INDEX IF NOT EXISTS idx_scrape_jobs_created_at ON public.scrape_jobs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_scrape_jobs_job_type ON public.scrape_jobs(job_type);

CREATE INDEX IF NOT EXISTS idx_scrape_job_results_job_id ON public.scrape_job_results(job_id);
CREATE INDEX IF NOT EXISTS idx_scrape_job_results_customer_id ON public.scrape_job_results(customer_id);
CREATE INDEX IF NOT EXISTS idx_scrape_job_results_url ON public.scrape_job_results(url);
CREATE INDEX IF NOT EXISTS idx_scrape_job_results_status ON public.scrape_job_results(status);
CREATE INDEX IF NOT EXISTS idx_scrape_job_results_created_at ON public.scrape_job_results(created_at DESC);

-- Add RLS policies for multi-tenant isolation
ALTER TABLE public.scrape_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scrape_job_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scrape_job_stats ENABLE ROW LEVEL SECURITY;

-- Policies for scrape_jobs
CREATE POLICY scrape_jobs_select_policy ON public.scrape_jobs
  FOR SELECT
  USING (
    customer_id IN (
      SELECT id FROM public.customers
      WHERE domain = current_setting('app.current_domain', true)
    )
  );

CREATE POLICY scrape_jobs_service_role_policy ON public.scrape_jobs
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Policies for scrape_job_results
CREATE POLICY scrape_job_results_select_policy ON public.scrape_job_results
  FOR SELECT
  USING (
    customer_id IN (
      SELECT id FROM public.customers
      WHERE domain = current_setting('app.current_domain', true)
    )
  );

CREATE POLICY scrape_job_results_service_role_policy ON public.scrape_job_results
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Policies for scrape_job_stats
CREATE POLICY scrape_job_stats_select_policy ON public.scrape_job_stats
  FOR SELECT
  USING (
    job_id IN (
      SELECT job_id FROM public.scrape_jobs
      WHERE customer_id IN (
        SELECT id FROM public.customers
        WHERE domain = current_setting('app.current_domain', true)
      )
    )
  );

CREATE POLICY scrape_job_stats_service_role_policy ON public.scrape_job_stats
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Add comments
COMMENT ON TABLE public.scrape_jobs IS 'Persistent audit trail of all web scraping jobs, stored beyond Redis TTL';
COMMENT ON TABLE public.scrape_job_results IS 'Detailed page-level results for each scraping job';
COMMENT ON TABLE public.scrape_job_stats IS 'Aggregated statistics for scraping jobs';

-- Create function to update job statistics
CREATE OR REPLACE FUNCTION update_scrape_job_stats()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.scrape_job_stats (job_id, total_pages, successful_pages, failed_pages, skipped_pages, total_processing_time_ms)
  VALUES (NEW.job_id, 1,
    CASE WHEN NEW.status = 'success' THEN 1 ELSE 0 END,
    CASE WHEN NEW.status = 'failed' THEN 1 ELSE 0 END,
    CASE WHEN NEW.status = 'skipped' THEN 1 ELSE 0 END,
    COALESCE(NEW.processing_time_ms, 0)
  )
  ON CONFLICT (job_id) DO UPDATE SET
    total_pages = scrape_job_stats.total_pages + 1,
    successful_pages = scrape_job_stats.successful_pages + CASE WHEN NEW.status = 'success' THEN 1 ELSE 0 END,
    failed_pages = scrape_job_stats.failed_pages + CASE WHEN NEW.status = 'failed' THEN 1 ELSE 0 END,
    skipped_pages = scrape_job_stats.skipped_pages + CASE WHEN NEW.status = 'skipped' THEN 1 ELSE 0 END,
    total_processing_time_ms = scrape_job_stats.total_processing_time_ms + COALESCE(NEW.processing_time_ms, 0),
    avg_processing_time_ms = (scrape_job_stats.total_processing_time_ms + COALESCE(NEW.processing_time_ms, 0)) / (scrape_job_stats.total_pages + 1),
    updated_at = NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to auto-update stats
CREATE TRIGGER update_scrape_job_stats_trigger
  AFTER INSERT ON public.scrape_job_results
  FOR EACH ROW
  EXECUTE FUNCTION update_scrape_job_stats();

-- Create function to clean up old job data
CREATE OR REPLACE FUNCTION cleanup_old_scrape_jobs(retention_days INTEGER DEFAULT 90)
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Delete old completed/failed jobs beyond retention period
  DELETE FROM public.scrape_jobs
  WHERE status IN ('completed', 'failed', 'cancelled')
    AND completed_at < NOW() - (retention_days || ' days')::INTERVAL;

  GET DIAGNOSTICS deleted_count = ROW_COUNT;

  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION cleanup_old_scrape_jobs IS 'Removes scraping job data older than retention period (default 90 days)';
