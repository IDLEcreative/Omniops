-- Add New 4-Tier UNLIMITED Pricing Structure
-- Unlimited conversations per domain
-- More aggressive multi-domain discounts (up to 50% off)
-- 14-day free trial support
-- Date: 2025-11-03

-- ========================================
-- 1. CREATE PRICING TIERS TABLE
-- ========================================

CREATE TABLE IF NOT EXISTS pricing_tiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE, -- 'small_business', 'sme', 'mid_market', 'enterprise'
  display_name TEXT NOT NULL, -- 'Small Business', 'SME', 'Mid-Market', 'Enterprise'
  monthly_price DECIMAL(10,2) NOT NULL, -- In GBP (£)
  target_visitors_min INTEGER,
  target_visitors_max INTEGER,
  description TEXT,
  features JSONB DEFAULT '[]'::jsonb,
  is_popular BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  trial_days INTEGER DEFAULT 14,
  stripe_product_id TEXT,
  stripe_price_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_pricing_tiers_active ON pricing_tiers(is_active) WHERE is_active = true;
CREATE INDEX idx_pricing_tiers_stripe ON pricing_tiers(stripe_price_id);

-- ========================================
-- 2. INSERT DEFAULT PRICING TIERS
-- ========================================

INSERT INTO pricing_tiers (
  name,
  display_name,
  monthly_price,
  target_visitors_min,
  target_visitors_max,
  description,
  is_popular,
  trial_days,
  stripe_product_id,
  stripe_price_id,
  features
) VALUES
  -- Tier 1: Small Business - £500/month
  (
    'small_business',
    'Small Business',
    500.00,
    20000,
    100000,
    'Perfect for growing online shops and local businesses',
    false,
    14,
    'prod_TMC9piTJUJFcsT',
    'price_1SPTlBCcOAlIBdYPd0zaVVan',
    '[
      "Unlimited conversations",
      "Unlimited team seats",
      "Unlimited website scraping",
      "WooCommerce & Shopify integration",
      "86% AI accuracy",
      "Email support",
      "14-day free trial"
    ]'::jsonb
  ),
  -- Tier 2: SME - £1,000/month (Most Popular)
  (
    'sme',
    'SME',
    1000.00,
    100000,
    500000,
    'Established e-commerce brands and B2B businesses',
    true,
    14,
    'prod_TMC96oQ7oMN7oz',
    'price_1SPTlCCcOAlIBdYP9WYXc1kz',
    '[
      "Everything in Small Business",
      "Unlimited conversations",
      "Priority support",
      "Advanced analytics",
      "Custom AI training",
      "Multi-language support"
    ]'::jsonb
  ),
  -- Tier 3: Mid-Market - £5,000/month
  (
    'mid_market',
    'Mid-Market',
    5000.00,
    500000,
    2000000,
    'Large e-commerce operations and enterprise retailers',
    false,
    14,
    'prod_TMC9Cva4CBgOux',
    'price_1SPTlDCcOAlIBdYPfg0vCgJY',
    '[
      "Everything in SME",
      "Unlimited conversations",
      "Dedicated account manager",
      "Custom integrations",
      "API access",
      "SLA guarantee",
      "Quarterly business reviews"
    ]'::jsonb
  ),
  -- Tier 4: Enterprise - £10,000/month
  (
    'enterprise',
    'Enterprise',
    10000.00,
    2000000,
    NULL, -- No upper limit
    'Enterprise-level support with dedicated account management',
    false,
    14,
    'prod_TMC9vrF7K8jutf',
    'price_1SPTlDCcOAlIBdYPY4m98bkT',
    '[
      "Everything in Mid-Market",
      "Unlimited everything",
      "White-label options",
      "Custom SLA",
      "Dedicated infrastructure",
      "24/7 phone support",
      "Custom contract terms"
    ]'::jsonb
  )
ON CONFLICT (name) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  monthly_price = EXCLUDED.monthly_price,
  description = EXCLUDED.description,
  features = EXCLUDED.features,
  trial_days = EXCLUDED.trial_days,
  stripe_product_id = EXCLUDED.stripe_product_id,
  stripe_price_id = EXCLUDED.stripe_price_id,
  updated_at = NOW();

-- ========================================
-- 3. CREATE DOMAIN SUBSCRIPTIONS TABLE
-- ========================================

