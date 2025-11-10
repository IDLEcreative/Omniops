# Forensic Analysis: Content Refresh & Scraping Workflow
**Type:** Analysis
**Status:** Complete
**Date:** 2025-11-08
**Investigator:** Claude (Forensic Mode)
**Scope:** End-to-end refresh workflow data integrity verification

---

## Executive Summary

This forensic investigation traced the complete flow from daily cron refresh through embedding generation and storage. The analysis revealed **7 critical issues** and **4 high-priority concerns** that could lead to data corruption, duplicate embeddings, or silent failures in production.

**Overall Assessment:** ⚠️ **NOT PRODUCTION READY** - Multiple critical gaps in error handling, missing components, and race condition vulnerabilities.

**Key Findings:**
- ✅ Recent embedding cleanup fix (lines 138-151 in crawl-processor.ts) is correctly placed
- ❌ **CRITICAL**: Bulk RPC functions (`bulk_upsert_scraped_pages`, `bulk_insert_embeddings`) **DO NOT EXIST** in migrations
- ❌ **CRITICAL**: Worker embeds pages directly, bypassing crawl-processor cleanup logic entirely
- ⚠️ Race conditions possible during concurrent refreshes of same domain
- ⚠️ Missing error handling could cause silent data corruption

---

## 1. Complete Flow Trace

### Flow Diagram

```
[Daily Cron @ 2 AM UTC]
  ↓
/api/cron/refresh (GET)
  ├─ Auth check (CRON_SECRET)
  ├─ Load active domains from DB
  └─ For each domain:
      ↓
crawlWebsite(domain, { forceRescrape: true, maxPages: -1 })
  ├─ Load organization config
  ├─ Discover sitemap URLs (optional)
  ├─ Spawn worker process
  └─ Returns jobId immediately
      ↓
[Worker Process: lib/scraper-worker.js]
  ├─ Parse args (line 118): forceRescrapeArg → FORCE_RESCRAPE
  ├─ Initialize services (Supabase, OpenAI, Redis)
  ├─ Create PlaywrightCrawler
  └─ For each URL:
      ├─ Check visited cache
      ├─ Check if recently scraped (unless FORCE_RESCRAPE)
      ├─ Scrape with Playwright
      ├─ Extract content
      ├─ **DIRECTLY UPSERT to scraped_pages** (lines 1016-1023)
      ├─ **DIRECTLY DELETE old embeddings** (lines 1050-1055)
      ├─ **DIRECTLY INSERT new embeddings** (lines 1084-1110)
      └─ Update Redis job status
      ↓
[Redis Job Queue]
  └─ Results stored for retrieval
      ↓
[Crawl Processor: app/api/scrape/crawl-processor.ts]
  ├─ processCrawlResults() polls Redis
  ├─ Waits for job completion
  ├─ **ATTEMPTS** bulk_upsert_scraped_pages (line 40)
  │   └─ **FAILS** - function doesn't exist
  ├─ **FALLBACK**: processPagesIndividually()
  └─ For each page:
      ├─ processPage()
      ├─ Upsert scraped_pages (lines 122-132)
      ├─ **DELETE old embeddings** (lines 142-150) ✅ NEW FIX
      ├─ Generate new embeddings (line 162)
      └─ **ATTEMPTS** bulk_insert_embeddings (line 179)
          └─ **FAILS** - function doesn't exist
          └─ **FALLBACK**: Regular INSERT (lines 184-190)
```

**CRITICAL DISCOVERY:**
The worker process (scraper-worker.js) handles embeddings **COMPLETELY INDEPENDENTLY** from crawl-processor.ts. This means:
- Worker generates embeddings at lines 1040-1110
- Crawl-processor ALSO tries to generate embeddings at lines 156-194
- **DOUBLE PROCESSING** or **NO PROCESSING** depending on execution timing

---

## 2. Critical Issues Found

### CRITICAL #1: Missing Bulk RPC Functions ⚠️⚠️⚠️

**Location:** Database migrations
**Issue:** `bulk_upsert_scraped_pages` and `bulk_insert_embeddings` RPC functions **DO NOT EXIST**

**Evidence:**
```bash
# Search results:
$ grep -r "CREATE.*FUNCTION.*bulk_upsert_scraped_pages" supabase/migrations/
# NO RESULTS

$ grep -r "CREATE.*FUNCTION.*bulk_insert_embeddings" supabase/migrations/
# NO RESULTS
```

**Impact:**
- Every bulk operation fails silently
- Falls back to individual INSERT/UPSERT for EVERY page
- Massive performance degradation (10-100x slower)
- crawl-processor.ts lines 40, 179 ALWAYS fail

