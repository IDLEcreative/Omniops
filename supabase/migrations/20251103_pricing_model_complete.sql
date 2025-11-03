-- Complete Pricing Model Migration
-- Creates the four-tier pricing system with per-domain subscriptions
-- Includes usage tracking, multi-domain discounts, and AI quote system

-- ============================================================================
-- TABLE 1: PRICING TIERS
-- ============================================================================

CREATE TABLE IF NOT EXISTS pricing_tiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Tier identification
  tier_name TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  description TEXT,

  -- Pricing
  monthly_price DECIMAL(10,2) NOT NULL,
  included_completions INTEGER NOT NULL,
  overage_rate DECIMAL(10,4) NOT NULL,

  -- Features (JSONB for flexibility)
  features JSONB NOT NULL DEFAULT '{}'::jsonb,

  -- Target market indicators
  target_traffic_min INTEGER,
  target_traffic_max INTEGER,
  target_employees_min INTEGER,
  target_employees_max INTEGER,
  target_revenue_min BIGINT,
  target_revenue_max BIGINT,

  -- Metadata
  sort_order INTEGER NOT NULL UNIQUE,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for pricing tier queries
CREATE INDEX IF NOT EXISTS idx_pricing_tiers_active ON pricing_tiers(active) WHERE active = true;
CREATE INDEX IF NOT EXISTS idx_pricing_tiers_sort_order ON pricing_tiers(sort_order);

-- ============================================================================
-- TABLE 2: DOMAIN SUBSCRIPTIONS
-- ============================================================================

CREATE TABLE IF NOT EXISTS domain_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Foreign keys
  domain_id UUID NOT NULL REFERENCES domains(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  pricing_tier_id UUID NOT NULL REFERENCES pricing_tiers(id) ON DELETE RESTRICT,

  -- Stripe integration
  stripe_subscription_id TEXT UNIQUE,
  stripe_subscription_item_id TEXT UNIQUE,

  -- Subscription status
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'canceled', 'past_due', 'trialing', 'incomplete')),
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT false,

  -- Pricing with discounts
  multi_domain_discount DECIMAL(5,2) DEFAULT 0.00,
  effective_monthly_price DECIMAL(10,2),

  -- Legacy migration flag
  is_legacy_migration BOOLEAN DEFAULT false,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  UNIQUE(domain_id),
  CONSTRAINT discount_range CHECK (multi_domain_discount >= 0 AND multi_domain_discount <= 1),
  CONSTRAINT price_positive CHECK (effective_monthly_price > 0)
);

-- Indexes for common domain subscription queries
CREATE INDEX IF NOT EXISTS idx_domain_subscriptions_org
  ON domain_subscriptions(organization_id);
CREATE INDEX IF NOT EXISTS idx_domain_subscriptions_status
  ON domain_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_domain_subscriptions_stripe
  ON domain_subscriptions(stripe_subscription_id)
  WHERE stripe_subscription_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_domain_subscriptions_domain
  ON domain_subscriptions(domain_id);
CREATE INDEX IF NOT EXISTS idx_domain_subscriptions_tier
  ON domain_subscriptions(pricing_tier_id);

-- ============================================================================
-- TABLE 3: DOMAIN MONTHLY USAGE
-- ============================================================================

CREATE TABLE IF NOT EXISTS domain_monthly_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Foreign key and date
  domain_id UUID NOT NULL REFERENCES domains(id) ON DELETE CASCADE,
  month DATE NOT NULL,

  -- Usage tracking
  completed_conversations INTEGER DEFAULT 0,
  included_limit INTEGER NOT NULL,

  -- Computed fields (generated columns)
  overage_count INTEGER GENERATED ALWAYS AS (
    GREATEST(0, completed_conversations - included_limit)
  ) STORED,

  -- Billing amounts
  base_charge DECIMAL(10,2) NOT NULL,
  overage_rate DECIMAL(10,4) NOT NULL,
  overage_charge DECIMAL(10,2) GENERATED ALWAYS AS (
    GREATEST(0, completed_conversations - included_limit) * overage_rate
  ) STORED,
  total_charge DECIMAL(10,2) GENERATED ALWAYS AS (
    base_charge + (GREATEST(0, completed_conversations - included_limit) * overage_rate)
  ) STORED,

  -- Warning system
  last_warning_sent_at TIMESTAMPTZ,
  warning_level INTEGER DEFAULT 0 CHECK (warning_level IN (0, 1, 2, 3)),

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  UNIQUE(domain_id, month),
  CONSTRAINT usage_non_negative CHECK (completed_conversations >= 0),
  CONSTRAINT limit_positive CHECK (included_limit > 0)
);

