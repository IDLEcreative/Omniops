# Commerce Provider Pattern Documentation

## Overview

The order lookup system now uses a **provider pattern** that abstracts e-commerce platform operations, enabling multi-platform support (WooCommerce, Shopify, etc.) without code changes.

## Architecture

### Core Components

1. **CommerceProvider Interface** ([lib/agents/commerce-provider.ts](lib/agents/commerce-provider.ts))
   - Defines standard operations all platforms must implement
   - `lookupOrder()`, `searchProducts()`, `checkStock()`, `getProductDetails()`
   - Platform-agnostic return types

2. **WooCommerceProvider** ([lib/agents/providers/woocommerce-provider.ts](lib/agents/providers/woocommerce-provider.ts))
   - Implements CommerceProvider for WooCommerce
   - Handles WooCommerce-specific API calls
   - Converts WooCommerce data to standard format

3. **ShopifyProvider (Placeholder)** ([lib/agents/providers/shopify-provider.ts](lib/agents/providers/shopify-provider.ts))
   - Ready for Shopify implementation
   - Same interface as WooCommerceProvider

4. **Provider Factory** ([lib/agents/commerce-provider.ts](lib/agents/commerce-provider.ts#L57-L70))
   - `getCommerceProvider(domain)` returns the correct provider
   - Future: Will detect platform from domain configuration

## Usage in Chat Route

The chat route now uses the provider pattern for order lookups:

```typescript
// OLD WAY (platform-specific)
const order = await lookupOrderDynamic(domain, orderId);

// NEW WAY (platform-agnostic)
const provider = await getCommerceProvider(domain);
const order = await provider.lookupOrder(orderId);
```

### Benefits

1. **Multi-Platform Support**: Add new platforms by implementing the interface
2. **No Code Changes**: Chat route doesn't need updates for new platforms
3. **Consistent Data Format**: All platforms return the same `OrderInfo` structure
4. **Easy Testing**: Can mock providers for testing

## Adding a New Platform (e.g., Shopify)

### Step 1: Implement the Provider

```typescript
// lib/agents/providers/shopify-provider.ts
export class ShopifyProvider implements CommerceProvider {
  readonly platform = 'shopify';

  async lookupOrder(orderId: string, email?: string): Promise<OrderInfo | null> {
    // Implement Shopify API calls
    const shopifyClient = getShopifyClient(this.domain);
    const order = await shopifyClient.getOrder(orderId);

    // Convert to standard OrderInfo format
    return {
      id: order.id,
      number: order.order_number,
      status: order.financial_status,
      // ... map other fields
    };
  }

  // Implement other required methods...
}
```

### Step 2: Update Provider Factory

```typescript
// lib/agents/commerce-provider.ts
export async function getCommerceProvider(domain: string): Promise<CommerceProvider | null> {
  // Check domain config to determine platform
  const config = await getDomainConfig(domain);

  switch (config.platform) {
    case 'woocommerce':
      const { WooCommerceProvider } = await import('./providers/woocommerce-provider');
      return new WooCommerceProvider(domain);

    case 'shopify':
      const { ShopifyProvider } = await import('./providers/shopify-provider');
      return new ShopifyProvider(domain);

    default:
      return null;
  }
}
```

### Step 3: No Chat Route Changes Needed!

The chat route automatically uses the new provider through the factory pattern.

## Standard OrderInfo Format

All providers must return this standardized format:

```typescript
interface OrderInfo {
  id: string | number;
  number: string | number;
  status: string;
  date: string;
  total: string | number;
  currency: string;
  items: Array<{
    name: string;
    quantity: number;
    total?: string;
  }>;
  billing?: {
    firstName?: string;
    lastName?: string;
    email?: string;
  };
  shipping?: any;
  trackingNumber?: string | null;
  permalink?: string | null;
}
```

## Integration with WooCommerce Tool

The `woocommerce-tool.ts` also implements order lookup using the same pattern:
- [lib/chat/woocommerce-tool.ts](lib/chat/woocommerce-tool.ts#L198-L292)
- Provides `check_order` operation for the WooCommerce agent
- Uses WooCommerce API directly but follows same data structure

## Testing

Test the provider pattern:

```bash
npx tsx test-provider-pattern.ts
```

Expected output:
```
✅ SUCCESS - Using WooCommerce provider!
Source: woocommerce
```

## Migration Notes

### What Changed

1. **Removed**: `lookupOrderDynamic()` from woocommerce-dynamic.ts
2. **Added**: CommerceProvider interface and provider implementations
3. **Updated**: `executeLookupOrder()` in chat route to use provider pattern

### Backward Compatibility

- Existing functionality is preserved
- Same API surface for consumers
- WooCommerce continues to work identically
- Ready for future platform additions

## Future Enhancements

1. **Platform Detection**: Auto-detect platform from domain config
2. **Provider Registry**: Dynamic provider registration
3. **Caching**: Cache provider instances per domain
4. **Fallback Providers**: Chain multiple providers for resilience
5. **Provider-Specific Features**: Optional methods for platform-specific operations

## Related Files

- [lib/agents/commerce-provider.ts](lib/agents/commerce-provider.ts) - Core interface
- [lib/agents/providers/woocommerce-provider.ts](lib/agents/providers/woocommerce-provider.ts) - WooCommerce implementation
- [lib/agents/providers/shopify-provider.ts](lib/agents/providers/shopify-provider.ts) - Shopify placeholder
- [app/api/chat/route.ts](app/api/chat/route.ts#L283-L354) - Usage in chat route
- [lib/chat/woocommerce-tool.ts](lib/chat/woocommerce-tool.ts#L198-L292) - WooCommerce tool integration
