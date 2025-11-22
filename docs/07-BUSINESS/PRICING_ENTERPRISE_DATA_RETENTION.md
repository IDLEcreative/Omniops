# Enterprise Data Retention Pricing

**Type:** Business
**Status:** Draft
**Last Updated:** 2025-11-22
**Owner:** Product & Sales Teams

## Purpose

Defines tiered data retention policies that enable enterprises to pay for extended data storage while keeping costs low for standard customers.

---

## 📊 Retention Tiers

**IMPORTANT:** Extended retention (>90 days) is an **Enterprise-exclusive feature**. This is a critical differentiator that justifies the premium £10,000/month pricing.

### **Small Business Tier** (£500/month - 2,500 conversations/month)

| Data Type | Retention | Storage Cost |
|-----------|-----------|--------------|
| Message Queue | 24 hours | Included |
| Conversations | 30 days | Included |
| Scrape Jobs (raw) | 7 days | Included |
| Scrape Stats (aggregated) | 90 days | Included |
| Analytics | 30 days | Included |

**Target:** Startups, growing businesses (5-15 employees, 20k-100k monthly visitors)

---

### **SME Tier** (£1,000/month - 5,000 conversations/month) ⭐ Most Popular

| Data Type | Retention | Storage Cost |
|-----------|-----------|--------------|
| Message Queue | 24 hours | Included |
| Conversations | 90 days | Included |
| Scrape Jobs (raw) | 30 days | Included |
| Scrape Stats (aggregated) | Forever | Included |
| Analytics | 90 days | Included |
| GDPR Export | On-demand | Included |

**Target:** Established businesses (15-50 employees, 100k-500k monthly visitors)

---

### **Mid-Market Tier** (£5,000/month - 25,000 conversations/month)

| Data Type | Retention | Storage Cost |
|-----------|-----------|--------------|
| Message Queue | 24 hours | Included |
| Conversations | 180 days (6 months) | Included |
| Scrape Jobs (raw) | 60 days (2 months) | Included |
| Scrape Stats (aggregated) | Forever | Included |
| Analytics | 180 days | Included |
| GDPR Export | Automated weekly | Included |

**Target:** Large operations (50-250 employees, 500k-2M monthly visitors)

---

### **Enterprise Tier** (£10,000/month - 100,000 conversations/month)

| Data Type | Retention | Notes |
|-----------|-----------|-------|
| Message Queue | 7 days | Included |
| Conversations | 365 days (1 year) | **Included** |
| Scrape Jobs (raw) | 180 days (6 months) | **Included** |
| Scrape Stats (aggregated) | Forever | **Included** |
| Analytics | 365 days | **Included** |
| GDPR Export | Automated daily | **Included** |
| **Extended Retention** | | **All Included in Base Price** |

**All Enterprise Features Included:**
- ✅ **365-day retention** across all data types (vs 90 days in Pro)
- ✅ Configurable retention per data type (up to 7 years)
- ✅ Automated data archival to customer's S3 bucket
- ✅ Point-in-time recovery (up to 30 days)
- ✅ Compliance reporting (SOC 2, HIPAA, GDPR)
- ✅ Dedicated database instance (optional upgrade)
- ✅ Priority support (2-hour SLA)
- ✅ Custom integration support
- ✅ White-label options

**Target:** Large enterprises, regulated industries, compliance-heavy customers

---

## 🎯 Why Extended Retention is Enterprise-Only

**Critical for Premium Pricing Justification:**

At **£10,000/month (£120,000/year)**, Enterprise customers expect enterprise-grade features. Extended retention is a key justification for this premium pricing.

**Strategic Positioning:**
1. **Clear Value Differentiation** - Enterprise gets 365-day retention vs 90 days in SME (4x longer)
2. **Justifies £120K/year Price Point** - Compliance features, audit trails, and data sovereignty are worth it
3. **Natural Upsell Path** - Mid-Market customers hitting 180-day limit must upgrade (£5k → £10k/month)
4. **Cost Protection** - Lower tiers stay profitable by limiting storage costs
5. **Enterprise Expectations** - Companies spending £120K/year expect unlimited retention options

**The £10K/month Conversation:**

When prospects question the £10,000/month price:

✅ **Response Script:**
> "Our Enterprise tier includes 365-day data retention, unlimited scraping history, and full compliance reporting. For comparison, hiring 15-30 customer service reps would cost £23,540/month. Plus, with Enterprise retention, you have complete audit trails for compliance (HIPAA, SOX, GDPR) which your regulators require. Most enterprises save their annual subscription cost in the first quarter from CS cost reduction alone."

