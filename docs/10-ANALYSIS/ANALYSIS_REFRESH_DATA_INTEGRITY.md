# Deep Analysis: Content Refresh Data Integrity

**Date**: 2025-11-08
**Analyst**: Claude
**Status**: Critical Issues Found ⚠️

---

## Executive Summary

**TL;DR**: The new parallel refresh system has **one critical bug** that will cause duplicate embeddings. The missing worker file will also cause the system to fail on first run.

**Severity**: 🔴 **HIGH** - Will cause data corruption and system failure
**Impact**: Duplicate embeddings, increased costs, search quality degradation
**Fix Required**: YES - Before production use

---

## 1. Flow Analysis: How Pages Are Refreshed

### Current Flow (Parallel System)

```
/api/cron/refresh (GET)
  ↓
crawlWebsite(domain, { forceRescrape: true })
  ↓
spawn('node', ['lib/scraper-worker.js', ...args]) ❌ FILE MISSING
  ↓
[Worker Process]
  ↓
Save to Redis job queue
  ↓
crawl-processor.ts:processCrawlResults()
  ↓
processPage(page, supabase)
  ↓
1. Upsert page to scraped_pages (lines 121-132)
2. Generate new embeddings (lines 142-147)
3. Insert embeddings via bulk_insert_embeddings (line 163) ⚠️ NO DELETE
```

### The Problem

