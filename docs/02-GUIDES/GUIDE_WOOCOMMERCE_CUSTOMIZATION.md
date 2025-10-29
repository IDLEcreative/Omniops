# WooCommerce Chat Integration - Customization Guide

**Last Updated:** 2025-10-29
**Status:** ✅ Fully Functional

## Overview

The WooCommerce chat integration is fully operational and ready to use. This guide covers customization options and advanced features.

## Current Status

### ✅ What's Working

1. **Chat Integration** - Fully functional
   - Product search via natural language
   - Order lookup by order number
   - Stock checking
   - Price queries
   - Multi-platform support (WooCommerce + Shopify)

2. **Configuration** - Dual mode support
   - ✅ Environment variables (active)
   - ✅ Database per-domain (configured)

3. **API Connection** - Verified working
   - Store: Thompson's E-Parts (https://www.thompsonseparts.co.uk)
   - WooCommerce Version: 9.6.2
   - All 4 API tests passing

---

## Configuration Methods

### Method 1: Environment Variables (Current)

**Location:** `.env` and `.env.local`

```bash
WOOCOMMERCE_URL=https://www.thompsonseparts.co.uk
WOOCOMMERCE_CONSUMER_KEY=ck_2cc926d1df85a367ef1393fb4b5a1281c37e7f72
WOOCOMMERCE_CONSUMER_SECRET=cs_a99f3ae0f55d74982e3f2071caf65e7abbe1df79
```

**Pros:**
- ✅ Simple to configure
- ✅ Works immediately
- ✅ Good for single-store deployments

**Cons:**
- ❌ Same credentials for all domains
- ❌ Requires app restart to update

### Method 2: Database Configuration (Recommended for Production)

**Location:** `customer_configs` table in Supabase

**Current Status:** Thompson's is in database but with old credentials

**To Update Database Credentials:**

```typescript
// update-thompson-credentials.ts
import { createServiceRoleClient } from './lib/supabase-server';
import { encryptWooCommerceConfig } from './lib/encryption';

async function updateCredentials() {
  const supabase = await createServiceRoleClient();

  const encryptedConfig = encryptWooCommerceConfig({
    enabled: true,
    url: 'https://www.thompsonseparts.co.uk',
    consumer_key: 'ck_2cc926d1df85a367ef1393fb4b5a1281c37e7f72',
    consumer_secret: 'cs_a99f3ae0f55d74982e3f2071caf65e7abbe1df79'
  });

  const { error } = await supabase
    .from('customer_configs')
    .update({
      woocommerce_url: encryptedConfig.url,
      woocommerce_consumer_key: encryptedConfig.consumer_key,
      woocommerce_consumer_secret: encryptedConfig.consumer_secret
    })
    .eq('domain', 'thompsonseparts.co.uk');

  if (error) {
    console.error('Update failed:', error);
  } else {
    console.log('✅ Credentials updated successfully!');
  }
}

updateCredentials();
```

**Pros:**
- ✅ Different store per domain (true multi-tenant)
- ✅ Credentials encrypted at rest
- ✅ No app restart needed
- ✅ Credentials cached for 60 seconds

**Cons:**
- ⚠️ Slightly more complex setup

---

## Adding Custom WooCommerce Operations

The system uses a modular provider pattern. Here's how to add custom operations:

### Step 1: Define Operation Type

**File:** `lib/chat/woocommerce-tool-types.ts`

```typescript
// Add to the enum
export const WOOCOMMERCE_TOOL = {
  type: "function" as const,
  function: {
    name: "woocommerce_operations",
    parameters: {
      type: "object",
      properties: {
        operation: {
          type: "string",
          enum: [
            "check_stock",
            "get_product_details",
            "check_order",
            "get_shipping_info",
            "check_price",
            "check_shipping_cost",  // NEW OPERATION
          ],
        },
        // Add new parameters if needed
        shippingPostcode: {
          type: "string",
          description: "Postcode for shipping calculation"
        }
      }
    }
  }
};
```

### Step 2: Implement Operation Handler

**File:** `lib/chat/woocommerce-tool-operations.ts`

