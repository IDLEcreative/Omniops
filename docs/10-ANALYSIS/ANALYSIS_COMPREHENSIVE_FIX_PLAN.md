# Comprehensive Fix Plan - Content Refresh System

**Date**: 2025-11-08
**Status**: Implementation in Progress
**Estimated Time**: 12-16 hours

---

## Executive Summary

The forensic analysis revealed the core issue: **The worker is complete and self-contained, but crawl-processor tries to re-process everything, creating race conditions.**

### Root Cause

**Worker (scraper-worker.js):**
- ✅ Scrapes pages
- ✅ Saves to scraped_pages
- ✅ Deletes old embeddings (line 1051)
- ✅ Generates new embeddings
- ✅ Inserts embeddings

**CrawlProcessor (crawl-processor.ts):**
- ❌ Polls Redis for results
- ❌ ALSO deletes embeddings (line 142)
- ❌ ALSO generates embeddings (line 157)
- ❌ ALSO inserts embeddings (line 163)

**Result**: Both systems fighting over the same data!

---

## The Fix Strategy

**Option Chosen**: Make worker the single source of truth, disable processor's redundant logic

### Why This Approach?

1. **Worker is battle-tested** - Has been running in production
2. **Worker has better logic** - Already handles FORCE_RESCRAPE correctly
3. **Worker has optimization** - Uses dbOptimizer for bulk operations
4. **Less risky** - Remove conflicting code rather than merge two systems

---

## Implementation Plan

### Phase 1: Disable Conflicting Logic (HIGH PRIORITY)

**Task 1.1: Convert processCrawlResults to Read-Only**
- File: `app/api/scrape/crawl-processor.ts`
- Action: Comment out embedding generation logic
- Keep: Status polling and job monitoring
- Remove: processPage() function entirely

**Task 1.2: Add Logging to Verify**
- Add console.log statements showing worker handled embeddings
- Confirm processor doesn't try to re-process

### Phase 2: Create Missing Database Functions

**Task 2.1: Create bulk_upsert_scraped_pages**
```sql
CREATE OR REPLACE FUNCTION bulk_upsert_scraped_pages(pages JSONB)
RETURNS TABLE(id UUID, url TEXT) AS $$
BEGIN
  RETURN QUERY
  INSERT INTO scraped_pages (
    url, domain_id, title, content, metadata,
    last_scraped_at, status
  )
  SELECT
    (p->>'url')::TEXT,
    (p->>'domain_id')::UUID,
    (p->>'title')::TEXT,
    (p->>'content')::TEXT,
    (p->'metadata')::JSONB,
    (p->>'last_scraped_at')::TIMESTAMPTZ,
    COALESCE((p->>'status')::TEXT, 'completed')
  FROM jsonb_array_elements(pages) p
  ON CONFLICT (domain_id, url) DO UPDATE SET
    title = EXCLUDED.title,
    content = EXCLUDED.content,
    metadata = EXCLUDED.metadata,
    last_scraped_at = EXCLUDED.last_scraped_at,
    status = EXCLUDED.status
  RETURNING scraped_pages.id, scraped_pages.url;
END;
$$ LANGUAGE plpgsql;
```

**Task 2.2: Create bulk_insert_embeddings**
```sql
CREATE OR REPLACE FUNCTION bulk_insert_embeddings(embeddings JSONB)
RETURNS INTEGER AS $$
DECLARE
  inserted_count INTEGER;
BEGIN
  INSERT INTO page_embeddings (
    page_id, domain_id, chunk_text, embedding, metadata
  )
  SELECT
    (e->>'page_id')::UUID,
    (e->>'domain_id')::UUID,
    (e->>'chunk_text')::TEXT,
    (e->>'embedding')::vector(1536),
    (e->'metadata')::JSONB
  FROM jsonb_array_elements(embeddings) e;

  GET DIAGNOSTICS inserted_count = ROW_COUNT;
  RETURN inserted_count;
END;
$$ LANGUAGE plpgsql;
```

### Phase 3: Add Domain Refresh Lock

**Task 3.1: Create Redis-based lock**
- File: `lib/domain-refresh-lock.ts` (NEW)
- Prevents concurrent refreshes of same domain
- 5-minute TTL
- Automatic release on completion

```typescript
export class DomainRefreshLock {
  async acquire(domainId: string): Promise<boolean> {
    const key = `domain:refresh:lock:${domainId}`;
    const acquired = await redis.set(key, '1', 'EX', 300, 'NX');
    return acquired === 'OK';
  }

  async release(domainId: string): Promise<void> {
    await redis.del(`domain:refresh:lock:${domainId}`);
  }
}
```

**Task 3.2: Use lock in cron handler**
- Wrap crawlWebsite() call with lock
- Skip domain if locked
- Release lock on completion or error

### Phase 4: Make Deletion Errors Fatal ✅ COMPLETE

**Status**: ✅ COMPLETE
**Completed**: 2025-11-08
**Implementation Time**: 45 minutes

**Implementation:**
- ✅ Added 3-attempt retry logic with exponential backoff (1s, 2s, 3s)
- ✅ Fatal error thrown after all retries exhausted
- ✅ Page marked as 'failed' (not 'deleted') to distinguish from 404s
- ✅ Prevents duplicate embeddings by refusing to insert if delete fails
- ✅ Enhanced error logging with attempt numbers and timing

