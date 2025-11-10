# Transaction Integration Guide

**Type:** Analysis
**Status:** Active
**Last Updated:** 2025-11-08
**Related:** Phase 7 - Content Refresh Fix

## Purpose
Documents how to integrate atomic page + embeddings transactions into the scraper worker and other systems to prevent orphaned data.

---

## Phase 7: Atomic Page + Embeddings

### Problem Statement

**Current Risk:** Pages and embeddings are saved in separate operations, creating race conditions:

1. Page saves successfully
2. Embedding deletion fails → Page has stale embeddings
3. Embedding insertion fails → Page has no embeddings (orphaned)

**Impact:**
- Inconsistent search results
- Orphaned pages without embeddings
- Duplicate embeddings for same page
- Difficult error recovery

### Current Implementation (Non-Atomic)

In `lib/scraper-worker.js`, pages and embeddings are saved separately:

```javascript
// Step 1: Save page
const { data: savedPage } = await supabase
  .from('scraped_pages')
  .upsert({
    url,
    domain_id,
    title,
    content,
    metadata,
    last_scraped_at: new Date().toISOString(),
    status: 'completed'
  })
  .select()
  .single();

// Step 2: Delete old embeddings (with retry logic)
let retries = 0;
while (retries < 3) {
  const { error: deleteError } = await supabase
    .from('page_embeddings')
    .delete()
    .eq('page_id', savedPage.id);

  if (!deleteError) break;
  retries++;
  await new Promise(r => setTimeout(r, 1000));
}

// Step 3: Insert new embeddings
const { error: insertError } = await supabase
  .from('page_embeddings')
  .insert(embeddingRecords);

if (insertError) {
  // Page is saved but has no embeddings! 💥
  throw insertError;
}
```

**Problem:** If step 3 fails, page is saved but has no embeddings (orphaned page).

---

## New Implementation (Atomic)

### Database Function

Created: `supabase/migrations/20251108_atomic_page_embeddings.sql`

```sql
CREATE OR REPLACE FUNCTION atomic_page_with_embeddings(
  page_data JSONB,
  embeddings_data JSONB
) RETURNS JSONB AS $$
DECLARE
  page_id UUID;
  deleted_count INTEGER;
  inserted_count INTEGER;
BEGIN
  -- Step 1: Upsert page
  INSERT INTO scraped_pages (...) VALUES (...)
  ON CONFLICT (domain_id, url) DO UPDATE SET ...
  RETURNING id INTO page_id;

  -- Step 2: Delete old embeddings
  DELETE FROM page_embeddings WHERE page_id = page_id;
  GET DIAGNOSTICS deleted_count = ROW_COUNT;

  -- Step 3: Insert new embeddings
  INSERT INTO page_embeddings (...) SELECT ...;
  GET DIAGNOSTICS inserted_count = ROW_COUNT;

  -- Return summary
  RETURN jsonb_build_object(
    'page_id', page_id,
    'deleted_embeddings', deleted_count,
    'inserted_embeddings', inserted_count,
    'success', true
  );
EXCEPTION
  WHEN OTHERS THEN
    -- Automatic rollback on any error
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql;
```

**Key Features:**
- ✅ All 3 operations in single transaction
- ✅ Automatic rollback on any error
- ✅ Returns detailed success/failure info
- ✅ Handles upsert conflicts gracefully

### TypeScript Wrapper

Created: `lib/atomic-page-embeddings.ts`

```typescript
import { atomicSavePageWithEmbeddings } from '@/lib/atomic-page-embeddings';

// Single atomic operation replaces 3 separate calls
const result = await atomicSavePageWithEmbeddings(supabase, {
  url: pageData.url,
  domain_id: domainId,
  title: pageData.title,
  content: pageData.content,
  metadata: pageMetadata,
  status: 'completed',
}, embeddingRecords.map(e => ({
  domain_id: domainId,
  chunk_text: e.chunk_text,
  embedding: e.embedding,
  metadata: e.metadata,
})));

if (!result.success) {
  // All operations rolled back - no partial state!
  throw new Error(`Atomic save failed: ${result.error}`);
}

console.log(`✅ Saved page ${result.page_id} with ${result.inserted_embeddings} embeddings`);
```

**Benefit:** Either all operations succeed, or none do (automatic rollback).

---

## Migration Strategy

### Option 1: Worker Only (Recommended for Now)

**Approach:**
- Keep current implementation in worker (it already has retry logic from Phase 4)
- Use atomic function for new features requiring transactional guarantees
- Gradually migrate as needed

**Pros:**
- ✅ No risk to existing stable worker
- ✅ Atomic function available for future use
- ✅ Can test in isolation first

**Cons:**
- ❌ Worker still has potential race condition
- ❌ Duplicate code paths

### Option 2: Full Migration (Future Consideration)

**Approach:**
- Replace worker logic with atomic function
- Remove retry logic (transaction handles it)
- Simpler code, single source of truth

**Pros:**
- ✅ Eliminates race conditions completely
- ✅ Simpler code (no retry logic needed)
- ✅ Better data consistency

**Cons:**
- ❌ Bigger change requiring extensive testing
- ❌ Need to verify all edge cases

**Recommendation:** Start with Option 1, test atomic function in isolation, then consider Option 2 in future sprint.

---

## Integration Examples

### Example 1: Scraper Worker Integration

