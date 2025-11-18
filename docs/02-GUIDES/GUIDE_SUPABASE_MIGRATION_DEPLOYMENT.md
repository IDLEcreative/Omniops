# Supabase Migration Deployment Guide

**Type:** Guide
**Status:** Active
**Last Updated:** 2025-11-18
**Purpose:** Step-by-step guide for deploying Supabase performance optimizations to production

## Overview

This guide covers the deployment of 4 major database migrations that implement critical performance optimizations identified in ANALYSIS_SUPABASE_PERFORMANCE.md.

**Total Performance Improvement:** 50-85% across various operations
**Estimated Deployment Time:** 30-45 minutes
**Downtime Required:** None (all migrations use CONCURRENTLY)

## Prerequisites

- [ ] Supabase CLI installed (`npm install -g supabase`)
- [ ] Database backup completed
- [ ] Admin access to Supabase project
- [ ] `SUPABASE_ACCESS_TOKEN` environment variable set
- [ ] Project reference: `birugqyuqhiahxvxeyqg`

## Migrations to Deploy

### Migration 1: Analytics Composite Indexes
**File:** `supabase/migrations/20251118000000_add_analytics_composite_indexes.sql`
**Impact:** 20-30% faster analytics queries
**Risk:** Low (adds indexes only, no data changes)
**Execution Time:** 5-10 minutes

**What it does:**
- Adds 3 composite indexes for common analytics query patterns
- Uses `CREATE INDEX CONCURRENTLY` to avoid table locks
- Optimizes domain-based cost analysis, model performance queries, and scraping status queries

### Migration 2: Conversation Metadata Optimization
**File:** `supabase/migrations/20251118000001_add_conversation_metadata_update_function.sql`
**Impact:** 15-30ms reduction per metadata update
**Risk:** Low (adds function only)
**Execution Time:** <1 minute

**What it does:**
- Creates PostgreSQL function for atomic JSONB metadata updates
- Eliminates N+1 query pattern (SELECT + UPDATE → single RPC call)
- Used by conversation-manager.ts for session metadata

### Migration 3: RLS JOIN Optimization
**File:** `supabase/migrations/20251118000002_optimize_rls_joins.sql`
**Impact:** 30-40% faster queries (80-85% total from baseline)
**Risk:** Medium (changes RLS policies - security critical)
**Execution Time:** 2-5 minutes

**What it does:**
- Replaces IN subqueries with JOIN-based access checks
- Creates 2 helper functions: `check_domain_access()`, `check_message_access()`
- Updates 12 RLS policies across 6 tables
- Maintains same security guarantees with better performance

**Security verification required!**

### Migration 4: Analytics Materialized Views
**File:** `supabase/migrations/20251118000003_optimize_telemetry_analytics.sql`
**Impact:** 50-80% faster dashboards (2000ms → 400ms)
**Risk:** Low-Medium (creates views and cron jobs)
**Execution Time:** 5-10 minutes

**What it does:**
- Creates 2 materialized views for pre-computed analytics
- Adds 9 performance indexes on materialized views
- Sets up hourly auto-refresh using pg_cron
- Dashboard APIs use materialized views instead of raw tables

## Pre-Deployment Checklist

### 1. Backup Database
```bash
# Create full database backup
supabase db dump --project-ref birugqyuqhiahxvxeyqg > backup-$(date +%Y%m%d-%H%M%S).sql

# Verify backup file exists and is not empty
ls -lh backup-*.sql
```

### 2. Verify Current State
```bash
# Check database connection
supabase db remote --project-ref birugqyuqhiahxvxeyqg

# Verify no pending migrations
supabase db remote --project-ref birugqyuqhiahxvxeyqg ls

# Check current table count
psql $DATABASE_URL -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';"
```

### 3. Test Migrations Locally (Recommended)
```bash
# Start local Supabase instance
supabase start

# Apply migrations locally
supabase db push

# Run verification scripts
npx tsx scripts/database/verify-rls-join-optimization.sql
npx tsx scripts/database/verify-telemetry-views.ts

# If successful, reset and prepare for production
supabase stop
```

