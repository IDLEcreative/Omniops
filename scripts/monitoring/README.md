# Monitoring Scripts

**Purpose:** Real-time system health and performance monitoring tools
**Last Updated:** 2025-10-30
**Usage:** Run monitoring scripts using `npx tsx` from project root

## Overview

This directory contains tools for continuous monitoring of system health, performance metrics, and service status. Use these scripts to detect issues early and maintain system reliability.

## Available Tools

### monitor-embeddings-health.ts
**Purpose:** Monitor and maintain embedding generation health

**Usage:**
```bash
# Run health check
npx tsx scripts/monitoring/monitor-embeddings-health.ts check

# Auto-maintenance mode (fixes issues automatically)
npx tsx scripts/monitoring/monitor-embeddings-health.ts auto

# Continuous monitoring (watch mode)
npx tsx scripts/monitoring/monitor-embeddings-health.ts watch
```

**Modes:**

**`check`** - One-time health check
- Verifies embedding generation is working
- Checks for missing embeddings
- Reports embedding coverage statistics
- Identifies stale or corrupted embeddings

**`auto`** - Automatic maintenance
- Runs health check
- Automatically regenerates missing embeddings
- Fixes metadata issues
- Updates stale embeddings

**`watch`** - Continuous monitoring
- Runs health checks every 5 minutes
- Sends alerts when issues detected
- Auto-remediation of minor issues
- Logs all activities for audit trail

**Metrics tracked:**
- Embedding generation rate
- Coverage percentage per customer
- Average generation time
- Error rates and types
- Storage usage

**Output:**
```
✓ Embeddings Health Check
  Total customers: 10
  Healthy: 8 (80%)
  Issues: 2 (20%)

  Issues found:
  - example.com: 45% coverage (expected >80%)
  - test.com: No embeddings in 7 days

  Recommendations:
  - Re-scrape example.com
  - Check scraping job status for test.com
```

---

### monitor-woocommerce.ts
**Purpose:** Monitor WooCommerce integration status and API health

**Usage:**
```bash
npx tsx scripts/monitoring/monitor-woocommerce.ts
```

**What it monitors:**
- WooCommerce API connectivity for all customers
- Product sync status and freshness
- Order tracking functionality
- API rate limit usage
- Cart abandonment tracking status

**Metrics tracked:**
- API response times (p50, p95, p99)
- Successful vs. failed API calls
- Product sync lag (time since last sync)
- Cart abandonment rate
- Credential expiration warnings

**Alerts triggered on:**
- API connection failures
- Product data >24 hours old
- Rate limit approaching (>80% used)
- Cart tracking failures
- Credential expiration within 30 days

---

### benchmark-database-improvements.ts
**Purpose:** Benchmark database optimizations and track performance over time

**Usage:**
```bash
npx tsx scripts/monitoring/benchmark-database-improvements.ts
```

**What it does:**
- Runs standardized database performance tests
- Compares against baseline metrics
- Measures query performance improvements
- Tracks index effectiveness
- Reports on optimization ROI

**Benchmarks:**
- Vector search performance (100 queries)
- Full-text search performance
- Customer data queries
- Embedding generation queries
- Join performance on key tables

**Output:**
```
Database Performance Benchmark

Vector Search:
  p50: 45ms (baseline: 120ms) ↑ 62% improvement
  p95: 180ms (baseline: 450ms) ↑ 60% improvement
  p99: 320ms (baseline: 890ms) ↑ 64% improvement

Full-text Search:
  p50: 15ms (baseline: 35ms) ↑ 57% improvement
  p95: 45ms (baseline: 120ms) ↑ 62% improvement

Index Hit Rate: 94% (baseline: 78%) ↑ 16%
```

---

### simulate-production-conversations.ts
**Purpose:** Simulate production load to test system behavior under realistic conditions

**Usage:**
```bash
# Light load (10 conversations)
npx tsx scripts/monitoring/simulate-production-conversations.ts --light

# Normal load (50 conversations)
npx tsx scripts/monitoring/simulate-production-conversations.ts

# Heavy load (200 conversations)
npx tsx scripts/monitoring/simulate-production-conversations.ts --heavy

# Custom load
npx tsx scripts/monitoring/simulate-production-conversations.ts --count 100
```

**What it does:**
- Simulates realistic user conversations
- Tests AI response quality under load
- Measures system performance metrics
- Identifies bottlenecks and failures
- Validates rate limiting behavior

**Scenarios tested:**
- Product inquiries
- Order status checks
- General support questions
- Complex multi-turn conversations
- Concurrent user sessions

**Metrics collected:**
- Response time per message
- AI accuracy rate
- System throughput (messages/second)
- Error rates
- Resource usage (CPU, memory, database connections)