**Code Attempting to Use Missing Functions:**
```typescript
// app/api/scrape/crawl-processor.ts:40
const { data: savedPages, error: batchPageError } = await supabase
  .rpc('bulk_upsert_scraped_pages', { pages: pageRecords });
// ❌ ALWAYS FAILS - function doesn't exist

// app/api/scrape/crawl-processor.ts:179
const { data: insertCount, error: embError } = await supabase
  .rpc('bulk_insert_embeddings', { embeddings: embeddingRecords });
// ❌ ALWAYS FAILS - function doesn't exist
```

**Fix Required:** Create these functions in migrations or remove the attempts entirely.

---

### CRITICAL #2: Dual Embedding Generation Paths ⚠️⚠️⚠️

**Location:** Worker vs Crawl Processor
**Issue:** Embeddings are generated in TWO completely separate code paths

**Path 1: Worker (scraper-worker.js lines 1030-1113)**
```javascript
// Worker DIRECTLY handles embeddings
const chunks = await splitIntoChunks(pageData.content, 3000, pageUrl, html);
const embeddings = await generateEmbeddings(chunks);

// DELETES old embeddings
await supabase.from('page_embeddings').delete().eq('page_id', savedPage.id);

// INSERTS new embeddings
await supabase.from('page_embeddings').insert(embeddingRecords);
```

**Path 2: Crawl Processor (crawl-processor.ts lines 138-194)**
```typescript
// Crawl processor ALSO handles embeddings
const { error: deleteError } = await supabase
  .from('page_embeddings')
  .delete()
  .eq('page_id', savedPage.id);

const chunks = splitIntoChunks(enrichedContent);
const embeddings = await generateEmbeddings(chunks);
await supabase.from('page_embeddings').insert(embeddingRecords);
```

**Race Condition Scenario:**
```
T0: Worker saves page to scraped_pages (gets page_id = ABC)
T1: Worker deletes old embeddings for page ABC
T2: Worker generates new embeddings
T3: Crawl processor polls Redis, sees job "completed"
T4: Crawl processor tries to process SAME pages
T5: Crawl processor deletes embeddings worker just inserted ❌
T6: Crawl processor re-generates embeddings (DUPLICATE WORK)
T7: Database has embeddings from crawl processor, not worker
```

**Questions:**
- Which system is supposed to handle embeddings?
- Why do both systems exist?
- Are they meant to run together or separately?

**Evidence of Confusion:**
- Worker has full embedding logic (lines 1040-1110)
- Crawl processor ALSO has full embedding logic (lines 138-194)
- No coordination mechanism between them

---

### CRITICAL #3: forceRescrape Flag May Not Propagate Correctly ⚠️⚠️

**Location:** lib/scraper-api-crawl.ts → lib/scraper-worker.js
**Issue:** Flag conversion and parsing may fail silently

**Propagation Chain:**
```typescript
// 1. Cron passes flag
crawlWebsite(url, { forceRescrape: true })

// 2. scraper-api-crawl.ts receives it (line 39)
forceRescrape?: boolean;

// 3. Converts to string for worker (line 218)
(options?.forceRescrape ? 'true' : 'false')

// 4. Worker receives as argv[8] (line 118)
const [,, jobId, url, maxPages, turboMode, configPreset, isOwnSite, sitemapUrlsJson, forceRescrapeArg] = process.argv;

// 5. Worker parses it (line 119)
const FORCE_RESCRAPE = (forceRescrapeArg === 'true') || (String(process.env.SCRAPER_FORCE_RESCRAPE_ALL || '').toLowerCase() === 'true');
```

**Potential Failure Points:**
1. **Missing argv**: If argv[8] is undefined → `forceRescrapeArg === undefined`
   - Expression becomes: `(undefined === 'true')` → `false` ❌
   - Force rescrape silently disabled!

2. **Type coercion issue**: Boolean true becomes string "true"
   - If passed as boolean instead of string: `(true === 'true')` → `false` ❌

3. **No validation**: Worker doesn't log the parsed value
   - Can't verify flag actually reached the worker

**Evidence:**
```javascript
// Worker line 119 - No logging of parsed value!
const FORCE_RESCRAPE = (forceRescrapeArg === 'true') || ...;

// Worker line 892 - Only logs when skipping
if (!FORCE_RESCRAPE) {
  // Check cache...
  console.log(`Skipping recently scraped page...`);
} else {
  console.log(`Force re-scrape enabled; bypassing recency checks...`);
}
```

**Fix Required:** Add explicit logging of FORCE_RESCRAPE value at worker startup.

---

