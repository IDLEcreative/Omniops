/**
 * Conversation Funnel Tracking
 *
 * Tracks the complete customer journey from chat → cart abandonment → purchase
 * Integrates with existing cart abandonment and purchase attribution systems
 *
 * Created: 2025-01-09
 */

-- Create conversation_funnel table
CREATE TABLE IF NOT EXISTS conversation_funnel (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  -- Core identifiers
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  customer_email TEXT NOT NULL,
  domain TEXT NOT NULL,

  -- Funnel stages (timestamps)
  chat_started_at TIMESTAMPTZ NOT NULL,
  cart_created_at TIMESTAMPTZ,
  purchased_at TIMESTAMPTZ,

  -- Cart stage details
  cart_order_id TEXT,                    -- WooCommerce/Shopify order ID (abandoned)
  cart_value DECIMAL(10,2),
  cart_item_count INTEGER,
  cart_priority TEXT CHECK (cart_priority IN ('high', 'medium', 'low')),

  -- Purchase stage details
  purchase_order_id TEXT,                -- Final order ID
  purchase_value DECIMAL(10,2),
  attribution_confidence DECIMAL(3,2),
  attribution_method TEXT,

  -- Analytics
  current_stage TEXT NOT NULL DEFAULT 'chat' CHECK (current_stage IN ('chat', 'cart_abandoned', 'purchased')),
  drop_off_point TEXT CHECK (drop_off_point IN ('chat_to_cart', 'cart_to_purchase')),

  -- Timing metrics (in seconds)
  time_to_cart INTEGER,                  -- Seconds from chat to cart creation
  time_to_purchase INTEGER,              -- Seconds from chat to purchase
  cart_to_purchase_time INTEGER,         -- Seconds from cart to purchase

  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_conversation_funnel_conversation_id ON conversation_funnel(conversation_id);
CREATE INDEX idx_conversation_funnel_customer_email ON conversation_funnel(customer_email);
CREATE INDEX idx_conversation_funnel_domain ON conversation_funnel(domain);
CREATE INDEX idx_conversation_funnel_current_stage ON conversation_funnel(current_stage);
CREATE INDEX idx_conversation_funnel_chat_started_at ON conversation_funnel(chat_started_at);
CREATE INDEX idx_conversation_funnel_purchased_at ON conversation_funnel(purchased_at);

-- Composite index for funnel queries
CREATE INDEX idx_conversation_funnel_domain_stage ON conversation_funnel(domain, current_stage);
CREATE INDEX idx_conversation_funnel_email_stage ON conversation_funnel(customer_email, current_stage);

-- Updated timestamp trigger
CREATE OR REPLACE FUNCTION update_conversation_funnel_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_conversation_funnel_updated_at
  BEFORE UPDATE ON conversation_funnel
  FOR EACH ROW
  EXECUTE FUNCTION update_conversation_funnel_updated_at();

-- Row Level Security (RLS)
ALTER TABLE conversation_funnel ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see funnels for their organization's domains
CREATE POLICY conversation_funnel_select_policy ON conversation_funnel
  FOR SELECT
  USING (
    domain IN (
      SELECT cc.domain
      FROM customer_configs cc
      INNER JOIN organization_members om ON cc.organization_id = om.organization_id
      WHERE om.user_id = auth.uid()
    )
  );

-- Policy: Service role can do anything
CREATE POLICY conversation_funnel_service_role_policy ON conversation_funnel
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- Create materialized view for fast funnel analytics
CREATE MATERIALIZED VIEW conversation_funnel_stats AS
SELECT
  domain,
  DATE_TRUNC('day', chat_started_at) as date,
  COUNT(*) as total_chats,
  COUNT(cart_created_at) as total_carts,
  COUNT(purchased_at) as total_purchases,

  -- Conversion rates
  CASE
    WHEN COUNT(*) > 0
    THEN ROUND((COUNT(cart_created_at)::DECIMAL / COUNT(*)) * 100, 2)
    ELSE 0
  END as chat_to_cart_rate,

  CASE
    WHEN COUNT(cart_created_at) > 0
    THEN ROUND((COUNT(purchased_at)::DECIMAL / COUNT(cart_created_at)) * 100, 2)
    ELSE 0
  END as cart_to_purchase_rate,

  CASE
    WHEN COUNT(*) > 0
    THEN ROUND((COUNT(purchased_at)::DECIMAL / COUNT(*)) * 100, 2)
    ELSE 0
  END as overall_conversion_rate,

  -- Average times (in minutes)
  ROUND(AVG(time_to_cart) / 60.0, 2) as avg_time_to_cart_minutes,
  ROUND(AVG(time_to_purchase) / 60.0, 2) as avg_time_to_purchase_minutes,
  ROUND(AVG(cart_to_purchase_time) / 60.0, 2) as avg_cart_to_purchase_minutes,

  -- Revenue
  SUM(purchase_value) as total_revenue,
  AVG(purchase_value) as avg_purchase_value,

  -- Drop-off analysis
  COUNT(CASE WHEN drop_off_point = 'chat_to_cart' THEN 1 END) as dropped_at_cart,
  COUNT(CASE WHEN drop_off_point = 'cart_to_purchase' THEN 1 END) as dropped_at_purchase

FROM conversation_funnel
GROUP BY domain, DATE_TRUNC('day', chat_started_at);

-- Index on materialized view
CREATE INDEX idx_conversation_funnel_stats_domain_date ON conversation_funnel_stats(domain, date);

-- Create refresh function for materialized view
CREATE OR REPLACE FUNCTION refresh_conversation_funnel_stats()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY conversation_funnel_stats;
END;
$$ LANGUAGE plpgsql;

-- Comments for documentation
COMMENT ON TABLE conversation_funnel IS 'Tracks complete customer journey from chat through cart abandonment to purchase';
COMMENT ON COLUMN conversation_funnel.current_stage IS 'Current stage in the funnel: chat, cart_abandoned, or purchased';
COMMENT ON COLUMN conversation_funnel.drop_off_point IS 'Where customer dropped off if they did not complete purchase';
COMMENT ON COLUMN conversation_funnel.time_to_cart IS 'Seconds from chat start to cart creation';
COMMENT ON COLUMN conversation_funnel.time_to_purchase IS 'Seconds from chat start to purchase completion';
COMMENT ON MATERIALIZED VIEW conversation_funnel_stats IS 'Pre-aggregated funnel statistics for fast dashboard queries';
