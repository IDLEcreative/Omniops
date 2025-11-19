# Sentry Error Tracking Setup Guide

**Type:** Guide
**Status:** Active
**Last Updated:** 2025-11-18
**Verified For:** v0.1.0
**Dependencies:** None
**Estimated Read Time:** 10 minutes

## Purpose

Complete guide to setting up Sentry error tracking and performance monitoring for production error tracking, performance insights, and user experience monitoring.

## Quick Links

- [Sentry Integration Library](../../lib/monitoring/sentry.ts)
- [Example API Route](../../app/api/sentry-example-api/route.ts)
- [Official Sentry Docs](https://docs.sentry.io/)

## Table of Contents

- [Overview](#overview)
- [Account Setup](#account-setup)
- [Installation](#installation)
- [Configuration](#configuration)
- [Testing](#testing)
- [Dashboard Setup](#dashboard-setup)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

---

## Overview

Sentry provides:
- **Error Tracking**: Automatic capture of unhandled errors
- **Performance Monitoring**: Track slow API endpoints, database queries
- **Release Tracking**: Monitor deployments and regressions
- **User Context**: See which users are affected by errors
- **Breadcrumbs**: Understand the path leading to errors

## Account Setup

### 1. Create Sentry Account

1. Go to [sentry.io](https://sentry.io/)
2. Sign up with email or GitHub
3. Choose plan:
   - **Free**: 5,000 errors/month, 10K transactions/month
   - **Team**: $26/month - 50K errors, 100K transactions
   - **Business**: Custom pricing

### 2. Create Project

1. Click "Create Project"
2. Select platform: **Next.js**
3. Set alert frequency: **On every new issue**
4. Name your project: `omniops-production` (or your app name)
5. Click "Create Project"

### 3. Get DSN (Data Source Name)

1. Navigate to **Settings** → **Projects** → **[Your Project]**
2. Click **Client Keys (DSN)**
3. Copy the **DSN** - looks like:
   ```
   https://examplePublicKey@o0.ingest.sentry.io/0
   ```

## Installation

### 1. Install Sentry SDK

```bash
npm install --save @sentry/nextjs
```

### 2. Run Sentry Wizard (Optional)

```bash
npx @sentry/wizard@latest -i nextjs
```

This creates:
- `sentry.client.config.ts` - Client-side config
- `sentry.server.config.ts` - Server-side config
- `sentry.edge.config.ts` - Edge runtime config

### 3. Configure Environment Variables

Add to `.env.local`:

```bash
# Sentry Configuration
NEXT_PUBLIC_SENTRY_DSN=https://examplePublicKey@o0.ingest.sentry.io/0
SENTRY_ORG=your-organization-slug
SENTRY_PROJECT=your-project-slug
SENTRY_AUTH_TOKEN=your_sentry_auth_token_here
NEXT_PUBLIC_APP_VERSION=1.0.0
```

**Get Auth Token:**
1. Go to **Settings** → **Account** → **API** → **Auth Tokens**
2. Click "Create New Token"
3. Name: `omniops-releases`
4. Scopes: `project:releases`, `org:read`
5. Copy token

## Configuration

### Using Built-In Integration

Our codebase has Sentry pre-configured in `/lib/monitoring/sentry.ts`.

**No additional setup needed** - just set environment variables.

### Manual Configuration (if needed)

Create `sentry.client.config.ts`:

```typescript
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 0.1, // 10% of requests for performance
  environment: process.env.NODE_ENV,
  release: process.env.NEXT_PUBLIC_APP_VERSION,
});
```

Create `sentry.server.config.ts`:

```typescript
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 0.1,
  environment: process.env.NODE_ENV,
  release: process.env.NEXT_PUBLIC_APP_VERSION,
});
```

## Testing

### 1. Test Error Capture

Visit the example endpoint:

```bash
# Test successful request
curl http://localhost:3000/api/sentry-example-api?action=success

# Test error capture
curl http://localhost:3000/api/sentry-example-api?action=error

# Test message capture
curl http://localhost:3000/api/sentry-example-api?action=message
```

### 2. Verify in Sentry Dashboard

1. Go to your Sentry project
2. Click **Issues**
3. You should see: "This is a test error for Sentry tracking"
4. Click the error to see:
   - Stack trace
   - User context
   - Breadcrumbs
   - Request details

### 3. Test in Code

```typescript
import { captureError, captureMessage } from '@/lib/monitoring/sentry';

try {
  throw new Error('Test error');
} catch (error) {
  captureError(error, { context: 'testing' });
}

captureMessage('Test message', 'info', { user: 'test@example.com' });
```

## Dashboard Setup

### Configure Alerts

1. Go to **Alerts** → **Create Alert**
2. Choose alert type:
   - **Issues**: When new errors occur
   - **Metric Alert**: When error rate exceeds threshold
   - **Crash Free Session Rate**: When app crashes
3. Set conditions:
   - Trigger: Error count > 10 in 1 hour
   - Environment: production
4. Choose notification channel:
   - Email
   - Slack (recommended)
   - PagerDuty
   - Discord
5. Save alert

### Slack Integration

1. Go to **Settings** → **Integrations**
2. Find **Slack** → Click "Add to Slack"
3. Authorize Sentry
4. Choose channel: `#alerts` or `#errors`
5. Test integration

### Create Dashboard

1. Go to **Dashboards** → **Create Dashboard**
2. Add widgets:
   - **Error Rate**: Line chart of errors over time
   - **Top 5 Errors**: Most frequent errors
   - **Performance**: API response times
   - **User Impact**: Affected users count
3. Save dashboard
4. Set as default (optional)

## Best Practices

### 1. Set User Context

```typescript
import { setUserContext } from '@/lib/monitoring/sentry';

setUserContext({
  id: user.id,
  email: user.email,
  domain: customer.domain,
});
```

### 2. Add Breadcrumbs

```typescript
import { addBreadcrumb } from '@/lib/monitoring/sentry';

addBreadcrumb('User clicked checkout', {
  cartTotal: 99.99,
  itemCount: 3,
});
```

### 3. Track Performance

```typescript
import { startTransaction } from '@/lib/monitoring/sentry';

const transaction = startTransaction('process-order', 'task');
try {
  await processOrder();
  transaction?.setStatus('ok');
} catch (error) {
  transaction?.setStatus('internal_error');
  throw error;
} finally {
  transaction?.finish();
}
```

### 4. Filter Sensitive Data

Already configured in `lib/monitoring/sentry.ts`:
- Removes cookies
- Removes authorization headers
- Scrubs PII from request data

### 5. Use Environment Tags

```typescript
import { setTags } from '@/lib/monitoring/sentry';

setTags({
  feature: 'checkout',
  version: '2.0',
  region: 'us-east-1',
});
```

## Troubleshooting

### Errors Not Appearing

1. **Check DSN**: Verify `NEXT_PUBLIC_SENTRY_DSN` is set
2. **Check environment**: Sentry only captures in production by default
3. **Check filters**: Some errors may be filtered (see `ignoreErrors` in config)
4. **Check rate limits**: Free tier has limits (5K errors/month)

### Source Maps Not Working

1. **Set auth token**: `SENTRY_AUTH_TOKEN` required for uploads
2. **Build with source maps**:
   ```bash
   npm run build
   ```
3. **Verify upload**: Check build logs for "Sentry source maps uploaded"

### Performance Not Showing

1. **Check sample rate**: `tracesSampleRate: 0.1` means 10% of requests
2. **Increase sample rate** (development only):
   ```typescript
   tracesSampleRate: 1.0 // 100%
   ```
3. **Verify plan**: Performance monitoring requires Team plan or higher

### Too Many Alerts

1. **Adjust alert conditions**: Increase threshold
2. **Add filters**: Only alert on critical errors
3. **Mute noisy errors**: Go to issue → "Ignore" or "Resolve"

## Next Steps

- [Configure Uptime Monitoring](./GUIDE_UPTIME_MONITORING.md)
- [Set Up Alerting](./GUIDE_ALERTING.md)
- [Configure Log Aggregation](./GUIDE_LOG_AGGREGATION.md)

## Resources

- [Sentry Next.js Docs](https://docs.sentry.io/platforms/javascript/guides/nextjs/)
- [Performance Monitoring](https://docs.sentry.io/product/performance/)
- [Release Tracking](https://docs.sentry.io/product/releases/)
- [Integration Directory](https://docs.sentry.io/product/integrations/)
