**Last Updated:** 2025-11-18
**Verified Accurate For:** v0.1.0
**Status:** Active
**Type:** Reference

# API Tests Directory

Comprehensive test suite for API routes in the Customer Service Agent application, covering authentication, chat functionality, data scraping, and business logic endpoints.

## Overview

The API tests ensure reliability, security, and performance of all backend endpoints. Built with Jest, MSW (Mock Service Worker), and comprehensive mocking strategies for external services like OpenAI, Supabase, and WooCommerce.

## Directory Structure

```
__tests__/api/
├── auth/                    # Authentication endpoint tests
│   └── customer/
│       └── route.test.ts   # Customer auth verification tests
├── chat/                   # Chat endpoint tests
│   ├── route.test.ts       # Main chat API tests
│   └── route-async.test.ts # Async chat flow tests
├── scrape/                 # Web scraping endpoint tests
│   └── route.test.ts       # Scraping API tests
└── verify-customer.test.ts # Customer verification tests
```

## Test Categories

### Authentication Tests (`/auth/`)

Tests for user authentication, session management, and customer verification endpoints.

#### `auth/customer/route.test.ts`

Tests the customer authentication verification API that validates customer domains and configurations.

**Key Test Areas:**
- Customer domain validation
- Configuration retrieval and verification
- Error handling for invalid domains
- Rate limiting enforcement
- Security token validation

**Example Tests:**
```typescript
describe('POST /api/auth/customer', () => {
  it('should verify valid customer domain', async () => {
    const request = new NextRequest('http://localhost:3000/api/auth/customer', {
      method: 'POST',
      body: JSON.stringify({ domain: 'valid-customer.com' })
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data).toHaveProperty('customer')
    expect(data.customer.domain).toBe('valid-customer.com')
  })

  it('should reject invalid domain', async () => {
    const request = new NextRequest('http://localhost:3000/api/auth/customer', {
      method: 'POST',
      body: JSON.stringify({ domain: 'invalid-domain.com' })
    })

    const response = await POST(request)
    expect(response.status).toBe(404)
  })
})
```

### Chat API Tests (`/chat/`)

Comprehensive tests for the chat functionality, including AI interactions, embeddings, and real-time messaging.

#### `chat/route.test.ts`

Tests the main chat API endpoint that handles user messages and AI responses.

**Key Test Areas:**
- Message processing and AI response generation
- Vector embeddings and semantic search
- WooCommerce product integration
- Rate limiting and spam prevention
- Error handling and fallback responses
- Conversation history management

**Mock Setup:**
```typescript
// OpenAI API mocking
const mockOpenAIInstance = {
  embeddings: {
    create: jest.fn().mockResolvedValue(mockEmbeddingResponse)
  },
  chat: {
    completions: {
      create: jest.fn().mockResolvedValue(mockChatResponse)
    }
  }
}

// Supabase client mocking
const mockSupabaseClient = {
  from: jest.fn(() => ({
    select: jest.fn(() => ({
      eq: jest.fn(() => ({
        single: jest.fn(() => ({ data: mockCustomerConfig }))
      }))
    })),
    insert: jest.fn(() => ({ data: mockData }))
  }))
}
```

**Example Tests:**
```typescript
describe('POST /api/chat', () => {
  it('should process user message and return AI response', async () => {
    setupValidCustomer()
    setupMockEmbeddings()
    setupMockChatCompletion()

    const request = new NextRequest('http://localhost:3000/api/chat', {
      method: 'POST',
      body: JSON.stringify({
        message: 'Hello, I need help with my order',
        domain: 'test-customer.com'
      })
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data).toHaveProperty('message')
    expect(data.message).toContain('helpful response')
  })

  it('should handle rate limiting', async () => {
    mockCheckDomainRateLimit.mockResolvedValueOnce(false)

    const request = createChatRequest('Rate limited message')
    const response = await POST(request)

    expect(response.status).toBe(429)
    expect(await response.json()).toMatchObject({
      error: 'Rate limit exceeded'
    })
  })
})
```

#### `chat/route-async.test.ts`

Tests for asynchronous chat operations, streaming responses, and concurrent message handling.

**Key Test Areas:**
- Streaming AI responses
- Concurrent message processing
- WebSocket connection handling
- Real-time conversation updates
- Performance under load

### Scraping API Tests (`/scrape/`)

Tests for web scraping functionality, content extraction, and job queue management.

#### `scrape/route.test.ts`

Tests the web scraping API that handles content crawling and indexing.

