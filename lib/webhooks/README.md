# Webhook System

**Purpose:** Secure webhook handlers for receiving order creation events from WooCommerce and Shopify, with automated purchase attribution to chat conversations.

**Last Updated:** 2025-01-09
**Status:** Active

## Overview

This directory contains webhook verification, parsing, and handling logic for e-commerce platforms. When an order is created, the platform sends a webhook to our endpoint, which verifies the signature, parses the order data, and attributes the purchase to a conversation if possible.

## Architecture

```
webhooks/
├── woocommerce-verifier.ts       # HMAC-SHA256 signature verification
├── woocommerce-order-parser.ts   # Order data extraction
├── shopify-verifier.ts           # Shopify HMAC verification
├── shopify-order-parser.ts       # Shopify order parsing
└── README.md                      # This file
```

## Webhook Endpoints

### WooCommerce
**Endpoint:** `POST /api/webhooks/woocommerce/order-created`

**Setup in WooCommerce:**
1. Go to WooCommerce → Settings → Advanced → Webhooks
2. Create new webhook:
   - Topic: `Order created`
   - Delivery URL: `https://yourdomain.com/api/webhooks/woocommerce/order-created`
   - Secret: (generate strong secret)
   - API Version: `WP REST API v3`

**Headers:**
- `X-WC-Webhook-Signature`: HMAC-SHA256 signature
- `X-WC-Webhook-Topic`: `order.created`
- `X-WC-Webhook-Source`: WooCommerce store URL

**Configuration:**
Store webhook secret in `customer_configs.encrypted_credentials`:
```json
{
  "woocommerce_webhook_secret": "your-secret-here"
}
```

### Shopify
**Endpoint:** `POST /api/webhooks/shopify/order-created`

**Setup in Shopify:**
1. Go to Settings → Notifications → Webhooks
2. Create webhook:
   - Event: `Order creation`
   - Format: `JSON`
   - URL: `https://yourdomain.com/api/webhooks/shopify/order-created`
   - API version: Latest

**Headers:**
- `X-Shopify-Hmac-SHA256`: HMAC signature
- `X-Shopify-Shop-Domain`: Shop domain
- `X-Shopify-Topic`: `orders/create`

**Configuration:**
Uses `shopify_access_token` from `customer_configs` as webhook secret.

## Security

### Signature Verification

**WooCommerce:**
```typescript
import { verifyWooCommerceWebhook } from '@/lib/webhooks/woocommerce-verifier';

const isValid = verifyWooCommerceWebhook(
  rawPayload,
  signature,
  webhookSecret
);
```

**Shopify:**
```typescript
import { verifyShopifyWebhook } from '@/lib/webhooks/shopify-verifier';

const isValid = verifyShopifyWebhook(
  rawPayload,
  hmacHeader,
  webhookSecret
);
```

### Constant-Time Comparison

Both verifiers use `crypto.timingSafeEqual()` to prevent timing attacks.

### Error Handling

- **Invalid signature** → 401 Unauthorized
- **Missing required fields** → 400 Bad Request
- **Attribution failure** → 200 OK (logged, but prevents webhook retry)

## Order Parsing

### WooCommerce

```typescript
import { parseWooCommerceOrder, shouldTrackWooCommerceOrder } from '@/lib/webhooks/woocommerce-order-parser';

// Validate order should be tracked
if (!shouldTrackWooCommerceOrder(payload)) {
  return { status: 'ignored' };
}

// Parse order data
const orderData = parseWooCommerceOrder(payload);
// Returns: { orderId, orderNumber, customerEmail, total, currency, lineItems, orderCreatedAt, metadata }
```

**Filters:**
- ❌ Skips orders with status `pending`, `failed`, `cancelled`, `refunded`
- ❌ Skips $0 orders
- ❌ Skips test emails (`test@`, `admin@`, `noreply@`)

### Shopify

```typescript
import { parseShopifyOrder, shouldTrackShopifyOrder } from '@/lib/webhooks/shopify-order-parser';

// Validate
if (!shouldTrackShopifyOrder(payload)) {
  return { status: 'ignored' };
}

// Parse
const orderData = parseShopifyOrder(payload);
```

**Filters:**
- ❌ Skips $0 orders
- ❌ Skips test emails

## Attribution Flow

1. **Webhook Received** → Verify signature
2. **Parse Order** → Extract customer email, order total, timestamp
3. **Attribution Logic** → Find matching conversation
   - Strategy 1: Session match (confidence: 0.95)
   - Strategy 2: Time proximity (confidence: 0.70-0.90)
   - Strategy 3: Email only (confidence: 0.50-0.65)
   - Strategy 4: No match (confidence: 0.0)
