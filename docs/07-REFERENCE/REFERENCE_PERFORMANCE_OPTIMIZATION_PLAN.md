# Performance Optimization Plan

## Current Performance Issues

### 1. Database Query Bottlenecks (20+ seconds)
The primary bottleneck is in `lib/embeddings.ts:searchSimilarContent()`:

**Current Issues:**
- Multiple sequential database queries (title, URL, content)
- Each query hits database separately with `.limit(500)`
- No database indexes on search columns
- Full table scans on `scraped_pages` table
- Vector similarity search using `match_page_embeddings` RPC is slow

### 2. Low Parallel Execution Rate (20-40%)
In `app/api/chat-intelligent/route.ts`:

**Current Issues:**
- AI doesn't always recognize when to parallelize
- Tool selection logic could be more aggressive
- Sequential mindset in prompt instructions

## Optimization Solutions

### Solution 1: Database Query Optimization

#### A. Add Database Indexes (Immediate 5-10x improvement)
```sql
-- Add indexes for text search
CREATE INDEX IF NOT EXISTS idx_scraped_pages_title_trgm 
ON scraped_pages USING gin (title gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_scraped_pages_content_trgm 
ON scraped_pages USING gin (content gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_scraped_pages_url 
ON scraped_pages (url);

CREATE INDEX IF NOT EXISTS idx_scraped_pages_domain_title 
ON scraped_pages (domain_id, title);

-- Add index for embeddings
CREATE INDEX IF NOT EXISTS idx_page_embeddings_page_id 
ON page_embeddings (page_id);
```

#### B. Optimize Search Queries
Instead of 3 sequential queries, use a single optimized query:

```typescript
// BEFORE: 3 separate queries
const titleResults = await supabase.from('scraped_pages').select()...
const urlResults = await supabase.from('scraped_pages').select()...  
const contentResults = await supabase.from('scraped_pages').select()...

// AFTER: Single query with scoring
const results = await supabase.rpc('search_pages_optimized', {
  search_query: query,
  domain_id: domainData.id,
  result_limit: limit
});
```

#### C. Create Optimized Search Function
```sql
CREATE OR REPLACE FUNCTION search_pages_optimized(
  search_query TEXT,
  domain_id UUID,
  result_limit INT DEFAULT 100
)
RETURNS TABLE(
  url TEXT,
  title TEXT,
  content TEXT,
  metadata JSONB,
  relevance_score FLOAT
) AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT
    sp.url,
    sp.title,
    sp.content,
    sp.metadata,
    GREATEST(
      similarity(sp.title, search_query) * 3,  -- Title matches weighted 3x
      similarity(sp.url, search_query) * 2,    -- URL matches weighted 2x
      similarity(sp.content, search_query)      -- Content matches weighted 1x
    ) as relevance_score
  FROM scraped_pages sp
  WHERE sp.domain_id = search_pages_optimized.domain_id
    AND (
      sp.title ILIKE '%' || search_query || '%'
      OR sp.url ILIKE '%' || search_query || '%'
      OR sp.content ILIKE '%' || search_query || '%'
    )
  ORDER BY relevance_score DESC
  LIMIT result_limit;
END;
$$ LANGUAGE plpgsql;
```

#### D. Implement Connection Pooling
```typescript
// In lib/supabase-server.ts
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,  // Maximum connections
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});
```

### Solution 2: Increase Parallel Execution

#### A. Modify AI System Prompt
```typescript
// In app/api/chat-intelligent/route.ts
const PARALLEL_EXECUTION_PROMPT = `
CRITICAL PERFORMANCE RULE:
- ALWAYS use multiple tools in parallel when the query has multiple parts
- If user asks about products AND shipping - call both tools simultaneously
- If searching for multiple items - call search_products multiple times in parallel
- Default to parallel execution unless explicitly sequential

Examples of parallel execution:
- "Find pumps and check shipping" → search_products + get_shipping_options (PARALLEL)
- "Show categories and popular products" → get_categories + search_products (PARALLEL)
- "Check BP-001 stock and price" → check_stock + get_product_details (PARALLEL)
`;
```

#### B. Pre-decompose Queries
```typescript
// Add query decomposition before AI call
function decomposeQuery(query: string): string[] {
  const components = [];
  
  // Detect multiple intents
  if (query.includes(' and ')) {
    components.push(...query.split(' and '));
  }
  
  // Detect lists
  if (query.includes(',')) {
    components.push(...query.split(','));
  }
  
  // Detect multiple products
  const products = query.match(/\b[A-Z]{2,}-\d+\b/g);
  if (products && products.length > 1) {
    products.forEach(p => components.push(`check ${p}`));
  }
  
  return components.length > 1 ? components : [query];
}
```

