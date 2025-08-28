-- Multi-Tenant Customer Service Platform Schema (FIXED)
-- Each business has their own isolated customer service bot

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "vector";

-- ================================================================
-- TENANT/BUSINESS LEVEL TABLES
-- ================================================================

-- Main business accounts table
CREATE TABLE IF NOT EXISTS businesses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  subscription_plan TEXT DEFAULT 'free',
  subscription_status TEXT DEFAULT 'active',
  api_calls_this_month INTEGER DEFAULT 0,
  api_calls_limit INTEGER DEFAULT 1000,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  settings JSONB DEFAULT '{}'
);

-- Business-specific configurations
CREATE TABLE IF NOT EXISTS business_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  domain TEXT NOT NULL,
  woocommerce_enabled BOOLEAN DEFAULT false,
  woocommerce_url TEXT,
  woocommerce_consumer_key_encrypted TEXT,
  woocommerce_consumer_secret_encrypted TEXT,
  shopify_enabled BOOLEAN DEFAULT false,
  shopify_store_url TEXT,
  shopify_access_token_encrypted TEXT,
  openai_api_key_encrypted TEXT,
  ai_model TEXT DEFAULT 'gpt-4o-mini',
  ai_temperature DECIMAL DEFAULT 0.7,
  custom_prompt TEXT,
  widget_settings JSONB DEFAULT '{"primaryColor": "#007bff", "position": "bottom-right", "welcomeMessage": "Hi! How can I help you today?", "companyLogo": null}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(business_id, domain)
);

-- Track API usage per business
CREATE TABLE IF NOT EXISTS business_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  api_calls INTEGER DEFAULT 0,
  conversations_count INTEGER DEFAULT 0,
  messages_count INTEGER DEFAULT 0,
  verifications_count INTEGER DEFAULT 0,
  cache_hits INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(business_id, date)
);

-- ================================================================
-- CUSTOMER SERVICE LEVEL TABLES (Scoped to each business)
-- ================================================================

-- Conversations between end-customers and the bot
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL,
  customer_email TEXT,
  customer_name TEXT,
  customer_ip TEXT,
  customer_user_agent TEXT,
  verification_status TEXT DEFAULT 'unverified',
  verification_level TEXT DEFAULT 'none',
  verified_at TIMESTAMPTZ,
  source_page TEXT,
  referrer TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Messages in conversations
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  customer_data_accessed JSONB,
  verification_required BOOLEAN DEFAULT false,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Customer verification attempts
CREATE TABLE IF NOT EXISTS customer_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  conversation_id UUID NOT NULL,
  customer_email TEXT NOT NULL,
  customer_name TEXT,
  order_number TEXT,
  postal_code TEXT,
  verification_method TEXT DEFAULT 'progressive',
  verification_code TEXT,
  attempts INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 3,
  verified_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT now() + INTERVAL '15 minutes',
  created_at TIMESTAMPTZ DEFAULT now(),
  metadata JSONB DEFAULT '{}'
);

-- Audit log for customer data access
CREATE TABLE IF NOT EXISTS customer_access_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  conversation_id UUID NOT NULL,
  customer_email TEXT NOT NULL,
  customer_id_in_store TEXT,
  data_accessed TEXT[],
  access_reason TEXT,
  access_method TEXT,
  accessed_by TEXT DEFAULT 'bot',
  accessed_at TIMESTAMPTZ DEFAULT now(),
  metadata JSONB DEFAULT '{}'
);

-- Cache for customer data
CREATE TABLE IF NOT EXISTS customer_data_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  conversation_id UUID NOT NULL,
  cache_key TEXT NOT NULL,
  cached_data JSONB NOT NULL,
  data_type TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT now() + INTERVAL '15 minutes',
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(business_id, conversation_id, cache_key)
);

-- Website content embeddings (optional - comment out if not using vector search)
CREATE TABLE IF NOT EXISTS content_embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  title TEXT,
  content TEXT NOT NULL,
  content_hash TEXT,
  embedding vector(1536), -- Requires pgvector extension
  last_indexed_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(business_id, url)
);

-- ================================================================
-- INDEXES FOR PERFORMANCE
-- ================================================================

CREATE INDEX IF NOT EXISTS idx_businesses_email ON businesses(email);
CREATE INDEX IF NOT EXISTS idx_businesses_status ON businesses(subscription_status);
CREATE INDEX IF NOT EXISTS idx_configs_domain ON business_configs(domain);
CREATE INDEX IF NOT EXISTS idx_configs_business ON business_configs(business_id);

CREATE INDEX IF NOT EXISTS idx_usage_business_date ON business_usage(business_id, date DESC);

CREATE INDEX IF NOT EXISTS idx_conversations_business ON conversations(business_id);
CREATE INDEX IF NOT EXISTS idx_conversations_session ON conversations(business_id, session_id);
CREATE INDEX IF NOT EXISTS idx_conversations_customer ON conversations(business_id, customer_email);