**Output:**
```
Production Load Simulation

Configuration:
  Conversations: 50
  Messages per conversation: 3-7
  Total messages: 245
  Duration: 5 minutes

Results:
  ✓ 245/245 messages successful (100%)
  ✓ Average response time: 1.2s
  ✓ p95 response time: 3.1s
  ✓ AI accuracy: 86%
  ✓ No rate limit hits
  ✓ No database errors

Resource Usage:
  Peak CPU: 45%
  Peak Memory: 2.1GB
  Database connections: 12/100
  Redis usage: 45MB
```

---

### benchmark-actual-performance.ts
**Purpose:** Measure actual system performance in production-like conditions

**Usage:**
```bash
npx tsx scripts/monitoring/benchmark-actual-performance.ts
```

**What it benchmarks:**
- End-to-end chat response times
- Vector search latency
- Database query performance
- API endpoint response times
- Cache hit rates

**Use cases:**
- Regression testing after deployments
- Validating optimizations
- Capacity planning
- SLA compliance monitoring

## Continuous Monitoring Setup

### Recommended Cron Jobs

```bash
# Embeddings health check - every 6 hours
0 */6 * * * cd /path/to/omniops && npx tsx scripts/monitoring/monitor-embeddings-health.ts check >> /var/log/omniops/embeddings.log 2>&1

# WooCommerce monitoring - every hour
0 * * * * cd /path/to/omniops && npx tsx scripts/monitoring/monitor-woocommerce.ts >> /var/log/omniops/woocommerce.log 2>&1

# Database benchmark - daily at 3 AM
0 3 * * * cd /path/to/omniops && npx tsx scripts/monitoring/benchmark-database-improvements.ts >> /var/log/omniops/benchmarks.log 2>&1

# Production simulation - weekly on Sunday at 2 AM
0 2 * * 0 cd /path/to/omniops && npx tsx scripts/monitoring/simulate-production-conversations.ts >> /var/log/omniops/load-tests.log 2>&1
```

### Docker Integration

```bash
# Run monitoring in Docker container
docker exec omniops-app npx tsx scripts/monitoring/monitor-embeddings-health.ts check

# Watch mode in background
docker exec -d omniops-app npx tsx scripts/monitoring/monitor-embeddings-health.ts watch
```

## Alert Configuration

Set up alerts by configuring thresholds in scripts:

```typescript
// Example: monitor-embeddings-health.ts
const ALERT_THRESHOLDS = {
  minCoverage: 0.8,      // Alert if <80% coverage
  maxAge: 7,             // Alert if embeddings >7 days old
  maxGenTime: 5000,      // Alert if generation >5s
};
```

## Troubleshooting

### "Monitoring script running slow"
```bash
# Check database load
npx tsx scripts/analysis/profile-database-performance.js

# Verify Redis is healthy
docker exec customer-service-redis redis-cli INFO
```

### "Auto-maintenance not fixing issues"
```bash
# Run in verbose mode
npx tsx scripts/monitoring/monitor-embeddings-health.ts auto --verbose

# Check logs for errors
tail -f /var/log/omniops/embeddings.log
```

### "Load simulation failing"
```bash
# Start with light load
npx tsx scripts/monitoring/simulate-production-conversations.ts --light

# Check system resources
htop  # or Activity Monitor on macOS

# Verify all services are running
docker-compose ps
```

## Best Practices

1. **Regular monitoring** - Run health checks at least daily
2. **Baseline metrics** - Establish performance baselines early
3. **Alert fatigue** - Set thresholds to avoid excessive alerts
4. **Log rotation** - Implement log rotation for monitoring output
5. **Trend analysis** - Track metrics over time to identify patterns
6. **Proactive remediation** - Don't wait for user reports

## Integration with Observability Tools

### Sending Metrics to External Services

```typescript
// Example: Push metrics to monitoring service
async function sendMetrics(metrics: HealthMetrics) {
  await fetch('https://your-monitoring-service.com/api/metrics', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(metrics),
  });
}
```

### Slack Alerts

```bash
# Send alert to Slack
curl -X POST $SLACK_WEBHOOK_URL \
  -H 'Content-Type: application/json' \
  -d '{"text":"🚨 Embedding coverage below 80% for example.com"}'
```

## Related Scripts

- **Analysis:** `scripts/analysis/` - Diagnostic tools for investigating issues
- **Validation:** `scripts/validation/` - Data validation scripts
- **Tests:** `scripts/tests/` - Testing utilities

## Related Documentation

- [Performance Optimization Guide](../../docs/07-REFERENCE/REFERENCE_PERFORMANCE_OPTIMIZATION.md)
- [Embeddings Health Monitoring](../../docs/embeddings-health-monitoring.md)
- [Search Architecture](../../docs/01-ARCHITECTURE/ARCHITECTURE_SEARCH_SYSTEM.md)
- [Main Scripts README](../README.md)
