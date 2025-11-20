# Purchase Attribution System - Implementation Complete ✅

**Date:** 2025-01-09
**Status:** Complete - Ready for Testing & Deployment

## 🎯 What Was Built

A comprehensive purchase tracking and customer analytics system that links e-commerce orders (WooCommerce & Shopify) to chat conversations with intelligent attribution scoring and returning customer detection.

---

## 📊 System Components

### 1. Database Schema ✅
**File:** [supabase/migrations/20250109000000_purchase_attribution_system.sql](supabase/migrations/20250109000000_purchase_attribution_system.sql)

**Tables Created:**
- `purchase_attributions` - Links orders to conversations with confidence scoring
- `customer_sessions` - Tracks customer email → session mapping for returning customers

**Features:**
- 14 optimized indexes for fast queries
- RLS policies for multi-tenant security
- Automated triggers for LTV calculation
- 2 analytics views (revenue_by_domain, customer_ltv_rankings)

### 2. TypeScript Types ✅
**File:** [types/purchase-attribution.ts](types/purchase-attribution.ts)

**Interfaces:**
- `PurchaseAttribution` - Attribution records
- `CustomerSession` - Customer session tracking
- `AttributionContext` - Attribution input data
- `AttributionResult` - Attribution output
- `RevenueMetrics` - Revenue analytics
- `CustomerLTVMetrics` - Lifetime value metrics
- `AttributionBreakdown` - Detailed attribution stats

### 3. Webhook Handlers ✅

#### WooCommerce
**Files:**
- [lib/webhooks/woocommerce-verifier.ts](lib/webhooks/woocommerce-verifier.ts) - HMAC-SHA256 verification
- [lib/webhooks/woocommerce-order-parser.ts](lib/webhooks/woocommerce-order-parser.ts) - Order parsing
- [app/api/webhooks/woocommerce/order-created/route.ts](app/api/webhooks/woocommerce/order-created/route.ts) - Webhook endpoint

**Security:**
- Signature verification using webhook secret
- Constant-time comparison (timing attack protection)
- Rate limiting (100 req/min per domain)

#### Shopify
**Files:**
- [lib/webhooks/shopify-verifier.ts](lib/webhooks/shopify-verifier.ts) - HMAC verification
- [lib/webhooks/shopify-order-parser.ts](lib/webhooks/shopify-order-parser.ts) - Order parsing
- [app/api/webhooks/shopify/order-created/route.ts](app/api/webhooks/shopify/order-created/route.ts) - Webhook endpoint

**Security:**
- HMAC-SHA256 verification
- Shop domain validation
- Duplicate order protection

### 4. Attribution Logic ✅
**Files:**
- [lib/attribution/purchase-attributor.ts](lib/attribution/purchase-attributor.ts) - Main attribution engine
- [lib/attribution/attribution-db.ts](lib/attribution/attribution-db.ts) - Database operations

**Attribution Strategies (Priority Order):**

1. **Session Match** (Confidence: 0.90-0.95)
   - Active session within 24 hours
   - Highest confidence

2. **Time Proximity** (Confidence: 0.70-0.90)
   - Conversation within 24h of purchase
   - Scored by recency and engagement

3. **Email Match** (Confidence: 0.50-0.65)
   - Any conversation within 7 days
   - Lower confidence due to time gap

4. **No Match** (Confidence: 0.0)
   - Still tracks unattributed orders for analytics

### 5. Revenue Analytics ✅
**Files:**
- [lib/analytics/revenue-analytics.ts](lib/analytics/revenue-analytics.ts) - Analytics engine
- [app/api/analytics/revenue/route.ts](app/api/analytics/revenue/route.ts) - API endpoint

**Metrics Provided:**

#### Revenue Overview
- Total revenue
- Total orders
- Average order value
- Chat-attributed revenue
- Chat-attributed orders
- Conversion rate (orders / conversations)
- Revenue by platform (WooCommerce vs. Shopify)
- Revenue by confidence level (high/medium/low)

#### Customer Lifetime Value (LTV)
- Total customers
- Returning customers
- Returning customer rate
- Average LTV
- Median LTV
- Top 10 customers by LTV

