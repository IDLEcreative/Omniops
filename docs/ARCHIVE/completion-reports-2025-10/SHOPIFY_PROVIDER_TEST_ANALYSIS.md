# Shopify Provider Test Failure Analysis

**Date**: 2025-10-26
**Status**: DESIGN PROBLEM - Refactoring Strongly Recommended
**Affected Files**: 2 providers (Shopify, WooCommerce)
**Estimated Fix Time**: 2-3 hours

## Executive Summary

The failing tests are a **symptom of poor design**, not a simple mocking issue. The `ShopifyProvider` class is **tightly coupled** to external dependencies (database, encryption, Supabase client), making it extremely difficult to test in isolation. This violates fundamental software engineering principles: **SOLID** (specifically Dependency Inversion) and **testability**.

**Verdict**: This needs refactoring. The current design is hard to test because it's poorly designed for dependency injection.

### Quick Diagnosis

**Problem**: All 9 tests return `null` because:
1. `getDynamicShopifyClient(domain)` is called inside every method
2. Module mocking doesn't intercept the actual function call
3. Even if mocking worked, we'd be testing mock configuration, not business logic

**Root Cause**: Constructor takes `domain: string` instead of `client: ShopifyAPI`

**Solution**: Use dependency injection - pass the client to the constructor

**Files Affected**:
- `/Users/jamesguy/Omniops/lib/agents/providers/shopify-provider.ts` (implementation)
- `/Users/jamesguy/Omniops/lib/agents/providers/woocommerce-provider.ts` (same problem)
- `/Users/jamesguy/Omniops/lib/agents/commerce-provider.ts` (factory functions)
- `/Users/jamesguy/Omniops/__tests__/lib/agents/providers/shopify-provider-operations.test.ts` (tests)
- 4+ other test files

**Impact**: Breaking change, but easy migration (TypeScript will guide)

---

## Root Cause Analysis

### Current Design Problems

1. **Hidden Dependency Chain**
   ```typescript
   // ShopifyProvider has NO direct dependency on ShopifyAPI
   constructor(domain: string) {
     this.domain = domain;
   }

   // Every method calls this:
   const shopify = await getDynamicShopifyClient(this.domain);
   ```

   The dependency on `ShopifyAPI` is **hidden inside** `getDynamicShopifyClient()`, which:
   - Creates a Supabase client (`createServiceRoleClient()`)
   - Queries the database
   - Decrypts credentials (`decrypt()`)
   - Instantiates `ShopifyAPI`

2. **Impossible to Mock Chain**
   ```typescript
   // lib/shopify-dynamic.ts
   export async function getDynamicShopifyClient(domain: string): Promise<ShopifyAPI | null> {
     const supabase = await createServiceRoleClient(); // ← Can't mock this
     if (!supabase) return null;

     const { data: config } = await supabase
       .from('customer_configs')              // ← Can't mock this
       .select('shopify_shop, shopify_access_token')
       .eq('domain', domain)
       .single();

     const accessToken = decrypt(config.shopify_access_token); // ← Can't mock this

     return new ShopifyAPI({                   // ← Can't inject this
       shop: config.shopify_shop,
       accessToken,
     });
   }
   ```

   **Problem**: The test needs to mock `getDynamicShopifyClient()`, but even if we mock it successfully, we're testing the mock, not the actual provider logic.

3. **Violates Dependency Inversion Principle**
   - High-level module (`ShopifyProvider`) depends on low-level modules (database, encryption)
   - Should depend on abstractions (interfaces)
   - Dependencies should be **injected**, not **constructed internally**

4. **Test Results Confirm The Problem**
   ```
   Expected: {id: 123, number: '#1001', ...}
   Received: null
   ```

   All tests return `null` because:
   - `getDynamicShopifyClient()` is being called
   - The mock isn't intercepting it properly (or is being bypassed)
   - Even if the mock works, `shopify` returns `null` and the provider exits early

---

## Why Current Mocking Approach Fails

### The Mock Setup
```typescript
// Test file attempts this:
const mockGetDynamicShopifyClient = jest.fn();

jest.mock('@/lib/shopify-dynamic', () => ({
  getDynamicShopifyClient: (...args: any[]) => mockGetDynamicShopifyClient(...args),
}));

mockGetDynamicShopifyClient.mockResolvedValue(mockClient);
```

