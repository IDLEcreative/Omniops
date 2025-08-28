-- Multi-Tenant Customer Service Platform Schema
-- Each business has their own isolated customer service bot

-- ================================================================
-- TENANT/BUSINESS LEVEL TABLES
-- ================================================================

-- Main business accounts table
CREATE TABLE IF NOT EXISTS businesses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL, -- Business owner login email
  password_hash TEXT NOT NULL, -- For authentication
  subscription_plan TEXT DEFAULT 'free',
  subscription_status TEXT DEFAULT 'active',
  api_calls_this_month INTEGER DEFAULT 0,
  api_calls_limit INTEGER DEFAULT 1000,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  settings JSONB DEFAULT '{}' -- General settings
);

-- Business-specific configurations
CREATE TABLE IF NOT EXISTS business_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  
  -- Their website
  domain TEXT NOT NULL,
  
  -- WooCommerce Integration (optional)
  woocommerce_enabled BOOLEAN DEFAULT false,
  woocommerce_url TEXT,
  woocommerce_consumer_key_encrypted TEXT,
  woocommerce_consumer_secret_encrypted TEXT,
  
  -- Other integrations
  shopify_enabled BOOLEAN DEFAULT false,
  shopify_store_url TEXT,
  shopify_access_token_encrypted TEXT,
  
  -- AI Configuration
  openai_api_key_encrypted TEXT, -- If they use their own
  ai_model TEXT DEFAULT 'gpt-4o-mini',
  ai_temperature DECIMAL DEFAULT 0.7,
  custom_prompt TEXT, -- Their custom instructions
  
  -- Widget customization
  widget_settings JSONB DEFAULT '{
    "primaryColor": "#007bff",
    "position": "bottom-right",
    "welcomeMessage": "Hi! How can I help you today?",
    "companyLogo": null
  }',
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(business_id, domain) -- One config per domain per business
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
  
  -- The website visitor/customer info
  session_id TEXT NOT NULL,
  customer_email TEXT, -- End customer's email (once verified)
  customer_name TEXT,
  customer_ip TEXT,
  customer_user_agent TEXT,
  
  -- Verification status for THIS conversation
  verification_status TEXT DEFAULT 'unverified',
  verification_level TEXT DEFAULT 'none', -- none/basic/full
  verified_at TIMESTAMPTZ,
  
  -- Metadata
  source_page TEXT, -- Which page they started from
  referrer TEXT,
  metadata JSONB DEFAULT '{}',
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- Indexes for performance
  INDEX idx_conversations_business_id (business_id),
  INDEX idx_conversations_session (business_id, session_id),
  INDEX idx_conversations_customer (business_id, customer_email)
);

-- Messages in conversations
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  
  -- For customer service context
  customer_data_accessed JSONB, -- What data was shown in this message
  verification_required BOOLEAN DEFAULT false,
  
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  
  INDEX idx_messages_business (business_id),
  INDEX idx_messages_conversation (conversation_id)
);

-- Customer verification attempts (scoped to business)
CREATE TABLE IF NOT EXISTS customer_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  conversation_id UUID NOT NULL,
  
  -- The end customer being verified
  customer_email TEXT NOT NULL,
  customer_name TEXT,
  order_number TEXT,
  postal_code TEXT,
  
  -- Verification details
  verification_method TEXT DEFAULT 'progressive', -- progressive/email/order
  verification_code TEXT, -- For email verification
  attempts INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 3,
  
  verified_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT now() + INTERVAL '15 minutes',
  created_at TIMESTAMPTZ DEFAULT now(),
  
  metadata JSONB DEFAULT '{}',
  
  INDEX idx_verifications_business (business_id),
  INDEX idx_verifications_conversation (business_id, conversation_id),
  INDEX idx_verifications_email (business_id, customer_email)
);

-- Audit log for customer data access (for GDPR compliance)
CREATE TABLE IF NOT EXISTS customer_access_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  conversation_id UUID NOT NULL,
  
  -- What customer data was accessed
  customer_email TEXT NOT NULL,
  customer_id_in_store TEXT, -- Their ID in WooCommerce/Shopify
  
  -- What was accessed
  data_accessed TEXT[], -- ['orders', 'personal_info', 'payment_history']
  access_reason TEXT,
  access_method TEXT, -- 'email_verification', 'order_lookup', etc.
  
  -- Who accessed (for audit)
  accessed_by TEXT DEFAULT 'bot', -- 'bot' or admin user ID
  accessed_at TIMESTAMPTZ DEFAULT now(),
  
  metadata JSONB DEFAULT '{}',
  
  INDEX idx_access_logs_business (business_id),
  INDEX idx_access_logs_customer (business_id, customer_email),
  INDEX idx_access_logs_date (business_id, accessed_at)
);

