# Alerting Configuration Guide

**Type:** Guide
**Status:** Active
**Last Updated:** 2025-11-18
**Verified For:** v0.1.0
**Dependencies:** Monitoring tools (Sentry, Uptime monitoring)
**Estimated Read Time:** 12 minutes

## Purpose

Define alerting philosophy, severity levels, notification channels, and on-call procedures to ensure team responds effectively to production issues without alert fatigue.

## Quick Links

- [Existing Alert System](../../lib/monitoring/alerting.ts)
- [Sentry Setup Guide](./GUIDE_SENTRY_SETUP.md)
- [Uptime Monitoring Guide](./GUIDE_UPTIME_MONITORING.md)

## Table of Contents

- [Alerting Philosophy](#alerting-philosophy)
- [Alert Severity Levels](#alert-severity-levels)
- [Notification Channels](#notification-channels)
- [Alert Routing](#alert-routing)
- [On-Call Procedures](#on-call-procedures)
- [Alert Fatigue Prevention](#alert-fatigue-prevention)
- [Integration Setup](#integration-setup)

---

## Alerting Philosophy

### When to Alert vs When to Log

**Alert:** Something is broken and requires immediate human action
**Log:** Something happened that should be recorded for debugging

**Alert Criteria:**
- ✅ User-facing functionality is broken
- ✅ Data loss or corruption risk
- ✅ Security breach or suspicious activity
- ✅ SLA violation imminent (response time > 5s)
- ✅ Critical system down (database, cache)

**Don't Alert:**
- ❌ Informational events (user logged in)
- ❌ Expected errors (invalid user input)
- ❌ Performance degradation <5% (log and review weekly)
- ❌ Non-critical warnings (cache miss, retry succeeded)

### The "3 AM Test"

Ask: **"Would I wake someone at 3 AM for this?"**
- **Yes**: It's a critical alert → Page on-call
- **No**: It's a warning → Send to Slack, review in morning

## Alert Severity Levels

### Critical (P0)

**Definition:** Complete service outage or data loss

**Examples:**
- Application completely down (health check failing)
- Database unreachable
- Payment processing broken
- Data corruption detected

**Response:**
- **Time to Acknowledge**: 5 minutes
- **Time to Resolve**: 1 hour
- **Notifications**: SMS + Phone call + Slack + Email
- **Escalation**: Immediate to on-call engineer

**SLA Impact:** Counts against uptime SLA

### High (P1)

**Definition:** Major functionality degraded but workarounds exist

**Examples:**
- Chat widget loading slowly (>5s)
- WooCommerce integration failing
- Email notifications delayed
- High error rate (>5%)

**Response:**
- **Time to Acknowledge**: 15 minutes
- **Time to Resolve**: 4 hours
- **Notifications**: Slack + Email
- **Escalation**: After 1 hour if unresolved

**SLA Impact:** Counts as degraded performance

### Medium (P2)

**Definition:** Non-critical feature broken or degraded

**Examples:**
- Analytics dashboard slow
- Non-essential API endpoint error
- Scheduled job failed (will retry)
- Cache performance degraded

**Response:**
- **Time to Acknowledge**: 1 hour
- **Time to Resolve**: 24 hours
- **Notifications**: Slack only
- **Escalation**: None (handle during business hours)

**SLA Impact:** No SLA impact

### Low (P3)

**Definition:** Minor issue or informational alert

**Examples:**
- SSL certificate expiring in 30 days
- Disk space >70% (not critical yet)
- Deprecated API usage detected
- Performance optimization opportunity

**Response:**
- **Time to Acknowledge**: 1 business day
- **Time to Resolve**: Best effort
- **Notifications**: Email digest (daily)
- **Escalation**: None

**SLA Impact:** No SLA impact

## Notification Channels

### 1. Slack Integration

**Channels:**
- `#alerts-critical` - P0 only, @here mentions
- `#alerts` - P1 and P2 alerts
- `#monitoring` - P3 alerts, logs, metrics

**Setup:**
```bash
# In .env.local
NOTIFICATION_SLACK_ENABLED=true
NOTIFICATION_SLACK_WEBHOOK=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
NOTIFICATION_SLACK_CRITICAL_WEBHOOK=https://hooks.slack.com/services/CRITICAL/WEBHOOK
```

**Message Format:**
```
🔴 [CRITICAL] API Health Check Failed
Environment: production
Duration: 2 minutes
Affected: All users
Link: https://app.sentry.io/issues/12345
Runbook: https://wiki.com/runbooks/api-health
```

### 2. Email Alerts

**Recipients by Severity:**
- **P0 (Critical)**: All on-call engineers
- **P1 (High)**: Team lead + on-call
- **P2 (Medium)**: Team alias
- **P3 (Low)**: Weekly digest

**Setup:**
```bash
# In .env.local
NOTIFICATION_EMAIL_ENABLED=true
NOTIFICATION_EMAIL_FROM=alerts@yourdomain.com
NOTIFICATION_EMAIL_TO=team@yourdomain.com
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=your_sendgrid_api_key
```

### 3. SMS/Phone (Critical Only)

**When to Use:**
- P0 alerts only
- During on-call hours (24/7)
- After 2 failed acknowledgment attempts

**Setup via PagerDuty:**
1. Create service in PagerDuty
2. Add phone numbers to escalation policy
3. Integrate with Sentry/monitoring tools

### 4. Discord (Optional)

**Use Case:** Teams already using Discord for communication

**Setup:**
```bash
# In .env.local
NOTIFICATION_DISCORD_ENABLED=true
NOTIFICATION_DISCORD_WEBHOOK=https://discord.com/api/webhooks/YOUR/WEBHOOK
```

## Alert Routing

### Routing Rules

```typescript
// Alert routing logic
if (severity === 'critical' && environment === 'production') {
  sendToSlack('#alerts-critical', '@here');
  sendEmail(onCallEngineers);
  if (notAcknowledgedAfter(5, 'minutes')) {
    sendSMS(onCallEngineers);
    pagePagerDuty();
  }
} else if (severity === 'high') {
  sendToSlack('#alerts');
  sendEmail(teamLead);
  if (notAcknowledgedAfter(15, 'minutes')) {
    escalateToSenior();
  }
} else if (severity === 'medium') {
  sendToSlack('#alerts');
} else {
  addToDigest(); // Send daily summary
}
```

### Environment-Based Routing

- **Production**: Full alert pipeline
- **Staging**: Slack only, no pages
- **Development**: Log only, no alerts

## On-Call Procedures

### On-Call Schedule

**Rotation:** Weekly (Monday 9 AM - Monday 9 AM)
**Tool:** PagerDuty or OpsGenie

**Responsibilities:**
1. **Monitor**: Check Slack #alerts channel hourly
2. **Respond**: Acknowledge P0 within 5 min, P1 within 15 min
3. **Escalate**: If can't resolve in 1 hour, escalate to senior
4. **Document**: Add incident notes to wiki/Notion
5. **Handoff**: Brief next on-call about ongoing issues

### Escalation Policy

**Level 1** (0-5 min):
- Primary on-call engineer
- Notification: Slack + Email

**Level 2** (5-15 min):
- Secondary on-call engineer
- Notification: SMS + Slack

**Level 3** (15-30 min):
- Engineering manager
- Notification: Phone call + SMS

**Level 4** (30+ min):
- CTO/VP Engineering
- Notification: Phone call

### Runbooks

Create runbooks for common alerts:

**Template:**
```markdown
# Runbook: API Health Check Failed

## Symptoms
- /api/health returns 500 or timeout
- Uptime monitor shows down

## Diagnosis
1. Check Sentry for error stack traces
2. Verify database connectivity: `npm run check:db`
3. Check Redis: `redis-cli ping`
4. Review recent deployments (last 30 min)

## Resolution
1. If database down: Contact DBA, failover to replica
2. If Redis down: Restart Redis, app will reconnect
3. If recent deploy: Rollback via Vercel/AWS
4. If none: Check CloudFlare status, server CPU/memory

## Prevention
- Add more database replicas
- Implement circuit breaker for Redis
- Add pre-deploy health checks
```

## Alert Fatigue Prevention

### Common Causes

1. **Too many alerts**: Every warning becomes an alert
2. **Noisy alerts**: Same alert firing repeatedly
3. **False positives**: Alerts for non-issues
4. **No context**: Can't tell if alert is serious

### Solutions

**1. Alert Thresholds**
```typescript
// ❌ BAD: Alert on single error
if (errorCount > 0) { sendAlert(); }

// ✅ GOOD: Alert on sustained error rate
if (errorRate > 5% over 5 minutes) { sendAlert(); }
```

**2. Deduplication**
```typescript
// Group identical alerts within time window
if (lastAlertWithin(15, 'minutes')) {
  incrementCounter();
} else {
  sendAlert();
}
```

**3. Alert Grouping**
```
🔴 Database Issues (3 alerts)
  - Connection timeout (2 occurrences)
  - Slow query (1 occurrence)

[View Details] [Acknowledge All]
```

**4. Intelligent Alerting**
```typescript
// Only alert during business impact hours
if (isBusinessHours() || severity === 'critical') {
  sendAlert();
} else {
  addToMorningDigest();
}
```

## Integration Setup

### Slack Webhook

1. Go to [api.slack.com/apps](https://api.slack.com/apps)
2. Create app → Incoming Webhooks
3. Add to workspace → Select channel
4. Copy webhook URL → Add to `.env.local`

### PagerDuty

1. Create service: "Omniops Production"
2. Integration: Generic Webhooks
3. Copy integration key
4. Add to Sentry integration settings

### Sentry Alert Rules

1. Go to Alerts → Create Alert
2. Choose trigger:
   - **Critical**: Error count > 100 in 5 min
   - **High**: Error rate > 5% in 5 min
3. Actions:
   - Send Slack notification
   - Trigger PagerDuty incident
4. Save rule

## Best Practices

1. **Alert on symptoms, not causes**
   - ✅ "Users can't checkout" (symptom)
   - ❌ "Payment API returned 500" (cause)

2. **Include actionable information**
   - Error ID for lookup
   - Affected user count
   - Link to runbook
   - Link to logs/dashboard

3. **Review alerts weekly**
   - Remove noisy alerts
   - Adjust thresholds
   - Update runbooks

4. **Test alert channels monthly**
   - Verify Slack messages arrive
   - Test PagerDuty escalation
   - Confirm SMS delivery

5. **Document incidents**
   - Create postmortem for P0 incidents
   - Update runbooks with learnings
   - Share with team

## Next Steps

- [Configure Performance Monitoring](./GUIDE_PERFORMANCE_MONITORING.md)
- [Set Up Log Aggregation](./GUIDE_LOG_AGGREGATION.md)
- [Review Existing Alerts](../../lib/monitoring/alerting.ts)

## Resources

- [PagerDuty Best Practices](https://www.pagerduty.com/resources/learn/incident-response-best-practices/)
- [Google SRE - Monitoring](https://sre.google/sre-book/monitoring-distributed-systems/)
- [Alerting on SLOs](https://sre.google/workbook/alerting-on-slos/)
