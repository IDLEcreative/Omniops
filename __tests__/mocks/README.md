**Last Updated:** 2025-11-18
**Verified Accurate For:** v0.1.0
**Status:** Active
**Type:** Reference

# Mocks Directory

**Type:** Test Infrastructure
**Status:** Active
**Last Updated:** 2025-11-18
**Verified For:** v0.1.0
**Estimated Read Time:** 9 minutes


**Purpose:** Mock Service Worker (MSW) handlers and server configuration for intercepting and mocking external API calls during tests.

**Test Type:** Test Infrastructure

**Last Updated:** 2025-10-30

**Coverage:** OpenAI API, WooCommerce API, Authentication endpoints, and other external services.

**Dependencies:** MSW (Mock Service Worker)

## Overview

The mocks directory contains MSW handlers that intercept network requests during tests and return mock responses. This allows tests to run without making actual API calls to external services, making tests faster, more reliable, and independent of external service availability.

## Directory Structure

```
__tests__/mocks/
├── handlers.ts              # Main handler exports
├── handlers-auth.ts         # Authentication endpoint handlers
├── handlers-openai.ts       # OpenAI API handlers
├── handlers-woocommerce.ts  # WooCommerce API handlers
└── server.ts                # MSW server setup
```

## Files

### Server Configuration

**server.ts**

MSW server setup and configuration.

**Exports:**
```typescript
import { setupServer } from 'msw/node'
import { handlers } from './handlers'

// Setup requests interception using the given handlers
export const server = setupServer(...handlers)

// Establish API mocking before all tests
beforeAll(() => server.listen())

// Reset any request handlers that are declared as a part of tests
afterEach(() => server.resetHandlers())

// Clean up after tests are finished
afterAll(() => server.close())
```

**Usage in Tests:**
```typescript
// Automatically loaded via Jest setup files
import { server } from '@/__tests__/mocks/server'

// Override handler for specific test
it('should handle API error', async () => {
  server.use(
    rest.post('/api/chat', (req, res, ctx) => {
      return res(ctx.status(500), ctx.json({ error: 'Server error' }))
    })
  )

  // Test error handling
})
```

### Main Handlers

**handlers.ts**

Aggregates and exports all MSW handlers.

**Structure:**
```typescript
import { authHandlers } from './handlers-auth'
import { openaiHandlers } from './handlers-openai'
import { woocommerceHandlers } from './handlers-woocommerce'

export const handlers = [
  ...authHandlers,
  ...openaiHandlers,
  ...woocommerceHandlers
]
```

### Authentication Handlers

**handlers-auth.ts**

Mocks authentication and authorization endpoints.

**Example Handlers:**
```typescript
import { rest } from 'msw'

export const authHandlers = [
  // Customer authentication
  rest.post('/api/auth/customer', (req, res, ctx) => {
    const { domain } = req.body

    if (domain === 'valid-customer.com') {
      return res(
        ctx.status(200),
        ctx.json({
          customer: {
            id: 'cust-123',
            domain: 'valid-customer.com',
            config: {
              businessName: 'Test Business',
              welcomeMessage: 'Welcome!'
            }
          }
        })
      )
    }

    return res(
      ctx.status(404),
      ctx.json({ error: 'Customer not found' })
    )
  }),

  // User authentication
  rest.post('/api/auth/login', (req, res, ctx) => {
    const { email, password } = req.body

    if (email === 'test@example.com' && password === 'password') {
      return res(
        ctx.status(200),
        ctx.json({
          user: {
            id: 'user-123',
            email: 'test@example.com',
            name: 'Test User'
          },
          token: 'mock-jwt-token'
        })
      )
    }

    return res(
      ctx.status(401),
      ctx.json({ error: 'Invalid credentials' })
    )
  }),

  // Session verification
  rest.get('/api/auth/session', (req, res, ctx) => {
    const authHeader = req.headers.get('Authorization')

    if (authHeader === 'Bearer mock-jwt-token') {
      return res(
        ctx.status(200),
        ctx.json({
          user: {
            id: 'user-123',
            email: 'test@example.com'
          }
        })
      )
    }

    return res(
      ctx.status(401),
      ctx.json({ error: 'Unauthorized' })
    )
  })
]
```

