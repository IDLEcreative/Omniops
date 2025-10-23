# Customer ID Migration - Quick Reference

## TL;DR

**Actual Scope:** Much smaller than 595 references suggest!

- **595 total references** but **450+ are WooCommerce API fields** (external data - DO NOT CHANGE)
- **~30 actual database references** to migrate
- **~115 files affected** but only **~30 files need code changes**
- **Migration Status:** ~20% complete (database schema done, code pending)

---

## The Big Discovery

### WooCommerce Confusion

Most `customer_id` references are **WooCommerce API response fields**, NOT our database:

```typescript
// WooCommerce API returns this (DO NOT CHANGE)
{
  id: 123,
  customer_id: 456,  // ← This is WooCommerce's customer, not ours!
  status: "processing"
}

// Our database uses this (MUST MIGRATE)
customer_configs.customer_id → customer_configs.organization_id
conversations.customer_id → conversations.organization_id
```

**Files to SKIP (WooCommerce API):**
- `lib/woocommerce*.ts` (all of them)
- `lib/woocommerce-api/*.ts`
- WooCommerce tests and mocks

---

## What Actually Needs Migration

### Database Tables (3 tables)

| Table | Status | Action |
|-------|--------|--------|
| `customer_configs` | ✅ Has organization_id | Update queries only |
| `conversations` | ❌ Missing organization_id | Add column + backfill |
| `customers` | ⚠️ Legacy table | Eventually deprecate |

### Code Files (30 files)

| Category | File Count | What to Change |
|----------|------------|----------------|
| **Database queries** | 2 | `.eq('customer_id')` → `.eq('organization_id')` |
| **API routes** | 5 | Accept `organizationId` parameter |
| **Queue/Jobs** | 8 | Update metadata fields |
| **Type definitions** | 2 | Add organization_id types |
| **Tests** | 6 | Update test data |
| **Integrations** | 2 | Update config references |
| **Documentation** | 20 | Find-replace after code stable |

### Actual Query Locations (only 2!)

```typescript
// 1. lib/scraper-config.ts:632
.eq('customer_id', customerId)  // ← Change to organization_id

// 2. app/api/customer/config/route.ts:119
query = query.eq('customer_id', customerId)  // ← Change to organization_id
```

---

## Migration Phases

### Phase 1: Database (4 hours)
1. Add `organization_id` to `conversations` table
2. Backfill from existing relationships
3. Add indexes
4. Update RLS policies
5. Regenerate types

### Phase 2: Code (8 hours)
1. Update 2 database queries
2. Update 5 API routes
3. Update 8 queue/job files
4. Update type definitions

### Phase 3: Tests (4 hours)
1. Update test data
2. Add organization isolation tests
3. Verify backward compatibility

### Phase 4: Docs (2 hours)
1. Update API docs
2. Update architecture docs

### Phase 5: Verify (2 hours)
1. Data migration checks
2. Full test suite
3. Manual QA

**Total: 20 hours (2.5 days)**

---

## Key SQL Migrations

### Add organization_id to conversations

```sql
ALTER TABLE conversations
  ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

UPDATE conversations c
SET organization_id = cc.organization_id
FROM customer_configs cc
JOIN domains d ON d.domain = cc.domain
WHERE c.domain_id = d.id
  AND cc.organization_id IS NOT NULL;

CREATE INDEX idx_conversations_organization_id ON conversations(organization_id);
```

### Verify migration

```sql
SELECT
  COUNT(*) as total,
  COUNT(organization_id) as migrated,
  COUNT(*) - COUNT(organization_id) as missing
FROM conversations;

-- Expected: missing = 0
```

---

## Backward Compatibility

### Dual-Column Approach

```sql
-- Both columns exist for safety
customer_configs (
  customer_id UUID,      -- ⚠️ Legacy (keep for now)
  organization_id UUID   -- ✅ New primary
)
```

### API Parameters

```typescript
// Accept both parameters
{
  organizationId?: string,  // ✅ New - use this
  customerId?: string       // ⚠️ Legacy - deprecated
}

// Prefer organizationId, fallback to customerId
const id = organizationId || customerId;
```

### Query Pattern

```typescript
// Before migration
.eq('customer_id', customerId)

// During migration (both work)
.eq('organization_id', organizationId)  // ✅ Preferred
.eq('customer_id', customerId)          // ⚠️ Still works

// After cleanup (12 months)
.eq('organization_id', organizationId)  // ✅ Only option
```