#### C. Force Parallel Tool Calls
```typescript
// Modify tool execution to encourage parallelization
if (toolCalls.length === 1 && components.length > 1) {
  // AI only called one tool but query has multiple parts
  // Generate additional tool calls programmatically
  const additionalCalls = generateParallelToolCalls(components);
  toolCalls.push(...additionalCalls);
}
```

### Solution 3: Implement Aggressive Caching

#### A. Redis Result Caching
```typescript
// In lib/redis-cache.ts
export class ResultCache {
  private redis: Redis;
  private ttl = 3600; // 1 hour cache
  
  async getOrCompute<T>(
    key: string,
    compute: () => Promise<T>
  ): Promise<T> {
    const cached = await this.redis.get(key);
    if (cached) return JSON.parse(cached);
    
    const result = await compute();
    await this.redis.setex(key, this.ttl, JSON.stringify(result));
    return result;
  }
}
```

#### B. Query Result Streaming
```typescript
// Stream partial results to user while others complete
export async function* streamResults(toolExecutions: Promise<any>[]) {
  for (const execution of toolExecutions) {
    try {
      const result = await Promise.race([
        execution,
        new Promise((_, reject) => 
          setTimeout(() => reject('timeout'), 5000)
        )
      ]);
      yield result;
    } catch {
      // Continue with other results
    }
  }
}
```

## Implementation Priority

### Phase 1: Quick Wins (1-2 hours)
1. ✅ Add database indexes (5-10x improvement)
2. ✅ Increase connection pool size
3. ✅ Update AI prompt for parallel execution

**Expected Impact:** 
- Response time: 20s → 5-8s
- Parallel rate: 20% → 50%

### Phase 2: Core Optimizations (4-6 hours)
1. ✅ Implement optimized search function
2. ✅ Add Redis caching layer
3. ✅ Query decomposition logic

**Expected Impact:**
- Response time: 5-8s → 2-4s
- Parallel rate: 50% → 80%

### Phase 3: Advanced Features (1-2 days)
1. ✅ Result streaming
2. ✅ Predictive caching
3. ✅ Background cache warming

**Expected Impact:**
- Response time: 2-4s → <2s
- Parallel rate: 80% → 95%

## Monitoring & Metrics

### Key Metrics to Track
```typescript
interface PerformanceMetrics {
  queryTime: number;          // Target: <2s
  parallelRate: number;        // Target: >80%
  cacheHitRate: number;        // Target: >60%
  dbQueryTime: number;         // Target: <500ms
  toolExecutionTime: number;   // Target: <1s per tool
}
```

### Performance Tracking
```typescript
// Add to telemetry
telemetry.trackPerformance({
  operation: 'search',
  duration: Date.now() - start,
  parallel: toolCalls.length > 1,
  cacheHit: fromCache,
  resultCount: results.length
});
```

## Expected Results

### Before Optimization
- Average response: 20-26 seconds
- Parallel execution: 20-40%
- Cache hit rate: 0%
- Database query: 15-20 seconds

### After Optimization
- Average response: <2 seconds (10x improvement)
- Parallel execution: 80-95%
- Cache hit rate: 60%+
- Database query: <500ms (30x improvement)

## Testing Strategy

1. **Load Testing**
```bash
# Test concurrent queries
for i in {1..10}; do
  curl -X POST http://localhost:3000/api/chat-intelligent \
    -d '{"message":"find pumps","session_id":"test'$i'"}' &
done
```

2. **Performance Benchmarks**
```typescript
// Run before/after benchmarks
await benchmark('search_products', async () => {
  await executeSearchProducts('pump', 100, 'domain.com');
});
```

3. **Database Query Analysis**
```sql
-- Check query performance
EXPLAIN ANALYZE
SELECT * FROM scraped_pages 
WHERE title ILIKE '%pump%';
```

## Rollback Plan

If optimizations cause issues:
1. Remove new indexes: `DROP INDEX IF EXISTS idx_name;`
2. Revert to sequential queries
3. Disable caching: `ENABLE_CACHE=false`
4. Restore original prompt

Each optimization can be toggled independently via environment variables.