**Line 163 in [crawl-processor.ts](../../app/api/scrape/crawl-processor.ts#L163)**:
```typescript
const { data: insertCount, error: embError } = await supabase
  .rpc('bulk_insert_embeddings', { embeddings: embeddingRecords });
```

**THIS DOES NOT DELETE OLD EMBEDDINGS FIRST!**

When a page is refreshed:
1. Old page is updated via `upsert` (keeps same `page_id`)
2. New embeddings are generated
3. New embeddings are **INSERTED** (not replaced)
4. **Result**: You now have OLD embeddings + NEW embeddings for the same page

---

## 2. Database CASCADE Behavior

### What CASCADE Does

```sql
CREATE TABLE page_embeddings (
  id UUID PRIMARY KEY,
  page_id UUID REFERENCES scraped_pages(id) ON DELETE CASCADE,
  ...
);
```

**CASCADE only fires on DELETE, not UPDATE:**

| Operation | CASCADE Fires? | Old Embeddings Deleted? |
|-----------|----------------|-------------------------|
| `DELETE FROM scraped_pages WHERE id = 'x'` | ✅ YES | ✅ YES |
| `UPDATE scraped_pages SET content = '...' WHERE id = 'x'` | ❌ NO | ❌ NO |
| `INSERT INTO scraped_pages ... ON CONFLICT DO UPDATE` | ❌ NO | ❌ NO |

**Upsert (INSERT ON CONFLICT UPDATE) does NOT trigger CASCADE!**

---

## 3. Comparison: Other Parts of the Codebase

### ✅ CORRECT Implementation: `dual-embeddings/embedding-core.ts`

```typescript
// Line 57 - MANUALLY deletes old embeddings before insert
await supabase.from('page_embeddings').delete().eq('page_id', pageId);

// Then inserts new ones
const { error } = await supabase.from('page_embeddings').insert(records);
```

**This is the RIGHT way to do it!**

### ❌ INCORRECT Implementation: `crawl-processor.ts`

```typescript
// Line 121-132 - Upserts page (no CASCADE trigger)
await supabase
  .from('scraped_pages')
  .upsert({
    url: page.url,
    domain_id: domainData?.id,
    title: page.title,
    content: page.content,
    // ...
  })

// Line 163 - Inserts embeddings WITHOUT deleting old ones
await supabase.rpc('bulk_insert_embeddings', { embeddings: embeddingRecords });
```

**Missing the delete step!**

---

## 4. Impact Analysis

### Scenario: Refreshing 4,491 Stale Pages

**Assumptions:**
- Average page has 10 embeddings
- System runs daily refresh

**After 1 refresh**:
- Old embeddings: 44,910
- New embeddings: 44,910
- **Total: 89,820 embeddings** (should be 44,910)

**After 7 days (1 week)**:
- **Total: 359,280 embeddings** (should be 44,910)
- **8x duplication!**

**After 30 days (1 month)**:
- **Total: 1,392,210 embeddings**
- **31x duplication!**

### Consequences

1. **Database Bloat**: 30x more storage used than needed
2. **Cost Increase**: OpenAI embedding costs multiplied by refresh frequency
3. **Search Quality Degradation**: Search queries match against duplicate/outdated content
4. **Performance Impact**: Vector search slows down with 30x more vectors to compare
5. **Inconsistent Results**: Same query returns old + new versions of same page

---

## 5. Second Critical Issue: Missing Worker File

### The Problem

[scraper-api-crawl.ts:203](../../lib/scraper-api-crawl.ts#L203):
```typescript
const crawlerPath = join(process.cwd(), 'lib', 'scraper-worker.js');

if (!fs.existsSync(crawlerPath)) {
  throw new Error(`Worker script not found at ${crawlerPath}`);
}
```

**Current state:**
```bash
$ ls -la lib/scraper-worker*
-rw-r--r--  lib/scraper-worker-enhanced.js.integrated
-rw-r--r--  lib/scraper-worker.js.backup-20250911-163216
```

**`lib/scraper-worker.js` DOES NOT EXIST!**

### Impact

**The parallel refresh system will crash immediately** with:
```
Error: Worker script not found at /path/to/lib/scraper-worker.js
```

The daily cron job at 2 AM will fail every time.

---

## 6. Verification Test (Recommended)

```bash
# Create a test to verify embedding cleanup
npx tsx scripts/tests/test-embedding-cleanup.ts
```

```typescript
// Pseudo-code for test
async function testEmbeddingCleanup() {
  // 1. Scrape a page
  const jobId1 = await crawlWebsite('https://example.com/test-page');
  await waitForCompletion(jobId1);

  // 2. Count embeddings
  const { count: count1 } = await supabase
    .from('page_embeddings')
    .select('*', { count: 'exact', head: true })
    .eq('url', 'https://example.com/test-page');

  // 3. Re-scrape the same page
  const jobId2 = await crawlWebsite('https://example.com/test-page', {
    forceRescrape: true
  });
  await waitForCompletion(jobId2);

  // 4. Count embeddings again
  const { count: count2 } = await supabase
    .from('page_embeddings')
    .select('*', { count: 'exact', head: true })
    .eq('url', 'https://example.com/test-page');

  // 5. SHOULD BE EQUAL (not doubled)
  if (count2 > count1) {
    console.error(`❌ DUPLICATE EMBEDDINGS: ${count1} → ${count2}`);
    console.error('Old embeddings were not deleted!');
  } else {
    console.log(`✅ Correct: ${count1} → ${count2} (no duplicates)`);
  }
}
```

---

## 7. Recommended Fixes

### Fix 1: Add Embedding Cleanup to `crawl-processor.ts`

**File**: `app/api/scrape/crawl-processor.ts`
**Lines**: 110-180

```typescript
async function processPage(page: any, supabase: any) {
  // ... existing code ...

  // Save page
  const { data: savedPage, error: pageError } = await supabase
    .from('scraped_pages')
    .upsert({
      url: page.url,
      domain_id: domainData?.id,
      title: page.title,
      content: page.content,
      metadata: page.metadata,
      last_scraped_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (pageError) throw new Error(`Error saving page: ${pageError.message}`);

  // 🔧 FIX: DELETE old embeddings before inserting new ones
  if (savedPage?.id) {
    console.log(`Deleting old embeddings for page ${savedPage.id}`);
    const { error: deleteError } = await supabase
      .from('page_embeddings')
      .delete()
      .eq('page_id', savedPage.id);

    if (deleteError) {
      console.error('Warning: Failed to delete old embeddings:', deleteError);
      // Continue anyway - insert will still work
    }
  }

  // Clear chunk cache for this page
  clearChunkCache();

  // Generate embeddings...
  // ... rest of existing code ...
}
```

### Fix 2: Create Missing Worker File

**Option A**: Restore from backup
```bash
cp lib/scraper-worker.js.backup-20250911-163216 lib/scraper-worker.js
```

**Option B**: Use the enhanced version
```bash
cp lib/scraper-worker-enhanced.js.integrated lib/scraper-worker.js
```

**Option C**: Build from TypeScript
```bash
# Create lib/workers/scraper-worker.ts if it doesn't exist
# Then compile it
tsc lib/workers/scraper-worker.ts --outDir lib/
```

### Fix 3: Add Integration Test

Create `__tests__/integration/test-refresh-no-duplicates.test.ts`:

```typescript
describe('Content Refresh - No Duplicate Embeddings', () => {
  it('should not create duplicate embeddings on refresh', async () => {
    // Test implementation from section 6
  });
});
```

---

## 8. Long-Term Recommendations

### 1. Add Database Constraint

Prevent duplicates at the database level:

```sql
-- Add unique constraint to prevent duplicate embeddings for same chunk
CREATE UNIQUE INDEX idx_page_embeddings_unique_chunk
ON page_embeddings(page_id, chunk_text);
```

**Caveat**: This will cause INSERT errors if cleanup fails. Might be too strict.

### 2. Use Transaction for Page + Embeddings

Wrap the entire operation in a transaction:

```typescript
await supabase.rpc('upsert_page_with_embeddings', {
  page_data: { ... },
  embeddings_data: [ ... ]
});
```

SQL function would handle:
1. Upsert page
2. Delete old embeddings
3. Insert new embeddings
All in one atomic transaction.

### 3. Add Monitoring

Track embedding counts per page:

```sql
-- Alert if any page has >20 embeddings (likely duplicates)
SELECT page_id, url, COUNT(*) as embedding_count
FROM page_embeddings
JOIN scraped_pages ON page_embeddings.page_id = scraped_pages.id
GROUP BY page_id, url
HAVING COUNT(*) > 20
ORDER BY embedding_count DESC;
```

---

## 9. Summary

| Issue | Severity | Impact | Fix Difficulty |
|-------|----------|--------|----------------|
| **Duplicate Embeddings** | 🔴 Critical | Data corruption, 30x bloat | 🟢 Easy (10 lines) |
| **Missing Worker File** | 🔴 Critical | System won't start | 🟢 Easy (copy file) |

**Action Required**: Both fixes must be applied before the 2 AM cron job runs.

**Estimated Fix Time**: 15 minutes
**Testing Time**: 30 minutes
**Total Time**: 45 minutes

---

## 10. Verification Checklist

Before deploying:

- [ ] Added embedding delete to `crawl-processor.ts`
- [ ] Restored `lib/scraper-worker.js` from backup
- [ ] Ran embedding cleanup test (no duplicates)
- [ ] Verified worker file exists and is executable
- [ ] Tested manual refresh on 1 page
- [ ] Checked database for no duplicate embeddings
- [ ] Deployed fixes to production
- [ ] Monitored first automated refresh at 2 AM

---

**Next Steps**: Apply fixes immediately before system runs at 2 AM UTC.
