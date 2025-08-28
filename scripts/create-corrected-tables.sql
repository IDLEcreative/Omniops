-- ================================================================
-- CUSTOMER SERVICE BOT - CORRECTED DATABASE SCHEMA
-- ================================================================
-- Fixed version with resolved issues:
-- 1. Keeps both scraped_pages AND website_content (different purposes)
-- 2. Uses customers approach (NOT businesses)
-- 3. Properly links training_data with domain field
-- Run this in Supabase SQL Editor for project: birugqyuqhiahxvxeyqg

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";  -- Required for embeddings

-- ================================================================
-- CUSTOMERS TABLE (Primary account management)
-- ================================================================
CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  domain TEXT UNIQUE NOT NULL,  -- Primary domain
  company_name TEXT,
  email TEXT,
  auth_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  subscription_plan TEXT DEFAULT 'free',
  api_calls_this_month INTEGER DEFAULT 0,
  api_calls_limit INTEGER DEFAULT 1000,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_customers_domain ON customers(domain);
CREATE INDEX idx_customers_auth_user ON customers(auth_user_id);

-- ================================================================
-- CUSTOMER_CONFIGS TABLE (Settings & Integrations)
-- ================================================================
CREATE TABLE IF NOT EXISTS customer_configs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  domain TEXT NOT NULL,
  
  -- WooCommerce Integration
  woocommerce_enabled BOOLEAN DEFAULT false,
  woocommerce_url TEXT,
  woocommerce_consumer_key TEXT, -- Will be migrated to encrypted
  woocommerce_consumer_secret TEXT, -- Will be migrated to encrypted
  woocommerce_consumer_key_encrypted TEXT,
  woocommerce_consumer_secret_encrypted TEXT,
  
  -- AI Configuration
  openai_api_key TEXT, -- Will be migrated to encrypted
  openai_api_key_encrypted TEXT,
  ai_model TEXT DEFAULT 'gpt-4o-mini',
  ai_temperature DECIMAL DEFAULT 0.7,
  custom_prompt TEXT,
  
  -- Widget Settings
  widget_settings JSONB DEFAULT '{
    "primaryColor": "#007bff",
    "position": "bottom-right",
    "welcomeMessage": "Hi! How can I help you today?"
  }',
  
  -- Privacy Settings
  data_retention_days INTEGER DEFAULT 90,
  gdpr_compliant BOOLEAN DEFAULT true,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(domain) -- One config per domain
);

CREATE INDEX idx_customer_configs_domain ON customer_configs(domain);
CREATE INDEX idx_customer_configs_customer ON customer_configs(customer_id);

-- ================================================================
-- DOMAINS TABLE (Multi-domain support)
-- ================================================================
CREATE TABLE IF NOT EXISTS domains (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  domain TEXT UNIQUE NOT NULL,
  verified BOOLEAN DEFAULT false,
  verification_token TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_domains_customer ON domains(customer_id);
CREATE INDEX idx_domains_domain ON domains(domain);

-- ================================================================
-- SCRAPED_PAGES TABLE (Initial Web Scraping)
-- ================================================================
-- Used by /api/scrape endpoint for initial content ingestion
CREATE TABLE IF NOT EXISTS scraped_pages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  domain TEXT, -- Domain this page belongs to
  url TEXT NOT NULL,
  title TEXT,
  content TEXT,  -- Plain text content
  html_content TEXT, -- Original HTML if needed
  metadata JSONB DEFAULT '{}',
  content_hash TEXT, -- For detecting changes
  last_scraped_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(url, domain) -- One version per URL per domain
);

CREATE INDEX idx_scraped_pages_url ON scraped_pages(url);
CREATE INDEX idx_scraped_pages_domain ON scraped_pages(domain);
CREATE INDEX idx_scraped_pages_customer ON scraped_pages(customer_id);

-- ================================================================
-- WEBSITE_CONTENT TABLE (Content Refresh System)
-- ================================================================
-- Used by content-refresh.ts for scheduled updates
CREATE TABLE IF NOT EXISTS website_content (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  domain TEXT, -- Domain this content belongs to
  url TEXT NOT NULL,
  title TEXT,
  content TEXT,
  content_type TEXT,
  metadata JSONB DEFAULT '{}',
  last_indexed_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(url, domain) -- One version per URL per domain
);

