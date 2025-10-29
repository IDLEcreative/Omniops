# Customer ID → Organization ID Migration Plan

## Executive Summary

This document provides a comprehensive analysis and migration plan for replacing legacy `customer_id` references with the new `organization_id` architecture across the Omniops codebase.

**Current Status:**
- **Total References:** 595 instances of `customer_id`/`customerId`
- **Affected Files:** 115 files
- **Migration Progress:** ~20% complete (database schema done, code migration pending)

**Key Finding:** Most `customer_id` references are **WooCommerce-specific** (external API data), NOT database references. Actual database migration scope is much smaller than initially estimated.

---

## Table of Contents

1. [Migration Scope Analysis](#migration-scope-analysis)
2. [Database Schema Changes](#database-schema-changes)
3. [Code Migration Strategy](#code-migration-strategy)
4. [Phase-by-Phase Plan](#phase-by-phase-plan)
5. [Risk Assessment](#risk-assessment)
6. [Rollback Plan](#rollback-plan)
7. [Testing Strategy](#testing-strategy)

---

## Migration Scope Analysis

### 1. File Categorization

| Category | File Count | customer_id References | Priority |
|----------|------------|------------------------|----------|
| **Database Migrations** | 5 | ~50 | HIGH |
| **Lib Service Files** | 16 | ~250 | MEDIUM |
| **API Route Files** | 5 | ~30 | HIGH |
| **Test Files** | 6 | ~40 | MEDIUM |
| **Type Definitions** | 2 | ~15 | HIGH |
| **Documentation** | 20 | ~210 | LOW |
| **Migrations (old)** | 61 | ~0 (archived) | SKIP |
| **TOTAL** | **115** | **~595** | - |

### 2. Reference Type Breakdown

#### A. WooCommerce External API References (~450 instances)
**DO NOT MIGRATE** - These are WooCommerce API field names

```typescript
// WooCommerce Order object from their API
{
  id: 123,
  customer_id: 456,  // ← WooCommerce's customer ID, NOT our database
  status: "processing"
}
```

**Files affected:**
- `lib/woocommerce*.ts` (all WooCommerce integration files)
- `lib/woocommerce-api/*.ts`
- Tests and mocks for WooCommerce

**Action:** No changes needed - these reference external WooCommerce data structures

---

#### B. Database Column References (~30 instances)
**MUST MIGRATE** - Direct database schema references

**Tables with customer_id columns:**

1. **`customer_configs`** ✅ Already has `organization_id` (migration 20251020)
   - Status: Column exists, queries need updating
   - References: 2 direct queries

2. **`conversations`** ❌ Missing `organization_id`
   - Status: Needs migration
   - References: 0 direct queries (uses domain_id)

3. **`customers`** ⚠️ Legacy table (to be deprecated)
   - Status: Will be replaced by `organizations` table
   - References: 3 foreign key relationships

**Database Query Locations:**
```bash
lib/scraper-config.ts:632:        .eq('customer_id', customerId)
app/api/customer/config/route.ts:119:      query = query.eq('customer_id', customerId)
```

---

#### C. Type Definitions (~15 instances)
**MUST UPDATE** - TypeScript interfaces and Supabase types

**Files:**
- `types/supabase.ts` - Auto-generated from Supabase schema
- `types/index.ts` - Manual type definitions
- API route interfaces

**Action:** Update after database migration, regenerate Supabase types

---

#### D. Documentation References (~210 instances)
**LOW PRIORITY** - Update after code migration

**Files:**
- API documentation (README.md files)
- Architecture docs
- Test reports
- Migration guides

**Action:** Bulk find-replace after code is stable

---

#### E. Configuration/Metadata References (~90 instances)
**REVIEW CASE-BY-CASE** - API parameters, job metadata

**Examples:**
```typescript
// Queue job metadata
{
  customerId: "customer-123",  // ← Should become organizationId
  domain: "example.com"
}

// API query parameters
GET /api/jobs?customerId=abc  // ← Should become organizationId
```

**Files:**
- `app/api/queue/route.ts`
- `app/api/jobs/route.ts`
- `lib/queue/*.ts`

---

## Database Schema Changes

### Current State

```sql
-- ✅ Already has organization_id (20251020 migration)
CREATE TABLE customer_configs (
  id UUID PRIMARY KEY,
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,  -- ⚠️ Legacy
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,  -- ✅ New
  domain TEXT UNIQUE NOT NULL,
  ...
);

-- ❌ Missing organization_id
CREATE TABLE conversations (
  id UUID PRIMARY KEY,
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,  -- ⚠️ Legacy
  domain_id UUID REFERENCES domains(id) ON DELETE CASCADE,
  session_id TEXT,
  ...
);

-- ⚠️ Legacy table (being replaced by organizations)
CREATE TABLE customers (
  id UUID PRIMARY KEY,
  auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  ...
);
```

### Target State

```sql
-- ✅ Dual-column for backward compatibility
CREATE TABLE customer_configs (
  id UUID PRIMARY KEY,
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,  -- Keep for legacy
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,  -- Primary
  domain TEXT UNIQUE NOT NULL,
  ...
);

-- ✅ Add organization_id
CREATE TABLE conversations (
  id UUID PRIMARY KEY,
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,  -- Keep for legacy
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,  -- ✅ Add
  domain_id UUID REFERENCES domains(id) ON DELETE CASCADE,
  session_id TEXT,
  ...
);

-- ⚠️ Eventually deprecate (not deleted yet for safety)
CREATE TABLE customers (
  id UUID PRIMARY KEY,
  auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  ...
);
```

---

## Phase-by-Phase Plan

### Phase 0: Pre-Migration (2 hours)

**Tasks:**
1. ✅ Complete this analysis document
2. Create backup of production database
3. Tag current codebase: `git tag pre-customer-id-migration`
4. Create migration branch: `git checkout -b migrate/customer-id-to-organization-id`
5. Run full test suite to establish baseline

**Deliverables:**
- This migration plan document
- Database backup snapshot
- Git tags for rollback

---

### Phase 1: Database Schema Migration (4 hours)

#### 1.1 Add organization_id to conversations table

**Migration File:** `supabase/migrations/20251023_add_organization_id_to_conversations.sql`

```sql
-- =====================================================
-- Migration: Add organization_id to conversations
-- Date: 2025-10-23
-- Description: Links conversations to organizations for multi-seat support
-- =====================================================

-- Step 1: Add organization_id column (nullable initially)
ALTER TABLE conversations
  ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

-- Step 2: Backfill organization_id from customer_configs via domain_id
UPDATE conversations c
SET organization_id = cc.organization_id
FROM customer_configs cc
JOIN domains d ON d.domain = cc.domain
WHERE c.domain_id = d.id
  AND cc.organization_id IS NOT NULL
  AND c.organization_id IS NULL;

-- Step 3: Add index for performance
CREATE INDEX IF NOT EXISTS idx_conversations_organization_id
  ON conversations(organization_id)
  WHERE organization_id IS NOT NULL;

-- Step 4: Update RLS policies (organization-aware)
DROP POLICY IF EXISTS "Users can view their conversations" ON conversations;

CREATE POLICY "Organization members can view conversations" ON conversations
  FOR SELECT USING (
    -- Allow via organization membership
    organization_id IN (
      SELECT organization_id
      FROM organization_members
      WHERE user_id = auth.uid()
    )
    -- OR legacy customer_id for backward compatibility
    OR customer_id IN (
      SELECT id
      FROM customers
      WHERE auth_user_id = auth.uid()
    )
  );

-- Step 5: Add helpful comments
COMMENT ON COLUMN conversations.organization_id IS 'Organization that owns this conversation (new multi-seat model)';
COMMENT ON COLUMN conversations.customer_id IS 'Legacy customer reference (deprecated, use organization_id)';

-- Verification query
DO $$
DECLARE
  total_conversations INTEGER;
  migrated_conversations INTEGER;
  migration_percentage NUMERIC;
BEGIN
  SELECT COUNT(*) INTO total_conversations FROM conversations;
  SELECT COUNT(*) INTO migrated_conversations FROM conversations WHERE organization_id IS NOT NULL;

  IF total_conversations > 0 THEN
    migration_percentage := (migrated_conversations::NUMERIC / total_conversations::NUMERIC) * 100;
    RAISE NOTICE 'Migration Progress: %/% conversations migrated (%.1f%%)',
      migrated_conversations, total_conversations, migration_percentage;
  ELSE
    RAISE NOTICE 'No conversations to migrate';
  END IF;
END $$;
```

**Expected Outcome:**
- `conversations.organization_id` column added
- Data backfilled from existing relationships
- RLS policies updated
- Index created
- 100% of existing conversations linked to organizations

---

#### 1.2 Add organization_id to scraper_configs (if table exists)

**Migration File:** `supabase/migrations/20251023_add_organization_id_to_scraper_configs.sql`

```sql
-- =====================================================
-- Migration: Add organization_id to scraper_configs
-- Date: 2025-10-23
-- Description: Links scraper configurations to organizations
-- Note: This table may not exist in all environments
-- =====================================================

-- Check if table exists before altering
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name = 'scraper_configs'
  ) THEN
    -- Add organization_id column
    ALTER TABLE scraper_configs
      ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

    -- Backfill from customer_configs
    UPDATE scraper_configs sc
    SET organization_id = cc.organization_id
    FROM customer_configs cc
    WHERE sc.customer_id = cc.customer_id
      AND cc.organization_id IS NOT NULL
      AND sc.organization_id IS NULL;

    -- Add index
    CREATE INDEX IF NOT EXISTS idx_scraper_configs_organization_id
      ON scraper_configs(organization_id)
      WHERE organization_id IS NOT NULL;

    RAISE NOTICE 'scraper_configs table migrated successfully';
  ELSE
    RAISE NOTICE 'scraper_configs table does not exist - skipping';
  END IF;
END $$;
```

---

#### 1.3 Regenerate Supabase Types

```bash
# Generate updated TypeScript types from database schema
npx supabase gen types typescript --project-id birugqyuqhiahxvxeyqg > types/supabase.ts

# Verify changes
git diff types/supabase.ts
```

**Expected changes:**
- `conversations` table will now include `organization_id: string | null`
- Foreign key relationships updated

---

### Phase 2: Code Migration (8 hours)

#### 2.1 Update Database Query Functions (2 hours)

**File:** `lib/scraper-config.ts`

**Current:**
```typescript
async loadFromDatabase(customerId: string): Promise<void> {
  const { data, error } = await this.supabase
    .from('scraper_configs')
    .select('config')
    .eq('customer_id', customerId)  // ❌ Legacy
    .single();
}
```

**Updated:**
```typescript
async loadFromDatabase(organizationId: string): Promise<void> {
  if (!this.supabase) {
    console.warn('Database not initialized, skipping database config load');
    return;
  }

  this.organizationId = organizationId;

  try {
    const { data, error } = await this.supabase
      .from('scraper_configs')
      .select('config')
      .eq('organization_id', organizationId)  // ✅ New
      .single();

    if (error) {
      console.error('Error loading config from database:', error);
      return;
    }

    if (data?.config) {
      this.configSources.set(ConfigPriority.DATABASE, data.config);
      this.mergeConfigurations();
      this.emit('configLoaded', { source: 'database', organizationId });
    }
  } catch (error) {
    console.error('Error loading config from database:', error);
  }
}
```

---

**File:** `app/api/customer/config/route.ts`

**Current:**
```typescript
if (customerId) {
  query = query.eq('customer_id', customerId)  // ❌ Legacy
}
```

**Updated:**
```typescript
// Support both organizationId (new) and customerId (legacy) for backward compatibility
if (organizationId) {
  query = query.eq('organization_id', organizationId)  // ✅ Primary
} else if (customerId) {
  query = query.eq('customer_id', customerId)  // ⚠️ Legacy fallback
}
```

---

#### 2.2 Update API Route Interfaces (2 hours)

**File:** `app/api/customer/config/route.ts`

**Current:**
```typescript
interface CustomerConfig {
  id: string
  customer_id: string | null  // ❌ Legacy
  domain: string
  settings: Record<string, any>
  metadata: Record<string, any>
  created_at: string
  updated_at: string
}

const CreateConfigSchema = z.object({
  domain: z.string().trim().min(1, 'Domain is required'),
  customerId: z.string().trim().optional(),  // ❌ Legacy
  settings: SettingsSchema.partial().default({}),
  metadata: z.record(z.any()).optional().default({}),
})
```

**Updated:**
```typescript
interface CustomerConfig {
  id: string
  customer_id: string | null  // ⚠️ Keep for backward compatibility
  organization_id: string | null  // ✅ New primary field
  domain: string
  settings: Record<string, any>
  metadata: Record<string, any>
  created_at: string
  updated_at: string
}

const CreateConfigSchema = z.object({
  domain: z.string().trim().min(1, 'Domain is required'),
  organizationId: z.string().trim().optional(),  // ✅ New primary
  customerId: z.string().trim().optional(),  // ⚠️ Keep for backward compatibility
  settings: SettingsSchema.partial().default({}),
  metadata: z.record(z.any()).optional().default({}),
})
```

---

#### 2.3 Update Queue/Job Metadata (2 hours)

**File:** `app/api/queue/route.ts`

**Current:**
```typescript
interface CleanupOptions {
  status?: string[];
  olderThan?: number;
  customerId?: string;  // ❌ Legacy
}
```

**Updated:**
```typescript
interface CleanupOptions {
  status?: string[];
  olderThan?: number;
  organizationId?: string;  // ✅ New primary
  customerId?: string;  // ⚠️ Keep for backward compatibility
}
```

**Files to update:**
- `app/api/queue/route.ts`
- `app/api/jobs/route.ts`
- `lib/queue/queue-manager.ts`
- `lib/queue/job-processor.ts`
- `lib/queue/queue-utils.ts`

---

#### 2.4 Update Type Definitions (1 hour)

**File:** `types/index.ts`

**Current:**
```typescript
export interface WooCommerceOrder {
  id: number;
  customer_id: number;  // ✅ Keep - WooCommerce external API field
  status: string;
  // ...
}
```

**Note:** WooCommerce types should NOT be changed - `customer_id` is from their API

---

#### 2.5 Update Integration Files (1 hour)

**File:** `lib/integrations/customer-scraping-integration.ts`

**Current:**
```typescript
customerId: config.customer_id,  // ❌ Legacy
```

**Updated:**
```typescript
organizationId: config.organization_id || config.customer_id,  // ✅ Prefer org, fallback to customer
```

---

### Phase 3: Test Updates (4 hours)

#### 3.1 Update Test Data (2 hours)

**File:** `test-utils/test-config.ts`

**Current:**
```typescript
export const TEST_CUSTOMER_CONFIG = {
  customer_id: 1,  // ❌ Legacy
  domain: TEST_DOMAIN,
  // ...
}
```

**Updated:**
```typescript
export const TEST_CUSTOMER_CONFIG = {
  organization_id: TEST_ORGANIZATION_ID,  // ✅ New
  customer_id: 1,  // ⚠️ Keep for legacy test compatibility
  domain: TEST_DOMAIN,
  // ...
}

export const TEST_ORGANIZATION_ID = 'org_test_123';
```

**Files to update:**
- `test-utils/test-config.ts`
- `test-utils/mock-helpers.ts`
- `__mocks__/@woocommerce/woocommerce-rest-api.js`

---

#### 3.2 Update Integration Tests (2 hours)

**File:** `__tests__/integration/multi-tenant-isolation.test.ts`

Add tests for organization-based isolation:

```typescript
describe('Organization Multi-Tenant Isolation', () => {
  it('should isolate conversations by organization_id', async () => {
    const org1 = await createTestOrganization('Org 1');
    const org2 = await createTestOrganization('Org 2');

    const conv1 = await createConversation({ organization_id: org1.id });
    const conv2 = await createConversation({ organization_id: org2.id });

    // User from org1 should only see org1's conversations
    const { data } = await supabase
      .from('conversations')
      .select('*')
      .eq('organization_id', org1.id);

    expect(data).toHaveLength(1);
    expect(data[0].id).toBe(conv1.id);
  });
});
```

---

### Phase 4: Documentation Updates (2 hours)

#### 4.1 Update API Documentation

**Files to update:**
- `app/api/scrape/README.md`
- `app/api/queue/README.md`
- `app/api/jobs/README.md`
- `app/api/customer/README.md`
- `types/README.md`

**Changes:**
- Replace `customerId` with `organizationId` in examples
- Add migration notes for backward compatibility
- Update parameter descriptions

---

#### 4.2 Update Architecture Documentation

**Files to update:**
- `docs/ARCHITECTURE.md`
- `docs/SUPABASE_SCHEMA.md`
- `docs/AUTHENTICATION_LINKAGE.md`
- `docs/CUSTOMER_VERIFICATION_SYSTEM.md`

**Changes:**
- Update entity relationship diagrams
- Replace customer-centric language with organization-centric
- Document migration path

---

### Phase 5: Cleanup & Verification (2 hours)

#### 5.1 Verify Data Migration

```sql
-- Check conversations migration
SELECT
  COUNT(*) as total_conversations,
  COUNT(organization_id) as with_org_id,
  COUNT(customer_id) as with_customer_id,
  COUNT(*) - COUNT(organization_id) as missing_org_id
FROM conversations;

-- Check customer_configs migration
SELECT
  COUNT(*) as total_configs,
  COUNT(organization_id) as with_org_id,
  COUNT(customer_id) as with_customer_id
FROM customer_configs;

-- Verify no orphaned records
SELECT c.id, c.domain_id, c.customer_id, c.organization_id
FROM conversations c
WHERE c.organization_id IS NULL
  AND c.customer_id IS NOT NULL;
```

Expected: 100% of conversations and configs should have organization_id

---

#### 5.2 Run Full Test Suite

```bash
# Run all tests
npm test

# Run specific test categories
npm run test:unit
npm run test:integration

# Check test coverage
npm run test:coverage
```

Expected: All tests pass with >80% coverage

---

#### 5.3 Manual QA Checklist

- [ ] Create new organization via dashboard
- [ ] Add domain to organization
- [ ] Scrape domain content
- [ ] Start conversation on scraped domain
- [ ] Verify conversation appears in dashboard
- [ ] Add team member to organization
- [ ] Verify team member can see organization data
- [ ] Remove team member
- [ ] Verify removed member cannot access data
- [ ] Test WooCommerce integration still works
- [ ] Test Shopify integration still works
- [ ] Test GDPR export includes organization context
- [ ] Test GDPR delete removes organization data

---

## Risk Assessment

### High Risk Areas

#### 1. Data Loss Risk: LOW
- **Mitigation:** Dual-column approach keeps both customer_id and organization_id
- **Rollback:** Original customer_id data never deleted
- **Backup:** Database snapshot taken before migration

#### 2. Breaking Changes Risk: MEDIUM
- **Impact:** External API consumers using `customerId` parameter
- **Mitigation:** Accept both `organizationId` and `customerId` parameters
- **Timeline:** Deprecate `customerId` in 6 months

#### 3. Performance Impact: LOW
- **Concern:** Additional indexes may slow writes
- **Mitigation:** Partial indexes only on non-null values
- **Testing:** Load test with 10k+ records before production

#### 4. Multi-Organization Users: MEDIUM
- **Scenario:** User belongs to multiple organizations
- **Current State:** Not fully handled in code
- **Mitigation:** Organization switcher component exists but needs integration

---

### Critical Dependencies

1. **Organization Migration Must Be Complete**
   - `organizations` table must exist
   - `organization_members` table must exist
   - All existing users must be linked to organizations
   - **Status:** ✅ Complete (see `docs/ORGANIZATION_MIGRATION_STATUS.md`)

2. **RLS Policies Must Be Tested**
   - Organization-based RLS on all tables
   - Cross-organization isolation verified
   - **Status:** ⚠️ Needs testing

3. **Backward Compatibility Layer**
   - Old API parameters still accepted
   - Gradual deprecation path defined
   - **Status:** ✅ Designed into migration

---

## Rollback Plan

### If Migration Fails During Phase 1 (Database)

```sql
-- Rollback conversations migration
ALTER TABLE conversations DROP COLUMN IF EXISTS organization_id;
DROP INDEX IF EXISTS idx_conversations_organization_id;

-- Rollback scraper_configs migration (if applied)
ALTER TABLE scraper_configs DROP COLUMN IF EXISTS organization_id;
DROP INDEX IF EXISTS idx_scraper_configs_organization_id;

-- Restore RLS policies
-- (Run original RLS policy SQL from backup)
```

### If Issues Found During Phase 2-3 (Code)

```bash
# Revert code changes
git checkout main

# Keep database changes (they don't break anything due to dual-column approach)
# Code can fall back to customer_id queries

# Fix issues and re-deploy
git checkout migrate/customer-id-to-organization-id
# Make fixes
git commit -m "fix: address migration issues"
```

### If Critical Bug Found in Production

```bash
# Emergency rollback
git revert <migration-commit-hash>
git push origin main

# Database stays as-is (backward compatible)
# Old code will use customer_id, new code uses organization_id
```

---

## Testing Strategy

### Unit Tests

**New tests to add:**

```typescript
// Test organization-based config loading
describe('ScraperConfig.loadFromDatabase', () => {
  it('should load config by organization_id', async () => {
    const config = new ScraperConfig();
    await config.loadFromDatabase(TEST_ORG_ID);
    expect(config.organizationId).toBe(TEST_ORG_ID);
  });

  it('should fall back to customer_id if organization_id not found', async () => {
    const config = new ScraperConfig();
    await config.loadFromDatabase(LEGACY_CUSTOMER_ID);
    expect(config.customerId).toBe(LEGACY_CUSTOMER_ID);
  });
});
```

### Integration Tests

**Critical scenarios:**

1. **Multi-organization data isolation**
   - User in Org A cannot see Org B's data
   - User in both orgs sees data from both

2. **Backward compatibility**
   - Old API calls with `customerId` still work
   - New API calls with `organizationId` work
   - Mixing both in same request works

3. **Migration completeness**
   - All conversations have organization_id
   - All configs have organization_id
   - No orphaned records

### Performance Tests

**Benchmarks to measure:**

```typescript
// Before migration
const before = await measureQueryTime(
  'SELECT * FROM conversations WHERE customer_id = $1',
  [customerId]
);

// After migration
const after = await measureQueryTime(
  'SELECT * FROM conversations WHERE organization_id = $1',
  [organizationId]
);

// Should be within 10% of original performance
expect(after).toBeLessThan(before * 1.1);
```

---

## Execution Timeline

### Week 1: Database Migration
- **Day 1:** Phase 0 + Phase 1.1 (Pre-migration + conversations table)
- **Day 2:** Phase 1.2 + 1.3 (scraper_configs + type generation)
- **Day 3:** Verify database migration, run data integrity checks

### Week 2: Code Migration
- **Day 4:** Phase 2.1 + 2.2 (Database queries + API interfaces)
- **Day 5:** Phase 2.3 + 2.4 (Queue/jobs + type definitions)
- **Day 6:** Phase 2.5 (Integration files)

### Week 3: Testing & Documentation
- **Day 7:** Phase 3.1 + 3.2 (Test updates)
- **Day 8:** Phase 4 (Documentation updates)
- **Day 9:** Phase 5 (Cleanup + verification)
- **Day 10:** QA + production deployment

**Total Time Estimate:** 10 working days (2 weeks sprint)

---

## Success Criteria

### Database Migration Success
- ✅ 100% of conversations have organization_id
- ✅ 100% of customer_configs have organization_id
- ✅ All indexes created successfully
- ✅ RLS policies updated and tested
- ✅ Zero orphaned records

### Code Migration Success
- ✅ All database queries use organization_id as primary
- ✅ customer_id fallback still works
- ✅ All API routes accept organizationId parameter
- ✅ All tests pass (unit + integration)
- ✅ Test coverage remains >80%

### Production Readiness
- ✅ Manual QA checklist 100% complete
- ✅ Performance benchmarks within 10% of baseline
- ✅ Documentation updated
- ✅ Rollback plan tested
- ✅ Monitoring/alerts configured

---

## Monitoring & Alerts

### Post-Migration Metrics to Track

```typescript
// Track dual-column usage
const metrics = {
  queries_using_organization_id: 0,
  queries_using_customer_id: 0,
  queries_using_both: 0,
  migration_percentage: 0
};

// Alert if customer_id usage increases (regression)
if (metrics.queries_using_customer_id > baseline * 1.2) {
  alert('customer_id usage increased - possible regression');
}
```

### Database Monitoring

```sql
-- Daily check for unmigrated records
SELECT
  'conversations' as table_name,
  COUNT(*) FILTER (WHERE organization_id IS NULL) as unmigrated_count
FROM conversations
UNION ALL
SELECT
  'customer_configs' as table_name,
  COUNT(*) FILTER (WHERE organization_id IS NULL) as unmigrated_count
FROM customer_configs;

-- Alert if unmigrated_count > 0 after migration complete
```

---

## Deprecation Timeline

### Immediate (Migration Complete)
- ✅ All new code uses organization_id
- ✅ Database has both columns
- ✅ API accepts both parameters

### 3 Months After Migration
- ⚠️ Add deprecation warnings to customer_id API parameters
- ⚠️ Update documentation to recommend organization_id
- ⚠️ Log usage of customer_id for tracking

### 6 Months After Migration
- ❌ Remove customer_id from API documentation
- ❌ Return warnings in API responses when customer_id used
- ❌ Plan customer_id column removal

### 12 Months After Migration
- ❌ Remove customer_id columns from database
- ❌ Drop customers table
- ❌ Remove all customer_id code references
- ❌ Final cleanup migration

---

## Appendix

### A. Complete File List

#### Database Migration Files (5 files)
```
supabase/migrations/000_complete_schema.sql
supabase/migrations/000_complete_schema_fixed.sql
supabase/migrations/002_add_auth.sql
supabase/migrations/003_update_customer_configs.sql
supabase/migrations/20250127_performance_indexes.sql
```

#### Lib Service Files (16 files)
```
lib/customer-verification-simple.ts
lib/customer-verification.ts
lib/integrations/customer-scraping-integration.ts
lib/queue/index.ts
lib/queue/job-processor.ts
lib/queue/queue-manager.ts
lib/queue/queue-utils.ts
lib/queue/scrape-queue.ts
lib/safe-database.ts
lib/scraper-config.ts
lib/woocommerce-api/customers.ts
lib/woocommerce-customer.ts
lib/woocommerce-full.ts  # WooCommerce API - DO NOT CHANGE
lib/woocommerce-mock.ts  # WooCommerce API - DO NOT CHANGE
lib/woocommerce-order-modifications.ts  # WooCommerce API - DO NOT CHANGE
lib/woocommerce.ts  # WooCommerce API - DO NOT CHANGE
```

#### API Route Files (5 files)
```
app/api/customer/config/route.ts
app/api/dashboard/overview/route.ts
app/api/jobs/route.ts
app/api/queue/route.ts
app/api/verify-customer/route.ts
```

#### Test Files (6 files)
```
__mocks__/@woocommerce/woocommerce-rest-api.js
__tests__/api/scrape/route.test.ts
__tests__/integration/multi-tenant-isolation.test.ts
__tests__/lib/woocommerce.test.ts
test-utils/mock-helpers.ts
test-utils/test-config.ts
```

#### Type Definition Files (2 files)
```
types/index.ts
types/supabase.ts  # Auto-generated - regenerate after DB migration
```

### B. WooCommerce Files to SKIP

**These files reference WooCommerce's customer_id field, NOT our database:**

```
lib/woocommerce-full.ts
lib/woocommerce-mock.ts
lib/woocommerce.ts
lib/woocommerce-api/customers.ts
lib/woocommerce-customer.ts
lib/woocommerce-order-modifications.ts
__tests__/lib/woocommerce.test.ts
```

**Reason:** WooCommerce API returns orders with a `customer_id` field that references WooCommerce's internal customer ID, not our organization or customer. This is external data and should not be changed.

### C. SQL Migration Templates

#### Template: Add organization_id to any table

```sql
-- Step 1: Add column
ALTER TABLE {table_name}
  ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

-- Step 2: Backfill from related table
UPDATE {table_name} t
SET organization_id = {related_table}.organization_id
FROM {related_table}
WHERE t.{join_column} = {related_table}.{join_column}
  AND {related_table}.organization_id IS NOT NULL
  AND t.organization_id IS NULL;

-- Step 3: Add index
CREATE INDEX IF NOT EXISTS idx_{table_name}_organization_id
  ON {table_name}(organization_id)
  WHERE organization_id IS NOT NULL;

-- Step 4: Add constraint (after verifying 100% backfill)
-- ALTER TABLE {table_name}
--   ALTER COLUMN organization_id SET NOT NULL;

-- Step 5: Verify
SELECT
  COUNT(*) as total,
  COUNT(organization_id) as migrated,
  (COUNT(organization_id)::FLOAT / COUNT(*)::FLOAT * 100)::NUMERIC(5,2) as percentage
FROM {table_name};
```

---

## Conclusion

This migration plan provides a comprehensive, low-risk path to replace customer_id with organization_id across the Omniops codebase. The dual-column approach ensures backward compatibility while enabling the new multi-seat organization model.

**Key Strengths:**
- Zero data loss risk (dual-column approach)
- Backward compatible (accepts both parameters)
- Gradual migration path (12-month deprecation timeline)
- Comprehensive testing strategy
- Clear rollback plan

**Next Steps:**
1. Review and approve this plan
2. Create database backup
3. Execute Phase 1 (database migration)
4. Proceed through phases 2-5
5. Monitor production for 30 days
6. Begin deprecation timeline

**Estimated Effort:** 10 working days (2-week sprint)
**Risk Level:** LOW (with proper testing and rollback plan)
**Production Impact:** MINIMAL (backward compatible)

---

**Document Version:** 1.0
**Last Updated:** 2025-10-22
**Status:** Ready for Review
**Reviewer:** Engineering Team
