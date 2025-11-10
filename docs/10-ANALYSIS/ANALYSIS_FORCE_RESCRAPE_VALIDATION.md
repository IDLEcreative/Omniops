# forceRescrape Flag Propagation Validation

**Type:** Analysis
**Status:** Active
**Last Updated:** 2025-11-08
**Verified For:** v0.1.0

## Purpose
This document tracks the `forceRescrape` flag's propagation path through the scraping system, from API call to worker process execution, ensuring proper boolean-to-string conversion and validation at each stage.

## Flag Path

1. **API Call** → `forceRescrape: true` (boolean)
2. **crawlWebsite()** → Converts to `"true"` (string)
3. **Worker Args** → Passed as args[8]
4. **Worker Parse** → Converts back to boolean
5. **Page Processing** → Used to bypass cache

## Validation Points

### Point 1: lib/scraper-api-crawl.ts:210-215
**Location:** `crawlWebsite()` function, before spawning worker

**Logs:**
```typescript
console.log(`[CrawlWebsite] Starting crawl for ${url}`);
console.log(`[CrawlWebsite] forceRescrape option: ${options?.forceRescrape} (type: ${typeof options?.forceRescrape})`);
console.log(`[CrawlWebsite] forceRescrape flag to worker: "${forceRescrapeFlag}" (string)`);
console.log(`[CrawlWebsite] Worker args[8]: ${forceRescrapeFlag}`);
```

**What to check:**
- Confirms original boolean value from API caller
- Shows conversion to string ("true" or "false")
- Confirms string is correctly placed in args[8]

### Point 2: lib/scraper-worker.js:121-125
**Location:** Worker process initialization, argument parsing

**Logs:**
```javascript
console.log(`[Worker ${jobId}] 🔍 forceRescrape Validation:`);
console.log(`[Worker ${jobId}]   - Arg received: "${forceRescrapeArg}" (type: ${typeof forceRescrapeArg})`);
console.log(`[Worker ${jobId}]   - Env var: "${process.env.SCRAPER_FORCE_RESCRAPE_ALL}"`);
console.log(`[Worker ${jobId}]   - Final FORCE_RESCRAPE: ${FORCE_RESCRAPE}`);
console.log(`[Worker ${jobId}]   - Will ${FORCE_RESCRAPE ? 'FORCE' : 'SKIP'} re-scraping recently scraped pages`);
```

**What to check:**
- Confirms string argument received from spawn
- Shows environment variable fallback (if set)
- Confirms final boolean value after parsing
- Clear indication of behavior (FORCE or SKIP)

### Point 3: lib/scraper-worker.js:1047-1053
**Location:** Page processing, embedding generation decision

**Logs:**
```javascript
const reason = !existingEmbeddings
  ? 'no existing embeddings'
  : existingEmbeddings.length === 0
  ? 'zero embeddings found'
  : 'FORCE_RESCRAPE=true';

console.log(`[Worker ${jobId}] 📝 Generating embeddings for ${pageUrl} (reason: ${reason})`);
```

**What to check:**
- Shows actual decision per page
- Confirms forceRescrape flag is being used
- Tracks which pages are regenerating embeddings

### Point 4: app/api/cron/refresh/route.ts:60-65
**Location:** Cron job handler, domain loop

**Logs:**
```typescript
console.log(`[Cron] 🔄 Refreshing domain: ${domain.domain}`);
console.log(`[Cron]   - forceRescrape: true (forcing full re-scrape)`);
console.log(`[Cron]   - maxPages: -1 (unlimited)`);
console.log(`[Cron]   - turboMode: true`);
```

**What to check:**
- Confirms cron job sets forceRescrape=true
- Shows all configuration options
- Confirms job started successfully

## How to Verify

### Method 1: Manual Trigger via Cron Endpoint
```bash
# Trigger cron refresh (requires CRON_SECRET)
curl -X GET http://localhost:3000/api/cron/refresh \
  -H "Authorization: Bearer $CRON_SECRET"
```

