**Last Updated:** 2025-11-18
**Verified Accurate For:** v0.1.0
**Status:** Active
**Type:** Reference

# Testing Guide

**Type:** Guide
**Status:** Active
**Last Updated:** 2025-11-18
**Verified For:** v0.1.0
**Dependencies:** [Testing Philosophy](/home/user/Omniops/CLAUDE.md#testing--code-quality-philosophy)
**Estimated Read Time:** 45 minutes

## Purpose

Comprehensive testing guide with real codebase examples covering unit tests, integration tests, E2E tests, mocking strategies, and CI/CD integration for the Omniops platform.

## Quick Links
- [Testing Philosophy](/home/user/Omniops/CLAUDE.md#testing--code-quality-philosophy)
- [E2E as Agent Training](/home/user/Omniops/CLAUDE.md#e2e-tests-as-agent-training-data)
- [Test Directory](/home/user/Omniops/__tests__/README.md)
- [MSW Mocks](/home/user/Omniops/__tests__/mocks/README.md)

**Keywords:** testing, Jest, Playwright, MSW, mocking, E2E, integration tests, unit tests, TDD

---

**Comprehensive testing documentation with real codebase examples from Omniops**

## Table of Contents

1. [Testing Philosophy](#testing-philosophy)
2. [Quick Start](#quick-start)
3. [Test Structure](#test-structure)
4. [Running Tests](#running-tests)
5. [Writing Tests](#writing-tests)
6. [Mocking Strategies](#mocking-strategies)
7. [Test Patterns by Feature](#test-patterns-by-feature)
8. [Integration Testing](#integration-testing)
9. [Debugging Tests](#debugging-tests)
10. [CI/CD Integration](#ci-cd-integration)
11. [Best Practices](#best-practices)

---

## Testing Philosophy

### Why We Test

- **Confidence**: Tests give us confidence to refactor and improve code
- **Documentation**: Tests serve as living documentation of how the system works
- **Regression Prevention**: Catch bugs before they reach production
- **Design Feedback**: Tests reveal design flaws early

### What We Test

- **Business Logic**: Functions, classes, utilities (80%+ coverage goal)
- **API Routes**: Request/response validation, error handling
- **Integration Points**: External services (WooCommerce, Shopify, OpenAI)
- **Security**: Multi-tenant isolation, authentication, data privacy
- **User Workflows**: End-to-end critical paths

### What We Don't Over-Test

- **Third-party libraries**: Trust well-tested dependencies
- **Simple getters/setters**: Unless they contain business logic
- **Trivial functions**: One-liners without logic

---

## Quick Start

### Run Your First Test

```bash
# Install dependencies
npm install

# Run all tests
npm test

# Run a specific test file
npm test -- __tests__/lib/encryption.test.ts

# Run tests in watch mode
npm test -- --watch
```

### Expected Output

```
PASS  __tests__/lib/encryption.test.ts
  Encryption
    ✓ should encrypt and decrypt a string correctly (15 ms)
    ✓ should handle empty strings (3 ms)
    ✓ should produce different ciphertexts for the same plaintext (8 ms)

Test Suites: 1 passed, 1 total
Tests:       3 passed, 3 total
```

---

## Test Structure

### Directory Layout

Our actual test structure:

```
__tests__/
├── api/                                    # API route tests
│   ├── chat/
│   │   ├── route.test.ts                  # Main chat endpoint
│   │   ├── route-async.test.ts            # Async behavior
│   │   └── malformed-tool-args.test.ts    # Edge cases
│   ├── gdpr/
│   │   ├── delete/route.test.ts           # GDPR deletion
│   │   ├── export/route.test.ts           # GDPR export
│   │   └── audit/route.test.ts            # Audit logs
│   ├── organizations/
│   │   ├── route.test.ts                  # Org CRUD
│   │   └── invitations.test.ts            # Team invites
│   └── scrape/route.test.ts               # Web scraping
│
├── lib/                                    # Unit tests for business logic
│   ├── encryption.test.ts                 # AES-256 encryption
│   ├── rate-limit.test.ts                 # Rate limiting
│   ├── embeddings.test.ts                 # Vector embeddings
│   ├── product-normalizer.test.ts         # E-commerce normalization
│   ├── woocommerce.test.ts                # WooCommerce client
│   ├── agents/
│   │   ├── router.test.ts                 # Agent routing
│   │   ├── customer-service-agent.test.ts # CS agent logic
│   │   └── providers/
│   │       ├── woocommerce-provider.test.ts
│   │       └── shopify-provider.test.ts
│   └── supabase/
│       └── database.test.ts               # Database helpers
│
├── integration/                            # Integration tests
│   ├── multi-tenant-isolation.test.ts     # Security: RLS validation
│   ├── rls-smoke-test.test.ts             # Row-level security
│   ├── shopify-ux-flow.test.ts            # Shopify integration
│   └── enhanced-scraper-system.test.ts    # Scraping system
│
├── app/                                    # Component tests
│   ├── chat/page.test.tsx                 # Chat page component
│   └── dashboard/telemetry/page.test.tsx  # Telemetry dashboard
│
├── mocks/                                  # Mock implementations
│   ├── handlers.ts                        # MSW request handlers
│   └── server.ts                          # MSW server setup
│
├── utils/                                  # Test utilities
│   ├── supabase-mock.ts                   # Supabase mock factory
│   └── integration-test-helpers.ts        # Integration helpers
│
├── setup/                                  # Test setup utilities
│   └── isolated-test-setup.ts             # Isolated test environment
│
└── playwright/                             # E2E tests
    ├── telemetry-smoke.spec.ts
    └── gdpr-privacy.spec.ts
```

### File Naming Conventions

- **Unit tests**: `*.test.ts` or `*.test.tsx`
- **Integration tests**: `*.test.ts` in `__tests__/integration/`
- **E2E tests**: `*.spec.ts` in `__tests__/playwright/`
- **Mock files**: Located in `__mocks__/` or `__tests__/mocks/`

---

## Running Tests

### Test Commands

```bash
# Run all tests
npm test

# Run only unit tests (excludes integration/)
npm run test:unit

# Run only integration tests
npm run test:integration

# Watch mode for development
npm test -- --watch

# Run specific file
npm test -- __tests__/lib/encryption.test.ts

# Run with coverage
npm test -- --coverage

# Verbose output
npm test -- --verbose

# Run serially (for debugging)
npm test -- --maxWorkers=1

# Update snapshots
npm test -- -u
```

### Test Scripts in package.json

```json
{
  "scripts": {
    "test": "jest",
    "test:unit": "jest --config=config/jest/jest.unit.config.js",
    "test:integration": "jest --config=config/jest/jest.integration.config.js",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:all": "npm run test:unit && npm run test:integration"
  }
}
```

---

## Writing Tests

### Basic Test Structure

Follow the **Arrange, Act, Assert** pattern:

```typescript
// __tests__/lib/encryption.test.ts
import { encrypt, decrypt } from '@/lib/encryption';

describe('Encryption', () => {
  beforeEach(() => {
    // Arrange: Setup test environment
    process.env.ENCRYPTION_KEY = '12345678901234567890123456789012';
  });

  it('should encrypt and decrypt a string correctly', () => {
    // Arrange
    const plainText = 'This is a secret message';

    // Act
    const encrypted = encrypt(plainText);
    const decrypted = decrypt(encrypted);

    // Assert
    expect(encrypted).not.toBe(plainText);
    expect(decrypted).toBe(plainText);
  });
});
```

### API Route Testing

Example from `/Users/jamesguy/Omniops/__tests__/api/chat/route.test.ts`:

```typescript
import { NextRequest } from 'next/server';
import { POST } from '@/app/api/chat/route';

describe('POST /api/chat', () => {
  it('should process chat messages', async () => {
    // Arrange
    const request = new NextRequest('http://localhost:3000/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'Hello, assistant!',
        domain: 'example.com'
      })
    });

    // Act
    const response = await POST(request);
    const data = await response.json();

    // Assert
    expect(response.status).toBe(200);
    expect(data).toHaveProperty('response');
  });
});
```

### Unit Test Example

Example from `/Users/jamesguy/Omniops/__tests__/lib/rate-limit.test.ts`:

```typescript
import { checkRateLimit } from '@/lib/rate-limit';

describe('Rate Limiting', () => {
  let currentTime: number;

  beforeEach(() => {
    // Mock time for consistent testing
    currentTime = 1000000;
    Date.now = jest.fn(() => currentTime);
  });

  it('should allow requests within rate limit', () => {
    const result = checkRateLimit('user-1', 5, 60000);

    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(4);
    expect(result.resetTime).toBe(currentTime + 60000);
  });

  it('should block requests exceeding rate limit', () => {
    // Use up the limit
    for (let i = 0; i < 5; i++) {
      checkRateLimit('user-1', 5, 60000);
    }

    // Next request should be blocked
    const result = checkRateLimit('user-1', 5, 60000);
    expect(result.allowed).toBe(false);
  });
});
```

### Component Testing

Example from `/Users/jamesguy/Omniops/__tests__/app/chat/page.test.tsx`:

```typescript
import { render, screen } from '@testing-library/react';
import ChatPage from '@/app/chat/page';

describe('ChatPage', () => {
  it('should render chat interface', () => {
    render(<ChatPage />);

    expect(screen.getByRole('textbox')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /send/i })).toBeInTheDocument();
  });
});
```

---

## Mocking Strategies

### Jest Configuration

Our actual `jest.config.js`:

```javascript
const nextJest = require('next/jest');

const createJestConfig = nextJest({ dir: './' });

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/test-utils/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  moduleNameMapper: {
    '^@woocommerce/woocommerce-rest-api$': '<rootDir>/__mocks__/@woocommerce/woocommerce-rest-api.js',
    '^@supabase/supabase-js$': '<rootDir>/__mocks__/@supabase/supabase-js.js',
    '^@/lib/supabase-server$': '<rootDir>/__mocks__/@/lib/supabase-server.ts',
    '^@/(.*)$': '<rootDir>/$1',
  },
  testPathIgnorePatterns: [
    '/node_modules/',
    '/__tests__/utils/',
    '/__tests__/mocks/',
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
};

module.exports = createJestConfig(customJestConfig);
```

### MSW (Mock Service Worker)

We use MSW for HTTP mocking. Configuration in `/Users/jamesguy/Omniops/__tests__/mocks/`:

#### Server Setup (`__tests__/mocks/server.ts`)

```typescript
import { setupServer } from 'msw/node';
import { handlers } from './handlers';

export const server = setupServer(...handlers);
```

#### Handlers (`__tests__/mocks/handlers.ts`)

```typescript
import { http, HttpResponse } from 'msw';

export const handlers = [
  // OpenAI API mock
  http.post('https://api.openai.com/v1/chat/completions', () => {
    return HttpResponse.json({
      choices: [{
        message: {
          role: 'assistant',
          content: 'This is a test response from the AI assistant.'
        }
      }]
    });
  }),

  // WooCommerce API mock
  http.get('*/wp-json/wc/v3/products', ({ request }) => {
    const url = new URL(request.url);
    const search = url.searchParams.get('search');

    let products = [
      { id: 1, name: 'Test Product', price: '19.99' },
      { id: 2, name: 'Another Product', price: '29.99' }
    ];

    if (search) {
      products = products.filter(p =>
        p.name.toLowerCase().includes(search.toLowerCase())
      );
    }

    return HttpResponse.json(products);
  }),
];
```

#### Setup in Tests (`test-utils/jest.setup.js`)

```javascript
import { server } from '../__tests__/mocks/server';

beforeAll(() => {
  server.listen({ onUnhandledRequest: 'bypass' });
});

afterEach(() => {
  server.resetHandlers();
});

afterAll(() => {
  server.close();
});
```

### Supabase Mocking

From `/Users/jamesguy/Omniops/__tests__/utils/supabase-mock.ts`:

```typescript
export const mockSupabaseClient = {
  from: jest.fn(() => ({
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue({ data: null, error: null }),
    then: jest.fn().mockResolvedValue({ data: [], error: null }),
  })),
  rpc: jest.fn().mockResolvedValue({ data: [], error: null }),
  auth: {
    getUser: jest.fn().mockResolvedValue({ data: { user: null }, error: null }),
  },
};

// Mock the server client
jest.mock('@/lib/supabase-server', () => ({
  createClient: jest.fn(() => Promise.resolve(mockSupabaseClient)),
}));
```

### Environment Variables

From `test-utils/jest.setup.js`:

```javascript
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';
process.env.OPENAI_API_KEY = 'test-openai-key';
process.env.ENCRYPTION_KEY = 'test-encryption-key-exactly-32ch';
```

### WooCommerce Mocking

Example from `/Users/jamesguy/Omniops/__tests__/lib/woocommerce.test.ts`:

```typescript
import WooCommerceRestApi from '@woocommerce/woocommerce-rest-api';

jest.mock('@woocommerce/woocommerce-rest-api');

describe('WooCommerce Integration', () => {
  let mockWooCommerceInstance: jest.Mocked<WooCommerceRestApi>;

  beforeEach(() => {
    mockWooCommerceInstance = {
      get: jest.fn(),
      post: jest.fn(),
      put: jest.fn(),
      delete: jest.fn(),
    };

    (WooCommerceRestApi as jest.MockedClass<typeof WooCommerceRestApi>)
      .mockImplementation(() => mockWooCommerceInstance);
  });

  it('should fetch products', async () => {
    mockWooCommerceInstance.get.mockResolvedValue({
      data: [{ id: 1, name: 'Product' }]
    });

    const products = await getProducts();
    expect(products).toHaveLength(1);
  });
});
```

---

## Test Patterns by Feature

### 1. Encryption Tests

File: `/Users/jamesguy/Omniops/__tests__/lib/encryption.test.ts`

**Key patterns:**
- Environment variable setup
- Security validation
- Tamper detection

```typescript
describe('Security tests', () => {
  it('should not leak plaintext in encrypted data', () => {
    const secret = 'ck_supersecretkey123456789';
    const encrypted = encrypt(secret);

    expect(encrypted.includes(secret)).toBe(false);
    expect(decrypt(encrypted)).toBe(secret);
  });

  it('should fail authentication with tampered data', () => {
    const plainText = 'Sensitive data';
    const encrypted = encrypt(plainText);

    // Tamper with the encrypted data
    const tampered = Buffer.from(encrypted, 'base64');
    tampered[tampered.length - 1] = tampered[tampered.length - 1] ^ 0xFF;

    expect(() => decrypt(tampered.toString('base64')))
      .toThrow('Failed to decrypt data');
  });
});
```

### 2. Rate Limiting Tests

File: `/Users/jamesguy/Omniops/__tests__/lib/rate-limit.test.ts`

**Key patterns:**
- Time mocking
- State isolation
- Concurrent request testing

```typescript
describe('Rate Limiting', () => {
  beforeEach(() => {
    currentTime = 1000000;
    Date.now = jest.fn(() => currentTime);
  });

  it('should reset rate limit after time window expires', () => {
    checkRateLimit('user', 2, 60000);
    checkRateLimit('user', 2, 60000);

    // Should be blocked
    let result = checkRateLimit('user', 2, 60000);
    expect(result.allowed).toBe(false);

    // Advance time past the window
    currentTime += 60001;

    // Should be allowed again
    result = checkRateLimit('user', 2, 60000);
    expect(result.allowed).toBe(true);
  });
});
```

### 3. Product Normalization Tests

File: `/Users/jamesguy/Omniops/__tests__/lib/product-normalizer.test.ts`

**Key patterns:**
- Price parsing
- Currency detection
- Discount calculation

```typescript
describe('ProductNormalizer', () => {
  it('should handle multiple currency symbols (discount scenario)', () => {
    const result = ProductNormalizer.normalizePrice('Was £49.99 Now £29.99');

    expect(result?.amount).toBe(29.99);
    expect(result?.original).toBe(49.99);
    expect(result?.discount).toBeCloseTo(20.00, 2);
    expect(result?.discountPercent).toBe(40);
  });
});
```

### 4. Chat Route Tests

File: `/Users/jamesguy/Omniops/__tests__/api/chat/route.test.ts`

**Key patterns:**
- Mock isolation
- Dependency injection
- OpenAI mocking

```typescript
describe('/api/chat', () => {
  let mockOpenAIInstance: jest.Mocked<OpenAI>;

  beforeAll(() => {
    mockOpenAIInstance = createFreshOpenAIMock();
    (OpenAI as jest.MockedClass<typeof OpenAI>)
      .mockImplementation(() => mockOpenAIInstance);
  });

  beforeEach(() => {
    resetTestEnvironment();
    mockOpenAIInstance.chat.completions.create.mockClear();
    configureDefaultOpenAIResponse(mockOpenAIInstance);
  });
});
```

---

## Integration Testing

### Multi-Tenant Isolation Tests

**CRITICAL SECURITY**: These tests validate Row-Level Security (RLS) policies.

File: `/Users/jamesguy/Omniops/__tests__/integration/multi-tenant-isolation.test.ts`

```typescript
/**
 * Multi-Tenant Data Isolation Tests
 * CRITICAL SECURITY: Verify cross-tenant data cannot be accessed
 *
 * IMPORTANT: These tests use REAL USER SESSIONS to validate RLS policies.
 * Service keys bypass RLS, so they CANNOT be used for security testing.
 */

import {
  setupRLSTest,
  createTestUser,
  queryAsUser,
  insertAsAdmin
} from '@/test-utils/rls-test-helpers';

describe('Multi-Tenant Data Isolation', () => {
  const rlsTest = setupRLSTest();

  beforeAll(async () => {
    await rlsTest.setup();

    // Create test data for each organization
    await insertAsAdmin('customer_configs', {
      organization_id: rlsTest.org1Id,
      domain: 'test1.example.com'
    });
  });

  it('should prevent cross-tenant data access', async () => {
    // User 2 should NOT see Org 1's data
    const { data, error } = await queryAsUser(
      rlsTest.user2Client,
      'customer_configs'
    );

    expect(data).not.toContainEqual(
      expect.objectContaining({
        organization_id: rlsTest.org1Id
      })
    );
  });
});
```

### Integration Test Helpers

File: `/Users/jamesguy/Omniops/__tests__/utils/integration-test-helpers.ts`

```typescript
export class TestDataFactory {
  /**
   * Generate realistic e-commerce product HTML
   */
  static createEcommerceProductHTML(config: {
    productCount?: number;
    includeStructuredData?: boolean;
    platform?: 'woocommerce' | 'shopify';
  } = {}): string {
    // ... generates realistic HTML with structured data
  }
}
```

---

## Debugging Tests

### Common Issues and Solutions

#### 1. NextRequest is Read-Only

```typescript
// ❌ Wrong - Will error
const req = new NextRequest(url);
req.headers.set('x-test', 'value'); // Error!

// ✅ Correct - Set headers in constructor
const req = new NextRequest(url, {
  headers: { 'x-test': 'value' }
});
```

#### 2. Async Mocks

```typescript
// ❌ Wrong - Synchronous return
jest.fn(() => ({ data: 'test' }))

// ✅ Correct - Async resolution
jest.fn().mockResolvedValue({ data: 'test' })
```

#### 3. Supabase Chaining

```typescript
// ✅ Correct - Mock chaining
const mock = {
  from: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  eq: jest.fn().mockResolvedValue({ data: [], error: null })
};
```

### Debug Commands

```bash
# Run with verbose output
npm test -- --verbose

# Run serially (easier to debug)
npm test -- --maxWorkers=1

# Detect open handles
npm test -- --detectOpenHandles

# Run specific test
npm test -- __tests__/lib/encryption.test.ts -t "should encrypt"
```

### Console Logging

```typescript
it('should debug mock calls', () => {
  const mockFn = jest.fn();
  mockFn('test');

  console.log('Mock calls:', mockFn.mock.calls);
  console.log('Mock results:', mockFn.mock.results);
});
```

---

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm ci

      - name: Run linting
        run: npm run lint

      - name: Run type checking
        run: npx tsc --noEmit

      - name: Run tests
        run: npm run test:all

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info
```

---

## Best Practices

### General Guidelines

1. **Write tests first** - Follow TDD when possible
2. **Test behavior, not implementation** - Focus on what users see
3. **Keep tests isolated** - Each test should be independent
4. **Use descriptive names** - `it('should allow valid email addresses')`
5. **Arrange, Act, Assert** - Structure tests clearly

### Test Organization

```typescript
describe('FeatureName', () => {
  describe('methodName', () => {
    it('should handle normal case', () => { /* ... */ });
    it('should handle edge case', () => { /* ... */ });
    it('should throw error on invalid input', () => { /* ... */ });
  });
});
```

### Mock Management

```typescript
beforeEach(() => {
  jest.clearAllMocks(); // Clear call history
});

afterEach(() => {
  jest.restoreAllMocks(); // Restore original implementations
});
```

### Coverage Goals

- **Unit tests**: 80%+ coverage for `lib/`
- **Integration tests**: Cover critical user workflows
- **API routes**: 70%+ coverage
- **Components**: Focus on user interactions

### When to Skip Tests

```typescript
// Skip if external dependency unavailable
const shouldRun = process.env.SUPABASE_URL && process.env.SUPABASE_KEY;

(shouldRun ? describe : describe.skip)('Integration Tests', () => {
  // Tests that need real Supabase
});
```

---

## Test Statistics

**Current Test Status** (as of documentation):
- **Total test files**: 62
- **Test categories**:
  - Unit tests: ~40 files
  - Integration tests: ~8 files
  - API route tests: ~10 files
  - Component tests: 2 files
  - E2E tests: 2 files

---

## Additional Resources

- **Jest Documentation**: https://jestjs.io/docs/getting-started
- **React Testing Library**: https://testing-library.com/docs/react-testing-library/intro/
- **MSW Documentation**: https://mswjs.io/docs/
- **Testing Best Practices**: https://kentcdodds.com/blog/common-mistakes-with-react-testing-library

---

## Real Test File References

All examples in this guide are from actual test files:

1. `/Users/jamesguy/Omniops/__tests__/lib/encryption.test.ts` - Lines 1-240
2. `/Users/jamesguy/Omniops/__tests__/lib/rate-limit.test.ts` - Lines 1-294
3. `/Users/jamesguy/Omniops/__tests__/lib/product-normalizer.test.ts` - Lines 1-80
4. `/Users/jamesguy/Omniops/__tests__/api/chat/route.test.ts` - Lines 1-100
5. `/Users/jamesguy/Omniops/__tests__/integration/multi-tenant-isolation.test.ts` - Lines 1-100
6. `/Users/jamesguy/Omniops/__tests__/mocks/handlers.ts` - Complete file
7. `/Users/jamesguy/Omniops/__tests__/utils/supabase-mock.ts` - Complete file
8. `/Users/jamesguy/Omniops/jest.config.js` - Complete file
9. `/Users/jamesguy/Omniops/test-utils/jest.setup.js` - Complete file

---

**Last Updated**: 2025-10-24
**Maintainer**: Development Team
**Related Docs**:
- [TESTING_QUICKSTART.md](../../TESTING_QUICKSTART.md)
- [TESTING.md](../../TESTING.md)
