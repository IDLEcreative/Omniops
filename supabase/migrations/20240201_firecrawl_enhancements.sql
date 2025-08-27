-- Add content hash for change detection
ALTER TABLE website_content 
ADD COLUMN IF NOT EXISTS content_hash TEXT;

-- Add last refresh timestamp to domains
ALTER TABLE domains
ADD COLUMN IF NOT EXISTS last_content_refresh TIMESTAMP WITH TIME ZONE;

-- Create index on content hash for faster lookups
CREATE INDEX IF NOT EXISTS idx_website_content_hash 
ON website_content(domain_id, content_hash);

-- Create table for structured extractions
CREATE TABLE IF NOT EXISTS structured_extractions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  domain_id UUID REFERENCES domains(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  extract_type TEXT NOT NULL,
  extracted_data JSONB NOT NULL,
  schema_used JSONB,
  extracted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  -- Indexes
  INDEX idx_structured_extractions_domain (domain_id),
  INDEX idx_structured_extractions_type (extract_type),
  INDEX idx_structured_extractions_url (url)
);

-- Create table for content refresh jobs
CREATE TABLE IF NOT EXISTS content_refresh_jobs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  domain_id UUID REFERENCES domains(id) ON DELETE CASCADE,
  job_type TEXT NOT NULL, -- 'full_refresh', 'incremental', 'single_page'
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
  config JSONB,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  error TEXT,
  stats JSONB, -- { refreshed: 0, skipped: 0, failed: 0 }
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  -- Indexes
  INDEX idx_refresh_jobs_domain (domain_id),
  INDEX idx_refresh_jobs_status (status),
  INDEX idx_refresh_jobs_created (created_at DESC)
);

-- Update RLS policies for new tables
ALTER TABLE structured_extractions ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_refresh_jobs ENABLE ROW LEVEL SECURITY;

-- Policy for structured_extractions (same as website_content)
CREATE POLICY "Users can view their domain's extractions" 
ON structured_extractions FOR SELECT 
USING (
  domain_id IN (
    SELECT id FROM domains 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert extractions for their domains" 
ON structured_extractions FOR INSERT 
WITH CHECK (
  domain_id IN (
    SELECT id FROM domains 
    WHERE user_id = auth.uid()
  )
);

-- Policy for content_refresh_jobs
CREATE POLICY "Users can view their domain's refresh jobs" 
ON content_refresh_jobs FOR SELECT 
USING (
  domain_id IN (
    SELECT id FROM domains 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can create refresh jobs for their domains" 
ON content_refresh_jobs FOR INSERT 
WITH CHECK (
  domain_id IN (
    SELECT id FROM domains 
    WHERE user_id = auth.uid()
  )
);

-- Function to get content that needs refreshing
CREATE OR REPLACE FUNCTION get_stale_content(
  p_domain_id UUID,
  p_hours_threshold INTEGER DEFAULT 24
)
RETURNS TABLE (
  id UUID,
  url TEXT,
  scraped_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    wc.id,
    wc.url,
    wc.scraped_at
  FROM website_content wc
  WHERE wc.domain_id = p_domain_id
    AND wc.scraped_at < NOW() - INTERVAL '1 hour' * p_hours_threshold
  ORDER BY wc.scraped_at ASC;
END;
$$ LANGUAGE plpgsql;

-- Add comment for documentation
COMMENT ON FUNCTION get_stale_content IS 'Returns website content that hasn''t been refreshed within the specified hours threshold';