CREATE INDEX idx_website_content_url ON website_content(url);
CREATE INDEX idx_website_content_domain ON website_content(domain);
CREATE INDEX idx_website_content_customer ON website_content(customer_id);

-- ================================================================
-- PAGE_EMBEDDINGS TABLE (Vector Search for scraped_pages)
-- ================================================================
CREATE TABLE IF NOT EXISTS page_embeddings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  page_id UUID REFERENCES scraped_pages(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  domain TEXT, -- For faster domain-based filtering
  chunk_text TEXT NOT NULL,
  embedding vector(1536), -- OpenAI embedding dimension
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Vector similarity search index
CREATE INDEX idx_page_embeddings_vector 
  ON page_embeddings 
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

CREATE INDEX idx_page_embeddings_page ON page_embeddings(page_id);
CREATE INDEX idx_page_embeddings_customer ON page_embeddings(customer_id);
CREATE INDEX idx_page_embeddings_domain ON page_embeddings(domain);

-- ================================================================
-- CONTENT_EMBEDDINGS TABLE (Vector Search for website_content)
-- ================================================================
CREATE TABLE IF NOT EXISTS content_embeddings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  content_id UUID, -- References website_content or training_data
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  domain TEXT, -- For faster domain-based filtering
  chunk_text TEXT NOT NULL,
  embedding vector(1536),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Vector search index
CREATE INDEX idx_content_embeddings_vector 
  ON content_embeddings 
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

CREATE INDEX idx_content_embeddings_customer ON content_embeddings(customer_id);
CREATE INDEX idx_content_embeddings_domain ON content_embeddings(domain);
CREATE INDEX idx_content_embeddings_content ON content_embeddings(content_id);

-- ================================================================
-- TRAINING_DATA TABLE (Q&A, Text, URLs for Training)
-- ================================================================
CREATE TABLE IF NOT EXISTS training_data (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE, -- User who added it
  domain TEXT, -- Which domain/website this training is for
  type TEXT NOT NULL CHECK (type IN ('url', 'file', 'qa', 'text')),
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'error')),
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_training_data_customer ON training_data(customer_id);
CREATE INDEX idx_training_data_user ON training_data(user_id);
CREATE INDEX idx_training_data_domain ON training_data(domain);
CREATE INDEX idx_training_data_type ON training_data(type);
CREATE INDEX idx_training_data_status ON training_data(status);

-- ================================================================
-- CONTENT_REFRESH_JOBS TABLE (Automated Re-scraping)
-- ================================================================
CREATE TABLE IF NOT EXISTS content_refresh_jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  domain TEXT,
  url TEXT NOT NULL,
  frequency TEXT DEFAULT 'daily' CHECK (frequency IN ('hourly', 'daily', 'weekly', 'monthly')),
  last_run_at TIMESTAMPTZ,
  next_run_at TIMESTAMPTZ,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'error')),
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_refresh_jobs_next_run ON content_refresh_jobs(next_run_at);
CREATE INDEX idx_refresh_jobs_customer ON content_refresh_jobs(customer_id);
CREATE INDEX idx_refresh_jobs_domain ON content_refresh_jobs(domain);

-- ================================================================
-- CUSTOMER_VERIFICATIONS TABLE (Order/Account Verification)
-- ================================================================
CREATE TABLE IF NOT EXISTS customer_verifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  customer_email TEXT,
  verification_code TEXT,
  verified BOOLEAN DEFAULT false,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_verifications_conversation ON customer_verifications(conversation_id);
CREATE INDEX idx_verifications_expires ON customer_verifications(expires_at);

-- ================================================================
-- CUSTOMER_DATA_CACHE TABLE (Performance Cache)
-- ================================================================
CREATE TABLE IF NOT EXISTS customer_data_cache (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  cache_key TEXT NOT NULL,
  cache_value JSONB NOT NULL,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(customer_id, conversation_id, cache_key)
);

CREATE INDEX idx_cache_expires ON customer_data_cache(expires_at);
CREATE INDEX idx_cache_customer ON customer_data_cache(customer_id);

-- ================================================================
-- CUSTOMER_ACCESS_LOGS TABLE (GDPR Compliance)
-- ================================================================
CREATE TABLE IF NOT EXISTS customer_access_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  customer_email TEXT,
  data_accessed TEXT[],
  purpose TEXT,
  accessed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_access_logs_customer ON customer_access_logs(customer_id);
CREATE INDEX idx_access_logs_conversation ON customer_access_logs(conversation_id);