### Why It Doesn't Work

1. **Jest Mock Hoisting**: The `jest.mock()` is hoisted to the top, but the actual implementation import happens after
2. **Module Resolution**: TypeScript path aliases (`@/lib/...`) can cause issues with Jest's module mocking
3. **Async Function Mocking**: Mocking an async function that returns a Promise is tricky
4. **Multiple Layers**: Even if the mock works, you're testing mock behavior, not real code paths

---

## Recommended Refactoring

### Option 1: Constructor Injection (Preferred)

**Philosophy**: "New is Glue" - Don't use `new` inside classes, inject dependencies.

```typescript
// lib/agents/providers/shopify-provider.ts
import { CommerceProvider, OrderInfo } from '../commerce-provider';
import { ShopifyAPI } from '@/lib/shopify-api';

export class ShopifyProvider implements CommerceProvider {
  readonly platform = 'shopify';
  private shopifyClient: ShopifyAPI;

  // Inject the client directly
  constructor(shopifyClient: ShopifyAPI) {
    this.shopifyClient = shopifyClient;
  }

  async lookupOrder(orderId: string, email?: string): Promise<OrderInfo | null> {
    try {
      // Use the injected client - no more async client fetching
      let order = null;
      const numericId = parseInt(orderId, 10);

      if (!isNaN(numericId)) {
        try {
          order = await this.shopifyClient.getOrder(numericId);
        } catch (error) {
          console.log(`[Shopify Provider] Order ID ${numericId} not found`);
        }
      }

      // ... rest of logic remains the same

    } catch (error) {
      console.error('[Shopify Provider] Order lookup error:', error);
      return null;
    }
  }

  // All other methods use this.shopifyClient directly
}
```

**Usage in Production**:
```typescript
// In API routes or wherever you use ShopifyProvider
import { getDynamicShopifyClient } from '@/lib/shopify-dynamic';
import { ShopifyProvider } from '@/lib/agents/providers/shopify-provider';

const shopifyClient = await getDynamicShopifyClient(domain);
if (!shopifyClient) {
  throw new Error('Shopify not configured');
}

const provider = new ShopifyProvider(shopifyClient);
const order = await provider.lookupOrder('123');
```

**Testing**:
```typescript
// __tests__/lib/agents/providers/shopify-provider-operations.test.ts
import { ShopifyProvider } from '@/lib/agents/providers/shopify-provider';

describe('ShopifyProvider - Operations', () => {
  let provider: ShopifyProvider;
  let mockClient: any;

  beforeEach(() => {
    // Create a simple mock - NO module mocking needed!
    mockClient = {
      getOrder: jest.fn(),
      getOrders: jest.fn(),
      searchProducts: jest.fn(),
      getProduct: jest.fn(),
      getProducts: jest.fn(),
    };

    // Inject the mock
    provider = new ShopifyProvider(mockClient);
    jest.clearAllMocks();
  });

  it('should lookup order by numeric ID', async () => {
    const mockOrder = {
      id: 123,
      name: '#1001',
      // ... full mock data
    };

    mockClient.getOrder.mockResolvedValue(mockOrder);

    const result = await provider.lookupOrder('123');

    expect(result).toEqual({
      id: 123,
      number: '#1001',
      // ... expected output
    });

    expect(mockClient.getOrder).toHaveBeenCalledWith(123);
  });
});
```

**Benefits**:
- ✅ No module mocking required
- ✅ Fast tests (no async client loading)
- ✅ Tests actual business logic
- ✅ Easy to understand and maintain
- ✅ Follows SOLID principles
- ✅ Enables testing edge cases easily

---

### Option 2: Factory Pattern with Dependency Injection

If you need to support both static instantiation and testing:

```typescript
export class ShopifyProvider implements CommerceProvider {
  readonly platform = 'shopify';
  private clientFactory: () => Promise<ShopifyAPI | null>;

  constructor(
    domain: string,
    clientFactory?: () => Promise<ShopifyAPI | null>
  ) {
    // Production: use the default factory
    // Testing: inject a custom factory
    this.clientFactory = clientFactory ?? (() => getDynamicShopifyClient(domain));
  }

  async lookupOrder(orderId: string, email?: string): Promise<OrderInfo | null> {
    const shopify = await this.clientFactory();
    if (!shopify) return null;

    // ... rest of implementation
  }
}
```