-- Indexes for billing and usage queries
CREATE INDEX IF NOT EXISTS idx_monthly_usage_domain
  ON domain_monthly_usage(domain_id);
CREATE INDEX IF NOT EXISTS idx_monthly_usage_month
  ON domain_monthly_usage(month DESC);
CREATE INDEX IF NOT EXISTS idx_monthly_usage_billing
  ON domain_monthly_usage(domain_id, month DESC);
CREATE INDEX IF NOT EXISTS idx_monthly_usage_overage
  ON domain_monthly_usage(domain_id)
  WHERE overage_count > 0;
CREATE INDEX IF NOT EXISTS idx_monthly_usage_warnings
  ON domain_monthly_usage(domain_id)
  WHERE warning_level > 0;

-- ============================================================================
-- TABLE 4: AI QUOTES
-- ============================================================================

CREATE TABLE IF NOT EXISTS ai_quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Association with domain subscription
  domain_subscription_id UUID NOT NULL REFERENCES domain_subscriptions(id) ON DELETE CASCADE,

  -- AI-generated quote content
  title TEXT NOT NULL,
  description TEXT,
  value_proposition TEXT,
  estimated_roi DECIMAL(10,2),
  confidence_score DECIMAL(5,2) CHECK (confidence_score >= 0 AND confidence_score <= 100),

  -- Quote metadata
  tier_recommended TEXT,
  upgrade_recommendation JSONB DEFAULT '{}'::jsonb,

  -- Status tracking
  status TEXT NOT NULL DEFAULT 'generated' CHECK (status IN ('generated', 'presented', 'accepted', 'rejected', 'expired')),
  expires_at TIMESTAMPTZ,

  -- Generated by system
  generated_by TEXT DEFAULT 'gpt-4',
  generation_tokens_used INTEGER,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for quote queries
CREATE INDEX IF NOT EXISTS idx_ai_quotes_subscription
  ON ai_quotes(domain_subscription_id);
CREATE INDEX IF NOT EXISTS idx_ai_quotes_status
  ON ai_quotes(status);
CREATE INDEX IF NOT EXISTS idx_ai_quotes_expires_at
  ON ai_quotes(expires_at)
  WHERE status = 'generated';
CREATE INDEX IF NOT EXISTS idx_ai_quotes_confidence
  ON ai_quotes(confidence_score DESC)
  WHERE status = 'generated';

-- ============================================================================
-- TABLE 5: QUOTE RATE LIMITS
-- ============================================================================

CREATE TABLE IF NOT EXISTS quote_rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Rate limit identifier
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  limit_type TEXT NOT NULL CHECK (limit_type IN ('hourly', 'daily', 'monthly')),

  -- Quotas
  max_requests INTEGER NOT NULL,
  current_requests INTEGER DEFAULT 0,

  -- Window tracking
  window_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  window_end TIMESTAMPTZ NOT NULL,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  CONSTRAINT requests_non_negative CHECK (current_requests >= 0),
  CONSTRAINT max_positive CHECK (max_requests > 0)
);

-- Indexes for rate limit enforcement
CREATE INDEX IF NOT EXISTS idx_quote_rate_limits_org
  ON quote_rate_limits(organization_id);
CREATE INDEX IF NOT EXISTS idx_quote_rate_limits_active
  ON quote_rate_limits(organization_id, limit_type)
  WHERE NOW() < window_end;