## Deployment Steps

### Step 1: Deploy Analytics Indexes (Low Risk)

```bash
# Apply migration
supabase db push --project-ref birugqyuqhiahxvxeyqg \
  --include-all \
  --file supabase/migrations/20251118000000_add_analytics_composite_indexes.sql

# Verify indexes created
psql $DATABASE_URL -c "
  SELECT indexname, indexdef
  FROM pg_indexes
  WHERE indexname IN (
    'idx_chat_telemetry_domain_cost_created',
    'idx_chat_telemetry_model_duration',
    'idx_scraped_pages_domain_status_created'
  );
"

# Expected output: 3 indexes listed
```

**Verification:**
- [ ] 3 new indexes visible in Supabase dashboard
- [ ] No errors in migration logs
- [ ] Analytics queries still work

### Step 2: Deploy Metadata Update Function (Low Risk)

```bash
# Apply migration
supabase db push --project-ref birugqyuqhiahxvxeyqg \
  --include-all \
  --file supabase/migrations/20251118000001_add_conversation_metadata_update_function.sql

# Verify function created
psql $DATABASE_URL -c "
  SELECT routine_name, routine_type
  FROM information_schema.routines
  WHERE routine_name = 'update_conversation_metadata';
"

# Test function
psql $DATABASE_URL -c "
  SELECT update_conversation_metadata(
    '00000000-0000-0000-0000-000000000000'::uuid,
    '{\"test\": true}'::jsonb
  );
"
# Should return without errors (row won't exist, but function should execute)
```

**Verification:**
- [ ] Function `update_conversation_metadata` exists
- [ ] Function executes without errors
- [ ] Conversation updates still work

### Step 3: Deploy RLS Optimization (CRITICAL - Security Check)

**⚠️ SECURITY CRITICAL:** This migration changes RLS policies. Verify security before and after!

```bash
# BEFORE: Test current RLS policies work
psql $DATABASE_URL -c "
  SET ROLE authenticated;
  SET request.jwt.claims.sub = '00000000-0000-0000-0000-000000000001';
  SELECT COUNT(*) FROM conversations;
  RESET ROLE;
"
# Note the count

# Apply migration
supabase db push --project-ref birugqyuqhiahxvxeyqg \
  --include-all \
  --file supabase/migrations/20251118000002_optimize_rls_joins.sql

# AFTER: Verify RLS policies still work correctly
psql $DATABASE_URL -c "
  SET ROLE authenticated;
  SET request.jwt.claims.sub = '00000000-0000-0000-0000-000000000001';
  SELECT COUNT(*) FROM conversations;
  RESET ROLE;
"
# Should return SAME count as before (RLS enforcement unchanged)

# Verify helper functions created
psql $DATABASE_URL -c "
  SELECT routine_name
  FROM information_schema.routines
  WHERE routine_name IN ('check_domain_access', 'check_message_access');
"
```

**Security Verification Script:**
```bash
# Run comprehensive RLS verification
psql $DATABASE_URL -f scripts/database/verify-rls-join-optimization.sql

# Expected output:
# ✅ check_domain_access function exists
# ✅ check_message_access function exists
# ✅ 12 policies updated
# ✅ Security tests pass
```

**Verification:**
- [ ] Helper functions exist
- [ ] 12 RLS policies updated
- [ ] Security verification script passes
- [ ] Same user access patterns as before
- [ ] No unauthorized data access

**Rollback Plan (if security issues):**
```bash
# Restore previous RLS policies from backup
psql $DATABASE_URL < backup-$(date +%Y%m%d)-*.sql
```

### Step 4: Deploy Materialized Views (Medium Risk)