**Testing**:
```typescript
const mockClient = { /* ... */ };
const provider = new ShopifyProvider(
  'test-domain',
  () => Promise.resolve(mockClient) // Inject mock factory
);
```

**Benefits**:
- ✅ Backward compatible
- ✅ Easy to test
- ❌ Slightly more complex than Option 1
- ❌ Still has some async overhead in tests

---

### Option 3: Interface-Based Dependency (Most Flexible)

```typescript
// Define an interface
interface IShopifyClient {
  getOrder(id: number): Promise<any>;
  getOrders(params: any): Promise<any[]>;
  searchProducts(query: string, limit: number): Promise<any[]>;
  getProduct(id: number): Promise<any>;
  getProducts(params: any): Promise<any[]>;
}

export class ShopifyProvider implements CommerceProvider {
  readonly platform = 'shopify';
  private client: IShopifyClient;

  constructor(client: IShopifyClient) {
    this.client = client;
  }

  // ... implementation uses this.client
}
```

**Benefits**:
- ✅ Maximum flexibility
- ✅ Can swap implementations (testing, staging, production)
- ✅ TypeScript ensures contract compliance
- ❌ Requires defining interface (small overhead)

---

## Impact Analysis

### Files That Need Changes

1. **`lib/agents/providers/shopify-provider.ts`** (Primary)
   - Add constructor parameter for `ShopifyAPI` client
   - Remove all `getDynamicShopifyClient()` calls
   - Replace with `this.shopifyClient`

2. **All files that instantiate `ShopifyProvider`** (Secondary)
   - Find with: `new ShopifyProvider(`
   - Update to fetch client first, then pass to constructor

3. **`__tests__/lib/agents/providers/shopify-provider-operations.test.ts`** (Tests)
   - Remove all `jest.mock()` calls
   - Create simple mock objects
   - Inject mocks via constructor

### Breaking Changes

**Current API**:
```typescript
const provider = new ShopifyProvider('domain.com');
```

**New API**:
```typescript
const client = await getDynamicShopifyClient('domain.com');
const provider = new ShopifyProvider(client);
```

**Migration Strategy**:
1. Add optional parameter first (backward compatible)
2. Deprecate old constructor
3. Update all call sites
4. Remove deprecated constructor

---

## Code Quality Principles Violated

### Current Design Violations

1. **Dependency Inversion Principle (DIP)**
   - ❌ High-level module depends on low-level details
   - ✅ Should: Depend on abstractions (interfaces)

2. **Single Responsibility Principle (SRP)**
   - ❌ Provider is responsible for fetching its own client
   - ✅ Should: Only handle provider operations

3. **Testability**
   - ❌ Cannot test without database/encryption infrastructure
   - ✅ Should: Test business logic in isolation

4. **Separation of Concerns**
   - ❌ Provider mixes business logic with infrastructure concerns
   - ✅ Should: Separate client creation from business logic

---

## Recommendation

**REFACTOR NOW** - Do not attempt to fix the mocks.

### Why Not Fix The Mocks?

1. **Technical Debt**: Fixing mocks creates hidden complexity
2. **Maintenance Burden**: Future developers will struggle with brittle tests
3. **False Security**: Tests might pass but not test real logic
4. **Code Smell**: "Hard to test" means "needs better design"

### Recommended Approach

**Priority: HIGH**

1. ✅ **Refactor** `ShopifyProvider` to use constructor injection (Option 1)
2. ✅ **Update** all call sites to instantiate client first
3. ✅ **Simplify** tests to use simple mock objects
4. ✅ **Document** the new pattern for future providers

**Estimated Effort**: 2-3 hours
- 30 min: Refactor `ShopifyProvider`
- 30 min: Update call sites
- 30 min: Fix tests
- 30 min: Test in production
- 30 min: Documentation

**Risk**: LOW (backward compatible if done carefully)

---

## Testing Philosophy

### What We're Testing Now (Wrong)