**Key Test Areas:**
- URL validation and sanitization
- Content extraction and processing
- Job queue management
- Rate limiting for scraping requests
- Error handling for invalid URLs
- Background job processing

**Example Tests:**
```typescript
describe('POST /api/scrape', () => {
  it('should initiate scraping job for valid URL', async () => {
    const request = new NextRequest('http://localhost:3000/api/scrape', {
      method: 'POST',
      body: JSON.stringify({
        url: 'https://example.com',
        domain: 'test-customer.com'
      })
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data).toHaveProperty('jobId')
    expect(data.status).toBe('queued')
  })
})
```

### Customer Verification Tests

#### `verify-customer.test.ts`

Tests for customer domain verification and configuration validation.

**Key Test Areas:**
- Domain ownership verification
- Customer configuration validation
- Security checks and authorization
- Database integrity checks

## Testing Patterns & Best Practices

### Mocking Strategy

**External Services:**
```typescript
// OpenAI API mocking
jest.mock('openai', () => {
  return jest.fn().mockImplementation(() => ({
    embeddings: { create: jest.fn() },
    chat: { completions: { create: jest.fn() } }
  }))
})

// Supabase mocking
jest.mock('@/lib/supabase-server', () => ({
  createClient: jest.fn(),
  createServiceRoleClient: jest.fn()
}))

// WooCommerce mocking
jest.mock('@/lib/woocommerce-dynamic', () => ({
  searchProductsDynamic: jest.fn().mockResolvedValue([])
}))
```

### Request Helpers

```typescript
// Helper function for creating test requests
function createChatRequest(message: string, domain = 'test-customer.com') {
  return new NextRequest('http://localhost:3000/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, domain })
  })
}

// Helper for authentication headers
function withAuthHeaders(headers: HeadersInit = {}) {
  return {
    ...headers,
    'Authorization': 'Bearer test-token',
    'X-Customer-Domain': 'test-customer.com'
  }
}
```

### Test Data Management

```typescript
// Mock data factories
const createMockCustomer = (overrides = {}) => ({
  id: 'test-customer-id',
  domain: 'test-customer.com',
  config: {
    businessName: 'Test Business',
    welcomeMessage: 'Welcome to our store!'
  },
  ...overrides
})

const createMockMessage = (overrides = {}) => ({
  id: 'msg-123',
  content: 'Test message',
  role: 'user',
  timestamp: new Date().toISOString(),
  ...overrides
})
```

## Performance Testing

### Load Testing

```typescript
describe('API Performance', () => {
  it('should handle concurrent chat requests', async () => {
    const concurrentRequests = 10
    const requests = Array.from({ length: concurrentRequests }, () =>
      POST(createChatRequest('Performance test message'))
    )

    const startTime = performance.now()
    const responses = await Promise.all(requests)
    const endTime = performance.now()

    // All requests should succeed
    responses.forEach(response => {
      expect(response.status).toBe(200)
    })

    // Performance assertion
    expect(endTime - startTime).toBeLessThan(5000) // 5 seconds max
  })
})
```

### Memory Leak Detection

```typescript
describe('Memory Management', () => {
  it('should not leak memory during multiple requests', async () => {
    const initialMemory = process.memoryUsage().heapUsed
    
    // Perform many operations
    for (let i = 0; i < 100; i++) {
      await POST(createChatRequest(`Message ${i}`))
    }
    
    // Force garbage collection if available
    if (global.gc) global.gc()
    
    const finalMemory = process.memoryUsage().heapUsed
    const memoryIncrease = finalMemory - initialMemory
    
    // Memory increase should be reasonable
    expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024) // 50MB
  })
})
```

## Security Testing

### Input Validation

```typescript
describe('API Security', () => {
  it('should reject malicious input', async () => {
    const maliciousInputs = [
      '<script>alert("xss")</script>',
      '"; DROP TABLE users; --',
      '../../etc/passwd',
      'javascript:alert("xss")'
    ]

    for (const input of maliciousInputs) {
      const request = createChatRequest(input)
      const response = await POST(request)
      
      // Should either sanitize or reject
      expect(response.status).not.toBe(500)
    }
  })

  it('should validate authentication tokens', async () => {
    const request = new NextRequest('http://localhost:3000/api/chat', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer invalid-token' },
      body: JSON.stringify({ message: 'test', domain: 'test.com' })
    })

    const response = await POST(request)
    expect(response.status).toBe(401)
  })
})
```

### Rate Limiting Tests

