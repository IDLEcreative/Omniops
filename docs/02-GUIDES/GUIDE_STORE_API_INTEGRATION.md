# WooCommerce Store API Integration

**Type:** Guide
**Status:** Active
**Last Updated:** 2025-10-29
**Verified For:** v0.1.0
**Dependencies:** [GUIDE_WOOCOMMERCE_CUSTOMIZATION.md](02-GUIDES/GUIDE_WOOCOMMERCE_CUSTOMIZATION.md)
**Estimated Read Time:** 15 minutes

## Purpose

This document explains the WooCommerce Store API integration, which enables **transactional cart operations** (direct cart manipulation) instead of informational URL-based approaches. It covers architecture, setup, usage, and troubleshooting.

## Quick Links

- [WooCommerce Customization Guide](02-GUIDES/GUIDE_WOOCOMMERCE_CUSTOMIZATION.md)
- [Database Schema Reference](07-REFERENCE/REFERENCE_DATABASE_SCHEMA.md)
- [API Endpoints Reference](03-API/REFERENCE_API_ENDPOINTS.md)

---

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Key Differences: REST API v3 vs Store API](#key-differences-rest-api-v3-vs-store-api)
- [Components](#components)
- [Setup Guide](#setup-guide)
- [Usage Examples](#usage-examples)
- [Session Management](#session-management)
- [Feature Flag Configuration](#feature-flag-configuration)
- [Migration Guide](#migration-guide)
- [Error Handling](#error-handling)
- [Troubleshooting](#troubleshooting)
- [Limitations](#limitations)
- [Security Considerations](#security-considerations)

---

## Overview

### What is Store API?

WooCommerce Store API is a **frontend-facing REST API** designed for customer interactions like cart management, checkout, and product browsing. It differs from the **REST API v3** (admin operations like managing products, orders, customers).

### Why Store API?

**Before (Informational Mode):**
- AI provides "add to cart" URLs
- Customer must click links manually
- No visibility into current cart state
- Cannot remove items or apply coupons programmatically

**After (Transactional Mode with Store API):**
- ✅ AI directly adds items to cart
- ✅ AI reads current cart contents
- ✅ AI removes items, updates quantities
- ✅ AI applies/removes coupons
- ✅ Real-time cart totals

### Feature Flag

Store API integration is **opt-in** via environment variable:

```bash
WOOCOMMERCE_STORE_API_ENABLED=true
```

When disabled (default), the system falls back to informational mode.

---

## Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                     Chat Interface                          │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│              cart-operations.ts (Mode Router)               │
│   ┌─────────────────────┬─────────────────────────────┐    │
│   │  Informational Mode │   Transactional Mode        │    │
│   │  (Legacy/Fallback)  │   (Store API)               │    │
│   └─────────────────────┴─────────────────────────────┘    │
└───────────────────────┬─────────────────────────────────────┘
                        │
        ┌───────────────┴──────────────┐
        ▼                              ▼
┌────────────────────┐      ┌────────────────────────────┐
│  WooCommerce       │      │  WooCommerce Store API     │
│  REST API v3       │      │  Client                    │
│  (Admin Ops)       │      │  (Cart Ops)                │
└────────────────────┘      └───────────┬────────────────┘
                                        │
                                        ▼
                            ┌────────────────────────┐
                            │  Cart Session Manager  │
                            │  (Redis-backed)        │
                            └────────────────────────┘
```

### Data Flow (Transactional Mode)

1. **User Request**: "Add product #123 to cart"
2. **Session Check**: CartSessionManager retrieves or creates session
3. **API Call**: WooCommerceStoreAPI.addItem(123, 1)
4. **Store API**: Adds item to session-based cart
5. **Response**: Cart contents with totals returned
6. **AI Response**: "✅ Added Product X. Cart total: $50"

---

## Key Differences: REST API v3 vs Store API

| Feature | REST API v3 | Store API |
|---------|-------------|-----------|
| **Purpose** | Admin operations | Customer operations |
| **Authentication** | OAuth 1.0a (consumer key/secret) | Session nonce |
| **Endpoints** | `/wp-json/wc/v3/*` | `/wp-json/wc/store/v1/*` |
| **Cart Support** | ❌ No | ✅ Yes |
| **Product Management** | ✅ Yes | ❌ No |
| **Order Management** | ✅ Yes | Limited (checkout only) |
| **Session Management** | Not needed | **Required** |
| **Use Case** | Backend admin tasks | Frontend customer actions |

**Key Insight:** You need **BOTH** APIs:
- REST API v3 for product/order/customer management
- Store API for cart operations

---

## Components

### 1. WooCommerceStoreAPI (`lib/woocommerce-store-api.ts`)

HTTP client for Store API endpoints.

**Key Methods:**
- `addItem(productId, quantity)` - Add to cart
- `getCart()` - Retrieve cart contents
- `removeItem(itemKey)` - Remove from cart
- `updateItem(itemKey, quantity)` - Update quantity
- `applyCoupon(code)` - Apply coupon
- `removeCoupon(code)` - Remove coupon

**Example:**
```typescript
const storeAPI = new WooCommerceStoreAPI({
  url: 'https://example.com',
  nonce: 'abc123...',
});

const result = await storeAPI.addItem(456, 2);
if (result.success) {
  console.log('Cart total:', result.data.totals.total_price);
}
```

### 2. CartSessionManager (`lib/cart-session-manager.ts`)

Redis-backed session storage for cart persistence.

**Key Methods:**
- `getSession(userId, domain)` - Get or create session
- `generateGuestId()` - Generate unique guest ID
- `clearSession(userId, domain)` - Clear session
- `hasSession(userId, domain)` - Check session existence

**Session Structure:**
```typescript
{
  userId: "guest_uuid",
  domain: "example.com",
  nonce: "abc123...",
  createdAt: "2025-10-29T10:00:00Z",
  expiresAt: "2025-10-30T10:00:00Z",
  isGuest: true
}
```

**Storage:**
- Key: `cart:session:{domain}:{userId}`
- TTL: 24 hours (auto-expires)

### 3. Cart Operations (`lib/chat/cart-operations.ts`)

Mode-aware cart operation router with automatic fallback.

**Public Functions:**
- `addToCart(wc, params)` - Auto-routes based on mode
- `getCart(wc, params)` - Auto-routes
- `removeFromCart(wc, params)` - Auto-routes
- `updateCartQuantity(wc, params)` - Auto-routes
- `applyCouponToCart(wc, params)` - Auto-routes

**Internal Functions:**
- `addToCartInformational()` - URL-based mode
- `addToCartDirect()` - Store API mode (via lazy import)

### 4. Dynamic Client Factory (`lib/woocommerce-dynamic.ts`)

Creates Store API clients with domain configuration.

**Key Functions:**
- `getDynamicStoreAPIClient(domain, userId?)` - Create client
- `isStoreAPIAvailable(domain)` - Check availability

---

## Setup Guide

### Prerequisites

1. ✅ WooCommerce installed on target site
2. ✅ WooCommerce Store API enabled (default in WooCommerce 4.0+)
3. ✅ Redis running for session storage
4. ✅ Domain configured in `customer_configs` table

### Step 1: Enable Feature Flag

Add to `.env.local`:

```bash
# Enable Store API transactional mode
WOOCOMMERCE_STORE_API_ENABLED=true
```

### Step 2: Verify Redis

Ensure Redis is running:

```bash
# Check Redis connection
redis-cli ping
# Should return: PONG
```

If using Docker:

```bash
docker-compose up -d redis
```

### Step 3: Configure Domain

Ensure WooCommerce URL is configured in database:

```sql
SELECT domain, woocommerce_url
FROM customer_configs
WHERE domain = 'your-domain.com';
```

Should return:
```
domain           | woocommerce_url
-----------------+-------------------------
your-domain.com  | https://your-store.com
```

### Step 4: Test Store API Availability

Run integration tests:

```bash
# Set test environment variables
export TEST_WOOCOMMERCE_DOMAIN=your-domain.com
export TEST_WOOCOMMERCE_URL=https://your-store.com
export TEST_PRODUCT_ID=123

# Run tests
npx tsx test-store-api-integration.ts
```

Expected output:
```
✅ Session creation
✅ Store API client creation
✅ Add to cart (informational)
...
📊 Test Summary: 12/12 passed
```

### Step 5: Verify Feature Flag

Check that transactional mode is active:

```typescript
// In Node.js environment
console.log(process.env.WOOCOMMERCE_STORE_API_ENABLED);
// Should output: "true"
```

---

## Usage Examples

### Example 1: Add Product to Cart

```typescript
import { getDynamicStoreAPIClient } from '@/lib/woocommerce-dynamic';
import { addToCart } from '@/lib/chat/cart-operations';

// Get Store API client
const storeAPI = await getDynamicStoreAPIClient('example.com', 'user_123');

// Add item
const result = await addToCart(null, {
  productId: '456',
  quantity: 2,
  storeAPI: storeAPI,
  domain: 'example.com',
});

console.log(result.message);
// Output: "✅ Added to Cart\nProduct: Amazing Product\nQuantity: 2..."
```

### Example 2: View Cart

```typescript
import { getCart } from '@/lib/chat/cart-operations';

const result = await getCart(null, {
  storeAPI: storeAPI,
  domain: 'example.com',
});

if (result.success) {
  console.log('Cart items:', result.data.items.length);
  console.log('Total:', result.data.total);
}
```

### Example 3: Apply Coupon

```typescript
import { applyCouponToCart } from '@/lib/chat/cart-operations';

const result = await applyCouponToCart(null, {
  couponCode: 'SAVE20',
  storeAPI: storeAPI,
  domain: 'example.com',
});

if (result.success) {
  console.log('Discount applied:', result.data.appliedCoupons);
}
```

### Example 4: Fallback to Informational Mode

If Store API is unavailable or disabled:

```typescript
// WOOCOMMERCE_STORE_API_ENABLED=false
const result = await addToCart(wc, {
  productId: '456',
  quantity: 2,
  domain: 'example.com',
});

console.log(result.message);
// Output: "🛒 Ready to Add to Cart\n...\nTo add this to your cart, please click here:\nhttps://example.com/?add-to-cart=456&quantity=2"
```

---

## Session Management

### Session Lifecycle

1. **Creation**: First cart operation for user
2. **Nonce Generation**: Unique token for Store API auth
3. **Storage**: Redis with 24-hour TTL
4. **Refresh**: TTL extended on each access
5. **Expiration**: Auto-cleanup after 24 hours

### Guest vs Authenticated Users

**Guest Users:**
- ID format: `guest_{uuid}`
- Generated automatically
- Session tied to device/browser
- No authentication required

**Authenticated Users:**
- ID format: User's unique identifier
- Linked to WooCommerce customer account
- Session persists across devices
- Can merge with existing cart

### Session Sharing

**Problem:** Sessions are device-specific (stored in Redis, not browser cookies).

**Solution:**
- For authenticated users: Use consistent user ID
- For guests: Generate persistent ID (store in browser localStorage)

**Implementation:**
```typescript
// Browser-side (pseudo-code)
let userId = localStorage.getItem('cart_user_id');
if (!userId) {
  userId = await fetch('/api/cart/session').then(r => r.json());
  localStorage.setItem('cart_user_id', userId);
}
```

---

## Feature Flag Configuration

### Environment Variable

```bash
# .env.local
WOOCOMMERCE_STORE_API_ENABLED=true
```

### Runtime Behavior

| Flag Value | Mode | Behavior |
|------------|------|----------|
| `true` | Transactional | Uses Store API if available, falls back to informational |
| `false` (default) | Informational | Always uses URL-based approach |
| Unset | Informational | Defaults to URL-based approach |

### Per-Domain Configuration (Future)

Currently, the feature flag is global. Future enhancement could support per-domain:

```typescript
// Proposed future implementation
const config = await getCustomerConfig(domain);
const useStoreAPI = config.features?.store_api_enabled ?? false;
```

---

## Migration Guide

### From Informational to Transactional

**Step 1: Enable Feature Flag**

```bash
# .env.local
WOOCOMMERCE_STORE_API_ENABLED=true
```

**Step 2: Test with Single Domain**

Start with one test domain:

```bash
# Test single domain
export TEST_DOMAIN=test.example.com
npx tsx test-store-api-integration.ts
```

**Step 3: Monitor for Errors**

Check application logs for Store API errors:

```bash
# Check logs
docker-compose logs -f app | grep "Store API"
```

**Step 4: Gradual Rollout**

If supporting per-domain flags (future):
1. Enable for 10% of domains
2. Monitor error rates
3. Increase to 50%, then 100%

**Step 5: Verify Fallback**

Test that informational mode still works:

```bash
# Temporarily disable
export WOOCOMMERCE_STORE_API_ENABLED=false
npm run dev
# Test cart operations - should provide URLs
```

### Rollback Plan

If issues arise:

1. **Immediate:** Set `WOOCOMMERCE_STORE_API_ENABLED=false`
2. **Restart:** Restart application to load new env
3. **Verify:** Test cart operations work in informational mode
4. **Investigate:** Check logs for root cause

---

## Error Handling

### Common Errors

#### 1. `woocommerce_rest_cannot_add`

**Cause:** Product out of stock or not purchasable
**Handling:** Returns error message to user
**User Message:** "Product X is currently out of stock"

#### 2. `woocommerce_rest_cart_item_not_found`

**Cause:** Invalid cart item key (item already removed)
**Handling:** Graceful failure, fetch fresh cart
**User Message:** "Item not found in cart. Cart refreshed."

#### 3. `woocommerce_rest_invalid_coupon`

**Cause:** Coupon code invalid, expired, or usage limit reached
**Handling:** Returns validation error
**User Message:** "Coupon 'XYZ' is not valid"

#### 4. `network_error`

**Cause:** Cannot reach WooCommerce server
**Handling:** Falls back to informational mode
**User Message:** (Provides "add to cart" URL instead)

### Error Handling Strategy

```typescript
const result = await storeAPI.addItem(productId, quantity);

if (!result.success) {
  if (result.error?.code === 'network_error') {
    // Fallback to informational mode
    return await addToCartInformational(wc, params);
  } else {
    // Return user-friendly error
    return {
      success: false,
      message: result.error?.message || 'Failed to add item',
    };
  }
}
```

---

## Troubleshooting

### Issue: Store API Not Available

**Symptoms:**
- Tests fail with "Store API available: false"
- Cart operations return 404 errors

**Solutions:**
1. **Check WooCommerce Version**
   - Requires WooCommerce 4.0+ (Store API introduced)
   - Update if necessary: WP Admin → Plugins → Update

2. **Verify Store API Enabled**
   - Store API is enabled by default
   - If disabled: WP Admin → WooCommerce → Settings → Advanced → REST API

3. **Check Permalink Settings**
   - Store API requires pretty permalinks
   - WP Admin → Settings → Permalinks → Select any option except "Plain"

4. **Test Directly**
   ```bash
   curl https://your-store.com/wp-json/wc/store/v1/cart
   ```
   Should return cart JSON (empty cart is valid).

### Issue: Session Not Persisting

**Symptoms:**
- Cart empties after each operation
- Session nonce changes unexpectedly

**Solutions:**
1. **Check Redis Connection**
   ```bash
   redis-cli ping
   # Should return: PONG
   ```

2. **Verify Redis Keys**
   ```bash
   redis-cli KEYS "cart:session:*"
   # Should show session keys
   ```

3. **Check TTL**
   ```bash
   redis-cli TTL "cart:session:example.com:user_123"
   # Should return seconds remaining (max 86400)
   ```

4. **Restart Redis**
   ```bash
   docker-compose restart redis
   ```

### Issue: CORS Errors

**Symptoms:**
- Browser console shows CORS errors
- Store API requests blocked

**Solutions:**
1. **Add CORS Headers (WordPress)**

   Add to `functions.php` or plugin:
   ```php
   add_filter('rest_pre_serve_request', function($served, $result, $request) {
       header('Access-Control-Allow-Origin: *');
       header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE');
       header('Access-Control-Allow-Headers: Content-Type, Nonce');
       return $served;
   }, 10, 3);
   ```

2. **Use Proxy**

   Configure Next.js proxy in `next.config.js`:
   ```javascript
   async rewrites() {
     return [
       {
         source: '/store-api/:path*',
         destination: 'https://your-store.com/wp-json/wc/store/v1/:path*',
       },
     ];
   }
   ```

### Issue: Feature Flag Not Working

**Symptoms:**
- `WOOCOMMERCE_STORE_API_ENABLED=true` but still uses informational mode

**Solutions:**
1. **Verify Environment**
   ```typescript
   console.log(process.env.WOOCOMMERCE_STORE_API_ENABLED);
   // Should output: "true" (string, not boolean)
   ```

2. **Restart Application**
   ```bash
   # Environment changes require restart
   npm run dev
   # Or for Docker:
   docker-compose restart app
   ```

3. **Check `.env.local` Location**
   - Must be in project root
   - Check file exists: `ls -la .env.local`

4. **Check for Typos**
   - Exact match required: `WOOCOMMERCE_STORE_API_ENABLED`
   - Case-sensitive

---

## Limitations

### Current Limitations

1. **No Checkout Operations**
   - Store API cart operations only
   - Checkout must be completed on WooCommerce site
   - Future: Add Store API checkout endpoints

2. **No Cross-Device Session Sync**
   - Sessions are server-side (Redis)
   - Not tied to browser cookies
   - Future: Add session token to frontend

3. **No Batch Operations**
   - Each cart operation is separate API call
   - Future: Add batch endpoint for multiple items

4. **No Product Recommendations**
   - Store API doesn't provide related products
   - Must use REST API v3 for product data

5. **No Payment Gateway Integration**
   - Cannot process payments via Store API
   - Future: Integrate with payment gateways

### Workarounds

**Limitation 1 (Checkout):**
- Provide checkout URL after cart operations
- Example: "Your cart is ready. Proceed to checkout: https://example.com/checkout"

**Limitation 2 (Cross-Device):**
- For authenticated users: Use consistent user ID
- For guests: Store session ID in browser localStorage

**Limitation 3 (Batch):**
- Loop through items and call API sequentially
- Add delay between calls to avoid rate limits

---

## Security Considerations

### Session Nonce Security

- **Generation:** Cryptographically random (crypto.randomUUID)
- **Storage:** Encrypted in Redis
- **Transmission:** HTTPS only
- **Expiration:** 24-hour TTL, auto-cleanup

### Cross-Site Request Forgery (CSRF)

**Protection:**
- Nonce required for all Store API requests
- Nonce tied to session, validated by WooCommerce
- Cannot be reused across sessions

### Data Privacy

**Session Data:**
- Contains: userId, domain, nonce, timestamps
- Does NOT contain: cart contents (stored by WooCommerce)
- GDPR compliance: Sessions auto-expire, no PII stored

**Cart Data:**
- Stored by WooCommerce (not our system)
- Subject to WooCommerce privacy policies
- Can be cleared via WooCommerce cart cleanup

### Rate Limiting

**Recommended:**
- Add rate limiting per session
- Prevent abuse: Max 60 requests/minute per session
- Implementation: Use existing rate limit system

**Example:**
```typescript
const rateLimited = await checkRateLimit(`cart_session:${userId}`, 60, 60);
if (!rateLimited) {
  return { success: false, message: 'Rate limit exceeded' };
}
```

---

## Testing

### Run Integration Tests

```bash
# Set test environment
export TEST_WOOCOMMERCE_DOMAIN=test.example.com
export TEST_WOOCOMMERCE_URL=https://test.example.com
export TEST_PRODUCT_ID=123

# Run tests
npx tsx test-store-api-integration.ts
```

### Expected Test Results

```
🧪 WooCommerce Store API Integration Tests

📦 Session Manager Tests:
✅ Session creation
✅ Guest session creation
✅ Session persistence
✅ Session clearance

🔌 Store API Client Tests:
✅ Store API client creation
✅ Store API availability check
✅ Dynamic client creation

🛒 Cart Operations Tests (Fallback Mode):
✅ Add to cart (informational)
✅ Get cart (informational)
✅ Remove from cart (informational)
✅ Apply coupon (informational)

⚠️ Error Handling Tests:
✅ Invalid product ID
✅ Invalid coupon code

📊 Test Summary:
Total: 12
✅ Passed: 12
❌ Failed: 0
Success Rate: 100.0%
```

---

## Additional Resources

### Official Documentation

- [WooCommerce Store API Docs](https://github.com/woocommerce/woocommerce/tree/trunk/plugins/woocommerce/src/StoreApi/docs)
- [WooCommerce REST API v3 Docs](https://woocommerce.github.io/woocommerce-rest-api-docs/)
- [WooCommerce Cart Endpoints](https://github.com/woocommerce/woocommerce/blob/trunk/plugins/woocommerce/src/StoreApi/docs/cart.md)

### Internal Documentation

- [WooCommerce Customization Guide](02-GUIDES/GUIDE_WOOCOMMERCE_CUSTOMIZATION.md)
- [Database Schema Reference](07-REFERENCE/REFERENCE_DATABASE_SCHEMA.md)
- [API Endpoints Reference](03-API/REFERENCE_API_ENDPOINTS.md)

### Code References

- `lib/woocommerce-store-api.ts` - Store API client
- `lib/cart-session-manager.ts` - Session management
- `lib/chat/cart-operations.ts` - Cart operations router
- `lib/chat/cart-operations-transactional.ts` - Transactional implementations
- `test-store-api-integration.ts` - Integration tests

---

## Support

For issues or questions:

1. **Check Troubleshooting Section** - Common issues covered above
2. **Run Integration Tests** - Verify system health
3. **Check Logs** - Look for Store API errors
4. **GitHub Issues** - Report bugs with reproduction steps

---

**Last Updated:** 2025-10-29
**Version:** 1.0.0
**Status:** Active