```bash
# Apply migration
supabase db push --project-ref birugqyuqhiahxvxeyqg \
  --include-all \
  --file supabase/migrations/20251118000003_optimize_telemetry_analytics.sql

# Verify materialized views created
psql $DATABASE_URL -c "
  SELECT matviewname
  FROM pg_matviews
  WHERE matviewname IN (
    'chat_telemetry_domain_summary',
    'chat_telemetry_model_summary'
  );
"

# Verify initial data populated
psql $DATABASE_URL -c "
  SELECT COUNT(*) FROM chat_telemetry_domain_summary;
  SELECT COUNT(*) FROM chat_telemetry_model_summary;
"

# Verify cron job scheduled
psql $DATABASE_URL -c "
  SELECT jobname, schedule, command
  FROM cron.job
  WHERE jobname = 'refresh-chat-telemetry-views';
"
```

**Verification:**
- [ ] 2 materialized views exist
- [ ] Views contain data
- [ ] Cron job scheduled for hourly refresh
- [ ] Dashboard queries use new views
- [ ] Dashboard load times improved

**Manual Refresh (if needed):**
```bash
npx tsx scripts/database/refresh-analytics-views.ts
```

## Post-Deployment Verification

### Performance Benchmarks

Run these benchmarks BEFORE and AFTER deployment to measure improvement:

```bash
# 1. Analytics query performance
psql $DATABASE_URL -c "
  EXPLAIN ANALYZE
  SELECT domain, COUNT(*), SUM(cost_usd), AVG(duration_ms)
  FROM chat_telemetry
  WHERE created_at > NOW() - INTERVAL '7 days'
  GROUP BY domain;
"
# Before: ~300-500ms
# After: ~80-150ms (with indexes)

# 2. Dashboard materialized view query
psql $DATABASE_URL -c "
  EXPLAIN ANALYZE
  SELECT * FROM chat_telemetry_domain_summary;
"
# Before: N/A (didn't exist)
# After: <50ms

# 3. RLS policy overhead
psql $DATABASE_URL -c "
  SET ROLE authenticated;
  SET request.jwt.claims.sub = '<valid-user-id>';
  EXPLAIN ANALYZE
  SELECT COUNT(*) FROM conversations WHERE domain_id = '<valid-domain-id>';
  RESET ROLE;
"
# Before: ~100-150ms
# After: ~60-90ms (30-40% improvement)
```

### Application-Level Verification

```bash
# 1. Verify two-tier cache integration works
npx tsx scripts/tests/verify-two-tier-cache.ts

# 2. Verify telemetry views populated correctly
npx tsx scripts/database/verify-telemetry-views.ts --benchmark

# 3. Run API endpoint tests
curl https://your-domain.com/api/dashboard/telemetry
# Should return quickly (<200ms)

# 4. Check application logs for errors
# Monitor Supabase logs for any RLS policy violations
```

## Monitoring Post-Deployment

### Key Metrics to Watch (First 24 Hours)

1. **Database Performance:**
   - Query execution times (should decrease)
   - Connection pool usage (should decrease)
   - CPU usage (should decrease or stay same)
   - Index usage statistics

2. **Application Performance:**
   - API response times (should improve)
   - Dashboard load times (should improve 50-80%)
   - Cache hit rates (monitor Redis)

3. **Security:**
   - No unauthorized data access
   - RLS policies functioning correctly
   - Audit logs show expected access patterns

### Monitoring Commands

```bash
# Monitor slow queries
psql $DATABASE_URL -c "
  SELECT query, mean_exec_time, calls
  FROM pg_stat_statements
  ORDER BY mean_exec_time DESC
  LIMIT 10;
"

# Check index usage
psql $DATABASE_URL -c "
  SELECT schemaname, tablename, indexname, idx_scan, idx_tup_read
  FROM pg_stat_user_indexes
  WHERE indexname LIKE 'idx_%'
  ORDER BY idx_scan DESC;
"

# Monitor materialized view freshness
psql $DATABASE_URL -c "
  SELECT matviewname,
         pg_size_pretty(pg_total_relation_size(matviewname::regclass)) as size,
         (SELECT materialized_at FROM chat_telemetry_domain_summary LIMIT 1) as last_refresh
  FROM pg_matviews;
"
```

## Rollback Procedures

### If Issues Detected