```typescript
// Add new operation handler
export async function checkShippingCost(
  wc: WooCommerceAPI,
  params: WooCommerceOperationParams
): Promise<WooCommerceOperationResult> {
  if (!params.shippingPostcode) {
    return {
      success: false,
      data: null,
      message: "Postcode required for shipping calculation"
    };
  }

  try {
    // Get shipping zones
    const zones = await wc.getShippingZones();

    // Calculate shipping based on postcode
    // Your custom logic here...

    return {
      success: true,
      data: { cost: '5.99', currency: 'GBP' },
      message: "Shipping cost calculated successfully"
    };
  } catch (error) {
    return {
      success: false,
      data: null,
      message: `Failed to calculate shipping: ${error}`
    };
  }
}
```

### Step 3: Register Operation

**File:** `lib/chat/woocommerce-tool.ts`

```typescript
export async function executeWooCommerceOperation(
  operation: string,
  params: WooCommerceOperationParams,
  domain: string
): Promise<WooCommerceOperationResult> {
  // ... existing code ...

  switch (operation) {
    case "check_stock":
      return await checkStock(wc, params);

    case "check_shipping_cost":  // NEW CASE
      return await checkShippingCost(wc, params);

    // ... other cases ...
  }
}
```

### Step 4: Add Response Formatter (Optional)

**File:** `lib/chat/woocommerce-tool-formatters.ts`

```typescript
function formatShippingCostResponse(data: any): string {
  return `Shipping to ${data.postcode}: ${data.currency}${data.cost}`;
}
```

---

## Adding New E-commerce Platforms

The system supports multiple platforms through the `CommerceProvider` interface.

### Example: Adding Magento Support

**Step 1: Create Provider**

**File:** `lib/agents/providers/magento-provider.ts`

```typescript
import { CommerceProvider, OrderInfo } from '../commerce-provider';

export class MagentoProvider implements CommerceProvider {
  readonly platform = 'magento';

  constructor(private client: MagentoAPI) {}

  async lookupOrder(orderId: string): Promise<OrderInfo | null> {
    // Implement Magento order lookup
  }

  async searchProducts(query: string, limit?: number): Promise<any[]> {
    // Implement Magento product search
  }

  async checkStock(productId: string): Promise<any> {
    // Implement Magento stock check
  }

  async getProductDetails(productId: string): Promise<any> {
    // Implement Magento product details
  }
}
```

**Step 2: Register Provider Detector**

**File:** `lib/agents/commerce-provider.ts`

```typescript
const detectMagento: ProviderDetector = async ({ domain, config }) => {
  if (!config?.magento_url) return null;

  try {
    const { getMagentoClient } = await import('@/lib/magento-client');
    const client = await getMagentoClient(domain);

    if (!client) return null;

    const { MagentoProvider } = await import('./providers/magento-provider');
    return new MagentoProvider(client);
  } catch (error) {
    console.error('[Commerce Provider] Failed to initialize Magento:', error);
    return null;
  }
};

// Add to detector list
const providerDetectors: ProviderDetector[] = [
  detectShopify,
  detectWooCommerce,
  detectMagento  // NEW
];
```

---

## Testing Custom Operations

### Test Individual Operations

```typescript
// test-custom-operation.ts
import { executeWooCommerceOperation } from './lib/chat/woocommerce-tool';

async function testShippingCost() {
  const result = await executeWooCommerceOperation(
    'check_shipping_cost',
    { shippingPostcode: 'SW1A 1AA' },
    'thompsonseparts.co.uk'
  );

  console.log('Result:', result);
}

testShippingCost();
```

### Test in Chat Context

```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "How much is shipping to London?",
    "domain": "thompsonseparts.co.uk",
    "session_id": "test-shipping"
  }'
```

---

## Monitoring & Debugging

### Enable Detailed Logging

**File:** `.env.local`

```bash
# Enable detailed WooCommerce operation logging
NODE_ENV=development
```

### View WooCommerce Logs

Check server console for:
```
[WooCommerce Agent] Executing: check_stock
[Function Call] search_products: "angle grinders"
[Commerce Provider] Resolved commerce provider "woocommerce"
```