```
Test → Mock Module → Mock Client → Provider → Mock Client → Return Mocked Data
```

**Problem**: Testing mock configuration, not business logic.

### What We Should Test (Right)

```
Test → Mock Object → Provider → Business Logic → Return Transformed Data
```

**Benefit**: Testing actual transformation logic, edge cases, error handling.

---

## Real-World Analogy

**Current Design**:
```typescript
class Car {
  drive() {
    const engine = buildEngineFromScratch(); // ← Bad!
    engine.start();
  }
}
```

**Good Design**:
```typescript
class Car {
  constructor(private engine: Engine) {} // ← Good!

  drive() {
    this.engine.start();
  }
}
```

**Why?**
- You can't test `Car.drive()` without building a real engine
- You can't swap engines (electric vs gas)
- Every test requires full engine assembly line
- Tight coupling makes changes ripple everywhere

---

## Conclusion

**The tests are failing because the code design is fundamentally flawed.**

This is **not** a mocking problem - it's a **dependency injection problem**. The `ShopifyProvider` should receive its dependencies (the Shopify client) rather than constructing them internally. This makes the code:

1. **Easier to test** - Simple mock objects instead of complex module mocking
2. **More maintainable** - Clear dependencies visible in constructor
3. **More flexible** - Can swap implementations (testing, staging, production)
4. **More aligned with SOLID principles** - Proper dependency inversion

**Action Required**: Refactor `ShopifyProvider` to accept `ShopifyAPI` client via constructor injection.

**Time Investment**: 2-3 hours of refactoring will save countless hours of debugging brittle tests.

**Long-term Benefit**: Sets a pattern for all future providers (WooCommerce, etc.) to follow.

---

## Additional Notes

### Similar Patterns in Codebase

**CONFIRMED**: `WooCommerceProvider` has the EXACT same problem.

Both providers follow the same flawed pattern:
- `/Users/jamesguy/Omniops/lib/agents/providers/shopify-provider.ts` - Uses `getDynamicShopifyClient()`
- `/Users/jamesguy/Omniops/lib/agents/providers/woocommerce-provider.ts` - Uses `getDynamicWooCommerceClient()`

**Impact**: All provider tests will have similar issues. Must refactor consistently.

### Future Prevention

**Code Review Checklist**:
- [ ] Are dependencies injected or constructed internally?
- [ ] Can this class be tested without database/external services?
- [ ] Are we using `new` inside classes (code smell)?
- [ ] Is the constructor signature clear about dependencies?

### Reference Materials

