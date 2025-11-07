# Performance Simulation Tests

**Type:** Testing Documentation
**Status:** Active
**Last Updated:** 2025-11-07
**Purpose:** Comprehensive guide for running and understanding performance simulation tests

## Overview

This directory contains **executable performance simulation tests** that measure real-world performance metrics for cache, rate limiting, database queries, and mobile UX. These tests simulate production scenarios and provide quantifiable measurements.

## Test Suite

### 1. Cache Hit Rate Simulation (`simulate-cache-performance.ts`)

**Purpose:** Measure Redis cache performance and hit rates

**What It Tests:**
- Cache miss performance (first request)
- Cache hit performance (subsequent requests)
- Cache hit rate percentage
- Performance improvement ratio
- Cache invalidation behavior

**Expected Results:**
- First request (cache miss): ~100-300ms
- Cached requests (cache hits): ~5-50ms
- Cache hit rate: >90%
- Performance improvement: >5x faster

**Usage:**
```bash
npx tsx scripts/tests/simulate-cache-performance.ts
```

**Sample Output:**
```
🔬 Cache Hit Rate Simulation Test
=====================================

✅ Redis connection established
🧹 Clearing existing cache...
✅ Cache cleared

📊 Making 20 identical requests...

Request  1:  234ms ❌ MISS (DB fetch: 152ms)
Request  2:   12ms ✅ HIT
Request  3:    8ms ✅ HIT
...
Request 20:   15ms ✅ HIT

📈 Results:
=====================================
Total Requests:           20
Cache Hits:               19 (95.0%)
Cache Misses:             1

First Request (MISS):     234ms
Avg Cached Request (HIT): 11.58ms
Min Cached Request:       8ms
Max Cached Request:       15ms

Performance Improvement:  20.2x faster
Time Saved:               4225ms total

✓ Verification:
=====================================
✅ Cache hit rate >= 90%: 95.0%
✅ First request > 100ms: 234ms
✅ Avg cache hit < 100ms: 11.58ms
✅ Performance improvement > 2x: 20.2x

✅ All tests passed!
```

**Exit Codes:**
- `0` - All tests passed
- `1` - Some tests failed

---

### 2. Rate Limiting Simulation (`simulate-rate-limiting.ts`)

**Purpose:** Verify rate limiting enforcement across different endpoints

**What It Tests:**
- Dashboard endpoint (100 req/min limit)
- Bulk actions endpoint (10 req/min limit)
- Analytics endpoint (30 req/min limit)
- Export endpoint (5 req/5min limit)
- HTTP 429 response correctness
- Rate limit headers presence

**Expected Results:**
- Requests 1-N (N=limit): 200 OK
- Requests N+1 onwards: 429 Too Many Requests
- Headers: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `Retry-After`

**Usage:**
```bash
npx tsx scripts/tests/simulate-rate-limiting.ts
```

**Sample Output:**
```
🔬 Rate Limiting Simulation Test
=====================================

✅ Redis connection established

🧪 Test 1: Dashboard Endpoint
────────────────────────────────────────────────────────────
📊 Testing dashboard endpoint (100 req/60s)

Request   1: ✅ Allowed
Request  20: ✅ Allowed
...
Request 100: ✅ Allowed
Request 101: ⛔ Rate Limited
  Message: Too many requests to dashboard. Please try again in 58 seconds.
  Retry After: 58s
  Rate Limit: 100
  Remaining: 0
  Reset: 2025-11-07T22:45:00.000Z

📈 Test Summary:
=====================================

DASHBOARD
  Limit:               100 requests
  Successful:          100
  Rate Limited:        50
  First Limited At:    Request #101
  Retry-After Header:  ✅
  Rate Limit Headers:  ✅

✓ Verification:
=====================================
✅ Dashboard: 100 requests allowed
✅ Bulk Actions: 10 requests allowed
✅ Analytics: 30 requests allowed
✅ Export: 5 requests allowed
✅ dashboard: Has retry headers
✅ dashboard: Has rate limit headers

✅ All tests passed!
```

**Exit Codes:**
- `0` - All rate limits enforced correctly
- `1` - Rate limiting not working as expected

---

### 3. Database Query Performance Test (`simulate-query-performance.ts`)

**Purpose:** Measure real database query performance with RLS and indexes

**What It Tests:**
- Simple count queries
- Indexed queries with filters
- Ordering and pagination
- N+1 vs batched query patterns
- Aggregation queries
- Date range queries

**Expected Results:**
- Average query time: <200ms
- All queries: <500ms
- Indexed queries: <100ms
- Batched queries: >2x faster than N+1

**Usage:**
```bash
npx tsx scripts/tests/simulate-query-performance.ts
```