CREATE TABLE IF NOT EXISTS domain_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  domain_id UUID REFERENCES customer_configs(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  pricing_tier_id UUID REFERENCES pricing_tiers(id),
  stripe_subscription_id TEXT UNIQUE,
  stripe_subscription_item_id TEXT UNIQUE,
  status TEXT NOT NULL DEFAULT 'trialing', -- 'active', 'trialing', 'canceled', 'past_due', 'incomplete'
  trial_start TIMESTAMPTZ,
  trial_end TIMESTAMPTZ,
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT false,
  multi_domain_discount DECIMAL(5,2) DEFAULT 0.00, -- e.g., 0.50 = 50% off
  effective_monthly_price DECIMAL(10,2), -- After discount
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(domain_id)
);

CREATE INDEX idx_domain_subscriptions_org ON domain_subscriptions(organization_id);
CREATE INDEX idx_domain_subscriptions_status ON domain_subscriptions(status);
CREATE INDEX idx_domain_subscriptions_stripe ON domain_subscriptions(stripe_subscription_id);
CREATE INDEX idx_domain_subscriptions_tier ON domain_subscriptions(pricing_tier_id);
CREATE INDEX idx_domain_subscriptions_trial ON domain_subscriptions(trial_end) WHERE status = 'trialing';

-- ========================================
-- 4. MULTI-DOMAIN DISCOUNT FUNCTION
-- More aggressive discounts (up to 50% off)
-- ========================================

CREATE OR REPLACE FUNCTION calculate_multi_domain_discount(
  p_organization_id UUID
)
RETURNS DECIMAL(5,2)
LANGUAGE plpgsql
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
    AND status IN ('active', 'trialing');

  -- AGGRESSIVE multi-domain discounts
  v_discount := CASE
    WHEN v_domain_count = 1 THEN 0.00   -- No discount
    WHEN v_domain_count = 2 THEN 0.15   -- 15% off (was 10%)
    WHEN v_domain_count = 3 THEN 0.25   -- 25% off (was 15%)
    WHEN v_domain_count = 4 THEN 0.35   -- 35% off (was 20%)
    WHEN v_domain_count = 5 THEN 0.45   -- 45% off (was 25%)
    WHEN v_domain_count >= 6 THEN 0.50  -- 50% off (was 30-35%)
    ELSE 0.00
  END;

  RETURN v_discount;
END;
$$;

-- ========================================
-- 5. AUTO-UPDATE DISCOUNT TRIGGER
-- ========================================

CREATE OR REPLACE FUNCTION update_domain_discounts()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_org_id UUID;
  v_discount DECIMAL(5,2);
BEGIN
  -- Get organization ID from the changed row
  v_org_id := COALESCE(NEW.organization_id, OLD.organization_id);

  -- Calculate new discount
  v_discount := calculate_multi_domain_discount(v_org_id);

  -- Update all active/trialing subscriptions for this organization
  UPDATE domain_subscriptions ds
  SET
    multi_domain_discount = v_discount,
    effective_monthly_price = pt.monthly_price * (1 - v_discount),
    updated_at = NOW()
  FROM pricing_tiers pt
  WHERE ds.organization_id = v_org_id
    AND ds.pricing_tier_id = pt.id
    AND ds.status IN ('active', 'trialing');

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_update_discounts_after_subscription_change ON domain_subscriptions;

CREATE TRIGGER trg_update_discounts_after_subscription_change
AFTER INSERT OR UPDATE OR DELETE ON domain_subscriptions
FOR EACH ROW
EXECUTE FUNCTION update_domain_discounts();

-- ========================================
-- 6. HELPER FUNCTION: Get Recommended Tier
-- ========================================

CREATE OR REPLACE FUNCTION get_recommended_pricing_tier(
  p_monthly_visitors INTEGER
)
RETURNS UUID
LANGUAGE plpgsql
AS $$
DECLARE
  v_tier_id UUID;
BEGIN
  SELECT id
  INTO v_tier_id
  FROM pricing_tiers
  WHERE is_active = true
    AND (
      (target_visitors_min IS NULL OR p_monthly_visitors >= target_visitors_min)
      AND (target_visitors_max IS NULL OR p_monthly_visitors <= target_visitors_max)
    )
  ORDER BY monthly_price ASC
  LIMIT 1;

  -- If no tier matches, return the smallest tier
  IF v_tier_id IS NULL THEN
    SELECT id
    INTO v_tier_id
    FROM pricing_tiers
    WHERE is_active = true
    ORDER BY monthly_price ASC
    LIMIT 1;
  END IF;

  RETURN v_tier_id;
