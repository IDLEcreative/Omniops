# Pricing Model Architecture

**Type:** Architecture
**Status:** Active
**Last Updated:** 2025-11-03
**Verified For:** v0.2.0

## Purpose
Defines the complete pricing strategy, tier structure, and business model for Omniops. This document establishes value-based pricing that aligns with customer success and scales revenue with actual usage.

## Quick Links
- [AI Quote System](ARCHITECTURE_AI_QUOTE_SYSTEM.md)
- [Pricing Page Content](../09-REFERENCE/REFERENCE_PRICING_PAGE_CONTENT.md)
- [Multi-Domain Discounts](#multi-domain-discount-structure)

---

## Table of Contents
- [Core Pricing Philosophy](#core-pricing-philosophy)
- [Four-Tier Structure](#four-tier-structure)
- [Pricing Justification](#pricing-justification)
- [Multi-Domain Discounts](#multi-domain-discount-structure)
- [Overage Billing](#overage-billing)
- [Database Schema](#database-schema)
- [Migration from Old Model](#migration-from-old-model)

---

## Core Pricing Philosophy

### Value-Based Pricing (Not Cost-Based)

**Key Principle:** Price based on **customer service team replacement value**, not AI token costs.

**The Math:**
```
Average UK Customer Service Rep:
├─ Base salary: £25,000/year = £2,083/month
├─ Overhead (40%): +£833/month
├─ Training/turnover (15%): +£438/month
└─ Total cost per rep: £3,354/month

Average capacity: 1,000 conversations/month per rep

AI Solution Cost:
├─ GPT-4 tokens: ~£0.015/conversation
├─ Infrastructure: ~£0.005/conversation
└─ Total cost: ~£0.02/conversation

For 2,500 conversations/month:
├─ Customer pays: £500
├─ Cost to us: £50 (10% COGS)
└─ Margin: 90% 💚
```

### Why This Works

**Customer Perspective:**
- Replaces expensive CS team
- 70-85% cost savings
- ROI: 3x to 7x
- Unlimited usage = no anxiety
- Scales with their success

**Our Perspective:**
- High margins (50-90%)
- Predictable revenue
- Scales infinitely (AI doesn't get tired)
- Fair overage pricing captures growth
- Multi-domain discounts encourage expansion

---

## Four-Tier Structure

### Tier 1: Small Business - £500/month

**Target Customer:**
- Growing online shops
- Local businesses with e-commerce
- Service businesses with high inquiries
- 5-15 employees
- £500k-£2M annual revenue
- 20k-100k monthly website visitors

**Included:**
- 2,500 completed conversations/month
- Unlimited seats & team members
- Unlimited website scraping
- Unlimited features
- WooCommerce & Shopify integration
- Email support

**Overage:** £0.12 per additional conversation

**Replaces:** 1 part-time CS rep (£1,677/month)
**Savings:** £1,177/month (70%)
**ROI:** 3.4x

**Self-Selection Signals:**
```typescript
{
  trafficSignal: 'medium',        // 20k-100k visitors/month
  employeeSignal: 'small',        // 5-15 people
  revenueSignal: 'small',         // £500k-£2M/year
  contentSignal: 'moderate'       // 100-1,000 pages
}
```

---

### Tier 2: SME - £1,000/month

**Target Customer:**
- Established e-commerce brands
- B2B with active support needs
- Multi-location businesses
- Growing marketplaces
- 15-50 employees
- £2M-£10M annual revenue
- 100k-500k monthly visitors

**Included:**
- 5,000 completed conversations/month
- All Small Business features
- Priority support
- Advanced analytics

**Overage:** £0.10 per additional conversation

**Replaces:** 1.5-2 full-time CS reps (£6,708/month)
**Savings:** £5,708/month (85%)
**ROI:** 6.7x

**Self-Selection Signals:**
```typescript
{
  trafficSignal: 'high',          // 100k-500k visitors/month
  employeeSignal: 'medium',       // 15-50 people
  revenueSignal: 'medium',        // £2M-£10M/year
  contentSignal: 'extensive'      // 1k-10k pages
}
```

---

### Tier 3: Mid-Market - £5,000/month

**Target Customer:**
- Large e-commerce operations
- Multi-brand retailers
- B2B industrial suppliers
- Regional market leaders
- 50-250 employees
- £10M-£50M annual revenue
- 500k-2M monthly visitors

**Included:**
- 25,000 completed conversations/month
- All SME features
- Dedicated account manager
- Custom integrations support
- SLA guarantees

**Overage:** £0.08 per additional conversation

**Replaces:** 5-10 full-time CS reps (£16,770/month)
**Savings:** £11,770/month (70%)
**ROI:** 3.4x

**Self-Selection Signals:**
```typescript
{
  trafficSignal: 'very_high',     // 500k-2M visitors/month
  employeeSignal: 'large',        // 50-250 people
  revenueSignal: 'large',         // £10M-£50M/year
  contentSignal: 'massive'        // 10k+ pages
}
```

---

### Tier 4: Enterprise - £10,000/month

**Target Customer:**
- Enterprise e-commerce
- Multi-national brands
- Franchise systems
- Major marketplaces
- 250+ employees
- £50M+ annual revenue
- 2M+ monthly visitors

**Included:**
- 100,000 completed conversations/month
- All Mid-Market features
- White-label capability
- On-premise deployment option
- Custom AI model training
- 24/7 dedicated support

**Overage:** £0.05 per additional conversation

**Replaces:** 15-30 full-time CS reps (£33,540/month)
**Savings:** £23,540/month (70%)
**ROI:** 3.4x

**Self-Selection Signals:**
```typescript
{
  trafficSignal: 'very_high',     // 2M+ visitors/month
  employeeSignal: 'enterprise',   // 250+ people
  revenueSignal: 'enterprise',    // £50M+/year
  contentSignal: 'massive'        // 10k+ pages
}
```

---

## Pricing Justification

### Competitive Analysis

**vs. Traditional CS Team:**
| Solution | Small | SME | Mid-Market | Enterprise |
|----------|-------|-----|------------|------------|
| Human CS Team | £3,354 | £6,708 | £16,770 | £33,540 |
| Omniops | £500 | £1,000 | £5,000 | £10,000 |
| **Savings** | **85%** | **85%** | **70%** | **70%** |

**vs. Other AI Chat Solutions:**
| Solution | Price Range | Limitations |
|----------|-------------|-------------|
| Intercom | £79-£999/month | + Need CS team (£3k+ each) |
| Drift | £2,500+/month | Limited automation |
| Zendesk AI | £89-£215/seat/month | Per-seat pricing |
| **Omniops** | **£500-£10k/month** | **Unlimited seats, fully autonomous** |

### Value Delivery Matrix

| Tier | Conversations | Value Delivered | Customer Revenue | % of Revenue |
|------|---------------|-----------------|------------------|--------------|
| Small Business | 2,500 | £8,385 CS saved | ~£1M/year | 0.05% |
| SME | 5,000 | £16,770 CS saved | ~£5M/year | 0.02% |
| Mid-Market | 25,000 | £41,925 CS saved | ~£25M/year | 0.02% |
| Enterprise | 100,000 | £83,850 CS saved | ~£100M/year | 0.01% |

**Key Insight:** Our pricing is 0.01-0.05% of customer revenue while delivering 70-85% cost savings. This is **massive ROI** for customers.

---

## Multi-Domain Discount Structure

### Scaling Discounts (Encourage Growth)

| Domains | Discount | Small (£500) | SME (£1k) | Mid (£5k) | Enterprise (£10k) |
|---------|----------|--------------|-----------|-----------|-------------------|
| 1 | 0% | £500 | £1,000 | £5,000 | £10,000 |
| 2 | 10% | £450 each | £900 each | £4,500 each | £9,000 each |
| 3 | 15% | £425 each | £850 each | £4,250 each | £8,500 each |
| 4 | 20% | £400 each | £800 each | £4,000 each | £8,000 each |
| 5 | 25% | £375 each | £750 each | £3,750 each | £7,500 each |
| 6-10 | 30% | £350 each | £700 each | £3,500 each | £7,000 each |
| 11+ | 35% | £325 each | £650 each | £3,250 each | £6,500 each |

### Why Multi-Domain Discounts?

**Business Justification:**
1. **Marginal cost is low** - Each additional domain costs us ~£50-100/month
2. **Encourages expansion** - Customers add more domains = more revenue
3. **Locks in customers** - More domains = higher switching cost
4. **Attracts agencies** - Perfect for managing multiple clients
5. **Predictable scaling** - We know exactly how revenue scales

### Real-World Example: Agency Use Case

```
Agency with 5 client domains:

Client 1: Small Business tier (£500) → £375 with discount
Client 2: SME tier (£1,000) → £750 with discount
Client 3: Small Business tier (£500) → £375 with discount
Client 4: Mid-Market tier (£5,000) → £3,750 with discount
Client 5: SME tier (£1,000) → £750 with discount

Total: £6,000/month
Without discount: £8,000/month
Discount value: £2,000/month saved

Agency revenue model:
├─ Charges each client: ~£1,500-£8,000/month
├─ Total revenue: ~£15,000/month
├─ Pays Omniops: £6,000/month
└─ Agency profit: £9,000/month

Win-win-win scenario ✅
```

---

## Overage Billing

### Soft Limits (Never Block)

**Philosophy:** Never interrupt customer service. Charge fairly for overage instead.

**Overage Rates:**
- Small Business: £0.12/conversation over 2,500
- SME: £0.10/conversation over 5,000
- Mid-Market: £0.08/conversation over 25,000
- Enterprise: £0.05/conversation over 100,000

**Rate Design:**
- Higher tiers get lower overage rates (volume discount)
- Still maintains 50-80% margins
- Encourages upgrade to higher tier if consistently over

### Overage Warning System

**Thresholds:**
```typescript
// First warning at 90% of limit
if (usage >= limit * 0.9) {
  sendEmail('Approaching limit', '90% of included conversations used');
}

// Second warning at 100% (entering overage)
if (usage >= limit) {
  sendEmail('Now in overage', 'Additional conversations will cost £X each');
}

// Third warning at 150%
if (usage >= limit * 1.5) {
  sendEmail('Consider upgrading', '50% over limit, upgrade saves money');
}
```

### Upgrade Incentive Calculation

```typescript
// Example: SME tier customer consistently using 8,000 conversations
Current plan: £1,000 + (3,000 × £0.10) = £1,300/month
Upgrade to Mid-Market: £5,000/month (includes 25,000)

Recommendation: Stay on current plan with overage (£1,300 < £5,000)

// But if using 12,000 conversations:
Current: £1,000 + (7,000 × £0.10) = £1,700/month
Upgrade: £5,000/month still not worth it

// At 25,000 conversations:
Current: £1,000 + (20,000 × £0.10) = £3,000/month
Upgrade: £5,000/month - Suggest staying on SME

// The system naturally encourages tier switches at the right time
```

---

## Database Schema

### Pricing Tiers Table

```sql
CREATE TABLE pricing_tiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tier_name TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  monthly_price DECIMAL(10,2) NOT NULL,
  included_completions INTEGER NOT NULL,
  overage_rate DECIMAL(10,4) NOT NULL,
  features JSONB NOT NULL,
  target_traffic_min INTEGER,
  target_traffic_max INTEGER,
  target_employees_min INTEGER,
  target_employees_max INTEGER,
  target_revenue_min BIGINT,
  target_revenue_max BIGINT,
  sort_order INTEGER NOT NULL,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert tiers
INSERT INTO pricing_tiers (tier_name, display_name, monthly_price, included_completions, overage_rate, features, target_traffic_min, target_traffic_max, sort_order) VALUES
('small_business', 'Small Business', 500.00, 2500, 0.12,
  '{"unlimited_seats": true, "unlimited_scraping": true, "woocommerce": true, "shopify": true, "email_support": true}'::jsonb,
  20000, 100000, 1),
('sme', 'SME', 1000.00, 5000, 0.10,
  '{"unlimited_seats": true, "unlimited_scraping": true, "woocommerce": true, "shopify": true, "priority_support": true, "advanced_analytics": true}'::jsonb,
  100000, 500000, 2),
('mid_market', 'Mid-Market', 5000.00, 25000, 0.08,
  '{"unlimited_seats": true, "unlimited_scraping": true, "woocommerce": true, "shopify": true, "account_manager": true, "sla": true, "custom_integrations": true}'::jsonb,
  500000, 2000000, 3),
('enterprise', 'Enterprise', 10000.00, 100000, 0.05,
  '{"unlimited_seats": true, "unlimited_scraping": true, "woocommerce": true, "shopify": true, "white_label": true, "on_premise": true, "dedicated_support": true, "custom_ai": true}'::jsonb,
  2000000, NULL, 4);
```

### Domain Subscriptions Table

```sql
CREATE TABLE domain_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  domain_id UUID REFERENCES domains(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  pricing_tier_id UUID REFERENCES pricing_tiers(id),
  stripe_subscription_id TEXT UNIQUE,
  stripe_subscription_item_id TEXT UNIQUE,
  status TEXT NOT NULL, -- 'active', 'canceled', 'past_due', 'trialing'
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT false,
  multi_domain_discount DECIMAL(5,2) DEFAULT 0.00, -- e.g., 0.25 = 25% off
  effective_monthly_price DECIMAL(10,2), -- After discount
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(domain_id)
);

CREATE INDEX idx_domain_subscriptions_org ON domain_subscriptions(organization_id);
CREATE INDEX idx_domain_subscriptions_status ON domain_subscriptions(status);
CREATE INDEX idx_domain_subscriptions_stripe ON domain_subscriptions(stripe_subscription_id);
```

### Monthly Usage Tracking

```sql
CREATE TABLE domain_monthly_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  domain_id UUID REFERENCES domains(id) ON DELETE CASCADE,
  month DATE NOT NULL, -- '2025-11-01'
  completed_conversations INTEGER DEFAULT 0,
  included_limit INTEGER NOT NULL,
  overage_count INTEGER GENERATED ALWAYS AS (
    GREATEST(0, completed_conversations - included_limit)
  ) STORED,
  base_charge DECIMAL(10,2) NOT NULL,
  overage_rate DECIMAL(10,4) NOT NULL,
  overage_charge DECIMAL(10,2) GENERATED ALWAYS AS (
    GREATEST(0, completed_conversations - included_limit) * overage_rate
  ) STORED,
  total_charge DECIMAL(10,2) GENERATED ALWAYS AS (
    base_charge + (GREATEST(0, completed_conversations - included_limit) * overage_rate)
  ) STORED,
  last_warning_sent_at TIMESTAMPTZ,
  warning_level INTEGER DEFAULT 0, -- 0, 1 (90%), 2 (100%), 3 (150%)

  UNIQUE(domain_id, month)
);

CREATE INDEX idx_monthly_usage_billing ON domain_monthly_usage(domain_id, month DESC);
CREATE INDEX idx_monthly_usage_overage ON domain_monthly_usage(domain_id) WHERE overage_count > 0;
```

### Multi-Domain Discount Calculation

```sql
-- Function to calculate discount based on domain count
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
    AND status = 'active';

  -- Calculate discount
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

-- Trigger to update discount when domains change
CREATE OR REPLACE FUNCTION update_domain_discounts()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_org_id UUID;
  v_discount DECIMAL(5,2);
  v_tier_price DECIMAL(10,2);
BEGIN
  -- Get organization ID
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

CREATE TRIGGER trg_update_discounts_after_subscription_change
AFTER INSERT OR UPDATE OR DELETE ON domain_subscriptions
FOR EACH ROW
EXECUTE FUNCTION update_domain_discounts();
```

---

## Migration from Old Model

### Current State (As of 2025-11-03)

**Old Model:**
- Organization-level subscriptions
- Mixed pricing (£29-£99/month)
- No per-domain billing
- No completion tracking

### Migration Strategy

**Phase 1: Add New Schema (Non-Breaking)**
```sql
-- Create all new tables
-- Add pricing_tiers
-- Add domain_subscriptions
-- Add domain_monthly_usage
-- Keep old organizations.stripe_subscription_id for now
```

**Phase 2: Data Migration**
```typescript
// Migrate existing customers
async function migrateExistingCustomers() {
  const orgs = await supabase
    .from('organizations')
    .select('*, domains(*)')
    .not('stripe_subscription_id', 'is', null);

  for (const org of orgs) {
    // Determine tier based on current plan
    const tier = mapOldPlanToNewTier(org.plan_type);

    // For first domain: migrate existing subscription
    const primaryDomain = org.domains[0];
    await createDomainSubscription({
      domainId: primaryDomain.id,
      organizationId: org.id,
      tier,
      stripeSubscriptionId: org.stripe_subscription_id,
      isLegacyMigration: true
    });

    // For additional domains: offer 50% discount loyalty pricing
    for (const domain of org.domains.slice(1)) {
      await createDomainSubscription({
        domainId: domain.id,
        organizationId: org.id,
        tier,
        discount: 0.50, // 50% off for existing customers
        createStripeSubscription: true
      });
    }

    // Send migration email
    await sendMigrationNotification(org);
  }
}

function mapOldPlanToNewTier(oldPlan: string): string {
  const mapping = {
    'starter': 'small_business',
    'professional': 'sme',
    'enterprise': 'mid_market'
  };
  return mapping[oldPlan] || 'small_business';
}
```

**Phase 3: Gradual Rollout**
1. Week 1: New signups use new model
2. Week 2-3: Migrate 10% of existing customers (beta group)
3. Week 4-5: Migrate remaining 90%
4. Week 6: Remove old schema

**Phase 4: Cleanup**
```sql
-- After all migrations complete
ALTER TABLE organizations DROP COLUMN stripe_subscription_id;
ALTER TABLE organizations DROP COLUMN plan_type;
ALTER TABLE organizations DROP COLUMN subscription_status;
```

---

## Key Metrics to Track

### Revenue Metrics
- MRR (Monthly Recurring Revenue)
- ARR (Annual Recurring Revenue)
- ARPA (Average Revenue Per Account)
- ARPD (Average Revenue Per Domain)
- Multi-domain adoption rate

### Usage Metrics
- Average conversations per domain per month
- Overage rate (% of domains exceeding limit)
- Average overage amount
- Upgrade rate (tier changes)

### Customer Success Metrics
- Estimated CS cost savings per customer
- ROI delivered per tier
- NPS by tier
- Churn rate by tier

### Pricing Optimization Metrics
- Discount redemption rate
- Multi-domain expansion rate
- Tier distribution (% in each tier)
- Price elasticity (conversions by tier)

---

## Future Considerations

### Dynamic Pricing (Phase 2)

Consider implementing:
- Seasonal discounts (Black Friday, etc.)
- Industry-specific pricing
- Geographic pricing (UK vs US vs EU)
- Annual commitment discounts (15% off)
- Referral bonuses

### Usage-Based Add-Ons

Potential add-ons:
- Visual AI Shopping: +50% of base price
- Advanced Analytics: +£200/month
- Custom AI Training: +£500/month
- White-label: +£1,000/month
- Dedicated Support: +£500/month

### Enterprise Customization

For £10k+ customers, consider:
- Custom contract terms
- Volume discounts beyond 35%
- Custom SLAs
- On-premise pricing models
- Revenue share agreements

---

## Approval & Sign-Off

**Business Model:** Value-based per-domain pricing
**Pricing Range:** £500-£10,000/month per domain
**Discount Structure:** 10-35% for multiple domains
**Target Margin:** 50-90% depending on tier and usage

**Approved By:** [Pending]
**Date:** 2025-11-03

---

## Related Documentation

- [AI Quote System Architecture](ARCHITECTURE_AI_QUOTE_SYSTEM.md)
- [Pricing Page Content](../09-REFERENCE/REFERENCE_PRICING_PAGE_CONTENT.md)
- [Stripe Integration](../06-INTEGRATIONS/INTEGRATION_STRIPE_BILLING.md)
- [Database Schema](../09-REFERENCE/REFERENCE_DATABASE_SCHEMA.md)
