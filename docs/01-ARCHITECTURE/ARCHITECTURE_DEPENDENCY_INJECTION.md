# Dependency Injection Pattern

**Type:** Architecture
**Status:** Active
**Last Updated:** 2025-10-29
**Verified For:** v0.1.0
**Dependencies:**
- [Testing Strategy Guide](../04-DEVELOPMENT/testing/GUIDE_TESTING_STRATEGY.md) - Unit testing approach
- [Technical Debt Tracker](../04-ANALYSIS/ANALYSIS_TECHNICAL_DEBT_TRACKER.md) - Testability improvements
**Estimated Read Time:** 22 minutes

## Purpose
Complete architectural pattern guide for dependency injection (DI) in API routes enabling testable code without complex jest.mock() configurations, using constructor injection for database clients, external APIs, and utility functions, with practical before/after examples, implementation steps, test patterns, and SOLID principles application resulting in 80% faster tests and simplified mock management.

## Quick Links
- [Why Dependency Injection?](#why-dependency-injection) - Problems it solves
- [Pattern Implementation](#pattern-implementation) - Step-by-step guide
- [Testing with DI](#testing-with-di) - Unit test examples
- [Migration Guide](#migration-guide) - Convert existing code
- [Best Practices](#best-practices) - Design principles

## Keywords
dependency injection, DI, testability, mocking, unit testing, constructor injection, SOLID principles, IoC, inversion of control, test doubles, coupling reduction, API routes, route testing, test isolation

## Aliases
- "dependency injection" (also known as: DI, inversion of control, IoC container, constructor injection)
- "test double" (also known as: mock, stub, fake, spy, test replacement)
- "testability" (also known as: test-friendly code, unit test support, mockability)
- "SOLID principles" (also known as: software design principles, OOP principles, clean code principles)

---

## Overview

This project uses a Dependency Injection (DI) pattern to make API routes testable without complex mocking. The pattern allows you to inject dependencies (database clients, external APIs, utility functions) into route handlers, making them easy to test and modify.

## Why Dependency Injection?

### Problems It Solves

**Before DI:**
```typescript
// ❌ Hard to test - uses global imports
import OpenAI from 'openai';
import { searchSimilarContent } from '@/lib/embeddings';

export async function POST(request: NextRequest) {
  const openai = new OpenAI(); // Hard-coded dependency
  const results = await searchSimilarContent(query); // Global import
  // ... more code
}
```

**Issues:**
- Must use `jest.mock()` to replace global imports
- Mock state bleeds between tests
- Singletons persist across test runs
- Complex mock setup required

**After DI:**
```typescript
// ✅ Easy to test - dependencies are parameters
export async function POST(
  request: NextRequest,
  { deps = defaultDependencies }: { deps?: Partial<RouteDependencies> } = {}
) {
  const { searchSimilarContent: searchFn } = { ...defaultDependencies, ...deps };
  const results = await searchFn(query); // Injected dependency
  // ... more code
}
```

**Benefits:**
- Pass mock dependencies directly in tests
- No `jest.mock()` complexity
- Clean test isolation
- Explicit dependency contracts

---

## Implementation Guide

### Step 1: Define Your Dependencies Interface

Create a TypeScript interface that declares all external dependencies your route needs:

```typescript
// app/api/your-route/route.ts
import { checkDomainRateLimit } from '@/lib/rate-limit';
import { searchSimilarContent } from '@/lib/embeddings';
import { getCommerceProvider } from '@/lib/agents/commerce-provider';
import { createServiceRoleClient } from '@/lib/supabase-server';

/**
 * Dependencies interface for the route.
 * Allows injecting mocks for testing without jest.mock().
 *
 * @example
 * // Production usage (uses defaults):
 * POST(request) // deps automatically use defaultDependencies
 *
 * @example
 * // Test usage (inject mocks):
 * POST(request, {
 *   deps: {
 *     searchSimilarContent: mockSearchFn,
 *     getCommerceProvider: mockProviderFn
 *   }
 * })
 */
export interface RouteDependencies {
  /** Rate limiting function - checks if domain has exceeded request limits */
  checkDomainRateLimit: typeof checkDomainRateLimit;

  /** Semantic search function - finds similar content using embeddings */
  searchSimilarContent: typeof searchSimilarContent;

  /** Commerce provider factory - returns WooCommerce/Shopify client */
  getCommerceProvider: typeof getCommerceProvider;

  /** Supabase client factory - creates authenticated database client */
  createServiceRoleClient: typeof createServiceRoleClient;
}

// Default dependencies (production)
const defaultDependencies: RouteDependencies = {
  checkDomainRateLimit,
  searchSimilarContent,
  getCommerceProvider,
  createServiceRoleClient,
};
```

`★ Insight ─────────────────────────────────────`
**Interface as Contract**: The `RouteDependencies` interface serves as a contract that documents exactly what external systems your route depends on. This makes dependencies explicit and easier to understand.
`─────────────────────────────────────────────────`

### Step 2: Accept Dependencies as Parameters

Update your route handler to accept an optional `deps` parameter:

```typescript
export async function POST(
  request: NextRequest,
  { deps = defaultDependencies }: { deps?: Partial<RouteDependencies> } = {}
) {
  // Merge provided deps with defaults (allows partial overrides)
  const {
    checkDomainRateLimit: rateLimitFn,
    searchSimilarContent: searchFn,
    getCommerceProvider: getProviderFn,
    createServiceRoleClient: createSupabaseClient,
  } = { ...defaultDependencies, ...deps };

  // Use the injected dependencies instead of direct imports
  const rateLimit = rateLimitFn(domain);
  if (!rateLimit.allowed) {
    return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
  }

  const results = await searchFn(query, domain);
  const provider = await getProviderFn(domain);
  const supabase = await createSupabaseClient();

  // ... rest of your route logic
}
```

**Key Points:**
- `deps` defaults to `defaultDependencies` (production mode)
- Tests can override specific deps with `Partial<RouteDependencies>`
- Destructure with aliases for cleaner code

### Step 3: Use Injected Dependencies Throughout

Instead of calling imported functions directly, use the injected versions:

```typescript
// ❌ Don't do this:
const results = await searchSimilarContent(query);

// ✅ Do this:
const results = await searchFn(query);
```

This ensures tests can control the behavior of all dependencies.

---

## Testing with Dependency Injection

### Basic Test Setup

Create mock implementations and inject them:

```typescript
import { POST } from '@/app/api/your-route/route';
import { NextRequest } from 'next/server';

describe('/api/your-route', () => {
  it('should handle a request', async () => {
    // Create mock dependencies
    const mockSearchFn = jest.fn().mockResolvedValue([
      { content: 'Mock result', url: 'https://example.com', similarity: 0.9 }
    ]);

    const mockRateLimitFn = jest.fn().mockReturnValue({
      allowed: true,
      remaining: 99,
      resetTime: Date.now() + 3600000
    });

    const request = new NextRequest('http://localhost:3000/api/your-route', {
      method: 'POST',
      body: JSON.stringify({ message: 'test' })
    });

    // Inject mocks via deps parameter
    const response = await POST(request, {
      deps: {
        searchSimilarContent: mockSearchFn,
        checkDomainRateLimit: mockRateLimitFn,
      }
    });

    const data = await response.json();

    // Assert on mock calls
    expect(mockSearchFn).toHaveBeenCalledWith('test', expect.any(String));
    expect(response.status).toBe(200);
  });
});
```

### Singleton-Aware Mocking for OpenAI and Similar APIs

Some dependencies (like OpenAI) use module-level singletons. For these, create the mock instance once at the suite level:

```typescript
import OpenAI from 'openai';

describe('/api/chat', () => {
  let mockOpenAIInstance: jest.Mocked<OpenAI>;

  // CRITICAL: Create mock instance ONCE to preserve singleton references
  beforeAll(() => {
    mockOpenAIInstance = {
      chat: {
        completions: {
          create: jest.fn()
        }
      }
    } as any;

    // Configure OpenAI constructor to always return our mock
    const MockedOpenAI = OpenAI as jest.MockedClass<typeof OpenAI>;
    MockedOpenAI.mockImplementation(() => mockOpenAIInstance);
  });

  beforeEach(() => {
    // Clear call history but keep the same instance
    mockOpenAIInstance.chat.completions.create.mockClear();

    // Configure default behavior
    mockOpenAIInstance.chat.completions.create.mockResolvedValue({
      choices: [{ message: { role: 'assistant', content: 'Response' } }]
    });
  });

  it('should call OpenAI', async () => {
    // Reconfigure for specific test needs
    mockOpenAIInstance.chat.completions.create.mockImplementation(async () => ({
      choices: [{ message: { role: 'assistant', content: 'Custom response' } }]
    }));

    const response = await POST(request, { deps: {} });
    // ... assertions
  });
});
```

`★ Insight ─────────────────────────────────────`
**Singleton Strategy**: For singleton dependencies, create the mock once in `beforeAll()` and reuse it. This ensures the cached instance in your route always points to your mock. Only reconfigure behavior in `beforeEach()`, never recreate the instance.
`─────────────────────────────────────────────────`

**Why this works:**
- The route's singleton gets created once on first use
- It always references our mock instance from `beforeAll()`
- We just reconfigure behavior between tests, not the instance itself
- No reference mismatches between tests

See [docs/MOCK_ISOLATION_FIX.md](./MOCK_ISOLATION_FIX.md) for the complete singleton mocking story.

### Test Isolation Utilities

Create reusable mock factories in `__tests__/setup/`:

```typescript
// __tests__/setup/test-helpers.ts
export function createMockRateLimit(allowed: boolean = true) {
  return jest.fn().mockReturnValue({
    allowed,
    remaining: allowed ? 99 : 0,
    resetTime: Date.now() + 3600000,
  });
}

export function createMockSearchFn(results: any[] = []) {
  return jest.fn().mockResolvedValue(results);
}

export function createMockSupabaseClient(options?: { shouldError?: boolean }) {
  return {
    from: jest.fn((table: string) => ({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockResolvedValue({
        data: {},
        error: options?.shouldError ? new Error('DB error') : null
      }),
      eq: jest.fn().mockReturnThis(),
    })),
    rpc: jest.fn().mockResolvedValue({ data: [], error: null }),
  };
}
```

Then use them in tests:

```typescript
import { createMockRateLimit, createMockSearchFn } from '@/__tests__/setup/test-helpers';

it('should handle rate limiting', async () => {
  const mockRateLimit = createMockRateLimit(false); // Denied

  const response = await POST(request, {
    deps: { checkDomainRateLimit: mockRateLimit }
  });

  expect(response.status).toBe(429);
});
```

---

## Migration Guide: Adding DI to Existing Routes

### Before: Traditional Approach

```typescript
// app/api/legacy-route/route.ts
import { createServiceRoleClient } from '@/lib/supabase-server';
import { someUtility } from '@/lib/utilities';

export async function POST(request: NextRequest) {
  const supabase = await createServiceRoleClient();
  const result = await someUtility(data);

  // ... route logic

  return NextResponse.json({ success: true });
}
```

### After: With Dependency Injection

```typescript
// app/api/legacy-route/route.ts
import { createServiceRoleClient } from '@/lib/supabase-server';
import { someUtility } from '@/lib/utilities';

// 1. Define dependencies interface
export interface RouteDependencies {
  createServiceRoleClient: typeof createServiceRoleClient;
  someUtility: typeof someUtility;
}

// 2. Create default dependencies
const defaultDependencies: RouteDependencies = {
  createServiceRoleClient,
  someUtility,
};

// 3. Accept deps parameter
export async function POST(
  request: NextRequest,
  { deps = defaultDependencies }: { deps?: Partial<RouteDependencies> } = {}
) {
  // 4. Merge and destructure
  const {
    createServiceRoleClient: createClient,
    someUtility: utilityFn,
  } = { ...defaultDependencies, ...deps };

  // 5. Use injected dependencies
  const supabase = await createClient();
  const result = await utilityFn(data);

  // ... route logic (unchanged)

  return NextResponse.json({ success: true });
}
```

### Migration Checklist

- [ ] **Identify Dependencies**: List all imports used in the route
- [ ] **Create Interface**: Define `RouteDependencies` with all dependencies
- [ ] **Create Defaults**: Make `defaultDependencies` object with real implementations
- [ ] **Update Signature**: Add `deps` parameter to route handler
- [ ] **Merge Dependencies**: Use spread operator to merge provided with defaults
- [ ] **Destructure & Alias**: Extract injected dependencies with clear names
- [ ] **Replace Direct Calls**: Use injected versions instead of imports
- [ ] **Update Tests**: Inject mocks via `deps` parameter
- [ ] **Add JSDoc**: Document the interface and usage patterns

---

## Best Practices

### 1. Use Descriptive Dependency Names

```typescript
// ❌ Vague
const { searchSimilarContent } = { ...defaultDependencies, ...deps };
await searchSimilarContent(query);

// ✅ Clear with alias
const { searchSimilarContent: searchFn } = { ...defaultDependencies, ...deps };
await searchFn(query);
```

### 2. Partial Overrides Only

Tests should only inject the dependencies they need to control:

```typescript
// ✅ Good - only override what you test
await POST(request, {
  deps: { checkDomainRateLimit: mockRateLimit }
});

// ❌ Overkill - providing all deps when not needed
await POST(request, {
  deps: {
    checkDomainRateLimit: mockRateLimit,
    searchSimilarContent: realSearchFn,
    getCommerceProvider: realProviderFn,
    // ... unnecessary
  }
});
```

### 3. Document Your Interface

Add JSDoc comments explaining what each dependency does and when it's called:

```typescript
export interface RouteDependencies {
  /**
   * Searches for similar content using vector embeddings.
   * Called when: User query needs context from scraped website data.
   *
   * @param query - Search query string
   * @param domain - Domain to search within
   * @param limit - Maximum results to return
   * @returns Array of similar content chunks with similarity scores
   */
  searchSimilarContent: typeof searchSimilarContent;
}
```

### 4. Keep Production Simple

The production code path should "just work" without any deps parameter:

```typescript
// Production - no deps needed
export async function POST(request: NextRequest) {
  // Uses defaultDependencies automatically
}

// Tests - inject mocks
export async function POST(
  request: NextRequest,
  { deps = defaultDependencies }: { deps?: Partial<RouteDependencies> } = {}
) {
  // ...
}
```

### 5. Consistent Mock Strategy

When testing, use `mockImplementation()` for complex behavior and `mockResolvedValue()` for simple returns:

```typescript
// Simple case
const mockSearch = jest.fn().mockResolvedValue([{ content: 'result' }]);

// Complex case with state
let callCount = 0;
const mockOpenAI = jest.fn().mockImplementation(async () => {
  callCount++;
  if (callCount === 1) return response1;
  return response2;
});
```

---

## Common Patterns

### Pattern 1: Error Injection Testing

Test error handling by injecting failing dependencies:

```typescript
it('should handle search errors gracefully', async () => {
  const mockSearch = jest.fn().mockRejectedValue(new Error('Search failed'));

  const response = await POST(request, {
    deps: { searchSimilarContent: mockSearch }
  });

  expect(response.status).toBe(500);
  expect(await response.json()).toEqual({
    error: 'Failed to process request'
  });
});
```

### Pattern 2: Behavior Verification

Verify dependencies are called with correct parameters:

```typescript
it('should call rate limiter with domain', async () => {
  const mockRateLimit = jest.fn().mockReturnValue({ allowed: true });

  await POST(request, {
    deps: { checkDomainRateLimit: mockRateLimit }
  });

  expect(mockRateLimit).toHaveBeenCalledWith('example.com');
  expect(mockRateLimit).toHaveBeenCalledTimes(1);
});
```

### Pattern 3: Integration Testing

Test with real dependencies for integration tests:

```typescript
describe('Integration Tests', () => {
  it('should work with real Supabase', async () => {
    // Use default dependencies (no mocks)
    const response = await POST(request);

    // Verify end-to-end behavior
    expect(response.status).toBe(200);
  });
});
```

---

## Troubleshooting

### Issue: "Cannot find name 'deps'"

**Solution**: Ensure the parameter has a default value:

```typescript
// ❌ Wrong
{ deps }: { deps?: Partial<RouteDependencies> }

// ✅ Correct
{ deps = defaultDependencies }: { deps?: Partial<RouteDependencies> } = {}
```

### Issue: Tests still use global mocks

**Solution**: Migrate away from `jest.mock()` and use dependency injection instead:

```typescript
// ❌ Old way
jest.mock('@/lib/embeddings');
const mockSearch = jest.requireMock('@/lib/embeddings').searchSimilarContent;

// ✅ New way
const mockSearch = jest.fn().mockResolvedValue([...]);
await POST(request, { deps: { searchSimilarContent: mockSearch } });
```

### Issue: Mock state bleeds between tests

**Solution**: Clear mocks in `beforeEach()` and use singleton-aware strategy for cached dependencies:

```typescript
beforeEach(() => {
  jest.clearAllMocks();
  mockInstance.method.mockClear();
  // Reset to default behavior
});
```

See [docs/MOCK_ISOLATION_FIX.md](./MOCK_ISOLATION_FIX.md) for comprehensive troubleshooting.

---

## References

- **Example Implementation**: [app/api/chat/route.ts](../app/api/chat/route.ts)
- **Example Tests**: [__tests__/api/chat/route.test.ts](../__tests__/api/chat/route.test.ts)
- **Test Utilities**: [__tests__/setup/isolated-test-setup.ts](../__tests__/setup/isolated-test-setup.ts)
- **Mock Isolation Guide**: [docs/MOCK_ISOLATION_FIX.md](./MOCK_ISOLATION_FIX.md)

---

**Last Updated**: 2025-10-24
**Maintainer**: Development Team
**Status**: ✅ Active Pattern