END;
$$;

-- ========================================
-- 7. HELPER FUNCTION: Get Discount Preview
-- ========================================

CREATE OR REPLACE FUNCTION preview_multi_domain_discount(
  p_current_domains INTEGER,
  p_tier_price DECIMAL(10,2)
)
RETURNS TABLE(
  domains INTEGER,
  discount_pct INTEGER,
  price_per_domain DECIMAL(10,2),
  total_price DECIMAL(10,2),
  total_savings DECIMAL(10,2)
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    p_current_domains + 1 as domains,
    CASE
      WHEN p_current_domains + 1 = 2 THEN 15
      WHEN p_current_domains + 1 = 3 THEN 25
      WHEN p_current_domains + 1 = 4 THEN 35
      WHEN p_current_domains + 1 = 5 THEN 45
      WHEN p_current_domains + 1 >= 6 THEN 50
      ELSE 0
    END as discount_pct,
    (p_tier_price * (1 - CASE
      WHEN p_current_domains + 1 = 2 THEN 0.15
      WHEN p_current_domains + 1 = 3 THEN 0.25
      WHEN p_current_domains + 1 = 4 THEN 0.35
      WHEN p_current_domains + 1 = 5 THEN 0.45
      WHEN p_current_domains + 1 >= 6 THEN 0.50
      ELSE 0.00
    END))::DECIMAL(10,2) as price_per_domain,
    ((p_current_domains + 1) * p_tier_price * (1 - CASE
      WHEN p_current_domains + 1 = 2 THEN 0.15
      WHEN p_current_domains + 1 = 3 THEN 0.25
      WHEN p_current_domains + 1 = 4 THEN 0.35
      WHEN p_current_domains + 1 = 5 THEN 0.45
      WHEN p_current_domains + 1 >= 6 THEN 0.50
      ELSE 0.00
    END))::DECIMAL(10,2) as total_price,
    ((p_current_domains + 1) * p_tier_price - (p_current_domains + 1) * p_tier_price * (1 - CASE
      WHEN p_current_domains + 1 = 2 THEN 0.15
      WHEN p_current_domains + 1 = 3 THEN 0.25
      WHEN p_current_domains + 1 = 4 THEN 0.35
      WHEN p_current_domains + 1 = 5 THEN 0.45
      WHEN p_current_domains + 1 >= 6 THEN 0.50
      ELSE 0.00
    END))::DECIMAL(10,2) as total_savings;
END;
$$;

-- ========================================
-- 8. ROW LEVEL SECURITY (RLS)
-- ========================================

-- Enable RLS on new tables
ALTER TABLE pricing_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE domain_subscriptions ENABLE ROW LEVEL SECURITY;

-- Pricing tiers are public (read-only)
CREATE POLICY "Anyone can view pricing tiers"
  ON pricing_tiers
  FOR SELECT
  USING (is_active = true);

-- Domain subscriptions: Users can only access their organization's subscriptions
CREATE POLICY "Users can view their organization's subscriptions"
  ON domain_subscriptions
  FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id
      FROM organization_members
      WHERE user_id = auth.uid()
    )
  );

-- ========================================
-- 9. GRANTS
-- ========================================

-- Grant necessary permissions to authenticated users
GRANT SELECT ON pricing_tiers TO authenticated;
GRANT SELECT ON domain_subscriptions TO authenticated;

-- Grant execute permissions for functions
GRANT EXECUTE ON FUNCTION calculate_multi_domain_discount TO authenticated;
GRANT EXECUTE ON FUNCTION get_recommended_pricing_tier TO authenticated;
GRANT EXECUTE ON FUNCTION preview_multi_domain_discount TO authenticated;

-- ========================================
-- MIGRATION COMPLETE
-- ========================================

COMMENT ON TABLE pricing_tiers IS 'Defines the 4-tier UNLIMITED pricing structure - no conversation limits';
COMMENT ON TABLE domain_subscriptions IS 'Per-domain subscription tracking with aggressive multi-domain discounts (up to 50% off)';
COMMENT ON FUNCTION calculate_multi_domain_discount IS 'Calculates discount: 1=0%, 2=15%, 3=25%, 4=35%, 5=45%, 6+=50%';
COMMENT ON FUNCTION get_recommended_pricing_tier IS 'Returns recommended tier based on monthly visitor count';
COMMENT ON FUNCTION preview_multi_domain_discount IS 'Shows pricing preview for adding another domain with discounts';
