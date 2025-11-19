# Load Testing Guide

**Type:** Guide
**Status:** Active
**Last Updated:** 2025-11-18
**Verified For:** v0.1.0
**Dependencies:** [Load Test Scripts](/home/user/Omniops/scripts/load-testing/), [CLAUDE.md](/home/user/Omniops/CLAUDE.md)
**Estimated Read Time:** 12 minutes

## Purpose

Complete guide to load testing the OmniOps platform using k6, ensuring the application can handle realistic traffic loads and identifying performance bottlenecks before they impact users.

## Quick Links

- [Chat Load Test Script](/home/user/Omniops/scripts/load-testing/load-test-chat.js)
- [Scraping Load Test Script](/home/user/Omniops/scripts/load-testing/load-test-scraping.js)
- [k6 Documentation](https://k6.io/docs/)
- [Performance Testing Guide](https://k6.io/docs/testing-guides/)

## Table of Contents

- [Overview](#overview)
- [Why Load Testing](#why-load-testing)
- [Installing k6](#installing-k6)
- [Running Load Tests](#running-load-tests)
- [Understanding Results](#understanding-results)
- [Performance Targets](#performance-targets)
- [Scaling Thresholds](#scaling-thresholds)
- [Optimization Strategies](#optimization-strategies)
- [CI/CD Integration](#cicd-integration)
- [Troubleshooting](#troubleshooting)

---

## Overview

Load testing simulates real-world traffic to identify how the system performs under stress. We use k6, a modern load testing tool that's:

- **Developer-friendly**: Tests written in JavaScript
- **Fast**: Written in Go, minimal overhead
- **Flexible**: Supports complex scenarios
- **Open source**: Free and community-driven

**What We Test:**
- Chat API endpoint performance
- Scraping API and job queue capacity
- Database query performance under load
- Redis queue throughput
- API rate limiting effectiveness

---

## Why Load Testing

### Prevent Production Incidents

**Without load testing:**
```
Launch day → 500 concurrent users → Database crashes
Result: 2 hours downtime, lost revenue, angry customers
```

**With load testing:**
```
Pre-launch → Discover DB crashes at 200 users → Fix before launch
Result: Smooth launch, happy customers, no downtime
```

### Real-World Scenarios

**Scenario 1: Chat Widget Launch**
- Customer deploys widget on homepage
- Traffic spike: 50 → 500 concurrent users in 10 minutes
- Question: Will the chat API handle it?

**Scenario 2: Scraping Job Burst**
- 10 customers trigger re-scraping simultaneously
- 100 pages each = 1,000 jobs in queue
- Question: Will Redis queue handle it?

**Scenario 3: Dashboard Analytics**
- Sales team checks analytics every morning at 9 AM
- 20 simultaneous dashboard loads
- Question: Will database queries time out?

### Benefits

- ✅ Identify bottlenecks before production
- ✅ Validate scaling decisions
- ✅ Prove capacity to customers
- ✅ Set realistic SLAs
- ✅ Plan infrastructure costs

---

## Installing k6

### macOS

```bash
brew install k6
```

### Linux

```bash
# Debian/Ubuntu
sudo gpg -k
sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update
sudo apt-get install k6

# Fedora/CentOS
sudo dnf install https://dl.k6.io/rpm/repo.rpm
sudo dnf install k6
```

### Windows

```powershell
choco install k6
```

### Verify Installation

```bash
k6 version
# k6 v0.48.0
```

---

## Running Load Tests

### Chat API Load Test

**Basic usage:**
```bash
# Start dev server
npm run dev

# In another terminal, run load test
k6 run scripts/load-testing/load-test-chat.js
```

**Custom configuration:**
```bash
# Test specific domain
k6 run -e BASE_URL=http://localhost:3000 -e TEST_DOMAIN=example.com scripts/load-testing/load-test-chat.js

# Shorter test (30s ramp up, 1min peak)
k6 run --duration 2m scripts/load-testing/load-test-chat.js

# More aggressive (200 concurrent users)
k6 run --vus 200 --duration 5m scripts/load-testing/load-test-chat.js
```

**What it tests:**
- 100 concurrent users sending chat messages
- Realistic message patterns
- Response time validation
- Error rate monitoring
- Throughput measurement

**Test flow:**
```
1. Ramp up: 0 → 100 users over 3.5 minutes
2. Sustain: 100 users for 2 minutes
3. Ramp down: 100 → 0 users over 1 minute
Total duration: ~6.5 minutes
```

### Scraping API Load Test

**Basic usage:**
```bash
# Ensure Redis is running
docker-compose up -d redis

# Start dev server
npm run dev

# Run scraping load test
k6 run scripts/load-testing/load-test-scraping.js
```

**What it tests:**
- 20 concurrent scraping requests
- Job queue capacity
- Rate limiting effectiveness
- Background job processing
- Status polling performance

**Test flow:**
```
1. Ramp up: 0 → 20 users over 2 minutes
2. Sustain: 20 users for 1 minute
3. Ramp down: 20 → 0 users over 30 seconds
Total duration: ~5 minutes
```

---

## Understanding Results

### k6 Output Explained

```
scenarios: (100.00%) 1 scenario, 100 max VUs, 6m30s max duration

✓ status is 200
✓ has response message
✓ response time < 5s

checks.........................: 100.00% ✓ 2850      ✗ 0
data_received..................: 8.5 MB  21 kB/s
data_sent......................: 1.2 MB  3.0 kB/s
http_req_blocked...............: avg=1.2ms    min=1µs      med=3µs     max=234ms   p(95)=5µs
http_req_connecting............: avg=523µs    min=0s       med=0s      max=125ms   p(95)=0s
http_req_duration..............: avg=1.45s    min=234ms    med=1.2s    max=4.8s    p(95)=2.8s
  { expected_response:true }...: avg=1.45s    min=234ms    med=1.2s    max=4.8s    p(95)=2.8s
http_req_failed................: 0.00%   ✓ 0         ✗ 950
http_req_receiving.............: avg=125µs    min=22µs     med=98µs    max=2.3ms   p(95)=234µs
http_req_sending...............: avg=45µs     min=9µs      med=34µs    max=1.2ms   p(95)=89µs
http_req_tls_handshaking.......: avg=0s       min=0s       med=0s      max=0s      p(95)=0s
http_req_waiting...............: avg=1.45s    min=234ms    med=1.2s    max=4.8s    p(95)=2.8s
http_reqs......................: 950     2.37/s
iteration_duration.............: avg=4.5s     min=2.3s     med=4.2s    max=12s     p(95)=8.5s
iterations.....................: 950     2.37/s
vus............................: 1       min=1       max=100
vus_max........................: 100     min=100     max=100
```

### Key Metrics

| Metric | Description | Target |
|--------|-------------|--------|
| **http_req_duration** | Total request time | p(95) < 2s |
| **http_req_failed** | Failed requests % | < 5% |
| **http_reqs** | Total requests | (throughput) |
| **iterations** | Complete scenarios | (concurrency) |
| **checks** | Assertion pass rate | 100% |

### Custom Metrics

**Chat test:**
- `chat_response_time`: AI response generation time
- `successful_messages`: % of messages with valid AI response
- `errors`: Custom error tracking

**Scraping test:**
- `scrape_jobs_created`: Number of jobs enqueued
- `queue_acceptance_rate`: % of jobs not rate-limited
- `scrape_response_time`: Time to enqueue job

---

## Performance Targets

### Chat API

| Metric | Target | Acceptable | Poor |
|--------|--------|------------|------|
| **Response time (p95)** | < 2s | < 3s | > 3s |
| **Error rate** | < 1% | < 5% | > 5% |
| **Throughput** | 50 req/s | 30 req/s | < 30 req/s |
| **Concurrent users** | 100+ | 50+ | < 50 |

### Scraping API

| Metric | Target | Acceptable | Poor |
|--------|--------|------------|------|
| **Response time (p95)** | < 3s | < 5s | > 5s |
| **Queue acceptance** | 95%+ | 85%+ | < 85% |
| **Job throughput** | 20 jobs/s | 10 jobs/s | < 10 jobs/s |
| **Concurrent scrapers** | 20+ | 10+ | < 10 |

### Database Queries

| Metric | Target | Acceptable | Poor |
|--------|--------|------------|------|
| **Query time (p95)** | < 100ms | < 500ms | > 500ms |
| **Connection pool** | < 50% used | < 80% used | > 80% used |
| **Deadlocks** | 0 | < 5 | > 5 |

---

## Scaling Thresholds

### When to Scale

**Horizontal scaling triggers:**
- CPU usage > 70% sustained
- Memory usage > 80%
- Request queue depth > 100
- Error rate > 2%

**Vertical scaling triggers:**
- Database CPU > 80%
- Redis memory > 75%
- Disk I/O saturation

### Capacity Planning

**Current capacity (single instance):**
- Chat: ~100 concurrent users
- Scraping: ~20 concurrent jobs
- Database: ~500 connections

**Target capacity (with scaling):**
- Chat: 1,000+ concurrent users (10 instances)
- Scraping: 200+ concurrent jobs (10 workers)
- Database: 5,000+ connections (read replicas)

---

## Optimization Strategies

### Quick Wins

**1. Add caching:**
```typescript
// Cache frequent queries
const cachedResult = await redis.get(`product:${id}`);
if (cachedResult) return JSON.parse(cachedResult);

const result = await db.query('...');
await redis.set(`product:${id}`, JSON.stringify(result), 'EX', 3600);
```

**2. Connection pooling:**
```typescript
// Reuse database connections
const pool = new Pool({
  max: 20,
  min: 5,
  idleTimeoutMillis: 30000,
});
```

**3. Reduce payload size:**
```typescript
// Return only needed fields
await db.select('id', 'name', 'price').from('products');
// Instead of: SELECT *
```

**4. Batch operations:**
```typescript
// Batch inserts
await db.batchInsert('messages', messages, 100);
// Instead of: 100 individual inserts
```

### Advanced Optimizations

**1. Database indexing:**
```sql
CREATE INDEX idx_conversations_domain ON conversations(domain);
CREATE INDEX idx_messages_conversation ON messages(conversation_id);
```

**2. Query optimization:**
```sql
-- Use EXPLAIN ANALYZE to find slow queries
EXPLAIN ANALYZE SELECT * FROM conversations WHERE domain = 'example.com';
```

**3. Horizontal scaling:**
```yaml
# docker-compose.yml
services:
  app:
    deploy:
      replicas: 3

  nginx:
    image: nginx
    # Load balancer config
```

**4. CDN for static assets:**
```typescript
// next.config.js
module.exports = {
  assetPrefix: process.env.CDN_URL,
};
```

---

## CI/CD Integration

### GitHub Actions

```yaml
# .github/workflows/load-test.yml
name: Load Tests

on:
  schedule:
    - cron: '0 2 * * 0' # Weekly on Sundays at 2 AM
  workflow_dispatch: # Manual trigger

jobs:
  load-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Install k6
        run: |
          sudo apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
          echo "deb https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
          sudo apt-get update
          sudo apt-get install k6

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: '20.x'

      - name: Install dependencies
        run: npm ci

      - name: Start Redis
        run: docker run -d -p 6379:6379 redis

      - name: Start server
        run: npm run dev &

      - name: Wait for server
        run: npx wait-on http://localhost:3000

      - name: Run chat load test
        run: k6 run scripts/load-testing/load-test-chat.js

      - name: Run scraping load test
        run: k6 run scripts/load-testing/load-test-scraping.js

      - name: Upload results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: load-test-results
          path: load-test-*.json
```

---

## Troubleshooting

### High Error Rates

**Symptom:** Error rate > 5%

**Diagnosis:**
```bash
# Check server logs
docker-compose logs -f app

# Check database connections
psql -c "SELECT count(*) FROM pg_stat_activity;"

# Check Redis memory
redis-cli INFO memory
```

**Solutions:**
- Increase connection pool size
- Add database indexes
- Optimize slow queries
- Scale horizontally

### Slow Response Times

**Symptom:** p(95) > 3s

**Diagnosis:**
```bash
# Profile with Clinic.js
clinic doctor -- node server.js

# Check database slow queries
SELECT query, calls, mean_exec_time FROM pg_stat_statements ORDER BY mean_exec_time DESC LIMIT 10;
```

**Solutions:**
- Add caching layer
- Optimize database queries
- Use CDN for static assets
- Implement pagination

### Rate Limiting Kicking In

**Symptom:** Many 429 responses

**Expected:** Rate limiting is working!

**Adjustment:**
```typescript
// lib/rate-limit.ts
const rateLimit = new RateLimiter({
  points: 100, // Increase from 50
  duration: 60,
});
```

---

## Best Practices

### 1. Test Incrementally

```bash
# Start small
k6 run --vus 10 --duration 1m script.js

# Gradually increase
k6 run --vus 50 --duration 2m script.js
k6 run --vus 100 --duration 5m script.js
```

### 2. Use Realistic Data

```javascript
// Good: Variety of messages
const MESSAGES = [
  'Short query',
  'Medium length question about products',
  'Very long detailed question with multiple parts...',
];

// Bad: Same message every time
const message = 'test';
```

### 3. Monitor Production Metrics

Load test results should match production patterns:
- Similar error rates
- Similar response times
- Similar throughput

### 4. Run Regularly

- Weekly automated tests
- Before major releases
- After infrastructure changes

---

## Resources

- [k6 Documentation](https://k6.io/docs/)
- [k6 Test Types](https://k6.io/docs/test-types/)
- [Performance Testing Guide](https://k6.io/docs/testing-guides/)
- [k6 Cloud](https://k6.io/cloud/) - Managed service (optional)

---

## Quick Start Checklist

- [ ] Install k6
- [ ] Start dev server and Redis
- [ ] Run chat load test
- [ ] Run scraping load test
- [ ] Review results
- [ ] Identify bottlenecks
- [ ] Implement optimizations
- [ ] Re-test to verify improvements
- [ ] Add to CI/CD (weekly)

---

**Next Steps:**
1. Run both load tests to establish baseline
2. Document baseline metrics
3. Set performance budgets
4. Add monitoring for production
5. Schedule weekly automated tests