```javascript
// In lib/scraper-worker.js or similar

import { atomicSavePageWithEmbeddings } from '@/lib/atomic-page-embeddings';

async function savePageWithEmbeddings(pageData, embeddings, domainId) {
  const supabase = createServiceRoleClient();

  const result = await atomicSavePageWithEmbeddings(supabase, {
    url: pageData.url,
    domain_id: domainId,
    title: pageData.title,
    content: pageData.content,
    metadata: {
      word_count: pageData.content.split(/\s+/).length,
      scraped_at: new Date().toISOString(),
      ...pageData.metadata,
    },
    status: 'completed',
  }, embeddings.map(emb => ({
    domain_id: domainId,
    chunk_text: emb.text,
    embedding: emb.vector,
    metadata: {
      chunk_index: emb.index,
      chunk_length: emb.text.length,
    },
  })));

  if (!result.success) {
    throw new Error(`Failed to save page atomically: ${result.error}`);
  }

  return {
    pageId: result.page_id,
    embeddingsCreated: result.inserted_embeddings,
    embeddingsDeleted: result.deleted_embeddings,
  };
}
```

### Example 2: Content Refresh Integration

```typescript
// In content refresh workflow

import { atomicSavePageWithEmbeddings, validateEmbeddings } from '@/lib/atomic-page-embeddings';

async function refreshPageContent(url: string, domainId: string) {
  // 1. Scrape fresh content
  const freshContent = await scrapePage(url);

  // 2. Generate new embeddings
  const embeddings = await generateEmbeddings(freshContent.content);

  // 3. Validate before saving
  if (!validateEmbeddings(embeddings)) {
    throw new Error('Invalid embeddings generated');
  }

  // 4. Atomic save (all or nothing)
  const result = await atomicSavePageWithEmbeddings(supabase, {
    url,
    domain_id: domainId,
    title: freshContent.title,
    content: freshContent.content,
    metadata: { last_refresh: new Date().toISOString() },
  }, embeddings);

  if (!result.success) {
    // Nothing was saved - safe to retry
    throw new Error(`Refresh failed: ${result.error}`);
  }

  console.log(`✅ Refreshed ${url}: ${result.inserted_embeddings} embeddings`);
}
```

---

## Benefits

### 1. Data Consistency
- **Before:** Page saved but embeddings failed → orphaned page
- **After:** Either both save or neither saves (atomic)

### 2. Simpler Error Handling
- **Before:** Need to handle 3 separate failure points
- **After:** Single point of failure, automatic rollback

### 3. Better Performance
- **Before:** 3 separate database round-trips
- **After:** Single database call (faster)

### 4. Atomic Rollback
- **Before:** Partial failures leave inconsistent state
- **After:** Transaction automatically rolls back on any error

### 5. Reduced Retry Logic
- **Before:** Complex retry logic for each step
- **After:** Database handles transaction retry internally

---

## Testing Strategy

### Unit Tests

Test the atomic function directly:

```typescript
describe('atomicSavePageWithEmbeddings', () => {
  it('should save page and embeddings atomically', async () => {
    const result = await atomicSavePageWithEmbeddings(supabase, pageData, embeddings);
    expect(result.success).toBe(true);
    expect(result.page_id).toBeDefined();
    expect(result.inserted_embeddings).toBe(embeddings.length);
  });

  it('should rollback on embedding validation error', async () => {
    const invalidEmbeddings = [{ embedding: [1, 2, 3] }]; // Wrong dimensions
    const result = await atomicSavePageWithEmbeddings(supabase, pageData, invalidEmbeddings);
    expect(result.success).toBe(false);

    // Verify page was NOT saved (rollback)
    const { data: page } = await supabase
      .from('scraped_pages')
      .select()
      .eq('url', pageData.url)
      .single();
    expect(page).toBeNull();
  });
});
```

### Integration Tests

Test in scraper worker context:

```bash
npx tsx scripts/tests/test-atomic-transaction.ts
```

---

## Migration Checklist

- [x] SQL migration created
- [x] TypeScript wrapper created
- [x] Validation helpers added
- [x] Integration guide documented
- [ ] Unit tests written
- [ ] Integration tests pass
- [ ] Migration applied to database
- [ ] Function verified in production
- [ ] Worker integration (optional - future)

---

## Rollback Plan

If atomic function causes issues:

1. **Disable at application level:**
   ```typescript
   // Add feature flag
   const USE_ATOMIC_SAVE = process.env.USE_ATOMIC_SAVE === 'true';

   if (USE_ATOMIC_SAVE) {
     await atomicSavePageWithEmbeddings(...);
   } else {
     // Fall back to old 3-step process
   }
   ```

2. **Database rollback:**
   ```sql
   DROP FUNCTION IF EXISTS atomic_page_with_embeddings(JSONB, JSONB);
   ```

3. **Code rollback:**
   - Remove imports of `lib/atomic-page-embeddings.ts`
   - Restore old 3-step save logic

---

## Future Enhancements

1. **Batch Processing:**
   - Extend function to handle multiple pages atomically
   - Useful for bulk content refresh

2. **Conflict Resolution:**
   - Add conflict resolution strategies (merge vs replace)
   - Handle concurrent updates gracefully

3. **Audit Trail:**
   - Track version history of page content
   - Log all atomic operations for debugging

4. **Performance Optimization:**
   - Add function caching for repeated calls
   - Optimize embedding vector storage

---

## References

- [PostgreSQL Transactions](https://www.postgresql.org/docs/current/tutorial-transactions.html)
- [Supabase RPC Functions](https://supabase.com/docs/guides/database/functions)
- [Phase 4: Retry Logic](ANALYSIS_CONTENT_REFRESH_FIX.md#phase-4)
- [Database Schema](../09-REFERENCE/REFERENCE_DATABASE_SCHEMA.md)

---

**Last Updated:** 2025-11-08
**Status:** Active - Ready for integration
**Next Steps:** Apply migration, run tests, monitor production
