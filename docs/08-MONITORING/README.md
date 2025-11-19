# Monitoring & Observability Documentation

**Type:** Directory Index
**Status:** Active
**Last Updated:** 2025-11-18
**Verified For:** v0.1.0

## Purpose

Central directory for all monitoring, observability, and alerting documentation. Provides comprehensive guides for setting up error tracking, uptime monitoring, log aggregation, alerting, and performance monitoring.

## Quick Start

New to monitoring? Start here:
1. [Sentry Setup](./GUIDE_SENTRY_SETUP.md) - Error tracking (10 min setup)
2. [Uptime Monitoring](./GUIDE_UPTIME_MONITORING.md) - Service availability (15 min)
3. [Alerting](./GUIDE_ALERTING.md) - Alert configuration (10 min)

## Documentation Overview

### Setup Guides

| Guide | Purpose | Time | Status |
|-------|---------|------|--------|
| [GUIDE_SENTRY_SETUP.md](./GUIDE_SENTRY_SETUP.md) | Error tracking and performance monitoring with Sentry | 10 min | ✅ Active |
| [GUIDE_UPTIME_MONITORING.md](./GUIDE_UPTIME_MONITORING.md) | Service availability monitoring and status pages | 15 min | ✅ Active |
| [GUIDE_ALERTING.md](./GUIDE_ALERTING.md) | Alert severity, routing, and on-call procedures | 12 min | ✅ Active |
| [GUIDE_LOG_AGGREGATION.md](./GUIDE_LOG_AGGREGATION.md) | Centralized logging with Logtail/Axiom/Datadog | 12 min | ✅ Active |
| [GUIDE_PERFORMANCE_MONITORING.md](./GUIDE_PERFORMANCE_MONITORING.md) | Performance metrics, budgets, and dashboards | 15 min | ✅ Active |

### Existing Reference

| Document | Description | Status |
|----------|-------------|--------|
| [MONITORING_CHAT_WIDGET_PERFORMANCE.md](./MONITORING_CHAT_WIDGET_PERFORMANCE.md) | Chat widget performance optimization | ✅ Active |

## Monitoring Stack Overview

### Error Tracking: Sentry

**What it does:**
- Captures unhandled errors automatically
- Tracks performance (API response times, database queries)
- Provides user context and breadcrumbs
- Integrates with Slack/PagerDuty for alerting

**Implementation:**
- Library: `/home/user/Omniops/lib/monitoring/sentry.ts`
- Example: `/home/user/Omniops/app/api/sentry-example-api/route.ts`
- Setup Guide: [GUIDE_SENTRY_SETUP.md](./GUIDE_SENTRY_SETUP.md)

### Uptime Monitoring: Better Uptime / UptimeRobot

**What it does:**
- Pings health check endpoint every 1-5 minutes
- Detects downtime and slow responses
- Alerts team via Slack/SMS/Email
- Provides public status pages

**Implementation:**
- Health Check: `/home/user/Omniops/app/api/health/route.ts`
- Setup Guide: [GUIDE_UPTIME_MONITORING.md](./GUIDE_UPTIME_MONITORING.md)

### Logging: Structured Logger + Logtail/Axiom

**What it does:**
- Centralized log aggregation
- Structured JSON logs with correlation IDs
- Search and filter across all servers
- Log-based alerting

**Implementation:**
- Library: `/home/user/Omniops/lib/monitoring/logger.ts`
- Setup Guide: [GUIDE_LOG_AGGREGATION.md](./GUIDE_LOG_AGGREGATION.md)

### Alerting: Multi-Channel

**What it does:**
- Routes alerts by severity (Critical → SMS, Medium → Slack)
- Escalation policies for unacknowledged alerts
- Integration with Slack, PagerDuty, Discord

**Implementation:**
- Library: `/home/user/Omniops/lib/monitoring/alerting.ts`
- Setup Guide: [GUIDE_ALERTING.md](./GUIDE_ALERTING.md)

### Performance: Custom + Sentry

**What it does:**
- Tracks API response times (p50, p95, p99)
- Monitors database query performance
- Measures AI token usage and costs
- Dashboards and regression detection

**Implementation:**
- Libraries: `/home/user/Omniops/lib/monitoring/performance-*.ts`
- Scripts: `/home/user/Omniops/scripts/monitoring/`
- Setup Guide: [GUIDE_PERFORMANCE_MONITORING.md](./GUIDE_PERFORMANCE_MONITORING.md)

## Monitoring Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Application                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐             │
│  │  API     │  │ Frontend │  │  Crons   │             │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘             │
│       │             │             │                     │
└───────┼─────────────┼─────────────┼─────────────────────┘
        │             │             │
        ▼             ▼             ▼
