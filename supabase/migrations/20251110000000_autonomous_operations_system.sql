-- Migration: Autonomous Operations System
-- Description: Complete database schema for autonomous AI agents
-- Date: 2025-11-10
-- Purpose: Enable AI agents to autonomously execute tasks (API key generation, integrations, etc.)

-- ============================================================================
-- 1. AUTONOMOUS OPERATIONS TRACKING
-- ============================================================================

-- Main operations table
CREATE TABLE IF NOT EXISTS autonomous_operations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,

  -- Operation details
  service VARCHAR(50) NOT NULL, -- 'woocommerce', 'stripe', 'shopify', etc.
  operation VARCHAR(100) NOT NULL, -- 'api_key_generation', 'setup', 'migration', etc.
  workflow_id VARCHAR(100), -- Reference to AGENT_KNOWLEDGE_BASE.json workflow

  -- Status tracking
  status VARCHAR(20) NOT NULL DEFAULT 'pending', -- 'pending', 'awaiting_consent', 'in_progress', 'completed', 'failed', 'cancelled'

  -- Consent tracking
  consent_given BOOLEAN NOT NULL DEFAULT false,
  consent_timestamp TIMESTAMPTZ,
  consent_expires_at TIMESTAMPTZ,

  -- Execution tracking
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  total_steps INTEGER,
  current_step INTEGER DEFAULT 0,

  -- Result
  result JSONB, -- { success: boolean, data: any, error?: string }

  -- Metadata
  execution_metadata JSONB, -- { browser_version, ai_model, etc. }

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  CONSTRAINT valid_status CHECK (status IN ('pending', 'awaiting_consent', 'in_progress', 'completed', 'failed', 'cancelled')),
  CONSTRAINT consent_required CHECK (status != 'in_progress' OR consent_given = true)
);

-- Indexes for performance
CREATE INDEX idx_autonomous_operations_customer ON autonomous_operations(customer_id);
CREATE INDEX idx_autonomous_operations_status ON autonomous_operations(status);
CREATE INDEX idx_autonomous_operations_service ON autonomous_operations(service);
CREATE INDEX idx_autonomous_operations_created_at ON autonomous_operations(created_at DESC);

-- Updated timestamp trigger
CREATE TRIGGER update_autonomous_operations_updated_at
  BEFORE UPDATE ON autonomous_operations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE autonomous_operations IS 'Tracks all autonomous AI agent operations';
COMMENT ON COLUMN autonomous_operations.workflow_id IS 'Links to workflow in AGENT_KNOWLEDGE_BASE.json';
COMMENT ON COLUMN autonomous_operations.execution_metadata IS 'Stores browser version, AI model, timing data, etc.';

-- ============================================================================
-- 2. AUDIT TRAIL
-- ============================================================================

-- Step-by-step audit log
CREATE TABLE IF NOT EXISTS autonomous_operations_audit (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  operation_id UUID NOT NULL REFERENCES autonomous_operations(id) ON DELETE CASCADE,

  -- Step details
  step_number INTEGER NOT NULL,
  intent VARCHAR(200) NOT NULL, -- Human-readable step description
  action VARCHAR(500) NOT NULL, -- Actual Playwright command executed

  -- Outcome
  success BOOLEAN NOT NULL,
  error TEXT,

  -- Evidence
  screenshot_url TEXT, -- URL to encrypted screenshot in storage
  page_url TEXT, -- URL of page when step executed

  -- Performance
  duration_ms INTEGER,

  -- Metadata
  ai_response JSONB, -- Raw AI response for debugging

  -- Timestamp
  timestamp TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  CONSTRAINT positive_duration CHECK (duration_ms >= 0)
);

-- Indexes
CREATE INDEX idx_audit_operation_id ON autonomous_operations_audit(operation_id);
CREATE INDEX idx_audit_timestamp ON autonomous_operations_audit(timestamp DESC);
CREATE INDEX idx_audit_success ON autonomous_operations_audit(success);

COMMENT ON TABLE autonomous_operations_audit IS 'Complete audit trail of every autonomous operation step';
COMMENT ON COLUMN autonomous_operations_audit.screenshot_url IS 'Encrypted screenshot stored in Supabase Storage';
COMMENT ON COLUMN autonomous_operations_audit.ai_response IS 'Raw AI response for troubleshooting';

