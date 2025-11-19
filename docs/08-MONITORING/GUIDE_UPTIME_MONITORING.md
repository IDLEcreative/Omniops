# Uptime Monitoring Setup Guide

**Type:** Guide
**Status:** Active
**Last Updated:** 2025-11-18
**Verified For:** v0.1.0
**Dependencies:** Health check endpoint required
**Estimated Read Time:** 15 minutes

## Purpose

Complete guide to setting up uptime monitoring to detect outages, measure availability, and maintain SLA compliance. Learn which endpoints to monitor, how to configure alerts, and create public status pages.

## Quick Links

- [Health Check Endpoint](../../app/api/health/route.ts)
- [Better Uptime](https://betteruptime.com/)
- [UptimeRobot](https://uptimerobot.com/)
- [Pingdom](https://www.pingdom.com/)

## Table of Contents

- [Overview](#overview)
- [Recommended Services](#recommended-services)
- [What to Monitor](#what-to-monitor)
- [Setup Instructions](#setup-instructions)
- [Alert Configuration](#alert-configuration)
- [Status Pages](#status-pages)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

---

## Overview

Uptime monitoring ensures your application is accessible 24/7 by:
- Pinging endpoints at regular intervals (30s - 5min)
- Detecting downtime and slow responses
- Alerting team immediately via SMS/Slack/Email
- Providing historical uptime data for SLA reporting
- Creating public status pages for users

**Why This Matters:**
- **SLA Compliance**: Track 99.9% uptime commitments
- **Early Detection**: Know about outages before users complain
- **Geographic Coverage**: Test from multiple global locations
- **Performance Insights**: Identify slow response times

## Recommended Services

### 1. Better Uptime (Recommended)

**Pros:**
- Modern UI
- Excellent status pages (hosted or custom domain)
- On-call scheduling and escalation
- Incident management
- Free tier: 10 monitors, 1-minute checks

**Pricing:**
- **Free**: 10 monitors, 60-second checks
- **Startup**: $20/month - 30 monitors, 30-second checks
- **Business**: $65/month - 100 monitors, 30-second checks

**Best For:** Production apps, team collaboration

### 2. UptimeRobot

**Pros:**
- Most generous free tier (50 monitors)
- Simple setup
- Good API
- Public status pages included

**Pricing:**
- **Free**: 50 monitors, 5-minute checks
- **Pro**: $7/month - 50 monitors, 1-minute checks
- **Enterprise**: $26/month - 100 monitors, 30-second checks

**Best For:** Side projects, early-stage startups

### 3. Pingdom (by SolarWinds)

**Pros:**
- Enterprise-grade reliability
- Advanced transaction monitoring
- Real user monitoring (RUM)
- Page speed insights

**Pricing:**
- **Starter**: $10/month - 10 checks, 1-minute intervals
- **Advanced**: $42/month - 50 checks, 1-minute intervals
- **Professional**: $169/month - 200 checks, 30-second intervals

**Best For:** Enterprise customers, compliance requirements

### 4. StatusCake

**Pros:**
- Generous free tier
- Page speed monitoring
- Domain monitoring (DNS, SSL)
- Virus scanning

**Pricing:**
- **Free**: Unlimited checks, 5-minute intervals
- **Superior**: $24.95/month - 1-minute intervals
- **Business**: $74.95/month - 30-second intervals

**Best For:** Budget-conscious teams

## What to Monitor

### Critical Endpoints

1. **Health Check** (Priority 1)
   ```
   URL: https://yourdomain.com/api/health
   Method: GET
   Expected: 200 OK
   Interval: 1 minute
   Timeout: 10 seconds
   ```

2. **Widget Embed** (Priority 1)
   ```
   URL: https://yourdomain.com/embed.js
   Method: GET
   Expected: 200 OK, Content-Type: application/javascript
   Interval: 2 minutes
   ```

3. **Chat API** (Priority 2)
   ```
   URL: https://yourdomain.com/api/chat
   Method: GET (or HEAD)
   Expected: 200 or 405 (method not allowed is OK)
   Interval: 5 minutes
   ```

4. **Homepage** (Priority 2)
   ```
   URL: https://yourdomain.com
   Method: GET
   Expected: 200 OK
   Interval: 5 minutes
   ```

### Optional Endpoints

5. **Database Connectivity**
   ```
   URL: https://yourdomain.com/api/health/database
   Method: GET
   Expected: {"status": "ok"}
   Interval: 5 minutes
   ```

6. **Redis Health**
   ```
   URL: https://yourdomain.com/api/health/redis
   Method: GET
   Expected: {"status": "ok"}
   Interval: 5 minutes
   ```

## Setup Instructions

### Better Uptime Setup

1. **Create Account**
   - Go to [betteruptime.com](https://betteruptime.com/)
   - Sign up with email or GitHub
   - Choose plan (Free tier is fine to start)

2. **Add Monitor**
   - Click "Create Monitor"
   - Type: HTTP(s)
   - URL: `https://yourdomain.com/api/health`
   - Name: `Omniops - Health Check`
   - Check frequency: 1 minute
   - Regions: Select 3-5 global regions
   - Expected status code: 200
   - Click "Create Monitor"

3. **Configure Alerts**
   - Go to "On-call" → "Escalation Policies"
   - Create policy:
     - Level 1: Slack channel (0 min)
     - Level 2: Email (5 min if not acknowledged)
     - Level 3: SMS (10 min if not acknowledged)
   - Assign policy to monitor

4. **Create Status Page**
   - Go to "Status Pages" → "Create Status Page"
   - Add monitors to display
   - Customize branding (logo, colors)
   - Set custom domain (optional): `status.yourdomain.com`
   - Publish page

### UptimeRobot Setup

1. **Create Account**
   - Go to [uptimerobot.com](https://uptimerobot.com/)
   - Sign up (free account)

2. **Add Monitor**
   - Dashboard → "Add New Monitor"
   - Monitor Type: HTTP(s)
   - Friendly Name: `Omniops Health Check`
   - URL: `https://yourdomain.com/api/health`
   - Monitoring Interval: 5 minutes (free) or 1 minute (paid)
   - Monitor Timeout: 30 seconds
   - Alert Contacts: Your email
   - Click "Create Monitor"

3. **Set Up Alerts**
   - Go to "My Settings" → "Alert Contacts"
   - Add email, Slack webhook, Discord, etc.
   - Set alert threshold: Down for 2 checks (2 min with 1-min interval)

4. **Create Public Status Page**
   - Go to "Public Status Pages"
   - Create new page
   - Add monitors to display
   - Customize design
   - Get public URL: `https://uptimerobot.com/yourpage`

## Alert Configuration

### Alert Thresholds

**Recommended Settings:**
- **Downtime Alert**: After 2 failed checks (2 minutes)
- **Slow Response Alert**: Response time > 5 seconds
- **Recovery Alert**: After 2 successful checks
- **Maintenance Mode**: Disable during deployments

### Notification Channels

**Priority Order:**
1. **Slack** (#alerts channel) - Immediate notification
2. **Email** - After 5 minutes
3. **SMS** - After 10 minutes (critical only)
4. **PagerDuty** - For on-call rotations

### Slack Integration

1. **Create Slack Webhook**
   - Go to [api.slack.com/apps](https://api.slack.com/apps)
   - Create app → "Incoming Webhooks"
   - Add to workspace
   - Select channel: `#alerts` or `#monitoring`
   - Copy webhook URL

2. **Add to Uptime Monitor**
   - Paste webhook URL in alert configuration
   - Test with "Send Test Notification"

## Status Pages

### Public Status Page

**What to Include:**
- Overall system status (green/yellow/red)
- Individual component status:
  - API
  - Chat Widget
  - Dashboard
  - Database
- Incident history (last 30 days)
- Uptime percentage (30-day, 90-day)
- Scheduled maintenance

**Example Structure:**
```
All Systems Operational ✓

API:                [✓] Operational
Chat Widget:        [✓] Operational
Dashboard:          [✓] Operational
Database:           [✓] Operational

Uptime (30 days): 99.95%
```

### Custom Domain Setup

1. **Add CNAME Record**
   ```
   Type:  CNAME
   Name:  status
   Value: [provided by monitoring service]
   TTL:   3600
   ```

2. **Verify Domain**
   - Service will check DNS propagation
   - Usually takes 5-30 minutes

3. **Enable HTTPS**
   - Most services auto-provision SSL (Let's Encrypt)

## Best Practices

### 1. Monitor from Multiple Regions

Always check from 3-5 global locations:
- US East (Virginia)
- US West (California)
- Europe (Frankfurt or London)
- Asia (Singapore or Tokyo)
- Australia (Sydney) - if you have APAC customers

**Why:** Prevents false positives from regional outages.

### 2. Set Reasonable Timeouts

- **Fast endpoints** (health checks): 5-10 seconds
- **Complex APIs** (chat, search): 30 seconds
- **File uploads**: 60 seconds

**Why:** Too short = false alerts. Too long = slow detection.

### 3. Use Keyword Monitoring

Don't just check HTTP 200. Also verify response contains expected data:

```
URL: https://yourdomain.com/api/health
Expected Status: 200
Expected Keyword: "healthy" or "ok"
```

**Why:** Catches edge cases where server returns 200 but wrong data.

### 4. Schedule Maintenance Windows

Before deployments:
1. Set monitors to "maintenance mode"
2. Duration: Expected deployment time + 10 minutes
3. Re-enable after deployment completes

**Why:** Prevents false alerts during known downtime.

### 5. Track Response Times

Set alerts for slow responses (degraded performance):
- **Warning**: Response time > 2 seconds
- **Critical**: Response time > 5 seconds

**Why:** Slow is better than down, but users still suffer.

## Troubleshooting

### False Positive Alerts

**Symptoms:** Monitors show "down" but site works fine

**Solutions:**
1. Check from multiple regions (might be regional outage)
2. Increase timeout (endpoint might be slow, not down)
3. Verify firewall rules (monitor IPs not blocked)
4. Check rate limiting (monitors might trigger limits)

### Missing Alerts

**Symptoms:** Site was down but no alert received

**Solutions:**
1. Test alert channels (send test notification)
2. Check alert thresholds (might require more failed checks)
3. Verify monitor is enabled
4. Check alert fatigue settings (alerts might be muted)

### Status Page Not Updating

**Symptoms:** Status page shows old data

**Solutions:**
1. Check DNS (CNAME might not be propagated)
2. Clear browser cache
3. Verify monitors are linked to status page
4. Contact support (might be service issue)

## Next Steps

- [Configure Alerting](./GUIDE_ALERTING.md)
- [Set Up Performance Monitoring](./GUIDE_PERFORMANCE_MONITORING.md)
- [Configure Sentry](./GUIDE_SENTRY_SETUP.md)

## Resources

- [Better Uptime Docs](https://docs.betteruptime.com/)
- [UptimeRobot API](https://uptimerobot.com/api/)
- [Pingdom Knowledge Base](https://help.pingdom.com/)
- [Status Page Best Practices](https://www.atlassian.com/incident-management/on-call/status-pages)