- [Dependency Injection Principles](https://en.wikipedia.org/wiki/Dependency_injection)
- [SOLID Principles](https://en.wikipedia.org/wiki/SOLID)
- [Testing Best Practices](https://github.com/goldbergyoni/javascript-testing-best-practices)
- ["New is Glue" - Miško Hevery](https://www.youtube.com/watch?v=RlfLCWKxHJ0)

---

## Implementation Guide

### Step-by-Step Refactoring Plan

#### Phase 1: Update Provider Classes (Breaking Change)

**File**: `/Users/jamesguy/Omniops/lib/agents/providers/shopify-provider.ts`

```typescript
/**
 * Shopify Commerce Provider Implementation
 * REFACTORED: Now uses dependency injection
 */

import { CommerceProvider, OrderInfo } from '../commerce-provider';
import { ShopifyAPI } from '@/lib/shopify-api';

export class ShopifyProvider implements CommerceProvider {
  readonly platform = 'shopify';
  private shopifyClient: ShopifyAPI;

  /**
   * Constructor now requires a ShopifyAPI client instance
   * @param shopifyClient - Configured ShopifyAPI instance
   */
  constructor(shopifyClient: ShopifyAPI) {
    this.shopifyClient = shopifyClient;
  }

  async lookupOrder(orderId: string, email?: string): Promise<OrderInfo | null> {
    try {
      let order = null;

      // Try to get order by ID first
      const numericId = parseInt(orderId, 10);
      if (!isNaN(numericId)) {
        try {
          order = await this.shopifyClient.getOrder(numericId);
        } catch (error) {
          console.log(`[Shopify Provider] Order ID ${numericId} not found`);
        }
      }

      // If not found by ID and we have an email, search by email
      if (!order && email) {
        const orders = await this.shopifyClient.getOrders({
          limit: 1,
          status: 'any',
        });
        order = orders.find(o => o.email === email) || null;
      }

      // If still not found by order number, try searching by order name
      if (!order && orderId) {
        const orders = await this.shopifyClient.getOrders({
          limit: 50,
          status: 'any',
        });
        order = orders.find(o =>
          o.name === orderId ||
          o.name === `#${orderId}` ||
          o.order_number.toString() === orderId
        ) || null;
      }

      if (!order) {
        return null;
      }

      // Convert to standard OrderInfo format
      return {
        id: order.id,
        number: order.name,
        status: order.financial_status,
        date: order.created_at,
        total: order.total_price,
        currency: order.currency,
        items: order.line_items?.map(item => ({
          name: item.title,
          quantity: item.quantity,
          total: item.price
        })) || [],
        billing: order.billing_address ? {
          firstName: order.billing_address.first_name || '',
          lastName: order.billing_address.last_name || '',
          email: order.email
        } : undefined,
        shipping: order.shipping_address,
        trackingNumber: null,
        permalink: null
      };
    } catch (error) {
      console.error('[Shopify Provider] Order lookup error:', error);
      return null;
    }
  }

  async searchProducts(query: string, limit: number = 10): Promise<any[]> {
    try {
      return await this.shopifyClient.searchProducts(query, limit);
    } catch (error) {
      console.error('[Shopify Provider] Product search error:', error);
      return [];
    }
  }

  async checkStock(productId: string): Promise<any> {
    try {
      const numericId = parseInt(productId, 10);
      let product = null;

      if (!isNaN(numericId)) {
        try {
          product = await this.shopifyClient.getProduct(numericId);
        } catch (error) {
          console.log(`[Shopify Provider] Product ID ${numericId} not found`);
        }
      }

      if (!product) {
        const products = await this.shopifyClient.getProducts({ limit: 250 });
        product = products.find(p =>
          p.variants.some(v => v.sku === productId)
        ) || null;
      }

      if (!product) {
        return null;
      }

      const variant = product.variants.find(v => v.sku === productId) || product.variants[0];

      if (!variant) {
        return null;
      }

      return {
        productName: product.title,
        sku: variant.sku,
        stockStatus: variant.inventory_quantity > 0 ? 'instock' : 'outofstock',
        stockQuantity: variant.inventory_quantity,
        manageStock: variant.inventory_management !== null,
        backorders: variant.inventory_policy === 'continue' ? 'yes' : 'no'
      };
    } catch (error) {
      console.error('[Shopify Provider] Stock check error:', error);
      return null;
    }
  }

  async getProductDetails(productId: string): Promise<any> {
    try {
      const numericId = parseInt(productId, 10);

      if (!isNaN(numericId)) {
        return await this.shopifyClient.getProduct(numericId);
      }

      const products = await this.shopifyClient.getProducts({ limit: 250 });
      return products.find(p =>
        p.variants.some(v => v.sku === productId)
      ) || null;
    } catch (error) {
      console.error('[Shopify Provider] Product details error:', error);
      return null;
    }
  }
}
```

**Key Changes**:
- ✅ Removed `domain` from constructor
- ✅ Added `shopifyClient: ShopifyAPI` to constructor
- ✅ Removed all `await getDynamicShopifyClient()` calls
- ✅ Replace `shopify` variable with `this.shopifyClient`
- ✅ Removed null checks for client (assumed valid)
- ✅ Simplified error handling

---

#### Phase 2: Update Factory Functions

**File**: `/Users/jamesguy/Omniops/lib/agents/commerce-provider.ts`

```typescript
// Update detectShopify function (lines 112-124)
const detectShopify: ProviderDetector = async ({ domain, config }) => {
  if (!hasShopifySupport(config)) {
    return null;
  }

  try {
    // Import both provider and dynamic client
    const { ShopifyProvider } = await import('./providers/shopify-provider');
    const { getDynamicShopifyClient } = await import('@/lib/shopify-dynamic');

    // Get the client first
    const shopifyClient = await getDynamicShopifyClient(domain);

    if (!shopifyClient) {
      return null;
    }

    // Inject the client into the provider
    return new ShopifyProvider(shopifyClient);
  } catch (error) {
    console.error('[Commerce Provider] Failed to initialize Shopify provider:', error);
    return null;
  }
};

