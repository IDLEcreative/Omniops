-- Migration: Create scrape_jobs table for background job tracking
-- Created: 2025-11-05
-- Purpose: Track web scraping jobs with status, progress, and error handling

-- Create scrape_jobs table
CREATE TABLE IF NOT EXISTS scrape_jobs (
  -- Identity
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  domain_id UUID REFERENCES domains(id) ON DELETE CASCADE,
  customer_config_id UUID REFERENCES customer_configs(id) ON DELETE CASCADE,

  -- Job identification
  domain TEXT NOT NULL,
  job_type TEXT NOT NULL DEFAULT 'full_scrape',

  -- Status tracking
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed', 'cancelled')),
  priority INTEGER DEFAULT 1,

  -- Progress tracking
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,

  -- Retry handling
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  error_message TEXT,

  -- Flexible data storage
  config JSONB DEFAULT '{}'::jsonb,
  metadata JSONB DEFAULT '{}'::jsonb,
  stats JSONB DEFAULT '{}'::jsonb,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_scrape_jobs_domain_id
  ON scrape_jobs(domain_id);

CREATE INDEX IF NOT EXISTS idx_scrape_jobs_customer_config_id
  ON scrape_jobs(customer_config_id);

CREATE INDEX IF NOT EXISTS idx_scrape_jobs_domain
  ON scrape_jobs(domain);

CREATE INDEX IF NOT EXISTS idx_scrape_jobs_status
  ON scrape_jobs(status)
  WHERE status IN ('pending', 'running');

CREATE INDEX IF NOT EXISTS idx_scrape_jobs_job_type
  ON scrape_jobs(job_type);

CREATE INDEX IF NOT EXISTS idx_scrape_jobs_created_at
  ON scrape_jobs(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_scrape_jobs_priority_created
  ON scrape_jobs(priority DESC, created_at ASC)
  WHERE status = 'pending';

-- Composite index for common queries
CREATE INDEX IF NOT EXISTS idx_scrape_jobs_domain_status
  ON scrape_jobs(domain, status);

-- Enable Row Level Security
ALTER TABLE scrape_jobs ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Service role has full access
CREATE POLICY scrape_jobs_service_role_policy ON scrape_jobs
  USING (auth.jwt()->>'role' = 'service_role');

-- RLS Policy: Users can view jobs for their organization's domains
CREATE POLICY scrape_jobs_select_policy ON scrape_jobs
  FOR SELECT
  USING (
    domain_id IN (
      SELECT id FROM domains
      WHERE organization_id IN (
        SELECT organization_id
        FROM organization_members
        WHERE user_id = auth.uid()
      )
    )
    OR
    customer_config_id IN (
      SELECT id FROM customer_configs
      WHERE organization_id IN (
        SELECT organization_id
        FROM organization_members
        WHERE user_id = auth.uid()
      )
    )
  );

-- RLS Policy: Users can insert jobs for their organization's domains
CREATE POLICY scrape_jobs_insert_policy ON scrape_jobs
  FOR INSERT
  WITH CHECK (
    domain_id IN (
      SELECT id FROM domains
      WHERE organization_id IN (
        SELECT organization_id
        FROM organization_members
        WHERE user_id = auth.uid()
      )
    )
    OR
    customer_config_id IN (
      SELECT id FROM customer_configs
      WHERE organization_id IN (
        SELECT organization_id
        FROM organization_members
        WHERE user_id = auth.uid()
      )
    )
  );

-- RLS Policy: Users can update jobs for their organization's domains
CREATE POLICY scrape_jobs_update_policy ON scrape_jobs
  FOR UPDATE
  USING (
    domain_id IN (
      SELECT id FROM domains
      WHERE organization_id IN (
        SELECT organization_id
        FROM organization_members
        WHERE user_id = auth.uid()
      )
    )
    OR
    customer_config_id IN (
      SELECT id FROM customer_configs
      WHERE organization_id IN (
        SELECT organization_id
        FROM organization_members
        WHERE user_id = auth.uid()
      )
    )
  );

-- RLS Policy: Users can delete jobs for their organization's domains
CREATE POLICY scrape_jobs_delete_policy ON scrape_jobs
  FOR DELETE
  USING (
    domain_id IN (
      SELECT id FROM domains
      WHERE organization_id IN (
        SELECT organization_id
        FROM organization_members
        WHERE user_id = auth.uid()
      )
    )
    OR
    customer_config_id IN (
      SELECT id FROM customer_configs
      WHERE organization_id IN (
        SELECT organization_id
        FROM organization_members
        WHERE user_id = auth.uid()
      )
    )
  );

-- Create trigger to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_scrape_jobs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER scrape_jobs_updated_at_trigger
  BEFORE UPDATE ON scrape_jobs
  FOR EACH ROW
  EXECUTE FUNCTION update_scrape_jobs_updated_at();

-- Add helpful comments
COMMENT ON TABLE scrape_jobs IS 'Tracks background web scraping jobs with status, progress, and error handling';
COMMENT ON COLUMN scrape_jobs.domain_id IS 'Reference to domains table (optional, for multi-tenant support)';
COMMENT ON COLUMN scrape_jobs.customer_config_id IS 'Reference to customer_configs table (optional, legacy support)';
COMMENT ON COLUMN scrape_jobs.domain IS 'Domain being scraped (denormalized for performance)';
COMMENT ON COLUMN scrape_jobs.job_type IS 'Type of scrape job (full_scrape, incremental, etc.)';
COMMENT ON COLUMN scrape_jobs.status IS 'Current status: pending, running, completed, failed, cancelled';
COMMENT ON COLUMN scrape_jobs.priority IS 'Job priority (higher = more urgent, used for queue ordering)';
COMMENT ON COLUMN scrape_jobs.retry_count IS 'Number of times job has been retried after failure';
COMMENT ON COLUMN scrape_jobs.max_retries IS 'Maximum number of retry attempts allowed';
COMMENT ON COLUMN scrape_jobs.config IS 'Job configuration (max pages, depth, selectors, etc.)';
COMMENT ON COLUMN scrape_jobs.metadata IS 'Additional metadata about the job';
COMMENT ON COLUMN scrape_jobs.stats IS 'Job execution statistics (pages scraped, errors, timing, etc.)';
