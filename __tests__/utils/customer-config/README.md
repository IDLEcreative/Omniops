# Customer Config Test Utilities

**Type:** Test Infrastructure
**Status:** Active
**Last Updated:** 2025-11-18
**Verified For:** v0.1.0
**Estimated Read Time:** 3 minutes

**Related:** `__tests__/api/customer-config/security/`

## Purpose

Shared utilities for customer config API security testing. Provides reusable helpers for test data setup, authentication, and API requests.

## Modules

### test-setup.ts

**Purpose:** Test data initialization and cleanup

**Exports:**
- `initializeTestData()` - Creates test organizations, users, and configs
- `cleanupTestData(context)` - Removes all test data in correct order
- `TestDataContext` - Type definition for test data context

**Usage:**
```typescript
const context = await initializeTestData();
// Now have: org1Id, org2Id, user1Id, user2Id, config1Id, config2Id, etc.
await cleanupTestData(context);
```

### auth-helpers.ts

**Purpose:** Authentication utilities for test execution

**Exports:**
- `getAuthTokenFor(client, email, password)` - Sign in and get access token
- `signOutUser(client)` - Sign out authenticated user
- `createAuthHeader(token)` - Create authorization header
- `createAuthJsonHeaders(token)` - Create auth + JSON headers

**Usage:**
```typescript
const token = await getAuthTokenFor(client, 'user@example.com', 'password');
const headers = createAuthJsonHeaders(token);
await fetch(url, { headers });
```

### api-request-helpers.ts

**Purpose:** Reusable API request functions

**Exports:**
- `getConfigs(authToken?)` - GET /api/customer/config
- `createConfig(domain, name, authToken?)` - POST /api/customer/config
- `updateConfig(id, updates, authToken?)` - PUT /api/customer/config
- `deleteConfig(id, authToken?)` - DELETE /api/customer/config
- `apiRequest(path, options)` - Generic fetch wrapper

**Usage:**
```typescript
const response = await getConfigs(token);
expect(response.status).toBe(200);
```

## Test Organization

**Test Structure:**
```
__tests__/api/customer-config/
├── security.test.ts           (orchestrator - imports all suites)
└── security/
    ├── get.test.ts           (GET endpoint tests)
    ├── post.test.ts          (POST endpoint tests)
    ├── put.test.ts           (PUT endpoint tests)
    ├── delete.test.ts        (DELETE endpoint tests)
    └── rls.test.ts           (RLS policy tests)
```

**Test Data Flow:**
1. Main orchestrator loads env vars
2. Each test suite calls `initializeTestData()`
3. Suite runs tests with test context
4. Suite calls `cleanupTestData()` in afterAll

## Key Design Patterns

**1. Shared Test Data**
- Each test suite has independent `beforeAll/afterAll`
- Prevents test pollution and allows parallel execution
- Cleanup uses reverse dependency order

**2. Helper Abstraction**
- API calls use high-level helpers (`getConfigs`, `createConfig`)
- Auth uses consistent patterns (`getAuthTokenFor`, `signOutUser`)
- Reduces test code duplication

**3. Type Safety**
- `TestDataContext` interface defines available data
- All exports properly typed
- Reduces runtime errors

## Line of Code Analysis

**Original:** security.test.ts = 554 LOC

**Refactored:**
- test-setup.ts = 125 LOC
- auth-helpers.ts = 53 LOC
- api-request-helpers.ts = 92 LOC
- get.test.ts = 54 LOC
- post.test.ts = 64 LOC
- put.test.ts = 76 LOC
- delete.test.ts = 100 LOC
- rls.test.ts = 68 LOC
- security.test.ts (orchestrator) = 35 LOC

**Total:** 667 LOC (includes helpers), but each file <300 LOC
**Test LOC (excluding helpers):** 362 LOC (5 test suites × ~70 LOC each)
**Utility LOC:** 305 LOC (3 helpers)

## Adding New Tests

To add a new security test suite:

1. Create `security/{feature}.test.ts`
2. Import utilities:
   ```typescript
   import { initializeTestData, cleanupTestData } from '@/__tests__/utils/customer-config/test-setup';
   import { getAuthTokenFor } from '@/__tests__/utils/customer-config/auth-helpers';
   ```
3. Add test suite with `beforeAll/afterAll` hooks
4. Import in `security.test.ts` orchestrator

## Troubleshooting

**"Failed to create test organizations"**
- Verify Supabase connection (check `.env.local`)
- Ensure service role key has admin permissions
- Check organizations table exists

**"Cannot get access token"**
- Verify user email/password in test data
- Ensure user was successfully created
- Check Supabase auth settings

**"RLS should block this" fails**
- Verify RLS policies exist on customer_configs table
- Check organization_members table has correct role
- Ensure authentication context is set