### CRITICAL #4: No Locking for Concurrent Domain Refreshes ⚠️⚠️

**Location:** Cron refresh and worker spawning
**Issue:** Multiple refresh jobs can process same domain simultaneously

**Scenario:**
```
T0: Manual refresh triggered for example.com (Job A)
T1: Cron refresh triggers for example.com (Job B)
T2: Job A worker starts scraping /page-1
T3: Job B worker ALSO starts scraping /page-1
T4: Both workers save to scraped_pages (same URL)
T5: Job A deletes embeddings for page-1
T6: Job B deletes embeddings for page-1 (deletes Job A's work)
T7: Job A inserts embeddings
T8: Job B inserts embeddings (creates duplicates or overwrites)
```

**Evidence of Missing Locking:**
```typescript
// app/api/cron/refresh/route.ts:41
for (const domain of domains || []) {
  // NO CHECK if domain is already being refreshed
  const jobId = await crawlWebsite(`https://${domain.domain}`, {
    forceRescrape: true,
  });
}
```

**Worker Deduplication Only Per-Job:**
```javascript
// lib/scraper-worker.js:838
const visited = new Set(); // Per-job only!

// Line 885
if (visited.has(pageUrl)) {
  console.log(`Skipping duplicate: ${pageUrl}`);
  return;
}
```

**URLDeduplicator is Instance-Based:**
```typescript
// lib/url-deduplicator.ts:7
private processedUrls: Set<string> = new Set();
// Each worker has its own instance - no cross-job deduplication!
```

**Fix Required:**
- Add Redis-based domain lock before spawning worker
- Check if domain is already being refreshed
- Queue subsequent refreshes instead of running concurrently

---

### CRITICAL #5: Embedding Deletion Errors Are Ignored ⚠️⚠️

**Location:** crawl-processor.ts line 148, scraper-worker.js line 1055
**Issue:** Failed deletions only log warning, continue inserting

**Crawl Processor:**
```typescript
// app/api/scrape/crawl-processor.ts:142-150
const { error: deleteError } = await supabase
  .from('page_embeddings')
  .delete()
  .eq('page_id', savedPage.id);

if (deleteError) {
  console.warn('Warning: Failed to delete old embeddings:', deleteError);
  // Continue anyway - new embeddings will still be inserted ❌
}
```

**Worker:**
```javascript
// lib/scraper-worker.js:1050-1055
const deleteStart = Date.now();
await supabase
  .from('page_embeddings')
  .delete()
  .eq('page_id', savedPage.id);
console.log(`Deleted old embeddings in ${Date.now() - deleteStart}ms`);
// NO ERROR HANDLING AT ALL ❌
```

**Impact:**
- If delete fails (permissions, network, deadlock), old embeddings remain
- New embeddings are inserted anyway
- Result: **DUPLICATE EMBEDDINGS** in database
- CASCADE doesn't help because we're not deleting the page

**Scenarios Where Delete Fails:**
1. Database connection timeout
2. RLS policy violation
3. Lock conflict with another transaction
4. Database under heavy load
5. Network interruption

**Fix Required:**
- Make deletion errors FATAL
- Do not insert if deletion failed
- Add retry logic with exponential backoff

---

### CRITICAL #6: No Transaction Wrapping for Page + Embeddings ⚠️

**Location:** Worker lines 1016-1110
**Issue:** Page upsert and embedding operations not atomic

**Current Flow (No Transaction):**
```javascript
// 1. Upsert page (line 1016)
const { data: savedPage } = await supabase
  .from('scraped_pages')
  .upsert(dbRecord);

// 2. Delete embeddings (line 1052) - separate transaction!
await supabase.from('page_embeddings').delete();

// 3. Generate embeddings (lines 1046-1047) - can take 10-60 seconds!
const chunks = await splitIntoChunks(...);
const embeddings = await generateEmbeddings(chunks);

// 4. Insert embeddings (line 1101) - another separate transaction!
await supabase.from('page_embeddings').insert(embeddingRecords);
```

**Failure Scenarios:**
```
Scenario A: Worker crashes after delete, before insert
  Result: Page has ZERO embeddings ❌

Scenario B: Insert fails after successful delete
  Result: Page has ZERO embeddings ❌

Scenario C: Another process queries during generation
  Result: Search returns page with NO embeddings ❌

Scenario D: Delete succeeds, worker OOM during embedding generation
  Result: Page permanently loses embeddings ❌
