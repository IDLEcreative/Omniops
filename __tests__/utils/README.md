# Test Utils Directory

**Purpose:** Shared testing utilities, helpers, setup/teardown scripts, and mock factories used across all test suites.

**Test Type:** Test Infrastructure

**Last Updated:** 2025-11-15

**Coverage:** Test setup, teardown, data generators, assertion helpers, performance utilities, and mock factories.

**Dependencies:** Jest, React Testing Library, MSW

## Overview

The utils directory contains reusable testing infrastructure that supports all test suites. These utilities handle test environment setup, provide mock data factories, offer assertion helpers, and enable performance monitoring during tests.

## Directory Structure

```
__tests__/utils/
├── global-setup.js                              # One-time global test setup
├── global-teardown.js                           # Global test cleanup
├── integration-setup.js                         # Integration test environment setup
├── integration-test-helpers.ts                  # Main integration helper exports
├── integration-test-helpers-assertions.ts       # Custom assertion utilities
├── integration-test-helpers-data.ts             # Test data factories
├── integration-test-helpers-html-generators.ts  # HTML mock generators
├── integration-test-helpers-mocks.ts            # Mock service factories
├── integration-test-helpers-performance.ts      # Performance monitoring
├── integration-test-helpers-setup.ts            # Setup utilities
├── embeddings-test-helpers.ts                   # Embeddings service test helpers
├── supabase-mock.ts                             # Supabase client mocks
├── test-utils.tsx                               # React Testing Library utilities
└── woocommerce/
    ├── cart-test-fixtures.ts                    # WooCommerce cart test mocks & factories
    └── e2e-helpers.ts                           # E2E test helpers
```

## Files

### Global Setup and Teardown

**global-setup.js**

Runs once before all test suites.

**Responsibilities:**
- Initialize test database
- Set up test environment variables
- Configure global test utilities
- Start background services (if needed)

**Example:**
```javascript
module.exports = async function globalSetup() {
  process.env.NODE_ENV = 'test'
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://localhost:54321'

  console.log('Global test setup complete')
}
```

**global-teardown.js**

Runs once after all test suites.

**Responsibilities:**
- Clean up test database
- Stop background services
- Remove temporary files
- Reset environment

**Example:**
```javascript
module.exports = async function globalTeardown() {
  await cleanupTestDatabase()
  console.log('Global test teardown complete')
}
```

### Integration Test Helpers

**integration-setup.js**

Per-suite setup for integration tests.

**Responsibilities:**
- Configure test environment per suite
- Initialize mock services
- Set up database state
- Configure MSW handlers

**integration-test-helpers.ts**

Main exports file that aggregates all helper modules.

**Exports:**
```typescript
export * from './integration-test-helpers-assertions'
export * from './integration-test-helpers-data'
export * from './integration-test-helpers-html-generators'
export * from './integration-test-helpers-mocks'
export * from './integration-test-helpers-performance'
export * from './integration-test-helpers-setup'
```

**integration-test-helpers-assertions.ts**

Custom assertion utilities for integration tests.

**Key Exports:**
```typescript
// Expect helper extensions
export const expectValidProduct = (product: any) => {
  expect(product).toHaveProperty('id')
  expect(product).toHaveProperty('name')
  expect(product).toHaveProperty('price')
  expect(product.price).toBeGreaterThan(0)
}

export const expectValidConversation = (conversation: any) => {
  expect(conversation).toHaveProperty('id')
  expect(conversation).toHaveProperty('customer_id')
  expect(conversation).toHaveProperty('messages')
  expect(Array.isArray(conversation.messages)).toBe(true)
}

// Custom matchers
export const toBeValidEmail = (email: string) => {
  const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  return {
    message: () => `Expected ${email} to be a valid email`,
    pass: isValid
  }
}
```

**integration-test-helpers-data.ts**

Test data factories and generators.

**Key Exports:**
```typescript
// Mock data generators
export const createMockProduct = (overrides = {}) => ({
  id: 'prod-123',
  name: 'Test Product',
  description: 'A test product',
  price: 29.99,
  sku: 'TEST-SKU-001',
  inStock: true,
  ...overrides
})

export const createMockConversation = (overrides = {}) => ({
  id: 'conv-123',
  customer_id: 'cust-123',
  status: 'active',
  created_at: new Date().toISOString(),
  messages: [],
  ...overrides
})

export const createMockUser = (overrides = {}) => ({
  id: 'user-123',
  email: 'test@example.com',
  name: 'Test User',
  ...overrides
})

// Data generators for bulk testing
export const generateProducts = (count: number) =>
  Array.from({ length: count }, (_, i) =>
    createMockProduct({ id: `prod-${i}`, name: `Product ${i}` })
  )
```

**integration-test-helpers-html-generators.ts**

HTML mock generators for scraping and extraction tests.

