**Last Updated:** 2025-11-18
**Verified Accurate For:** v0.1.0
**Status:** Active
**Type:** Reference

# Library Tests Directory

Comprehensive test suite for business logic and service layer components in the Customer Service Agent application, covering core functionality, data processing, and external integrations.

## Overview

The library tests ensure the reliability and correctness of all business logic components, including AI services, data extraction, e-commerce integration, and system utilities. Built with Jest, comprehensive mocking, and performance validation.

## Directory Structure

```
__tests__/lib/
├── chat-service.test.ts          # Chat session and message management
├── ecommerce-extractor.test.ts   # E-commerce data extraction
├── embeddings.test.ts            # Vector embeddings and semantic search
├── encryption.test.ts            # Data encryption and security
├── pagination-crawler.test.ts    # Paginated content crawling
├── pattern-learner.test.ts       # Content pattern recognition
├── product-normalizer.test.ts    # Product data normalization
├── rate-limit.test.ts            # Basic rate limiting
├── rate-limiter-enhanced.test.ts # Advanced rate limiting
├── woocommerce-api.test.ts       # WooCommerce API integration
├── woocommerce.test.ts          # WooCommerce service layer
└── supabase/
    └── database.test.ts         # Database operations
```

## Test Categories

### Chat & AI Services

#### `chat-service.test.ts`

Tests for chat session management, message processing, and conversation handling.

**Key Test Areas:**
- Chat session creation and management
- Message storage and retrieval
- Conversation threading and context
- User permission validation
- Error handling and recovery

**Example Tests:**
```typescript
describe('ChatService', () => {
  it('should create a new chat session', async () => {
    const session = await chatService.createSession('user-123', { 
      source: 'web' 
    })

    expect(session).toHaveProperty('id')
    expect(session.user_id).toBe('user-123')
    expect(session.metadata.source).toBe('web')
  })

  it('should add messages to existing session', async () => {
    const message = await chatService.addMessage('session-123', {
      content: 'Hello, I need help',
      role: 'user'
    })

    expect(message).toHaveProperty('id')
    expect(message.content).toBe('Hello, I need help')
    expect(message.role).toBe('user')
  })
})
```

#### `embeddings.test.ts`

Tests for vector embeddings generation, semantic search, and content similarity.

**Key Test Areas:**
- OpenAI embeddings generation
- Vector similarity calculations
- Semantic search functionality
- Embedding caching and optimization
- Performance under load

**Example Tests:**
```typescript
describe('EmbeddingsService', () => {
  it('should generate embeddings for text', async () => {
    const text = 'Customer service inquiry about product availability'
    const embedding = await embeddingsService.generateEmbedding(text)

    expect(embedding).toHaveLength(1536) // OpenAI embedding dimension
    expect(embedding[0]).toBeTypeOf('number')
  })

  it('should find similar content', async () => {
    const query = 'shipping information'
    const results = await embeddingsService.findSimilarContent(query, {
      threshold: 0.8,
      limit: 5
    })

    expect(results).toBeArray()
    expect(results.length).toBeLessThanOrEqual(5)
    results.forEach(result => {
      expect(result.similarity).toBeGreaterThan(0.8)
    })
  })
})
```

### Data Processing & Extraction

#### `ecommerce-extractor.test.ts`

Tests for e-commerce data extraction from various website formats and platforms.

**Key Test Areas:**
- Product information extraction
- Price and inventory parsing
- Category and taxonomy detection
- Image and media extraction
- Schema.org structured data parsing

**Example Tests:**
```typescript
describe('EcommerceExtractor', () => {
  it('should extract product data from HTML', async () => {
    const html = `
      <div class="product">
        <h1>Premium Widget</h1>
        <span class="price">$29.99</span>
        <div class="description">High-quality widget for all needs</div>
      </div>
    `

    const product = await extractor.extractProduct(html, 'https://example.com')

    expect(product).toMatchObject({
      name: 'Premium Widget',
      price: 29.99,
      description: 'High-quality widget for all needs',
      url: 'https://example.com'
    })
  })

  it('should handle different price formats', async () => {
    const testCases = [
      { input: '$29.99', expected: 29.99 },
      { input: '€25,50', expected: 25.50 },
      { input: '¥1,999', expected: 1999 },
      { input: 'Free', expected: 0 }
    ]

    for (const { input, expected } of testCases) {
      const price = extractor.parsePrice(input)
      expect(price).toBe(expected)
    }
  })
})
```

