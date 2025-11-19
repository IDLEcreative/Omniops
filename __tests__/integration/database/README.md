# Database Integration Tests

Comprehensive integration tests for Supabase database operations.

## Overview

This directory contains **50+ integration tests** organized into 6 test suites that validate database operations, RLS policies, cascade behavior, and query performance.

**Created:** 2025-11-18
**Purpose:** Validate database operations with actual Supabase connections

## Test Suites

### 1. Supabase Client Operations (15+ tests)
**File:** `supabase-client-operations.test.ts`

Tests basic Supabase client functionality:
- ✅ CRUD operations (INSERT, SELECT, UPDATE, DELETE)
- ✅ Filter operations (eq, neq, in, like, gt, lt)
- ✅ Join operations (foreign key relationships)
- ✅ Pagination (range, limit, offset)
- ✅ Batch operations (bulk insert, bulk update)
- ✅ Error handling (unique violations, foreign key violations, null violations)
- ✅ Transaction behavior and cascade deletes

**Key Validations:**
- All basic database operations work correctly
- Filters return expected results
- Joins load related data properly
- Pagination handles large datasets
- Error cases are caught and handled

### 2. Customer Configs (8+ tests)
**File:** `customer-configs.test.ts`

Tests customer configuration operations:
- ✅ Create/update/delete customer configurations
- ✅ Encrypted credentials storage (WooCommerce, Shopify)
- ✅ Domain-based isolation (unique domain constraint)
- ✅ RLS policy enforcement
- ✅ Multi-customer isolation
- ✅ Cross-organization access prevention
- ✅ Cascade delete behavior

**Key Validations:**
- RLS policies prevent cross-organization access
- Encrypted credentials are stored securely
- Domain uniqueness is enforced
- Multiple configs per organization work correctly

### 3. Scraped Content (10+ tests)
**File:** `scraped-content.test.ts`

Tests scraped pages and embeddings:
- ✅ Insert/update/delete scraped pages
- ✅ Page status transitions (pending → completed → failed → deleted)
- ✅ Metadata storage and queries (JSONB)
- ✅ Embeddings cascade deletion
- ✅ Vector similarity search
- ✅ Full-text search (title, content)
- ✅ Embedding queue operations
- ✅ Cleanup operations (deleted pages >30 days)

**Key Validations:**
- Page lifecycle states work correctly
- Embeddings are deleted when pages are deleted
- JSONB metadata can be queried efficiently
- Search functionality works as expected

### 4. Conversations & Messages (8+ tests)
**File:** `conversations-messages.test.ts`

Tests chat conversation and message operations:
- ✅ Create conversations
- ✅ Add messages to conversations
- ✅ Retrieve conversation history
- ✅ Delete conversations with cascade
- ✅ Message ordering by timestamp
- ✅ Pagination through messages
- ✅ Filter messages by role
- ✅ RLS enforcement for conversations

**Key Validations:**
- Conversation and message CRUD works correctly
- Messages cascade delete with conversations
- Message ordering is maintained
- Pagination handles large message histories

### 5. WooCommerce Data (5+ tests)
**File:** `woocommerce-data.test.ts`

Tests WooCommerce integration data:
- ✅ Product sync to entity catalog
- ✅ SKU uniqueness enforcement
- ✅ Product availability and stock updates
- ✅ Product filtering (category, price)
- ✅ Product search (name, description)
- ✅ Data cleanup operations
- ✅ Product-to-page relationships
- ✅ JSONB attributes queries

**Key Validations:**
- Products sync correctly to entity catalog
- SKU uniqueness prevents duplicates
- Search and filtering work efficiently
- Page relationships cascade correctly

### 6. Query Performance (4+ tests)
**File:** `query-performance.test.ts`

Tests database query performance:
- ✅ Index usage verification (domain, foreign keys, JSONB)
- ✅ Query execution time benchmarks (<100ms targets)
- ✅ N+1 query prevention (single query with joins)
- ✅ Connection pooling behavior (concurrent queries)

**Key Validations:**
- Queries complete in <100ms with indexes
- Joins avoid N+1 query problems
- Batch operations are efficient
- Connection pooling works correctly

## Running Tests

### Run All Database Tests
```bash
npm test -- __tests__/integration/database/
```