```

**Impact:**
- Pages can exist without embeddings (invisible to search)
- No atomic rollback if anything fails
- Users see incomplete or missing results

**Fix Required:**
- Wrap in Supabase transaction
- Or: Generate embeddings FIRST, then atomic delete+insert
- Add retry logic for transient failures

---

### CRITICAL #7: CASCADE Only Triggers on DELETE, Not UPDATE ⚠️

**Location:** Database schema and UPSERT operations
**Issue:** UPSERT with `ON CONFLICT UPDATE` doesn't trigger CASCADE

**Schema:**
```sql
CREATE TABLE page_embeddings (
  page_id UUID REFERENCES scraped_pages(id) ON DELETE CASCADE
);
```

**UPSERT Behavior:**
```typescript
// scraper-worker.js:1018
const { data: savedPage } = await supabase
  .from('scraped_pages')
  .upsert(dbRecord, {
    onConflict: 'url',
    ignoreDuplicates: false  // This means UPDATE on conflict
  });
```

**What Actually Happens:**
```
IF page exists:
  UPDATE scraped_pages SET ... WHERE url = 'X'
  ↓
  CASCADE does NOT trigger (only on DELETE)
  ↓
  Old embeddings remain with old page_id
  ↓
  New embeddings inserted with SAME page_id
  ↓
  Result: DUPLICATE EMBEDDINGS ❌

IF page is new:
  INSERT into scraped_pages
  ↓
  No old embeddings exist
  ↓
  New embeddings inserted
  ↓
  Result: Correct ✅
```

**Evidence:**
The explicit DELETE (lines 1050-1055) is REQUIRED because CASCADE doesn't handle UPDATE.

**Verification:**
The recent fix (lines 138-151 in crawl-processor.ts) correctly handles this by explicitly deleting before upsert.

**Impact:**
- Without explicit DELETE, UPDATE operations would leave orphaned embeddings
- Recent fix correctly addresses this
- BUT: If DELETE fails (see Critical #5), we still get duplicates

---

## 3. High-Priority Issues

### HIGH #1: Missing Error Handling in Worker Init

**Location:** scraper-worker.js lines 224-262
**Issue:** Service initialization failures only partially handled

```javascript
// Lines 224-262
try {
  supabase = createClient(...);
  global.dbOptimizer = new DatabaseOptimizer(...);
  console.log('Supabase client initialized');
} catch (error) {
  // Reports to Redis and exits - GOOD ✅
  await reportInitError(errorMsg);
  process.exit(1);
}

try {
  openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
} catch (error) {
  // Reports to Redis and exits - GOOD ✅
}

// BUT: What if createClient() returns null instead of throwing?
// Lines 228-232 don't check for null return ❌
```

**Missing Checks:**
- Redis connection failure after initialization (line 283)
- Database connection works but RLS blocks access
- OpenAI API key invalid (succeeds but first call fails)

**Fix Required:** Add health checks after initialization.

---

### HIGH #2: No Retry Logic for Transient Failures

**Location:** Throughout worker and crawl-processor
**Issue:** Network errors, timeouts, and rate limits cause permanent failures

**Examples:**
```typescript
// No retry for page save
const { data: savedPage, error: pageError } = await supabase
  .from('scraped_pages')
  .upsert(dbRecord);

if (pageError) {
  console.error('Error saving page:', pageError);
  // Job continues, page is lost ❌
}

// No retry for embedding generation
const response = await openai.embeddings.create(...);
// If OpenAI rate limit hit → crash ❌
```

**Impact:**
- Transient network issues cause data loss
- Rate limits cause job failures
- Database timeouts lose pages permanently

**Fix Required:**
- Add exponential backoff retry for all external calls
- Implement circuit breaker for OpenAI API
- Add job retry mechanism in Redis

---

### HIGH #3: Memory Leak in Chunk Hash Cache

**Location:** scraper-worker.js lines 26, 666-680
**Issue:** Global `chunkHashCache` never cleared between jobs

```javascript
// Line 26 - GLOBAL CACHE
const chunkHashCache = new Map();

// Line 666 - Check duplicates
function isDuplicateChunk(chunkText, pageUrl) {
  const chunkHash = generateChunkHash(chunkText);

  if (chunkHashCache.has(chunkHash)) {
    return true; // Marked as duplicate
  }

  chunkHashCache.set(chunkHash, pageUrl); // Cache grows forever ❌
  return false;
}
```

**Issue:**
- Cache grows indefinitely across all pages
- Never cleared between jobs
- Worker process is long-lived (stays alive for entire crawl)
- For 1000 pages with 10 chunks each = 10,000 entries minimum

**Impact:**
- Increasing memory usage
- Eventually causes OOM
- Slows down hash lookups over time

**Fix Required:**
- Clear cache periodically (every N pages)
- Or: Use LRU cache with size limit
- Or: Clear after each page (defeats purpose of global dedup)

---

### HIGH #4: Inconsistent Chunk Sizes

**Location:** Multiple locations with different defaults
**Issue:** Different chunk sizes used in different code paths

**Evidence:**
```typescript
// app/api/scrape/services.ts:40 (crawl-processor)
const chunks = splitIntoChunks(enrichedContent);
// Uses default: 1000 chars

