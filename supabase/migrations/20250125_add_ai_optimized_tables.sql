-- Create AI optimized content table
CREATE TABLE IF NOT EXISTS ai_optimized_content (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  domain_id UUID REFERENCES domains(id) ON DELETE CASCADE,
  source_content_id UUID REFERENCES website_content(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  content_type TEXT NOT NULL, -- 'product', 'category', 'article', 'faq', 'support'
  
  -- Original content
  raw_content TEXT,
  raw_html TEXT,
  
  -- AI-optimized content
  optimized_title TEXT,
  optimized_summary TEXT,
  optimized_content TEXT,
  key_points JSONB, -- Array of key points
  topics JSONB, -- Array of topics/tags
  
  -- SEO optimization
  meta_title TEXT,
  meta_description TEXT,
  keywords TEXT[],
  
  -- Structured data
  structured_data JSONB, -- Schema.org or other structured data
  
  -- Performance metadata  
  readability_score REAL,
  content_quality_score REAL,
  seo_score REAL,
  
  -- Processing info
  ai_model_used TEXT,
  processing_version TEXT,
  processing_tokens INTEGER,
  processing_cost DECIMAL(10,4),
  
  -- Timestamps
  processed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT unique_url_per_domain UNIQUE(domain_id, url)
);

-- Create content hashes table for deduplication
CREATE TABLE IF NOT EXISTS content_hashes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  domain_id UUID REFERENCES domains(id) ON DELETE CASCADE,
  content_hash TEXT NOT NULL,
  content_type TEXT NOT NULL,
  url TEXT NOT NULL,
  first_seen_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_seen_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  occurrence_count INTEGER DEFAULT 1,
  
  -- Metadata
  content_length INTEGER,
  content_preview TEXT, -- First 500 chars for quick identification
  
  CONSTRAINT unique_hash_per_domain UNIQUE(domain_id, content_hash)
);

-- Create page content references table
CREATE TABLE IF NOT EXISTS page_content_references (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  domain_id UUID REFERENCES domains(id) ON DELETE CASCADE,
  source_page_url TEXT NOT NULL,
  referenced_page_url TEXT NOT NULL,
  reference_type TEXT NOT NULL, -- 'link', 'image', 'iframe', 'script', 'css'
  reference_text TEXT, -- Link text or alt text
  reference_context TEXT, -- Surrounding text context
  
  -- Analysis
  internal_link BOOLEAN DEFAULT FALSE,
  broken_link BOOLEAN DEFAULT FALSE,
  redirect_chain JSONB, -- Array of redirect URLs if any
  
  -- Metadata
  discovered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_verified_at TIMESTAMP WITH TIME ZONE,
  
  CONSTRAINT unique_page_reference UNIQUE(domain_id, source_page_url, referenced_page_url, reference_type)
);

-- Create indexes for better performance
CREATE INDEX idx_ai_optimized_content_domain ON ai_optimized_content(domain_id);
CREATE INDEX idx_ai_optimized_content_url ON ai_optimized_content(url);
CREATE INDEX idx_ai_optimized_content_type ON ai_optimized_content(content_type);
CREATE INDEX idx_ai_optimized_content_processed ON ai_optimized_content(processed_at DESC);
CREATE INDEX idx_ai_optimized_content_quality ON ai_optimized_content(content_quality_score DESC);

CREATE INDEX idx_content_hashes_domain ON content_hashes(domain_id);
CREATE INDEX idx_content_hashes_hash ON content_hashes(content_hash);
CREATE INDEX idx_content_hashes_url ON content_hashes(url);
CREATE INDEX idx_content_hashes_type ON content_hashes(content_type);

CREATE INDEX idx_page_references_domain ON page_content_references(domain_id);
CREATE INDEX idx_page_references_source ON page_content_references(source_page_url);
CREATE INDEX idx_page_references_target ON page_content_references(referenced_page_url);
CREATE INDEX idx_page_references_type ON page_content_references(reference_type);
CREATE INDEX idx_page_references_internal ON page_content_references(internal_link);

-- Enable RLS
ALTER TABLE ai_optimized_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_hashes ENABLE ROW LEVEL SECURITY;
ALTER TABLE page_content_references ENABLE ROW LEVEL SECURITY;

