# Customer ID Migration - Execution Checklist

**Type:** Guide
**Status:** Active
**Last Updated:** 2025-10-29
**Verified For:** v0.1.0
**Dependencies:**
- `GUIDE_CUSTOMER_ID_MIGRATION_PLAN.md`
- Database migration scripts
- Test suite infrastructure
- Deployment procedures
**Estimated Read Time:** 24 minutes

## Purpose
Provides a comprehensive, step-by-step execution checklist for the customer_id to organization_id migration. Covers pre-migration setup, database schema changes, code updates, testing phases, documentation updates, verification procedures, deployment steps, and rollback procedures with timeline tracking and sign-off requirements.

## Quick Links
- [Pre-Migration Setup](#pre-migration-setup)
- [Phase 1: Database Migration](#phase-1-database-migration-4-hours)
- [Phase 2: Code Migration](#phase-2-code-migration-8-hours)
- [Phase 3: Test Updates](#phase-3-test-updates-4-hours)
- [Phase 4: Documentation Updates](#phase-4-documentation-updates-2-hours)
- [Phase 5: Cleanup & Verification](#phase-5-cleanup--verification-2-hours)
- [Deployment](#deployment)
- [Rollback Procedures](#rollback-procedures)
- [Success Metrics](#success-metrics)
- [Timeline Tracker](#timeline-tracker)

## Keywords
migration checklist, execution plan, database migration, code migration, test updates, documentation updates, verification procedures, deployment steps, rollback procedures, migration phases, quality assurance, manual QA, performance testing, production deployment, post-deployment monitoring

## Aliases
- "migration checklist" (also known as: execution checklist, migration tasks, step-by-step guide)
- "backfill" (also known as: data migration, historical update, column population)
- "verification query" (also known as: validation check, data integrity check, migration confirmation)
- "rollback" (also known as: revert, undo migration, recovery procedure)

---

## Pre-Migration Setup

### Preparation (30 minutes)
- [ ] Read `CUSTOMER_ID_MIGRATION_PLAN.md` thoroughly
- [ ] Review `CUSTOMER_ID_MIGRATION_SUMMARY.md` for quick reference
- [ ] Create database backup
- [ ] Tag codebase: `git tag pre-customer-id-migration`
- [ ] Create migration branch: `git checkout -b migrate/customer-id-to-organization-id`
- [ ] Run baseline test suite: `npm test` (record pass/fail counts)

---

## Phase 1: Database Migration (4 hours)

### 1.1 Create Migration File: conversations (1 hour)
- [ ] Create `supabase/migrations/20251023_add_organization_id_to_conversations.sql`
- [ ] Copy SQL from migration plan (Phase 1.1)
- [ ] Add organization_id column
- [ ] Backfill from customer_configs via domain_id
- [ ] Create index
- [ ] Update RLS policies
- [ ] Add verification query
- [ ] Test migration locally first

### 1.2 Create Migration File: scraper_configs (1 hour)
- [ ] Create `supabase/migrations/20251023_add_organization_id_to_scraper_configs.sql`
- [ ] Copy SQL from migration plan (Phase 1.2)
- [ ] Check if table exists (conditional)
- [ ] Add organization_id column
- [ ] Backfill from customer_configs
- [ ] Create index
- [ ] Test migration locally

### 1.3 Apply Migrations (1 hour)
- [ ] Apply locally: `npx supabase db push`
- [ ] Verify migrations applied: `npx supabase db migrations list`
- [ ] Run verification queries
- [ ] Check migration percentage (should be 100%)
- [ ] Test rollback in local environment
- [ ] If successful, apply to staging
- [ ] If successful, apply to production

### 1.4 Regenerate Types (30 minutes)
- [ ] Run: `npx supabase gen types typescript --project-id birugqyuqhiahxvxeyqg > types/supabase.ts`
- [ ] Review changes in `types/supabase.ts`
- [ ] Verify `conversations` has `organization_id: string | null`
- [ ] Verify `customer_configs` still has both columns
- [ ] Commit: `git add types/supabase.ts && git commit -m "chore: regenerate types after organization_id migration"`

---

## Phase 2: Code Migration (8 hours)

### 2.1 Update Database Queries (2 hours)

#### File: lib/scraper-config.ts
- [ ] Open file, find `loadFromDatabase` method (~line 620)
- [ ] Change `.eq('customer_id', customerId)` to `.eq('organization_id', organizationId)`
- [ ] Update parameter name: `customerId` → `organizationId`
- [ ] Update property: `this.customerId` → `this.organizationId`
- [ ] Test locally
- [ ] Commit: `git commit -m "refactor(scraper-config): migrate to organization_id"`

#### File: app/api/customer/config/route.ts
- [ ] Update `CustomerConfig` interface (add `organization_id` field)
- [ ] Update `CreateConfigSchema` (add `organizationId` parameter)
- [ ] Update GET handler query (~line 119)
- [ ] Add dual-column support (prefer org_id, fallback to customer_id)
- [ ] Update POST handler insert (~line 236)
- [ ] Update response mapping (~line 264, 274, 450, 570)
- [ ] Test API endpoints locally
- [ ] Commit: `git commit -m "refactor(api/customer/config): migrate to organization_id"`

### 2.2 Update API Route Interfaces (2 hours)

#### File: app/api/dashboard/overview/route.ts
- [ ] Update type definition (~line 8)
- [ ] Update SELECT query (~line 79)
- [ ] Test dashboard overview page
- [ ] Commit: `git commit -m "refactor(dashboard/overview): add organization_id support"`

#### File: app/api/queue/route.ts
- [ ] Update `CleanupOptions` interface (~line 25)
- [ ] Add `organizationId` parameter support
- [ ] Keep `customerId` for backward compatibility
- [ ] Update cleanup logic (~line 280)
- [ ] Test queue cleanup
- [ ] Commit: `git commit -m "refactor(api/queue): migrate to organization_id"`

#### File: app/api/jobs/route.ts
- [ ] Update schemas (~line 17, 35, 47)
- [ ] Add `organizationId` to all request schemas
- [ ] Update GET handler (~line 86)
- [ ] Update POST handlers (~line 181, 192, 206, 250, 285)
- [ ] Test job API endpoints
- [ ] Commit: `git commit -m "refactor(api/jobs): migrate to organization_id"`

#### File: app/api/verify-customer/route.ts
- [ ] Review for customer_id usage
- [ ] Update if needed
- [ ] Commit if changed

### 2.3 Update Queue/Job Metadata (2 hours)

#### File: lib/queue/queue-manager.ts
- [ ] Find all `customerId` references
- [ ] Add `organizationId` support
- [ ] Update job metadata structures
- [ ] Test job creation
- [ ] Commit: `git commit -m "refactor(queue-manager): migrate to organization_id"`

#### File: lib/queue/job-processor.ts
- [ ] Update job metadata processing
- [ ] Add organization context
- [ ] Test job processing
- [ ] Commit: `git commit -m "refactor(job-processor): migrate to organization_id"`

#### File: lib/queue/queue-utils.ts
- [ ] Update utility functions
- [ ] Add organization_id filtering
- [ ] Test utilities
- [ ] Commit: `git commit -m "refactor(queue-utils): migrate to organization_id"`

#### File: lib/queue/scrape-queue.ts
- [ ] Update scrape job metadata
- [ ] Add organization context
- [ ] Test scraping jobs
- [ ] Commit: `git commit -m "refactor(scrape-queue): migrate to organization_id"`

#### File: lib/queue/index.ts
- [ ] Update exports if needed
- [ ] Verify all queue functions work
- [ ] Commit if changed

### 2.4 Update Integration Files (1 hour)

#### File: lib/integrations/customer-scraping-integration.ts
- [ ] Find `config.customer_id` references (~line 237, 295)
- [ ] Change to `config.organization_id || config.customer_id` (fallback)
- [ ] Test scraping integration
- [ ] Commit: `git commit -m "refactor(customer-scraping): migrate to organization_id"`

#### File: lib/customer-verification-simple.ts
- [ ] Review for database customer_id usage
- [ ] Update if needed (may only have WooCommerce references)
- [ ] Commit if changed

#### File: lib/safe-database.ts
- [ ] Find customer_id reference (~line 141)
- [ ] Update to organization_id
- [ ] Test database operations
- [ ] Commit: `git commit -m "refactor(safe-database): migrate to organization_id"`

### 2.5 Update Type Definitions (30 minutes)

#### File: types/index.ts
- [ ] Review `WooCommerceOrder` type - DO NOT CHANGE (external API)
- [ ] Update any internal type definitions
- [ ] Add deprecation comments to customer_id fields
- [ ] Commit: `git commit -m "chore(types): add organization_id types"`

---

## Phase 3: Test Updates (4 hours)

### 3.1 Update Test Data (2 hours)

#### File: test-utils/test-config.ts
- [ ] Add `TEST_ORGANIZATION_ID` constant
- [ ] Update `TEST_CUSTOMER_CONFIG` to include organization_id
- [ ] Keep customer_id for legacy test compatibility
- [ ] Commit: `git commit -m "test: add organization_id to test config"`

#### File: test-utils/mock-helpers.ts
- [ ] Update mock data generators
- [ ] Add organization_id to mock records
- [ ] Test mock helpers
- [ ] Commit: `git commit -m "test: update mock helpers for organization_id"`

#### File: __mocks__/@woocommerce/woocommerce-rest-api.js
- [ ] Verify WooCommerce mocks unchanged (customer_id is WooCommerce's field)
- [ ] No changes needed (skip)

### 3.2 Update Integration Tests (2 hours)

#### File: __tests__/integration/multi-tenant-isolation.test.ts
- [ ] Add organization-based isolation tests
- [ ] Test organization_id filtering
- [ ] Test cross-organization data isolation
- [ ] Verify RLS policies work correctly
- [ ] Commit: `git commit -m "test: add organization multi-tenant isolation tests"`

#### File: __tests__/api/scrape/route.test.ts
- [ ] Update test data to include organization_id
- [ ] Verify backward compatibility tests
- [ ] Commit: `git commit -m "test: update scrape API tests for organization_id"`

#### File: __tests__/lib/woocommerce.test.ts
- [ ] Verify no changes needed (WooCommerce tests)
- [ ] Skip if only WooCommerce API references

### 3.3 Run Test Suite
- [ ] Run unit tests: `npm run test:unit`
- [ ] Run integration tests: `npm run test:integration`
- [ ] Run full suite: `npm test`
- [ ] Check coverage: `npm run test:coverage`
- [ ] Verify >80% coverage maintained
- [ ] Fix any failing tests

---

## Phase 4: Documentation Updates (2 hours)

### 4.1 Update API Documentation (1 hour)

#### File: app/api/scrape/README.md
- [ ] Replace `customerId` with `organizationId` in examples
- [ ] Add backward compatibility note
- [ ] Update request/response examples

#### File: app/api/queue/README.md
- [ ] Update parameter documentation
- [ ] Add organizationId examples
- [ ] Note customerId deprecation

#### File: app/api/jobs/README.md
- [ ] Update all examples
- [ ] Update parameter tables
- [ ] Add migration notes

#### File: app/api/customer/README.md
- [ ] Update endpoint documentation
- [ ] Rename to "Organization Config" if appropriate
- [ ] Update all code examples

#### File: types/README.md
- [ ] Update type definitions
- [ ] Document organization_id fields
- [ ] Add deprecation notes

### 4.2 Update Architecture Documentation (1 hour)

#### File: docs/ARCHITECTURE.md
- [ ] Update entity relationship diagrams
- [ ] Replace customer-centric language
- [ ] Add organization model explanation

#### File: docs/AUTHENTICATION_LINKAGE.md
- [ ] Update authentication flow
- [ ] Add organization context

#### File: docs/CUSTOMER_VERIFICATION_SYSTEM.md
- [ ] Rename or update to "Organization Verification"
- [ ] Update examples

#### File: docs/CUSTOMER_SCRAPING_INTEGRATION.md
- [ ] Update to organization context
- [ ] Update code examples

#### Commit All Docs
- [ ] `git add docs/ app/api/**/README.md types/README.md`
- [ ] `git commit -m "docs: migrate from customer_id to organization_id"`

---

## Phase 5: Cleanup & Verification (2 hours)

### 5.1 Verify Data Migration (30 minutes)

Run these SQL queries:

```sql
-- Conversations migration check
SELECT
  COUNT(*) as total_conversations,
  COUNT(organization_id) as with_org_id,
  COUNT(customer_id) as with_customer_id,
  COUNT(*) - COUNT(organization_id) as missing_org_id
FROM conversations;
```
- [ ] Record results
- [ ] Verify missing_org_id = 0

```sql
-- Customer configs migration check
SELECT
  COUNT(*) as total_configs,
  COUNT(organization_id) as with_org_id,
  COUNT(customer_id) as with_customer_id
FROM customer_configs;
```
- [ ] Record results
- [ ] Verify all have organization_id

```sql
-- Check for orphaned records
SELECT c.id, c.domain_id, c.customer_id, c.organization_id
FROM conversations c
WHERE c.organization_id IS NULL
  AND c.customer_id IS NOT NULL;
```
- [ ] Verify no results (empty set expected)

### 5.2 Run Full Test Suite (30 minutes)
- [ ] `npm test` - all tests should pass
- [ ] `npm run test:unit` - verify unit tests
- [ ] `npm run test:integration` - verify integration tests
- [ ] `npm run test:coverage` - check coverage >80%
- [ ] Compare with baseline test results
- [ ] Document any new failures

### 5.3 Manual QA Checklist (30 minutes)
- [ ] Login to dashboard
- [ ] Verify team page shows organization members
- [ ] Create new domain
- [ ] Scrape domain content
- [ ] Start conversation on scraped domain
- [ ] Verify conversation appears in dashboard
- [ ] Check conversation has organization_id in database
- [ ] Add team member to organization
- [ ] Verify team member can see organization data
- [ ] Remove team member
- [ ] Verify removed member cannot access data
- [ ] Test WooCommerce integration (if configured)
- [ ] Test Shopify integration (if configured)

### 5.4 Performance Testing (30 minutes)
- [ ] Measure query performance before/after
- [ ] Test with 100+ conversations
- [ ] Verify <10% performance degradation
- [ ] Check index usage with EXPLAIN ANALYZE
- [ ] Document performance metrics

---

## Deployment

### Pre-Deployment
- [ ] All tests passing
- [ ] All checklists complete
- [ ] Database migrations tested in staging
- [ ] Rollback plan documented
- [ ] Monitoring alerts configured

### Staging Deployment
- [ ] Deploy migrations to staging database
- [ ] Deploy code to staging
- [ ] Run smoke tests
- [ ] Verify no errors in logs
- [ ] Test backward compatibility

### Production Deployment
- [ ] Create production database backup
- [ ] Schedule maintenance window (if needed)
- [ ] Apply database migrations
- [ ] Deploy code
- [ ] Verify deployment successful
- [ ] Monitor error rates
- [ ] Check application logs
- [ ] Test critical user flows

### Post-Deployment Monitoring (7 days)
- [ ] Day 1: Monitor error logs every hour
- [ ] Day 1: Check customer_id vs organization_id query ratio
- [ ] Day 2-3: Monitor error logs twice daily
- [ ] Day 4-7: Monitor error logs daily
- [ ] Week 1: Verify no customer_id related errors
- [ ] Week 1: Measure performance impact
- [ ] Week 1: Review with team

---

## Rollback Procedures

### If Database Migration Fails
```sql
ALTER TABLE conversations DROP COLUMN IF EXISTS organization_id;
DROP INDEX IF EXISTS idx_conversations_organization_id;

ALTER TABLE scraper_configs DROP COLUMN IF EXISTS organization_id;
DROP INDEX IF EXISTS idx_scraper_configs_organization_id;
```
- [ ] Execute rollback SQL
- [ ] Verify database state
- [ ] Regenerate types
- [ ] Document failure reason

### If Code Deployment Fails
```bash
git revert <migration-commit-range>
git push origin main
```
- [ ] Revert code changes
- [ ] Keep database changes (backward compatible)
- [ ] Redeploy previous version
- [ ] Document failure reason

### Emergency Production Rollback
```bash
# Immediate rollback
git revert HEAD~5..HEAD  # Revert last 5 commits (adjust as needed)
git push origin main --force-with-lease

# Database stays as-is (dual-column approach is safe)
```
- [ ] Execute emergency rollback
- [ ] Notify team
- [ ] Schedule post-mortem
- [ ] Create bug ticket

---

## Success Metrics

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
- ✅ All tests pass (same or better than baseline)
- ✅ Test coverage remains >80%

### Production Readiness
- ✅ Manual QA checklist 100% complete
- ✅ Performance benchmarks within 10% of baseline
- ✅ Documentation updated
- ✅ Rollback plan tested in staging
- ✅ Team trained on new architecture
- ✅ Zero production errors in first 7 days

---

## Timeline Tracker

### Week 1: Database Migration
- [ ] Day 1: Phases 0 + 1.1-1.2 (Pre-migration + migrations)
- [ ] Day 2: Phase 1.3-1.4 (Apply + regenerate types)
- [ ] Day 3: Verification + testing

### Week 2: Code Migration
- [ ] Day 4: Phase 2.1-2.2 (Queries + API routes)
- [ ] Day 5: Phase 2.3-2.4 (Queue + types)
- [ ] Day 6: Phase 2.5 (Integrations)

### Week 3: Testing & Deployment
- [ ] Day 7: Phase 3 (All tests)
- [ ] Day 8: Phase 4 (Documentation)
- [ ] Day 9: Phase 5 (Verification)
- [ ] Day 10: Deployment + monitoring

**Actual Start Date:** __________
**Actual End Date:** __________
**Total Days:** __________

---

## Sign-Off

### Phase Completion
- [ ] Phase 0: Pre-migration ______ (date) ______ (initials)
- [ ] Phase 1: Database migration ______ (date) ______ (initials)
- [ ] Phase 2: Code migration ______ (date) ______ (initials)
- [ ] Phase 3: Test updates ______ (date) ______ (initials)
- [ ] Phase 4: Documentation ______ (date) ______ (initials)
- [ ] Phase 5: Verification ______ (date) ______ (initials)

### Final Approval
- [ ] Technical Lead: ______ (date) ______ (signature)
- [ ] Engineering Manager: ______ (date) ______ (signature)
- [ ] Product Owner: ______ (date) ______ (signature)

---

**Document Version:** 1.0
**Last Updated:** 2025-10-22
**Status:** Ready for Execution
