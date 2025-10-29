# RLS Testing Infrastructure

## Overview

This document describes the Row Level Security (RLS) testing infrastructure implemented for the Omniops multi-tenant application. The infrastructure validates that organizations cannot access each other's data through PostgreSQL RLS policies enforced by Supabase.

## Why REST API Instead of SDK?

**Problem:** The Supabase JavaScript SDK has compatibility issues with Jest test environment, particularly:
- Cookie handling in SSR clients doesn't work in Node.js
- Auth session management fails in test environments
- MSW (Mock Service Worker) cannot properly intercept SDK requests

**Solution:** Direct REST API calls using native `fetch()`:
- Full control over authentication headers (Bearer tokens)
- Works reliably in all environments (Node, browser, Docker)
- Simple to mock and test
- No dependency on Supabase SDK internals

## Architecture

### Core Components

1. **REST API Helpers** ([test-utils/rls-test-helpers.ts](../test-utils/rls-test-helpers.ts))
   - `queryAsUser()` - Query database with user context (respects RLS)
   - `queryAsAdmin()` - Query database with service role (bypasses RLS)
   - `insertAsAdmin()` - Insert data with service role
   - `deleteAsAdmin()` - Delete data with service role

2. **User Authentication**
   - `createTestUser()` - Create test users via Auth Admin API
   - `deleteTestUser()` - Clean up test users
   - `getUserAccessToken()` - Get JWT token for user sessions
   - `createUserClient()` - Create authenticated Supabase client (legacy, prefer REST)

3. **Organization Management**
   - `createTestOrganization()` - Create test organizations
   - `deleteTestOrganization()` - Clean up test organizations
   - `setupRLSTest()` - Complete test suite helper

## REST API Pattern

### Querying as a Specific User

```typescript
// Get JWT token for the user
const token = await getUserAccessToken(email);

// Make authenticated request to PostgREST API
const response = await fetch(
  `${supabaseUrl}/rest/v1/${table}?id=eq.${value}`,
  {
    method: 'GET',
    headers: {
      'apikey': supabaseAnonKey,
      'Authorization': `Bearer ${token}` // User's JWT token
    }
  }
);

const data = await response.json();
```

### Simplified Helper Usage

```typescript
// Instead of SDK:
const { data } = await userClient.from('customer_configs').select('*').eq('id', configId);

// Use helper:
const configs = await queryAsUser(userEmail, 'customer_configs', { id: configId });
```

## Multi-Tenant Data Model

### Two Domain Types

The application has **two separate domain-related tables**:

1. **`domains` table** - For scraped content
   - Referenced by: `conversations`, `scraped_pages`, `page_embeddings`
   - Foreign key: `domain_id → domains.id`

2. **`customer_configs` table** - For chatbot configuration
   - Referenced by: `query_cache`
   - Foreign key: `domain_id → customer_configs.id` (confusing naming!)

### Schema Relationships

```
organizations
  ├─→ domains (1:many)
  │    ├─→ conversations
  │    ├─→ scraped_pages
  │    └─→ page_embeddings
  │
  ├─→ customer_configs (1:many)
  │    └─→ query_cache (via domain_id field)
  │
  └─→ organization_members (1:many)
```

## RLS Policy Implementation

### Helper Function (Prevents Recursion)

```sql
CREATE OR REPLACE FUNCTION is_organization_member(org_id uuid, user_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM organization_members
    WHERE organization_id = org_id
    AND user_id = user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**Why needed:** Without this function, RLS policies that query `organization_members` would cause infinite recursion when checking access to the `organization_members` table itself.

### Example RLS Policies

```sql
-- customer_configs - View own organization's configs
CREATE POLICY "Users can view customer_configs of their organizations"
ON customer_configs
FOR SELECT
USING (
  is_organization_member(organization_id, auth.uid())
);