**Sample Output:**
```
🔬 Database Query Performance Simulation
=====================================

✅ Database connection established

🧪 Test 1: Simple Conversation Count
────────────────────────────────────────────────────────────
Duration: 45ms
Rows: 1523

🧪 Test 2: Recent Conversations (Indexed)
────────────────────────────────────────────────────────────
Duration: 23ms
Rows: 20

🧪 Test 4: Batched Query vs N+1 Pattern
────────────────────────────────────────────────────────────
Testing N+1 pattern (sequential)...
N+1 Duration: 342ms (10 queries)
Messages: 87

Testing batched query...
Batched Duration: 34ms (1 query)
Messages: 87
Performance Improvement: 10.06x faster

📈 Performance Summary:
=====================================

Count all conversations
  Duration:  45ms
  Rows:      1523

Recent 20 conversations (indexed)
  Duration:  23ms
  Rows:      20

N+1 message fetch (sequential)
  Duration:  342ms
  Rows:      87
  Avg/Row:   3.931ms

Batched message fetch (optimized)
  Duration:  34ms
  Rows:      87
  Avg/Row:   0.391ms

📊 Statistics:
=====================================
Average query time:   89.33ms
Fastest query:        Recent 20 conversations (indexed) (23ms)
Slowest query:        N+1 message fetch (sequential) (342ms)

✓ Verification:
=====================================
✅ Average query time < 200ms: 89.33ms
✅ All queries < 500ms: Max: 342ms
✅ Indexed queries < 100ms: Checked
✅ Batched query faster than N+1: 10.06x faster

✅ All performance tests passed!
```

**Exit Codes:**
- `0` - All performance benchmarks met
- `1` - Performance issues detected

---

### 4. Mobile UX Simulation (`simulate-mobile-ux.ts`)

**Purpose:** Test responsive design and mobile user experience

**What It Tests:**
- Mobile viewport (375px - iPhone SE)
- Tablet viewport (768px - iPad Mini)
- Desktop viewport (1440px)
- Horizontal scrolling detection
- Mobile toggle visibility
- Side-by-side layout on larger screens
- Touch target sizes (44x44px minimum)

**Expected Results:**
- No horizontal scroll on any viewport
- Mobile toggle visible on <768px
- Side-by-side layout on ≥768px
- All touch targets ≥44px

**Prerequisites:**
- Dev server running on `http://localhost:3000`
- Playwright installed (`npm install -D playwright`)

**Usage:**
```bash
# Start dev server first
npm run dev

# In another terminal
npx tsx scripts/tests/simulate-mobile-ux.ts
```

**Sample Output:**
```
🔬 Mobile Responsive UX Simulation
=====================================

🔍 Checking if dev server is running...
✅ Dev server is running (status: 200)

🚀 Launching browser...
✅ Browser launched

📱 Testing Mobile (iPhone SE) (375x667)
────────────────────────────────────────────────────────────
✅ Viewport set to 375x667
Loading /dashboard/conversations...
Page status: 200
Horizontal scroll: ✅ No (GOOD)
Mobile toggle: ✅ Visible
Side-by-side layout: ❌ No
Touch targets sufficient: ✅ Yes

📱 Testing Tablet (iPad Mini) (768x1024)
────────────────────────────────────────────────────────────
✅ Viewport set to 768x1024
Loading /dashboard/conversations...
Page status: 200
Horizontal scroll: ✅ No (GOOD)
Mobile toggle: ❌ Not visible
Side-by-side layout: ✅ Yes
Touch targets sufficient: ✅ Yes

📈 Test Summary:
=====================================

MOBILE (IPHONE SE)
  Viewport:            375x667
  Page Loaded:         ✅
  No H-Scroll:         ✅
  Mobile Toggle:       ✅
  Side-by-Side:        ❌
  Touch Targets:       ✅

TABLET (IPAD MINI)
  Viewport:            768x1024
  Page Loaded:         ✅
  No H-Scroll:         ✅
  Mobile Toggle:       ❌
  Side-by-Side:        ✅
  Touch Targets:       ✅

✓ Verification:
=====================================
✅ Mobile: No horizontal scroll
✅ Mobile: Touch targets sufficient
✅ Tablet: No horizontal scroll
✅ Desktop: No horizontal scroll
✅ All pages loaded successfully
✅ No layout errors detected

📊 Responsive Design Insights:
=====================================
✅ Mobile toggle correctly shows on small screens only
✅ Side-by-side layout enabled on larger screens
✅ No horizontal scroll issues on any viewport

✅ All mobile UX tests passed!
```

**Exit Codes:**
- `0` - All responsive design tests passed
- `1` - Responsive issues detected

---

## Running All Tests

### Option 1: Run All Tests with Script

```bash
bash scripts/tests/run-performance-simulations.sh
```