4. **Save Attribution** → Store in `purchase_attributions` table
5. **Update Customer Session** → Increment LTV, purchase count
6. **Return 200 OK** → Acknowledge receipt

See [lib/attribution/purchase-attributor.ts](../attribution/purchase-attributor.ts) for detailed attribution logic.

## Testing

### Testing WooCommerce Webhooks

```bash
# Use WooCommerce's webhook testing feature
# Or manually send a test webhook:

curl -X POST https://yourdomain.com/api/webhooks/woocommerce/order-created \
  -H "Content-Type: application/json" \
  -H "X-WC-Webhook-Signature: <calculated-signature>" \
  -H "X-WC-Webhook-Topic: order.created" \
  -H "X-WC-Webhook-Source: https://your-store.com" \
  -d @test-order.json
```

### Testing Shopify Webhooks

```bash
# Use Shopify CLI or send test webhook:

curl -X POST https://yourdomain.com/api/webhooks/shopify/order-created \
  -H "Content-Type: application/json" \
  -H "X-Shopify-Hmac-SHA256: <calculated-hmac>" \
  -H "X-Shopify-Shop-Domain: your-store.myshopify.com" \
  -H "X-Shopify-Topic: orders/create" \
  -d @test-order.json
```

### Signature Calculation

**WooCommerce (HMAC-SHA256 + Base64):**
```javascript
const crypto = require('crypto');
const signature = crypto
  .createHmac('sha256', secret)
  .update(rawPayload)
  .digest('base64');
```

**Shopify (HMAC-SHA256 + Base64):**
```javascript
const crypto = require('crypto');
const hmac = crypto
  .createHmac('sha256', secret)
  .update(rawPayload, 'utf8')
  .digest('base64');
```

## Monitoring

### Logs

All webhook activity is logged with:
- `[WooCommerce Webhook]` or `[Shopify Webhook]` prefix
- Order ID, customer email (masked)
- Attribution result (conversation ID, confidence, method)
- Any errors or warnings

### Metrics to Track

- **Webhook Success Rate**: % of webhooks processed successfully
- **Attribution Rate**: % of orders attributed to conversations
- **Average Confidence**: Mean attribution confidence score
- **Processing Time**: Time from webhook receipt to attribution

## Troubleshooting

**"Invalid signature" errors:**
- Verify webhook secret matches in both platforms
- Check that raw payload is used (not parsed JSON)
- Ensure correct encoding (UTF-8 for Shopify)

**"Domain not found" errors:**
- Verify `customer_configs` has matching domain
- For Shopify, verify `shopify_shop` field matches

**Attribution failures:**
- Check that customer email exists in conversations
- Verify time range isn't too restrictive
- Review attribution logic in [purchase-attributor.ts](../attribution/purchase-attributor.ts)

**Webhook retries:**
- Platforms retry failed webhooks (non-200 responses)
- Return 200 even for attribution failures to prevent retries
- Check platform's webhook delivery logs

## Related Files

**Attribution:**
- [lib/attribution/purchase-attributor.ts](../attribution/purchase-attributor.ts) - Main attribution logic
- [lib/attribution/attribution-db.ts](../attribution/attribution-db.ts) - Database operations

**Analytics:**
- [lib/analytics/revenue-analytics.ts](../analytics/revenue-analytics.ts) - Revenue metrics
- [app/api/analytics/revenue/route.ts](../../app/api/analytics/revenue/route.ts) - API endpoint

**Database:**
- [supabase/migrations/20250109000000_purchase_attribution_system.sql](../../supabase/migrations/20250109000000_purchase_attribution_system.sql) - Schema

## Best Practices

1. **Always verify signatures** - Never process unverified webhooks
2. **Log everything** - Webhook delivery issues are common, logs help debug
3. **Return 200 quickly** - Platforms have timeout limits (usually 5-10s)
4. **Handle duplicates** - Webhooks may be delivered multiple times
5. **Test thoroughly** - Use platform testing tools before going live
6. **Monitor closely** - Set up alerts for webhook failures

## Future Enhancements

- [ ] Support for Shopify Plus wholesale orders
- [ ] Support for subscription renewals
- [ ] Custom attribution rules per domain
- [ ] Webhook retry queue for failed attributions
- [ ] Real-time dashboard notifications for new orders
