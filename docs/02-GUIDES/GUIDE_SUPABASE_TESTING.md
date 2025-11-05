# Supabase Testing Guide

**Type:** Guide
**Status:** Active
**Last Updated:** 2025-11-05
**Verified For:** v0.1.0
**Dependencies:**
- [lib/supabase/server.ts](/Users/jamesguy/Omniops/lib/supabase/server.ts)
- [test-utils/supabase-test-helpers.ts](/Users/jamesguy/Omniops/test-utils/supabase-test-helpers.ts)

**Estimated Read Time:** 8 minutes

## Purpose

This guide standardizes how to import, mock, and test Supabase functionality across the codebase. It eliminates the 4+ inconsistent import patterns that were causing test complexity and provides simple, reusable test helpers.

## Quick Links
- [Canonical Server Import](#canonical-server-import)
- [Test Helper Functions](#test-helper-functions)
- [Common Testing Patterns](#common-testing-patterns)
- [Migration Guide](#migration-guide)

---

## Table of Contents
- [Import Standards](#import-standards)
- [Test Helper Functions](#test-helper-functions)
- [Common Testing Patterns](#common-testing-patterns)
- [Advanced Scenarios](#advanced-scenarios)
- [Migration Guide](#migration-guide)
- [Troubleshooting](#troubleshooting)

---

## Import Standards

### Production Code - Canonical Import

**ALWAYS use the canonical import** in production code:

```typescript
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const supabase = await createClient()

  if (!supabase) {
    return NextResponse.json(
      { error: 'Database service unavailable' },
      { status: 503 }
    )
  }

  // Use supabase client...
}
```

**Available Functions:**
- `createClient()` - User-authenticated client (uses Next.js cookies)
- `createServiceRoleClient()` - Admin client (bypasses RLS)
- `createServiceRoleClientSync()` - Synchronous service role client
- `requireClient()` - Client or throws production-safe error
- `requireServiceRoleClient()` - Service role client or throws

**Why this import?**
- Single source of truth
- Handles Next.js cookies correctly
- Safe environment variable validation
- Consistent connection pooling configuration
- Production-safe error handling

### Test Code - Use Test Helpers

**NEVER mock the module directly.** Use test helpers instead:

```typescript
import { createMockSupabaseClient, createAuthenticatedMockClient } from '@/test-utils/supabase-test-helpers'
import { createClient } from '@/lib/supabase/server'

// Mock the module once
jest.mock('@/lib/supabase/server')

describe('My API Route', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('handles authenticated users', async () => {
    const mockSupabase = createAuthenticatedMockClient('user-123')
    ;(createClient as jest.Mock).mockResolvedValue(mockSupabase)

    const response = await POST(mockRequest)
    expect(response.status).toBe(200)
  })
})
```

---

## Test Helper Functions

### Core Functions

#### `createMockSupabaseClient(overrides?)`
Creates a basic mock Supabase client. Default state is unauthenticated.

```typescript
const mockClient = createMockSupabaseClient()

// With overrides
const mockClient = createMockSupabaseClient({
  auth: {
    getUser: jest.fn().mockResolvedValue({
      data: { user: { id: 'custom-user' } },
      error: null
    })
  }
})
```

#### `createAuthenticatedMockClient(userId?, email?)`
Creates a mock client for an authenticated user.

```typescript
const mockClient = createAuthenticatedMockClient('user-123', 'test@example.com')

// Default values if omitted
const mockClient = createAuthenticatedMockClient()
// userId: 'test-user-id'
// email: 'test@example.com'
```

#### `createUnauthenticatedMockClient()`
Creates a mock client with auth errors. Use for testing 401 scenarios.

```typescript
const mockClient = createUnauthenticatedMockClient()

const { data, error } = await mockClient.auth.getUser()
// data: { user: null }
// error: { message: 'Not authenticated' }
```

#### `createMockClientWithTableData(tableName, data, error?)`
Creates a mock with specific table data responses.

```typescript
const mockClient = createMockClientWithTableData(
  'customer_configs',
  { id: 1, domain: 'example.com' }
)

const { data } = await mockClient
  .from('customer_configs')
  .select('*')
  .single()

// Returns: { data: { id: 1, domain: 'example.com' }, error: null }
```

#### `createErrorMockClient(errorMessage?)`
Creates a mock that returns database errors for all queries.

```typescript
const mockClient = createErrorMockClient('Connection timeout')

const { data, error } = await mockClient
  .from('users')
  .select('*')

// Returns: { data: null, error: { message: 'Connection timeout' } }
```

#### `createServiceRoleMockClient()`
Creates a mock service role client (bypasses RLS in real usage).

```typescript
const mockClient = createServiceRoleMockClient()

// Same as authenticated mock but signals elevated permissions
```

### Helper Functions

#### `mockSuccessQuery(data)`
Creates a query builder that returns successful data.

```typescript
const mockClient = createMockSupabaseClient()
mockClient.from = jest.fn(() => mockSuccessQuery([
  { id: 1, name: 'Item 1' },
  { id: 2, name: 'Item 2' }
]))

const { data } = await mockClient.from('items').select('*')
// Returns: [{ id: 1, name: 'Item 1' }, { id: 2, name: 'Item 2' }]
```

#### `mockErrorQuery(errorMessage, code?)`
Creates a query builder that returns errors.

```typescript
const mockClient = createMockSupabaseClient()
mockClient.from = jest.fn(() => mockErrorQuery('Record not found', 'PGRST116'))

const { data, error } = await mockClient
  .from('items')
  .select('*')
  .eq('id', 999)
  .single()

// Returns: { data: null, error: { message: 'Record not found', code: 'PGRST116' } }
```

#### `resetSupabaseMocks(client)`
Clears all mock call history. Call in `beforeEach`.

```typescript
beforeEach(() => {
  resetSupabaseMocks(mockClient)
})
```

---

## Common Testing Patterns

### Pattern 1: Testing Authenticated Endpoints

```typescript
import { createAuthenticatedMockClient } from '@/test-utils/supabase-test-helpers'
import { createClient } from '@/lib/supabase/server'
import { POST } from '@/app/api/protected/route'

jest.mock('@/lib/supabase/server')

describe('POST /api/protected', () => {
  it('allows authenticated users', async () => {
    const mockClient = createAuthenticatedMockClient('user-123')
    ;(createClient as jest.Mock).mockResolvedValue(mockClient)

    const response = await POST(mockRequest)

    expect(response.status).toBe(200)
    expect(mockClient.auth.getUser).toHaveBeenCalled()
  })

  it('rejects unauthenticated users', async () => {
    const mockClient = createUnauthenticatedMockClient()
    ;(createClient as jest.Mock).mockResolvedValue(mockClient)

    const response = await POST(mockRequest)

    expect(response.status).toBe(401)
  })
})
```

### Pattern 2: Testing Database Queries

```typescript
import { createMockClientWithTableData } from '@/test-utils/supabase-test-helpers'

it('fetches customer configuration', async () => {
  const mockData = {
    id: 1,
    domain: 'example.com',
    widget_settings: { color: 'blue' }
  }

  const mockClient = createMockClientWithTableData('customer_configs', mockData)
  ;(createClient as jest.Mock).mockResolvedValue(mockClient)

  const result = await getCustomerConfig('example.com')

  expect(result).toEqual(mockData)
})
```

### Pattern 3: Testing Error Handling

```typescript
import { createErrorMockClient } from '@/test-utils/supabase-test-helpers'

it('handles database errors gracefully', async () => {
  const mockClient = createErrorMockClient('Connection timeout')
  ;(createClient as jest.Mock).mockResolvedValue(mockClient)

  const response = await POST(mockRequest)

  expect(response.status).toBe(500)
  const data = await response.json()
  expect(data.error).toContain('database')
})
```

### Pattern 4: Testing Service Role Operations

```typescript
import { createServiceRoleMockClient } from '@/test-utils/supabase-test-helpers'
import { createServiceRoleClient } from '@/lib/supabase/server'

jest.mock('@/lib/supabase/server')

it('performs admin operations with service role', async () => {
  const mockClient = createServiceRoleMockClient()
  ;(createServiceRoleClient as jest.Mock).mockResolvedValue(mockClient)

  // Service role bypasses RLS in production
  const result = await adminOperation()

  expect(result).toBeDefined()
})
```

### Pattern 5: Testing Multiple Table Queries

```typescript
it('joins data from multiple tables', async () => {
  const mockClient = createMockSupabaseClient()

  // Mock specific table responses
  mockClient.from = jest.fn((table: string) => {
    if (table === 'users') {
      return mockSuccessQuery([{ id: 1, name: 'John' }])
    }
    if (table === 'orders') {
      return mockSuccessQuery([{ id: 100, user_id: 1 }])
    }
    return mockSuccessQuery([])
  })

  ;(createClient as jest.Mock).mockResolvedValue(mockClient)

  const result = await fetchUserWithOrders(1)

  expect(mockClient.from).toHaveBeenCalledWith('users')
  expect(mockClient.from).toHaveBeenCalledWith('orders')
  expect(result.user.name).toBe('John')
  expect(result.orders).toHaveLength(1)
})
```

---

## Advanced Scenarios

### Testing Storage Operations

```typescript
it('uploads file to storage', async () => {
  const mockClient = createMockSupabaseClient()

  // Storage bucket mock is included by default
  const result = await mockClient.storage
    .from('avatars')
    .upload('user-123.png', file)

  expect(result.data).toBeDefined()
  expect(result.error).toBeNull()
})
```

### Testing Real-time Subscriptions

```typescript
it('subscribes to real-time updates', async () => {
  const mockClient = createMockSupabaseClient()

  const channel = mockClient
    .channel('table-changes')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, callback)
    .subscribe()

  expect(mockClient.channel).toHaveBeenCalledWith('table-changes')
})
```

### Testing RPC Calls

```typescript
it('calls remote procedure', async () => {
  const mockClient = createMockSupabaseClient({
    rpc: jest.fn().mockResolvedValue({
      data: { result: 'success' },
      error: null
    })
  })

  const { data } = await mockClient.rpc('calculate_total', { order_id: 123 })

  expect(mockClient.rpc).toHaveBeenCalledWith('calculate_total', { order_id: 123 })
  expect(data.result).toBe('success')
})
```

---

## Migration Guide

### Migrating from Old Patterns

#### Old Pattern 1: Direct Module Mock

```typescript
// ❌ BEFORE: Complex module mocking
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      // ... 20+ lines of chaining
    }))
  }))
}))
```

```typescript
// ✅ AFTER: Simple test helper
import { createMockSupabaseClient } from '@/test-utils/supabase-test-helpers'
import { createClient } from '@/lib/supabase/server'

jest.mock('@/lib/supabase/server')

const mockClient = createMockSupabaseClient()
;(createClient as jest.Mock).mockResolvedValue(mockClient)
```

#### Old Pattern 2: Inline Mock Objects

```typescript
// ❌ BEFORE: Ad-hoc mock creation
const mockSupabase = {
  auth: { getUser: jest.fn() },
  from: jest.fn(),
  // Incomplete mock
}
```

```typescript
// ✅ AFTER: Complete, consistent mock
import { createAuthenticatedMockClient } from '@/test-utils/supabase-test-helpers'

const mockClient = createAuthenticatedMockClient()
// Has all methods with correct signatures
```

#### Old Pattern 3: Test-Specific Utilities

```typescript
// ❌ BEFORE: Scattered test utilities
// __tests__/utils/supabase-mock.ts (inconsistent with others)
```

```typescript
// ✅ AFTER: Centralized helpers
import {
  createMockSupabaseClient,
  createAuthenticatedMockClient
} from '@/test-utils/supabase-test-helpers'
// One source of truth
```

### Migration Checklist

When updating a test file:

1. **Remove old mocks**
   - [ ] Delete `jest.mock('@supabase/supabase-js')` calls
   - [ ] Delete custom mock objects
   - [ ] Delete test-specific Supabase utilities

2. **Add new imports**
   - [ ] Import from `@/test-utils/supabase-test-helpers`
   - [ ] Add `jest.mock('@/lib/supabase/server')`

3. **Replace mock creation**
   - [ ] Use `createAuthenticatedMockClient()` for auth scenarios
   - [ ] Use `createUnauthenticatedMockClient()` for 401 tests
   - [ ] Use `createMockClientWithTableData()` for query tests

4. **Update test assertions**
   - [ ] Verify mocks are called correctly
   - [ ] Check that auth state is tested
   - [ ] Ensure error cases are covered

5. **Run tests**
   - [ ] Tests pass with new mocks
   - [ ] Coverage maintained or improved
   - [ ] No regressions in behavior

---

## Troubleshooting

### Issue: "Cannot read property 'from' of null"

**Cause:** `createClient()` returned `null` (missing env vars or error)

**Solution:** Mock the function to return a client:
```typescript
;(createClient as jest.Mock).mockResolvedValue(mockClient)
```

### Issue: "TypeError: mockClient.from(...).select is not a function"

**Cause:** Query builder chain is broken

**Solution:** Ensure you're using `createMockQueryBuilder()` or helpers:
```typescript
const mockClient = createMockSupabaseClient()
// All query methods are pre-chained
```

### Issue: Test passes individually but fails in suite

**Cause:** Mock state is leaking between tests

**Solution:** Clear mocks in `beforeEach`:
```typescript
beforeEach(() => {
  jest.clearAllMocks()
  resetSupabaseMocks(mockClient)
})
```

### Issue: "auth.getUser is not a function"

**Cause:** Incomplete mock object

**Solution:** Use helper functions, they include all methods:
```typescript
const mockClient = createAuthenticatedMockClient()
// Has complete auth interface
```

### Issue: Tests are slow

**Cause:** Module mocking overhead

**Solution:** Already solved! Test helpers use simple object mocks (no module loading).

---

## Best Practices

### ✅ DO

- Use `createAuthenticatedMockClient()` by default for authenticated routes
- Use `createUnauthenticatedMockClient()` to test 401 responses
- Call `jest.clearAllMocks()` in `beforeEach()`
- Test both success and error paths
- Use specific helpers for specific scenarios

### ❌ DON'T

- Don't mock `@supabase/supabase-js` directly
- Don't create incomplete mock objects
- Don't reuse mock state across tests
- Don't test implementation details (internal method calls)
- Don't forget to clear mocks between tests

---

## Reference

### All Available Helpers

| Helper | Purpose | Use Case |
|--------|---------|----------|
| `createMockSupabaseClient()` | Basic mock | General testing |
| `createAuthenticatedMockClient()` | Authenticated user | Protected routes |
| `createUnauthenticatedMockClient()` | No user | 401 testing |
| `createMockClientWithTableData()` | Specific table data | Query testing |
| `createErrorMockClient()` | Database errors | Error handling |
| `createServiceRoleMockClient()` | Admin operations | Service role testing |
| `mockSuccessQuery()` | Success response | Inline query mocking |
| `mockErrorQuery()` | Error response | Inline error mocking |
| `resetSupabaseMocks()` | Clear mock state | Test cleanup |

### Import Paths

```typescript
// Production
import { createClient } from '@/lib/supabase/server'

// Testing
import { createMockSupabaseClient } from '@/test-utils/supabase-test-helpers'
```

### Further Reading

- [Database Schema Reference](../09-REFERENCE/REFERENCE_DATABASE_SCHEMA.md)
- [API Testing Guide](GUIDE_API_TESTING.md) (if exists)
- [Test-Utils README](../../test-utils/README.md)

---

**Questions or Issues?** Check the [troubleshooting section](#troubleshooting) or create an issue.