CREATE INDEX IF NOT EXISTS idx_messages_business ON messages(business_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_created ON messages(business_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_verifications_business ON customer_verifications(business_id);
CREATE INDEX IF NOT EXISTS idx_verifications_conversation ON customer_verifications(business_id, conversation_id);
CREATE INDEX IF NOT EXISTS idx_verifications_email ON customer_verifications(business_id, customer_email);
CREATE INDEX IF NOT EXISTS idx_verifications_expires ON customer_verifications(expires_at);

CREATE INDEX IF NOT EXISTS idx_access_logs_business ON customer_access_logs(business_id);
CREATE INDEX IF NOT EXISTS idx_access_logs_customer ON customer_access_logs(business_id, customer_email);
CREATE INDEX IF NOT EXISTS idx_access_logs_date ON customer_access_logs(business_id, accessed_at);

CREATE INDEX IF NOT EXISTS idx_cache_business ON customer_data_cache(business_id);
CREATE INDEX IF NOT EXISTS idx_cache_expires ON customer_data_cache(expires_at);

CREATE INDEX IF NOT EXISTS idx_embeddings_business ON content_embeddings(business_id);

-- Vector similarity search index (only if using pgvector)
-- CREATE INDEX IF NOT EXISTS idx_embeddings_vector ON content_embeddings 
--   USING ivfflat (embedding vector_cosine_ops)
--   WITH (lists = 100);

-- ================================================================
-- ROW LEVEL SECURITY (RLS)
-- ================================================================

-- Enable RLS on all tables
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_access_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_data_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_embeddings ENABLE ROW LEVEL SECURITY;

-- Create policies for businesses table
CREATE POLICY "Business owners see own data" ON businesses
  FOR ALL USING (auth.uid()::text = id::text);

CREATE POLICY "Service role has full access to businesses" ON businesses
  FOR ALL USING (auth.jwt()->>'role' = 'service_role');

-- Create policies for business_configs
CREATE POLICY "Business configs isolated" ON business_configs
  FOR ALL USING (business_id::text = auth.uid()::text);

CREATE POLICY "Service role has full access to configs" ON business_configs
  FOR ALL USING (auth.jwt()->>'role' = 'service_role');

-- Create policies for business_usage
CREATE POLICY "Business usage isolated" ON business_usage
  FOR ALL USING (business_id::text = auth.uid()::text);

CREATE POLICY "Service role has full access to usage" ON business_usage
  FOR ALL USING (auth.jwt()->>'role' = 'service_role');

-- Create policies for conversations
CREATE POLICY "Conversations isolated by business" ON conversations
  FOR ALL USING (business_id::text = auth.uid()::text);

CREATE POLICY "Service role has full access to conversations" ON conversations
  FOR ALL USING (auth.jwt()->>'role' = 'service_role');

-- Create policies for messages
CREATE POLICY "Messages isolated by business" ON messages
  FOR ALL USING (business_id::text = auth.uid()::text);

CREATE POLICY "Service role has full access to messages" ON messages
  FOR ALL USING (auth.jwt()->>'role' = 'service_role');

-- Create policies for customer_verifications
CREATE POLICY "Verifications isolated by business" ON customer_verifications
  FOR ALL USING (business_id::text = auth.uid()::text);

CREATE POLICY "Service role has full access to verifications" ON customer_verifications
  FOR ALL USING (auth.jwt()->>'role' = 'service_role');

-- Create policies for customer_access_logs
CREATE POLICY "Access logs isolated by business" ON customer_access_logs
  FOR ALL USING (business_id::text = auth.uid()::text);

CREATE POLICY "Service role has full access to access logs" ON customer_access_logs
  FOR ALL USING (auth.jwt()->>'role' = 'service_role');

-- Create policies for customer_data_cache
CREATE POLICY "Cache isolated by business" ON customer_data_cache
  FOR ALL USING (business_id::text = auth.uid()::text);

CREATE POLICY "Service role has full access to cache" ON customer_data_cache
  FOR ALL USING (auth.jwt()->>'role' = 'service_role');

-- Create policies for content_embeddings
CREATE POLICY "Embeddings isolated by business" ON content_embeddings
  FOR ALL USING (business_id::text = auth.uid()::text);

CREATE POLICY "Service role has full access to embeddings" ON content_embeddings
  FOR ALL USING (auth.jwt()->>'role' = 'service_role');

-- ================================================================
-- HELPER FUNCTIONS
-- ================================================================

-- Function to get business ID from domain
CREATE OR REPLACE FUNCTION get_business_id_from_domain(p_domain TEXT)
RETURNS UUID AS $$
DECLARE
  v_business_id UUID;
BEGIN
  SELECT business_id INTO v_business_id
  FROM business_configs
  WHERE domain = p_domain
  LIMIT 1;
  
  RETURN v_business_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to track API usage
CREATE OR REPLACE FUNCTION track_api_usage(
  p_business_id UUID,
  p_usage_type TEXT DEFAULT 'api_call'
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO business_usage (business_id, date, api_calls)
  VALUES (p_business_id, CURRENT_DATE, 1)
  ON CONFLICT (business_id, date)
  DO UPDATE SET
    api_calls = business_usage.api_calls + 1;
    
  -- Update monthly counter on business
  UPDATE businesses
  SET api_calls_this_month = api_calls_this_month + 1,
      updated_at = now()
  WHERE id = p_business_id;
END;
$$ LANGUAGE plpgsql;

-- Function to clean expired data
CREATE OR REPLACE FUNCTION clean_expired_data()
RETURNS VOID AS $$
BEGIN
  -- Delete expired verifications
  DELETE FROM customer_verifications
  WHERE expires_at < now() - INTERVAL '1 day';
  
  -- Delete expired cache
  DELETE FROM customer_data_cache
  WHERE expires_at < now();
  
  -- Delete old access logs (keep 90 days for compliance)
  DELETE FROM customer_access_logs
  WHERE accessed_at < now() - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql;

-- ================================================================
-- OPTIONAL: INITIAL TEST DATA
-- ================================================================

-- Create a demo business (uncomment to use)
-- INSERT INTO businesses (id, company_name, email, password_hash, subscription_plan)
-- VALUES (
--   gen_random_uuid(),
--   'Demo Company',
--   'demo@example.com',
--   crypt('demo_password', gen_salt('bf')), -- Uses pgcrypto
--   'premium'
-- ) ON CONFLICT DO NOTHING;