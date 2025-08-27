-- Complete Database Schema for AI Customer Service Agent (FIXED)
-- This creates all necessary tables for web scraping, embeddings, and chat functionality
-- Run this entire file in your Supabase SQL Editor

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For text search

-- =====================================================
-- DROP EXISTING TABLES (if they exist) to start fresh
-- Comment out this section if you want to preserve existing data
-- =====================================================
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS conversations CASCADE;
DROP TABLE IF EXISTS training_data CASCADE;
DROP TABLE IF EXISTS page_content_references CASCADE;
DROP TABLE IF EXISTS content_hashes CASCADE;
DROP TABLE IF EXISTS ai_optimized_content CASCADE;
DROP TABLE IF EXISTS content_refresh_jobs CASCADE;
DROP TABLE IF EXISTS structured_extractions CASCADE;
DROP TABLE IF EXISTS content_embeddings CASCADE;
DROP TABLE IF EXISTS page_embeddings CASCADE;
DROP TABLE IF EXISTS website_content CASCADE;
DROP TABLE IF EXISTS scraped_pages CASCADE;
DROP TABLE IF EXISTS domains CASCADE;
DROP TABLE IF EXISTS customer_configs CASCADE;
DROP TABLE IF EXISTS customers CASCADE;

-- Drop functions if they exist
DROP FUNCTION IF EXISTS search_embeddings CASCADE;
DROP FUNCTION IF EXISTS get_stale_content CASCADE;
DROP FUNCTION IF EXISTS get_content_quality_metrics CASCADE;
DROP FUNCTION IF EXISTS find_duplicate_content CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column CASCADE;

-- =====================================================
-- CORE TABLES
-- =====================================================