**Key Exports:**
```typescript
export class TestDataGenerator {
  // E-commerce HTML
  static generateEcommerceHTML(productCount: number = 1): string {
    return `<!DOCTYPE html>
      <html>
        <head><title>E-commerce Test Store</title></head>
        <body>
          ${this.generateProductHTML(productCount)}
        </body>
      </html>`
  }

  // Generate product HTML
  static generateProductHTML(count: number): string {
    return Array.from({ length: count }, (_, i) => `
      <div class="product" data-id="prod-${i}">
        <h2 class="product-name">Product ${i}</h2>
        <span class="price">$${(20 + i * 5).toFixed(2)}</span>
        <p class="description">Description for product ${i}</p>
      </div>
    `).join('')
  }

  // Generate large content for performance testing
  static createLargeContentHTML(sectionCount: number): string {
    const sections = Array.from({ length: sectionCount }, (_, i) => `
      <section id="section-${i}">
        <h2>Section ${i + 1}</h2>
        <p>${this.generateLongText(200)}</p>
      </section>
    `).join('')

    return `<html><body>${sections}</body></html>`
  }

  // Generate realistic text
  static generateLongText(wordCount: number): string {
    const words = ['lorem', 'ipsum', 'dolor', 'sit', 'amet']
    return Array.from({ length: wordCount }, () =>
      words[Math.floor(Math.random() * words.length)]
    ).join(' ')
  }
}
```

**integration-test-helpers-mocks.ts**

Mock service factories for external APIs.

**Key Exports:**
```typescript
export class MockServiceFactory {
  // Create Supabase mock
  static createSupabaseMock() {
    return {
      from: jest.fn((table) => ({
        select: jest.fn(() => ({ data: [], error: null })),
        insert: jest.fn((data) => ({ data: [data], error: null })),
        update: jest.fn((data) => ({ data: [data], error: null })),
        delete: jest.fn(() => ({ data: null, error: null })),
        eq: jest.fn(() => this),
        in: jest.fn(() => this),
        order: jest.fn(() => this),
        limit: jest.fn(() => this)
      }))
    }
  }

  // Create OpenAI mock
  static createOpenAIMock() {
    return {
      chat: {
        completions: {
          create: jest.fn().mockResolvedValue({
            choices: [{ message: { content: 'Mocked response' } }],
            usage: { total_tokens: 150 }
          })
        }
      },
      embeddings: {
        create: jest.fn().mockResolvedValue({
          data: [{ embedding: Array(1536).fill(0.1) }]
        })
      }
    }
  }

  // Create Redis mock
  static createRedisMock() {
    const storage = new Map()

    return {
      get: jest.fn((key) => Promise.resolve(storage.get(key) || null)),
      set: jest.fn((key, value) => {
        storage.set(key, value)
        return Promise.resolve('OK')
      }),
      del: jest.fn((key) => {
        storage.delete(key)
        return Promise.resolve(1)
      })
    }
  }
}
```

**integration-test-helpers-performance.ts**

Performance monitoring utilities for tests.

**Key Exports:**
```typescript
export class PerformanceHelpers {
  private static timers = new Map<string, number>()
  private static metrics = new Map<string, number[]>()

  static startTimer(operation: string): void {
    this.timers.set(operation, performance.now())
  }

  static endTimer(operation: string): number {
    const startTime = this.timers.get(operation)
    if (!startTime) throw new Error(`Timer ${operation} was not started`)

    const duration = performance.now() - startTime
    this.timers.delete(operation)

    const existing = this.metrics.get(operation) || []
    existing.push(duration)
    this.metrics.set(operation, existing)

    return duration
  }

  static async measureAsync<T>(
    operation: string,
    fn: () => Promise<T>
  ): Promise<{ result: T; duration: number }> {
    this.startTimer(operation)
    const result = await fn()
    const duration = this.endTimer(operation)
    return { result, duration }
  }

  static getMemoryUsage() {
    const usage = process.memoryUsage()
    return {
      heapUsed: Math.round(usage.heapUsed / 1024 / 1024), // MB
      heapTotal: Math.round(usage.heapTotal / 1024 / 1024),
      external: Math.round(usage.external / 1024 / 1024),
      rss: Math.round(usage.rss / 1024 / 1024)
    }
  }

  static getMetricsSummary() {
    const summary: Record<string, any> = {}

    for (const [operation, times] of this.metrics.entries()) {
      const sorted = times.sort((a, b) => a - b)
      summary[operation] = {
        count: times.length,
        min: Math.round(sorted[0]),
        max: Math.round(sorted[sorted.length - 1]),
        avg: Math.round(times.reduce((a, b) => a + b, 0) / times.length),
        median: Math.round(sorted[Math.floor(sorted.length / 2)])
      }
    }

    return summary
  }

  static reset() {
    this.timers.clear()
    this.metrics.clear()
  }
}
```

**integration-test-helpers-setup.ts**

Setup utilities for test environment configuration.

**Key Exports:**
```typescript
// Database setup
export async function setupTestDatabase() {
  // Initialize test database schema
  // Seed test data
}

export async function cleanupTestDatabase() {
  // Remove test data
  // Reset sequences
}

// Environment setup
export function setupTestEnv() {
  process.env.NODE_ENV = 'test'
  process.env.OPENAI_API_KEY = 'test-key'
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://localhost:54321'
}

// Mock setup
export function setupGlobalMocks() {
  global.fetch = jest.fn()
  global.console = {
    ...console,
    error: jest.fn(),
    warn: jest.fn()
  }
}
```

