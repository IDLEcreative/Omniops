# WooCommerce Testing Guide

**Type:** Guide
**Status:** Active
**Last Updated:** 2025-11-05
**Verified For:** v0.1.0
**Dependencies:**
- [WooCommerce Dynamic Loader](../../lib/woocommerce-dynamic.ts)
- [WooCommerce Factory](../../lib/woocommerce-api/factory.ts)
- [Test Utils](../../test-utils/create-woocommerce-factory.ts)

## Purpose

This guide explains how to test WooCommerce functionality using the factory pattern for dependency injection. The factory pattern eliminates complex module mocking and enables simple, type-safe testing.

## Quick Links
- [Factory Pattern Implementation](#factory-pattern-implementation)
- [Writing Tests](#writing-tests)
- [Common Test Scenarios](#common-test-scenarios)
- [Migration Guide](#migration-guide)

## Table of Contents
- [Overview](#overview)
- [Factory Pattern Implementation](#factory-pattern-implementation)
- [Writing Tests](#writing-tests)
- [Common Test Scenarios](#common-test-scenarios)
- [Advanced Usage](#advanced-usage)
- [Migration Guide](#migration-guide)
- [Troubleshooting](#troubleshooting)

---

## Overview

### The Problem

Before the factory pattern, testing WooCommerce functionality required complex module mocking:

```typescript
// ❌ OLD WAY: Complex module mocking (20+ lines)
jest.mock('@/lib/supabase-server');
jest.mock('@/lib/encryption');
jest.mock('@woocommerce/woocommerce-rest-api');

// Mock implementations...
const mockSupabase = { from: jest.fn() /* ... */ };
const mockDecrypt = jest.fn();
// ... more mocking complexity
```

### The Solution

The factory pattern enables simple dependency injection:

```typescript
// ✅ NEW WAY: Simple factory (1 line)
const factory = createMockWooCommerceFactory({ hasConfig: true });
const client = await getDynamicWooCommerceClient('example.com', factory);
```

### Benefits

- **90% less test setup code** - One line instead of 20+
- **Type-safe** - Full TypeScript support with intellisense
- **No module mocking** - No `jest.mock()` calls needed
- **Easy to customize** - Override specific behaviors as needed
- **Clear test intent** - Self-documenting test setup

---

## Factory Pattern Implementation

### Architecture Overview

The factory pattern consists of three components:

1. **Factory Interface** (`WooCommerceClientFactory`) - Defines contract for client creation
2. **Production Factory** (`ProductionWooCommerceFactory`) - Real implementation for production
3. **Mock Factory** (`MockWooCommerceFactory`) - Test implementation for testing

### Factory Interface

```typescript
export interface WooCommerceClientFactory {
  // Get customer config from database
  getConfigForDomain(domain: string): Promise<CustomerConfig | null>;

  // Create WooCommerce API client
  createClient(credentials: WooCommerceCredentials): WooCommerceAPI;

  // Decrypt encrypted credentials
  decryptCredentials(config: CustomerConfig): Promise<WooCommerceCredentials | null>;
}
```

### Production Usage

In production code, the factory parameter is optional and defaults to the production implementation:

```typescript
// Uses real database and encryption
const client = await getDynamicWooCommerceClient('example.com');
```

### Test Usage

In tests, inject a mock factory:

```typescript
// Uses mock database and encryption
const factory = createMockWooCommerceFactory({ hasConfig: true });
const client = await getDynamicWooCommerceClient('example.com', factory);
```

---

## Writing Tests

### Basic Test Setup

```typescript
import { getDynamicWooCommerceClient } from '@/lib/woocommerce-dynamic';
import { createMockWooCommerceFactory } from '@/test-utils/create-woocommerce-factory';

describe('My WooCommerce feature', () => {
  it('should work with WooCommerce client', async () => {
    // Create mock factory with config
    const factory = createMockWooCommerceFactory({ hasConfig: true });

    // Get client using factory
    const client = await getDynamicWooCommerceClient('test.com', factory);

    // Verify client is created
    expect(client).not.toBeNull();
    expect(client).toHaveProperty('getProducts');
  });
});
```

### Testing with Mock Products

```typescript
it('should search products', async () => {
  const mockProducts = [
    { id: 1, name: 'Test Product 1', price: '10.00' },
    { id: 2, name: 'Test Product 2', price: '20.00' },
  ];

  const factory = createMockWooCommerceFactory({
    hasConfig: true,
    products: mockProducts,
  });

  const client = await getDynamicWooCommerceClient('test.com', factory);
  const products = await client?.getProducts();

  expect(products).toHaveLength(2);
  expect(products[0].name).toBe('Test Product 1');
});
```

### Testing with Mock Orders

```typescript
it('should fetch orders', async () => {
  const mockOrders = [
    { id: 100, status: 'completed', total: '99.99' },
    { id: 101, status: 'processing', total: '49.99' },
  ];

  const factory = createMockWooCommerceFactory({
    hasConfig: true,
    orders: mockOrders,
  });

  const client = await getDynamicWooCommerceClient('test.com', factory);
  const orders = await client?.getOrders();

  expect(orders).toHaveLength(2);
  expect(orders[0].status).toBe('completed');
});
```

---

## Common Test Scenarios

### Scenario 1: No WooCommerce Configuration

Test behavior when domain has no WooCommerce credentials:

```typescript
it('should return null when config does not exist', async () => {
  const factory = createMockWooCommerceFactory({ hasConfig: false });
  const client = await getDynamicWooCommerceClient('test.com', factory);

  expect(client).toBeNull();
});
```

### Scenario 2: Decryption Failure

Test behavior when credentials cannot be decrypted:

```typescript
import { createMockWooCommerceFactoryWithDecryptionError } from '@/test-utils/create-woocommerce-factory';

it('should handle decryption failure', async () => {
  const factory = createMockWooCommerceFactoryWithDecryptionError();
  const client = await getDynamicWooCommerceClient('test.com', factory);

  expect(client).toBeNull();
});
```

### Scenario 3: Database Error

Test behavior when database connection fails:

```typescript
import { createMockWooCommerceFactoryWithDatabaseError } from '@/test-utils/create-woocommerce-factory';

it('should handle database error', async () => {
  const factory = createMockWooCommerceFactoryWithDatabaseError();
  const client = await getDynamicWooCommerceClient('test.com', factory);

  expect(client).toBeNull();
});
```

### Scenario 4: Multiple Domains

Test with different configurations per domain:

```typescript
it('should handle multiple domains', async () => {
  const factory1 = createMockWooCommerceFactory({
    hasConfig: true,
    domain: 'domain1.com'
  });

  const factory2 = createMockWooCommerceFactory({
    hasConfig: true,
    domain: 'domain2.com'
  });

  const client1 = await getDynamicWooCommerceClient('domain1.com', factory1);
  const client2 = await getDynamicWooCommerceClient('domain2.com', factory2);

  expect(client1).not.toBeNull();
  expect(client2).not.toBeNull();
});
```

### Scenario 5: Custom Mock Client Behavior

Override default mock client methods:

```typescript
it('should use custom mock client', async () => {
  const customClient = {
    getProducts: jest.fn().mockResolvedValue([
      { id: 1, name: 'Custom Product', price: '99.99' }
    ]),
    getOrders: jest.fn().mockResolvedValue([]),
  };

  const factory = createMockWooCommerceFactory({
    hasConfig: true,
    customClient,
  });

  const client = await getDynamicWooCommerceClient('test.com', factory);
  const products = await client?.getProducts();

  expect(products).toHaveLength(1);
  expect(products[0].name).toBe('Custom Product');
  expect(customClient.getProducts).toHaveBeenCalledTimes(1);
});
```

---

## Advanced Usage

### Spy on Factory Methods

Use spies to verify factory method calls:

```typescript
it('should call factory methods in correct order', async () => {
  const factory = createMockWooCommerceFactory({ hasConfig: true });

  const getConfigSpy = jest.spyOn(factory, 'getConfigForDomain');
  const decryptSpy = jest.spyOn(factory, 'decryptCredentials');
  const createClientSpy = jest.spyOn(factory, 'createClient');

  await getDynamicWooCommerceClient('test.com', factory);

  expect(getConfigSpy).toHaveBeenCalledWith('test.com');
  expect(decryptSpy).toHaveBeenCalledTimes(1);
  expect(createClientSpy).toHaveBeenCalledTimes(1);
});
```

### Update Mock State During Test

Change factory behavior mid-test:

```typescript
it('should handle config updates', async () => {
  const factory = createMockWooCommerceFactory({ hasConfig: false });

  // Initially no config
  let client = await getDynamicWooCommerceClient('test.com', factory);
  expect(client).toBeNull();

  // Update factory to have config
  factory.setConfig({
    domain: 'test.com',
    encrypted_credentials: { /* ... */ },
    // ... other config fields
  });

  // Now should return client
  client = await getDynamicWooCommerceClient('test.com', factory);
  expect(client).not.toBeNull();
});
```

### Access Mock Client for Assertions

Get the mock client instance for detailed assertions:

```typescript
it('should call correct API methods', async () => {
  const factory = createMockWooCommerceFactory({ hasConfig: true });
  const client = await getDynamicWooCommerceClient('test.com', factory);

  // Get the mock client instance
  const mockClient = factory.getMockClient();

  // Make API calls
  await client?.getProducts({ search: 'test', per_page: 10 });

  // Assert on mock client calls
  expect(mockClient.getProducts).toHaveBeenCalledWith({
    search: 'test',
    per_page: 10,
  });
});
```

---

## Migration Guide

### Migrating Existing Tests

If you have existing tests that use module mocking, here's how to migrate:

#### Before (Module Mocking)

```typescript
// ❌ OLD: Complex module mocking
jest.mock('@/lib/supabase-server');
jest.mock('@/lib/encryption');

const mockSupabase = {
  from: jest.fn(() => ({
    select: jest.fn(() => ({
      eq: jest.fn(() => ({
        single: jest.fn().mockResolvedValue({
          data: { /* config data */ },
          error: null,
        }),
      })),
    })),
  })),
};

(createServiceRoleClient as jest.Mock).mockResolvedValue(mockSupabase);

it('should work', async () => {
  const client = await getDynamicWooCommerceClient('test.com');
  expect(client).not.toBeNull();
});
```

#### After (Factory Pattern)

```typescript
// ✅ NEW: Simple factory
import { createMockWooCommerceFactory } from '@/test-utils/create-woocommerce-factory';

it('should work', async () => {
  const factory = createMockWooCommerceFactory({ hasConfig: true });
  const client = await getDynamicWooCommerceClient('test.com', factory);
  expect(client).not.toBeNull();
});
```

### Migration Checklist

- [ ] Remove `jest.mock()` calls for WooCommerce dependencies
- [ ] Import `createMockWooCommerceFactory` from test-utils
- [ ] Replace mock setup with factory creation
- [ ] Add factory parameter to `getDynamicWooCommerceClient` calls
- [ ] Update assertions to use factory methods if needed
- [ ] Run tests to verify migration successful

---

## Troubleshooting

### Issue: Tests Still Failing After Migration

**Problem:** Tests fail even after adding factory pattern.

**Solution:** Ensure you're passing the factory as the second parameter:

```typescript
// ❌ WRONG: Missing factory parameter
const client = await getDynamicWooCommerceClient('test.com');

// ✅ CORRECT: Pass factory as second parameter
const factory = createMockWooCommerceFactory({ hasConfig: true });
const client = await getDynamicWooCommerceClient('test.com', factory);
```

### Issue: TypeScript Errors on Factory Methods

**Problem:** TypeScript complains about factory method signatures.

**Solution:** Ensure you're using the correct factory type:

```typescript
import type { WooCommerceClientFactory } from '@/lib/woocommerce-api/factory';

// Factory must implement WooCommerceClientFactory interface
const factory: WooCommerceClientFactory = createMockWooCommerceFactory({ hasConfig: true });
```

### Issue: Mock Client Methods Not Working

**Problem:** Mock client methods return undefined or throw errors.

**Solution:** Use `customClient` option to provide custom mock implementation:

```typescript
const customClient = {
  getProducts: jest.fn().mockResolvedValue([]),
  getOrders: jest.fn().mockResolvedValue([]),
  // ... other methods
};

const factory = createMockWooCommerceFactory({
  hasConfig: true,
  customClient,
});
```

### Issue: Tests Timeout or Hang

**Problem:** Tests don't complete and eventually timeout.

**Solution:** Ensure all mock functions return resolved promises:

```typescript
// ❌ BAD: Doesn't return a promise
mockClient.getProducts = jest.fn(() => []);

// ✅ GOOD: Returns resolved promise
mockClient.getProducts = jest.fn().mockResolvedValue([]);
```

### Issue: Cannot Import Factory in Tests

**Problem:** Import error when trying to use factory.

**Solution:** Check that test-utils is properly configured in tsconfig:

```json
{
  "compilerOptions": {
    "paths": {
      "@/test-utils/*": ["test-utils/*"]
    }
  }
}
```

---

## Best Practices

### 1. Keep Test Setup Simple

Don't over-configure mocks. Use defaults when possible:

```typescript
// ✅ GOOD: Minimal setup
const factory = createMockWooCommerceFactory({ hasConfig: true });

// ❌ BAD: Over-configured
const factory = createMockWooCommerceFactory({
  hasConfig: true,
  products: [],
  orders: [],
  domain: 'test.com',
  // ... unnecessary config
});
```

### 2. Test One Thing Per Test

Each test should verify a single behavior:

```typescript
// ✅ GOOD: Single responsibility
it('should return null when config missing', async () => {
  const factory = createMockWooCommerceFactory({ hasConfig: false });
  expect(await getDynamicWooCommerceClient('test.com', factory)).toBeNull();
});

// ❌ BAD: Testing multiple things
it('should handle various scenarios', async () => {
  // Tests config missing, decryption error, database error all in one test
});
```

### 3. Use Helper Functions for Common Scenarios

Create helper functions for frequently used test setups:

```typescript
function createFactoryWithProducts(products: any[]) {
  return createMockWooCommerceFactory({
    hasConfig: true,
    products,
  });
}

it('should search products', async () => {
  const factory = createFactoryWithProducts([
    { id: 1, name: 'Test' }
  ]);
  // ... test logic
});
```

### 4. Clean Up After Tests

Reset mocks between tests:

```typescript
beforeEach(() => {
  jest.clearAllMocks();
});
```

---

## Related Documentation

- **[WooCommerce Dynamic Loader](../../lib/woocommerce-dynamic.ts)** - Production implementation
- **[WooCommerce Factory](../../lib/woocommerce-api/factory.ts)** - Factory interface and production factory
- **[Mock Factory Helper](../../test-utils/create-woocommerce-factory.ts)** - Test helper functions
- **[Example Tests](../../__tests__/lib/woocommerce-dynamic.test.ts)** - Comprehensive test examples

---

## Revision History

| Date | Version | Changes |
|------|---------|---------|
| 2025-11-05 | 1.0.0 | Initial documentation for factory pattern testing |