CREATE INDEX IF NOT EXISTS idx_quote_rate_limits_window
  ON quote_rate_limits(window_end DESC);

-- ============================================================================
-- SEED DATA: INSERT PRICING TIERS
-- ============================================================================

INSERT INTO pricing_tiers (
  tier_name,
  display_name,
  description,
  monthly_price,
  included_completions,
  overage_rate,
  features,
  target_traffic_min,
  target_traffic_max,
  target_employees_min,
  target_employees_max,
  target_revenue_min,
  target_revenue_max,
  sort_order
) VALUES
(
  'small_business',
  'Small Business',
  'Perfect for growing online shops and local businesses',
  500.00,
  2500,
  0.12,
  '{"unlimited_seats": true, "unlimited_scraping": true, "woocommerce": true, "shopify": true, "email_support": true, "features": ["Unlimited chat widget", "Website scraping", "WooCommerce integration", "Shopify integration", "Email support"]}'::jsonb,
  20000,
  100000,
  5,
  15,
  500000,
  2000000,
  1
),
(
  'sme',
  'SME',
  'For established e-commerce brands and growing businesses',
  1000.00,
  5000,
  0.10,
  '{"unlimited_seats": true, "unlimited_scraping": true, "woocommerce": true, "shopify": true, "priority_support": true, "advanced_analytics": true, "features": ["Everything in Small Business", "Priority support", "Advanced analytics", "Detailed usage reports"]}'::jsonb,
  100000,
  500000,
  15,
  50,
  2000000,
  10000000,
  2
),
(
  'mid_market',
  'Mid-Market',
  'For large operations and multi-brand retailers',
  5000.00,
  25000,
  0.08,
  '{"unlimited_seats": true, "unlimited_scraping": true, "woocommerce": true, "shopify": true, "account_manager": true, "sla": true, "custom_integrations": true, "features": ["Everything in SME", "Dedicated account manager", "99.9% SLA", "Custom integrations", "API access"]}'::jsonb,
  500000,
  2000000,
  50,
  250,
  10000000,
  50000000,
  3
),
(
  'enterprise',
  'Enterprise',
  'For enterprise organizations and global brands',
  10000.00,
  100000,
  0.05,
  '{"unlimited_seats": true, "unlimited_scraping": true, "woocommerce": true, "shopify": true, "white_label": true, "on_premise": true, "dedicated_support": true, "custom_ai": true, "features": ["Everything in Mid-Market", "White-label capability", "On-premise deployment", "24/7 dedicated support", "Custom AI model training"]}'::jsonb,
  2000000,
  NULL,
  250,
  NULL,
  50000000,
  NULL,
  4
)
ON CONFLICT (tier_name) DO NOTHING;

-- ============================================================================
-- FUNCTION 1: CALCULATE MULTI-DOMAIN DISCOUNT
-- ============================================================================

CREATE OR REPLACE FUNCTION calculate_multi_domain_discount(
  p_organization_id UUID
)
RETURNS DECIMAL(5,2)
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v_domain_count INTEGER;
  v_discount DECIMAL(5,2);
BEGIN
  -- Count active domains for organization
  SELECT COUNT(*)
  INTO v_domain_count
  FROM domain_subscriptions
  WHERE organization_id = p_organization_id
    AND status = 'active';

  -- Calculate discount based on domain count
  v_discount := CASE
    WHEN v_domain_count = 1 THEN 0.00
    WHEN v_domain_count = 2 THEN 0.10
    WHEN v_domain_count = 3 THEN 0.15
    WHEN v_domain_count = 4 THEN 0.20
    WHEN v_domain_count = 5 THEN 0.25
    WHEN v_domain_count BETWEEN 6 AND 10 THEN 0.30
    WHEN v_domain_count >= 11 THEN 0.35
    ELSE 0.00
  END;

  RETURN v_discount;
END;
$$;

-- ============================================================================
-- FUNCTION 2: INCREMENT MONTHLY COMPLETIONS
-- ============================================================================