-- ================================================================
-- PRIVACY_REQUESTS TABLE (GDPR/CCPA)
-- ================================================================
CREATE TABLE IF NOT EXISTS privacy_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  request_type TEXT NOT NULL CHECK (request_type IN ('export', 'delete', 'access', 'rectify')),
  requestor_email TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'rejected')),
  completed_at TIMESTAMPTZ,
  data_url TEXT,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_privacy_requests_customer ON privacy_requests(customer_id);
CREATE INDEX idx_privacy_requests_status ON privacy_requests(status);

-- ================================================================
-- VECTOR SEARCH FUNCTION (Updated for domain filtering)
-- ================================================================
CREATE OR REPLACE FUNCTION search_embeddings(
  query_embedding vector,
  domain_id TEXT DEFAULT NULL,
  match_threshold FLOAT DEFAULT 0.7,
  match_count INT DEFAULT 5
)
RETURNS TABLE (
  content TEXT,
  url TEXT,
  title TEXT,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pe.chunk_text AS content,
    sp.url,
    sp.title,
    1 - (pe.embedding <=> query_embedding) AS similarity
  FROM page_embeddings pe
  JOIN scraped_pages sp ON pe.page_id = sp.id
  WHERE 
    (domain_id IS NULL OR pe.domain = domain_id OR sp.domain = domain_id)
    AND 1 - (pe.embedding <=> query_embedding) > match_threshold
  ORDER BY pe.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- ================================================================
-- HELPER FUNCTIONS
-- ================================================================

-- Function to get customer_id from domain
CREATE OR REPLACE FUNCTION get_customer_from_domain(p_domain TEXT)
RETURNS UUID AS $$
DECLARE
  v_customer_id UUID;
BEGIN
  SELECT id INTO v_customer_id
  FROM customers
  WHERE domain = p_domain
  LIMIT 1;
  
  IF v_customer_id IS NULL THEN
    SELECT customer_id INTO v_customer_id
    FROM domains
    WHERE domain = p_domain
    LIMIT 1;
  END IF;
  
  RETURN v_customer_id;
END;
$$ LANGUAGE plpgsql;

-- Function to clean up expired data
CREATE OR REPLACE FUNCTION cleanup_expired_data()
RETURNS VOID AS $$
BEGIN
  -- Delete expired verifications
  DELETE FROM customer_verifications WHERE expires_at < NOW();
  
  -- Delete expired cache entries
  DELETE FROM customer_data_cache WHERE expires_at < NOW();
  
  -- Delete old access logs (keep 90 days for compliance)
  DELETE FROM customer_access_logs WHERE accessed_at < NOW() - INTERVAL '90 days';
  
  -- Delete completed privacy requests older than 30 days
  DELETE FROM privacy_requests 
  WHERE status = 'completed' AND completed_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;

-- ================================================================
-- ROW LEVEL SECURITY
-- ================================================================

-- Enable RLS on all tables
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE domains ENABLE ROW LEVEL SECURITY;
ALTER TABLE scraped_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE website_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE page_embeddings ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_embeddings ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_refresh_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_data_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_access_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE privacy_requests ENABLE ROW LEVEL SECURITY;

-- Service role has full access
DO $$
DECLARE
  t text;
BEGIN
  FOR t IN 
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_type = 'BASE TABLE'
    AND table_name IN (
      'customers', 'customer_configs', 'domains', 'scraped_pages', 
      'website_content', 'page_embeddings', 'content_embeddings', 
      'training_data', 'content_refresh_jobs', 'customer_verifications',
      'customer_data_cache', 'customer_access_logs', 'privacy_requests'
    )
  LOOP
    EXECUTE format('CREATE POLICY "Service role access %I" ON %I FOR ALL USING (auth.jwt() ->> %L = %L)', 
                   t, t, 'role', 'service_role');
  END LOOP;
END $$;

-- Users can see their own training data
CREATE POLICY "Users see own training data" ON training_data
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users insert own training data" ON training_data
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ================================================================
-- GRANT PERMISSIONS
-- ================================================================
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;

-- ================================================================
-- DATA MIGRATION NOTES
-- ================================================================
-- If you have existing data:
-- 1. The non-encrypted fields will be migrated to encrypted versions
-- 2. Run the migration script: npm run migrate:encrypt-credentials
-- 3. Both scraped_pages and website_content serve different purposes - keep both
-- 4. Add domain field to existing training_data records if missing