#### `pattern-learner.test.ts`

Tests for machine learning-based pattern recognition in website content and structure.

**Key Test Areas:**
- Content pattern detection
- Website structure analysis
- Selector optimization
- Learning algorithm validation
- Performance metrics

#### `product-normalizer.test.ts`

Tests for product data normalization and standardization across different sources.

**Key Test Areas:**
- Product data standardization
- Category mapping and normalization
- Price normalization across currencies
- Duplicate detection and merging
- Data quality validation

### Web Scraping & Crawling

#### `pagination-crawler.test.ts`

Tests for intelligent pagination detection and multi-page content crawling.

**Key Test Areas:**
- Pagination pattern detection
- Multi-page content extraction
- Rate limiting during crawling
- Error handling for broken pagination
- Performance optimization

**Example Tests:**
```typescript
describe('PaginationCrawler', () => {
  it('should detect pagination patterns', async () => {
    const html = `
      <div class="pagination">
        <a href="/page/1">1</a>
        <a href="/page/2" class="current">2</a>
        <a href="/page/3">3</a>
        <a href="/page/next">Next</a>
      </div>
    `

    const patterns = await crawler.detectPagination(html)

    expect(patterns).toContainEqual(
      expect.objectContaining({
        selector: '.pagination a',
        currentPage: 2,
        totalPages: expect.any(Number)
      })
    )
  })

  it('should crawl multiple pages efficiently', async () => {
    const startTime = performance.now()
    const results = await crawler.crawlPaginated('https://example.com/products', {
      maxPages: 5,
      delay: 100
    })
    const endTime = performance.now()

    expect(results).toHaveLength(5)
    expect(endTime - startTime).toBeLessThan(10000) // 10 seconds max
  })
})
```

### Security & Performance

#### `encryption.test.ts`

Tests for data encryption, security utilities, and credential protection.

**Key Test Areas:**
- AES encryption/decryption
- Password hashing and validation
- API key encryption
- Data integrity verification
- Performance of cryptographic operations

**Example Tests:**
```typescript
describe('Encryption', () => {
  it('should encrypt and decrypt data correctly', async () => {
    const sensitiveData = 'customer-api-key-12345'
    const encrypted = await encryption.encrypt(sensitiveData)
    const decrypted = await encryption.decrypt(encrypted)

    expect(decrypted).toBe(sensitiveData)
    expect(encrypted).not.toBe(sensitiveData)
    expect(encrypted).toMatch(/^[a-f0-9]+$/) // Hex format
  })

  it('should handle different data types', async () => {
    const testData = [
      'simple string',
      { key: 'value', nested: { data: true } },
      ['array', 'of', 'values'],
      12345,
      true
    ]

    for (const data of testData) {
      const encrypted = await encryption.encrypt(data)
      const decrypted = await encryption.decrypt(encrypted)
      expect(decrypted).toEqual(data)
    }
  })
})
```

#### `rate-limit.test.ts` & `rate-limiter-enhanced.test.ts`

Tests for rate limiting systems, both basic and advanced implementations.

**Key Test Areas:**
- Request rate limiting per domain
- Sliding window algorithms
- Rate limit persistence
- Burst handling
- Performance under high load

**Example Tests:**
```typescript
describe('RateLimiter', () => {
  it('should allow requests within limits', async () => {
    const limiter = new RateLimiter({ windowMs: 60000, maxRequests: 10 })
    
    for (let i = 0; i < 10; i++) {
      const allowed = await limiter.checkLimit('test-domain')
      expect(allowed).toBe(true)
    }
  })

  it('should reject requests exceeding limits', async () => {
    const limiter = new RateLimiter({ windowMs: 60000, maxRequests: 5 })
    
    // Use up the limit
    for (let i = 0; i < 5; i++) {
      await limiter.checkLimit('test-domain')
    }
    
    // Next request should be rejected
    const allowed = await limiter.checkLimit('test-domain')
    expect(allowed).toBe(false)
  })
})
```

### E-commerce Integration

#### `woocommerce-api.test.ts` & `woocommerce.test.ts`

Tests for WooCommerce API integration, product synchronization, and order management.

**Key Test Areas:**
- WooCommerce REST API integration
- Product catalog synchronization
- Order processing and tracking
- Customer data management
- Authentication and authorization