```typescript
describe('Rate Limiting', () => {
  it('should enforce rate limits per domain', async () => {
    // Mock rate limit exceeded
    mockCheckDomainRateLimit.mockResolvedValue(false)

    const request = createChatRequest('Rate limited message')
    const response = await POST(request)

    expect(response.status).toBe(429)
    expect(await response.json()).toMatchObject({
      error: 'Rate limit exceeded',
      retryAfter: expect.any(Number)
    })
  })
})
```

## Error Handling Tests

### API Error Scenarios

```typescript
describe('Error Handling', () => {
  it('should handle OpenAI service errors', async () => {
    mockOpenAI.chat.completions.create.mockRejectedValue(
      new Error('OpenAI service unavailable')
    )

    const request = createChatRequest('Test message')
    const response = await POST(request)

    expect(response.status).toBe(500)
    expect(await response.json()).toMatchObject({
      error: 'AI service temporarily unavailable'
    })
  })

  it('should handle database connection errors', async () => {
    mockSupabaseClient.from.mockImplementation(() => {
      throw new Error('Database connection failed')
    })

    const request = createChatRequest('Test message')
    const response = await POST(request)

    expect(response.status).toBe(500)
    expect(await response.json()).toMatchObject({
      error: 'Database service unavailable'
    })
  })
})
```

## Test Configuration

### Jest Setup

```typescript
// jest.config.js for API tests
module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/__tests__/api/**/*.test.ts'],
  setupFilesAfterEnv: ['<rootDir>/__tests__/utils/api-test-setup.ts'],
  collectCoverageFrom: [
    'app/api/**/*.ts',
    '!app/api/**/route.ts' // Exclude route files from coverage
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  }
}
```

### Environment Setup

```typescript
// API test environment setup
beforeAll(async () => {
  // Set test environment variables
  process.env.NODE_ENV = 'test'
  process.env.OPENAI_API_KEY = 'test-key'
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://localhost:54321'
  
  // Initialize test database
  await setupTestDatabase()
})

afterAll(async () => {
  // Cleanup test data
  await cleanupTestDatabase()
})
```

## Running API Tests

### Test Commands

```bash
# Run all API tests
npm run test:api

# Run specific API test file
npm test -- __tests__/api/chat/route.test.ts

# Run with coverage
npm run test:api:coverage

# Run in watch mode
npm run test:api:watch

# Run integration tests
npm run test:api:integration
```

### Debugging Tests

```bash
# Debug specific test
node --inspect-brk ./node_modules/.bin/jest __tests__/api/chat/route.test.ts

# Verbose output
npm test -- --verbose __tests__/api/

# Update snapshots
npm test -- --updateSnapshot __tests__/api/
```

## Continuous Integration

### GitHub Actions

```yaml
# API test workflow
name: API Tests
on: [push, pull_request]

jobs:
  api-tests:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:13
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run API tests
        run: npm run test:api
        env:
          SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY }}
          OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
```

## Test Coverage Goals

### Coverage Targets

- **Lines**: 85%+
- **Functions**: 90%+
- **Branches**: 80%+
- **Statements**: 85%+

### Critical Paths

Priority testing areas:
1. Authentication flows (100% coverage)
2. Chat AI interactions (95% coverage)
3. Data validation (90% coverage)
4. Error handling (85% coverage)
5. Rate limiting (100% coverage)

## Best Practices

### Test Organization

1. **Group Related Tests**: Use `describe` blocks effectively
2. **Clear Test Names**: Describe expected behavior
3. **Setup/Teardown**: Proper test isolation
4. **Mock Management**: Reset mocks between tests
5. **Async Handling**: Proper async/await usage

### Performance Considerations

1. **Test Speed**: Keep tests fast (<100ms each)
2. **Parallel Execution**: Enable concurrent test runs
3. **Resource Cleanup**: Prevent memory leaks
4. **Mock Efficiency**: Use lightweight mocks

### Maintenance

1. **Regular Updates**: Keep tests updated with API changes
2. **Mock Accuracy**: Ensure mocks match real service behavior
3. **Documentation**: Document complex test scenarios
4. **Refactoring**: Remove duplicate test code

## Related Documentation

- [Main Tests README](/Users/jamesguy/Omniops/__tests__/README.md) - Overall testing strategy
- [Integration Tests](/Users/jamesguy/Omniops/__tests__/integration/README.md) - Full system tests
- [Library Tests](/Users/jamesguy/Omniops/__tests__/lib/README.md) - Business logic tests
- [API Documentation](/Users/jamesguy/Omniops/app/api/README.md) - API endpoint documentation