-- conversations - View own domain's conversations
CREATE POLICY "Users can view conversations for their domains"
ON conversations
FOR SELECT
USING (
  domain_id IN (
    SELECT id FROM domains
    WHERE organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  )
);
```

## Test Structure

### Setup and Teardown

```typescript
describe('Multi-Tenant Data Isolation', () => {
  const rlsTest = setupRLSTest();
  let configId1: string;
  let configId2: string;
  let domainId1: string;
  let domainId2: string;

  beforeAll(async () => {
    // Create users and organizations
    await rlsTest.setup();

    // Create domains for scraped content
    const domain1 = await insertAsAdmin('domains', {
      organization_id: rlsTest.org1Id,
      domain: `test1-${Date.now()}.example.com`,
      name: 'Test Domain 1',
      active: true
    });
    domainId1 = domain1.id;

    // Create customer configs for chatbot
    const config1 = await insertAsAdmin('customer_configs', {
      organization_id: rlsTest.org1Id,
      domain: `test1-${Date.now()}.example.com`,
      business_name: 'Test Business 1'
    });
    configId1 = config1.id;
  });

  afterAll(async () => {
    // Cleanup domains and configs
    await deleteAsAdmin('domains', { id: domainId1 });
    await deleteAsAdmin('customer_configs', { id: configId1 });

    // Cleanup RLS test data (organizations and users)
    await rlsTest.teardown();
  });

  it('should prevent access to other organization\'s data', async () => {
    // User 1 should NOT see User 2's configs
    const user1Configs = await queryAsUser(
      rlsTest.user1Email,
      'customer_configs',
      { id: configId2 }
    );
    expect(user1Configs.length).toBe(0);
  });
});
```

## PostgREST Query Syntax

### Filter Operators

```typescript
// Equality
?id=eq.123

// Greater than
?created_at=gt.2024-01-01

// Less than
?age=lt.30

// Multiple filters (AND)
?status=eq.active&age=gte.18

// Or use object format in helper
const filter = {
  status: 'active',
  age: 18  // Automatically becomes eq.18
};
```

### Select Clause

```typescript
// Select specific columns
const users = await queryAsUser(email, 'users', {}, {
  select: 'id,email,name'
});

// Select with joins
const conversations = await queryAsUser(email, 'conversations', {}, {
  select: 'id,created_at,messages(id,content)'
});
```

## Common Pitfalls and Solutions

### 1. Schema Column Names

**Problem:** Documentation may not match actual database schema

**Example:**
```typescript
// ❌ WRONG: Using documented but non-existent column
await insertAsAdmin('page_embeddings', {
  chunk_index: 0,
  content: 'text'
});

// ✅ CORRECT: Using actual column names
await insertAsAdmin('page_embeddings', {
  chunk_text: 'text'  // Actual column name
});
```

**Solution:** Query actual schema when in doubt:
```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'page_embeddings';
```

### 2. Confusing domain_id References

**Problem:** `domain_id` foreign key points to different tables in different tables

```typescript
// conversations.domain_id → domains.id
await insertAsAdmin('conversations', {
  domain_id: domainId  // ✅ Use domains table ID
});

// query_cache.domain_id → customer_configs.id
await insertAsAdmin('query_cache', {
  domain_id: configId  // ✅ Use customer_configs table ID (confusing!)
});
```

**Solution:** Add comments documenting the foreign key target

### 3. Test User Cleanup

**Problem:** Users from previous test runs cause `email_exists` errors

**Current Workaround:** Manual cleanup via SQL before running tests:
```sql
-- Disable owner check trigger
ALTER TABLE organization_members DISABLE TRIGGER check_organization_owner;

-- Delete test data
DELETE FROM organization_members WHERE organization_id IN (
  SELECT id FROM organizations WHERE name LIKE '%Test Org%'
);
DELETE FROM organizations WHERE name LIKE '%Test Org%';
DELETE FROM auth.users WHERE email LIKE 'rls-test-%@example.com';