**Example Tests:**
```typescript
describe('WooCommerceAPI', () => {
  it('should fetch products with pagination', async () => {
    const products = await woocommerce.getProducts({
      per_page: 20,
      page: 1
    })

    expect(products).toBeArray()
    expect(products.length).toBeLessThanOrEqual(20)
    products.forEach(product => {
      expect(product).toHaveProperty('id')
      expect(product).toHaveProperty('name')
      expect(product).toHaveProperty('price')
    })
  })

  it('should search products by query', async () => {
    const results = await woocommerce.searchProducts('widget')

    expect(results).toBeArray()
    results.forEach(product => {
      expect(
        product.name.toLowerCase().includes('widget') ||
        product.description.toLowerCase().includes('widget')
      ).toBe(true)
    })
  })
})
```

### Database Operations

#### `supabase/database.test.ts`

Tests for database operations, migrations, and data integrity.

**Key Test Areas:**
- Database connection management
- CRUD operations
- Transaction handling
- Migration validation
- Performance optimization

## Testing Patterns & Utilities

### Mock Management

```typescript
// Centralized mock setup
beforeEach(() => {
  jest.clearAllMocks()
  
  // Reset all service mocks
  mockOpenAI.embeddings.create.mockReset()
  mockSupabase.from.mockReset()
  mockWooCommerce.get.mockReset()
  
  // Setup default successful responses
  setupDefaultMocks()
})

const setupDefaultMocks = () => {
  mockOpenAI.embeddings.create.mockResolvedValue({
    data: [{ embedding: Array(1536).fill(0.1) }]
  })
  
  mockSupabase.from.mockReturnValue({
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis()
  })
}
```

### Test Data Factories

```typescript
// Factory functions for test data
export const createMockProduct = (overrides = {}) => ({
  id: 'prod-123',
  name: 'Test Product',
  price: 29.99,
  description: 'A test product for unit tests',
  category: 'Electronics',
  inStock: true,
  images: ['https://example.com/image.jpg'],
  ...overrides
})

export const createMockEmbedding = (text: string) => ({
  text,
  embedding: Array(1536).fill(0).map(() => Math.random()),
  metadata: { source: 'test', timestamp: Date.now() }
})
```

### Performance Testing

```typescript
describe('Performance Tests', () => {
  it('should process large datasets efficiently', async () => {
    const largeDataset = Array.from({ length: 1000 }, (_, i) => 
      createMockProduct({ id: `prod-${i}` })
    )

    const startTime = performance.now()
    const results = await processor.processProducts(largeDataset)
    const endTime = performance.now()

    expect(results).toHaveLength(1000)
    expect(endTime - startTime).toBeLessThan(5000) // 5 seconds max
  })

  it('should handle memory efficiently', async () => {
    const initialMemory = process.memoryUsage().heapUsed
    
    await processor.processLargeFile('test-data.json')
    
    if (global.gc) global.gc()
    
    const finalMemory = process.memoryUsage().heapUsed
    const memoryIncrease = finalMemory - initialMemory
    
    expect(memoryIncrease).toBeLessThan(100 * 1024 * 1024) // 100MB
  })
})
```

## Error Handling Tests

### Service Resilience

```typescript
describe('Error Handling', () => {
  it('should handle external service failures', async () => {
    mockOpenAI.embeddings.create.mockRejectedValue(
      new Error('OpenAI API rate limit exceeded')
    )

    const result = await embeddingsService.generateEmbedding('test text')

    expect(result).toBeNull()
    expect(console.error).toHaveBeenCalledWith(
      expect.stringContaining('OpenAI API rate limit')
    )
  })

  it('should retry failed operations', async () => {
    let callCount = 0
    mockSupabase.from.mockImplementation(() => {
      callCount++
      if (callCount < 3) {
        throw new Error('Temporary database error')
      }
      return { data: { success: true } }
    })

    const result = await service.saveWithRetry(testData)

    expect(result).toEqual({ success: true })
    expect(callCount).toBe(3)
  })
})
```

## Test Configuration

### Jest Configuration

```typescript
// jest.config.lib.js
module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/__tests__/lib/**/*.test.ts'],
  setupFilesAfterEnv: ['<rootDir>/__tests__/utils/lib-test-setup.ts'],
  collectCoverageFrom: [
    'lib/**/*.ts',
    '!lib/**/*.d.ts',
    '!lib/**/index.ts'
  ],
  coverageThreshold: {
    global: {
      branches: 85,
      functions: 90,
      lines: 85,
      statements: 85
    }
  },
  testTimeout: 10000,
  maxWorkers: '50%'
}
```

### Mock Setup