-- RLS Policies for ai_optimized_content
CREATE POLICY "Users can view their domain's optimized content" 
ON ai_optimized_content FOR SELECT 
USING (
  domain_id IN (
    SELECT id FROM domains 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert optimized content for their domains" 
ON ai_optimized_content FOR INSERT 
WITH CHECK (
  domain_id IN (
    SELECT id FROM domains 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can update their domain's optimized content" 
ON ai_optimized_content FOR UPDATE 
USING (
  domain_id IN (
    SELECT id FROM domains 
    WHERE user_id = auth.uid()
  )
);

-- RLS Policies for content_hashes
CREATE POLICY "Users can view their domain's content hashes" 
ON content_hashes FOR SELECT 
USING (
  domain_id IN (
    SELECT id FROM domains 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert content hashes for their domains" 
ON content_hashes FOR INSERT 
WITH CHECK (
  domain_id IN (
    SELECT id FROM domains 
    WHERE user_id = auth.uid()
  )
);

-- RLS Policies for page_content_references
CREATE POLICY "Users can view their domain's page references" 
ON page_content_references FOR SELECT 
USING (
  domain_id IN (
    SELECT id FROM domains 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert page references for their domains" 
ON page_content_references FOR INSERT 
WITH CHECK (
  domain_id IN (
    SELECT id FROM domains 
    WHERE user_id = auth.uid()
  )
);

-- Functions for content management
CREATE OR REPLACE FUNCTION update_content_hash_occurrence()
RETURNS TRIGGER AS $$
BEGIN
  -- Update occurrence count and last seen timestamp
  UPDATE content_hashes 
  SET 
    occurrence_count = occurrence_count + 1,
    last_seen_at = NOW()
  WHERE domain_id = NEW.domain_id 
    AND content_hash = NEW.content_hash;
  
  -- If no update happened, insert new record
  IF NOT FOUND THEN
    INSERT INTO content_hashes (
      domain_id, content_hash, content_type, url, 
      content_length, content_preview
    ) VALUES (
      NEW.domain_id, NEW.content_hash, NEW.content_type, NEW.url,
      NEW.content_length, NEW.content_preview
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to get content quality metrics
CREATE OR REPLACE FUNCTION get_content_quality_metrics(
  p_domain_id UUID
) RETURNS TABLE (
  total_pages INTEGER,
  optimized_pages INTEGER,
  avg_quality_score REAL,
  avg_readability_score REAL,
  avg_seo_score REAL,
  content_types JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::INTEGER as total_pages,
    COUNT(CASE WHEN aoc.id IS NOT NULL THEN 1 END)::INTEGER as optimized_pages,
    AVG(aoc.content_quality_score) as avg_quality_score,
    AVG(aoc.readability_score) as avg_readability_score,
    AVG(aoc.seo_score) as avg_seo_score,
    jsonb_agg(DISTINCT aoc.content_type) FILTER (WHERE aoc.content_type IS NOT NULL) as content_types
  FROM website_content wc
  LEFT JOIN ai_optimized_content aoc ON wc.id = aoc.source_content_id
  WHERE wc.domain_id = p_domain_id;
END;
$$ LANGUAGE plpgsql;

-- Function to find duplicate content
CREATE OR REPLACE FUNCTION find_duplicate_content(
  p_domain_id UUID,
  p_min_occurrences INTEGER DEFAULT 2
) RETURNS TABLE (
  content_hash TEXT,
  occurrence_count INTEGER,
  urls TEXT[]
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ch.content_hash,
    ch.occurrence_count,
    array_agg(ch.url) as urls
  FROM content_hashes ch
  WHERE ch.domain_id = p_domain_id
    AND ch.occurrence_count >= p_min_occurrences
  GROUP BY ch.content_hash, ch.occurrence_count
  ORDER BY ch.occurrence_count DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to get broken links
CREATE OR REPLACE FUNCTION get_broken_links(
  p_domain_id UUID
) RETURNS TABLE (
  source_url TEXT,
  broken_url TEXT,
  reference_type TEXT,
  reference_text TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pcr.source_page_url as source_url,
    pcr.referenced_page_url as broken_url,
    pcr.reference_type,
    pcr.reference_text
  FROM page_content_references pcr
  WHERE pcr.domain_id = p_domain_id
    AND pcr.broken_link = TRUE
  ORDER BY pcr.source_page_url, pcr.referenced_page_url;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update updated_at on ai_optimized_content
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_ai_optimized_content_updated_at
  BEFORE UPDATE ON ai_optimized_content
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
COMMENT ON TABLE ai_optimized_content IS 'Stores AI-optimized versions of website content for improved quality and SEO';
COMMENT ON TABLE content_hashes IS 'Tracks content hashes for deduplication and change detection';
COMMENT ON TABLE page_content_references IS 'Maps relationships between pages for link analysis and broken link detection';

COMMENT ON FUNCTION get_content_quality_metrics IS 'Returns aggregated content quality metrics for a domain';
COMMENT ON FUNCTION find_duplicate_content IS 'Finds content that appears multiple times across different URLs';
COMMENT ON FUNCTION get_broken_links IS 'Returns all broken links detected in a domain';