**What Happens if Mid-Market Customers Ask for Longer Retention?**
- ✅ **Response:** "Extended retention beyond 180 days is an Enterprise-only feature. At £5,000/month, Mid-Market gets excellent value for 25,000 conversations. However, if you need audit trails beyond 6 months for compliance, Enterprise at £10,000/month includes 365-day retention, automated daily exports to your S3 bucket, and point-in-time recovery. Most regulated industries require this level of data governance. Would you like to discuss your compliance requirements?"
- ❌ **Never:** Offer extended retention as an addon to Mid-Market tier (undermines £10k/month Enterprise value)

**Enforcement:**
- Database cleanup runs daily based on subscription tier
- Small Business: Auto-deletes at 30 days (no exceptions)
- SME: Auto-deletes at 90 days (no exceptions)
- Mid-Market: Auto-deletes at 180 days (no exceptions)
- Enterprise: Configurable 365 days - 7 years (compliance requirement dependent)
- Downgrade protection: Full data export provided before tier change

---

## 💰 Pricing Rationale

### **Why Charge for Extended Retention?**

**Storage Costs (Supabase):**
- Base: $0.125/GB/month
- Backups: $0.021/GB/month
- Point-in-time recovery: +30% cost

**Example: Enterprise with 10K conversations/month:**

| Tier | Storage | Annual Cost | Margin |
|------|---------|-------------|--------|
| **Pro (90 days)** | 9 GB | $135/year | $588 profit |
| **Enterprise (365 days)** | 40 GB | $600/year | $960 profit |

**Calculation:**
- Enterprise pays +$960/year for extended retention
- Actual cost: $600/year storage
- **Profit margin: 60%** on retention addon

---

## 🔧 Technical Implementation

### **Configuration Schema**

```typescript
// In customer_configs table
{
  subscription_tier: 'free' | 'pro' | 'enterprise',
  retention_policies: {
    message_queue_hours: 24 | 168,        // 24h or 7 days
    conversations_days: 30 | 90 | 365,    // Tier-based
    scrape_jobs_days: 7 | 30 | 180,       // Tier-based
    analytics_days: 30 | 90 | 365,        // Tier-based

    // Enterprise-only features
    automated_export: boolean,
    export_destination: 's3://bucket-name',
    point_in_time_recovery: boolean,
  },

  // Billing
  retention_addon_price: 80,  // USD/month
  last_retention_change: '2025-11-22T00:00:00Z',
}
```

### **Cleanup Function Update**

```sql
-- Dynamic retention based on customer tier
CREATE OR REPLACE FUNCTION cleanup_customer_data(customer_uuid UUID)
RETURNS TABLE(
  conversations_deleted INTEGER,
  jobs_deleted INTEGER,
  messages_deleted INTEGER
) AS $$
DECLARE
  config JSONB;
  conv_retention INTEGER;
  job_retention INTEGER;
  msg_retention INTEGER;
BEGIN
  -- Load customer's retention policy
  SELECT retention_policies INTO config
  FROM customer_configs
  WHERE id = customer_uuid;

  -- Extract retention days (with defaults)
  conv_retention := COALESCE((config->>'conversations_days')::INTEGER, 90);
  job_retention := COALESCE((config->>'scrape_jobs_days')::INTEGER, 30);
  msg_retention := COALESCE((config->>'message_queue_hours')::INTEGER, 24);

  -- Delete conversations beyond retention
  DELETE FROM conversations
  WHERE customer_id = customer_uuid
    AND created_at < NOW() - (conv_retention || ' days')::INTERVAL;
  GET DIAGNOSTICS conversations_deleted = ROW_COUNT;

  -- Delete scrape jobs beyond retention
  DELETE FROM scrape_jobs
  WHERE customer_id = customer_uuid
    AND created_at < NOW() - (job_retention || ' days')::INTERVAL;
  GET DIAGNOSTICS jobs_deleted = ROW_COUNT;

  -- Delete message queue beyond retention
  DELETE FROM message_queue
  WHERE customer_id = customer_uuid
    AND created_at < NOW() - (msg_retention || ' hours')::INTERVAL;
  GET DIAGNOSTICS messages_deleted = ROW_COUNT;

  RETURN QUERY SELECT conversations_deleted, jobs_deleted, messages_deleted;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### **Cron Job Update**

```typescript
// app/api/cron/cleanup/route.ts
export async function GET(request: Request) {
  const supabase = await createServiceRoleClient();

  // Get all customers with their retention policies
  const { data: customers } = await supabase
    .from('customer_configs')
    .select('id, subscription_tier, retention_policies');

  const results = [];

  for (const customer of customers) {
    // Aggregate old data to monthly summary first
    await supabase.rpc('aggregate_scrape_jobs_to_monthly', {
      customer_uuid: customer.id
    });

    // Clean up based on customer's retention policy
    const { data } = await supabase.rpc('cleanup_customer_data', {
      customer_uuid: customer.id
    });

    results.push({
      customerId: customer.id,
      tier: customer.subscription_tier,
      ...data
    });
  }

  return Response.json({ success: true, results });
}
```

---

## 📈 Upsell Strategy

### **When to Offer Enterprise Retention**

**Trigger Points:**
1. Customer approaches 90-day retention limit
2. Customer requests historical data export
3. Customer asks about compliance features
4. Customer mentions "audit trail" or "compliance"
5. Customer is in regulated industry (healthcare, finance, government)

**Dashboard Prompt:**
```
⚠️ Your oldest conversations will be deleted in 7 days (90-day retention limit).