**Watch logs for sequence:**
1. [Cron] forceRescrape: true
2. [CrawlWebsite] forceRescrape flag: "true"
3. [Worker] Final FORCE_RESCRAPE: true
4. [Worker] Will FORCE re-scraping
5. [Worker] Generating embeddings (reason: FORCE_RESCRAPE=true)

### Method 2: Test Script
```bash
# Run the test script
npx tsx scripts/tests/test-force-rescrape-propagation.ts
```

**Expected output:**
- Test 1: Shows forceRescrape=true propagation
- Test 2: Shows forceRescrape=false (default) behavior

### Method 3: Manual API Call
```typescript
import { crawlWebsite } from '@/lib/scraper-api-crawl';

const jobId = await crawlWebsite('https://example.com', {
  maxPages: 5,
  forceRescrape: true, // Test with true
});
```

## Common Issues

### Issue 1: forceRescrape undefined
**Symptom:** Worker logs show `Arg received: "undefined"`
**Cause:** API caller didn't pass forceRescrape option
**Effect:** Defaults to false (SKIP re-scraping)
**Fix:** Ensure `forceRescrape: true` is explicitly passed

### Issue 2: String "false" becomes true
**Symptom:** Worker logs show `Will FORCE re-scraping` when expecting SKIP
**Cause:** Incorrect string parsing (checking truthy instead of === 'true')
**Effect:** Always forces re-scraping
**Fix:** Use strict equality check: `forceRescrapeArg === 'true'`

### Issue 3: Environment variable override
**Symptom:** forceRescrape=false but still forcing re-scraping
**Cause:** SCRAPER_FORCE_RESCRAPE_ALL env var is set to 'true'
**Effect:** Environment variable overrides API parameter
**Fix:** Unset environment variable if not desired globally

## Validation Chain

✅ **Boolean true → string "true" → boolean true** → Correct
✅ **Boolean false → string "false" → boolean false** → Correct
✅ **Undefined → string "false" → boolean false** → Correct (safe default)
❌ **String "false" → boolean true** → WRONG (fixed by === check)

## Testing Scenarios

### Scenario 1: Cron Job Refresh
**Input:** Cron trigger with forceRescrape=true
**Expected:**
- All pages re-scraped regardless of age
- Embeddings regenerated for all pages
- No "Skipping recently scraped page" logs

### Scenario 2: Manual Refresh with forceRescrape=false
**Input:** API call with forceRescrape=false
**Expected:**
- Pages scraped <24 hours ago are skipped
- "Skipping recently scraped page" logs appear
- Only stale pages are re-scraped

### Scenario 3: Initial Scrape (no forceRescrape)
**Input:** New domain, no forceRescrape option
**Expected:**
- Defaults to false
- All pages scraped (none exist yet)
- No skipping behavior

## Performance Impact

**With forceRescrape=true:**
- CPU: +200% (re-generates all embeddings)
- API Calls: +1000% (new embeddings for every page)
- Time: 2-3x longer (no cache usage)
- Use: Cron jobs, content updates

**With forceRescrape=false (default):**
- CPU: Normal (skips cached pages)
- API Calls: Minimal (only new/stale pages)
- Time: Normal (24h cache)
- Use: Regular scraping, incremental updates

## Related Documentation
- [ARCHITECTURE_SEARCH_SYSTEM.md](../01-ARCHITECTURE/ARCHITECTURE_SEARCH_SYSTEM.md)
- [lib/scraper-api-crawl.ts](../../lib/scraper-api-crawl.ts)
- [lib/scraper-worker.js](../../lib/scraper-worker.js)
- [app/api/cron/refresh/route.ts](../../app/api/cron/refresh/route.ts)

## Changelog

### 2025-11-08
- Initial documentation created
- Added comprehensive logging at all 4 validation points
- Created test script for manual verification
- Documented flag propagation path and common issues
