# Testing Supabase API Routes in Next.js 15

**Status:** Known Issue - Mocking Pattern Under Investigation

---

## The Problem

**Current Situation:**
- 37+ API route tests failing with mocking errors
- Standard `jest.mock()` doesn't work with Next.js 15 + Supabase SSR
- Error: `TypeError: createClient.mockResolvedValue is not a function`

**Root Cause:**
```typescript
// lib/supabase/server.ts
export async function createClient() {
  const cookieStore = await cookies()  // ← Next.js 15 async cookies
  return createServerClient(...)        // ← Supabase SSR client
}
```

The function uses:
1. **Async `cookies()`** from Next.js 15 (hard to mock)
2. **`createServerClient`** from `@supabase/ssr` (complex mock)
3. **Cookie handling logic** (stateful)

---

## What We've Tried

### Attempt 1: Standard Module Mocking ❌

```typescript
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(),
}));

// Later in test:
(createClient as jest.Mock).mockResolvedValue(mockClient);
```

**Result:** `TypeError: createClient.mockResolvedValue is not a function`

**Why it fails:** Jest can't properly mock the async module structure

---

### Attempt 2: Mock Factory Helpers ❌

```typescript
// test-utils/api-test-helpers.ts
export function mockSupabaseClient(options) {
  return { auth: {...}, from: {...} };
}

jest.mock('@/lib/supabase/server');
(createClient as jest.Mock).mockResolvedValue(mockSupabaseClient());
```

**Result:** Same error - the mock isn't recognized

**Why it fails:** The module mock doesn't properly replace the import

---

### Attempt 3: Unstable Mock Module ⚠️

```typescript
// test-utils/supabase-mock.ts
export async function setupSupabaseRouteMocks() {
  jest.unstable_mockModule('next/headers', () => ({
    cookies: jest.fn().mockResolvedValue({...}),
  }));

  jest.unstable_mockModule('@supabase/ssr', () => ({
    createServerClient: jest.fn(...),
  }));
}
```

**Result:** In progress - requires dynamic imports in tests

**Challenge:** Routes use static imports, tests need dynamic

---

## The Challenge

### Module Loading Conflict

**Route Handler:**
```typescript
import { createClient } from '@/lib/supabase/server';  // Static import

export async function GET() {
  const supabase = await createClient();  // Can't be mocked after import
}
```

**Test File:**
```typescript
import { GET } from '@/app/api/route';  // Must import to test

// But by the time we mock, the route has already imported createClient!
jest.mock('@/lib/supabase/server');  // Too late
```

### The Catch-22

1. Tests need to import route handlers to test them
2. Route handlers statically import `createClient`
3. Jest mocks must be set up BEFORE imports
4. But we can't test without importing the route
5. **Circular dependency**

---

## Possible Solutions

### Option 1: Refactor to Dependency Injection ✅ Best

**Change routes to accept client as parameter:**

```typescript
// lib/supabase/server.ts
export async function createClient() { ... }

// app/api/organizations/route.ts
export async function GET(
  request?: NextRequest,
  supabase?: SupabaseClient  // ← Accept as param
) {
  const client = supabase || await createClient();  // Use provided or create
  // ... rest of logic
}
```

**Test becomes:**
```typescript
const mockClient = createMockSupabaseClient();
const response = await GET(undefined, mockClient);  // Pass mock directly
```

**Pros:**
- Clean, testable design
- No mocking complexity
- Works with all test frameworks

**Cons:**
- Requires refactoring ALL route handlers
- ~50+ API route files to update

---

### Option 2: Use MSW (Mock Service Worker) ✅ Recommended

**Mock at HTTP level instead of module level:**

```typescript
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';

const server = setupServer(
  http.post('*/auth/v1/token', () => {
    return HttpResponse.json({ user: mockUser });
  }),
  http.get('*/rest/v1/organizations*', () => {
    return HttpResponse.json(mockOrganizations);
  })
);

beforeAll(() => server.listen());
afterAll(() => server.close());
```

**Pros:**
- No module mocking needed
- Tests actual HTTP behavior
- Already using MSW in codebase

**Cons:**
- Need to mock ALL Supabase endpoints
- More setup per test file

---

### Option 3: Dynamic Imports in Tests ⚠️ Complex

**Use dynamic imports everywhere:**

```typescript
describe('Organizations API', () => {
  beforeAll(async () => {
    await setupSupabaseRouteMocks();
  });

  it('should list organizations', async () => {
    const { GET } = await import('@/app/api/organizations/route');
    const response = await GET();
    expect(response.status).toBe(200);
  });
});
```

**Pros:**
- Allows `jest.unstable_mockModule()` to work
- No refactoring needed

**Cons:**
- Unstable API
- Harder to maintain
- TypeScript complications

---

### Option 4: Test Against Real Supabase ✅ E2E Only

