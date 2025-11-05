# Shopify API Factory Pattern

**Last Updated:** 2025-11-05
**Related:** [WooCommerce Factory](../woocommerce-api/factory.ts), [Test Utils](../../test-utils/create-shopify-factory.ts)
**Status:** ✅ Complete

## Purpose

Implements dependency injection factory pattern for Shopify API client creation, enabling testable code without complex module mocking.

## Architecture

### Factory Interface (`factory.ts`)

```typescript
export interface ShopifyClientFactory {
  getConfigForDomain(domain: string): Promise<CustomerConfig | null>;
  createClient(credentials: ShopifyCredentials): ShopifyAPI;
  decryptCredentials(config: CustomerConfig): Promise<ShopifyCredentials | null>;
}
```

### Production Factory

- **Class:** `ProductionShopifyFactory`
- **Usage:** Fetches real configs from Supabase, decrypts credentials, creates Shopify clients
- **Default Instance:** `defaultShopifyFactory` (used when no factory provided)

### Credential Formats Supported

1. **New Format:** `encrypted_credentials.shopify` (JSON object with store_url, access_token)
2. **Legacy Format:** `shopify_shop`, `shopify_access_token` (individual encrypted columns)

## Usage

### Production Code (Backward Compatible)

```typescript
// Old way - still works (uses defaultShopifyFactory)
const client = await getDynamicShopifyClient('example.com');

// New way - with explicit factory (for testing)
const client = await getDynamicShopifyClient('example.com', factory);
```

### Testing Code

```typescript
import { createMockShopifyFactory } from '@/test-utils/create-shopify-factory';

// Create mock factory with config
const factory = createMockShopifyFactory({
  hasConfig: true,
  products: [{ id: 1, title: 'Test Product', variants: [] }],
});

// Use factory in tests
const client = await getDynamicShopifyClient('test.com', factory);
expect(client).not.toBeNull();
```

## Test Utilities

See [test-utils/create-shopify-factory.ts](../../test-utils/create-shopify-factory.ts)

### Available Helpers

- `createMockShopifyFactory()` - Standard mock factory
- `createMockShopifyFactoryWithDecryptionError()` - Simulates decryption failure
- `createMockShopifyFactoryWithDatabaseError()` - Simulates database error

### Configuration Options

```typescript
createMockShopifyFactory({
  hasConfig: true,           // Whether config exists
  products: [...],           // Mock products
  orders: [...],             // Mock orders
  customers: [...],          // Mock customers
  domain: 'test.com',        // Domain name
  customClient: {...},       // Custom client implementation
});
```

## Benefits Over Module Mocking

| Aspect | Module Mocking | Factory Pattern |
|--------|----------------|-----------------|
| **Setup Lines** | ~20 lines | 1 line |
| **Type Safety** | Poor | Excellent |
| **Test Isolation** | Shared state | Independent |
| **Maintainability** | Hard | Easy |
| **Debugging** | Complex | Simple |

## Pattern Consistency

This implementation follows **identical patterns** to WooCommerce factory:

- Same interface structure
- Same method signatures
- Same test helper pattern
- Same backward compatibility approach

## Files

- `lib/shopify-api/factory.ts` - Factory interface and production implementation (141 LOC)
- `lib/shopify-dynamic.ts` - Updated to accept factory parameter (35 LOC)
- `test-utils/create-shopify-factory.ts` - Test helpers and mock factory (240 LOC)
- `__tests__/lib/shopify-dynamic.test.ts` - Comprehensive tests (357 LOC)

## Test Coverage

- **Total Tests:** 31 (all passing)
- **Factory Pattern Tests:** 31/31 ✅
- **Backward Compatibility:** Verified ✅
- **Error Scenarios:** Comprehensive ✅
- **Multiple Credential Formats:** Supported ✅

## Migration Guide

No migration needed! The factory parameter is optional - existing code works without changes.

```typescript
// ✅ Existing code - still works
await getDynamicShopifyClient('example.com');

// ✅ New test code - uses factory
await getDynamicShopifyClient('example.com', mockFactory);
```

## Troubleshooting

### Issue: Client is null in tests
**Solution:** Ensure `hasConfig: true` when creating mock factory

### Issue: TypeScript errors about missing properties
**Solution:** Regenerate Supabase types: `npm run generate:types`

### Issue: Tests fail with "Database connection failed"
**Solution:** This is expected for tests using `createMockShopifyFactoryWithDatabaseError()`
