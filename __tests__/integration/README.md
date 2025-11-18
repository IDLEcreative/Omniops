# Integration Tests Directory

**Type:** Test Documentation
**Status:** Active
**Last Updated:** 2025-11-18
**Verified For:** v0.1.0
**Dependencies:** [Parent Tests README](/home/user/Omniops/__tests__/README.md), [CLAUDE.md](/home/user/Omniops/CLAUDE.md)
**Estimated Read Time:** 12 minutes

## Purpose

End-to-end integration tests validating complete system workflows, cross-component interactions, and real-world scenarios including scraping, WooCommerce integration, and multi-tenant isolation.

## Quick Links

- [Parent Tests Directory](/home/user/Omniops/__tests__/README.md)
- [Enhanced Scraper System Test](enhanced-scraper-system.test.ts)
- [WooCommerce Schema Fix Test](woocommerce-schema-fix.test.ts)
- [Testing Guide](/home/user/Omniops/docs/TESTING_GUIDE.md)

## Table of Contents

- [Overview](#overview)
- [Directory Structure](#directory-structure)
- [Test Categories](#test-categories)
  - [Enhanced Scraper System](#enhanced-scraper-system-enhanced-scraper-systemtestts)
  - [WooCommerce Integration](#woocommerce-integration-woocommerce-schema-fixtestts)
- [Test Data Generation](#test-data-generation)
  - [Realistic Data Factories](#realistic-data-factories)
  - [Mock Service Factories](#mock-service-factories)
- [Performance Monitoring](#performance-monitoring)
  - [Built-in Performance Utilities](#built-in-performance-utilities)
  - [Performance Benchmarks](#performance-benchmarks)
- [Error Simulation & Recovery](#error-simulation--recovery)
- [Test Configuration](#test-configuration)
  - [Jest Configuration](#jest-configuration)
  - [Environment Setup](#environment-setup)
- [Running Integration Tests](#running-integration-tests)
  - [Basic Commands](#basic-commands)
  - [Advanced Options](#advanced-options)
- [Debugging & Troubleshooting](#debugging--troubleshooting)
  - [Common Issues](#common-issues)
  - [Performance Analysis](#performance-analysis)
- [Continuous Integration](#continuous-integration)
- [Best Practices](#best-practices)
- [Related Documentation](#related-documentation)

---

## Overview

The integration tests ensure that all components work together correctly as a complete system. These tests validate entire user journeys, API integrations, database operations, and external service interactions using realistic scenarios and comprehensive data flows.

## Directory Structure

```
__tests__/integration/
├── README.md                           # This documentation
├── enhanced-scraper-system.test.ts     # Main scraping system integration tests
├── woocommerce-schema-fix.test.ts      # WooCommerce schema validation tests
└── utils/
    ├── integration-setup.js            # Test environment setup
    ├── integration-test-helpers.ts     # Test utilities and helpers
    ├── global-setup.js                 # One-time global setup
    └── global-teardown.js              # Global cleanup
```

## Test Categories

### Enhanced Scraper System (`enhanced-scraper-system.test.ts`)

Comprehensive end-to-end tests for the AI-powered web scraping and content processing system.

#### Key Test Areas

**1. E-commerce Scraping with AI Optimization**
- Complete pipeline from HTML extraction to AI optimization
- Token reduction and compression validation
- Semantic chunking and metadata generation
- Performance benchmarks (< 30 seconds processing)
- Memory efficiency monitoring (< 100MB additional usage)

**2. Pattern Learning Flow**
- Pattern detection and learning from extraction data
- Pattern application for improved extraction efficiency
- Cross-domain pattern recommendations
- Performance improvement measurement over time

**3. Rate Limiting Integration**
- Token bucket algorithm validation
- Exponential backoff on rate limit errors
- Circuit breaker activation and recovery
- Adaptive throttling based on response times
- Anti-detection measures (user agent rotation, timing randomization)

**4. Content Deduplication**
- Similarity detection between content pieces
- Template pattern recognition
- Content compression and optimization
- Duplicate content handling strategies

**5. Configuration Management**
- Preset configurations (fast, careful, ecommerce)
- Environment variable overrides
- Runtime configuration changes
- AI optimization settings validation

#### Example Test Scenarios

```typescript
describe('Enhanced Scraper System Integration', () => {
  it('should complete full e-commerce scraping pipeline', async () => {
    const testHTML = TestDataGenerator.generateEcommerceHTML(3)
    const testURL = 'https://test-ecommerce.com/products'

    // Full pipeline: Rate limiting → AI optimization → Product extraction → Deduplication
    const startTime = performance.now()
    
    // 1. Check rate limiting
    const rateLimitCheck = await rateLimiter.checkLimit(testURL)
    expect(rateLimitCheck.allowed).toBe(true)
    
    // 2. AI optimization
    const optimizedContent = await AIContentExtractor.extractOptimized(
      testHTML, 
      testURL
    )
    expect(optimizedContent.compressionRatio).toBeGreaterThan(0.1)
    
    // 3. Product extraction
    const products = await EcommerceExtractor.extractProducts(
      optimizedContent.content, 
      testURL
    )
    expect(products).toHaveLength(3)
    
    // 4. Pattern learning
    await PatternLearner.learnFromExtraction(testURL, products, {
      selectors: optimizedContent.selectors,
      confidence: 0.95
    })
    
    const totalTime = performance.now() - startTime
    expect(totalTime).toBeLessThan(15000) // 15 seconds max
  })

  it('should handle error recovery and fallbacks', async () => {
    // Simulate various failure scenarios
    const scenarios = [
      { type: 'openai_timeout', service: 'OpenAI', expectedFallback: true },
      { type: 'supabase_connection', service: 'Supabase', expectedFallback: true },
      { type: 'rate_limit_exceeded', service: 'RateLimit', expectedFallback: false }
    ]

    for (const scenario of scenarios) {
      const result = await runPipelineWithError(scenario)
      
      if (scenario.expectedFallback) {
        expect(result.completed).toBe(true)
        expect(result.usedFallback).toBe(true)
      } else {
        expect(result.completed).toBe(false)
        expect(result.error).toContain(scenario.type)
      }
    }
  })
})
```

### WooCommerce Integration (`woocommerce-schema-fix.test.ts`)

Tests for WooCommerce API integration, product synchronization, and schema validation.

#### Key Test Areas

**1. Product Schema Validation**
- WooCommerce product data structure validation
- Price formatting and currency handling
- Inventory status and stock management
- Product variations and attributes

**2. API Integration**
- REST API authentication and authorization
- Product catalog synchronization
- Order processing and tracking
- Customer data management
- Webhook handling for real-time updates

**3. Data Migration**
- Legacy data format conversion
- Schema updates and migrations
- Data integrity validation
- Rollback procedures

#### Example Test Scenarios

```typescript
describe('WooCommerce Integration', () => {
  it('should synchronize product catalog correctly', async () => {
    const mockProducts = createMockWooCommerceProducts(10)
    
    // Mock WooCommerce API responses
    setupWooCommerceMocks(mockProducts)
    
    // Synchronize products
    const syncResult = await woocommerceSync.synchronizeProducts()
    
    expect(syncResult.totalProducts).toBe(10)
    expect(syncResult.successfulSync).toBe(10)
    expect(syncResult.errors).toHaveLength(0)
    
    // Verify database storage
    const storedProducts = await database.getProducts()
    expect(storedProducts).toHaveLength(10)
    
    // Verify schema compliance
    storedProducts.forEach(product => {
      expect(product).toMatchSchema(productSchema)
    })
  })

  it('should handle API rate limiting gracefully', async () => {
    // Simulate rate limiting responses
    setupWooCommerceRateLimitMocks()
    
    const startTime = performance.now()
    const result = await woocommerceSync.synchronizeProducts()
    const endTime = performance.now()
    
    // Should complete despite rate limiting
    expect(result.completed).toBe(true)
    expect(result.rateLimitRetries).toBeGreaterThan(0)
    
    // Should take longer due to backoff
    expect(endTime - startTime).toBeGreaterThan(5000)
  })
})
```

## Test Data Generation

### Realistic Data Factories

```typescript
class TestDataGenerator {
  // E-commerce HTML with structured data
  static generateEcommerceHTML(productCount: number = 1): string {
    return `<!DOCTYPE html>
      <html>
        <head>
          <title>E-commerce Test Store</title>
          <script type="application/ld+json">
            ${this.generateProductJsonLD(productCount)}
          </script>
        </head>
        <body>
          ${this.generateProductHTML(productCount)}
        </body>
      </html>`
  }

  // Template variations for pattern learning
  static createTemplateVariations(count: number): string[] {
    const templates = [
      '<div class="product"><h1 class="title">{name}</h1><span class="price">{price}</span></div>',
      '<article class="item"><h2 class="name">{name}</h2><div class="cost">{price}</div></article>',
      '<section class="product-card"><h3 class="product-name">{name}</h3><p class="price-tag">{price}</p></section>'
    ]
    
    return Array.from({ length: count }, (_, i) => 
      this.populateTemplate(templates[i % templates.length], {
        name: `Product ${i + 1}`,
        price: `$${(20 + i * 5).toFixed(2)}`
      })
    )
  }

  // Large content for performance testing
  static createLargeContentHTML(sectionCount: number): string {
    const sections = Array.from({ length: sectionCount }, (_, i) => `
      <section id="section-${i}">
        <h2>Section ${i + 1}</h2>
        <p>${this.generateLongText(200)}</p>
        <ul>
          ${Array.from({ length: 10 }, (_, j) => `<li>Item ${j + 1}</li>`).join('')}
        </ul>
      </section>
    `).join('')
    
    return `<html><body>${sections}</body></html>`
  }
}
```

### Mock Service Factories

```typescript
class MockServiceFactory {
  // Comprehensive Supabase mock
  static createSupabaseMock() {
    return {
      from: jest.fn((table) => ({
        select: jest.fn(() => ({ data: mockData[table] || [], error: null })),
        insert: jest.fn((data) => ({ data: [data], error: null })),
        update: jest.fn((data) => ({ data: [data], error: null })),
        delete: jest.fn(() => ({ data: null, error: null })),
        eq: jest.fn(() => this),
        in: jest.fn(() => this),
        gte: jest.fn(() => this),
        lte: jest.fn(() => this),
        order: jest.fn(() => this),
        limit: jest.fn(() => this),
        single: jest.fn(() => ({ data: mockData.single, error: null }))
      })),
      auth: {
        getUser: jest.fn(() => ({ data: { user: mockUser }, error: null }))
      }
    }
  }

  // OpenAI API mock with realistic responses
  static createOpenAIMock() {
    return {
      chat: {
        completions: {
          create: jest.fn().mockResolvedValue({
            choices: [{
              message: {
                content: JSON.stringify({
                  summary: 'Product page with 3 items',
                  keyFacts: ['E-commerce site', 'Product catalog', 'In stock items'],
                  questions: [
                    { q: 'What products are available?', a: 'Amazing Products 1, 2, and 3' },
                    { q: 'What are the prices?', a: 'Ranging from £29.99 to £49.99' }
                  ]
                })
              }
            }],
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

  // Redis mock for caching and rate limiting
  static createRedisMock() {
    const storage = new Map()
    
    return {
      get: jest.fn((key) => Promise.resolve(storage.get(key) || null)),
      set: jest.fn((key, value, options) => {
        storage.set(key, value)
        if (options?.EX) {
          setTimeout(() => storage.delete(key), options.EX * 1000)
        }
        return Promise.resolve('OK')
      }),
      del: jest.fn((key) => {
        const existed = storage.has(key)
        storage.delete(key)
        return Promise.resolve(existed ? 1 : 0)
      }),
      incr: jest.fn((key) => {
        const current = parseInt(storage.get(key) || '0')
        const incremented = current + 1
        storage.set(key, incremented.toString())
        return Promise.resolve(incremented)
      }),
      expire: jest.fn(() => Promise.resolve(1))
    }
  }
}
```

## Performance Monitoring

### Built-in Performance Utilities

```typescript
class PerformanceHelpers {
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
    
    // Store metric for analysis
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
      heapTotal: Math.round(usage.heapTotal / 1024 / 1024), // MB
      external: Math.round(usage.external / 1024 / 1024), // MB
      rss: Math.round(usage.rss / 1024 / 1024) // MB
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
        median: Math.round(sorted[Math.floor(sorted.length / 2)]),
        p95: Math.round(sorted[Math.floor(sorted.length * 0.95)])
      }
    }
    
    return summary
  }
}
```

### Performance Benchmarks

```typescript
describe('Performance Benchmarks', () => {
  it('should meet processing time requirements', async () => {
    const testSizes = [
      { name: 'small', html: TestDataGenerator.createLargeContentHTML(10) },
      { name: 'medium', html: TestDataGenerator.createLargeContentHTML(50) },
      { name: 'large', html: TestDataGenerator.createLargeContentHTML(100) }
    ]

    const benchmarks = {
      small: { maxTime: 5000, maxMemory: 50 },   // 5s, 50MB
      medium: { maxTime: 15000, maxMemory: 100 }, // 15s, 100MB
      large: { maxTime: 30000, maxMemory: 200 }   // 30s, 200MB
    }

    for (const testCase of testSizes) {
      const benchmark = benchmarks[testCase.name]
      const initialMemory = PerformanceHelpers.getMemoryUsage()

      const { duration } = await PerformanceHelpers.measureAsync(
        `processing-${testCase.name}`,
        async () => {
          return await AIContentExtractor.extractOptimized(
            testCase.html, 
            `https://example.com/${testCase.name}`
          )
        }
      )

      const finalMemory = PerformanceHelpers.getMemoryUsage()
      const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed

      expect(duration).toBeLessThan(benchmark.maxTime)
      expect(memoryIncrease).toBeLessThan(benchmark.maxMemory)
    }
  })
})
```

## Error Simulation & Recovery

### Comprehensive Error Testing

```typescript
describe('Error Handling and Recovery', () => {
  const errorScenarios = [
    {
      name: 'OpenAI API Timeout',
      setup: () => mockOpenAI.chat.completions.create.mockRejectedValue(
        new Error('Request timeout')
      ),
      expectedBehavior: 'fallback_to_basic_extraction'
    },
    {
      name: 'Supabase Connection Lost',
      setup: () => mockSupabase.from.mockImplementation(() => {
        throw new Error('Connection lost')
      }),
      expectedBehavior: 'retry_with_exponential_backoff'
    },
    {
      name: 'Rate Limit Exceeded',
      setup: () => setupRateLimitExceeded(),
      expectedBehavior: 'queue_for_later_processing'
    },
    {
      name: 'Memory Pressure',
      setup: () => simulateMemoryPressure(),
      expectedBehavior: 'reduce_batch_size'
    }
  ]

  errorScenarios.forEach(scenario => {
    it(`should handle ${scenario.name} gracefully`, async () => {
      scenario.setup()

      const result = await runPipelineWithErrorHandling(testHTML, testURL)

      expect(result.error).toBeNull()
      expect(result.recoveryStrategy).toBe(scenario.expectedBehavior)
      expect(result.completed).toBe(true)
    })
  })
})
```

## Test Configuration

### Jest Configuration

```javascript
// jest.integration.config.js
module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/__tests__/integration/**/*.test.ts'],
  setupFilesAfterEnv: [
    '<rootDir>/__tests__/utils/integration-setup.js'
  ],
  globalSetup: '<rootDir>/__tests__/utils/global-setup.js',
  globalTeardown: '<rootDir>/__tests__/utils/global-teardown.js',
  testTimeout: 120000, // 2 minutes
  maxWorkers: '50%',
  collectCoverageFrom: [
    'lib/**/*.ts',
    'app/api/**/*.ts',
    '!**/*.d.ts'
  ],
  coverageThreshold: {
    global: {
      branches: 60,
      functions: 60,
      lines: 70,
      statements: 70
    }
  }
}
```

### Environment Setup

```javascript
// integration-setup.js
beforeAll(async () => {
  // Set test environment
  process.env.NODE_ENV = 'test'
  process.env.DISABLE_REAL_REQUESTS = 'true'
  
  // Initialize mock services
  global.mockSupabase = MockServiceFactory.createSupabaseMock()
  global.mockOpenAI = MockServiceFactory.createOpenAIMock()
  global.mockRedis = MockServiceFactory.createRedisMock()
  
  // Setup test database
  await setupTestDatabase()
})

afterAll(async () => {
  // Cleanup test data
  await cleanupTestDatabase()
  
  // Reset environment
  delete process.env.DISABLE_REAL_REQUESTS
})

beforeEach(() => {
  // Reset all mocks
  jest.clearAllMocks()
  
  // Reset performance metrics
  PerformanceHelpers.reset()
})
```

## Running Integration Tests

### Basic Commands

```bash
# Run all integration tests
npm run test:integration

# Run with coverage reporting
npm run test:integration:coverage

# Run in watch mode for development
npm run test:integration:watch

# Run specific test file
npm run test:integration -- enhanced-scraper-system.test.ts

# Run with verbose output
npm run test:integration -- --verbose

# Run all tests (unit + integration)
npm run test:all
```

### Advanced Options

```bash
# Run with custom timeout
npm run test:integration -- --testTimeout=180000

# Run specific test pattern
npm run test:integration -- --testNamePattern="E-commerce"

# Run with memory profiling
node --max-old-space-size=4096 npm run test:integration

# Run with performance monitoring
npm run test:integration -- --detectOpenHandles --forceExit
```

## Debugging & Troubleshooting

### Common Issues

**1. Test Timeouts**
```bash
# Increase timeout for complex operations
npm run test:integration -- --testTimeout=300000
```

**2. Memory Issues**
```bash
# Increase Node.js memory limit
node --max-old-space-size=8192 npm run test:integration
```

**3. Mock Synchronization**
```typescript
// Ensure mocks match real service behavior
beforeEach(() => {
  // Reset and reconfigure mocks
  jest.clearAllMocks()
  setupRealisticMocks()
})
```

### Performance Analysis

```typescript
// Add detailed performance logging
afterEach(() => {
  const metrics = PerformanceHelpers.getMetricsSummary()
  const memory = PerformanceHelpers.getMemoryUsage()
  
  console.log('Test Performance Metrics:', metrics)
  console.log('Memory Usage:', memory)
})
```

## Continuous Integration

### CI/CD Configuration

```yaml
# .github/workflows/integration-tests.yml
name: Integration Tests
on: [push, pull_request]

jobs:
  integration-tests:
    runs-on: ubuntu-latest
    timeout-minutes: 30
    
    services:
      redis:
        image: redis:7
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run integration tests
        run: npm run test:integration:coverage
        env:
          NODE_ENV: test
          DISABLE_REAL_REQUESTS: true
          CI: true

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          directory: ./coverage
```

## Best Practices

### Writing Integration Tests

1. **Test Complete Workflows**: Focus on end-to-end scenarios rather than individual functions
2. **Use Realistic Data**: Generate data that matches production scenarios
3. **Mock External Services**: Ensure tests are deterministic and fast
4. **Include Performance Assertions**: Validate response times and resource usage
5. **Test Error Scenarios**: Verify graceful handling of failures
6. **Validate Data Flow**: Ensure data moves correctly between components

### Performance Considerations

1. **Set Appropriate Timeouts**: Based on operation complexity
2. **Monitor Resource Usage**: Track memory and CPU consumption
3. **Use Parallel Processing**: Where safe and beneficial
4. **Clean Up Resources**: Prevent memory leaks and handle cleanup
5. **Batch Operations**: Group related operations for efficiency

### Maintenance

1. **Regular Updates**: Keep test data and scenarios current
2. **Performance Monitoring**: Track test execution times over time
3. **Mock Accuracy**: Ensure mocks stay synchronized with real services
4. **Documentation**: Keep test documentation up to date
5. **Coverage Analysis**: Monitor and improve test coverage

## Related Documentation

- [Main Tests README](/Users/jamesguy/Omniops/__tests__/README.md) - Overall testing strategy
- [API Tests](/Users/jamesguy/Omniops/__tests__/api/README.md) - API endpoint tests
- [Library Tests](/Users/jamesguy/Omniops/__tests__/lib/README.md) - Business logic tests
- [System Architecture](/Users/jamesguy/Omniops/docs/ARCHITECTURE.md) - Overall system design