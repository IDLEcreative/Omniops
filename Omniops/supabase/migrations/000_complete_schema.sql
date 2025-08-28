-- Complete Database Schema for AI Customer Service Agent
-- This creates all necessary tables for web scraping, embeddings, and chat functionality
-- Run this entire file in your Supabase SQL Editor

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For text search

-- =====================================================
-- CORE TABLES
-- =====================================================

-- Customers table (for multi-tenant support)
CREATE TABLE IF NOT EXISTS customers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  company_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Customer configurations
CREATE TABLE IF NOT EXISTS customer_configs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  domain TEXT UNIQUE NOT NULL,
  business_name TEXT,
  business_description TEXT,
  primary_color TEXT DEFAULT '#000000',
  welcome_message TEXT,
  suggested_questions JSONB DEFAULT '[]'::jsonb,
  woocommerce_url TEXT,
  woocommerce_consumer_key TEXT,
  woocommerce_consumer_secret TEXT,
  encrypted_credentials JSONB,
  rate_limit INTEGER DEFAULT 10,
  allowed_origins TEXT[] DEFAULT ARRAY['*'],
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Domains being scraped
CREATE TABLE IF NOT EXISTS domains (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  domain TEXT UNIQUE NOT NULL,
  name TEXT,
  description TEXT,
  last_scraped_at TIMESTAMP WITH TIME ZONE,
  last_content_refresh TIMESTAMP WITH TIME ZONE,
  scrape_frequency TEXT DEFAULT 'weekly', -- 'daily', 'weekly', 'monthly'
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- SCRAPING & CONTENT TABLES
-- =====================================================

-- Raw scraped pages
CREATE TABLE IF NOT EXISTS scraped_pages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  domain_id UUID REFERENCES domains(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  title TEXT,
  content TEXT,
  html TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  status TEXT DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'error'
  error_message TEXT,
  scraped_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_modified TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT unique_domain_url UNIQUE(domain_id, url)
);

-- Structured website content
CREATE TABLE IF NOT EXISTS website_content (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  domain_id UUID REFERENCES domains(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  title TEXT,
  content TEXT,
  summary TEXT,
  content_type TEXT, -- 'page', 'product', 'article', 'faq', etc.
  content_hash TEXT, -- For change detection
  metadata JSONB DEFAULT '{}'::jsonb,
  scraped_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT unique_domain_content_url UNIQUE(domain_id, url)
);

-- Vector embeddings for scraped pages
CREATE TABLE IF NOT EXISTS page_embeddings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  page_id UUID REFERENCES scraped_pages(id) ON DELETE CASCADE,
  chunk_text TEXT NOT NULL,
  embedding vector(1536), -- OpenAI embedding dimension
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Content embeddings for semantic search
CREATE TABLE IF NOT EXISTS content_embeddings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  content_id UUID REFERENCES website_content(id) ON DELETE CASCADE,
  chunk_text TEXT NOT NULL,
  embedding vector(1536),
  chunk_index INTEGER,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- STRUCTURED DATA EXTRACTION
-- =====================================================

-- Flexible storage for extracted structured data
CREATE TABLE IF NOT EXISTS structured_extractions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  domain_id UUID REFERENCES domains(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  extract_type TEXT NOT NULL, -- 'products', 'faqs', 'contact', 'services', etc.
  extracted_data JSONB NOT NULL, -- Flexible schema for any type of data
  schema_used JSONB, -- Track what schema/version was used
  confidence_score FLOAT,
  extracted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Content refresh tracking
CREATE TABLE IF NOT EXISTS content_refresh_jobs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  domain_id UUID REFERENCES domains(id) ON DELETE CASCADE,
  job_type TEXT NOT NULL, -- 'full_refresh', 'incremental', 'single_page'
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
  config JSONB DEFAULT '{}'::jsonb,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  error TEXT,
  stats JSONB DEFAULT '{}'::jsonb, -- { pages_scraped: 0, pages_updated: 0, errors: 0 }
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- AI OPTIMIZATION TABLES
-- =====================================================

-- AI-optimized content
CREATE TABLE IF NOT EXISTS ai_optimized_content (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  domain_id UUID REFERENCES domains(id) ON DELETE CASCADE,
  source_content_id UUID REFERENCES website_content(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  content_type TEXT NOT NULL,
  
  -- Original content
  raw_content TEXT,
  raw_html TEXT,
  
  -- AI-optimized content
  optimized_title TEXT,
  optimized_summary TEXT,
  optimized_content TEXT,
  key_points JSONB DEFAULT '[]'::jsonb,
  topics JSONB DEFAULT '[]'::jsonb,
  
  -- SEO optimization
  meta_title TEXT,
  meta_description TEXT,
  keywords TEXT[],
  
  -- Structured data
  structured_data JSONB DEFAULT '{}'::jsonb,
  
  -- Performance metadata  
  readability_score REAL,
  content_quality_score REAL,
  seo_score REAL,
  
  -- Processing info
  ai_model_used TEXT,
  processing_version TEXT,
  processing_tokens INTEGER,
  processing_cost DECIMAL(10,4),
  
  processed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT unique_ai_url_per_domain UNIQUE(domain_id, url)
);

-- Content deduplication tracking
CREATE TABLE IF NOT EXISTS content_hashes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  domain_id UUID REFERENCES domains(id) ON DELETE CASCADE,
  content_hash TEXT NOT NULL,
  content_type TEXT NOT NULL,
  url TEXT NOT NULL,
  first_seen_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_seen_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  occurrence_count INTEGER DEFAULT 1,
  content_length INTEGER,
  content_preview TEXT,
  
  CONSTRAINT unique_hash_per_domain UNIQUE(domain_id, content_hash)
);

-- Page relationships and references
CREATE TABLE IF NOT EXISTS page_content_references (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  domain_id UUID REFERENCES domains(id) ON DELETE CASCADE,
  source_page_url TEXT NOT NULL,
  referenced_page_url TEXT NOT NULL,
  reference_type TEXT NOT NULL, -- 'link', 'image', 'iframe', 'script', 'css'
  reference_text TEXT,
  reference_context TEXT,
  internal_link BOOLEAN DEFAULT FALSE,
  broken_link BOOLEAN DEFAULT FALSE,
  redirect_chain JSONB DEFAULT '[]'::jsonb,
  discovered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_verified_at TIMESTAMP WITH TIME ZONE,
  
  CONSTRAINT unique_page_reference UNIQUE(domain_id, source_page_url, referenced_page_url, reference_type)
);

-- =====================================================
-- CHAT & TRAINING TABLES
-- =====================================================

-- Training data for the AI
CREATE TABLE IF NOT EXISTS training_data (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  domain_id UUID REFERENCES domains(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- 'url', 'text', 'qa', 'file'
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  status TEXT DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'error'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Conversations
CREATE TABLE IF NOT EXISTS conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  domain_id UUID REFERENCES domains(id) ON DELETE CASCADE,
  session_id TEXT,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ended_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Chat messages
CREATE TABLE IF NOT EXISTS messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL, -- 'user', 'assistant', 'system'
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Scraped pages indexes
CREATE INDEX IF NOT EXISTS idx_scraped_pages_domain ON scraped_pages(domain_id);
CREATE INDEX IF NOT EXISTS idx_scraped_pages_url ON scraped_pages(url);
CREATE INDEX IF NOT EXISTS idx_scraped_pages_scraped_at ON scraped_pages(scraped_at DESC);

-- Website content indexes
CREATE INDEX IF NOT EXISTS idx_website_content_domain ON website_content(domain_id);
CREATE INDEX IF NOT EXISTS idx_website_content_url ON website_content(url);
CREATE INDEX IF NOT EXISTS idx_website_content_type ON website_content(content_type);
CREATE INDEX IF NOT EXISTS idx_website_content_hash ON website_content(domain_id, content_hash);

-- Embeddings indexes
CREATE INDEX IF NOT EXISTS idx_page_embeddings_page ON page_embeddings(page_id);
CREATE INDEX IF NOT EXISTS idx_content_embeddings_content ON content_embeddings(content_id);

-- Vector similarity search indexes (using IVFFlat)
CREATE INDEX IF NOT EXISTS idx_page_embeddings_vector ON page_embeddings 
USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
CREATE INDEX IF NOT EXISTS idx_content_embeddings_vector ON content_embeddings 
USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Structured extractions indexes
CREATE INDEX IF NOT EXISTS idx_structured_extractions_domain ON structured_extractions(domain_id);
CREATE INDEX IF NOT EXISTS idx_structured_extractions_type ON structured_extractions(extract_type);
CREATE INDEX IF NOT EXISTS idx_structured_extractions_url ON structured_extractions(url);

-- Content refresh jobs indexes
CREATE INDEX IF NOT EXISTS idx_refresh_jobs_domain ON content_refresh_jobs(domain_id);
CREATE INDEX IF NOT EXISTS idx_refresh_jobs_status ON content_refresh_jobs(status);
CREATE INDEX IF NOT EXISTS idx_refresh_jobs_created ON content_refresh_jobs(created_at DESC);

-- AI optimized content indexes
CREATE INDEX IF NOT EXISTS idx_ai_optimized_content_domain ON ai_optimized_content(domain_id);
CREATE INDEX IF NOT EXISTS idx_ai_optimized_content_url ON ai_optimized_content(url);
CREATE INDEX IF NOT EXISTS idx_ai_optimized_content_type ON ai_optimized_content(content_type);

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE domains ENABLE ROW LEVEL SECURITY;
ALTER TABLE scraped_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE website_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE page_embeddings ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_embeddings ENABLE ROW LEVEL SECURITY;
ALTER TABLE structured_extractions ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_refresh_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_optimized_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_hashes ENABLE ROW LEVEL SECURITY;
ALTER TABLE page_content_references ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for domains table
CREATE POLICY "Users can view their own domains" ON domains
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own domains" ON domains
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own domains" ON domains
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own domains" ON domains
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for structured_extractions
CREATE POLICY "Users can view their domain's extractions" ON structured_extractions
  FOR SELECT USING (
    domain_id IN (SELECT id FROM domains WHERE user_id = auth.uid())
  );
CREATE POLICY "Users can insert extractions for their domains" ON structured_extractions
  FOR INSERT WITH CHECK (
    domain_id IN (SELECT id FROM domains WHERE user_id = auth.uid())
  );

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Function for semantic search using embeddings
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

-- Function to get stale content for refresh
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

-- Trigger to update updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to relevant tables
CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_customer_configs_updated_at BEFORE UPDATE ON customer_configs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_domains_updated_at BEFORE UPDATE ON domains
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_website_content_updated_at BEFORE UPDATE ON website_content
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_ai_optimized_content_updated_at BEFORE UPDATE ON ai_optimized_content
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- FINAL SETUP
-- =====================================================

-- Grant necessary permissions (adjust as needed)
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- Success message
SELECT 'Complete schema created successfully! All tables, indexes, and functions are ready.' as status;