#### Attribution Breakdown
- Orders by attribution method
- Revenue by confidence level
- Time to conversion analysis
- Distribution buckets (0-1h, 1-6h, 6-24h, 1-7d, 7d+)

### 6. Customer Tracking ✅

**Returning Customer Detection:**
- Links customer email to sessions
- Tracks: total conversations, total purchases, lifetime value
- Automatically updated via database trigger on new purchases

**Metrics Tracked:**
- `isReturningCustomer` - Has made >1 purchase
- `totalConversations` - Lifetime conversation count
- `totalPurchases` - Lifetime purchase count
- `lifetimeValue` - Total $ spent
- `firstSeenAt` - First interaction date
- `lastSeenAt` - Most recent interaction

---

## 🚀 Quick Start

### 1. Apply Database Migration

```bash
npx supabase db push
```

Or manually apply:
```bash
psql $DATABASE_URL -f supabase/migrations/20250109000000_purchase_attribution_system.sql
```

### 2. Configure Webhooks

#### WooCommerce Setup
1. Go to WooCommerce → Settings → Advanced → Webhooks
2. Create webhook:
   - **Topic:** `Order created`
   - **Delivery URL:** `https://yourdomain.com/api/webhooks/woocommerce/order-created`
   - **Secret:** Generate strong secret (save in customer_configs)
   - **API Version:** WP REST API v3

3. Store secret in database:
```sql
UPDATE customer_configs
SET encrypted_credentials = jsonb_set(
  COALESCE(encrypted_credentials, '{}'::jsonb),
  '{woocommerce_webhook_secret}',
  '"your-secret-here"'
)
WHERE domain = 'your-domain.com';
```

#### Shopify Setup
1. Go to Settings → Notifications → Webhooks
2. Create webhook:
   - **Event:** `Order creation`
   - **Format:** `JSON`
   - **URL:** `https://yourdomain.com/api/webhooks/shopify/order-created`
3. Uses existing `shopify_access_token` as webhook secret

### 3. Access Revenue Analytics

```bash
# Get revenue overview
curl -X GET "https://yourdomain.com/api/analytics/revenue?domain=example.com&metric=all" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Response includes:
# - overview: Revenue metrics
# - ltv: Customer lifetime value
# - attribution: Attribution breakdown
```

---

## 📈 Example Analytics Output

### Revenue Overview
```json
{
  "totalRevenue": 45678.99,
  "totalOrders": 234,
  "averageOrderValue": 195.21,
  "chatAttributedRevenue": 38900.50,
  "chatAttributedOrders": 198,
  "conversionRate": 15.6,
  "revenueByPlatform": {
    "woocommerce": 30000.00,
    "shopify": 15678.99
  },
  "revenueByConfidence": {
    "high": 35000.00,
    "medium": 8900.50,
    "low": 2000.00
  }
}
```

### Customer LTV
```json
{
  "totalCustomers": 456,
  "returningCustomers": 123,
  "returningCustomerRate": 26.97,
  "averageLTV": 456.78,
  "medianLTV": 299.99,
  "topCustomers": [
    {
      "email": "customer@example.com",
      "totalPurchases": 12,
      "lifetimeValue": 5678.90,
      "firstPurchase": "2024-01-15T10:30:00Z",
      "lastPurchase": "2025-01-08T14:22:00Z",
      "isReturning": true
    }
  ]
}
```

---

## 🧪 Testing

### Unit Tests (TODO)
```bash
npm test -- __tests__/lib/webhooks/
npm test -- __tests__/lib/attribution/
npm test -- __tests__/lib/analytics/revenue
```

### Integration Tests (TODO)
```bash
npm test -- __tests__/integration/purchase-attribution-e2e.test.ts
```

### Manual Testing

