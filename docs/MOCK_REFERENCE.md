# Mock Reference Guide

## Overview

This guide documents all available mocks and how to use them effectively in your tests.

## Table of Contents

- [Supabase Mocks](#supabase-mocks)
- [WooCommerce Mocks](#woocommerce-mocks)
- [OpenAI Mocks](#openai-mocks)
- [Next.js Mocks](#nextjs-mocks)
- [Custom Mock Helpers](#custom-mock-helpers)
- [MSW Handlers](#msw-handlers)

## Supabase Mocks

### Location
- `__mocks__/@supabase/supabase-js.js`
- `lib/supabase/__mocks__/server.ts`
- `lib/supabase/__mocks__/client.ts`

### Basic Usage

```typescript
import { createClient } from '@supabase/supabase-js';

// Automatically mocked in tests
const supabase = createClient('url', 'key');

// Available methods
supabase.from('table')
  .select('*')
  .eq('id', 1)
  .single();

supabase.from('table')
  .insert({ data: 'value' })
  .select();

supabase.auth.getUser();
supabase.auth.signIn({ email, password });
```

### Advanced Mocking

```typescript
import { mockSupabaseClient } from '@/test-utils/mock-helpers';

beforeEach(() => {
  const supabase = mockSupabaseClient();
  
  // Custom responses
  supabase.from.mockImplementation((table) => ({
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockResolvedValue({
      data: table === 'users' ? [{ id: 1 }] : [],
      error: null
    })
  }));
});
```

### Common Patterns

```typescript
// Query with filtering
const mockQuery = {
  from: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  order: jest.fn().mockReturnThis(),
  limit: jest.fn().mockResolvedValue({
    data: [{ id: 1, name: 'Test' }],
    error: null
  })
};

// Auth operations
const mockAuth = {
  getUser: jest.fn().mockResolvedValue({
    data: { user: { id: 'user-1', email: 'test@example.com' }},
    error: null
  }),
  signOut: jest.fn().mockResolvedValue({ error: null })
};
```

## WooCommerce Mocks

### Location
- `__mocks__/@woocommerce/woocommerce-rest-api.js`
- `__mocks__/@/lib/woocommerce.ts`

### Basic Usage

```typescript
import WooCommerceRestApi from '@woocommerce/woocommerce-rest-api';

const wc = new WooCommerceRestApi({
  url: 'https://example.com',
  consumerKey: 'ck_test',
  consumerSecret: 'cs_test'
});

// Automatically returns mock data
const { data } = await wc.get('products');
const { data: product } = await wc.get('products/1');
```

### Mock Data Structure

```typescript
// Product mock
{
  id: 1,
  name: 'Test Product',
  price: '19.99',
  regular_price: '19.99',
  sale_price: '',
  description: 'Test description',
  sku: 'TEST-001',
  stock_quantity: 100,
  images: [{ id: 1, src: 'https://example.com/image.jpg' }]
}

// Order mock
{
  id: 1,
  status: 'processing',
  total: '99.99',
  currency: 'USD',
  customer_id: 1,
  line_items: [
    {
      id: 1,
      product_id: 1,
      quantity: 2,
      total: '39.98'
    }
  ]
}
```

### Custom Responses

```typescript
import { mockWooCommerceClient } from '@/test-utils/mock-helpers';

const wc = mockWooCommerceClient({
  products: [
    { id: 1, name: 'Custom Product', price: '29.99' }
  ],
  orders: [
    { id: 1, status: 'completed', total: '29.99' }
  ]
});
```

## OpenAI Mocks

### Location
- `__mocks__/openai.ts`

### Basic Usage

```typescript
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: 'test-key' });

// Chat completion
const response = await openai.chat.completions.create({
  model: 'gpt-4',
  messages: [{ role: 'user', content: 'Hello' }]
});
// Returns: { choices: [{ message: { content: 'Mocked response' }}]}

// Embeddings
const embeddings = await openai.embeddings.create({
  model: 'text-embedding-ada-002',
  input: 'test text'
});
// Returns: { data: [{ embedding: [0.1, 0.2, ...] }]}
```

### Custom OpenAI Responses

```typescript
beforeEach(() => {
  const mockOpenAI = {
    chat: {
      completions: {
        create: jest.fn().mockResolvedValue({
          choices: [{
            message: {
              content: 'Custom response',
              role: 'assistant'
            }
          }]
        })
      }
    }
  };
  
  (OpenAI as jest.Mock).mockImplementation(() => mockOpenAI);
});
```

## Next.js Mocks

### NextRequest Mock

```typescript
import { mockNextRequest } from '@/test-utils/mock-helpers';

// GET request
const getRequest = mockNextRequest('/api/test');

// POST request with body
const postRequest = mockNextRequest('/api/test', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-domain': 'example.com'
  },
  body: { key: 'value' }
});

// With query parameters
const requestWithQuery = mockNextRequest('/api/test?page=1&limit=10');
```

### NextResponse Mock

```typescript
import { NextResponse } from 'next/server';

// In your test
const response = NextResponse.json({ success: true }, { status: 200 });
const data = await response.json();
expect(data.success).toBe(true);
```

### Headers and Cookies

```typescript
// Headers mock
jest.mock('next/headers', () => ({
  headers: jest.fn(() => ({
    get: jest.fn((key) => {
      const headers = { 'x-domain': 'test.com' };
      return headers[key];
    })
  })),
  cookies: jest.fn(() => ({
    get: jest.fn((name) => ({ value: 'cookie-value' })),
    set: jest.fn()
  }))
}));
```

## Custom Mock Helpers

### Location
- `test-utils/mock-helpers.ts`

### Available Helpers

```typescript
import {
  mockSupabaseClient,
  mockWooCommerceClient,
  mockNextRequest,
  createMockProduct,
  createMockOrder,
  createMockCustomer
} from '@/test-utils/mock-helpers';

// Supabase client with defaults
const supabase = mockSupabaseClient();

// WooCommerce with custom data
const wc = mockWooCommerceClient({
  products: [createMockProduct({ name: 'Custom' })]
});

// NextRequest with all options
const request = mockNextRequest('/api/test', {
  method: 'PUT',
  headers: { 'Authorization': 'Bearer token' },
  body: { update: 'data' }
});
```

### Creating Custom Helpers

```typescript
// test-utils/my-helpers.ts
export function mockMyService() {
  return {
    getData: jest.fn().mockResolvedValue({ data: [] }),
    saveData: jest.fn().mockResolvedValue({ success: true }),
    deleteData: jest.fn().mockResolvedValue({ success: true })
  };
}

// Usage in tests
import { mockMyService } from '@/test-utils/my-helpers';

const service = mockMyService();
service.getData.mockResolvedValue({ data: [1, 2, 3] });
```

## MSW Handlers

### Location
- `__tests__/mocks/handlers.ts`

### Available Endpoints

```typescript
// OpenAI
POST https://api.openai.com/v1/chat/completions
POST https://api.openai.com/v1/embeddings

// Supabase
GET/POST/PATCH/DELETE http://localhost:54321/rest/v1/*
POST http://localhost:54321/auth/v1/token

// WooCommerce
GET/POST/PUT/DELETE https://*/wp-json/wc/v3/*
```

### Adding New Handlers

```typescript
// __tests__/mocks/handlers.ts
import { rest } from 'msw';

export const handlers = [
  // Add new handler
  rest.get('/api/custom', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({ custom: 'data' })
    );
  }),
  
  // Dynamic handler with params
  rest.get('/api/items/:id', (req, res, ctx) => {
    const { id } = req.params;
    return res(
      ctx.json({ id, name: `Item ${id}` })
    );
  })
];
```

### Conditional Responses

```typescript
rest.post('/api/data', (req, res, ctx) => {
  const { type } = req.body;
  
  if (type === 'error') {
    return res(ctx.status(400), ctx.json({ error: 'Bad request' }));
  }
  
  return res(ctx.json({ success: true }));
});
```

## Best Practices

### 1. Reset Mocks Between Tests

```typescript
beforeEach(() => {
  jest.clearAllMocks();
});

afterEach(() => {
  jest.restoreAllMocks();
});
```

### 2. Use Mock Implementations for Complex Logic

```typescript
mockFunction.mockImplementation((arg) => {
  if (arg === 'special') {
    return { special: true };
  }
  return { normal: true };
});
```

### 3. Verify Mock Calls

```typescript
expect(mockFunction).toHaveBeenCalledTimes(1);
expect(mockFunction).toHaveBeenCalledWith('expected', 'arguments');
expect(mockFunction).toHaveBeenLastCalledWith('last', 'call');
```

### 4. Mock Only What You Need

```typescript
// Instead of mocking entire module
jest.mock('@/lib/complex-module');

// Mock specific functions
jest.mock('@/lib/complex-module', () => ({
  ...jest.requireActual('@/lib/complex-module'),
  specificFunction: jest.fn()
}));
```

### 5. Use Mock Return Values Chains

```typescript
mockFunction
  .mockReturnValueOnce('first call')
  .mockReturnValueOnce('second call')
  .mockReturnValue('all other calls');
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Mock not being used | Check import order and jest.mock placement |
| Mock data type mismatch | Verify mock structure matches expected types |
| Async mock not resolving | Use mockResolvedValue instead of mockReturnValue |
| Mock not resetting | Add jest.clearAllMocks() in beforeEach |
| MSW intercepting module mocks | Disable MSW for specific test suites |

## Examples by Feature

### Authentication Test

```typescript
import { createClient } from '@supabase/supabase-js';

test('user can login', async () => {
  const supabase = createClient('url', 'key');
  
  // Mock will automatically return success
  const { data, error } = await supabase.auth.signIn({
    email: 'test@example.com',
    password: 'password'
  });
  
  expect(error).toBeNull();
  expect(data).toBeDefined();
});
```

### E-commerce Test

```typescript
import { mockWooCommerceClient } from '@/test-utils/mock-helpers';

test('can fetch products', async () => {
  const wc = mockWooCommerceClient({
    products: [
      { id: 1, name: 'Product 1', price: '10.00' },
      { id: 2, name: 'Product 2', price: '20.00' }
    ]
  });
  
  const products = await wc.get('products');
  expect(products.data).toHaveLength(2);
  expect(products.data[0].price).toBe('10.00');
});
```

### API Route Test

```typescript
import { POST } from '@/app/api/chat/route';
import { mockNextRequest } from '@/test-utils/mock-helpers';

test('chat endpoint processes messages', async () => {
  const request = mockNextRequest('/api/chat', {
    method: 'POST',
    body: {
      message: 'Hello',
      sessionId: 'session-1'
    }
  });
  
  const response = await POST(request);
  expect(response.status).toBe(200);
  
  const data = await response.json();
  expect(data.response).toBeDefined();
});
```

---

*For more details, see the [main test documentation](../TEST_DOCUMENTATION.md)*