### React Testing Utilities

**test-utils.tsx**

React Testing Library custom utilities.

**Key Exports:**
```typescript
import { render, RenderOptions } from '@testing-library/react'
import { ReactElement } from 'react'

// Providers wrapper
const AllProviders = ({ children }) => {
  return (
    <ThemeProvider>
      <AuthProvider>
        {children}
      </AuthProvider>
    </ThemeProvider>
  )
}

// Custom render function
export function renderWithProviders(
  ui: ReactElement,
  options?: RenderOptions
) {
  return render(ui, { wrapper: AllProviders, ...options })
}

// Re-export everything from RTL
export * from '@testing-library/react'
export { renderWithProviders as render }
```

### Embeddings Test Helpers

**embeddings-test-helpers.ts**

Specialized helpers for embeddings service tests.

**Key Exports:**
```typescript
// Mock OpenAI instance
export function createMockOpenAI(): jest.Mocked<OpenAI>

// Mock Supabase client for embeddings tests
export function createMockSupabaseForEmbeddings()

// Test data fixtures
export const testFixtures = {
  simpleText: 'First sentence. Second sentence...',
  punctuationText: 'Question? Exclamation!...',
  sampleEmbedding: Array(1536).fill(0.5),
  sampleChunks: ['Chunk 1', 'Chunk 2'],
  testPageId: 'page-123'
}

// Helper functions
export function createEmbeddings(count: number, fillValue?: number): number[][]
export function createChunks(count: number, prefix?: string): string[]
```

**Usage Example:**
```typescript
import {
  createMockOpenAI,
  createMockSupabaseForEmbeddings,
  testFixtures,
  createChunks
} from '@/__tests__/utils/embeddings-test-helpers'

describe('Embeddings', () => {
  let mockOpenAI: jest.Mocked<OpenAI>
  let mockSupabase: ReturnType<typeof createMockSupabaseForEmbeddings>

  beforeEach(() => {
    mockOpenAI = createMockOpenAI()
    mockSupabase = createMockSupabaseForEmbeddings()
  })

  it('should generate embeddings', async () => {
    const chunks = createChunks(25)
    const embeddings = await generateEmbeddingVectors(chunks)
    expect(embeddings).toHaveLength(25)
  })
})
```

### Supabase Mocks

**supabase-mock.ts**

Supabase client mock implementations.

**Key Exports:**
```typescript
export const mockSupabaseClient = {
  from: jest.fn((table) => ({
    select: jest.fn(() => ({
      eq: jest.fn(() => ({
        single: jest.fn(() => ({ data: null, error: null }))
      })),
      data: [],
      error: null
    })),
    insert: jest.fn(() => ({ data: [], error: null })),
    update: jest.fn(() => ({ data: [], error: null })),
    delete: jest.fn(() => ({ data: null, error: null }))
  })),
  auth: {
    getUser: jest.fn(() => ({ data: { user: null }, error: null })),
    signOut: jest.fn(() => ({ error: null }))
  },
  storage: {
    from: jest.fn(() => ({
      upload: jest.fn(() => ({ data: null, error: null })),
      download: jest.fn(() => ({ data: null, error: null }))
    }))
  }
}
```

## Usage Examples

### Using Data Factories
```typescript
import { createMockProduct, generateProducts } from '@/test-utils'

it('should handle product data', () => {
  const product = createMockProduct({ name: 'Special Widget' })
  expect(product.name).toBe('Special Widget')
})

it('should process bulk products', () => {
  const products = generateProducts(100)
  const result = processor.processProducts(products)
  expect(result).toHaveLength(100)
})
```

### Using Performance Helpers
```typescript
import { PerformanceHelpers } from '@/test-utils'

it('should complete within time limit', async () => {
  const { duration } = await PerformanceHelpers.measureAsync(
    'data-processing',
    async () => await processLargeDataset()
  )

  expect(duration).toBeLessThan(5000) // 5 seconds
})
```

### Using Mock Factories
```typescript
import { MockServiceFactory } from '@/test-utils'

beforeEach(() => {
  global.mockSupabase = MockServiceFactory.createSupabaseMock()
  global.mockOpenAI = MockServiceFactory.createOpenAIMock()
})
```

## Best Practices

1. **Centralize utilities**: Keep all shared test code in utils directory
2. **Type everything**: Use TypeScript for all utilities
3. **Document exports**: Add JSDoc comments for all exported functions
4. **Keep it DRY**: Extract common patterns into reusable utilities
5. **Performance aware**: Monitor utility performance impact on tests

## Related Code

- **Test Suites**: All test directories use these utilities
- **Jest Config**: `jest.config.js` references setup files
- **MSW Handlers**: `/__tests__/mocks/` uses utilities for request handling

## Related Documentation

- [Main Tests README](/Users/jamesguy/Omniops/__tests__/README.md) - Overall testing strategy
- [Integration Tests](/Users/jamesguy/Omniops/__tests__/integration/README.md) - Integration test documentation
- [Mocks README](/Users/jamesguy/Omniops/__tests__/mocks/README.md) - Mock service worker documentation