### Run Specific Test Suite
```bash
npm test -- __tests__/integration/database/supabase-client-operations.test.ts
npm test -- __tests__/integration/database/customer-configs.test.ts
npm test -- __tests__/integration/database/scraped-content.test.ts
npm test -- __tests__/integration/database/conversations-messages.test.ts
npm test -- __tests__/integration/database/woocommerce-data.test.ts
npm test -- __tests__/integration/database/query-performance.test.ts
```

### Run Tests in Watch Mode
```bash
npm test -- __tests__/integration/database/ --watch
```

## Test Patterns

### Setup and Teardown
All tests follow proper setup/teardown patterns:
```typescript
beforeAll(async () => {
  // Create test user, organization, domain, config
  supabase = await createServiceRoleClient();
  testUserId = await createTestUser(email, { name: 'Test User' });
  testOrgId = await createTestOrganization('Test Org', testUserId);
  // ...
});

afterAll(async () => {
  // Cleanup in reverse order
  await deleteAsAdmin('customer_configs', { id: testConfigId });
  await deleteAsAdmin('domains', { id: testDomainId });
  await deleteTestOrganization(testOrgId);
  await deleteTestUser(testUserId);
});
```

### RLS Testing
Tests use actual user sessions (not service role keys) for RLS validation:
```typescript
// User 1 can access own organization data
const configs = await queryAsUser(user1Email, 'customer_configs', {
  organization_id: org1Id
});
expect(configs.length).toBeGreaterThan(0);

// User 1 cannot access other organization data
const blocked = await queryAsUser(user1Email, 'customer_configs', {
  organization_id: org2Id
});
expect(blocked.length).toBe(0); // RLS blocks access
```

### Performance Testing
Performance tests verify query execution times:
```typescript
const startTime = Date.now();
const { data, error } = await supabase
  .from('customer_configs')
  .select('*')
  .eq('domain', domain)
  .single();
const queryTime = Date.now() - startTime;

expect(error).toBeNull();
expect(queryTime).toBeLessThan(100); // Should use index
```

## Coverage

**Total Tests:** 50+ integration tests
**Database Operations Covered:**
- ✅ All CRUD operations
- ✅ All major filter types (eq, neq, in, like, gt, lt, etc.)
- ✅ Foreign key joins
- ✅ Pagination strategies
- ✅ Batch operations
- ✅ Cascade deletes
- ✅ RLS policies
- ✅ Index usage
- ✅ Query performance
- ✅ Error handling

**Tables Tested:**
- ✅ customer_configs
- ✅ domains
- ✅ organizations
- ✅ organization_members
- ✅ scraped_pages
- ✅ page_embeddings
- ✅ embedding_queue
- ✅ conversations
- ✅ messages
- ✅ chat_telemetry
- ✅ entity_catalog

## Dependencies

**Test Utilities:**
- `/test-utils/rls-test-helpers.ts` - RLS testing utilities
- `/lib/supabase/server.ts` - Supabase client creation

**Environment Variables Required:**
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

## Best Practices

1. **Always Clean Up**: All tests clean up their test data in `afterAll` or `afterEach`
2. **Use Unique Identifiers**: All test data uses timestamps to avoid conflicts
3. **Test RLS Properly**: Use `queryAsUser` instead of service role keys for RLS tests
4. **Verify Cascades**: Test that related records are deleted when parents are deleted
5. **Measure Performance**: Use timing assertions to catch performance regressions
6. **Test Error Cases**: Include tests for constraint violations and invalid data

## Related Documentation

- [Database Schema Reference](/docs/09-REFERENCE/REFERENCE_DATABASE_SCHEMA.md)
- [Search Architecture](/docs/01-ARCHITECTURE/ARCHITECTURE_SEARCH_SYSTEM.md)
- [Performance Optimization](/docs/09-REFERENCE/REFERENCE_PERFORMANCE_OPTIMIZATION.md)
- [RLS Security Fix](/docs/10-ANALYSIS/ANALYSIS_RLS_SECURITY_FIX.md)

## Maintenance

**When to Update These Tests:**
- ✅ When adding new database tables
- ✅ When modifying RLS policies
- ✅ When changing foreign key relationships
- ✅ When adding new indexes
- ✅ When performance requirements change

**Test Maintenance Checklist:**
- [ ] All tests pass successfully
- [ ] No test data leakage
- [ ] Performance benchmarks are met
- [ ] RLS policies are validated
- [ ] Coverage includes new features
