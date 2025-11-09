-- Purchase Attribution System Migration
-- Created: 2025-01-09
-- Purpose: Track purchases attributed to chat conversations and customer lifetime value

-- =====================================================
-- PURCHASE ATTRIBUTIONS TABLE
-- =====================================================
-- Links orders from WooCommerce/Shopify to conversations

CREATE TABLE IF NOT EXISTS purchase_attributions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  -- Conversation linking (nullable - some orders may not match any conversation)
  conversation_id UUID REFERENCES conversations(id) ON DELETE SET NULL,

  -- Customer identification
  customer_email TEXT NOT NULL,

  -- Order details
  order_id TEXT NOT NULL,
  order_number TEXT,
  platform TEXT NOT NULL CHECK (platform IN ('woocommerce', 'shopify')),
  order_total DECIMAL(10,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',

  -- Attribution metadata
  attribution_confidence DECIMAL(3,2) NOT NULL DEFAULT 0.0 CHECK (attribution_confidence >= 0.0 AND attribution_confidence <= 1.0),
  attribution_method TEXT NOT NULL CHECK (attribution_method IN ('session_match', 'email_match', 'time_proximity', 'no_match', 'manual')),
  attribution_reasoning TEXT,

  -- Order metadata (store full webhook payload for debugging)
  order_metadata JSONB DEFAULT '{}'::jsonb,

  -- Timestamps
  order_created_at TIMESTAMPTZ,
  attributed_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for purchase_attributions
CREATE INDEX idx_purchase_attributions_customer_email ON purchase_attributions(customer_email);
CREATE INDEX idx_purchase_attributions_conversation_id ON purchase_attributions(conversation_id) WHERE conversation_id IS NOT NULL;
CREATE INDEX idx_purchase_attributions_order_id ON purchase_attributions(order_id);
CREATE INDEX idx_purchase_attributions_platform ON purchase_attributions(platform);
CREATE INDEX idx_purchase_attributions_attributed_at ON purchase_attributions(attributed_at DESC);
CREATE INDEX idx_purchase_attributions_order_created_at ON purchase_attributions(order_created_at DESC);
CREATE INDEX idx_purchase_attributions_confidence ON purchase_attributions(attribution_confidence);

-- GIN index for JSONB queries on order metadata
CREATE INDEX idx_purchase_attributions_metadata ON purchase_attributions USING GIN (order_metadata);

-- Unique constraint: one attribution per order
CREATE UNIQUE INDEX idx_purchase_attributions_unique_order ON purchase_attributions(platform, order_id);

-- Comment
COMMENT ON TABLE purchase_attributions IS 'Links e-commerce orders from WooCommerce/Shopify to chat conversations with confidence scoring';

-- =====================================================
-- CUSTOMER SESSIONS TABLE
-- =====================================================
-- Links customer email addresses to sessions for returning customer detection

CREATE TABLE IF NOT EXISTS customer_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  -- Customer identification
  customer_email TEXT NOT NULL,

  -- Session tracking
  session_id TEXT NOT NULL,
  domain TEXT NOT NULL,

  -- Lifetime metrics
  first_seen_at TIMESTAMPTZ DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ DEFAULT NOW(),
  total_conversations INTEGER DEFAULT 1,
  total_purchases INTEGER DEFAULT 0,
  lifetime_value DECIMAL(10,2) DEFAULT 0.0,

  -- Metadata
  customer_metadata JSONB DEFAULT '{}'::jsonb,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for customer_sessions
CREATE INDEX idx_customer_sessions_email ON customer_sessions(customer_email);
CREATE INDEX idx_customer_sessions_session_id ON customer_sessions(session_id);
CREATE INDEX idx_customer_sessions_domain ON customer_sessions(domain);
CREATE INDEX idx_customer_sessions_email_domain ON customer_sessions(customer_email, domain);
CREATE INDEX idx_customer_sessions_last_seen ON customer_sessions(last_seen_at DESC);
CREATE INDEX idx_customer_sessions_lifetime_value ON customer_sessions(lifetime_value DESC);

-- Unique constraint: one record per email+session+domain combo
CREATE UNIQUE INDEX idx_customer_sessions_unique ON customer_sessions(customer_email, session_id, domain);

-- Comment
COMMENT ON TABLE customer_sessions IS 'Links customer email addresses to chat sessions for returning customer detection and LTV tracking';

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Function to update customer session metrics after purchase
CREATE OR REPLACE FUNCTION update_customer_session_on_purchase()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the customer_sessions record
  UPDATE customer_sessions
  SET
    total_purchases = total_purchases + 1,
    lifetime_value = lifetime_value + NEW.order_total,
    last_seen_at = GREATEST(last_seen_at, NEW.order_created_at),
    updated_at = NOW()
  WHERE customer_email = NEW.customer_email;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update customer sessions when purchase is attributed
CREATE TRIGGER trigger_update_customer_session_on_purchase
  AFTER INSERT ON purchase_attributions
  FOR EACH ROW
  EXECUTE FUNCTION update_customer_session_on_purchase();

-- Comment
COMMENT ON FUNCTION update_customer_session_on_purchase() IS 'Automatically updates customer lifetime metrics when a purchase is attributed';

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on purchase_attributions
ALTER TABLE purchase_attributions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see attributions for their organization's domains
CREATE POLICY select_purchase_attributions ON purchase_attributions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM conversations c
      INNER JOIN domains d ON d.id = c.domain_id
      WHERE c.id = purchase_attributions.conversation_id
      AND d.organization_id IN (
        SELECT organization_id FROM organization_members
        WHERE user_id = auth.uid()
      )
    )
    OR
    -- Allow if conversation_id is null (unattributed orders)
    conversation_id IS NULL
  );