-- Customers table (for multi-tenant support)
CREATE TABLE customers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  company_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Customer configurations
CREATE TABLE customer_configs (
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
CREATE TABLE domains (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  domain TEXT UNIQUE NOT NULL,
  name TEXT,
  description TEXT,
  last_scraped_at TIMESTAMP WITH TIME ZONE,
  last_content_refresh TIMESTAMP WITH TIME ZONE,
  scrape_frequency TEXT DEFAULT 'weekly',
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- SCRAPING & CONTENT TABLES
-- =====================================================

-- Raw scraped pages
CREATE TABLE scraped_pages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  domain_id UUID REFERENCES domains(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  title TEXT,
  content TEXT,
  html TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  status TEXT DEFAULT 'pending',
  error_message TEXT,
  scraped_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_modified TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT unique_domain_url UNIQUE(domain_id, url)
);

-- Structured website content
CREATE TABLE website_content (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  domain_id UUID REFERENCES domains(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  title TEXT,
  content TEXT,
  summary TEXT,
  content_type TEXT,
  content_hash TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  scraped_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT unique_domain_content_url UNIQUE(domain_id, url)
);

-- Vector embeddings for scraped pages
CREATE TABLE page_embeddings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  page_id UUID REFERENCES scraped_pages(id) ON DELETE CASCADE,
  chunk_text TEXT NOT NULL,
  embedding vector(1536),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Content embeddings for semantic search
CREATE TABLE content_embeddings (
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
CREATE TABLE structured_extractions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  domain_id UUID REFERENCES domains(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  extract_type TEXT NOT NULL,
  extracted_data JSONB NOT NULL,
  schema_used JSONB,
  confidence_score FLOAT,
  extracted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Content refresh tracking
CREATE TABLE content_refresh_jobs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  domain_id UUID REFERENCES domains(id) ON DELETE CASCADE,
  job_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  config JSONB DEFAULT '{}'::jsonb,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  error TEXT,
  stats JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- AI OPTIMIZATION TABLES
-- =====================================================

-- AI-optimized content
CREATE TABLE ai_optimized_content (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  domain_id UUID REFERENCES domains(id) ON DELETE CASCADE,
  source_content_id UUID REFERENCES website_content(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  content_type TEXT NOT NULL,
  raw_content TEXT,
  raw_html TEXT,
  optimized_title TEXT,
  optimized_summary TEXT,
  optimized_content TEXT,
  key_points JSONB DEFAULT '[]'::jsonb,
  topics JSONB DEFAULT '[]'::jsonb,
  meta_title TEXT,
  meta_description TEXT,
  keywords TEXT[],
  structured_data JSONB DEFAULT '{}'::jsonb,
  readability_score REAL,
  content_quality_score REAL,
  seo_score REAL,
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
CREATE TABLE content_hashes (
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
CREATE TABLE page_content_references (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  domain_id UUID REFERENCES domains(id) ON DELETE CASCADE,
  source_page_url TEXT NOT NULL,
  referenced_page_url TEXT NOT NULL,
  reference_type TEXT NOT NULL,
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
CREATE TABLE training_data (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  domain_id UUID REFERENCES domains(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Conversations
CREATE TABLE conversations (
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
CREATE TABLE messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Scraped pages indexes
CREATE INDEX idx_scraped_pages_domain ON scraped_pages(domain_id);
CREATE INDEX idx_scraped_pages_url ON scraped_pages(url);
CREATE INDEX idx_scraped_pages_scraped_at ON scraped_pages(scraped_at DESC);

-- Website content indexes
CREATE INDEX idx_website_content_domain ON website_content(domain_id);
CREATE INDEX idx_website_content_url ON website_content(url);
CREATE INDEX idx_website_content_type ON website_content(content_type);
CREATE INDEX idx_website_content_hash ON website_content(domain_id, content_hash);

-- Embeddings indexes
CREATE INDEX idx_page_embeddings_page ON page_embeddings(page_id);
CREATE INDEX idx_content_embeddings_content ON content_embeddings(content_id);

-- Structured extractions indexes
CREATE INDEX idx_structured_extractions_domain ON structured_extractions(domain_id);
CREATE INDEX idx_structured_extractions_type ON structured_extractions(extract_type);
CREATE INDEX idx_structured_extractions_url ON structured_extractions(url);

-- Content refresh jobs indexes
CREATE INDEX idx_refresh_jobs_domain ON content_refresh_jobs(domain_id);
CREATE INDEX idx_refresh_jobs_status ON content_refresh_jobs(status);
CREATE INDEX idx_refresh_jobs_created ON content_refresh_jobs(created_at DESC);

-- AI optimized content indexes
CREATE INDEX idx_ai_optimized_content_domain ON ai_optimized_content(domain_id);
CREATE INDEX idx_ai_optimized_content_url ON ai_optimized_content(url);
CREATE INDEX idx_ai_optimized_content_type ON ai_optimized_content(content_type);

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

-- RLS Policies for website_content
CREATE POLICY "Users can view their domain's content" ON website_content
  FOR SELECT USING (
    domain_id IN (SELECT id FROM domains WHERE user_id = auth.uid())
  );
CREATE POLICY "Users can insert content for their domains" ON website_content
  FOR INSERT WITH CHECK (
    domain_id IN (SELECT id FROM domains WHERE user_id = auth.uid())
  );

-- RLS Policies for scraped_pages
CREATE POLICY "Users can view their domain's pages" ON scraped_pages
  FOR SELECT USING (
    domain_id IN (SELECT id FROM domains WHERE user_id = auth.uid())
  );
CREATE POLICY "Users can insert pages for their domains" ON scraped_pages
  FOR INSERT WITH CHECK (
    domain_id IN (SELECT id FROM domains WHERE user_id = auth.uid())
  );

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Function for semantic search using embeddings
CREATE OR REPLACE FUNCTION search_embeddings(
  query_embedding vector(1536),
  p_domain_id UUID,
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
  WHERE wc.domain_id = p_domain_id
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
-- GRANT PERMISSIONS
-- =====================================================

-- Grant necessary permissions
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

SELECT 'Schema created successfully! All tables, indexes, and functions are ready.' as status;