**Scenario 1: Performance Degradation**
```bash
# Drop new indexes if they're causing issues
psql $DATABASE_URL -c "
  DROP INDEX CONCURRENTLY IF EXISTS idx_chat_telemetry_domain_cost_created;
  DROP INDEX CONCURRENTLY IF EXISTS idx_chat_telemetry_model_duration;
  DROP INDEX CONCURRENTLY IF EXISTS idx_scraped_pages_domain_status_created;
"
```

**Scenario 2: RLS Security Issues**
```bash
# Restore from backup
psql $DATABASE_URL < backup-$(date +%Y%m%d)-*.sql

# Or manually revert RLS policies (see backup SQL)
```

**Scenario 3: Materialized View Issues**
```bash
# Drop materialized views and cron job
psql $DATABASE_URL -c "
  SELECT cron.unschedule('refresh-chat-telemetry-views');
  DROP MATERIALIZED VIEW IF EXISTS chat_telemetry_domain_summary;
  DROP MATERIALIZED VIEW IF EXISTS chat_telemetry_model_summary;
"

# Revert API services to use raw tables
# (requires code deployment)
```

## Success Criteria

Deployment is successful if ALL of the following are true:

- [ ] All 4 migrations applied without errors
- [ ] Database backup exists and is valid
- [ ] 3 new indexes visible and being used
- [ ] Metadata update function working
- [ ] RLS policies functioning correctly (security verified)
- [ ] 2 materialized views populated with data
- [ ] Cron job scheduled and running
- [ ] Dashboard load times improved 50-80%
- [ ] Analytics queries 20-30% faster
- [ ] No increase in error rates
- [ ] No unauthorized data access
- [ ] Application logs show no new errors

## Timeline

| Step | Duration | Cumulative |
|------|----------|------------|
| Pre-deployment checks | 10 min | 10 min |
| Deploy analytics indexes | 10 min | 20 min |
| Deploy metadata function | 2 min | 22 min |
| Deploy RLS optimization | 10 min | 32 min |
| Deploy materialized views | 10 min | 42 min |
| Post-deployment verification | 15 min | 57 min |
| **Total** | **57 min** | **~1 hour** |

## Support & Troubleshooting

### Common Issues

**Issue:** Index creation taking too long
- **Solution:** Indexes are created with CONCURRENTLY, which is slower but non-blocking. This is expected.

**Issue:** Materialized view refresh fails
- **Solution:** Check pg_cron extension is enabled: `CREATE EXTENSION IF NOT EXISTS pg_cron;`

**Issue:** RLS policies blocking legitimate access
- **Solution:** Verify user is member of organization with domain access. Check audit logs.

**Issue:** Dashboard shows stale data
- **Solution:** Manually refresh views: `npx tsx scripts/database/refresh-analytics-views.ts`

### Emergency Contacts

If critical issues arise:
- Database backup: `backup-YYYYMMDD-HHMMSS.sql`
- Rollback procedures: See "Rollback Procedures" section above
- Supabase support: https://supabase.com/support

## Next Steps After Deployment

1. Monitor performance metrics for 24-48 hours
2. Adjust cache TTLs based on actual usage patterns
3. Consider adding more materialized views for other dashboards
4. Document performance improvements in ANALYSIS document
5. Update ISSUES.md with deployment completion

## References

- [ANALYSIS_SUPABASE_PERFORMANCE.md](../10-ANALYSIS/ANALYSIS_SUPABASE_PERFORMANCE.md) - Original analysis
- [ANALYSIS_RLS_JOIN_OPTIMIZATION_SUMMARY.md](../10-ANALYSIS/ANALYSIS_RLS_JOIN_OPTIMIZATION_SUMMARY.md) - RLS optimization details
- [ANALYSIS_TELEMETRY_MATERIALIZED_VIEWS_OPTIMIZATION.md](../10-ANALYSIS/ANALYSIS_TELEMETRY_MATERIALIZED_VIEWS_OPTIMIZATION.md) - Materialized views details
- [GUIDE_TWO_TIER_CACHE.md](GUIDE_TWO_TIER_CACHE.md) - Cache configuration guide