**Use actual Supabase instance for integration tests:**

```typescript
// Skip if no credentials
const supabaseUrl = process.env.TEST_SUPABASE_URL;
test.skipIf(!supabaseUrl)('should create organization', async () => {
  const response = await POST(request);
  expect(response.status).toBe(201);
});
```

**Pros:**
- Tests real behavior
- No mocking complexity
- Catches integration issues

**Cons:**
- Slow (network calls)
- Requires test database
- Not pure unit tests

---

## Recommended Approach

### Short-Term: Skip Problematic Tests

```typescript
// Mark tests as TODO until mocking resolved
describe.skip('Organizations API', () => {
  // Tests here
});
```

**Document why:**
```markdown
## Known Issues
- 37 API route tests skipped due to Supabase mocking pattern
- See docs/TESTING_SUPABASE_ROUTES.md for details
```

---

### Medium-Term: Use MSW for API Tests

```typescript
// test-utils/msw-handlers.ts
export const supabaseHandlers = [
  http.get('*/rest/v1/organizations*', ({ request }) => {
    const url = new URL(request.url);
    const userId = request.headers.get('x-user-id');

    if (!userId) {
      return new HttpResponse(null, { status: 401 });
    }

    return HttpResponse.json(mockOrganizations);
  }),
];

// __tests__/setup.ts
import { setupServer } from 'msw/node';
import { supabaseHandlers } from '@/test-utils/msw-handlers';

export const server = setupServer(...supabaseHandlers);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

---

### Long-Term: Refactor to Dependency Injection

**Phase 1:** Create wrapper functions
```typescript
// lib/api-helpers.ts
export async function withSupabase<T>(
  handler: (supabase: SupabaseClient) => Promise<T>
): Promise<T> {
  const supabase = await createClient();
  if (!supabase) throw new Error('Database unavailable');
  return handler(supabase);
}
```

**Phase 2:** Refactor routes gradually
```typescript
export async function GET() {
  return withSupabase(async (supabase) => {
    const { data, error } = await supabase.from('organizations').select();
    return NextResponse.json({ data });
  });
}
```

**Phase 3:** Make testable
```typescript
export async function GET(
  request?: NextRequest,
  supabase?: SupabaseClient
) {
  if (supabase) {
    // Test mode - use provided client
    return handleRequest(supabase);
  }
  // Production mode - create client
  return withSupabase(handleRequest);
}
```

---

## Current Test Status

### Affected Files (37 failing tests)

**Agent Providers:**
- `woocommerce-provider.test.ts` - 15 failures (mocking `getDynamicWooCommerceClient`)
- `shopify-provider.test.ts` - 22 failures (mocking `getDynamicShopifyClient`)

**API Routes:**
- `organizations/route.test.ts` - 6 failures (mocking `createClient`)
- Multiple chat route tests timing out

**Total Impact:** ~40-50 tests blocked by mocking issues

---

## Workaround for New Tests

Until we implement a permanent solution, write tests that:

1. **Focus on business logic in pure functions**
   ```typescript
   // ✅ Testable
   export function validateOrganizationSlug(slug: string): boolean {
     return /^[a-z0-9-]+$/.test(slug);
   }

   // ❌ Hard to test
   export async function GET() {
     const supabase = await createClient();
     // ... complex logic
   }
   ```

2. **Extract testable utilities**
   ```typescript
   // lib/organization-utils.ts
   export function generateSlug(name: string): string {
     return name
       .toLowerCase()
       .replace(/[^a-z0-9]+/g, '-')
       .replace(/^-+|-+$/g, '')
       .substring(0, 50);
   }

   // ✅ Easy to test without mocking
   expect(generateSlug('My Org!')).toBe('my-org');
   ```

3. **Document integration test needs**
   ```typescript
   describe('Organizations API Integration', () => {
     it.todo('should create organization with real Supabase');
     it.todo('should list user organizations');
   });
   ```

---

## Action Items

- [ ] **Immediate:** Document which tests are blocked and why
- [ ] **Week 1:** Set up MSW handlers for Supabase endpoints
- [ ] **Week 2:** Convert 5 API route tests to use MSW
- [ ] **Month 1:** Evaluate dependency injection refactor scope
- [ ] **Month 2:** Create RFC for route handler refactor
- [ ] **Long-term:** Gradually refactor routes to be testable

---

## References

- [Next.js 15 Testing Docs](https://nextjs.org/docs/app/building-your-application/testing)
- [Jest Manual Mocks](https://jestjs.io/docs/manual-mocks)
- [MSW Setup](https://mswjs.io/docs/getting-started)
- [Supabase SSR Guide](https://supabase.com/docs/guides/auth/server-side-rendering)

---

## Last Updated

**Date:** 2025-10-21
**Status:** Investigation complete, solution options documented
**Decision Needed:** Which approach to implement (MSW recommended)
