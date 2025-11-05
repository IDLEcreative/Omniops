# Telemetry Data Maintenance Guide

**Type:** Guide
**Status:** Active
**Last Updated:** 2025-11-05
**Verified For:** v0.1.0
**Dependencies:** None
**Estimated Read Time:** 8 minutes

## Purpose

This guide explains how to manage and maintain the `lookup_failures` telemetry table to prevent unbounded growth and optimize storage costs. It covers manual cleanup, automated scheduling, and monitoring strategies.

## Quick Links

- [Database Schema Reference](../03-REFERENCE/REFERENCE_DATABASE_SCHEMA.md)
- [Performance Optimization Guide](../03-REFERENCE/REFERENCE_PERFORMANCE_OPTIMIZATION.md)

## Table of Contents

- [Overview](#overview)
- [Manual Cleanup](#manual-cleanup)
- [Automated Cleanup](#automated-cleanup)
- [Monitoring](#monitoring)
- [Retention Policies](#retention-policies)
- [Troubleshooting](#troubleshooting)

---

## Overview

The `lookup_failures` table stores telemetry data about failed lookups in the system. Without regular maintenance, this table will grow unbounded, impacting:

- **Storage costs** - Telemetry can consume significant database storage
- **Query performance** - Large tables slow down reads and writes
- **Backup times** - Larger databases take longer to backup
- **Index maintenance** - Index updates become slower

**Solution:** Implement automated cleanup with configurable retention periods.

### Why Telemetry Cleanup Matters

**Example Growth:**
- 100 failures/day = 36,500 records/year
- 1,000 failures/day = 365,000 records/year
- At ~500 bytes/record, 1M records = ~500 MB of storage

**Recommended Retention:** 90 days (balances debugging needs with storage efficiency)

---

## Manual Cleanup

### Using the TypeScript Cleanup Script

**Location:** `scripts/maintenance/cleanup-old-telemetry.ts`

#### Basic Usage

```bash
# Dry run - see what would be deleted without actually deleting
npx tsx scripts/maintenance/cleanup-old-telemetry.ts --dry-run

# Delete records older than 90 days (default)
npx tsx scripts/maintenance/cleanup-old-telemetry.ts

# Delete records older than 30 days
npx tsx scripts/maintenance/cleanup-old-telemetry.ts --days=30

# Verbose mode with custom batch size
npx tsx scripts/maintenance/cleanup-old-telemetry.ts --days=60 --batch-size=500 --verbose
```

#### Command Options

| Option | Description | Default |
|--------|-------------|---------|
| `--dry-run` | Show what would be deleted without deleting | false |
| `--days=N` | Retention period in days | 90 |
| `--batch-size=N` | Records to delete per batch (1-10000) | 1000 |
| `--verbose` | Show detailed progress | false |

#### Example Output

```
🗑️  Telemetry Cleanup Tool

🔍 Cleanup Configuration:
   Retention period: 90 days
   Cutoff date: 2024-08-07T12:00:00.000Z
   Batch size: 1000
   Mode: LIVE

📊 Found 5,432 records to delete

🔄 Processing batch 1/6...
   ✅ Deleted 1000 records (total: 1000)

✅ Cleanup complete!
   Records deleted: 5,432
   Batches processed: 6
   Duration: 2.34s
   Date range: 2024-01-01T00:00:00Z to 2024-08-07T11:59:59Z
```

### Using the SQL Function

**Location:** `scripts/database/create-telemetry-cleanup-function.sql`

#### Installation

```bash
# Execute the SQL file to create the function
psql -h <host> -U <user> -d <database> -f scripts/database/create-telemetry-cleanup-function.sql

# Or via Supabase dashboard:
# 1. Navigate to SQL Editor
# 2. Copy contents of create-telemetry-cleanup-function.sql
# 3. Execute
```

#### Usage

```sql
-- Delete records older than 90 days (default)
SELECT * FROM cleanup_old_telemetry();

-- Delete records older than 30 days
SELECT * FROM cleanup_old_telemetry(30);

-- View telemetry statistics
SELECT * FROM telemetry_stats;
```

#### Function Output

```
deleted_count | oldest_deleted           | newest_deleted           | execution_time_ms
--------------|--------------------------|--------------------------|-----------------
5432          | 2024-01-01T00:00:00+00   | 2024-08-07T11:59:59+00   | 523
```

---

## Automated Cleanup

### Using Supabase Edge Functions (Recommended)

**Location:** `supabase/functions/cleanup-telemetry/`

#### Deployment Steps

1. **Deploy the Edge Function**

```bash
# Deploy to Supabase
supabase functions deploy cleanup-telemetry

# Verify deployment
supabase functions list
```

2. **Configure Cron Schedule**

The function is configured in `cron.yaml` to run every Sunday at 2 AM UTC:

```yaml
- name: "cleanup-old-telemetry-data"
  schedule: "0 2 * * 0"  # Every Sunday at 2:00 AM UTC
  function: "cleanup-telemetry"
  timeout: 30
```

3. **Enable Cron in Supabase Dashboard**

- Navigate to Edge Functions > Cron Jobs
- Ensure the cleanup job is enabled
- View execution history

#### Manual Testing

```bash
# Invoke the function manually
curl -X POST https://<project-ref>.supabase.co/functions/v1/cleanup-telemetry \
  -H "Authorization: Bearer <anon-key>" \
  -H "Content-Type: application/json" \
  -d '{"retentionDays": 90}'
```

#### Expected Response

```json
{
  "success": true,
  "deletedCount": 5432,
  "oldestDeleted": "2024-01-01T00:00:00Z",
  "newestDeleted": "2024-08-07T11:59:59Z",
  "executionTimeMs": 523,
  "retentionDays": 90
}
```

### Alternative: Cron Job on Server

If not using Supabase Edge Functions, set up a cron job on your server:

```bash
# Add to crontab (every Sunday at 2 AM)
0 2 * * 0 cd /path/to/project && npx tsx scripts/maintenance/cleanup-old-telemetry.ts --days=90 >> /var/log/telemetry-cleanup.log 2>&1
```

---

## Monitoring

### Storage Statistics Script

**Location:** `scripts/monitoring/telemetry-storage-stats.ts`

#### Usage

```bash
npx tsx scripts/monitoring/telemetry-storage-stats.ts
```

#### Example Output

```
📊 Telemetry Storage Statistics

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
OVERVIEW
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Total Records:        45,678
Table Size:           23.4 MB
Oldest Record:        2024-01-15 (294 days ago)
Newest Record:        2024-11-05 (0 days ago)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
GROWTH METRICS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Records/Day:          155
Records/Week:         1,085
Records/Month:        4,650
Projected (90 days):  13,950

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
AGE DISTRIBUTION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
0-7 days        ████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ 15.2% (6,943)
8-30 days       ████████████░░░░░░░░░░░░░░░░░░░░░░░░░░ 23.8% (10,871)
31-90 days      ████████████████████░░░░░░░░░░░░░░░░░░ 39.1% (17,860)
91-180 days     ████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ 16.4% (7,491)
181-365 days    ██░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  5.5% (2,513)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CLEANUP RECOMMENDATIONS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Option 1: 90-day retention (MEDIUM priority)
  Records to delete:  10,004
  Space saved:        5.1 MB
  Run frequency:      Weekly

Option 2: 60-day retention (MEDIUM priority)
  Records to delete:  17,860
  Space saved:        9.2 MB
  Run frequency:      Weekly

Option 3: 30-day retention (LOW priority)
  Records to delete:  28,731
  Space saved:        14.7 MB
  Run frequency:      Daily

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
RECOMMENDED ACTION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Test cleanup (dry run):
  npx tsx scripts/maintenance/cleanup-old-telemetry.ts --dry-run --days=90

Run cleanup:
  npx tsx scripts/maintenance/cleanup-old-telemetry.ts --days=90

Schedule automated cleanup:
  Deploy Supabase edge function with weekly cron
```

### Database View

Query the `telemetry_stats` view directly:

```sql
-- Get current statistics
SELECT * FROM telemetry_stats;

-- Monitor growth over time (run weekly, save results)
SELECT
  CURRENT_DATE as check_date,
  total_records,
  table_size,
  records_last_7_days
FROM telemetry_stats;
```

---

## Retention Policies

### Recommended Retention Periods

| Use Case | Retention | Frequency | Rationale |
|----------|-----------|-----------|-----------|
| **Production (Default)** | 90 days | Weekly | Balances debugging needs with storage efficiency |
| **High-Volume Systems** | 60 days | Weekly | Reduces storage costs for systems with high failure rates |
| **Low-Volume Systems** | 180 days | Monthly | Can retain more history when storage impact is minimal |
| **Development/Staging** | 30 days | Daily | Short retention for testing environments |

### Choosing Your Retention Period

**Consider these factors:**

1. **Debugging Needs**
   - How far back do you typically need to investigate issues?
   - Most teams need 30-90 days of history

2. **Failure Rate**
   - High failure rate (1000+/day) → shorter retention (60 days)
   - Low failure rate (<100/day) → longer retention (180 days)

3. **Storage Costs**
   - Monitor table size growth
   - Calculate cost of storage vs. value of historical data

4. **Compliance Requirements**
   - Some industries require specific retention periods
   - Ensure policy meets regulatory needs

### Adjusting Retention

**For TypeScript Script:**
```bash
npx tsx scripts/maintenance/cleanup-old-telemetry.ts --days=60
```

**For Edge Function:**
```bash
# Update the function and redeploy
# Edit supabase/functions/cleanup-telemetry/index.ts
# Change: let retentionDays = 60;
supabase functions deploy cleanup-telemetry
```

**For SQL Function:**
```sql
SELECT * FROM cleanup_old_telemetry(60);
```

---

## Troubleshooting

### Issue: Cleanup Script Times Out

**Symptoms:**
- Script runs for >5 minutes
- "Connection timeout" errors

**Solutions:**
1. Reduce batch size:
   ```bash
   npx tsx scripts/maintenance/cleanup-old-telemetry.ts --batch-size=500
   ```

2. Increase connection timeout in `lib/supabase-server.ts`

3. Run cleanup during low-traffic periods

### Issue: Edge Function Fails with Timeout

**Symptoms:**
- Edge function logs show timeout errors
- Cleanup never completes

**Solutions:**
1. Increase function timeout in `cron.yaml`:
   ```yaml
   timeout: 60  # Increase from 30 to 60 seconds
   ```

2. Use SQL function instead (no timeout limit):
   ```sql
   SELECT * FROM cleanup_old_telemetry(90);
   ```

### Issue: Records Not Being Deleted

**Symptoms:**
- Dry run shows records to delete
- Live run deletes 0 records

**Possible Causes:**

1. **Permissions Issue**
   ```sql
   -- Check if service role has permission
   SELECT has_table_privilege('service_role', 'lookup_failures', 'DELETE');
   ```

2. **RLS Policies**
   ```sql
   -- Check RLS policies (should allow service role)
   SELECT * FROM pg_policies WHERE tablename = 'lookup_failures';
   ```

3. **Wrong Timestamp Format**
   - Ensure timestamps are stored as `timestamptz`
   - Check timezone handling

### Issue: High Memory Usage During Cleanup

**Symptoms:**
- Server memory spikes during cleanup
- Out of memory errors

**Solutions:**
1. Reduce batch size:
   ```bash
   npx tsx scripts/maintenance/cleanup-old-telemetry.ts --batch-size=100
   ```

2. Add delay between batches (edit script):
   ```typescript
   await new Promise(resolve => setTimeout(resolve, 500)); // 500ms delay
   ```

### Issue: Cannot Create SQL Function

**Symptoms:**
- Permission denied errors
- Function doesn't appear in database

**Solutions:**
1. Ensure you're connected as superuser or service_role

2. Check if function already exists:
   ```sql
   DROP FUNCTION IF EXISTS cleanup_old_telemetry(INTEGER);
   ```

3. Run via Supabase dashboard SQL Editor (has proper permissions)

---

## Best Practices

1. **Always test with dry run first**
   ```bash
   npx tsx scripts/maintenance/cleanup-old-telemetry.ts --dry-run
   ```

2. **Monitor storage before and after cleanup**
   ```bash
   # Before
   npx tsx scripts/monitoring/telemetry-storage-stats.ts
   # Run cleanup
   # After
   npx tsx scripts/monitoring/telemetry-storage-stats.ts
   ```

3. **Set up automated cleanup early**
   - Don't wait for storage issues
   - Configure cron job from day one

4. **Review retention policy quarterly**
   - Adjust based on actual usage patterns
   - Balance debugging needs with costs

5. **Keep cleanup logs**
   ```bash
   npx tsx scripts/maintenance/cleanup-old-telemetry.ts >> logs/cleanup.log 2>&1
   ```

6. **Alert on cleanup failures**
   - Monitor edge function execution
   - Alert if cleanup hasn't run in 2+ weeks

---

## Additional Resources

- [Supabase Edge Functions Documentation](https://supabase.com/docs/guides/functions)
- [PostgreSQL Cron Jobs](https://supabase.com/docs/guides/database/extensions/pg_cron)
- [Database Performance Optimization](../03-REFERENCE/REFERENCE_PERFORMANCE_OPTIMIZATION.md)
