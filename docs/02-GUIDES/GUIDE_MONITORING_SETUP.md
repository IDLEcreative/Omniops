# Monitoring & Alerting Setup Guide

This guide walks you through setting up the complete monitoring and alerting system for the Omniops application.

## Overview

The monitoring system consists of:
- **Telemetry Monitoring**: Tracks chat usage, token consumption, and response times
- **GDPR Audit Monitoring**: Ensures privacy compliance and audit trail integrity
- **Alert System**: Sends notifications to Slack/Discord when issues occur
- **Nightly Workflow**: Automated GitHub Actions for continuous validation

## Prerequisites

- Node.js 20+ installed
- Access to Supabase project credentials
- GitHub repository access for Actions
- (Optional) Slack/Discord webhook for alerts

## Step 1: Local Environment Setup

### 1.1 Configure Environment Variables

Add these to your `.env.local` file:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Duplicate for monitoring scripts (required)
SUPABASE_URL=https://your-project.supabase.co

# Alert Webhook (optional but recommended)
MONITOR_ALERT_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
```

### 1.2 Test Webhook Options

You have several options for the webhook URL:

#### Option A: Slack Webhook
1. Go to your Slack workspace → Apps → Incoming Webhooks
2. Create a new webhook for your monitoring channel
3. Copy the webhook URL

#### Option B: Discord Webhook
1. Go to your Discord server → Settings → Integrations → Webhooks
2. Create a new webhook
3. Copy the webhook URL

#### Option C: Test Webhook (for development)
1. Visit https://webhook.site
2. Copy your unique URL
3. Use this for testing without a real chat platform

## Step 2: GitHub Secrets Configuration

Configure secrets for the GitHub Actions workflow:

```bash
# Using GitHub CLI
gh secret set SUPABASE_URL --body "https://your-project.supabase.co"
gh secret set SUPABASE_SERVICE_ROLE_KEY --body "your-service-role-key"
gh secret set MONITOR_ALERT_WEBHOOK_URL --body "your-webhook-url"
gh secret set DATABASE_URL --body "postgresql://..." # Optional

# Or use the GitHub web interface:
# 1. Go to Settings → Secrets and variables → Actions
# 2. Click "New repository secret"
# 3. Add each secret listed above
```

## Step 3: Database Setup

Ensure all required migrations are applied:

```bash
# Check migration status
npx supabase migration list

# Required migrations for monitoring:
# - 20251020_chat_telemetry_rollups.sql
# - 20251020_create_gdpr_audit_log.sql
# - 20251021_gdpr_audit_retention.sql
```

## Step 4: Validate Setup

Run the validation script to check all components:

```bash
# Run validation
npx tsx scripts/validate-monitoring.ts

# Expected output:
# ✅ SUPABASE_URL configured
# ✅ SUPABASE_SERVICE_ROLE_KEY configured
# ✅ MONITOR_ALERT_WEBHOOK_URL configured
# ✅ All database tables exist
# ✅ Alert system functional
# ✅ GitHub workflow configured
```

## Step 5: Test Monitoring Scripts

Test each monitoring script locally:

```bash
# Test telemetry monitoring
npm run monitor:telemetry

# Test GDPR audit monitoring
npm run monitor:gdpr

# Test alert dispatch (requires webhook)
npx tsx scripts/notify-monitor-failure.ts
```

## Step 6: Test GitHub Workflow

Manually trigger the nightly workflow:

```bash
# Trigger workflow
gh workflow run "Nightly Telemetry & GDPR Validation"

# Check status
gh run list --workflow="Nightly Telemetry & GDPR Validation"

# View logs
gh run view --log
```

## Step 7: Schedule Configuration

The workflow runs automatically via cron schedule:

```yaml
# .github/workflows/nightly-telemetry-gdpr.yml
on:
  schedule:
    - cron: '0 5 * * *'  # Daily at 5 AM UTC
```

## Monitoring Components

### Telemetry Rollup Monitor
- **Script**: `scripts/monitor-telemetry-rollups.ts`
- **Checks**:
  - Hourly rollups (90-minute threshold)
  - Daily rollups (24-hour threshold)
  - Domain-specific rollups
  - Model-specific rollups
- **Alerts on**: Stale or missing rollup data

### GDPR Audit Monitor
- **Script**: `scripts/monitor-gdpr-audit.ts`
- **Checks**:
  - Recent audit log entries
  - Entry age validation (24-hour threshold)
- **Alerts on**: Missing or stale audit entries

### Alert System
- **Handler**: `lib/alerts/notify.ts`
- **Features**:
  - Slack-formatted messages
  - Severity levels (error, warning, info)
  - Contextual data in alerts
  - Graceful fallback when webhook not configured

## Available NPM Scripts

```json
{
  "monitor:telemetry": "tsx scripts/monitor-telemetry-rollups.ts",
  "monitor:gdpr": "tsx scripts/monitor-gdpr-audit.ts",
  "test:telemetry-smoke": "playwright test telemetry-smoke.spec.ts",
  "test:gdpr-smoke": "playwright test gdpr-privacy.spec.ts",
  "seed:dashboard": "bash ./scripts/apply-dashboard-seed.sh",
  "backfill:gdpr": "tsx scripts/backfill-gdpr-audit.ts"
}
```

## Troubleshooting

### Issue: Monitors fail with "SUPABASE_URL not configured"
**Solution**: Ensure both `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_URL` are in `.env.local`

### Issue: Alerts not being received
**Solution**:
1. Check `MONITOR_ALERT_WEBHOOK_URL` is configured
2. Test webhook URL manually with curl
3. Check webhook destination for test messages

### Issue: GitHub workflow fails
**Solution**:
1. Verify all secrets are configured in GitHub
2. Check workflow permissions in repository settings
3. Review workflow logs for specific errors

### Issue: Rollup data is stale
**Solution**:
1. Check if cron jobs are enabled in Supabase
2. Verify `pg_cron` extension is installed
3. Manually trigger rollup refresh function

## Security Considerations

1. **Service Role Key**: Never commit to version control
2. **Webhook URLs**: Keep private to prevent spam
3. **GitHub Secrets**: Use repository secrets, not organization
4. **Database Access**: Use RLS policies for data protection

## Support

For issues or questions:
1. Check the runbooks:
   - `docs/TELEMETRY_NIGHTLY_RUNBOOK.md`
   - `docs/GDPR_AUDIT_RUNBOOK.md`
2. Review workflow logs in GitHub Actions
3. Test components individually using validation scripts