// Update detectWooCommerce function (lines 126-138)
const detectWooCommerce: ProviderDetector = async ({ domain, config }) => {
  if (!hasWooCommerceSupport(config)) {
    return null;
  }

  try {
    // Import both provider and dynamic client
    const { WooCommerceProvider } = await import('./providers/woocommerce-provider');
    const { getDynamicWooCommerceClient } = await import('@/lib/woocommerce-dynamic');

    // Get the client first
    const wcClient = await getDynamicWooCommerceClient(domain);

    if (!wcClient) {
      return null;
    }

    // Inject the client into the provider
    return new WooCommerceProvider(wcClient);
  } catch (error) {
    console.error('[Commerce Provider] Failed to initialize WooCommerce provider:', error);
    return null;
  }
};
```

**Key Changes**:
- ✅ Import `getDynamic*Client` functions
- ✅ Fetch client before creating provider
- ✅ Pass client to provider constructor
- ✅ Handle null client case

---

#### Phase 3: Update WooCommerceProvider

**File**: `/Users/jamesguy/Omniops/lib/agents/providers/woocommerce-provider.ts`

Apply the same refactoring pattern as ShopifyProvider:

```typescript
import { CommerceProvider, OrderInfo } from '../commerce-provider';
import WooCommerceRestApi from '@woocommerce/woocommerce-rest-api';

export class WooCommerceProvider implements CommerceProvider {
  readonly platform = 'woocommerce';
  private wcClient: WooCommerceRestApi;

  constructor(wcClient: WooCommerceRestApi) {
    this.wcClient = wcClient;
  }

  async lookupOrder(orderId: string, email?: string): Promise<OrderInfo | null> {
    try {
      let order = null;
      const numericId = parseInt(orderId, 10);

      if (!isNaN(numericId)) {
        try {
          order = await this.wcClient.getOrder(numericId);
        } catch (error) {
          console.log(`[WooCommerce Provider] Order ID ${numericId} not found`);
        }
      }

      // ... rest of implementation using this.wcClient
    } catch (error) {
      console.error('[WooCommerce Provider] Order lookup error:', error);
      return null;
    }
  }

