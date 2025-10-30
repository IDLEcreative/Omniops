# Real-World Performance Monitoring Plan

## Purpose
Validate the database optimizations with actual scraping job data, not synthetic benchmarks.

## What Was Changed (2025-10-30)

1. ✅ Added index: `idx_page_embeddings_page_id`
2. ✅ Added index: `idx_scraped_pages_error_message`
3. ✅ Fixed `bulk_insert_embeddings()` from loop-based to set-based

## How to Validate Improvements

### Step 1: Check Query Performance Stats (In Supabase Dashboard)

Navigate to: **Database** → **Query Performance**

Look for these queries:

```sql
-- Bulk insert performance
SELECT query, calls, mean_exec_time, max_exec_time
FROM pg_stat_statements
WHERE query LIKE '%bulk_insert_embeddings%'
ORDER BY calls DESC
LIMIT 5;
```

**What to expect:**
- `mean_exec_time`: Should be < 50ms (was 291ms before)
- `max_exec_time`: Should be < 1000ms (was 7974ms before)
- `calls`: Should be ~100x fewer than before

---

```sql
-- Deletion performance
SELECT query, calls, mean_exec_time, max_exec_time
FROM pg_stat_statements
WHERE query LIKE '%DELETE FROM%page_embeddings%page_id%'
ORDER BY calls DESC
LIMIT 5;
```

**What to expect:**
- `mean_exec_time`: Should be < 5ms (was 20.5ms before)
- `max_exec_time`: Should be < 1000ms (was 7725ms before)

---

### Step 2: Monitor Next Scraping Job

When you run a scraping job, watch for:

**Before optimizations:**
```
[Performance] Embedding insertion: 291ms per batch
[Performance] Total embeddings: 65,492 calls
[Performance] Total scraping time: ~5 hours
```

**After optimizations (expected):**
```
[Performance] Embedding insertion: ~50ms per batch
[Performance] Total embeddings: ~650 calls (99% reduction!)
[Performance] Total scraping time: ~30 minutes (90% faster!)
```

---

### Step 3: Check Database Metrics (Supabase Dashboard)

Navigate to: **Database** → **Usage**

Compare these metrics before/after a scraping job:

1. **Database Connections** - Should be lower (fewer concurrent queries)
2. **Database CPU Usage** - Should be significantly lower
3. **Disk I/O** - Should show fewer write operations

---

### Step 4: Application Logs

Add logging to track actual improvements:

```typescript
// In crawl-processor.ts or embeddings-functions.ts
const startTime = Date.now();
const { data, error } = await supabase.rpc('bulk_insert_embeddings', {
  embeddings: embeddingRecords
});
const duration = Date.now() - startTime;

console.log(`[PERF] Bulk inserted ${embeddingRecords.length} embeddings in ${duration}ms`);
console.log(`[PERF] Average: ${(duration / embeddingRecords.length).toFixed(2)}ms per embedding`);
```

---

## Expected Timeline for Validation

| Timeframe | What to Check | Expected Result |
|-----------|---------------|-----------------|
| **Immediately** | Supabase query stats | Indexes exist, function updated |
| **Next scraping job** (today/tomorrow) | Application logs | 50-90% faster completion |
| **24 hours** | pg_stat_statements | Dramatically fewer calls |
| **1 week** | Database usage trends | Lower CPU, fewer connections |

---

## Success Criteria

### ✅ Optimizations Working If:

1. **Bulk insert mean time** < 50ms (was 291ms)
2. **Deletion mean time** < 5ms (was 20.5ms)
3. **Total operation count** down by 90%+ (was 94,885 calls)
4. **Scraping job completion time** down by 50%+ (was ~5 hours)
5. **Database CPU usage** noticeably lower during scraping

### ⚠️ Needs Investigation If:

1. Mean times are still > 100ms
2. Operation counts haven't decreased significantly
3. Scraping jobs still take hours
4. You see errors like "Bulk insert failed, falling back to regular insert"

---

## Troubleshooting

### If bulk_insert is still failing frequently:

Check logs for errors:
```typescript
const { data, error } = await supabase.rpc('bulk_insert_embeddings', { embeddings });
if (error) {
  console.error('[BULK ERROR]', {
    message: error.message,
    details: error.details,
    hint: error.hint,
    code: error.code,
    batchSize: embeddings.length,
    sampleData: embeddings[0]
  });
}
```

Common causes:
- Embedding dimensions not 1536
- Missing required fields (page_id, chunk_text)
- Invalid JSON format
- Batch size too large (try reducing from 100 to 50)

---

### If deletions are still slow:

Verify index is being used:
```sql
EXPLAIN ANALYZE
DELETE FROM page_embeddings
WHERE page_id = '<some-test-id>';
```

Should show: `Index Scan using idx_page_embeddings_page_id`
NOT: `Seq Scan on page_embeddings`

---

## What I Learned About Benchmarking

**Synthetic benchmarks caused database timeouts!**

- Generating 1536-dimensional embeddings is expensive
- Running hundreds of inserts/deletes in rapid succession stressed the database
- CloudFlare timeout (100s) was exceeded
- **Lesson:** Real-world monitoring > synthetic stress tests for production databases

**Better approach:** Monitor actual workload improvements, not artificial tests.

---

## Next Steps

1. ✅ Indexes created (done)
2. ✅ Function optimized (done)
3. ⏳ Run next scraping job and monitor logs
4. ⏳ Check Supabase query stats after 24 hours
5. ⏳ Compare database usage metrics week-over-week

**Most important:** Just run your next scraping job and see if it completes faster. That's the real test.