-- ============================================================================
-- 3. ENCRYPTED CREDENTIALS VAULT
-- ============================================================================

-- Secure credential storage
CREATE TABLE IF NOT EXISTS autonomous_credentials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,

  -- Service identification
  service VARCHAR(50) NOT NULL, -- 'woocommerce', 'stripe', etc.
  credential_type VARCHAR(50) NOT NULL, -- 'oauth_token', 'api_key', 'password', 'session'

  -- Encrypted data (AES-256)
  encrypted_credential BYTEA NOT NULL,
  encryption_key_id VARCHAR(100) NOT NULL, -- Key rotation tracking

  -- Expiration & rotation
  expires_at TIMESTAMPTZ,
  last_rotated_at TIMESTAMPTZ DEFAULT NOW(),
  rotation_required BOOLEAN DEFAULT false,

  -- Metadata
  credential_metadata JSONB, -- { scopes, permissions, etc. }

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Unique constraint
  UNIQUE(customer_id, service, credential_type)
);

-- Indexes
CREATE INDEX idx_credentials_customer ON autonomous_credentials(customer_id);
CREATE INDEX idx_credentials_service ON autonomous_credentials(service);
CREATE INDEX idx_credentials_expires_at ON autonomous_credentials(expires_at) WHERE expires_at IS NOT NULL;
CREATE INDEX idx_credentials_rotation ON autonomous_credentials(rotation_required) WHERE rotation_required = true;

-- Updated timestamp trigger
CREATE TRIGGER update_autonomous_credentials_updated_at
  BEFORE UPDATE ON autonomous_credentials
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE autonomous_credentials IS 'AES-256 encrypted credentials for autonomous operations';
COMMENT ON COLUMN autonomous_credentials.encrypted_credential IS 'Binary encrypted data (never plain text)';
COMMENT ON COLUMN autonomous_credentials.encryption_key_id IS 'Tracks which encryption key version was used';

-- ============================================================================
-- 4. USER CONSENT MANAGEMENT
-- ============================================================================

