-- ================================================================
-- MINIMAL CUSTOMER SERVICE BOT DATABASE SCHEMA
-- ================================================================
-- Only the essential tables your application actually needs
-- Run this in Supabase SQL Editor for project: birugqyuqhiahxvxeyqg

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";  -- CRITICAL for embeddings

-- ================================================================
-- 1. CUSTOMERS TABLE (Domain/Account Management)
-- ================================================================
-- Links domains to accounts, tracks usage
CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  domain TEXT UNIQUE NOT NULL,  -- The website using the bot
  email TEXT,
  auth_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast domain lookups
CREATE INDEX IF NOT EXISTS idx_customers_domain ON customers(domain);
CREATE INDEX IF NOT EXISTS idx_customers_auth_user ON customers(auth_user_id);

-- ================================================================
-- 2. CUSTOMER_CONFIGS TABLE (Settings & Integrations)
-- ================================================================
-- Stores WooCommerce credentials, AI settings, widget config
CREATE TABLE IF NOT EXISTS customer_configs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  domain TEXT NOT NULL,
  
  -- WooCommerce Integration (encrypted)
  woocommerce_enabled BOOLEAN DEFAULT false,
  woocommerce_url TEXT,
  woocommerce_consumer_key_encrypted TEXT,
  woocommerce_consumer_secret_encrypted TEXT,
  
  -- AI Configuration
  openai_api_key_encrypted TEXT,  -- If they use their own
  ai_model TEXT DEFAULT 'gpt-4o-mini',
  ai_temperature DECIMAL DEFAULT 0.7,
  custom_prompt TEXT,
  
  -- Widget Settings
  widget_settings JSONB DEFAULT '{
    "primaryColor": "#007bff",
    "position": "bottom-right",
    "welcomeMessage": "Hi! How can I help you today?"
  }',
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(customer_id, domain)
);

-- Indexes for config lookups
CREATE INDEX IF NOT EXISTS idx_customer_configs_domain ON customer_configs(domain);
CREATE INDEX IF NOT EXISTS idx_customer_configs_customer ON customer_configs(customer_id);

-- ================================================================
-- 3. TRAINING_DATA TABLE (Q&A, Text, URLs for Training)
-- ================================================================
-- Stores all training content from the UI
CREATE TABLE IF NOT EXISTS training_data (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,  -- For auth integration
  type TEXT NOT NULL CHECK (type IN ('url', 'file', 'qa', 'text')),
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'error')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for training data queries
CREATE INDEX IF NOT EXISTS idx_training_data_customer ON training_data(customer_id);
CREATE INDEX IF NOT EXISTS idx_training_data_user ON training_data(user_id);
CREATE INDEX IF NOT EXISTS idx_training_data_type ON training_data(type);
CREATE INDEX IF NOT EXISTS idx_training_data_status ON training_data(status);

-- ================================================================
-- 4. SCRAPED_PAGES TABLE (Website Content Storage)
-- ================================================================
-- Stores scraped website content
CREATE TABLE IF NOT EXISTS scraped_pages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  domain TEXT,
  title TEXT,
  content TEXT,  -- Plain text content
  metadata JSONB DEFAULT '{}',  -- Additional data like meta tags
  last_scraped_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(customer_id, url)  -- One version per URL per customer
);

-- Indexes for content lookups
CREATE INDEX IF NOT EXISTS idx_scraped_pages_url ON scraped_pages(url);
CREATE INDEX IF NOT EXISTS idx_scraped_pages_domain ON scraped_pages(domain);
CREATE INDEX IF NOT EXISTS idx_scraped_pages_customer ON scraped_pages(customer_id);