### Test API Connection

```bash
# Quick API health check
curl http://localhost:3000/api/woocommerce/test | jq

# Expected: All 4 tests passing
```

---

## Performance Optimization

### Provider Caching

The system caches commerce providers for 60 seconds:

```typescript
// lib/agents/commerce-provider.ts
const PROVIDER_CACHE_TTL_MS = 60_000; // Adjust as needed
```

### Rate Limiting

WooCommerce requests are subject to chat rate limits:

```typescript
// Default: 100 requests per domain per window
// Adjust in lib/rate-limit.ts if needed
```

---

## Security Best Practices

1. **Never commit credentials** - Always use `.env.local` (gitignored)
2. **Use encrypted database storage** - Credentials encrypted with AES-256
3. **Rotate API keys regularly** - Update both env vars and database
4. **Monitor API usage** - Check WooCommerce > Settings > Advanced > REST API
5. **Restrict API permissions** - Use read-only keys when possible

---

## Common Issues & Solutions

### Issue: "401 Unauthorized" errors

**Cause:** Incorrect or expired API credentials

**Solution:**
1. Verify credentials in WooCommerce admin
2. Update `.env` and `.env.local`
3. Update database if using per-domain config
4. Restart dev server with fresh environment

### Issue: Chat not using WooCommerce

**Cause:** Domain not recognized or provider not resolving

**Solution:**
1. Check domain format: use `thompsonseparts.co.uk` (not `www.`)
2. Verify database entry exists
3. Check commerce provider cache (clears after 60s)

### Issue: Old credentials persisting

**Cause:** Environment variable caching

**Solution:**
```bash
# Kill all processes
pkill -f "next dev"

# Export fresh credentials
export WOOCOMMERCE_CONSUMER_KEY="ck_..."
export WOOCOMMERCE_CONSUMER_SECRET="cs_..."

# Restart server
npm run dev
```

---

## Quick Reference

### File Structure

```
lib/
├── agents/
│   ├── commerce-provider.ts          # Multi-platform provider system
│   └── providers/
│       ├── woocommerce-provider.ts   # WooCommerce implementation
│       └── shopify-provider.ts       # Shopify implementation
├── chat/
│   ├── woocommerce-tool.ts           # Main tool entry point
│   ├── woocommerce-tool-types.ts     # Type definitions
│   ├── woocommerce-tool-operations.ts # Operation handlers
│   └── woocommerce-tool-formatters.ts # Response formatting
├── woocommerce-api/                  # Modular WooCommerce API client
└── woocommerce-dynamic.ts            # Dynamic credential loading

app/api/woocommerce/test/route.ts     # Test endpoint
```

### Key Functions

- `getCommerceProvider(domain)` - Get provider for domain
- `executeWooCommerceOperation(op, params, domain)` - Execute operation
- `getDynamicWooCommerceClient(domain)` - Get WooCommerce client
- `encryptWooCommerceConfig(config)` - Encrypt credentials

---

## Next Steps

### Immediate Actions

✅ All core functionality tested and working
✅ API connection verified
✅ Chat integration confirmed
✅ Database configuration checked

### Optional Enhancements

- [ ] Update database with new credentials (see Method 2 above)
- [ ] Add custom operations (shipping calculator, stock alerts, etc.)
- [ ] Implement order modification tools
- [ ] Add product recommendation system
- [ ] Create admin dashboard for credential management

---

## Support

For questions or issues:
1. Check server logs for detailed error messages
2. Run API test: `curl http://localhost:3000/api/woocommerce/test`
3. Verify credentials in WooCommerce admin
4. Check database configuration: `npx tsx check-thompson-database.ts`

**Documentation:**
- WooCommerce REST API: https://woocommerce.github.io/woocommerce-rest-api-docs/
- Commerce Provider Pattern: [lib/agents/commerce-provider.ts](../lib/agents/commerce-provider.ts)
- Chat Integration: [lib/chat/ai-processor.ts](../lib/chat/ai-processor.ts)