-- Policy: Service role can insert purchase attributions
CREATE POLICY insert_purchase_attributions ON purchase_attributions
  FOR INSERT
  WITH CHECK (true); -- Service role only, no user access

-- Enable RLS on customer_sessions
ALTER TABLE customer_sessions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see sessions for their organization's domains
CREATE POLICY select_customer_sessions ON customer_sessions
  FOR SELECT
  USING (
    domain IN (
      SELECT d.domain FROM customer_configs d
      INNER JOIN organizations o ON o.id = d.organization_id
      INNER JOIN organization_members om ON om.organization_id = o.id
      WHERE om.user_id = auth.uid()
    )
  );

-- Policy: Service role can insert/update customer sessions
CREATE POLICY insert_customer_sessions ON customer_sessions
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY update_customer_sessions ON customer_sessions
  FOR UPDATE
  USING (true);

-- =====================================================
-- ANALYTICS VIEWS
-- =====================================================

-- View: Revenue by domain
CREATE OR REPLACE VIEW revenue_by_domain AS
SELECT
  d.domain,
  d.organization_id,
  COUNT(DISTINCT pa.id) as total_orders,
  SUM(pa.order_total) as total_revenue,
  AVG(pa.order_total) as avg_order_value,
  COUNT(DISTINCT pa.customer_email) as unique_customers,
  SUM(CASE WHEN pa.attribution_confidence >= 0.7 THEN pa.order_total ELSE 0 END) as high_confidence_revenue,
  COUNT(DISTINCT CASE WHEN pa.conversation_id IS NOT NULL THEN pa.id END) as attributed_orders
FROM purchase_attributions pa
LEFT JOIN conversations c ON c.id = pa.conversation_id
LEFT JOIN domains d ON d.id = c.domain_id
GROUP BY d.domain, d.organization_id;

COMMENT ON VIEW revenue_by_domain IS 'Revenue analytics aggregated by domain';

-- View: Customer lifetime value rankings
CREATE OR REPLACE VIEW customer_ltv_rankings AS
SELECT
  cs.customer_email,
  cs.domain,
  cs.total_conversations,
  cs.total_purchases,
  cs.lifetime_value,
  cs.first_seen_at,
  cs.last_seen_at,
  EXTRACT(EPOCH FROM (cs.last_seen_at - cs.first_seen_at))/86400 as customer_age_days,
  CASE
    WHEN cs.total_purchases > 1 THEN true
    ELSE false
  END as is_returning_customer
FROM customer_sessions cs
ORDER BY cs.lifetime_value DESC;

COMMENT ON VIEW customer_ltv_rankings IS 'Customer lifetime value rankings with returning customer detection';
