# Complete Deployment Guide: Security Fixes + Auto-Refresh

**Type:** Guide
**Status:** Active - Ready to Deploy
**Last Updated:** 2025-11-08
**Estimated Time:** 30 minutes

## Overview

This guide deploys all security fixes and enables automated content refresh.

**What You're Deploying:**
1. ✅ RLS security for 3 tables
2. ✅ Fixed security definer views (brand-agnostic)
3. ✅ Function search_path security (28 functions)
4. ✅ Automated daily content refresh at 2 AM UTC

---

## Prerequisites

- Access to [Supabase Dashboard](https://supabase.com/dashboard/project/birugqyuqhiahxvxeyqg/sql)
- Server with ability to restart (for auto-refresh)

---

## Part 1: Apply Security Migrations (15 minutes)

### Step 1: RLS Migrations (3 tables)

Go to [Supabase SQL Editor](https://supabase.com/dashboard/project/birugqyuqhiahxvxeyqg/sql)

**1.1 Apply widget_config_versions RLS**
```sql
-- Copy entire contents of:
-- supabase/migrations/20250108000001_add_rls_widget_config_versions.sql
-- Paste and run
```

**1.2 Apply domain_mappings RLS**
```sql
-- Copy entire contents of:
-- supabase/migrations/20250108000002_add_rls_domain_mappings.sql
-- Paste and run
```

**1.3 Apply demo_sessions RLS**
```sql
-- Copy entire contents of:
-- supabase/migrations/20250108000003_add_rls_demo_sessions.sql
-- Paste and run
```

**Verify RLS Enabled:**
```sql
SELECT tablename, rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('widget_config_versions', 'domain_mappings', 'demo_sessions');
```

Expected: All 3 show `rls_enabled = true`

---

### Step 2: View Security Migration (Brand-Agnostic Fix)

**Apply view security definer fix:**
```sql
-- Copy entire contents of:
-- supabase/migrations/20251108000000_fix_view_security_definer.sql
-- Paste and run
```

**Verify Views Created:**
```sql
SELECT viewname, definition
FROM pg_views
WHERE schemaname = 'public'
  AND viewname IN ('conversations_with_stats', 'scraped_pages_with_mapping', 'telemetry_stats');
```

Expected: 3 views found

**Test Brand-Agnostic Domain Mapping:**
```sql
-- Should work for ANY customer, not just Thompson's
SELECT
  prod_domain.domain as production,
  staging_domain.domain as staging,
  COUNT(*) as mapped_pages
FROM scraped_pages_with_mapping spm
INNER JOIN domain_mappings dm ON dm.staging_domain_id = spm.domain_id
INNER JOIN domains prod_domain ON prod_domain.id = dm.production_domain_id
INNER JOIN domains staging_domain ON staging_domain.id = dm.staging_domain_id
GROUP BY prod_domain.domain, staging_domain.domain;
```

---

### Step 3: Function Search Path Migration (28 functions)

**Apply search_path security fix:**
```sql
-- Copy entire contents of:
-- supabase/migrations/20251108000000_fix_mutable_search_path_security.sql
-- Paste and run
```

**Verify Functions Fixed:**
```sql
SELECT
  routine_name,
  routine_definition
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_type = 'FUNCTION'
  AND routine_definition LIKE '%SET search_path%'
LIMIT 5;
```

Expected: Should see `SET search_path = public` in definitions

---

## Part 2: Enable Auto-Refresh (5 minutes)

### Step 1: Restart Server

The auto-refresh scheduler is now wired into `server.ts` and will start automatically.

**Development:**
```bash
# Stop current server (Ctrl+C)
npm run dev:ws

# You should see:
# > Scheduled content refresh initialized
# > Scheduled reports initialized
```

**Production:**
```bash
npm run start:ws
```

### Step 2: Verify Scheduler is Running

```bash
# Check server logs for:
[Content Refresh] Initializing daily refresh job...
[Content Refresh] Schedule: 0 2 * * * (2 AM UTC daily)
[Content Refresh] Interval: 24 hours
[Content Refresh] Max pages per domain: 50
[Content Refresh] ✅ Scheduler initialized
```

### Step 3: Test Manual Refresh (Optional)

```bash
# Trigger immediate refresh (doesn't wait for 2 AM)
curl -X GET "http://localhost:3000/api/cron/refresh" \
  -H "Authorization: Bearer $(grep CRON_SECRET .env.local | cut -d'=' -f2)"
```

Expected response:
```json
{
  "success": true,
  "domainsProcessed": 1,
  "totalPagesRefreshed": 50,
  "results": [...]
}
```

---

## Part 3: Verification (10 minutes)

### Security Check

```bash
npx tsx scripts/database/check-db-health.ts
```

Expected output:
```
🔍 Database Health Check
============================================================

📊 Table Row Counts:
  ✓  conversations: 2,394 rows
  ✓  messages: 6,939 rows
  ✓  scraped_pages: 8,980 rows
  ✓  page_embeddings: 20,227 rows
  ✓  customer_configs: 5 rows

👥 Customer Configurations:
  ✓  5 customer(s) configured
```

### Auto-Refresh Check

**Check next scheduled run:**

The scheduler runs daily at **2:00 AM UTC**. To see it in action:

**Option A: Wait for 2 AM UTC**
- Check logs the next morning for:
  ```
  [Content Refresh] Starting scheduled refresh...
  [Content Refresh] ✅ Completed successfully
  [Content Refresh] Domains processed: X
  [Content Refresh] Pages refreshed: Y
  ```

**Option B: Change schedule for testing**

Edit `lib/cron/scheduled-content-refresh.ts`:
```typescript
// Change from daily at 2 AM:
const CRON_SCHEDULE = '0 2 * * *';

// To every 5 minutes (for testing only!):
const CRON_SCHEDULE = '*/5 * * * *';
```

Restart server and wait 5 minutes. **Remember to change it back!**

---

## Monitoring

### Check Refresh History

```sql
SELECT
  domain_id,
  job_type,
  status,
  stats,
  started_at,
  completed_at
FROM content_refresh_jobs
ORDER BY created_at DESC
LIMIT 10;
```

### Check Content Freshness

```sql
SELECT
  COUNT(*) FILTER (WHERE updated_at > NOW() - INTERVAL '7 days') as fresh_pages,
  COUNT(*) FILTER (WHERE updated_at < NOW() - INTERVAL '7 days') as stale_pages,
  COUNT(*) as total_pages
FROM scraped_pages;
```

### Monitor Scheduler Status

Add to your monitoring dashboard:
```typescript
import { getRefreshStatus } from '@/lib/cron/scheduled-content-refresh';

const status = getRefreshStatus();
console.log('Refresh Status:', status);
// {
//   isRunning: true,
//   schedule: '0 2 * * *',
//   intervalHours: 24,
//   maxPagesPerDomain: 50
// }
```

---

## What Happens Now

### Security

✅ **3 Tables Protected**: widget_config_versions, domain_mappings, demo_sessions now have RLS  
✅ **Views Secured**: No more SECURITY DEFINER bypass  
✅ **Brand-Agnostic**: Works for ANY customer, not just Thompson's  
✅ **28 Functions Protected**: Fixed search_path SQL injection risk  

### Auto-Refresh

✅ **Daily Refresh**: Runs every day at 2 AM UTC  
✅ **Smart Detection**: Only updates changed content (SHA-256 hashing)  
✅ **Batch Processing**: 50 pages per domain, 5 concurrent  
✅ **Error Resilient**: Failed pages don't block others  

### Expected Results

**After 24 hours:**
- Fresh data: 90%+ of pages updated within 24h
- Stale data: <500 pages older than 24h
- Errors: <5% failure rate (logged for review)

**After 7 days:**
- Fresh data: 99%+ of pages updated within 7 days
- Embeddings: Auto-regenerated for changed content
- Chat accuracy: Improved product info, pricing, availability

---

## Troubleshooting

### Scheduler Not Starting

**Check logs for errors:**
```bash
npm run dev:ws 2>&1 | grep -i "content refresh"
```

**Common issues:**
- `CRON_SECRET` not set → Add to `.env.local`
- Import errors → Check TypeScript compilation
- Port already in use → Kill existing process

### Refresh Job Failing

**Check error logs:**
```sql
SELECT error, started_at
FROM content_refresh_jobs
WHERE status = 'failed'
ORDER BY created_at DESC
LIMIT 5;
```

**Common issues:**
- Rate limiting → Increase batch delay
- Supabase connection → Check service role key
- Network timeout → Increase timeout in crawler config

### Pages Not Refreshing

**Debug checklist:**
1. Is scheduler running? Check logs
2. Is job executing? Check `content_refresh_jobs` table
3. Is content changing? Check `content_hash` values
4. Are embeddings updating? Check `page_embeddings.created_at`

---

## Rollback (If Needed)

### Disable Auto-Refresh

**Option 1: Comment out initialization**
```typescript
// server.ts
// initializeContentRefresh();
```

**Option 2: Stop in running process**
```typescript
import { stopContentRefresh } from '@/lib/cron/scheduled-content-refresh';
stopContentRefresh();
```

### Rollback Security Migrations

See rollback SQL in migration files (all include `DROP POLICY IF EXISTS`)

---

## Success Criteria

✅ Security advisor shows 0 RLS warnings  
✅ Security advisor shows 0 security definer view warnings  
✅ Security advisor shows 0 (or <3) search_path warnings  
✅ Scheduler logs show successful initialization  
✅ Manual refresh works (returns 200 with results)  
✅ After 24h: <500 stale pages  
✅ After 7 days: <100 stale pages  

---

## Next Steps

1. **Monitor first refresh** (tonight at 2 AM UTC)
2. **Review refresh logs** (check for errors)
3. **Adjust schedule if needed** (daily vs. twice daily)
4. **Add alerting** (notify on failed refreshes)
5. **Build dashboard** (show refresh status to users)

---

**Complete Analysis**: [ANALYSIS_SUPABASE_SECURITY_FIX_2025_11_08.md](../10-ANALYSIS/ANALYSIS_SUPABASE_SECURITY_FIX_2025_11_08.md)