This will run all 4 tests in sequence and provide a summary.

**Output:**
```
=====================================
Performance Simulation Test Suite
=====================================

[1/4] Running Cache Hit Rate Simulation...
✅ Cache Performance Test PASSED

[2/4] Running Rate Limiting Simulation...
✅ Rate Limiting Test PASSED

[3/4] Running Database Query Performance Test...
✅ Query Performance Test PASSED

[4/4] Running Mobile UX Simulation...
Note: Dev server must be running on port 3000
✅ Mobile UX Test PASSED

=====================================
Test Summary
=====================================
Total Tests:   4
Passed:        4
Failed:        0

✅ All performance tests passed!
```

### Option 2: Run Individual Tests

```bash
# Cache test
npx tsx scripts/tests/simulate-cache-performance.ts

# Rate limiting test
npx tsx scripts/tests/simulate-rate-limiting.ts

# Database query test
npx tsx scripts/tests/simulate-query-performance.ts

# Mobile UX test (requires dev server)
npx tsx scripts/tests/simulate-mobile-ux.ts
```

## Prerequisites

### All Tests
- Node.js and npm installed
- Project dependencies installed (`npm install`)
- Environment variables configured (`.env.local`)

### Cache & Rate Limiting Tests
- Redis running locally or via Docker
  ```bash
  docker run -d -p 6379:6379 redis:alpine
  # OR
  docker-compose up -d redis
  ```

### Database Query Test
- Supabase environment variables set:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`

### Mobile UX Test
- Development server running on port 3000
  ```bash
  npm run dev
  ```
- Playwright installed
  ```bash
  npm install -D playwright
  npx playwright install chromium
  ```

## Troubleshooting

### Redis Connection Errors
```
Error: Redis connection failed
```

**Solution:**
```bash
# Check if Redis is running
docker ps | grep redis

# Start Redis
docker-compose up -d redis
```

### Supabase Connection Errors
```
Error: Database service is currently unavailable
```

**Solution:**
- Verify `.env.local` has Supabase credentials
- Check Supabase project is running
- Verify network connection

### Mobile UX Test Fails
```
❌ Dev server is not running!
```

**Solution:**
```bash
# Start dev server in another terminal
npm run dev
```

### TypeScript Errors
```
Cannot find module '@/lib/...'
```

**Solution:**
- Use `npx tsx` instead of `tsc` to run tests
- `tsx` handles path aliases correctly at runtime

## Performance Benchmarks

### Expected Performance

| Metric | Target | Typical |
|--------|--------|---------|
| Cache Hit Rate | >90% | 95-99% |
| Cache Hit Speed | <50ms | 10-30ms |
| Rate Limit Enforcement | 100% | 100% |
| Database Query Avg | <200ms | 50-150ms |
| Indexed Query | <100ms | 10-50ms |
| Batched vs N+1 | >2x | 5-15x |
| No Horizontal Scroll | 100% | 100% |
| Touch Target Size | >44px | 48-56px |

### Interpreting Results

**Cache Performance:**
- >95% hit rate: Excellent
- 85-95% hit rate: Good
- <85% hit rate: Investigate TTL settings

**Database Queries:**
- <100ms average: Excellent
- 100-200ms average: Good
- >200ms average: Investigate indexes

**Rate Limiting:**
- Must be 100% accurate
- Any failures indicate Redis issues

**Mobile UX:**
- No horizontal scroll: Critical
- Touch targets <44px: Accessibility issue

## Integration with CI/CD

These tests can be added to GitHub Actions:

```yaml
name: Performance Tests

on: [push, pull_request]

jobs:
  performance:
    runs-on: ubuntu-latest

    services:
      redis:
        image: redis:alpine
        ports:
          - 6379:6379

    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'

      - run: npm ci
      - run: npx playwright install chromium

      - name: Run performance tests
        env:
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY }}
          SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}
        run: |
          npx tsx scripts/tests/simulate-cache-performance.ts
          npx tsx scripts/tests/simulate-rate-limiting.ts
          npx tsx scripts/tests/simulate-query-performance.ts
```

## Related Documentation

- [Performance Optimization Guide](../../docs/09-REFERENCE/REFERENCE_PERFORMANCE_OPTIMIZATION.md)
- [Database Schema](../../docs/09-REFERENCE/REFERENCE_DATABASE_SCHEMA.md)
- [Caching Strategy](../../lib/cache/README.md)
- [Rate Limiting](../../lib/middleware/README.md)

## Maintenance

**Update Frequency:** Run weekly or before major releases
**Last Run:** Check git history for test modifications
**Owner:** DevOps / QA Team

---

**Questions?** See [scripts/tests/README.md](./README.md) for general testing documentation.