CREATE OR REPLACE FUNCTION increment_monthly_completions(
  p_domain_id UUID,
  p_count INTEGER DEFAULT 1
)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  v_month DATE;
  v_tier_id UUID;
  v_included_limit INTEGER;
  v_overage_rate DECIMAL(10,4);
  v_base_charge DECIMAL(10,2);
BEGIN
  -- Get first day of current month
  v_month := DATE_TRUNC('month', NOW())::DATE;

  -- Get tier information from domain subscription
  SELECT pt.id, pt.included_completions, pt.overage_rate, ds.effective_monthly_price
  INTO v_tier_id, v_included_limit, v_overage_rate, v_base_charge
  FROM domain_subscriptions ds
  JOIN pricing_tiers pt ON ds.pricing_tier_id = pt.id
  WHERE ds.domain_id = p_domain_id
    AND ds.status = 'active'
  LIMIT 1;

  -- If no active subscription, exit early
  IF v_tier_id IS NULL THEN
    RETURN;
  END IF;

  -- Upsert monthly usage record
  INSERT INTO domain_monthly_usage (
    domain_id,
    month,
    completed_conversations,
    included_limit,
    base_charge,
    overage_rate
  ) VALUES (
    p_domain_id,
    v_month,
    p_count,
    v_included_limit,
    v_base_charge,
    v_overage_rate
  )
  ON CONFLICT (domain_id, month) DO UPDATE
  SET
    completed_conversations = domain_monthly_usage.completed_conversations + p_count,
    updated_at = NOW();
END;
$$;

-- ============================================================================
-- FUNCTION 3: UPDATE DOMAIN DISCOUNTS (TRIGGER FUNCTION)
-- ============================================================================

CREATE OR REPLACE FUNCTION update_domain_discounts()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_org_id UUID;
  v_discount DECIMAL(5,2);
BEGIN
  -- Get organization ID from either NEW or OLD record
  v_org_id := COALESCE(NEW.organization_id, OLD.organization_id);

  -- Calculate new discount
  v_discount := calculate_multi_domain_discount(v_org_id);

  -- Update all subscriptions for this organization
  UPDATE domain_subscriptions ds
  SET
    multi_domain_discount = v_discount,
    effective_monthly_price = pt.monthly_price * (1 - v_discount),
    updated_at = NOW()
  FROM pricing_tiers pt
  WHERE ds.organization_id = v_org_id
    AND ds.pricing_tier_id = pt.id
    AND ds.status = 'active';

  RETURN NEW;
END;
$$;

-- ============================================================================
-- TRIGGER: AUTO-UPDATE DISCOUNTS ON SUBSCRIPTION CHANGES
-- ============================================================================

DROP TRIGGER IF EXISTS trg_update_discounts_after_subscription_change ON domain_subscriptions;
CREATE TRIGGER trg_update_discounts_after_subscription_change
AFTER INSERT OR UPDATE OR DELETE ON domain_subscriptions
FOR EACH ROW
EXECUTE FUNCTION update_domain_discounts();

-- ============================================================================
-- FUNCTION 4: AUTO-UPDATE UPDATED_AT TIMESTAMPS
-- ============================================================================

CREATE OR REPLACE FUNCTION update_domain_subscriptions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_domain_subscriptions_updated_at ON domain_subscriptions;
CREATE TRIGGER trg_domain_subscriptions_updated_at
BEFORE UPDATE ON domain_subscriptions
FOR EACH ROW
EXECUTE FUNCTION update_domain_subscriptions_updated_at();

-- Similar triggers for other tables
CREATE OR REPLACE FUNCTION update_pricing_tiers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_pricing_tiers_updated_at ON pricing_tiers;
CREATE TRIGGER trg_pricing_tiers_updated_at
BEFORE UPDATE ON pricing_tiers
FOR EACH ROW
EXECUTE FUNCTION update_pricing_tiers_updated_at();

CREATE OR REPLACE FUNCTION update_monthly_usage_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_monthly_usage_updated_at ON domain_monthly_usage;
CREATE TRIGGER trg_monthly_usage_updated_at
BEFORE UPDATE ON domain_monthly_usage
FOR EACH ROW
EXECUTE FUNCTION update_monthly_usage_updated_at();