**Error Handling Flow:**
- Attempt 1 fails → Wait 1s, retry
- Attempt 2 fails → Wait 2s, retry
- Attempt 3 fails → Throw FATAL error, mark page as failed
- Page processing aborts (no new embeddings inserted)

**Monitoring:**
- New script: `scripts/monitoring/check-deletion-failures.ts` (56 lines)
- Alerts on pages with deletion-related failures
- Checks for potential duplicate embeddings
- Reports up to 20 most recent failures

**Testing:**
- New test script: `scripts/tests/test-deletion-retry.ts` (72 lines)
- Tests success on first attempt ✅ PASS
- Tests success on retry ✅ PASS
- Tests fatal error after 3 attempts ✅ PASS

**Files Modified:**
- `lib/scraper-worker.js` - Lines 1063-1104 (retry logic), Lines 1164-1191 (fatal error handling)

**Files Created:**
- `scripts/monitoring/check-deletion-failures.ts` (56 lines)
- `scripts/tests/test-deletion-retry.ts` (72 lines)

**Impact:**
- ✅ Prevents silent duplicate creation
- ✅ Early detection of database issues
- ✅ Graceful degradation with clear error messages
- ✅ Production-ready retry mechanism

### Phase 5: Add forceRescrape Validation

**Task 5.1: Add logging in worker**
- File: `lib/scraper-worker.js` line 119
- Log actual parsed value
- Log source (arg vs env var)

```javascript
console.log(`[Worker ${jobId}] FORCE_RESCRAPE: ${FORCE_RESCRAPE} (from arg: ${forceRescrapeArg}, from env: ${process.env.SCRAPER_FORCE_RESCRAPE_ALL})`);
```

**Task 5.2: Add validation in crawlWebsite**
- File: `lib/scraper-api-crawl.ts` line 218
- Verify boolean → string conversion
- Log the value being passed

### Phase 6: Implement 404 Cleanup

**Task 6.1: Add 404 detection in worker**
- File: `lib/scraper-worker.js` (in error handling)
- Detect 404 responses
- Mark page as 'deleted'
- Delete embeddings for 404 pages

**Task 6.2: Periodic cleanup**
- New script: `scripts/cleanup-deleted-pages.ts`
- Remove pages with status='deleted' older than 30 days
- CASCADE will auto-delete embeddings

### Phase 7: Add Transaction Wrapping

**Task 7.1: Wrap page save + embedding operations**
- Use Supabase transaction RPC
- Atomic: save page → delete old embeddings → insert new embeddings
- Rollback on any failure

**Task 7.2: Create transaction RPC function**
```sql
CREATE OR REPLACE FUNCTION atomic_page_with_embeddings(
  page_data JSONB,
  embeddings_data JSONB
) RETURNS UUID AS $$
DECLARE
  page_id UUID;
BEGIN
  -- Upsert page
  INSERT INTO scraped_pages (...)
  VALUES (...)
  ON CONFLICT DO UPDATE ...
  RETURNING id INTO page_id;

  -- Delete old embeddings
  DELETE FROM page_embeddings WHERE page_id = page_id;

  -- Insert new embeddings
  INSERT INTO page_embeddings (...)
  SELECT ... FROM jsonb_array_elements(embeddings_data);

  RETURN page_id;
END;
$$ LANGUAGE plpgsql;
```

### Phase 8: Testing

**Task 8.1: Create test suite**
- File: `__tests__/integration/test-refresh-workflow.test.ts`
- Test scenarios:
  - New page scrape
  - Page update (no duplicates)
  - Page 404 (cleanup)
  - Concurrent refresh (lock works)
  - Force rescrape flag

**Task 8.2: Manual end-to-end test**
1. Trigger manual refresh
2. Monitor logs
3. Check database for:
   - No duplicate embeddings
   - Correct status values
   - Proper timestamps
4. Verify lock mechanism
5. Confirm error handling

---

## Implementation Order (Prioritized)

1. **Phase 1** - Disable conflicting logic (CRITICAL - 1 hour)
2. **Phase 2** - Create bulk RPC functions (HIGH - 2 hours)
3. **Phase 3** - Add domain lock (HIGH - 2 hours)
4. **Phase 4** - Make deletion fatal (MEDIUM - 1 hour)
5. **Phase 5** - Add forceRescrape logging (LOW - 15 min)
6. **Phase 6** - Implement 404 cleanup (MEDIUM - 1 hour)
7. **Phase 7** - Add transactions (MEDIUM - 3 hours)
8. **Phase 8** - Testing (HIGH - 3 hours)

**Total Estimated Time**: 13.25 hours

---

## Success Criteria

✅ No duplicate embeddings after refresh
✅ Worker is single source of truth
✅ Bulk RPC functions exist and work
✅ Domain lock prevents concurrent refreshes
✅ Deletion errors cause job failure (not silent)
✅ forceRescrape flag propagates correctly
✅ 404 pages are cleaned up automatically
✅ All operations are atomic (transaction-wrapped)
✅ End-to-end test passes
✅ Manual refresh works in production

---

## Next Steps

Starting implementation now with Phase 1...
