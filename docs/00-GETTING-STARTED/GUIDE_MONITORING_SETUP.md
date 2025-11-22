# Monitoring Setup Guide

**Type:** Guide
**Status:** Active
**Last Updated:** 2025-11-22
**Verified For:** v0.1.0
**Dependencies:**
- [Docker Setup](SETUP_DOCKER_PRODUCTION.md)
- [Environment Setup](VERCEL_ENV_SETUP.md)

## Purpose
Complete guide to setting up production monitoring including Sentry error tracking, structured logging, and uptime monitoring for the Omniops application.

## Quick Links
- [Sentry Setup](#sentry-setup)
- [Environment Variables](#environment-variables)
- [Testing Integration](#testing-integration)
- [Uptime Monitoring](#uptime-monitoring)
- [Log Aggregation](#log-aggregation-optional)

## Table of Contents
- [Sentry Setup](#sentry-setup)
- [Environment Variables](#environment-variables)
- [Testing Integration](#testing-integration)
- [Uptime Monitoring](#uptime-monitoring)
- [Log Aggregation](#log-aggregation-optional)
- [Troubleshooting](#troubleshooting)

---

## Sentry Setup

Sentry provides real-time error tracking, performance monitoring, and user context for production applications.

### 1. Create Sentry Account

1. Visit [sentry.io](https://sentry.io)
2. Sign up for free account
3. Create new project:
   - Platform: **Next.js**
   - Project name: **omniops** (or your preferred name)
   - Alert frequency: **On every new issue**

### 2. Get Your DSN

After creating the project:

1. Navigate to **Settings** → **Projects** → **[Your Project]** → **Client Keys (DSN)**
2. Copy the DSN URL (format: `https://[key]@[region].ingest.sentry.io/[project-id]`)

### 3. Configure Environment Variables

Add to your `.env.local` (development) and Vercel environment variables (production):

```bash
# Sentry Configuration
NEXT_PUBLIC_SENTRY_DSN=https://your-key@region.ingest.sentry.io/project-id
SENTRY_ORG=your-org-name
SENTRY_PROJECT=omniops

# Optional: App version for release tracking
NEXT_PUBLIC_APP_VERSION=1.0.0
```

**Important Notes:**
- `NEXT_PUBLIC_SENTRY_DSN` must be public (client + server)
- `SENTRY_ORG` and `SENTRY_PROJECT` are for build-time source map uploads
- Without DSN, Sentry gracefully degrades (no errors)

### 4. Verify Installation

Sentry is already integrated into the application. Verify it's working:

```bash
# Start development server
npm run dev

# Check console for Sentry initialization
# Should see: "[Sentry] Error tracking initialized"
```

### 5. Configure Sentry Settings

In Sentry dashboard:

**Alerts:**
- Enable **Slack** or **Email** notifications
- Set threshold: Alert on **1st occurrence** of new issue

**Performance:**
- Enable **Performance Monitoring**
- Sample rate: **10%** (production), **100%** (development)

**Releases:**
- Enable **Release Tracking** to track deployments
- Sentry will auto-detect releases from `NEXT_PUBLIC_APP_VERSION`

---

## Environment Variables

Complete list of monitoring-related environment variables:

### Required (Production)

```bash
# Sentry Error Tracking
NEXT_PUBLIC_SENTRY_DSN=https://your-key@region.ingest.sentry.io/project-id

# Application Info
NEXT_PUBLIC_APP_URL=https://your-domain.com
NEXT_PUBLIC_APP_VERSION=1.0.0
NODE_ENV=production
```

### Optional (Enhanced Monitoring)

```bash
# Sentry Organization (for source maps)
SENTRY_ORG=your-org-name
SENTRY_PROJECT=omniops
SENTRY_AUTH_TOKEN=your-auth-token

# Log Aggregation (if using Logtail/Datadog)
LOGTAIL_SOURCE_TOKEN=your-logtail-token
```

### Development

```bash
# Development doesn't require Sentry
# Structured logging will use console output
NODE_ENV=development
```

---

## Testing Integration

### 1. Test Error Tracking

Create a test error to verify Sentry is capturing errors:

```bash
# Open browser DevTools console and run:
fetch('/api/sentry-test?action=error')
```

Alternatively, manually trigger an error:

```typescript
// In any component or API route
import { captureError } from '@/lib/monitoring/sentry';

captureError(new Error('Test error'), {
  userId: 'test-user',
  action: 'manual-test'
});
```

**Expected Result:**
- Error appears in Sentry dashboard within 1-2 minutes
- Email/Slack notification sent (if configured)

### 2. Test Health Check

```bash
# Test detailed health check endpoint
curl http://localhost:3000/api/health/detailed

# Expected response:
{
  "status": "healthy",
  "timestamp": "2025-11-22T12:00:00.000Z",
  "checks": {
    "database": { "status": "healthy", "latency": 45 },
    "redis": { "status": "healthy", "latency": 12 },
    "openai": { "status": "healthy", "latency": 234 }
  }
}
```

### 3. Test Structured Logging

Check logs are properly formatted:

```bash
# Development: JSON logs in console
npm run dev

# Production: JSON logs in Vercel/Docker logs
# Logs include: timestamp, level, message, context, metadata
```

**Example Log Output:**

```json
{
  "timestamp": "2025-11-22T12:00:00.000Z",
  "level": "info",
  "message": "User logged in",
  "context": { "userId": "123", "email": "user@example.com" },
  "metadata": {
    "environment": "production",
    "service": "omniops",
    "version": "1.0.0",
    "pid": 1234
  }
}
```

---

## Uptime Monitoring

Set up external uptime monitoring to track service availability.

### Recommended Services

**Free Tier Options:**
- [Better Uptime](https://betteruptime.com) - 10 monitors, 30-second checks
- [UptimeRobot](https://uptimerobot.com) - 50 monitors, 5-minute checks
- [Pingdom](https://www.pingdom.com) - 1 monitor

### Setup Better Uptime (Recommended)

1. **Create Account**: [betteruptime.com](https://betteruptime.com)

2. **Add Monitor**:
   - Name: **Omniops API**
   - URL: `https://your-domain.com/api/health/detailed`
   - Method: **GET**
   - Check frequency: **30 seconds**
   - Expected status code: **200**
   - Alert on: **Status code ≠ 200**

3. **Configure Alerts**:
   - Enable **Email** notifications
   - Enable **Slack** integration (optional)
   - Alert after: **1 failed check** (critical services)

4. **Add Multiple Monitors**:
   - Health Check: `/api/health/detailed`
   - Chat API: `/api/chat` (POST with test payload)
   - Scrape API: `/api/scrape?health=true`

### Health Check Interpretation

**Status Codes:**
- `200` - All services healthy
- `503` - One or more services unhealthy

**Response Format:**
```json
{
  "status": "healthy" | "degraded" | "unhealthy",
  "checks": {
    "database": { "status": "healthy", "latency": 45 },
    "redis": { "status": "healthy", "latency": 12 },
    "openai": { "status": "degraded", "latency": 2100 }
  }
}
```

**Alert Thresholds:**
- Database latency > 1000ms → Degraded
- Redis latency > 500ms → Degraded
- OpenAI latency > 2000ms → Degraded
- Any service status = "unhealthy" → Alert immediately

---

## Log Aggregation (Optional)

For advanced production deployments, aggregate logs from multiple sources.

### Logtail Setup (Recommended for Vercel)

1. **Create Account**: [logtail.com](https://logtail.com)

2. **Create Source**:
   - Source type: **HTTP**
   - Name: **Omniops Production**
   - Copy source token

3. **Add to Environment**:
   ```bash
   LOGTAIL_SOURCE_TOKEN=your-token-here
   ```

4. **Verify Logs**:
   - Logs appear in Logtail dashboard within seconds
   - Filter by level: `level:error`
   - Search by user: `context.userId:123`

### Alternative Options

**Datadog:**
- Best for enterprise
- Requires API key
- Advanced APM and tracing

**Axiom:**
- Fast, developer-friendly
- SQL-like query language
- Great for high-volume logs

**Elasticsearch + Kibana:**
- Self-hosted option
- Full control over data
- Requires infrastructure management

---

## Troubleshooting

### Sentry Not Capturing Errors

**Symptom**: Errors occur but don't appear in Sentry

**Solutions**:

1. **Check DSN Configuration**:
   ```bash
   # Verify NEXT_PUBLIC_SENTRY_DSN is set
   echo $NEXT_PUBLIC_SENTRY_DSN
   ```

2. **Check Browser Console**:
   - Look for "[Sentry] Error tracking initialized"
   - If not present, DSN is missing or invalid

3. **Verify Network Access**:
   ```bash
   # Test connectivity to Sentry
   curl https://your-region.ingest.sentry.io
   ```

4. **Check Error Filters**:
   - Sentry dashboard → **Settings** → **Inbound Filters**
   - Ensure no filters are blocking your errors

### Health Check Returns 503

**Symptom**: `/api/health/detailed` returns 503 status

**Solutions**:

1. **Check Individual Services**:
   ```bash
   # Review the response to see which service failed
   curl http://localhost:3000/api/health/detailed | jq
   ```

2. **Database Issues**:
   - Verify Supabase connection
   - Check `SUPABASE_SERVICE_ROLE_KEY` is set
   - Test manual query in Supabase dashboard

3. **Redis Issues**:
   - Verify Redis is running: `docker ps | grep redis`
   - Check `REDIS_URL` environment variable
   - Test connection: `redis-cli ping`

4. **OpenAI Issues**:
   - Verify `OPENAI_API_KEY` is set
   - Check API quota: [platform.openai.com/usage](https://platform.openai.com/usage)
   - Test API key: `curl https://api.openai.com/v1/models -H "Authorization: Bearer $OPENAI_API_KEY"`

### Logs Not Appearing in Production

**Symptom**: Structured logs not visible in Vercel/Docker logs

**Solutions**:

1. **Check Log Format**:
   - Production uses JSON format
   - Development uses human-readable format

2. **Verify Environment**:
   ```bash
   # Ensure NODE_ENV=production
   echo $NODE_ENV
   ```

3. **Check Vercel Logs**:
   - Visit Vercel dashboard
   - Select project → **Logs**
   - Filter by log level

4. **Check Docker Logs**:
   ```bash
   # View application logs
   docker-compose logs -f app

   # View specific container
   docker logs omniops-app
   ```

---

## Best Practices

### Error Tracking

✅ **DO:**
- Capture all production errors with Sentry
- Add user context (userId, domain) to errors
- Use structured logging for all log statements
- Set up alerts for new error types

❌ **DON'T:**
- Log sensitive data (passwords, API keys)
- Capture expected errors (validation failures)
- Ignore error context - always add metadata
- Use console.log in production code

### Health Checks

✅ **DO:**
- Monitor health checks every 30-60 seconds
- Alert on first failure for critical services
- Include latency in health check responses
- Use different endpoints for different monitors

❌ **DON'T:**
- Check too frequently (< 10 seconds)
- Ignore degraded status - it's a warning
- Use health checks without alerts
- Make health checks too expensive (keep under 1 second)

### Log Management

✅ **DO:**
- Use correlation IDs for request tracking
- Include timestamp, level, and context
- Rotate logs regularly to manage size
- Use log aggregation for production

❌ **DON'T:**
- Log everything - be selective
- Log at INFO level for debugging (use DEBUG)
- Store logs indefinitely without rotation
- Forget to sanitize logs (remove PII)

---

## Quick Reference

### Key Endpoints

- Health Check (Detailed): `GET /api/health/detailed`
- Health Check (Comprehensive): `GET /api/health/comprehensive`
- Sentry Test: `GET /api/sentry-test?action=error`

### Environment Variables

```bash
# Minimum required for monitoring
NEXT_PUBLIC_SENTRY_DSN=https://key@region.ingest.sentry.io/project
NEXT_PUBLIC_APP_URL=https://your-domain.com
NODE_ENV=production
```

### Common Commands

```bash
# Start with monitoring enabled
npm run dev

# Test health check
curl http://localhost:3000/api/health/detailed

# View Docker logs
docker-compose logs -f app

# Check Redis status
redis-cli ping
```

---

## Next Steps

After setting up monitoring:

1. ✅ Verify Sentry captures test errors
2. ✅ Set up uptime monitoring with Better Uptime
3. ✅ Configure alert notifications (Email/Slack)
4. ✅ Review error dashboard weekly
5. ✅ Set up log aggregation (optional, for scale)

**Related Documentation:**
- [Performance Optimization](../09-REFERENCE/REFERENCE_PERFORMANCE_OPTIMIZATION.md)
- [Docker Setup](SETUP_DOCKER_PRODUCTION.md)
- [Environment Configuration](VERCEL_ENV_SETUP.md)