CREATE OR REPLACE FUNCTION update_ai_quotes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_ai_quotes_updated_at ON ai_quotes;
CREATE TRIGGER trg_ai_quotes_updated_at
BEFORE UPDATE ON ai_quotes
FOR EACH ROW
EXECUTE FUNCTION update_ai_quotes_updated_at();

CREATE OR REPLACE FUNCTION update_quote_rate_limits_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_quote_rate_limits_updated_at ON quote_rate_limits;
CREATE TRIGGER trg_quote_rate_limits_updated_at
BEFORE UPDATE ON quote_rate_limits
FOR EACH ROW
EXECUTE FUNCTION update_quote_rate_limits_updated_at();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE pricing_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE domain_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE domain_monthly_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE quote_rate_limits ENABLE ROW LEVEL SECURITY;

-- PRICING_TIERS: Public read-only
DROP POLICY IF EXISTS "Pricing tiers are public" ON pricing_tiers;
CREATE POLICY "Pricing tiers are public"
  ON pricing_tiers
  FOR SELECT
  TO public
  USING (active = true);

-- DOMAIN_SUBSCRIPTIONS: Organization members can view their domains
DROP POLICY IF EXISTS "Organization members can view their subscriptions" ON domain_subscriptions;
CREATE POLICY "Organization members can view their subscriptions"
  ON domain_subscriptions
  FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT org_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  );

-- DOMAIN_SUBSCRIPTIONS: Only organization owners can modify
DROP POLICY IF EXISTS "Organization owners can modify subscriptions" ON domain_subscriptions;
CREATE POLICY "Organization owners can modify subscriptions"
  ON domain_subscriptions
  FOR INSERT, UPDATE, DELETE
  TO authenticated
  USING (
    organization_id IN (
      SELECT org_id FROM organization_members
      WHERE user_id = auth.uid()
        AND role = 'owner'
    )
  );

-- DOMAIN_MONTHLY_USAGE: Organization members can view usage
DROP POLICY IF EXISTS "Organization members can view usage" ON domain_monthly_usage;
CREATE POLICY "Organization members can view usage"
  ON domain_monthly_usage
  FOR SELECT
  TO authenticated
  USING (
    domain_id IN (
      SELECT id FROM domains
      WHERE org_id IN (
        SELECT org_id FROM organization_members
        WHERE user_id = auth.uid()
      )
    )
  );

-- AI_QUOTES: Organization members can view quotes
DROP POLICY IF EXISTS "Organization members can view quotes" ON ai_quotes;
CREATE POLICY "Organization members can view quotes"
  ON ai_quotes
  FOR SELECT
  TO authenticated
  USING (
    domain_subscription_id IN (
      SELECT id FROM domain_subscriptions
      WHERE organization_id IN (
        SELECT org_id FROM organization_members
        WHERE user_id = auth.uid()
      )
    )
  );

-- QUOTE_RATE_LIMITS: Organization members can view their limits
DROP POLICY IF EXISTS "Organization members can view rate limits" ON quote_rate_limits;
CREATE POLICY "Organization members can view rate limits"
  ON quote_rate_limits
  FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT org_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  );

-- ============================================================================
-- TABLE DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE pricing_tiers IS 'Defines the four pricing tiers (Small Business, SME, Mid-Market, Enterprise) with included conversations and overage rates';

COMMENT ON COLUMN pricing_tiers.tier_name IS 'Internal identifier (small_business, sme, mid_market, enterprise)';
COMMENT ON COLUMN pricing_tiers.display_name IS 'Customer-facing tier name shown on pricing page';
COMMENT ON COLUMN pricing_tiers.monthly_price IS 'Base monthly price in GBP';
COMMENT ON COLUMN pricing_tiers.included_completions IS 'Number of completed conversations included in base price';
COMMENT ON COLUMN pricing_tiers.overage_rate IS 'Price per conversation beyond included limit';
COMMENT ON COLUMN pricing_tiers.features IS 'JSONB object listing included features';