```typescript
// lib-test-setup.ts
import { jest } from '@jest/globals'

// Global test environment setup
beforeAll(() => {
  process.env.NODE_ENV = 'test'
  process.env.OPENAI_API_KEY = 'test-key'
  
  // Suppress console outputs in tests
  jest.spyOn(console, 'log').mockImplementation()
  jest.spyOn(console, 'warn').mockImplementation()
})

afterAll(() => {
  jest.restoreAllMocks()
})

// Setup global mocks
jest.mock('openai')
jest.mock('@/lib/supabase-server')
jest.mock('redis', () => ({
  createClient: jest.fn(() => ({
    connect: jest.fn(),
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn()
  }))
}))
```

## Running Library Tests

### Test Commands

```bash
# Run all library tests
npm run test:lib

# Run specific test file
npm test -- __tests__/lib/chat-service.test.ts

# Run with coverage
npm run test:lib:coverage

# Run in watch mode
npm run test:lib:watch

# Run performance tests only
npm test -- --testNamePattern="Performance"

# Run with memory profiling
node --max-old-space-size=512 npm test -- __tests__/lib/
```

### Debugging

```bash
# Debug specific test
node --inspect-brk ./node_modules/.bin/jest __tests__/lib/embeddings.test.ts

# Run with detailed output
npm test -- --verbose --no-cache __tests__/lib/

# Profile test performance
npm test -- --detectOpenHandles --forceExit __tests__/lib/
```

## Coverage & Quality Metrics

### Coverage Targets

| Component | Lines | Functions | Branches | Statements |
|-----------|-------|-----------|----------|------------|
| Chat Services | 90%+ | 95%+ | 85%+ | 90%+ |
| Data Processing | 85%+ | 90%+ | 80%+ | 85%+ |
| Security | 95%+ | 100%+ | 90%+ | 95%+ |
| E-commerce | 80%+ | 85%+ | 75%+ | 80%+ |
| Utilities | 85%+ | 90%+ | 80%+ | 85%+ |

### Quality Gates

```typescript
// Custom test matchers
expect.extend({
  toBeValidProduct(received) {
    const isValid = received &&
      typeof received.id === 'string' &&
      typeof received.name === 'string' &&
      typeof received.price === 'number' &&
      received.price >= 0

    return {
      message: () => `Expected ${received} to be a valid product`,
      pass: isValid
    }
  }
})
```

## Continuous Integration

### Performance Benchmarks

```yaml
# performance-tests.yml
name: Library Performance Tests
on:
  pull_request:
    paths: ['lib/**']

jobs:
  benchmark:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Run performance tests
        run: npm run test:lib:performance
      - name: Comment PR with results
        uses: benchmark-action@v1
        with:
          tool: 'jest'
          output-file-path: 'performance-results.json'
```

## Best Practices

### Test Organization

1. **Single Responsibility**: One test file per library module
2. **Clear Naming**: Descriptive test and describe block names
3. **Logical Grouping**: Group related tests together
4. **Setup/Teardown**: Proper test isolation and cleanup

### Mock Strategies

1. **Mock External Services**: Always mock OpenAI, Supabase, etc.
2. **Partial Mocking**: Mock only what you need to test
3. **Realistic Data**: Use realistic test data and edge cases
4. **State Management**: Reset mocks between tests

### Performance Considerations

1. **Test Speed**: Keep individual tests under 100ms
2. **Memory Usage**: Monitor memory consumption in tests
3. **Parallel Execution**: Design tests for concurrent execution
4. **Resource Cleanup**: Prevent memory leaks and handle cleanup

## Maintenance

### Regular Tasks

1. **Update Dependencies**: Keep test dependencies current
2. **Review Coverage**: Monitor and improve test coverage
3. **Performance Monitoring**: Track test execution times
4. **Mock Accuracy**: Ensure mocks match real service behavior

### Refactoring Guidelines

1. **Extract Common Setup**: Create shared test utilities
2. **Remove Duplication**: Consolidate similar test patterns
3. **Update Test Data**: Keep test data relevant and current
4. **Documentation**: Update test documentation with changes

## Related Documentation

- [Main Tests README](/Users/jamesguy/Omniops/__tests__/README.md) - Overall testing strategy
- [API Tests](/Users/jamesguy/Omniops/__tests__/api/README.md) - API endpoint tests
- [Integration Tests](/Users/jamesguy/Omniops/__tests__/integration/README.md) - Full system tests
- [Library Documentation](/Users/jamesguy/Omniops/lib/README.md) - Business logic documentation