// lib/scraper-worker.js:1043
const chunks = await splitIntoChunks(pageData.content, 3000, pageUrl, html);
// Uses: 3000 chars

// lib/scraper-worker.js:713
async function splitIntoChunks(text, maxChunkSize = 1000, ...) {
// Default: 1000 chars
```

**Impact:**
- Worker generates larger chunks (3000 chars)
- Crawl processor generates smaller chunks (1000 chars)
- If both run, same content produces different number of embeddings
- Search results may vary depending on which system processed the page

**Fix Required:**
- Standardize chunk size across all code paths
- Document why 3000 was chosen (performance vs accuracy tradeoff)

---

## 4. Data Integrity Verification

### Scenario A: Page Updated (Content Changes)

**Expected Flow:**
```
1. Page exists with 10 embeddings (page_id = ABC)
2. Refresh runs, content changes
3. Worker/processor deletes 10 old embeddings
4. Worker/processor generates 12 new embeddings
5. Database has 12 embeddings for page ABC ✅
```

**Actual Flow (with issues):**
```
1. Page exists with 10 embeddings
2. Worker starts refresh
3. Worker deletes 10 embeddings ✅
4. Worker generates 12 new embeddings
5. Worker inserts 12 embeddings ✅
6. Crawl processor polls, sees job "completed"
7. Crawl processor reads from Redis (NO DATA - worker already saved)
8. Crawl processor tries bulk_upsert_scraped_pages → FAILS ❌
9. Crawl processor falls back to processPagesIndividually()
10. Crawl processor finds NO pages to process (worker already saved them)
11. Result: 12 embeddings ✅ BUT wasted processing time ❌
```

**OR (if both systems run):**
```
1-6. Same as above
7. Crawl processor somehow gets page data
8. Crawl processor deletes embeddings (deletes worker's 12 embeddings) ❌
9. Crawl processor generates new embeddings (different chunks!)
10. Database has crawl-processor's embeddings, not worker's ❌
```

**Verdict:** ⚠️ Works IF only worker runs, FAILS if both run.

---

### Scenario B: Page Deleted (Returns 404)

**Expected Flow:**
```
1. Page exists with embeddings
2. Refresh runs, page returns 404
3. Page marked as deleted or removed from database
4. CASCADE deletes embeddings
```

**Actual Flow:**
```
1. Page exists with embeddings
2. Worker tries to scrape, gets 404
3. Worker logs error (line 1167): "Error processing ${pageUrl}: ..."
4. concurrencyManager.recordError()
5. Worker continues to next page
6. OLD PAGE REMAINS IN DATABASE ❌
7. OLD EMBEDDINGS REMAIN ❌
8. Search still returns the 404'd page ❌
```

**Evidence:**
```javascript
// scraper-worker.js:1166-1169
} catch (error) {
  console.error(`Error processing ${pageUrl}:`, error);
  concurrencyManager.recordError();
  // No cleanup of old page! ❌
}
```

**Verdict:** ❌ **FAILS** - 404 pages are never cleaned up.

---

### Scenario C: Page Unchanged (Same Content Hash)

**Expected Flow:**
```
1. Page exists with embeddings
2. Refresh runs, content identical
3. System detects unchanged content (hash match)
4. Skip re-generation, keep existing embeddings
```

**Actual Flow (forceRescrape: false):**
```
1. Page exists, scraped 12 hours ago
2. Worker checks cache (line 892-918)
3. hoursSinceLastScrape = 12 < 24
4. Worker skips page ✅
5. No processing, existing embeddings preserved ✅
```

**Actual Flow (forceRescrape: true):**
```
1. Page exists with embeddings
2. Worker bypasses cache check (line 917)
3. Worker scrapes page, gets same content
4. Worker generates SAME content hash (line 465)
5. BUT: Worker doesn't check hash against database ❌
6. Worker deletes old embeddings
7. Worker re-generates identical embeddings (WASTED API CALLS) ❌
8. Worker inserts new embeddings
9. Result: Same embeddings, but unnecessary work ❌
```

**Evidence:**
```javascript
// Worker generates hash but doesn't use it for dedup!
const contentHash = generateContentHash(textContent); // Line 465
// Hash is stored in metadata but never checked against DB ❌
```

**Verdict:** ⚠️ Works but inefficient - no content-hash-based skip logic.

---

## 5. Missing Components

### Missing #1: Bulk RPC Functions

**Status:** ❌ **DO NOT EXIST**
**Impact:** Every bulk operation falls back to individual queries (10-100x slower)

**Required Functions:**

```sql
-- Missing from migrations
CREATE OR REPLACE FUNCTION bulk_upsert_scraped_pages(pages JSONB[])
RETURNS INTEGER AS $$
DECLARE
  inserted_count INTEGER := 0;
BEGIN
  -- Bulk upsert logic here
  RETURN inserted_count;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION bulk_insert_embeddings(embeddings JSONB[])
RETURNS INTEGER AS $$
DECLARE
  inserted_count INTEGER := 0;
BEGIN
  -- Bulk insert logic here
  RETURN inserted_count;
END;
$$ LANGUAGE plpgsql;
```

**Recommendation:** Either create these functions OR remove the RPC calls entirely and always use fallback.

---

### Missing #2: Content Hash Deduplication

**Status:** ❌ Not implemented in scraping logic
**Impact:** Unchanged pages are re-processed unnecessarily

**Current Behavior:**
- Content hash is generated (worker line 465)
- Hash is stored in metadata
- Hash is NEVER checked before re-scraping

**Required Logic:**
```javascript
// Check if content changed
const existingPage = await supabase
  .from('scraped_pages')
  .select('metadata')
  .eq('url', pageUrl)
  .single();

const existingHash = existingPage?.metadata?.contentHash;
const newHash = generateContentHash(textContent);

if (existingHash === newHash && !FORCE_RESCRAPE) {
  console.log('Content unchanged, skipping embedding regeneration');
  return; // Skip processing ✅
}
```

---

### Missing #3: Domain Refresh Lock

**Status:** ❌ Not implemented
**Impact:** Concurrent refreshes can corrupt data

**Required Implementation:**
```typescript
// Before spawning worker
const lockKey = `refresh:lock:${domain.domain}`;
const acquired = await redis.set(lockKey, jobId, 'EX', 3600, 'NX');

if (!acquired) {
  console.log(`Domain ${domain.domain} is already being refreshed`);
  return; // Skip or queue
}

// After worker completes
await redis.del(lockKey);
```

---

### Missing #4: Embedding Generation Health Checks

**Status:** ❌ Not implemented
**Impact:** Silent failures leave pages without embeddings

**Required Checks:**
```typescript
// After embedding generation
if (embeddings.length !== chunks.length) {
  throw new Error(`Embedding mismatch: ${embeddings.length} embeddings for ${chunks.length} chunks`);
}

// After insertion
const { count } = await supabase
  .from('page_embeddings')
  .select('id', { count: 'exact' })
  .eq('page_id', pageId);

if (count !== chunks.length) {
  throw new Error(`Embedding insertion failed: expected ${chunks.length}, got ${count}`);
}
```

---

## 6. Race Condition Analysis

### Race #1: Concurrent Domain Refreshes

**Scenario:**
```
T0: Manual refresh starts for example.com (Job A)
T1: Cron refresh starts for example.com (Job B)
T2: Job A worker saves page-1 (page_id = X1)
T3: Job B worker saves page-1 (page_id = X1 - same URL)
T4: Job A deletes embeddings for X1
T5: Job B deletes embeddings for X1 (deletes Job A's deletions)
T6: Job A inserts 10 embeddings
T7: Job B inserts 12 embeddings (different chunk size!)
T8: Database has 12 embeddings from Job B (Job A's work lost)
```

**Probability:** HIGH (cron runs every day, manual refreshes common)
**Fix:** Domain-level lock (see Missing #3)

---

### Race #2: Worker vs Crawl Processor

**Scenario:**
```
T0: Worker saves page to scraped_pages
T1: Worker deletes old embeddings
T2: Worker starts generating embeddings (10-60 seconds)
T3: Crawl processor polls Redis, sees "completed"
T4: Crawl processor tries to process same pages
T5: Crawl processor deletes embeddings (deletes worker's work)
T6: Worker inserts embeddings
T7: Crawl processor inserts embeddings (DUPLICATES or OVERWRITES)
```

**Probability:** MEDIUM (depends on timing)
**Fix:** Clarify which system should handle embeddings, disable the other

---

### Race #3: CASCADE vs Manual DELETE

**Scenario:**
```
T0: Worker starts deleting embeddings for page X
T1: Another process deletes scraped_pages record for page X
T2: CASCADE triggers, tries to delete same embeddings
T3: Deadlock or constraint violation possible
```

**Probability:** LOW (unlikely unless manual DB operations)
**Fix:** Use transaction isolation or advisory locks

---

## 7. Error Handling Gaps

### Gap #1: Worker Spawn Failure

**Location:** scraper-api-crawl.ts:222
**Current:**
```typescript
const child = spawn('node', workerArgs, { ... });
// Returns immediately, doesn't wait for worker to initialize
```

**Issue:** If worker fails to start, cron thinks job succeeded

**Fix:**
```typescript
// Wait for worker to confirm initialization
await waitForWorkerReady(jobId, timeout = 10000);
```

---

### Gap #2: Redis Unavailability

**Location:** Worker initialization
**Current:** Worker waits 10 seconds, then crashes

**Issue:** If Redis is down during cron, ALL domains fail

**Fix:**
- Add retry logic with exponential backoff
- Queue jobs for later retry
- Send alert on Redis unavailability

---

### Gap #3: OpenAI Rate Limiting

**Location:** Worker lines 791-807
**Current:** Batch processing with 100ms delay

**Issue:** If rate limit hit, entire job fails

**Fix:**
```typescript
// Add retry with exponential backoff
const embeddings = await retryWithBackoff(async () => {
  return await openai.embeddings.create(...);
}, { maxRetries: 5, initialDelay: 1000 });
```

---

### Gap #4: Partial Page Processing

**Location:** crawl-processor.ts:86
**Current:** Continues on individual page failure

**Issue:** No record of which pages failed, why

**Fix:**
- Store failed pages in separate table
- Add retry queue for failed pages
- Alert on high failure rate

---

## 8. Recommendations (Prioritized)

### Immediate (Before Production)

1. **[CRITICAL] Resolve Dual Embedding Paths**
   - Decide: Worker only OR Crawl processor only
   - Remove embedding logic from the other
   - Document the chosen approach
   - **Effort:** 2-4 hours
   - **Risk if not fixed:** Data corruption, duplicates

2. **[CRITICAL] Create or Remove Bulk RPC Functions**
   - Option A: Create the functions (better performance)
   - Option B: Remove RPC calls, always use fallback
   - **Effort:** 1-2 hours (Option B), 4-6 hours (Option A)
   - **Risk if not fixed:** 10-100x slower refreshes

3. **[CRITICAL] Add Domain Refresh Lock**
   - Prevent concurrent refreshes of same domain
   - Use Redis SET NX with expiry
   - **Effort:** 1-2 hours
   - **Risk if not fixed:** Data corruption, wasted resources

4. **[CRITICAL] Make Embedding Deletion Errors Fatal**
   - Do not insert if delete fails
   - Add retry logic
   - **Effort:** 1 hour
   - **Risk if not fixed:** Duplicate embeddings

5. **[CRITICAL] Add forceRescrape Logging**
   - Log parsed value in worker
   - Verify flag propagation
   - **Effort:** 15 minutes
   - **Risk if not fixed:** Refresh silently disabled

---

### High Priority (This Week)

6. **Add Transaction Wrapping**
   - Wrap page + embedding operations
   - Or: Generate first, then atomic delete+insert
   - **Effort:** 2-3 hours
   - **Risk if not fixed:** Pages without embeddings

7. **Implement 404 Cleanup**
   - Delete scraped_pages records for 404s
   - CASCADE will clean embeddings
   - **Effort:** 1 hour
   - **Risk if not fixed:** Stale pages in search results

8. **Add Content Hash Skip Logic**
   - Check hash before re-processing
   - Skip if unchanged
   - **Effort:** 2 hours
   - **Risk if not fixed:** Wasted API calls, slower refreshes

9. **Fix Memory Leak in Chunk Cache**
   - Use LRU cache or periodic clearing
   - **Effort:** 1 hour
   - **Risk if not fixed:** Worker OOM crashes

10. **Add Retry Logic for Transient Failures**
    - Exponential backoff for all external calls
    - Circuit breaker for OpenAI
    - **Effort:** 3-4 hours
    - **Risk if not fixed:** Data loss on network issues

---

### Medium Priority (This Month)

11. **Standardize Chunk Sizes**
    - Document decision (1000 vs 3000)
    - Use consistent size everywhere
    - **Effort:** 1 hour
    - **Risk if not fixed:** Inconsistent search results

12. **Add Embedding Health Checks**
    - Verify counts after generation
    - Verify counts after insertion
    - **Effort:** 1-2 hours
    - **Risk if not fixed:** Silent failures

13. **Add Worker Initialization Checks**
    - Health check after all services init
    - Verify database connectivity
    - Verify OpenAI API access
    - **Effort:** 1-2 hours
    - **Risk if not fixed:** Silent failures

14. **Add Failed Page Tracking**
    - Store failed pages for retry
    - Alert on high failure rate
    - **Effort:** 2-3 hours
    - **Risk if not fixed:** Lost data, no visibility

---

## 9. Testing Plan

Before deploying to production:

### Unit Tests Required

```typescript
describe('Embedding Cleanup', () => {
  it('should delete old embeddings before inserting new ones', async () => {
    // Setup: Page with 10 old embeddings
    // Act: Refresh page
    // Assert: Exactly N new embeddings, no old ones
  });

  it('should not insert if deletion fails', async () => {
    // Setup: Mock deletion failure
    // Act: Try to refresh
    // Assert: No new embeddings inserted, error thrown
  });
});

describe('forceRescrape Flag', () => {
  it('should bypass cache when true', async () => {
    // Setup: Page scraped 1 hour ago
    // Act: Refresh with forceRescrape: true
    // Assert: Page is re-scraped
  });

  it('should use cache when false', async () => {
    // Setup: Page scraped 1 hour ago
    // Act: Refresh with forceRescrape: false
    // Assert: Page is NOT re-scraped
  });
});

describe('Content Hash', () => {
  it('should skip processing if hash unchanged', async () => {
    // Setup: Page with content hash
    // Act: Re-scrape with identical content
    // Assert: No embeddings regenerated
  });
});
```

### Integration Tests Required

```typescript
describe('Refresh Workflow E2E', () => {
  it('should handle complete refresh cycle', async () => {
    // Setup: Domain with 10 pages
    // Act: Trigger cron refresh
    // Assert:
    // - All pages re-scraped
    // - Old embeddings deleted
    // - New embeddings inserted
    // - No duplicates
  });

  it('should prevent concurrent refreshes of same domain', async () => {
    // Setup: Domain with pages
    // Act: Start two refreshes simultaneously
    // Assert: Second refresh is queued or rejected
  });

  it('should handle worker failure gracefully', async () => {
    // Setup: Mock worker crash
    // Act: Trigger refresh
    // Assert: Job marked as failed, no partial data
  });
});
```

### Load Tests Required

```bash
# Test concurrent refreshes
for i in {1..10}; do
  curl -X POST /api/cron/refresh &
done

# Verify: No duplicates, no data corruption

# Test large domain refresh
# Domain with 1000+ pages
# Verify: Memory stays under 2GB, no crashes
```

---

## 10. Final Verdict

### Production Readiness: ❌ **NOT READY**

**Blocking Issues:**
1. Dual embedding generation paths (CRITICAL)
2. Missing bulk RPC functions (CRITICAL)
3. No domain refresh locking (CRITICAL)
4. Deletion errors ignored (CRITICAL)
5. Missing 404 cleanup (HIGH)

**Estimated Time to Production Ready:** 12-16 hours of focused work

**Risk Assessment:**
- **High Risk:** Data corruption from concurrent refreshes
- **High Risk:** Duplicate embeddings from failed deletions
- **Medium Risk:** Silent failures from missing components
- **Medium Risk:** Performance degradation from missing bulk functions

---

## 11. Appendix: Complete File References

### Files Analyzed
1. `/Users/jamesguy/Omniops/app/api/cron/refresh/route.ts` (167 lines)
2. `/Users/jamesguy/Omniops/lib/scraper-api-crawl.ts` (271 lines)
3. `/Users/jamesguy/Omniops/app/api/scrape/crawl-processor.ts` (196 lines)
4. `/Users/jamesguy/Omniops/lib/scraper-worker.js` (1316 lines)
5. `/Users/jamesguy/Omniops/app/api/scrape/services.ts` (138 lines)
6. `/Users/jamesguy/Omniops/lib/dual-embeddings/embedding-core.ts` (68 lines)
7. `/Users/jamesguy/Omniops/lib/url-deduplicator.ts` (214 lines)

### Database Schema References
- `scraped_pages` table (ON DELETE CASCADE to page_embeddings)
- `page_embeddings` table (referenced by page_id)
- Missing RPC functions: `bulk_upsert_scraped_pages`, `bulk_insert_embeddings`

### Critical Code Sections
- Worker embedding generation: lines 1030-1113
- Crawl processor embedding generation: lines 138-194
- forceRescrape propagation: scraper-api-crawl.ts:218, scraper-worker.js:119
- Embedding deletion: crawl-processor.ts:142-150, scraper-worker.js:1050-1055
- UPSERT operation: scraper-worker.js:1016-1023

---

**Report Generated:** 2025-11-08
**Next Review:** After implementing recommendations
**Status:** Awaiting remediation