COMMENT ON TABLE domain_subscriptions IS 'Links each domain to a pricing tier, Stripe subscription, and organization';

COMMENT ON COLUMN domain_subscriptions.domain_id IS 'Foreign key to domains table (one subscription per domain)';
COMMENT ON COLUMN domain_subscriptions.stripe_subscription_id IS 'Stripe subscription ID for billing integration';
COMMENT ON COLUMN domain_subscriptions.status IS 'Active, canceled, past_due, trialing, or incomplete';
COMMENT ON COLUMN domain_subscriptions.multi_domain_discount IS 'Discount applied based on total active domains in organization (0.0-0.35)';
COMMENT ON COLUMN domain_subscriptions.effective_monthly_price IS 'Price after discount = monthly_price * (1 - discount)';

COMMENT ON TABLE domain_monthly_usage IS 'Tracks conversation usage and billing for each domain per month';

COMMENT ON COLUMN domain_monthly_usage.month IS 'First day of the month (YYYY-MM-01) for grouping';
COMMENT ON COLUMN domain_monthly_usage.completed_conversations IS 'Total completed conversations during the month';
COMMENT ON COLUMN domain_monthly_usage.included_limit IS 'Number of conversations included at no extra cost';
COMMENT ON COLUMN domain_monthly_usage.overage_count IS 'Generated column: completed_conversations - included_limit (floored at 0)';
COMMENT ON COLUMN domain_monthly_usage.total_charge IS 'Generated column: base_charge + (overage_count * overage_rate)';
COMMENT ON COLUMN domain_monthly_usage.warning_level IS 'Alert level: 0=normal, 1=90% used, 2=100% used, 3=150% used';

COMMENT ON TABLE ai_quotes IS 'AI-generated pricing quotes with recommendations and ROI estimates';

COMMENT ON COLUMN ai_quotes.confidence_score IS 'How confident the AI is in this quote (0-100)';
COMMENT ON COLUMN ai_quotes.upgrade_recommendation IS 'JSONB with suggested tier changes and reasons';
COMMENT ON COLUMN ai_quotes.expires_at IS 'Quote validity window (typically 30 days from generation)';

COMMENT ON TABLE quote_rate_limits IS 'Prevents abuse of the AI quote generation system by limiting requests per org';

COMMENT ON COLUMN quote_rate_limits.limit_type IS 'hourly, daily, or monthly rate limit window';
COMMENT ON COLUMN quote_rate_limits.current_requests IS 'Current count of requests in this window';
COMMENT ON COLUMN quote_rate_limits.window_end IS 'When this rate limit window resets';

-- ============================================================================
-- GRANTS (for application role)
-- ============================================================================

-- Grant appropriate permissions to authenticated users
GRANT SELECT ON pricing_tiers TO authenticated;
GRANT SELECT ON domain_subscriptions TO authenticated;
GRANT SELECT ON domain_monthly_usage TO authenticated;
GRANT SELECT ON ai_quotes TO authenticated;
GRANT SELECT ON quote_rate_limits TO authenticated;

-- Allow service role to do everything
GRANT ALL ON pricing_tiers TO service_role;
GRANT ALL ON domain_subscriptions TO service_role;
GRANT ALL ON domain_monthly_usage TO service_role;
GRANT ALL ON ai_quotes TO service_role;
GRANT ALL ON quote_rate_limits TO service_role;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

-- This migration creates:
-- ✅ 5 new tables (pricing_tiers, domain_subscriptions, domain_monthly_usage, ai_quotes, quote_rate_limits)
-- ✅ Seed data for 4 pricing tiers
-- ✅ 4 SQL functions (calculate_multi_domain_discount, increment_monthly_completions, update_domain_discounts, timestamp triggers)
-- ✅ 25+ indexes for optimal query performance
-- ✅ RLS policies for multi-tenant security
-- ✅ Table documentation with comments
-- ✅ Triggers for automatic discount updates and timestamp management