Upgrade to Enterprise for 365-day retention and full audit trail compliance.
[View Enterprise Features] [Contact Sales]
```

### **Email Campaign:**

**Subject:** Keep Your Data Longer with Enterprise Retention

**Body:**
```
Hi [Customer],

We noticed you're approaching your 90-day conversation retention limit.

With Omniops Enterprise, you get:
✅ 365-day conversation history (4x longer)
✅ 180-day scraping audit trail (6x longer)
✅ Automated GDPR exports to your S3 bucket
✅ Point-in-time recovery for compliance
✅ SOC 2 / HIPAA compliance reporting

All for just $80/month additional.

[Upgrade to Enterprise] [View Full Pricing]
```

---

## 🎯 Competitive Analysis

### **How We Compare**

| Provider | Base Retention | Enterprise Retention | Price |
|----------|---------------|---------------------|-------|
| **Omniops** | 90 days | 365 days | +$80/month |
| Intercom | 90 days | 365 days | +$150/month |
| Zendesk | 90 days | Unlimited | +$200/month |
| Drift | 30 days | 180 days | +$100/month |
| HubSpot | 90 days | 730 days (2 years) | +$180/month |

**Positioning:** Mid-tier pricing with strong value proposition.

---

## 📋 Sales Playbook

### **Handling Objections**

**Objection 1:** "Why should I pay for storage?"
- **Response:** "Storage costs money, and extended retention requires additional backups, compliance tooling, and infrastructure. We keep base pricing low by only charging customers who need extended history."

**Objection 2:** "Can I just export my data myself?"
- **Response:** "Yes! Pro tier includes manual export. Enterprise automates this daily to your own S3 bucket, plus adds point-in-time recovery for compliance requirements."

**Objection 3:** "What happens if I downgrade?"
- **Response:** "We'll export all your historical data to CSV/JSON before deletion. You keep your data, we just don't host it long-term anymore."

---

## 🛡️ Compliance Benefits

### **Why Enterprises Need Extended Retention**

**Regulatory Requirements:**
- **HIPAA:** 6 years for healthcare
- **GDPR:** "As long as necessary" (typically 1-7 years)
- **SOX:** 7 years for financial records
- **FDA 21 CFR Part 11:** Electronic records retention

**Omniops Enterprise Features:**
- ✅ Configurable retention up to 7 years (custom pricing)
- ✅ Immutable audit logs
- ✅ Automated compliance exports
- ✅ Point-in-time recovery
- ✅ Encrypted backups with key management

---

## 💼 Custom Enterprise Pricing

### **Beyond Standard Enterprise**

For customers needing >365 days retention:

| Retention Period | Monthly Addon | Use Case |
|-----------------|---------------|----------|
| **2 years** | +$150/month | Healthcare, finance |
| **5 years** | +$300/month | SOX compliance |
| **7 years** | +$450/month | FDA regulated |
| **Unlimited** | Custom | Government, legal |

**Implementation:** Same technical approach, just adjust retention days in config.

---

## ✅ Implementation Checklist

- [ ] Add `retention_policies` to `customer_configs` table
- [ ] Create `cleanup_customer_data()` function with dynamic retention
- [ ] Update cron job to respect per-customer policies
- [ ] Add upgrade prompt to dashboard when approaching limit
- [ ] Create Enterprise pricing page on website
- [ ] Enable Stripe billing for retention addon
- [ ] Add retention settings to admin dashboard
- [ ] Create email campaign for upsell
- [ ] Train sales team on objection handling
- [ ] Document compliance features for enterprise prospects

---

## 📞 Contact

**Questions about enterprise retention?**
- Sales: sales@omniops.com
- Support: support@omniops.com
- Documentation: [Enterprise Features Guide](../02-GUIDES/GUIDE_ENTERPRISE_FEATURES.md)

---

**Document Status:** Ready for implementation
**Estimated Revenue Impact:** +$50K-$150K ARR from retention upsells
**Implementation Time:** 2-3 days for full feature set