### OpenAI Handlers

**handlers-openai.ts**

Mocks OpenAI API endpoints for chat completions and embeddings.

**Example Handlers:**
```typescript
import { rest } from 'msw'

export const openaiHandlers = [
  // Chat completions
  rest.post('https://api.openai.com/v1/chat/completions', (req, res, ctx) => {
    const { messages } = req.body

    return res(
      ctx.status(200),
      ctx.json({
        id: 'chatcmpl-123',
        object: 'chat.completion',
        created: Date.now(),
        model: 'gpt-4',
        choices: [
          {
            index: 0,
            message: {
              role: 'assistant',
              content: 'This is a mocked AI response to: ' +
                       messages[messages.length - 1].content
            },
            finish_reason: 'stop'
          }
        ],
        usage: {
          prompt_tokens: 10,
          completion_tokens: 20,
          total_tokens: 30
        }
      })
    )
  }),

  // Embeddings
  rest.post('https://api.openai.com/v1/embeddings', (req, res, ctx) => {
    const { input } = req.body

    return res(
      ctx.status(200),
      ctx.json({
        object: 'list',
        data: [
          {
            object: 'embedding',
            embedding: Array(1536).fill(0).map(() => Math.random()),
            index: 0
          }
        ],
        model: 'text-embedding-ada-002',
        usage: {
          prompt_tokens: 5,
          total_tokens: 5
        }
      })
    )
  }),

  // Error scenario
  rest.post('https://api.openai.com/v1/chat/completions', (req, res, ctx) => {
    // Simulates rate limiting
    if (req.headers.get('X-Simulate-Rate-Limit') === 'true') {
      return res(
        ctx.status(429),
        ctx.json({
          error: {
            message: 'Rate limit exceeded',
            type: 'rate_limit_error'
          }
        })
      )
    }
  })
]
```

### WooCommerce Handlers

**handlers-woocommerce.ts**

Mocks WooCommerce REST API endpoints.

**Example Handlers:**
```typescript
import { rest } from 'msw'

const mockProducts = [
  {
    id: 1,
    name: 'Premium Widget',
    price: '29.99',
    description: 'High-quality widget',
    sku: 'WIDGET-001',
    stock_status: 'instock',
    stock_quantity: 50
  },
  {
    id: 2,
    name: 'Deluxe Gadget',
    price: '49.99',
    description: 'Advanced gadget',
    sku: 'GADGET-001',
    stock_status: 'instock',
    stock_quantity: 25
  }
]

export const woocommerceHandlers = [
  // Get products
  rest.get('*/wp-json/wc/v3/products', (req, res, ctx) => {
    const search = req.url.searchParams.get('search')
    const per_page = parseInt(req.url.searchParams.get('per_page') || '10')
    const page = parseInt(req.url.searchParams.get('page') || '1')

    let filtered = mockProducts

    if (search) {
      filtered = mockProducts.filter(p =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.description.toLowerCase().includes(search.toLowerCase())
      )
    }

    const start = (page - 1) * per_page
    const end = start + per_page
    const paginated = filtered.slice(start, end)

    return res(
      ctx.status(200),
      ctx.set('X-WP-Total', filtered.length.toString()),
      ctx.set('X-WP-TotalPages', Math.ceil(filtered.length / per_page).toString()),
      ctx.json(paginated)
    )
  }),

  // Get single product
  rest.get('*/wp-json/wc/v3/products/:id', (req, res, ctx) => {
    const { id } = req.params
    const product = mockProducts.find(p => p.id === parseInt(id as string))

    if (product) {
      return res(ctx.status(200), ctx.json(product))
    }

    return res(
      ctx.status(404),
      ctx.json({ code: 'woocommerce_rest_product_invalid_id' })
    )
  }),

  // Get orders
  rest.get('*/wp-json/wc/v3/orders', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json([
        {
          id: 1,
          status: 'processing',
          total: '79.98',
          customer_id: 1,
          line_items: [
            { product_id: 1, quantity: 2 }
          ]
        }
      ])
    )
  }),

  // Authentication error
  rest.get('*/wp-json/wc/v3/*', (req, res, ctx) => {
    const auth = req.headers.get('Authorization')

    if (!auth) {
      return res(
        ctx.status(401),
        ctx.json({ code: 'woocommerce_rest_cannot_view' })
      )
    }
  })
]
```

