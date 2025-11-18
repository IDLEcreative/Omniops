**Last Updated:** 2025-11-18
**Verified Accurate For:** v0.1.0
**Status:** Active
**Type:** Reference

# Test Mock Utilities

**Type:** Reference
**Status:** Active
**Last Updated:** 2025-11-18
**Verified For:** v0.1.0
**Dependencies:** Jest, @testing-library/react
**Estimated Read Time:** 10 minutes

## Purpose

Centralized mock utilities organized by category (Supabase, WooCommerce, API, Environment) providing data factories and client mocks for comprehensive testing across the application.

## Quick Links

- [Testing Guide](/home/user/Omniops/docs/04-DEVELOPMENT/testing/TESTING_GUIDE.md)
- [Test Utils Parent](/home/user/Omniops/test-utils/README.md)
- [MSW Setup](/home/user/Omniops/__tests__/mocks/README.md)

## Table of Contents

- [Directory Structure](#directory-structure)
- [Import Patterns](#import-patterns)
- [Module Details](#module-details)
  - [supabase-mocks.ts](#supabase-mocksts-64-loc)
  - [woocommerce-mocks.ts](#woocommerce-mocksts-180-loc)
  - [api-mocks.ts](#api-mocksts-68-loc)
  - [test-env.ts](#test-envts-23-loc)
- [Best Practices](#best-practices)
- [Common Patterns](#common-patterns)
- [Maintenance](#maintenance)

## Keywords

**Search Terms:** test mocks, mock utilities, Supabase mocks, WooCommerce mocks, data factories, API mocks, NextRequest mock, streaming response

**Aliases:**
- "Mock helpers" (utilities)
- "Test data factories" (creation functions)
- "Client mocks" (Supabase, WooCommerce)
- "Mock utilities" (category)

---

## Directory Structure

```
mocks/
├── supabase-mocks.ts      # Supabase client mocks
├── woocommerce-mocks.ts   # WooCommerce client + data factories
├── api-mocks.ts           # NextRequest + streaming response mocks
├── test-env.ts            # Environment setup/cleanup
└── README.md              # This file
```

## Import Patterns

### Option 1: Import from orchestrator (backward compatible)
```typescript
import {
  mockSupabaseClient,
  mockWooCommerceClient,
  mockNextRequest,
  createMockProduct,
  setupTestEnv
} from 'test-utils/mock-helpers';
```

### Option 2: Import directly from category (tree-shakeable)
```typescript
import { mockSupabaseClient } from 'test-utils/mocks/supabase-mocks';
import { mockWooCommerceClient } from 'test-utils/mocks/woocommerce-mocks';
import { mockNextRequest } from 'test-utils/mocks/api-mocks';
```

## Module Details

### supabase-mocks.ts (64 LOC)

**Exports:**
- `mockSupabaseClient(overrides?)` - Fully configured Supabase client mock

**Usage:**
```typescript
import { mockSupabaseClient } from 'test-utils/mocks/supabase-mocks';

const supabase = mockSupabaseClient({
  from: jest.fn().mockReturnValue({
    select: jest.fn().mockResolvedValue({ data: [{ id: 1 }], error: null })
  })
});
```

**Features:**
- Auth methods (signIn, signUp, signOut, getSession, getUser)
- Database query methods (from, select, insert, update, delete)
- Storage methods (upload, getPublicUrl)
- RPC methods

### woocommerce-mocks.ts (180 LOC)

**Exports:**
- `mockWooCommerceClient(overrides?)` - WooCommerce API client mock
- `createMockProduct(overrides?)` - Product data factory
- `createMockOrder(overrides?)` - Order data factory
- `createMockCustomer(overrides?)` - Customer data factory

**Usage:**
```typescript
import {
  mockWooCommerceClient,
  createMockProduct
} from 'test-utils/mocks/woocommerce-mocks';

const wooCommerce = mockWooCommerceClient();
const product = createMockProduct({ name: 'Custom Product', price: '29.99' });

// Client automatically returns appropriate mock data based on endpoint
await wooCommerce.get('products/1'); // Returns product data
await wooCommerce.get('orders'); // Returns empty orders array
```

**Client Features:**
- Smart endpoint detection (products, orders, customers)
- Dynamic product ID handling
- Default data for all endpoints
- Full CRUD operations (get, post, put, delete)

**Data Factory Features:**
- Realistic default data
- Override any field via parameter
- Complete data structures (billing, shipping, line items)

### api-mocks.ts (68 LOC)

**Exports:**
- `mockNextRequest(url, options?)` - NextRequest mock for API routes
- `mockStreamResponse(chunks)` - Streaming response mock

**Usage:**
```typescript
import { mockNextRequest, mockStreamResponse } from 'test-utils/mocks/api-mocks';

// Mock API request
const request = mockNextRequest('/api/test', {
  method: 'POST',
  body: { query: 'test' },
  headers: { 'x-api-key': 'test-key' },
  searchParams: { page: '1' }
});

// Mock streaming response
const response = mockStreamResponse(['chunk1', 'chunk2', 'chunk3']);
```

**Request Features:**
- Automatic URL construction
- Search params handling
- Headers configuration
- JSON body serialization

**Streaming Features:**
- Simulates chunked streaming
- Proper SSE headers
- Realistic timing delays

### test-env.ts (23 LOC)

**Exports:**
- `setupTestEnv()` - Configure test environment variables
- `cleanupTestEnv()` - Clean up mocks and modules

**Usage:**
```typescript
import { setupTestEnv, cleanupTestEnv } from 'test-utils/mocks/test-env';

beforeAll(() => {
  setupTestEnv(); // Sets all required env vars
});

afterEach(() => {
  cleanupTestEnv(); // Clears mocks and resets modules
});
```

**Environment Variables Set:**
- `WOOCOMMERCE_URL`, `WOOCOMMERCE_CONSUMER_KEY`, `WOOCOMMERCE_CONSUMER_SECRET`
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- `OPENAI_API_KEY`

## Best Practices

### 1. Use Specific Overrides
```typescript
// ✅ Good - Override only what you need
const product = createMockProduct({ price: '99.99' });

// ❌ Bad - Creating entire object
const product = { id: 1, name: 'Test', /* 20 more fields... */ };
```

### 2. Clean Up After Tests
```typescript
afterEach(() => {
  cleanupTestEnv(); // Always clean up
});
```

### 3. Import from Category for Better Tree-Shaking
```typescript
// ✅ Better - Only imports what you need
import { mockSupabaseClient } from 'test-utils/mocks/supabase-mocks';

// ⚠️ OK but less optimal - Imports orchestrator
import { mockSupabaseClient } from 'test-utils/mock-helpers';
```

### 4. Configure Clients with Overrides
```typescript
// ✅ Good - Override specific methods
const client = mockWooCommerceClient({
  get: jest.fn().mockResolvedValue({ data: customData })
});

// ❌ Bad - Creating entire mock manually
const client = { get: jest.fn(), post: jest.fn(), /* etc */ };
```

## Common Patterns

### Testing API Routes
```typescript
import { mockNextRequest } from 'test-utils/mocks/api-mocks';
import { POST } from 'app/api/my-endpoint/route';

test('handles POST request', async () => {
  const request = mockNextRequest('/api/my-endpoint', {
    method: 'POST',
    body: { data: 'test' }
  });

  const response = await POST(request);
  expect(response.status).toBe(200);
});
```

### Testing with Supabase
```typescript
import { mockSupabaseClient } from 'test-utils/mocks/supabase-mocks';

test('fetches user data', async () => {
  const supabase = mockSupabaseClient();
  const { data } = await supabase.auth.getUser();
  expect(data.user.email).toBe('test@example.com');
});
```

### Testing WooCommerce Integration
```typescript
import { mockWooCommerceClient, createMockProduct } from 'test-utils/mocks/woocommerce-mocks';

test('syncs products', async () => {
  const client = mockWooCommerceClient();
  const product = createMockProduct({ name: 'Pump A1' });

  client.get.mockResolvedValueOnce({ data: [product] });

  const { data } = await client.get('products');
  expect(data).toHaveLength(1);
  expect(data[0].name).toBe('Pump A1');
});
```

## Maintenance

When adding new mock utilities:
1. Determine category (Supabase, WooCommerce, API, Environment)
2. Add to appropriate category file
3. Keep file under 200 LOC
4. Export from orchestrator (mock-helpers.ts)
5. Update this README with usage examples

When modifying mocks:
1. Update in category file
2. Ensure backward compatibility
3. Update usage examples if needed
4. Verify all tests still pass