-- ================================================================
-- 5. PAGE_EMBEDDINGS TABLE (Vector Search)
-- ================================================================
-- Stores vector embeddings for semantic search
CREATE TABLE IF NOT EXISTS page_embeddings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  page_id UUID REFERENCES scraped_pages(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  chunk_text TEXT NOT NULL,  -- The text chunk
  embedding vector(1536),  -- OpenAI embedding dimension
  metadata JSONB DEFAULT '{}',  -- chunk_index, total_chunks, etc.
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- CRITICAL: Vector similarity search index
CREATE INDEX IF NOT EXISTS idx_page_embeddings_vector 
  ON page_embeddings 
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

-- Regular indexes
CREATE INDEX IF NOT EXISTS idx_page_embeddings_page ON page_embeddings(page_id);
CREATE INDEX IF NOT EXISTS idx_page_embeddings_customer ON page_embeddings(customer_id);

-- ================================================================
-- 6. CONTENT_EMBEDDINGS TABLE (Alternative Embeddings)
-- ================================================================
-- Some code uses this instead of page_embeddings
-- Could be merged with page_embeddings but keeping for compatibility
CREATE TABLE IF NOT EXISTS content_embeddings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  content_id UUID,  -- Can reference scraped_pages or training_data
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  chunk_text TEXT NOT NULL,
  embedding vector(1536),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Vector search index
CREATE INDEX IF NOT EXISTS idx_content_embeddings_vector 
  ON content_embeddings 
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

CREATE INDEX IF NOT EXISTS idx_content_embeddings_customer ON content_embeddings(customer_id);

-- ================================================================
-- 7. DOMAINS TABLE (Multi-domain support)
-- ================================================================
-- Tracks which domains are registered/verified
CREATE TABLE IF NOT EXISTS domains (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  domain TEXT UNIQUE NOT NULL,
  verified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_domains_customer ON domains(customer_id);
CREATE INDEX IF NOT EXISTS idx_domains_domain ON domains(domain);

-- ================================================================
-- 8. WEBSITE_CONTENT TABLE (Alternative to scraped_pages)
-- ================================================================
-- Some code uses this - keeping for compatibility
-- Consider migrating to use scraped_pages only
CREATE TABLE IF NOT EXISTS website_content (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  title TEXT,
  content TEXT,
  content_type TEXT,
  metadata JSONB DEFAULT '{}',
  last_indexed_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(customer_id, url)
);

CREATE INDEX IF NOT EXISTS idx_website_content_url ON website_content(url);
CREATE INDEX IF NOT EXISTS idx_website_content_customer ON website_content(customer_id);

-- ================================================================
-- VECTOR SEARCH FUNCTION
-- ================================================================
-- Critical function for semantic search
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
  LEFT JOIN customers c ON sp.customer_id = c.id
  WHERE 
    (domain_id IS NULL OR c.domain = domain_id OR sp.domain = domain_id)
    AND 1 - (pe.embedding <=> query_embedding) > match_threshold
  ORDER BY pe.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- ================================================================
-- OPTIONAL BUT USEFUL TABLES
-- ================================================================

-- Customer verification (if you need order/account verification)
CREATE TABLE IF NOT EXISTS customer_verifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  customer_email TEXT,
  verification_code TEXT,
  verified BOOLEAN DEFAULT false,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_verifications_conversation ON customer_verifications(conversation_id);
CREATE INDEX IF NOT EXISTS idx_verifications_expires ON customer_verifications(expires_at);

-- Customer data cache (for performance)
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

CREATE INDEX IF NOT EXISTS idx_cache_expires ON customer_data_cache(expires_at);

-- Content refresh jobs (for automated re-scraping)
CREATE TABLE IF NOT EXISTS content_refresh_jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  frequency TEXT DEFAULT 'daily' CHECK (frequency IN ('hourly', 'daily', 'weekly', 'monthly')),
  last_run_at TIMESTAMPTZ,
  next_run_at TIMESTAMPTZ,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'error')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_refresh_jobs_next_run ON content_refresh_jobs(next_run_at);

-- Customer access logs (for GDPR compliance)
CREATE TABLE IF NOT EXISTS customer_access_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  customer_email TEXT,
  data_accessed TEXT[],
  purpose TEXT,
  accessed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Privacy requests (for GDPR/CCPA)
CREATE TABLE IF NOT EXISTS privacy_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  request_type TEXT NOT NULL CHECK (request_type IN ('export', 'delete', 'access')),
  requestor_email TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed')),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================================
-- MULTI-TENANT TABLES (If you decide to go SaaS route)
-- ================================================================
-- Currently your code references both businesses and customers
-- Uncomment if you want the multi-tenant approach:

-- CREATE TABLE IF NOT EXISTS businesses (
--   id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
--   company_name TEXT NOT NULL,
--   email TEXT UNIQUE NOT NULL,
--   subscription_plan TEXT DEFAULT 'free',
--   created_at TIMESTAMPTZ DEFAULT NOW(),
--   updated_at TIMESTAMPTZ DEFAULT NOW()
-- );

-- CREATE TABLE IF NOT EXISTS business_configs (
--   id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
--   business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
--   domain TEXT NOT NULL,
--   -- Same fields as customer_configs
--   UNIQUE(business_id, domain)
-- );

-- ================================================================
-- ROW LEVEL SECURITY (Basic Setup)
-- ================================================================

-- Enable RLS on main tables
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE scraped_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE page_embeddings ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_data ENABLE ROW LEVEL SECURITY;

-- Service role has full access
CREATE POLICY "Service role full access customers" ON customers
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');
  
CREATE POLICY "Service role full access configs" ON customer_configs
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');
  
CREATE POLICY "Service role full access scraped" ON scraped_pages
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');
  
CREATE POLICY "Service role full access embeddings" ON page_embeddings
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');
  
CREATE POLICY "Service role full access training" ON training_data
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Users can see their own data
CREATE POLICY "Users see own training data" ON training_data
  FOR SELECT USING (auth.uid() = user_id);

-- ================================================================
-- GRANT PERMISSIONS
-- ================================================================
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA public TO authenticated;

-- ================================================================
-- NOTES FOR MIGRATION
-- ================================================================
-- 1. Tables that already exist (conversations, messages) are NOT included
-- 2. You have redundancy between scraped_pages and website_content - consider consolidating
-- 3. You have confusion between customers and businesses - pick one approach
-- 4. The vector extension is CRITICAL - make sure it's enabled in Supabase
-- 5. Consider which optional tables you actually need (verification, cache, etc.)