## Usage Patterns

### Basic Handler Usage

```typescript
// Tests automatically use handlers from server setup
it('should fetch products', async () => {
  const response = await fetch('/api/products')
  const data = await response.json()

  expect(data).toHaveLength(2)
})
```

### Overriding Handlers for Specific Tests

```typescript
import { server } from '@/__tests__/mocks/server'
import { rest } from 'msw'

it('should handle product fetch error', async () => {
  // Override default handler for this test
  server.use(
    rest.get('/api/products', (req, res, ctx) => {
      return res(
        ctx.status(500),
        ctx.json({ error: 'Internal server error' })
      )
    })
  )

  const response = await fetch('/api/products')
  expect(response.status).toBe(500)
})
```

### Simulating Network Delays

```typescript
server.use(
  rest.post('/api/chat', (req, res, ctx) => {
    return res(
      ctx.delay(2000), // 2 second delay
      ctx.status(200),
      ctx.json({ message: 'Delayed response' })
    )
  })
)
```

### Conditional Responses

```typescript
let requestCount = 0

server.use(
  rest.get('/api/data', (req, res, ctx) => {
    requestCount++

    // Fail first request, succeed second
    if (requestCount === 1) {
      return res(ctx.status(500))
    }

    return res(ctx.status(200), ctx.json({ data: 'success' }))
  })
)
```

## Best Practices

1. **Keep handlers focused**: Each handler should handle one endpoint
2. **Use realistic responses**: Match actual API response structures
3. **Test error scenarios**: Create handlers for error cases
4. **Reset between tests**: Use `afterEach(() => server.resetHandlers())`
5. **Document complex mocks**: Add comments explaining non-obvious behavior
6. **Version handlers**: Keep handlers in sync with actual API versions

## Testing MSW Setup

### Verify Handlers Work

```typescript
describe('MSW Setup', () => {
  it('should intercept API calls', async () => {
    const response = await fetch('/api/auth/customer', {
      method: 'POST',
      body: JSON.stringify({ domain: 'valid-customer.com' })
    })

    expect(response.status).toBe(200)
    const data = await response.json()
    expect(data.customer).toBeDefined()
  })
})
```

### Debug Handler Issues

```typescript
// Enable MSW logging
server.listen({
  onUnhandledRequest: 'warn' // Warn about unhandled requests
})

// Log all requests
server.events.on('request:start', (req) => {
  console.log('MSW intercepted:', req.method, req.url.href)
})
```

## Common Issues

### Handler Not Triggering

**Problem:** Request not being intercepted

**Solution:**
1. Check URL matches handler pattern
2. Verify server.listen() is called in beforeAll
3. Ensure request is made after setup
4. Check for typos in handler paths

### Wrong Handler Responding

**Problem:** Unexpected handler being used

**Solution:**
1. Check handler order (more specific handlers first)
2. Verify server.resetHandlers() in afterEach
3. Review handler patterns for conflicts

### Type Errors

**Problem:** TypeScript errors in handlers

**Solution:**
1. Import correct types from MSW
2. Type request body: `req.body as { field: string }`
3. Use proper MSW context methods

## Related Code

- **Test Setup**: `/test-utils/jest.setup.js` - Initializes MSW
- **Tests**: All test files automatically use these handlers
- **API Routes**: `/app/api/` - Actual API implementations being mocked

## Related Documentation

- [Main Tests README](/Users/jamesguy/Omniops/__tests__/README.md) - Overall testing strategy
- [Utils README](/Users/jamesguy/Omniops/__tests__/utils/README.md) - Test utilities
- [MSW Documentation](https://mswjs.io/) - Official MSW docs