-- Cache for customer data (performance optimization)
CREATE TABLE IF NOT EXISTS customer_data_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  conversation_id UUID NOT NULL,
  
  cache_key TEXT NOT NULL, -- e.g., 'customer_123_orders'
  cached_data JSONB NOT NULL,
  data_type TEXT NOT NULL, -- 'customer', 'orders', 'products'
  
  expires_at TIMESTAMPTZ NOT NULL DEFAULT now() + INTERVAL '15 minutes',
  created_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(business_id, conversation_id, cache_key),
  INDEX idx_cache_business (business_id),
  INDEX idx_cache_expiry (expires_at)
);

-- Website content embeddings (for each business's website)
CREATE TABLE IF NOT EXISTS content_embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  
  -- Content details
  url TEXT NOT NULL,
  title TEXT,
  content TEXT NOT NULL,
  content_hash TEXT, -- To detect changes
  
  -- Vector embedding for semantic search
  embedding vector(1536), -- OpenAI embeddings dimension
  
  -- Metadata
  last_indexed_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(business_id, url),
  INDEX idx_embeddings_business (business_id)
);

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

-- Business owners can only see their own data
CREATE POLICY "Business owners see own data" ON businesses
  FOR ALL USING (auth.uid() = id);

CREATE POLICY "Business configs isolated" ON business_configs
  FOR ALL USING (business_id = auth.uid());

CREATE POLICY "Conversations isolated by business" ON conversations
  FOR ALL USING (business_id = auth.uid());

CREATE POLICY "Messages isolated by business" ON messages
  FOR ALL USING (business_id = auth.uid());

CREATE POLICY "Verifications isolated by business" ON customer_verifications
  FOR ALL USING (business_id = auth.uid());

CREATE POLICY "Access logs isolated by business" ON customer_access_logs
  FOR ALL USING (business_id = auth.uid());

CREATE POLICY "Cache isolated by business" ON customer_data_cache
  FOR ALL USING (business_id = auth.uid());

CREATE POLICY "Embeddings isolated by business" ON content_embeddings
  FOR ALL USING (business_id = auth.uid());

-- Service role has full access (for backend operations)
CREATE POLICY "Service role full access" ON ALL TABLES
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
    api_calls = business_usage.api_calls + 1,
    updated_at = now();
    
  -- Update monthly counter on business
  UPDATE businesses
  SET api_calls_this_month = api_calls_this_month + 1
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
-- INDEXES FOR PERFORMANCE
-- ================================================================

CREATE INDEX idx_businesses_email ON businesses(email);
CREATE INDEX idx_businesses_status ON businesses(subscription_status);
CREATE INDEX idx_configs_domain ON business_configs(domain);
CREATE INDEX idx_usage_date ON business_usage(business_id, date DESC);
CREATE INDEX idx_messages_created ON messages(business_id, created_at DESC);
CREATE INDEX idx_verifications_expires ON customer_verifications(expires_at);
CREATE INDEX idx_cache_expires ON customer_data_cache(expires_at);

-- Vector similarity search index (for AI embeddings)
CREATE INDEX idx_embeddings_vector ON content_embeddings 
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

-- ================================================================
-- INITIAL DATA / EXAMPLES
-- ================================================================

-- Example: Create a demo business account (remove in production)
INSERT INTO businesses (id, company_name, email, password_hash, subscription_plan)
VALUES (
  'demo-business-uuid',
  'Demo Company',
  'demo@example.com',
  '$2a$10$YourHashedPasswordHere', -- Use bcrypt in production
  'premium'
) ON CONFLICT DO NOTHING;

-- Add config for demo business
INSERT INTO business_configs (business_id, domain, woocommerce_enabled, woocommerce_url)
VALUES (
  'demo-business-uuid',
  'demo.example.com',
  true,
  'https://demo-store.com'
) ON CONFLICT DO NOTHING;