-- Consent records
CREATE TABLE IF NOT EXISTS autonomous_consent (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,

  -- Consent scope
  service VARCHAR(50) NOT NULL,
  operation VARCHAR(100) NOT NULL,
  permissions JSONB NOT NULL, -- ['read_products', 'create_api_keys', etc.]

  -- Consent status
  granted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ, -- NULL = permanent consent
  revoked_at TIMESTAMPTZ,
  is_active BOOLEAN GENERATED ALWAYS AS (
    revoked_at IS NULL AND (expires_at IS NULL OR expires_at > NOW())
  ) STORED,

  -- Audit trail
  ip_address INET,
  user_agent TEXT,
  consent_version VARCHAR(20), -- Track consent form version

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_consent_customer ON autonomous_consent(customer_id);
CREATE INDEX idx_consent_user ON autonomous_consent(user_id);
CREATE INDEX idx_consent_active ON autonomous_consent(is_active) WHERE is_active = true;
CREATE INDEX idx_consent_service ON autonomous_consent(service);

COMMENT ON TABLE autonomous_consent IS 'Tracks user consent for autonomous operations';
COMMENT ON COLUMN autonomous_consent.is_active IS 'Computed: true if consent not revoked and not expired';
COMMENT ON COLUMN autonomous_consent.permissions IS 'JSON array of specific permissions granted';

-- ============================================================================
-- 5. ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE autonomous_operations ENABLE ROW LEVEL SECURITY;
ALTER TABLE autonomous_operations_audit ENABLE ROW LEVEL SECURITY;
ALTER TABLE autonomous_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE autonomous_consent ENABLE ROW LEVEL SECURITY;

-- autonomous_operations policies
CREATE POLICY "Customers can view their own operations"
  ON autonomous_operations FOR SELECT
  USING (customer_id IN (
    SELECT customer_id FROM users WHERE id = auth.uid()
  ));

CREATE POLICY "Customers can create operations"
  ON autonomous_operations FOR INSERT
  WITH CHECK (customer_id IN (
    SELECT customer_id FROM users WHERE id = auth.uid()
  ));

CREATE POLICY "Service role has full access to operations"
  ON autonomous_operations FOR ALL
  USING (auth.role() = 'service_role');

-- autonomous_operations_audit policies
CREATE POLICY "Customers can view audit logs for their operations"
  ON autonomous_operations_audit FOR SELECT
  USING (operation_id IN (
    SELECT id FROM autonomous_operations
    WHERE customer_id IN (
      SELECT customer_id FROM users WHERE id = auth.uid()
    )
  ));

CREATE POLICY "Service role has full access to audit logs"
  ON autonomous_operations_audit FOR ALL
  USING (auth.role() = 'service_role');

-- autonomous_credentials policies (STRICT - service role only)
CREATE POLICY "Only service role can access credentials"
  ON autonomous_credentials FOR ALL
  USING (auth.role() = 'service_role');

-- autonomous_consent policies
CREATE POLICY "Users can view their own consent records"
  ON autonomous_consent FOR SELECT
  USING (user_id = auth.uid() OR customer_id IN (
    SELECT customer_id FROM users WHERE id = auth.uid()
  ));

CREATE POLICY "Users can create consent records"
  ON autonomous_consent FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can revoke their own consent"
  ON autonomous_consent FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Service role has full access to consent"
  ON autonomous_consent FOR ALL
  USING (auth.role() = 'service_role');

-- ============================================================================
-- 6. HELPER FUNCTIONS
-- ============================================================================

-- Check if customer has active consent for operation
CREATE OR REPLACE FUNCTION has_autonomous_consent(
  p_customer_id UUID,
  p_service VARCHAR,
  p_operation VARCHAR
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM autonomous_consent
    WHERE customer_id = p_customer_id
      AND service = p_service
      AND operation = p_operation
      AND is_active = true
  );
END;
$$;

COMMENT ON FUNCTION has_autonomous_consent IS 'Check if customer has valid consent for an autonomous operation';

-- Get operation statistics for customer
CREATE OR REPLACE FUNCTION get_autonomous_stats(p_customer_id UUID)
RETURNS TABLE(
  total_operations BIGINT,
  successful_operations BIGINT,
  failed_operations BIGINT,
  avg_duration_seconds NUMERIC,
  services_used TEXT[]
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*) as total_operations,
    COUNT(*) FILTER (WHERE result->>'success' = 'true') as successful_operations,
    COUNT(*) FILTER (WHERE result->>'success' = 'false') as failed_operations,
    ROUND(AVG(EXTRACT(EPOCH FROM (completed_at - started_at))), 2) as avg_duration_seconds,
    ARRAY_AGG(DISTINCT service) as services_used
  FROM autonomous_operations
  WHERE customer_id = p_customer_id
    AND completed_at IS NOT NULL;
END;
$$;

COMMENT ON FUNCTION get_autonomous_stats IS 'Get operation statistics for a customer';

-- ============================================================================
-- 7. SAMPLE DATA (Development Only - Remove in Production)
-- ============================================================================

-- Note: This is for development testing only
-- Remove this section before production deployment

-- Example operation (commented out for production)
-- INSERT INTO autonomous_operations (customer_id, service, operation, status, workflow_id)
-- SELECT id, 'woocommerce', 'api_key_generation', 'pending', 'woocommerce_api_key_generation'
-- FROM customers LIMIT 1;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

-- Verify tables created
DO $$
BEGIN
  ASSERT (SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'autonomous_operations') = 1,
    'autonomous_operations table not created';
  ASSERT (SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'autonomous_operations_audit') = 1,
    'autonomous_operations_audit table not created';
  ASSERT (SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'autonomous_credentials') = 1,
    'autonomous_credentials table not created';
  ASSERT (SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'autonomous_consent') = 1,
    'autonomous_consent table not created';

  RAISE NOTICE 'Autonomous Operations System migration completed successfully';
  RAISE NOTICE 'Tables created: autonomous_operations, autonomous_operations_audit, autonomous_credentials, autonomous_consent';
  RAISE NOTICE 'RLS enabled on all tables';
  RAISE NOTICE 'Helper functions created: has_autonomous_consent, get_autonomous_stats';
END $$;