---

## Risk Assessment

| Risk | Level | Mitigation |
|------|-------|------------|
| Data loss | LOW | Dual-column approach, never delete customer_id |
| Breaking changes | MEDIUM | Accept both parameters during transition |
| Performance | LOW | Partial indexes, <10% impact expected |
| Rollback complexity | LOW | Simple column drop if needed |

---

## Success Criteria

- ✅ 100% conversations have organization_id
- ✅ 100% customer_configs have organization_id
- ✅ All tests pass
- ✅ <10% performance impact
- ✅ Backward compatibility verified
- ✅ Zero production errors in first 7 days

---

## Quick Commands

### Regenerate Types
```bash
npx supabase gen types typescript --project-id birugqyuqhiahxvxeyqg > types/supabase.ts
```

### Run Tests
```bash
npm test                  # All tests
npm run test:integration  # Integration only
npm run test:coverage     # With coverage
```

### Verify Migration
```bash
# Check conversations
psql $DATABASE_URL -c "SELECT COUNT(*), COUNT(organization_id) FROM conversations"

# Check customer_configs
psql $DATABASE_URL -c "SELECT COUNT(*), COUNT(organization_id) FROM customer_configs"
```

---

## Rollback Plan

### If migration fails:

```sql
-- Drop added column
ALTER TABLE conversations DROP COLUMN organization_id;
DROP INDEX idx_conversations_organization_id;
```

### If code issues found:

```bash
# Revert code, keep database changes (backward compatible)
git revert <commit-hash>
```

---

## Timeline

- **Week 1:** Database migration (3 days)
- **Week 2:** Code migration (5 days)
- **Week 3:** Testing & docs (2 days)

**Total: 10 working days**

---

## After Migration

### Immediate
- ✅ All new code uses organization_id
- ✅ Old customer_id still works

### 3 Months
- ⚠️ Deprecation warnings on customer_id

### 6 Months
- ❌ Remove customer_id from docs
- ⚠️ API warnings when customer_id used

### 12 Months
- ❌ Drop customer_id columns
- ❌ Remove all customer_id code

---

## Files Reference

### Must Change (30 files)

**Database Queries (2):**
- `lib/scraper-config.ts`
- `app/api/customer/config/route.ts`

**API Routes (5):**
- `app/api/customer/config/route.ts`
- `app/api/dashboard/overview/route.ts`
- `app/api/jobs/route.ts`
- `app/api/queue/route.ts`
- `app/api/verify-customer/route.ts`

**Queue/Jobs (8):**
- `lib/queue/index.ts`
- `lib/queue/job-processor.ts`
- `lib/queue/queue-manager.ts`
- `lib/queue/queue-utils.ts`
- `lib/queue/scrape-queue.ts`
- `lib/safe-database.ts`
- `lib/integrations/customer-scraping-integration.ts`
- `lib/customer-verification-simple.ts`

**Tests (6):**
- `test-utils/test-config.ts`
- `test-utils/mock-helpers.ts`
- `__tests__/api/scrape/route.test.ts`
- `__tests__/integration/multi-tenant-isolation.test.ts`
- `__mocks__/@woocommerce/woocommerce-rest-api.js`
- (other test files)

**Types (2):**
- `types/supabase.ts` (regenerate)
- `types/index.ts`

### DO NOT Change (WooCommerce API - 12 files)

```
lib/woocommerce*.ts
lib/woocommerce-api/*.ts
__tests__/lib/woocommerce.test.ts
```

These reference WooCommerce's external API, not our database!

---

## Next Steps

1. ✅ Review migration plan
2. ✅ Approve approach
3. 🔄 Create database backup
4. 🔄 Execute Phase 1 (database)
5. 🔄 Execute Phase 2 (code)
6. 🔄 Execute Phase 3 (tests)
7. 🔄 Execute Phase 4 (docs)
8. 🔄 Execute Phase 5 (verify)
9. 🔄 Deploy to production
10. 🔄 Monitor for 30 days

---

**For Full Details:** See `docs/CUSTOMER_ID_MIGRATION_PLAN.md`

**Status:** Ready to Execute
**Risk Level:** LOW
**Time Estimate:** 10 days
**Reviewer:** Engineering Team
