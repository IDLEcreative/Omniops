# Supabase Webhook Configuration for Automatic Scraping

**Type:** Setup
**Status:** Active
**Last Updated:** 2025-10-29
**Verified For:** v0.1.0
**Estimated Read Time:** 16 minutes

## Purpose
This document provides step-by-step instructions for setting up Supabase webhooks to enable automatic scraping when domains are added or modified.

## Quick Links
- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Step 1: Database Setup (Already Completed)](#step-1-database-setup-already-completed)
- [Step 2: Configure Environment Variables](#step-2-configure-environment-variables)
- [Step 3: Create Supabase Webhooks](#step-3-create-supabase-webhooks)

## Keywords
configuration, configure, create, database, environment, functionality, next, overview, prerequisites, production

---


This document provides step-by-step instructions for setting up Supabase webhooks to enable automatic scraping when domains are added or modified.

## Overview

The system includes:
- Database triggers that create scraping jobs automatically
- A webhook endpoint that processes these jobs
- Supabase webhook configuration to notify the endpoint

## Prerequisites

- Supabase project: `birugqyuqhiahxvxeyqg`
- Access to Supabase dashboard
- Application deployed with webhook endpoint accessible

## Step 1: Database Setup (Already Completed)

The following database objects have been created:
- ✅ `scrape_jobs` table for tracking scraping jobs
- ✅ Trigger functions for automatic job creation
- ✅ Triggers on `customer_configs` and `domains` tables

## Step 2: Configure Environment Variables

Add the following environment variables to your application:

```env
# Optional: Webhook signature verification
SUPABASE_WEBHOOK_SECRET=your_webhook_secret_here
```

## Step 3: Create Supabase Webhooks

### Option A: Using Supabase CLI (Recommended)

1. Install Supabase CLI if not already installed:
```bash
npm install -g supabase
```

2. Login to Supabase:
```bash
supabase login
```

3. Link to your project:
```bash
supabase link --project-ref birugqyuqhiahxvxeyqg
```

4. Create webhook for customer_configs table:
```bash
supabase functions deploy --project-ref birugqyuqhiahxvxeyqg
```

### Option B: Using Supabase Dashboard

1. Navigate to [Supabase Dashboard](https://supabase.com/dashboard/project/birugqyuqhiahxvxeyqg)

2. Go to **Database** → **Webhooks** in the left sidebar

3. Click **Create a new hook**

#### Webhook 1: Customer Configs Changes

**Configuration:**
- **Name:** `customer-configs-scraping`
- **Table:** `customer_configs`
- **Events:** `Insert`, `Update`
- **Condition:** Leave empty (all changes)
- **URL:** `https://your-domain.com/api/webhooks/customer`
- **HTTP Method:** `POST`
- **HTTP Headers:**
  ```json
  {
    "Content-Type": "application/json",
    "x-webhook-source": "customer-configs"
  }
  ```

#### Webhook 2: Domains Changes

**Configuration:**
- **Name:** `domains-scraping`
- **Table:** `domains`
- **Events:** `Insert`, `Update`
- **Condition:** Leave empty (all changes)
- **URL:** `https://your-domain.com/api/webhooks/customer`
- **HTTP Method:** `POST`
- **HTTP Headers:**
  ```json
  {
    "Content-Type": "application/json",
    "x-webhook-source": "domains"
  }
  ```

#### Webhook 3: Scrape Jobs Notifications (Optional)

**Configuration:**
- **Name:** `scrape-jobs-notifications`
- **Table:** `scrape_jobs`
- **Events:** `Insert`
- **Condition:** `status = 'pending'`
- **URL:** `https://your-domain.com/api/webhooks/customer`
- **HTTP Method:** `POST`
- **HTTP Headers:**
  ```json
  {
    "Content-Type": "application/json",
    "x-webhook-source": "scrape-jobs"
  }
  ```

## Step 4: Test Webhook Configuration

### Test 1: Add New Domain to Customer Config

```sql
-- Run in Supabase SQL Editor
INSERT INTO customer_configs (domain, business_name, active)
VALUES ('test-domain.com', 'Test Business', true);
```

**Expected Result:**
- Trigger creates entry in `scrape_jobs` table
- Webhook fires to `/api/webhooks/customer`
- Job is processed (or queued)

### Test 2: Update Domain in Customer Config

```sql
-- Run in Supabase SQL Editor
UPDATE customer_configs 
SET domain = 'updated-domain.com' 
WHERE domain = 'test-domain.com';
```

**Expected Result:**
- Trigger creates new entry in `scrape_jobs` table
- Webhook fires with updated domain
- New scraping job is queued

### Test 3: Manual Job Creation

```sql
-- Test the helper function
SELECT create_manual_scrape_job(
  'manual-test.com',
  'domain_scrape',
  8,
  '{"test": true}'::jsonb,
  '{"manual_test": true}'::jsonb
);
```

## Step 5: Verify Webhook Functionality

### Check Webhook Logs

1. Go to **Database** → **Webhooks** in Supabase Dashboard
2. Click on your webhook
3. View the **Logs** tab to see recent deliveries

### Check Application Logs

Monitor your application logs for webhook processing:
```bash
# For development
npm run dev

# Check logs for webhook entries
grep "webhook" your-app.log
```

### Verify Database State

```sql
-- Check recent scrape jobs
SELECT 
  id,
  domain,
  status,
  job_type,
  priority,
  created_at,
  metadata
FROM scrape_jobs 
ORDER BY created_at DESC 
LIMIT 10;

-- Check jobs by status
SELECT status, COUNT(*) 
FROM scrape_jobs 
GROUP BY status;
```

## Step 6: Production Configuration

### Security Considerations

1. **Enable Webhook Signatures:**
   - Add `SUPABASE_WEBHOOK_SECRET` to environment
   - Implement signature verification in webhook handler

2. **Rate Limiting:**
   - Configure rate limits on webhook endpoint
   - Implement retry logic with exponential backoff

3. **Monitoring:**
   - Set up monitoring for webhook failures
   - Monitor scrape job queue length
   - Alert on repeated failures

### Performance Optimization

1. **Webhook Processing:**
   - Process webhooks asynchronously
   - Use proper queue system (Redis, AWS SQS)
   - Implement proper error handling

2. **Database Performance:**
   - Monitor trigger performance
   - Ensure indexes are optimal
   - Consider archiving old jobs

## Troubleshooting

### Common Issues

1. **Webhook Not Firing:**
   - Check webhook URL is accessible
   - Verify table and event configuration
   - Check Supabase webhook logs

2. **Jobs Not Being Created:**
   - Check trigger function logs
   - Verify domain names are valid
   - Check for duplicate jobs constraint

3. **High Volume Issues:**
   - Implement job batching
   - Use webhook delivery retry settings
   - Monitor queue performance

### Debug Commands

```sql
-- Check trigger functions
SELECT 
  trigger_name,
  event_manipulation,
  action_timing,
  action_statement
FROM information_schema.triggers 
WHERE trigger_schema = 'public';

-- Check recent database changes
SELECT 
  schemaname,
  tablename,
  attname,
  n_distinct,
  correlation
FROM pg_stats 
WHERE tablename IN ('customer_configs', 'domains', 'scrape_jobs');
```

### Webhook Testing Script

Create a test script to verify webhook functionality:

```bash
#!/bin/bash
# test-webhook.sh

echo "Testing webhook endpoint..."
curl -X POST https://your-domain.com/api/webhooks/customer \
  -H "Content-Type: application/json" \
  -d '{
    "event": "scrape_job_created",
    "job_id": "test-job-id",
    "domain": "test.com",
    "job_type": "domain_scrape",
    "status": "pending",
    "priority": 5,
    "created_at": "'$(date -u +%Y-%m-%dT%H:%M:%S.%3NZ)'",
    "metadata": {"test": true}
  }'
```

## Next Steps

1. ✅ Configure webhooks using the instructions above
2. ✅ Test with sample data
3. ⏳ Integrate with your scraping queue system
4. ⏳ Set up monitoring and alerting
5. ⏳ Deploy to production environment

## Support

For issues with webhook configuration:
1. Check Supabase webhook logs first
2. Verify application logs
3. Test with manual database changes
4. Contact support if issues persist

## Configuration Summary

| Component | Status | Configuration Required |
|-----------|---------|----------------------|
| Database Tables | ✅ Complete | None |
| Trigger Functions | ✅ Complete | None |
| Webhook Endpoint | ✅ Complete | Environment variables |
| Supabase Webhooks | ⏳ Manual Setup | Dashboard configuration |
| Queue Integration | ⏳ Pending | Queue system setup |
