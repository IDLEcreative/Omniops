-- Create all customer verification and related tables

-- 1. Create conversations table if it doesn't exist
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  metadata JSONB DEFAULT '{}',
  verification_status TEXT DEFAULT 'unverified',
  verified_customer_email TEXT
);

-- 2. Create messages table if it doesn't exist
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  metadata JSONB DEFAULT '{}',
  verification_status TEXT,
  customer_email TEXT
);

-- 3. Create customer_configs table if it doesn't exist
CREATE TABLE IF NOT EXISTS customer_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  domain TEXT UNIQUE NOT NULL,
  woocommerce_enabled BOOLEAN DEFAULT false,
  woocommerce_url TEXT,
  woocommerce_consumer_key TEXT,
  woocommerce_consumer_secret_encrypted TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Create customer_verifications table
CREATE TABLE IF NOT EXISTS customer_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL,
  email TEXT NOT NULL,
  code TEXT NOT NULL,
  method TEXT NOT NULL DEFAULT 'email',
  attempts INTEGER DEFAULT 0,
  verified_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  metadata JSONB DEFAULT '{}'
);

-- 5. Create customer_access_logs table
CREATE TABLE IF NOT EXISTS customer_access_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL,
  customer_email TEXT NOT NULL,
  woo_customer_id INTEGER,
  accessed_data TEXT[],
  reason TEXT,
  verified_via TEXT,
  accessed_at TIMESTAMPTZ DEFAULT now(),
  metadata JSONB DEFAULT '{}'
);

-- 6. Create customer_data_cache table
CREATE TABLE IF NOT EXISTS customer_data_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL,
  customer_email TEXT NOT NULL,
  woo_customer_id INTEGER,
  cached_data JSONB NOT NULL,
  data_type TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_conversations_session_id ON conversations(session_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_verifications_conversation_email ON customer_verifications(conversation_id, email);
CREATE INDEX IF NOT EXISTS idx_verifications_expires ON customer_verifications(expires_at);
CREATE INDEX IF NOT EXISTS idx_access_logs_conversation ON customer_access_logs(conversation_id);
CREATE INDEX IF NOT EXISTS idx_access_logs_email ON customer_access_logs(customer_email);
CREATE INDEX IF NOT EXISTS idx_cache_conversation ON customer_data_cache(conversation_id);
CREATE INDEX IF NOT EXISTS idx_cache_expires ON customer_data_cache(expires_at);

-- Create the verification request function
CREATE OR REPLACE FUNCTION create_verification_request(
  p_conversation_id UUID,
  p_email TEXT,
  p_method TEXT DEFAULT 'email'
)
RETURNS TABLE(
  verification_id UUID,
  code TEXT,
  expires_at TIMESTAMPTZ
) AS $$
DECLARE
  v_code TEXT;
  v_expires_at TIMESTAMPTZ;
  v_id UUID;
BEGIN
  -- Generate 6-digit code
  v_code := LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');
  v_expires_at := NOW() + INTERVAL '15 minutes';
  
  -- Insert verification record
  INSERT INTO customer_verifications (
    conversation_id,
    email,
    code,
    method,
    expires_at
  ) VALUES (
    p_conversation_id,
    p_email,
    v_code,
    p_method,
    v_expires_at
  ) RETURNING id INTO v_id;
  
  RETURN QUERY
  SELECT v_id, v_code, v_expires_at;
END;
$$ LANGUAGE plpgsql;

-- Create the verify code function
CREATE OR REPLACE FUNCTION verify_customer_code(
  p_conversation_id UUID,
  p_email TEXT,
  p_code TEXT
)
RETURNS TABLE(
  verified BOOLEAN,
  message TEXT,
  customer_email TEXT
) AS $$
DECLARE
  v_verification RECORD;
BEGIN
  -- Find valid verification
  SELECT * INTO v_verification
  FROM customer_verifications
  WHERE conversation_id = p_conversation_id
    AND email = p_email
    AND code = p_code
    AND expires_at > NOW()
    AND verified_at IS NULL
  ORDER BY created_at DESC
  LIMIT 1;
  
  IF v_verification.id IS NULL THEN
    -- Check if code expired
    IF EXISTS (
      SELECT 1 FROM customer_verifications
      WHERE conversation_id = p_conversation_id
        AND email = p_email
        AND code = p_code
        AND expires_at <= NOW()
    ) THEN
      RETURN QUERY SELECT FALSE, 'Verification code has expired'::TEXT, NULL::TEXT;
    ELSE
      -- Update attempts
      UPDATE customer_verifications
      SET attempts = attempts + 1
      WHERE conversation_id = p_conversation_id
        AND email = p_email
        AND verified_at IS NULL;
      
      RETURN QUERY SELECT FALSE, 'Invalid verification code'::TEXT, NULL::TEXT;
    END IF;
  ELSE
    -- Mark as verified
    UPDATE customer_verifications
    SET verified_at = NOW()
    WHERE id = v_verification.id;
    
    -- Update conversation
    UPDATE conversations
    SET verification_status = 'verified',
        verified_customer_email = p_email
    WHERE id = p_conversation_id;
    
    RETURN QUERY SELECT TRUE, 'Successfully verified'::TEXT, p_email;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Create the access logging function
CREATE OR REPLACE FUNCTION log_customer_access(
  p_conversation_id UUID,
  p_customer_email TEXT,
  p_woo_customer_id INTEGER,
  p_accessed_data TEXT[],
  p_reason TEXT,
  p_verified_via TEXT
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO customer_access_logs (
    conversation_id,
    customer_email,
    woo_customer_id,
    accessed_data,
    reason,
    verified_via
  ) VALUES (
    p_conversation_id,
    p_customer_email,
    p_woo_customer_id,
    p_accessed_data,
    p_reason,
    p_verified_via
  );
END;
$$ LANGUAGE plpgsql;

-- Create cleanup function for expired data
CREATE OR REPLACE FUNCTION clean_expired_customer_data()
RETURNS VOID AS $$
BEGIN
  -- Delete expired verifications older than 1 day
  DELETE FROM customer_verifications
  WHERE expires_at < NOW() - INTERVAL '1 day';
  
  -- Delete expired cache
  DELETE FROM customer_data_cache
  WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Enable Row Level Security (RLS) on sensitive tables
ALTER TABLE customer_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_access_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_data_cache ENABLE ROW LEVEL SECURITY;

-- Create policies for service role access (allows full access for service role)
CREATE POLICY "Service role has full access to verifications" ON customer_verifications
  FOR ALL USING (auth.jwt()->>'role' = 'service_role');

CREATE POLICY "Service role has full access to access logs" ON customer_access_logs
  FOR ALL USING (auth.jwt()->>'role' = 'service_role');

CREATE POLICY "Service role has full access to cache" ON customer_data_cache
  FOR ALL USING (auth.jwt()->>'role' = 'service_role');

-- Grant necessary permissions
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;