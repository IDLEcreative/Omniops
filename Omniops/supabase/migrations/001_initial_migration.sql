-- Website Content Scraping Migration
-- Run this entire file in your Supabase SQL Editor

-- Step 1: Add columns to existing tables
ALTER TABLE website_content 
ADD COLUMN IF NOT EXISTS content_hash TEXT;

ALTER TABLE domains
ADD COLUMN IF NOT EXISTS last_content_refresh TIMESTAMP WITH TIME ZONE;

-- Step 2: Create indexes
CREATE INDEX IF NOT EXISTS idx_website_content_hash 
ON website_content(domain_id, content_hash);

-- Step 3: Create structured_extractions table
CREATE TABLE IF NOT EXISTS structured_extractions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  domain_id UUID REFERENCES domains(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  extract_type TEXT NOT NULL,
  extracted_data JSONB NOT NULL,
  schema_used JSONB,
  extracted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_structured_extractions_domain ON structured_extractions(domain_id);
CREATE INDEX IF NOT EXISTS idx_structured_extractions_type ON structured_extractions(extract_type);
CREATE INDEX IF NOT EXISTS idx_structured_extractions_url ON structured_extractions(url);

-- Step 4: Create content_refresh_jobs table
CREATE TABLE IF NOT EXISTS content_refresh_jobs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  domain_id UUID REFERENCES domains(id) ON DELETE CASCADE,
  job_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  config JSONB,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  error TEXT,
  stats JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_refresh_jobs_domain ON content_refresh_jobs(domain_id);
CREATE INDEX IF NOT EXISTS idx_refresh_jobs_status ON content_refresh_jobs(status);
CREATE INDEX IF NOT EXISTS idx_refresh_jobs_created ON content_refresh_jobs(created_at DESC);

-- Step 5: Enable RLS
ALTER TABLE structured_extractions ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_refresh_jobs ENABLE ROW LEVEL SECURITY;

-- Step 6: Create RLS policies
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

-- Step 7: Create helper function
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

-- Step 8: Create or update search function
CREATE OR REPLACE FUNCTION search_embeddings(
  query_embedding vector(1536),
  domain_id UUID,
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 5
)
RETURNS TABLE (
  content text,
  url text,
  title text,
  similarity float
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ce.chunk_text as content,
    wc.url,
    wc.title,
    1 - (ce.embedding <=> query_embedding) as similarity
  FROM content_embeddings ce
  JOIN website_content wc ON ce.content_id = wc.id
  WHERE wc.domain_id = search_embeddings.domain_id
    AND 1 - (ce.embedding <=> query_embedding) > match_threshold
  ORDER BY ce.embedding <=> query_embedding
  LIMIT match_count;
END;
$$ LANGUAGE plpgsql;

-- Verify migration success
SELECT 'Migration completed successfully!' as status;