  // ... rest of methods follow same pattern
}
```

---

#### Phase 4: Fix All Tests

**File**: `/Users/jamesguy/Omniops/__tests__/lib/agents/providers/shopify-provider-operations.test.ts`

```typescript
/**
 * Shopify Provider Operations Tests
 * Tests CRUD operations for orders and products
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { ShopifyProvider } from '@/lib/agents/providers/shopify-provider';

describe('ShopifyProvider - Operations', () => {
  let provider: ShopifyProvider;
  let mockClient: any;

  beforeEach(() => {
    // Create a simple mock client - NO module mocking!
    mockClient = {
      getOrder: jest.fn(),
      getOrders: jest.fn(),
      searchProducts: jest.fn(),
      getProduct: jest.fn(),
      getProducts: jest.fn(),
    };

    // Inject the mock client
    provider = new ShopifyProvider(mockClient);
    jest.clearAllMocks();
  });

  describe('lookupOrder', () => {
    it('should lookup order by numeric ID', async () => {
      const mockOrder = {
        id: 123,
        name: '#1001',
        financial_status: 'paid',
        created_at: '2025-01-01T00:00:00Z',
        total_price: '99.99',
        currency: 'USD',
        email: 'customer@example.com',
        line_items: [
          { title: 'Product A', quantity: 2, price: '49.99' }
        ],
        billing_address: {
          first_name: 'John',
          last_name: 'Doe'
        },
        shipping_address: { address1: '123 Main St' }
      };

      mockClient.getOrder.mockResolvedValue(mockOrder);

      const result = await provider.lookupOrder('123');

      expect(result).toEqual({
        id: 123,
        number: '#1001',
        status: 'paid',
        date: '2025-01-01T00:00:00Z',
        total: '99.99',
        currency: 'USD',
        items: [{ name: 'Product A', quantity: 2, total: '49.99' }],
        billing: {
          firstName: 'John',
          lastName: 'Doe',
          email: 'customer@example.com'
        },
        shipping: { address1: '123 Main St' },
        trackingNumber: null,
        permalink: null
      });

      expect(mockClient.getOrder).toHaveBeenCalledWith(123);
    });

    it('should search by email if ID lookup fails', async () => {
      const mockOrders = [
        {
          id: 456,
          name: '#1002',
          email: 'search@example.com',
          financial_status: 'pending',
          created_at: '2025-01-02',
          total_price: '150.00',
          currency: 'USD',
          line_items: []
        }
      ];

      mockClient.getOrder.mockRejectedValue(new Error('Not found'));
      mockClient.getOrders.mockResolvedValue(mockOrders);

      const result = await provider.lookupOrder('999', 'search@example.com');

      expect(result).toBeDefined();
      expect(result?.number).toBe('#1002');
      expect(result?.status).toBe('pending');
    });

    // ... rest of tests follow same pattern
  });

  describe('searchProducts', () => {
    it('should search products successfully', async () => {
      const mockProducts = [
        { id: 1, title: 'Product 1', variants: [] },
        { id: 2, title: 'Product 2', variants: [] }
      ];

      mockClient.searchProducts.mockResolvedValue(mockProducts);

      const result = await provider.searchProducts('test query', 10);

      expect(result).toEqual(mockProducts);
      expect(mockClient.searchProducts).toHaveBeenCalledWith('test query', 10);
    });
  });

  // ... rest of test suites
});
```

**Key Changes**:
- ❌ Removed ALL `jest.mock()` calls
- ❌ Removed `mockGetDynamicShopifyClient`
- ✅ Create simple mock object in `beforeEach`
- ✅ Inject mock via constructor
- ✅ Tests now run fast and test real logic

---

#### Phase 5: Update Integration Tests

**Files to Update**:
- `/Users/jamesguy/Omniops/__tests__/lib/shopify-integration.test.ts`
- `/Users/jamesguy/Omniops/__tests__/lib/agents/providers/woocommerce-provider.test.ts`
- `/Users/jamesguy/Omniops/__tests__/lib/agents/providers/shopify-provider-errors.test.ts`
- `/Users/jamesguy/Omniops/__tests__/lib/agents/providers/shopify-provider-setup.test.ts`

**Pattern**:
```typescript
// OLD (integration test - keep these patterns)
const provider = new ShopifyProvider(testDomain);

// NEW (for integration tests that need real clients)
const client = await getDynamicShopifyClient(testDomain);
const provider = new ShopifyProvider(client);

// NEW (for unit tests with mocks)
const mockClient = { getOrder: jest.fn(), ... };
const provider = new ShopifyProvider(mockClient);
```

---

### Migration Checklist

#### Immediate Actions (Required)

- [ ] Update `ShopifyProvider` constructor to accept `ShopifyAPI` client
- [ ] Update `WooCommerceProvider` constructor to accept `WooCommerceRestApi` client
- [ ] Update `detectShopify` in `commerce-provider.ts`
- [ ] Update `detectWooCommerce` in `commerce-provider.ts`
- [ ] Fix `shopify-provider-operations.test.ts` (remove module mocks)
- [ ] Fix `woocommerce-provider.test.ts` (remove module mocks)
- [ ] Update integration tests to fetch client first
- [ ] Run full test suite: `npm test`
- [ ] Verify all tests pass

#### Documentation Updates

- [ ] Update `/Users/jamesguy/Omniops/PULL_REQUEST_TEMPLATE.md` examples
- [ ] Update `/Users/jamesguy/Omniops/docs/COMMERCE_PROVIDER_TEST_ANALYSIS.md`
- [ ] Add migration guide to docs
- [ ] Update code comments with new usage pattern

#### Validation Steps

- [ ] All unit tests pass (fast, no mocks)
- [ ] All integration tests pass (real clients)
- [ ] Manual testing with real Shopify store
- [ ] Manual testing with real WooCommerce store
- [ ] Verify commerce provider factory still works
- [ ] Check provider caching still works

---

### Expected Outcomes

#### Before Refactoring
```
Test Suites: 1 failed, X passed
Tests:       9 failed, X passed
Time:        ~5-10 seconds (slow due to async mocks)
```

#### After Refactoring
```
Test Suites: X passed
Tests:       X passed
Time:        ~1-2 seconds (fast, no async overhead)
```

#### Code Quality Improvements

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| Test Speed | 5-10s | 1-2s | 80% faster |
| Test Complexity | High (module mocking) | Low (object mocking) | Much simpler |
| Testability | Poor (tightly coupled) | Excellent (injected deps) | Significantly better |
| Maintainability | Hard (brittle tests) | Easy (clear dependencies) | Much easier |
| SOLID Compliance | ❌ Violates DIP | ✅ Follows DIP | Compliant |

---

### Risk Mitigation

#### Breaking Changes
- **Risk**: Existing code that instantiates providers directly will break
- **Mitigation**: Update all instantiation sites in same PR
- **Detection**: TypeScript will catch compilation errors

#### Test Coverage
- **Risk**: New tests might not cover all edge cases
- **Mitigation**: Keep same test cases, just update mocking approach
- **Detection**: Code coverage reports should remain >= 80%

#### Production Impact
- **Risk**: Provider factory might fail with new pattern
- **Mitigation**: Test factory thoroughly before deploying
- **Detection**: Integration tests will catch factory issues

---

### Timeline Estimate

**Total Time**: 2-3 hours

1. **Provider Refactoring** (30 min)
   - Update `ShopifyProvider` constructor
   - Update `WooCommerceProvider` constructor

2. **Factory Updates** (30 min)
   - Update `detectShopify`
   - Update `detectWooCommerce`

3. **Test Fixes** (60 min)
   - Fix all provider unit tests
   - Update integration tests
   - Verify test coverage

4. **Manual Testing** (30 min)
   - Test with real Shopify store
   - Test with real WooCommerce store
   - Verify end-to-end flows

5. **Documentation** (30 min)
   - Update code comments
   - Update migration guides
   - Update examples in docs

---

### Success Criteria

✅ All tests pass
✅ No module mocking required
✅ Tests run in < 2 seconds
✅ Code follows SOLID principles
✅ Provider factory works correctly
✅ Manual testing validates functionality
✅ Documentation is updated

---

## Visual Explanation

### Current Architecture (Problematic)

```
Test                           ShopifyProvider                    External Dependencies
----                           ---------------                    ---------------------
new ShopifyProvider('domain')
                    ---------> constructor(domain) 
                               
                               lookupOrder()
                                   |
                                   v
                               getDynamicShopifyClient(domain) ---> createServiceRoleClient()
                                   |                                      |
                                   |                                      v
                                   |                                 Supabase Query
                                   |                                      |
                                   |                                      v
                                   |                                 decrypt(credentials)
                                   |                                      |
                                   v                                      |
                               ShopifyAPI instance <--------------------+
                                   |
                                   v
                               getOrder(123)

PROBLEM: Cannot test business logic without database, encryption, and network calls!
```

### Proposed Architecture (Clean)

```
Test                           ShopifyProvider                    External Dependencies
----                           ---------------                    ---------------------
mockClient = {                 
  getOrder: jest.fn()          
}                              
                               
new ShopifyProvider(mockClient)
                    ---------> constructor(client)
                                   |
                                   v
                               this.shopifyClient = client
                               
                               lookupOrder()
                                   |
                                   v
                               this.shopifyClient.getOrder(123)
                                   |
                                   v
                               [Mock returns data]

SOLUTION: Test business logic in isolation, no external dependencies!
```

### Factory Pattern Integration

```
Production Code                Commerce Provider Factory          Dynamic Client Loader
---------------                -------------------------          ---------------------
getCommerceProvider('domain')
                    ---------> detectShopify()
                                   |
                                   v
                               getDynamicShopifyClient(domain) ---> Database + Encryption
                                   |                                      |
                                   v                                      |
                               ShopifyAPI instance <--------------------+
                                   |
                                   v
                               new ShopifyProvider(client)
                                   |
                                   v
                               return provider

NOTE: Factory handles infrastructure, Provider handles business logic!
```

---