┌─────────────────────────────────────────────────────────┐
│                  Monitoring Layer                       │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐             │
│  │  Sentry  │  │  Logger  │  │ Perf     │             │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘             │
└───────┼─────────────┼─────────────┼─────────────────────┘
        │             │             │
        ▼             ▼             ▼
┌─────────────────────────────────────────────────────────┐
│              External Services                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐             │
│  │  Sentry  │  │ Logtail  │  │Better    │             │
│  │  .io     │  │          │  │Uptime    │             │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘             │
└───────┼─────────────┼─────────────┼─────────────────────┘
        │             │             │
        ▼             ▼             ▼
┌─────────────────────────────────────────────────────────┐
│                Alert Channels                           │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐             │
│  │  Slack   │  │  Email   │  │   SMS    │             │
│  └──────────┘  └──────────┘  └──────────┘             │
└─────────────────────────────────────────────────────────┘
```

## Quick Reference: What to Monitor

### Critical (P0)

- ✅ API health check (`/api/health`)
- ✅ Database connectivity
- ✅ Redis connectivity
- ✅ Chat widget loading
- ✅ Payment processing

### Important (P1)

- ✅ API response times (p95 < 2s)
- ✅ Database query performance
- ✅ AI token usage/costs
- ✅ Error rates (<0.1%)
- ✅ Queue processing times

### Nice to Have (P2)

- ✅ Frontend performance (LCP, FCP)
- ✅ Cache hit rates
- ✅ Background job success rates
- ✅ User engagement metrics

## Environment Variables

Required for monitoring:

```bash
# Sentry
NEXT_PUBLIC_SENTRY_DSN=https://...@sentry.io/...
SENTRY_ORG=your-org
SENTRY_PROJECT=your-project
SENTRY_AUTH_TOKEN=your-token

# Logtail (optional)
LOGTAIL_SOURCE_TOKEN=your-token

# Axiom (optional)
AXIOM_TOKEN=your-token
AXIOM_ORG_ID=your-org-id

# Alerts
NOTIFICATION_SLACK_ENABLED=true
NOTIFICATION_SLACK_WEBHOOK=https://hooks.slack.com/...
NOTIFICATION_EMAIL_ENABLED=true
NOTIFICATION_EMAIL_TO=team@yourdomain.com
```

## Common Tasks

### Check Application Health

```bash
curl http://localhost:3000/api/health
```

### Test Error Tracking

```bash
curl "http://localhost:3000/api/sentry-example-api?action=error"
```

### Run Performance Profile

```bash
npx tsx scripts/monitoring/profile-api-performance.ts
```

### Check Embeddings Health

```bash
npx tsx scripts/monitoring/check-embeddings-health.ts
```

### View Monitoring Dashboard

```bash
# Access existing dashboard data
curl http://localhost:3000/api/monitoring/dashboard
```

## Troubleshooting

### Alerts Not Firing

1. Check environment variables are set
2. Verify webhook URLs are correct
3. Test Slack integration manually
4. Check alert thresholds in monitoring service

### Sentry Not Capturing Errors

1. Verify `NEXT_PUBLIC_SENTRY_DSN` is set
2. Check production environment (Sentry disabled in dev by default)
3. Look for errors in browser console
4. Test with example endpoint

### Logs Not Aggregating

1. Check `LOGTAIL_SOURCE_TOKEN` or `AXIOM_TOKEN`
2. Verify network access to external service
3. Check production check in logger
4. Review log service dashboard

### High Monitoring Costs

1. Reduce Sentry sample rate (`tracesSampleRate: 0.1`)
2. Filter noisy logs (health checks, etc.)
3. Shorten log retention period
4. Sample high-frequency logs

## Next Steps

1. **New Projects**: Start with [Sentry Setup](./GUIDE_SENTRY_SETUP.md)
2. **Existing Projects**: Review [Performance Monitoring](./GUIDE_PERFORMANCE_MONITORING.md)
3. **Production Readiness**: Complete all 5 setup guides
4. **Team Onboarding**: Share [Alerting Guide](./GUIDE_ALERTING.md)

## Related Documentation

- [Performance Optimization Reference](../09-REFERENCE/REFERENCE_PERFORMANCE_OPTIMIZATION.md)
- [Database Schema](../09-REFERENCE/REFERENCE_DATABASE_SCHEMA.md)
- [NPX Scripts Reference](../09-REFERENCE/REFERENCE_NPX_SCRIPTS.md)

## Maintenance

**Weekly Tasks:**
- Review dashboard metrics
- Check alert fatigue (too many/few alerts)
- Update performance budgets

**Monthly Tasks:**
- Review monitoring costs
- Update runbooks
- Test alert channels
- Audit log retention

**Quarterly Tasks:**
- Review monitoring stack (consider new tools)
- Update severity levels
- Train team on new features
- Conduct incident response drill

---

**Last Audit:** 2025-11-18
**Next Review:** 2025-12-18
**Maintainer:** Platform Team