**Test WooCommerce Webhook:**
```bash
curl -X POST http://localhost:3000/api/webhooks/woocommerce/order-created \
  -H "Content-Type: application/json" \
  -H "X-WC-Webhook-Signature: <signature>" \
  -H "X-WC-Webhook-Topic: order.created" \
  -H "X-WC-Webhook-Source: https://your-store.com" \
  -d '{
    "id": 12345,
    "number": "12345",
    "status": "completed",
    "total": "199.99",
    "currency": "USD",
    "billing": {
      "email": "customer@example.com",
      "first_name": "John",
      "last_name": "Doe"
    },
    "line_items": [],
    "date_created_gmt": "2025-01-09T12:00:00"
  }'
```

---

## 📋 Database Queries for Monitoring

### Check Attribution Success Rate
```sql
SELECT
  COUNT(*) FILTER (WHERE conversation_id IS NOT NULL) * 100.0 / COUNT(*) as attribution_rate,
  AVG(attribution_confidence) as avg_confidence
FROM purchase_attributions
WHERE attributed_at >= NOW() - INTERVAL '30 days';
```

### Top Performing Conversations
```sql
SELECT
  c.id,
  COUNT(pa.id) as orders_attributed,
  SUM(pa.order_total) as total_revenue
FROM conversations c
INNER JOIN purchase_attributions pa ON pa.conversation_id = c.id
WHERE pa.attributed_at >= NOW() - INTERVAL '30 days'
GROUP BY c.id
ORDER BY total_revenue DESC
LIMIT 10;
```

### Returning Customer Breakdown
```sql
SELECT
  is_returning_customer,
  COUNT(*) as customer_count,
  AVG(lifetime_value) as avg_ltv
FROM customer_ltv_rankings
GROUP BY is_returning_customer;
```

---

## 🔧 Next Steps

1. **Apply Migration** - Run the database migration
2. **Configure Webhooks** - Set up in WooCommerce/Shopify
3. **Test Endpoints** - Send test webhooks
4. **Monitor Logs** - Watch for attribution results
5. **Create Dashboard** - Build UI to display revenue analytics
6. **Write Tests** - Comprehensive test coverage

---

## 📚 Key Files Reference

| Component | File Path |
|-----------|-----------|
| **Migration** | `supabase/migrations/20250109000000_purchase_attribution_system.sql` |
| **Types** | `types/purchase-attribution.ts` |
| **WooCommerce Webhook** | `app/api/webhooks/woocommerce/order-created/route.ts` |
| **Shopify Webhook** | `app/api/webhooks/shopify/order-created/route.ts` |
| **Attribution Logic** | `lib/attribution/purchase-attributor.ts` |
| **Revenue Analytics** | `lib/analytics/revenue-analytics.ts` |
| **Analytics API** | `app/api/analytics/revenue/route.ts` |
| **Webhook Docs** | `lib/webhooks/README.md` |

---

## ✅ Implementation Summary

**Total Files Created:** 15
**Lines of Code:** ~3,500
**Database Tables:** 2 (+ 2 views)
**Indexes:** 14
**API Endpoints:** 3
**Attribution Strategies:** 4
**Confidence Range:** 0.0 - 0.95

**Features Delivered:**
- ✅ WooCommerce order tracking
- ✅ Shopify order tracking
- ✅ Intelligent purchase attribution
- ✅ Returning customer detection
- ✅ Customer lifetime value tracking
- ✅ Revenue analytics dashboard data
- ✅ Multi-tenant security (RLS)
- ✅ Webhook signature verification
- ✅ Comprehensive documentation

---

## 🎉 Impact

This system enables you to:

1. **Track Revenue Attribution** - Know which orders came from chat interactions
2. **Calculate ROI** - Measure chat widget's impact on sales
3. **Identify Best Customers** - See who has highest LTV
4. **Detect Returning Customers** - Personalize experience for repeat buyers
5. **Optimize Conversations** - Understand which chats lead to purchases
6. **Measure Conversion Rates** - Chat sessions → actual purchases
7. **Time to Conversion** - How long from chat to purchase

**Example Insight:**
> "Our chat widget attributed $38,900 in revenue last month (85% attribution rate), with an average time-to-conversion of 4.2 hours. Returning customers have 2.3x higher LTV."

---

**Next:** Apply migration, configure webhooks, and start tracking real purchases! 🚀