-- Re-enable trigger
ALTER TABLE organization_members ENABLE TRIGGER check_organization_owner;
```

**Better Solution (TODO):** Implement automated cleanup in `beforeEach`:
```typescript
beforeEach(async () => {
  // Check if test users exist and clean them up
  const existingUser = await checkUserExists(testEmail);
  if (existingUser) {
    await deleteTestUser(existingUser.id);
  }
});
```

### 4. Foreign Key Constraint Errors

**Problem:** Cannot delete organizations with dependent records

**Solution:** Delete in proper order (children first):
```typescript
// ❌ WRONG ORDER: Fails with foreign key constraint
await deleteAsAdmin('organizations', { id: orgId });
await deleteAsAdmin('domains', { domain_id: orgId });

// ✅ CORRECT ORDER: Delete children first
await deleteAsAdmin('page_embeddings', { domain_id: domainId });
await deleteAsAdmin('scraped_pages', { domain_id: domainId });
await deleteAsAdmin('conversations', { domain_id: domainId });
await deleteAsAdmin('domains', { id: domainId });
await deleteAsAdmin('customer_configs', { organization_id: orgId });
await deleteAsAdmin('organizations', { id: orgId });
```

### 5. RLS Policy Infinite Recursion

**Problem:** Policy queries the same table it's protecting

```sql
-- ❌ WRONG: Causes infinite recursion
CREATE POLICY "Users can view members"
ON organization_members
FOR SELECT
USING (
  organization_id IN (
    SELECT organization_id FROM organization_members  -- Queries itself!
    WHERE user_id = auth.uid()
  )
);

-- ✅ CORRECT: Use helper function
CREATE POLICY "Users can view members"
ON organization_members
FOR SELECT
USING (
  is_organization_member(organization_id, auth.uid())
);
```

## Testing Checklist

When adding new RLS policies, test:

- ✅ **Isolation**: Users cannot access other organization's data
- ✅ **Access**: Users CAN access their own organization's data
- ✅ **Listing**: Users only see their organization's records when querying without filters
- ✅ **Joins**: Related data is properly filtered across tables
- ✅ **Writes**: Users cannot create/update/delete other organization's data

## Performance Considerations

### Token Caching

The current implementation generates a new JWT token for every `queryAsUser()` call. For test suites with many queries, consider:

```typescript
// Cache tokens for test duration
const tokenCache = new Map<string, string>();

export async function getUserAccessToken(email: string): Promise<string> {
  if (tokenCache.has(email)) {
    return tokenCache.get(email)!;
  }

  const token = await fetchNewToken(email);
  tokenCache.set(email, token);
  return token;
}
```

### Parallel Test Execution

RLS tests can run in parallel if:
- Each test uses unique organization names/domains
- Cleanup is idempotent
- Test data doesn't conflict

```typescript
// Use unique identifiers
const timestamp = Date.now();
const domain = `test-${timestamp}-${Math.random()}.example.com`;
```

## Migration to REST API

### Before (SDK)

```typescript
const blocked = await expectRLSBlocked(
  rlsTest.user1Client,
  'customer_configs',
  configId2
);

const { data } = await rlsTest.user1Client
  .from('conversations')
  .select('*')
  .eq('id', convId);
```

### After (REST API)

```typescript
const user1Configs = await queryAsUser(
  rlsTest.user1Email,
  'customer_configs',
  { id: configId2 }
);
expect(user1Configs.length).toBe(0);

const conversations = await queryAsUser(
  rlsTest.user1Email,
  'conversations',
  { id: convId }
);
expect(conversations.length).toBeGreaterThan(0);
```

### Benefits

- ✅ No SDK compatibility issues
- ✅ Works in all environments (Jest, Docker, CI)
- ✅ More explicit about what's being tested
- ✅ Easier to debug (can inspect raw HTTP requests)
- ✅ Matches production API usage patterns

## References

- [Supabase PostgREST API Docs](https://supabase.com/docs/guides/api)
- [PostgREST Query Syntax](https://postgrest.org/en/stable/api.html)
- [RLS Policy Examples](https://supabase.com/docs/guides/auth/row-level-security)
- [Multi-Tenant Isolation Test](../test-utils/integration/multi-tenant-isolation.test.ts)
- [RLS Test Helpers](../test-utils/rls-test-helpers.ts)
