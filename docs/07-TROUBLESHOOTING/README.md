# Troubleshooting Guide

**Type:** Troubleshooting
**Status:** Active
**Last Updated:** 2025-10-29
**Verified For:** v0.1.0
**Estimated Read Time:** 220 minutes

## Purpose
Something's broken - where do I start? │ ├─ Is the server running?

## Quick Links
- [🚨 Quick Diagnostic Flowchart](#-quick-diagnostic-flowchart)
- [Table of Contents](#table-of-contents)
- [1. Chat System Issues](#1-chat-system-issues)
- [2. Search & Embeddings Issues](#2-search--embeddings-issues)
- [3. Database Issues](#3-database-issues)

## Keywords
additional, authentication, authorization, chat, contents, contribution, database, deployment, development, diagnostic

---


**Last Updated:** 2025-10-24
**Purpose:** Comprehensive diagnostic and troubleshooting guide for Omniops
**Audience:** Developers, DevOps, Support Engineers

---

## 🚨 Quick Diagnostic Flowchart

```
Something's broken - where do I start?
│
├─ Is the server running?
│  ├─ No → See "Development Environment" section
│  └─ Yes ↓
│
├─ Can you reach /api/health?
│  ├─ No → See "Production Deployment" section
│  └─ Yes ↓
│
├─ What component is failing?
│  ├─ Chat not responding → "Chat System Issues"
│  ├─ Search returns nothing → "Search & Embeddings Issues"
│  ├─ Database errors → "Database Issues"
│  ├─ WooCommerce failing → "WooCommerce Integration Issues"
│  ├─ Scraping stuck → "Scraping Issues"
│  ├─ Slow performance → "Performance Issues"
│  └─ Can't login → "Authentication & Authorization"
```

---

## Table of Contents

1. [Chat System Issues](#1-chat-system-issues)
2. [Search & Embeddings Issues](#2-search--embeddings-issues)
3. [Database Issues](#3-database-issues)
4. [WooCommerce Integration Issues](#4-woocommerce-integration-issues)
5. [Scraping Issues](#5-scraping-issues)
6. [Performance Issues](#6-performance-issues)
7. [Authentication & Authorization](#7-authentication--authorization)
8. [Development Environment](#8-development-environment)
9. [Production Deployment](#9-production-deployment)

---

## 1. Chat System Issues

### Issue 1.1: No Response from Chat

**Symptoms:**
- User sends message, no response appears
- Widget shows "typing..." forever
- Console shows no errors

**Possible Causes:**
- OpenAI API key invalid or missing
- Rate limiting triggered
- Network timeout
- Server crashed

**Diagnosis:**
```bash
# Check server is running
curl http://localhost:3000/api/health

# Test chat endpoint directly
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "test",
    "session_id": "test-123",
    "domain": "example.com"
  }'

# Check server logs
docker logs omniops-app | tail -50

# Check OpenAI API key
echo $OPENAI_API_KEY | cut -c1-10
```

**Solutions:**
1. Verify OpenAI API key is set and valid:
   ```bash
   # Test OpenAI connection
   curl https://api.openai.com/v1/models \
     -H "Authorization: Bearer $OPENAI_API_KEY"
   ```

2. Check rate limiting:
   ```sql
   -- View recent rate limit hits
   SELECT * FROM rate_limit_log
   WHERE domain = 'example.com'
   ORDER BY created_at DESC
   LIMIT 10;
   ```

3. Increase timeout in `lib/chat/openai-client.ts`:
   ```typescript
   timeout: 60000, // Increase from 30000
   ```

4. Restart server:
   ```bash
   docker-compose restart app
   # or
   pkill -f "next dev" && npm run dev
   ```

**Prevention:**
- Set up monitoring for `/api/chat` endpoint
- Implement exponential backoff in client
- Add circuit breaker for OpenAI calls
- Monitor OpenAI usage and quotas

**Related Docs:**
- [Chat System Architecture](../02-FEATURES/chat-system/README.md)
- [Error Handling](../ERROR_HANDLING.md)

---

### Issue 1.2: Slow Chat Responses (>15s)

**Symptoms:**
- Chat takes 15+ seconds to respond
- Users complain about lag
- Server logs show long processing times

**Possible Causes:**
- Large search result sets (>200 results)
- Slow database queries
- WooCommerce API timeouts
- Expensive AI reasoning

**Diagnosis:**
```bash
# Check response times
curl -w "\nTime: %{time_total}s\n" -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "test", "session_id": "test", "domain": "example.com"}'

# Profile database queries
SELECT query, mean_exec_time, calls
FROM pg_stat_statements
WHERE query LIKE '%search_embeddings%'
ORDER BY mean_exec_time DESC;

# Check search result counts in logs
docker logs omniops-app | grep "search_products completed"
```

**Solutions:**
1. Enable adaptive search limits (already implemented):
   ```typescript
   // lib/chat/tool-handlers.ts
   const adaptiveLimit = queryWords > 3 ? Math.min(50, limit) : limit;
   ```

2. Add query caching:
   ```typescript
   // Check cache before searching
   const cached = await searchCache.get(query);
   if (cached) return cached;
   ```

3. Optimize database indexes:
   ```sql
   -- Ensure vector index exists
   CREATE INDEX IF NOT EXISTS idx_page_embeddings_vector
   ON page_embeddings
   USING ivfflat (embedding vector_cosine_ops)
   WITH (lists = 100);

   ANALYZE page_embeddings;
   ```

4. Reduce content truncation length:
   ```typescript
   // lib/chat/ai-processor.ts:259
   content.substring(0, 100) // Reduce from 200
   ```

**Prevention:**
- Monitor response times with `/api/health`
- Set up performance alerts (>10s = warning)
- Use adaptive limits for all searches
- Implement query result caching

**Related Docs:**
- [Performance Optimization](../07-REFERENCE/REFERENCE_PERFORMANCE_OPTIMIZATION.md)
- [Search Architecture](../01-ARCHITECTURE/ARCHITECTURE_SEARCH_SYSTEM.md)

---

### Issue 1.3: Chat Hallucinations (Incorrect Information)

**Symptoms:**
- AI provides wrong product info
- Makes up features that don't exist
- Confidently states incorrect facts

**Possible Causes:**
- Search returning irrelevant results
- Low similarity threshold
- Poor quality embeddings
- Missing "I don't know" training

**Diagnosis:**
```bash
# Test hallucination prevention
npx tsx test-hallucination-prevention.ts

# Check search quality
npx tsx << 'EOF'
import { searchSimilarContent } from './lib/embeddings';
const results = await searchSimilarContent('test query', 'example.com', 5, 0.2);
console.log('Top results:');
results.forEach(r => console.log(`${r.title} (${r.similarity})`));
EOF

# Check system prompt
grep -A 20 "IMPORTANT RULES" lib/chat/system-prompts.ts
```

**Solutions:**
1. Increase similarity threshold:
   ```typescript
   // lib/chat/tool-handlers.ts
   searchSimilarContent(query, domain, limit, 0.3); // Up from 0.2
   ```

2. Strengthen system prompt:
   ```typescript
   // lib/chat/system-prompts.ts
   CRITICAL: If you don't have specific information from the search results,
   you MUST say "I don't have information about that" instead of guessing.
   ```

3. Add confidence scoring:
   ```typescript
   if (results.length === 0 || results[0].similarity < 0.5) {
     return "I don't have enough information to answer that accurately.";
   }
   ```

4. Regenerate embeddings if quality is poor:
   ```bash
   npx tsx monitor-embeddings-health.ts check
   npx tsx optimize-chunk-sizes.ts analyze
   ```

**Prevention:**
- Run hallucination tests after prompt changes
- Monitor AI responses for accuracy
- Use higher similarity thresholds for critical data
- Implement user feedback system

**Related Docs:**
- [Hallucination Prevention](../02-GUIDES/GUIDE_HALLUCINATION_PREVENTION.md)
- [Chat System Testing](../04-DEVELOPMENT/testing/README.md)

---

### Issue 1.4: Context Loss (Forgets Earlier Conversation)

**Symptoms:**
- AI repeats questions already answered
- Doesn't remember user's name/email
- Loses track of conversation topic

**Possible Causes:**
- Conversation history not being saved
- Token limit exceeded (context truncated)
- Session ID mismatch
- Database not storing messages

**Diagnosis:**
```bash
# Check conversation storage
psql $DATABASE_URL -c "
  SELECT c.id, c.session_id, COUNT(m.id) as message_count
  FROM conversations c
  LEFT JOIN messages m ON c.id = m.conversation_id
  WHERE c.session_id = 'your-session-id'
  GROUP BY c.id, c.session_id;
"

# Check token usage
docker logs omniops-app | grep "Token usage"

# Test conversation flow
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "My name is John",
    "session_id": "test-123",
    "domain": "example.com"
  }'

curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What is my name?",
    "session_id": "test-123",
    "domain": "example.com"
  }'
```

**Solutions:**
1. Verify conversation saving:
   ```typescript
   // app/api/chat/route.ts
   console.log('Saving conversation:', conversationId);
   console.log('Message count:', messages.length);
   ```

2. Implement conversation summarization for long chats:
   ```typescript
   if (messages.length > 20) {
     const summary = await summarizeConversation(messages.slice(0, -10));
     messages = [summary, ...messages.slice(-10)];
   }
   ```

3. Check session ID consistency:
   ```typescript
   // public/embed.js
   console.log('Session ID:', sessionId);
   // Should be same across all messages
   ```

4. Fix database constraints:
   ```sql
   -- Ensure foreign keys are correct
   SELECT * FROM messages WHERE conversation_id IS NULL;
   ```

**Prevention:**
- Test conversation flow in integration tests
- Monitor message storage rates
- Set up alerts for failed saves
- Implement conversation recovery

**Related Docs:**
- [Chat System Documentation](../02-FEATURES/chat-system/README.md)
- [Database Schema](../09-REFERENCE/REFERENCE_DATABASE_SCHEMA.md)

---

### Issue 1.5: Tool Call Failures

**Symptoms:**
- AI says "I'll search for that" but no results
- Tool execution errors in logs
- Missing tool responses

**Possible Causes:**
- Tool handler errors
- Missing dependencies (Supabase, WooCommerce)
- Invalid tool parameters
- Timeout issues

**Diagnosis:**
```bash
# Check tool execution logs
docker logs omniops-app | grep "\[Function Call\]"
docker logs omniops-app | grep "\[Tool Error\]"

# Test tool directly
npx tsx << 'EOF'
import { executeSearchProducts } from './lib/chat/tool-handlers';
const result = await executeSearchProducts('pumps', 100, 'example.com', {
  supabase: await createServiceRoleClient(),
  openai: getOpenAIClient()
});
console.log('Results:', result.results?.length);
EOF

# Check tool definitions
cat lib/chat/tool-definitions.ts | grep -A 10 "search_products"
```

**Solutions:**
1. Add error handling to tool handlers:
   ```typescript
   // lib/chat/tool-handlers.ts
   try {
     const results = await executeSearchProducts(...);
     return { success: true, results };
   } catch (error) {
     console.error('[Tool Error]', error);
     return {
       success: false,
       error: 'Search failed: ' + error.message
     };
   }
   ```

2. Validate tool parameters:
   ```typescript
   if (!domain || !query) {
     throw new Error('Missing required parameters');
   }
   ```

3. Increase tool timeout:
   ```typescript
   // lib/chat/ai-processor.ts
   const response = await openai.chat.completions.create({
     ...config,
     timeout: 60000 // Increase from 30000
   });
   ```

4. Test each tool independently:
   ```bash
   npm run test:integration -- tool-handlers
   ```

**Prevention:**
- Add comprehensive tool tests
- Monitor tool success rates
- Implement graceful fallbacks
- Log all tool executions

**Related Docs:**
- [Tool Definitions](../02-FEATURES/chat-system/README.md#tools)
- [Agents Documentation](../AGENTS.md)

---

### Issue 1.6: API Errors (500/503)

**Symptoms:**
- Chat returns 500 error
- "Internal Server Error" message
- Error logged to console

**Possible Causes:**
- Unhandled exception in route
- Database connection failure
- OpenAI API failure
- Out of memory

**Diagnosis:**
```bash
# Check error logs
docker logs omniops-app | grep "ERROR"

# Check health endpoint
curl http://localhost:3000/api/health | jq

# Check memory usage
docker stats omniops-app --no-stream

# Test specific error path
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": ""}' # Invalid input
```

**Solutions:**
1. Check error logging:
   ```typescript
   // app/api/chat/route.ts
   import { logError } from '@/lib/error-logger';

   catch (error) {
     await logError(error, { endpoint: '/api/chat' });
     return NextResponse.json({ error: 'Failed' }, { status: 500 });
   }
   ```

2. Verify database connection:
   ```bash
   psql $DATABASE_URL -c "SELECT 1;"
   ```

3. Add request validation:
   ```typescript
   const schema = z.object({
     message: z.string().min(1),
     session_id: z.string(),
     domain: z.string()
   });
   const validated = schema.parse(body);
   ```

4. Restart services if memory issue:
   ```bash
   docker-compose restart
   ```

**Prevention:**
- Use error boundary in routes
- Add input validation to all endpoints
- Monitor error rates
- Set up automatic restarts

**Related Docs:**
- [Error Handling](../ERROR_HANDLING.md)
- [API Reference](../API_REFERENCE.md)

---

### Issue 1.7: Token Limit Exceeded

**Symptoms:**
- Error: "This model's maximum context length is..."
- Truncated responses
- Missing conversation history

**Possible Causes:**
- Too many search results (>200)
- Long conversation history
- Large system prompt
- No truncation logic

**Diagnosis:**
```bash
# Check token usage
docker logs omniops-app | grep "tokens"

# Calculate approximate tokens
npx tsx << 'EOF'
const text = "your long text here";
console.log('Approx tokens:', Math.ceil(text.length / 4));
EOF

# Check search result sizes
docker logs omniops-app | grep "search_products completed"
```

**Solutions:**
1. Reduce search results:
   ```typescript
   // lib/chat/tool-definitions.ts
   default: 50, // Reduce from 100
   ```

2. Implement conversation truncation:
   ```typescript
   // Keep only last 10 messages
   const recentMessages = messages.slice(-10);
   ```

3. Shorten content snippets:
   ```typescript
   // lib/chat/ai-processor.ts
   content.substring(0, 100) // Reduce from 200
   ```

4. Use GPT-5-mini for longer context:
   ```typescript
   model: 'gpt-5-mini-preview', // 128k context vs 8k
   ```

**Prevention:**
- Monitor token usage per request
- Implement automatic truncation
- Use adaptive search limits
- Set up token usage alerts

**Related Docs:**
- [Search Architecture](../01-ARCHITECTURE/ARCHITECTURE_SEARCH_SYSTEM.md)
- [Token Cost Tracking](../TOKEN_COST_TRACKING.md)

---

## 2. Search & Embeddings Issues

### Issue 2.1: No Search Results

**Symptoms:**
- Search returns 0 results
- AI says "I couldn't find anything"
- Database has data but search returns nothing

**Possible Causes:**
- No embeddings generated
- Domain mismatch (www vs non-www)
- Similarity threshold too high
- Search function missing

**Diagnosis:**
```bash
# Check embeddings exist
psql $DATABASE_URL -c "
  SELECT d.domain, COUNT(pe.id) as embedding_count
  FROM domains d
  LEFT JOIN scraped_pages sp ON d.id = sp.domain_id
  LEFT JOIN page_embeddings pe ON sp.id = pe.page_id
  WHERE d.domain = 'example.com'
  GROUP BY d.domain;
"

# Test search function
psql $DATABASE_URL -c "
  SELECT * FROM search_embeddings(
    (SELECT embedding FROM page_embeddings LIMIT 1),
    (SELECT id FROM domains WHERE domain = 'example.com'),
    0.1,
    5
  );
"

# Check domain normalization
npx tsx << 'EOF'
const domain = 'www.example.com';
const normalized = domain.replace(/^https?:\/\//, '').replace('www.', '');
console.log('Normalized:', normalized);
EOF
```

**Solutions:**
1. Generate embeddings if missing:
   ```bash
   # Trigger scraping and embedding generation
   curl -X POST http://localhost:3000/api/scrape \
     -H "Content-Type: application/json" \
     -d '{"domain": "example.com", "forceRescrape": true}'
   ```

2. Lower similarity threshold:
   ```typescript
   // lib/embeddings.ts
   const results = await searchSimilarContent(
     query,
     domain,
     limit,
     0.15 // Lower from 0.3
   );
   ```

3. Fix domain normalization:
   ```typescript
   // lib/embeddings.ts
   const normalizedDomain = domain
     .replace(/^https?:\/\//, '')
     .replace(/^www\./, '')
     .toLowerCase();
   ```

4. Create search function if missing:
   ```sql
   -- See 09-REFERENCE/REFERENCE_DATABASE_SCHEMA.md for full function definition
   CREATE OR REPLACE FUNCTION search_embeddings(...);
   ```

**Prevention:**
- Run embedding health checks regularly
- Monitor embedding generation success rate
- Validate domain normalization in tests
- Alert on zero-result searches

**Related Docs:**
- [RAG Troubleshooting](../RAG_TROUBLESHOOTING.md)
- [Embeddings Guide](../EMBEDDING_SEARCH_GUIDE.md)

---

### Issue 2.2: Irrelevant Search Results

**Symptoms:**
- Search returns unrelated content
- Low similarity scores (<0.3)
- Users complain about bad recommendations

**Possible Causes:**
- Similarity threshold too low
- Poor quality embeddings
- Incorrect chunking
- Generic queries

**Diagnosis:**
```bash
# Check result quality
npx tsx << 'EOF'
import { searchSimilarContent } from './lib/embeddings';
const results = await searchSimilarContent('hydraulic pump', 'example.com', 10, 0.2);
results.forEach(r => console.log(`${r.similarity.toFixed(2)} - ${r.title}`));
EOF

# Analyze embeddings health
npx tsx monitor-embeddings-health.ts check

# Check chunk sizes
psql $DATABASE_URL -c "
  SELECT
    AVG(LENGTH(chunk_text)) as avg_length,
    MAX(LENGTH(chunk_text)) as max_length,
    MIN(LENGTH(chunk_text)) as min_length
  FROM page_embeddings;
"
```

**Solutions:**
1. Increase similarity threshold:
   ```typescript
   // lib/chat/tool-handlers.ts
   searchSimilarContent(query, domain, limit, 0.3); // Up from 0.2
   ```

2. Optimize chunk sizes:
   ```bash
   npx tsx optimize-chunk-sizes.ts analyze
   npx tsx optimize-chunk-sizes.ts optimize
   ```

3. Regenerate embeddings:
   ```bash
   npx tsx batch-rechunk-embeddings.ts --force
   ```

4. Use hybrid search (keyword + vector):
   ```typescript
   // Already implemented in lib/embeddings.ts
   // Falls back to keyword search for short queries
   ```

**Prevention:**
- Monitor average similarity scores
- Run periodic embedding quality checks
- Test search with edge cases
- Collect user feedback on results

**Related Docs:**
- [Search Architecture](../01-ARCHITECTURE/ARCHITECTURE_SEARCH_SYSTEM.md)
- [Embeddings Health Monitoring](../NPX_TOOLS_GUIDE.md)

---

### Issue 2.3: Slow Search (<5s)

**Symptoms:**
- Search takes 3-5+ seconds
- Database queries timing out
- High CPU usage during search

**Possible Causes:**
- Missing vector index
- Large result sets
- Unoptimized queries
- Cold database

**Diagnosis:**
```bash
# Profile search performance
time curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "search test", "session_id": "test", "domain": "example.com"}'

# Check index usage
psql $DATABASE_URL -c "
  SELECT schemaname, tablename, indexname, idx_scan, idx_tup_read
  FROM pg_stat_user_indexes
  WHERE tablename = 'page_embeddings';
"

# Check query performance
psql $DATABASE_URL -c "
  EXPLAIN ANALYZE
  SELECT * FROM search_embeddings(
    (SELECT embedding FROM page_embeddings LIMIT 1),
    (SELECT id FROM domains WHERE domain = 'example.com'),
    0.2,
    100
  );
"
```

**Solutions:**
1. Create/recreate vector index:
   ```sql
   DROP INDEX IF EXISTS idx_page_embeddings_vector;

   CREATE INDEX idx_page_embeddings_vector
   ON page_embeddings
   USING ivfflat (embedding vector_cosine_ops)
   WITH (lists = 100);

   ANALYZE page_embeddings;
   ```

2. Reduce search limits:
   ```typescript
   // Use adaptive limits
   const adaptiveLimit = queryWords > 3 ? Math.min(50, limit) : limit;
   ```

3. Add query caching:
   ```typescript
   import { searchCache } from './lib/search-cache';

   const cacheKey = `${query}:${domain}:${limit}`;
   const cached = searchCache.get(cacheKey);
   if (cached) return cached;
   ```

4. Warm up database:
   ```bash
   # Run warmup query
   psql $DATABASE_URL -c "SELECT COUNT(*) FROM page_embeddings;"
   ```

**Prevention:**
- Monitor query performance in pg_stat_statements
- Set up index maintenance schedule
- Use connection pooling
- Implement multi-level caching

**Related Docs:**
- [Performance Optimization](../07-REFERENCE/REFERENCE_PERFORMANCE_OPTIMIZATION.md)
- [Database Optimization](../DATABASE_OPTIMIZATION.md)

---

### Issue 2.4: Embedding Generation Failures

**Symptoms:**
- Error: "Failed to generate embedding"
- Scraped pages have no embeddings
- OpenAI API errors

**Possible Causes:**
- Invalid OpenAI API key
- Rate limiting from OpenAI
- Network timeout
- Invalid input text

**Diagnosis:**
```bash
# Test OpenAI connection
curl https://api.openai.com/v1/embeddings \
  -H "Authorization: Bearer $OPENAI_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "text-embedding-3-small",
    "input": "test"
  }'

# Check embedding generation logs
docker logs omniops-app | grep "embedding"

# Count missing embeddings
psql $DATABASE_URL -c "
  SELECT
    COUNT(sp.id) as total_pages,
    COUNT(pe.id) as pages_with_embeddings
  FROM scraped_pages sp
  LEFT JOIN page_embeddings pe ON sp.id = pe.page_id;
"
```

**Solutions:**
1. Verify API key and quota:
   ```bash
   # Check OpenAI usage
   curl https://api.openai.com/v1/usage \
     -H "Authorization: Bearer $OPENAI_API_KEY"
   ```

2. Add retry logic:
   ```typescript
   // lib/embeddings-functions.ts
   let retries = 3;
   while (retries > 0) {
     try {
       return await generateEmbedding(text);
     } catch (error) {
       retries--;
       if (retries === 0) throw error;
       await sleep(1000 * (4 - retries));
     }
   }
   ```

3. Validate input text:
   ```typescript
   // Clean text before embedding
   const cleaned = text
     .trim()
     .replace(/\s+/g, ' ')
     .substring(0, 8000); // OpenAI limit
   ```

4. Process in batches:
   ```bash
   # Regenerate embeddings for pages without them
   npx tsx regenerate-missing-embeddings.ts
   ```

**Prevention:**
- Monitor OpenAI usage and quotas
- Implement rate limiting
- Add exponential backoff
- Set up embedding health alerts

**Related Docs:**
- [Embedding Functions](../lib/embeddings-functions.ts)
- [OpenAI API Integration](../02-FEATURES/chat-system/README.md)

---

### Issue 2.5: Vector Dimension Mismatch

**Symptoms:**
- Error: "vector dimension mismatch"
- Can't insert embeddings
- Database constraint errors

**Possible Causes:**
- Changed embedding model (ada-002 → 3-small)
- Wrong dimensions specified
- Corrupted embeddings

**Diagnosis:**
```bash
# Check table definition
psql $DATABASE_URL -c "\d page_embeddings"

# Check actual embedding dimensions
psql $DATABASE_URL -c "
  SELECT LENGTH(embedding::text) as dim
  FROM page_embeddings
  LIMIT 1;
"

# Check embedding model
grep "text-embedding" lib/embeddings.ts
```

**Solutions:**
1. Recreate table with correct dimensions:
   ```sql
   -- Backup data first
   CREATE TABLE page_embeddings_backup AS
   SELECT * FROM page_embeddings;

   -- Drop and recreate
   DROP TABLE page_embeddings CASCADE;

   CREATE TABLE page_embeddings (
     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
     page_id UUID REFERENCES scraped_pages(id) ON DELETE CASCADE,
     chunk_text TEXT NOT NULL,
     embedding vector(1536), -- For text-embedding-3-small
     metadata JSONB DEFAULT '{}'::jsonb,
     created_at TIMESTAMPTZ DEFAULT NOW()
   );
   ```

2. Regenerate all embeddings:
   ```bash
   npx tsx regenerate-all-embeddings.ts
   ```

3. Update search function:
   ```sql
   CREATE OR REPLACE FUNCTION search_embeddings(
     query_embedding vector(1536), -- Match dimension
     ...
   )
   ```

**Prevention:**
- Never change embedding model without migration
- Add dimension validation
- Test embeddings after model changes
- Document embedding model choice

**Related Docs:**
- [Pgvector Fix Documentation](../PGVECTOR_FIX_DOCUMENTATION.md)
- [Database Schema](../09-REFERENCE/REFERENCE_DATABASE_SCHEMA.md)

---

### Issue 2.6: Embedding Cache Misses

**Symptoms:**
- Every search regenerates embedding
- High OpenAI API costs
- Slow repeated searches

**Possible Causes:**
- Cache not enabled
- Cache eviction too aggressive
- Query variations ("pump" vs "pumps")

**Diagnosis:**
```bash
# Check cache hit rate
docker logs omniops-app | grep "\[Performance\] Query embedding from cache"

# Monitor cache size
npx tsx << 'EOF'
import { embeddingCache } from './lib/embedding-cache';
console.log('Cache size:', embeddingCache.size);
EOF
```

**Solutions:**
1. Enable embedding cache (already implemented):
   ```typescript
   // lib/embedding-cache.ts
   const cache = new Map<string, number[]>();
   ```

2. Normalize queries before caching:
   ```typescript
   const normalizedQuery = query.toLowerCase().trim();
   const cacheKey = `${normalizedQuery}:${domain}`;
   ```

3. Increase cache size:
   ```typescript
   // lib/embedding-cache.ts
   const MAX_CACHE_SIZE = 1000; // Increase from 500
   ```

4. Implement persistent caching:
   ```typescript
   // Use Redis for cross-instance caching
   await redis.set(`emb:${query}`, JSON.stringify(embedding), 'EX', 3600);
   ```

**Prevention:**
- Monitor cache hit rates
- Log cache statistics
- Tune cache size based on usage
- Implement cache warming

**Related Docs:**
- [Performance Optimization](../07-REFERENCE/REFERENCE_PERFORMANCE_OPTIMIZATION.md)
- [Caching Strategy](../CACHE_CONSISTENCY.md)

---

### Issue 2.7: Chunking Issues

**Symptoms:**
- Chunks too large (>2000 chars)
- Context cut off mid-sentence
- Poor search quality

**Possible Causes:**
- Incorrect chunk size config
- No overlap between chunks
- Chunking algorithm issues

**Diagnosis:**
```bash
# Analyze chunk sizes
npx tsx optimize-chunk-sizes.ts analyze

# Check chunk distribution
psql $DATABASE_URL -c "
  SELECT
    CASE
      WHEN LENGTH(chunk_text) < 500 THEN '< 500'
      WHEN LENGTH(chunk_text) < 1000 THEN '500-1000'
      WHEN LENGTH(chunk_text) < 1500 THEN '1000-1500'
      WHEN LENGTH(chunk_text) < 2000 THEN '1500-2000'
      ELSE '> 2000'
    END as size_range,
    COUNT(*) as count
  FROM page_embeddings
  GROUP BY size_range
  ORDER BY size_range;
"
```

**Solutions:**
1. Optimize chunk sizes:
   ```bash
   npx tsx optimize-chunk-sizes.ts optimize
   ```

2. Adjust chunking parameters:
   ```typescript
   // lib/embeddings-functions.ts
   export function splitIntoChunks(
     text: string,
     maxChars: number = 1000, // Reduce from 1500
     overlap: number = 100
   )
   ```

3. Rechunk all content:
   ```bash
   npx tsx batch-rechunk-embeddings.ts --force
   ```

4. Use semantic chunking:
   ```typescript
   // Split on paragraph boundaries
   const chunks = text.split(/\n\n+/);
   ```

**Prevention:**
- Monitor chunk size distribution
- Test chunking with various content types
- Run periodic chunk optimization
- Alert on oversized chunks

**Related Docs:**
- [Embeddings Functions](../lib/embeddings-functions.ts)
- [NPX Tools Guide](../NPX_TOOLS_GUIDE.md)

---

## 3. Database Issues

### Issue 3.1: Connection Errors

**Symptoms:**
- Error: "Connection refused"
- Error: "ECONNREFUSED"
- "Could not connect to database"

**Possible Causes:**
- Database server down
- Invalid connection string
- Network issues
- Connection pool exhausted

**Diagnosis:**
```bash
# Test database connection
psql $DATABASE_URL -c "SELECT 1;"

# Check connection string
echo $DATABASE_URL | sed 's/:[^:]*@/:****@/'

# Test from application
npx tsx << 'EOF'
import { createClient } from '@supabase/supabase-js';
const client = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
const { data, error } = await client.from('domains').select('count');
console.log(error || 'Connected!');
EOF

# Check connection pool
psql $DATABASE_URL -c "
  SELECT count(*), state
  FROM pg_stat_activity
  GROUP BY state;
"
```

**Solutions:**
1. Verify Supabase credentials:
   ```bash
   # Check environment variables
   env | grep SUPABASE
   ```

2. Test network connectivity:
   ```bash
   ping birugqyuqhiahxvxeyqg.supabase.co
   curl https://birugqyuqhiahxvxeyqg.supabase.co
   ```

3. Increase connection pool:
   ```typescript
   // lib/supabase/server.ts
   const supabase = createClient(url, key, {
     db: {
       poolerOptions: {
         min: 2,
         max: 20 // Increase from 10
       }
     }
   });
   ```

4. Restart application:
   ```bash
   docker-compose restart app
   ```

**Prevention:**
- Monitor connection pool usage
- Implement connection retry logic
- Set up database health checks
- Use connection pooling (Supavisor)

**Related Docs:**
- [Database Schema](../09-REFERENCE/REFERENCE_DATABASE_SCHEMA.md)
- [Supabase Setup](../SUPABASE_SETUP_INSTRUCTIONS.md)

---

### Issue 3.2: RLS (Row Level Security) Blocking Access

**Symptoms:**
- Query returns 0 rows but data exists
- "Permission denied" error
- Different results in dashboard vs API

**Possible Causes:**
- RLS policy too restrictive
- Using anon key instead of service role
- Missing JWT token
- Wrong user context

**Diagnosis:**
```bash
# Check RLS policies
psql $DATABASE_URL -c "
  SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
  FROM pg_policies
  WHERE tablename = 'scraped_pages';
"

# Test with service role
npx tsx << 'EOF'
import { createServiceRoleClient } from './lib/supabase/server';
const supabase = await createServiceRoleClient();
const { data, error } = await supabase.from('scraped_pages').select('*').limit(1);
console.log('Error:', error);
console.log('Count:', data?.length);
EOF

# Check which client is being used
grep -r "createClient\|createServiceRoleClient" lib/
```

**Solutions:**
1. Use service role client for backend operations:
   ```typescript
   // lib/embeddings.ts
   import { createServiceRoleClient } from '@/lib/supabase/server';
   const supabase = await createServiceRoleClient(); // Not createClient()
   ```

2. Disable RLS temporarily for testing:
   ```sql
   ALTER TABLE scraped_pages DISABLE ROW LEVEL SECURITY;
   -- Test query
   -- Re-enable: ALTER TABLE scraped_pages ENABLE ROW LEVEL SECURITY;
   ```

3. Fix RLS policy:
   ```sql
   -- Allow service role to bypass RLS
   CREATE POLICY "Service role bypass"
   ON scraped_pages
   FOR ALL
   TO service_role
   USING (true);
   ```

4. Add auth context:
   ```typescript
   const { data: { user } } = await supabase.auth.getUser();
   // Pass user context to query
   ```

**Prevention:**
- Always use service role for backend
- Test RLS policies thoroughly
- Document which client to use where
- Add RLS tests to test suite

**Related Docs:**
- [RLS Testing Infrastructure](../RLS_TESTING_INFRASTRUCTURE.md)
- [Supabase Security](../02-FEATURES/chat-system/README.md#security)

---

### Issue 3.3: Slow Database Queries (>2s)

**Symptoms:**
- Queries taking 2-10+ seconds
- API timeouts
- High database CPU usage

**Possible Causes:**
- Missing indexes
- Unoptimized queries
- Large table scans
- Statistics out of date

**Diagnosis:**
```bash
# Find slow queries
psql $DATABASE_URL -c "
  SELECT query, calls, mean_exec_time, max_exec_time
  FROM pg_stat_statements
  ORDER BY mean_exec_time DESC
  LIMIT 10;
"

# Check index usage
psql $DATABASE_URL -c "
  SELECT
    schemaname,
    tablename,
    indexname,
    idx_scan,
    idx_tup_read,
    idx_tup_fetch
  FROM pg_stat_user_indexes
  ORDER BY idx_scan;
"

# Explain specific query
psql $DATABASE_URL -c "
  EXPLAIN ANALYZE
  SELECT * FROM scraped_pages WHERE domain_id = 'uuid-here';
"
```

**Solutions:**
1. Add missing indexes:
   ```sql
   -- Common indexes
   CREATE INDEX IF NOT EXISTS idx_scraped_pages_domain_id
   ON scraped_pages(domain_id);

   CREATE INDEX IF NOT EXISTS idx_page_embeddings_page_id
   ON page_embeddings(page_id);

   CREATE INDEX IF NOT EXISTS idx_messages_conversation_id
   ON messages(conversation_id);
   ```

2. Update table statistics:
   ```sql
   ANALYZE scraped_pages;
   ANALYZE page_embeddings;
   ANALYZE messages;
   ```

3. Optimize problematic queries:
   ```typescript
   // Add .limit() to prevent large scans
   const { data } = await supabase
     .from('scraped_pages')
     .select('*')
     .eq('domain_id', domainId)
     .limit(1000); // Prevent unbounded query
   ```

4. Use prepared statements:
   ```typescript
   // Cache query plans
   const statement = await supabase.rpc('cached_search', params);
   ```

**Prevention:**
- Monitor slow query log
- Set up query performance alerts
- Run ANALYZE regularly
- Review execution plans for new queries

**Related Docs:**
- [Database Optimization](../DATABASE_OPTIMIZATION.md)
- [Performance Analysis](../reports/DATABASE_PERFORMANCE_ANALYSIS.md)

---

### Issue 3.4: Migration Failures

**Symptoms:**
- Migration won't apply
- Error: "relation already exists"
- Inconsistent schema between environments

**Possible Causes:**
- Schema drift
- Failed partial migration
- Conflicting migrations
- Missing dependencies

**Diagnosis:**
```bash
# Check migration status
psql $DATABASE_URL -c "SELECT * FROM supabase_migrations.schema_migrations;"

# Compare schemas
pg_dump $DATABASE_URL --schema-only > production.sql
pg_dump $DEV_DATABASE_URL --schema-only > dev.sql
diff production.sql dev.sql

# Check for conflicts
psql $DATABASE_URL -c "\d page_embeddings"
```

**Solutions:**
1. Reset migrations (development only):
   ```sql
   TRUNCATE supabase_migrations.schema_migrations;
   ```

2. Apply migration manually:
   ```bash
   psql $DATABASE_URL -f supabase/migrations/20240101_migration.sql
   ```

3. Fix schema drift:
   ```sql
   -- Drop conflicting object
   DROP TABLE IF EXISTS conflicting_table CASCADE;
   -- Re-run migration
   ```

4. Use Supabase Management API for complex migrations:
   ```bash
   curl -X POST https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query \
     -H "Authorization: Bearer ${SUPABASE_ACCESS_TOKEN}" \
     -H "Content-Type: application/json" \
     -d '{"query": "ALTER TABLE ..."}'
   ```

**Prevention:**
- Always test migrations on staging first
- Version control all migrations
- Never edit applied migrations
- Use migration locking

**Related Docs:**
- [Database Schema](../09-REFERENCE/REFERENCE_DATABASE_SCHEMA.md)
- [Migration Instructions](../setup/MIGRATION_INSTRUCTIONS.md)

---

### Issue 3.5: Foreign Key Violations

**Symptoms:**
- Error: "violates foreign key constraint"
- Can't delete records
- Insert fails with FK error

**Possible Causes:**
- Trying to delete referenced row
- Inserting with invalid FK
- Missing CASCADE on FK
- Orphaned records

**Diagnosis:**
```bash
# Check foreign key constraints
psql $DATABASE_URL -c "
  SELECT
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    rc.delete_rule
  FROM information_schema.table_constraints AS tc
  JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
  JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
  JOIN information_schema.referential_constraints rc
    ON tc.constraint_name = rc.constraint_name
  WHERE constraint_type = 'FOREIGN KEY';
"

# Find orphaned records
psql $DATABASE_URL -c "
  SELECT pe.id
  FROM page_embeddings pe
  LEFT JOIN scraped_pages sp ON pe.page_id = sp.id
  WHERE sp.id IS NULL;
"
```

**Solutions:**
1. Add CASCADE to foreign keys:
   ```sql
   ALTER TABLE page_embeddings
   DROP CONSTRAINT page_embeddings_page_id_fkey,
   ADD CONSTRAINT page_embeddings_page_id_fkey
     FOREIGN KEY (page_id)
     REFERENCES scraped_pages(id)
     ON DELETE CASCADE;
   ```

2. Delete in correct order:
   ```typescript
   // Delete children first
   await supabase.from('page_embeddings').delete().eq('page_id', pageId);
   await supabase.from('scraped_pages').delete().eq('id', pageId);
   ```

3. Clean up orphaned records:
   ```sql
   DELETE FROM page_embeddings
   WHERE page_id NOT IN (SELECT id FROM scraped_pages);
   ```

4. Use database cleaner utility:
   ```bash
   npx tsx test-database-cleanup.ts clean --domain=example.com
   ```

**Prevention:**
- Always use CASCADE on foreign keys
- Test deletion flows
- Implement soft deletes for critical data
- Run orphan cleanup periodically

**Related Docs:**
- [Database Cleanup](../DATABASE_CLEANUP.md)
- [Database Schema](../09-REFERENCE/REFERENCE_DATABASE_SCHEMA.md)

---

### Issue 3.6: Out of Memory Errors

**Symptoms:**
- Error: "out of memory"
- Database crashes
- Connection pool errors

**Possible Causes:**
- Large query results
- Memory-intensive operations
- Connection leak
- Insufficient resources

**Diagnosis:**
```bash
# Check database memory usage
psql $DATABASE_URL -c "
  SELECT
    pg_size_pretty(pg_database_size(current_database())) as db_size,
    pg_size_pretty(pg_total_relation_size('scraped_pages')) as scraped_pages_size,
    pg_size_pretty(pg_total_relation_size('page_embeddings')) as embeddings_size;
"

# Check connection leaks
psql $DATABASE_URL -c "
  SELECT
    pid,
    usename,
    application_name,
    state,
    query_start
  FROM pg_stat_activity
  WHERE state != 'idle'
  ORDER BY query_start;
"
```

**Solutions:**
1. Add pagination to large queries:
   ```typescript
   const pageSize = 100;
   let page = 0;
   while (true) {
     const { data } = await supabase
       .from('scraped_pages')
       .select('*')
       .range(page * pageSize, (page + 1) * pageSize - 1);
     if (!data.length) break;
     // Process data
     page++;
   }
   ```

2. Close connections properly:
   ```typescript
   try {
     const { data } = await supabase.from('table').select('*');
   } finally {
     // Connection automatically returned to pool
   }
   ```

3. Increase database resources (Supabase dashboard):
   - Upgrade to larger instance
   - Enable connection pooling

4. Clean up old data:
   ```bash
   npx tsx test-database-cleanup.ts clean
   ```

**Prevention:**
- Always paginate large queries
- Monitor database size
- Set up automatic cleanup jobs
- Use streaming for large results

**Related Docs:**
- [Performance Optimization](../07-REFERENCE/REFERENCE_PERFORMANCE_OPTIMIZATION.md)
- [Database Cleanup](../DATABASE_CLEANUP.md)

---

### Issue 3.7: Table Locks and Deadlocks

**Symptoms:**
- Queries hanging indefinitely
- Error: "deadlock detected"
- Timeouts on writes

**Possible Causes:**
- Long-running transactions
- Multiple writers to same row
- Lock escalation
- Improper transaction management

**Diagnosis:**
```bash
# Check for locks
psql $DATABASE_URL -c "
  SELECT
    pid,
    state,
    usename,
    query,
    query_start
  FROM pg_stat_activity
  WHERE state = 'active';
"

# Check for blocking queries
psql $DATABASE_URL -c "
  SELECT
    blocked_locks.pid AS blocked_pid,
    blocking_locks.pid AS blocking_pid,
    blocked_activity.query AS blocked_query,
    blocking_activity.query AS blocking_query
  FROM pg_catalog.pg_locks blocked_locks
  JOIN pg_catalog.pg_stat_activity blocked_activity ON blocked_activity.pid = blocked_locks.pid
  JOIN pg_catalog.pg_locks blocking_locks
    ON blocking_locks.locktype = blocked_locks.locktype
    AND blocking_locks.database IS NOT DISTINCT FROM blocked_locks.database
    AND blocking_locks.relation IS NOT DISTINCT FROM blocked_locks.relation
  JOIN pg_catalog.pg_stat_activity blocking_activity ON blocking_activity.pid = blocking_locks.pid
  WHERE NOT blocked_locks.granted;
"
```

**Solutions:**
1. Kill blocking queries:
   ```sql
   SELECT pg_terminate_backend(pid)
   FROM pg_stat_activity
   WHERE pid = blocking_pid;
   ```

2. Reduce transaction time:
   ```typescript
   // Use smaller transactions
   for (const batch of batches) {
     await supabase.from('table').insert(batch);
     // Transaction committed here
   }
   ```

3. Use proper transaction isolation:
   ```sql
   BEGIN TRANSACTION ISOLATION LEVEL READ COMMITTED;
   -- queries
   COMMIT;
   ```

4. Add statement timeout:
   ```sql
   SET statement_timeout = '30s';
   ```

**Prevention:**
- Keep transactions short
- Use appropriate isolation levels
- Avoid holding locks during I/O
- Monitor long-running queries

**Related Docs:**
- [Database Performance](../reports/DATABASE_PERFORMANCE_ANALYSIS.md)
- [PostgreSQL Documentation](https://postgresql.org/docs)

---

## 4. WooCommerce Integration Issues

### Issue 4.1: 401 Unauthorized Errors

**Symptoms:**
- Error: "401 Unauthorized"
- Can't fetch products/orders
- WooCommerce API returns authentication error

**Possible Causes:**
- Invalid consumer key/secret
- API keys regenerated
- Wrong permissions
- URL mismatch (http vs https)

**Diagnosis:**
```bash
# Test WooCommerce connection directly
curl "https://example.com/wp-json/wc/v3/system_status" \
  --user "ck_xxx:cs_xxx"

# Test from application
npx tsx << 'EOF'
import { testWooCommerceConnection } from './lib/woocommerce-api';
const result = await testWooCommerceConnection('example.com');
console.log(result);
EOF

# Check stored credentials
psql $DATABASE_URL -c "
  SELECT domain, woocommerce_url,
    CASE WHEN woocommerce_consumer_key IS NOT NULL THEN '[SET]' ELSE '[NOT SET]' END as key_status
  FROM customer_configs
  WHERE domain = 'example.com';
"
```

**Solutions:**
1. Regenerate API keys in WordPress:
   - Go to WooCommerce → Settings → Advanced → REST API
   - Click "Add key"
   - Description: "Customer Service Bot"
   - User: Administrator
   - Permissions: Read/Write
   - Copy Consumer Key (starts with `ck_`) and Consumer Secret (starts with `cs_`)

2. Update credentials in application:
   ```bash
   # Update environment variables
   echo "WOOCOMMERCE_CONSUMER_KEY=ck_xxx" >> .env.local
   echo "WOOCOMMERCE_CONSUMER_SECRET=cs_xxx" >> .env.local

   # Or update in database (encrypted)
   npx tsx update-woocommerce-credentials.ts
   ```

3. Verify API permissions:
   ```bash
   # Test with new credentials
   curl "https://example.com/wp-json/wc/v3/products" \
     --user "ck_xxx:cs_xxx"
   ```

4. Check URL format:
   ```typescript
   // Ensure consistent URL format
   const url = woocommerceUrl.replace(/\/$/, ''); // Remove trailing slash
   ```

**Prevention:**
- Document API key rotation process
- Set up credential expiry alerts
- Test credentials in CI/CD
- Keep backup of working credentials

**Related Docs:**
- [WooCommerce Auth Fix](../woocommerce/WOOCOMMERCE_AUTH_FIX.md)
- [WooCommerce Integration Guide](../WOOCOMMERCE_INTEGRATION_GUIDE.md)

---

### Issue 4.2: Product Lookup Failures

**Symptoms:**
- Can't find products by name/SKU
- Empty search results from WooCommerce
- API returns 200 but empty array

**Possible Causes:**
- Product not published
- Search query too specific
- WooCommerce search limitations
- Incorrect API parameters

**Diagnosis:**
```bash
# Test product search
curl "https://example.com/wp-json/wc/v3/products?search=pump" \
  --user "ck_xxx:cs_xxx"

# Check product status
curl "https://example.com/wp-json/wc/v3/products?status=any" \
  --user "ck_xxx:cs_xxx"

# Test specific product
curl "https://example.com/wp-json/wc/v3/products/123" \
  --user "ck_xxx:cs_xxx"
```

**Solutions:**
1. Use broader search terms:
   ```typescript
   // lib/woocommerce-api/products.ts
   const searchTerm = query.split(' ')[0]; // Use first word only
   ```

2. Search multiple fields:
   ```typescript
   // Search by SKU if name fails
   const byName = await woocommerce.get(`products?search=${query}`);
   if (!byName.data.length) {
     const bySKU = await woocommerce.get(`products?sku=${query}`);
     return bySKU.data;
   }
   ```

3. Include draft products in development:
   ```typescript
   const params = {
     search: query,
     status: process.env.NODE_ENV === 'development' ? 'any' : 'publish'
   };
   ```

4. Cache product catalog:
   ```bash
   npx tsx sync-woocommerce-products.ts
   ```

**Prevention:**
- Regularly sync product catalog
- Test with various search terms
- Monitor search success rates
- Implement fuzzy matching

**Related Docs:**
- [WooCommerce API Spec](../WOOCOMMERCE_API_SPEC.md)
- [Product Search Fix](../PRODUCT_SEARCH_FIX.md)

---

### Issue 4.3: Order Retrieval Issues

**Symptoms:**
- Can't find customer orders
- Wrong order details returned
- Missing order information

**Possible Causes:**
- Wrong customer email
- Case sensitivity mismatch
- Order in draft status
- API pagination issues

**Diagnosis:**
```bash
# Search orders by customer email
curl "https://example.com/wp-json/wc/v3/orders?customer_email=user@example.com" \
  --user "ck_xxx:cs_xxx"

# Check order status
curl "https://example.com/wp-json/wc/v3/orders?status=any" \
  --user "ck_xxx:cs_xxx"

# Test from application
npx tsx << 'EOF'
import { getCustomerOrders } from './lib/woocommerce-api/orders';
const orders = await getCustomerOrders('user@example.com');
console.log('Orders:', orders.length);
EOF
```

**Solutions:**
1. Normalize email for search:
   ```typescript
   // lib/woocommerce-api/orders.ts
   const normalizedEmail = email.toLowerCase().trim();
   ```

2. Search across all order statuses:
   ```typescript
   const params = {
     customer_email: email,
     status: 'any', // Not just 'completed'
     per_page: 100
   };
   ```

3. Handle pagination:
   ```typescript
   let allOrders = [];
   let page = 1;
   while (true) {
     const { data, headers } = await woocommerce.get(`orders?page=${page}&per_page=100`);
     allOrders = [...allOrders, ...data];
     if (!headers['x-wp-totalpages'] || page >= parseInt(headers['x-wp-totalpages'])) {
       break;
     }
     page++;
   }
   ```

4. Verify customer ID matching:
   ```sql
   SELECT * FROM customers WHERE email = 'user@example.com';
   ```

**Prevention:**
- Always normalize emails
- Handle pagination properly
- Cache customer orders
- Test with various email formats

**Related Docs:**
- [WooCommerce Order Tracking](../WOOCOMMERCE_ABANDONED_CARTS.md)
- [WooCommerce Integration](../WOOCOMMERCE_INTEGRATION_90_PERCENT.md)

---

### Issue 4.4: Domain Verification Failing

**Symptoms:**
- Error: "Domain verification failed"
- Can't enable WooCommerce integration
- Verification endpoint not accessible

**Possible Causes:**
- Firewall blocking request
- WordPress security plugin interfering
- Incorrect verification code
- SSL/TLS issues

**Diagnosis:**
```bash
# Test verification endpoint
curl https://example.com/.well-known/omniops-verify.txt

# Check with different user agent
curl -A "Mozilla/5.0" https://example.com/.well-known/omniops-verify.txt

# Test from application
npx tsx << 'EOF'
import { verifyDomainOwnership } from './lib/domain-verification';
const result = await verifyDomainOwnership('example.com', 'code-123');
console.log('Verified:', result);
EOF
```

**Solutions:**
1. Place verification file in correct location:
   ```bash
   # WordPress root directory
   echo "omniops-verification:code-123" > /var/www/html/.well-known/omniops-verify.txt
   ```

2. Add exception to security plugin:
   - Wordfence: Whitelist `/.well-known/` path
   - iThemes Security: Allow direct file access

3. Configure nginx/Apache:
   ```nginx
   # nginx
   location /.well-known/ {
     allow all;
   }

   # Apache
   <Directory /var/www/html/.well-known>
     Require all granted
   </Directory>
   ```

4. Use alternative verification method (DNS):
   ```bash
   # Add TXT record
   omniops-verify=code-123
   ```

**Prevention:**
- Document verification requirements
- Support multiple verification methods
- Test verification in staging
- Monitor verification endpoint health

**Related Docs:**
- [Customer Verification System](../CUSTOMER_VERIFICATION_SYSTEM.md)
- [Quick Start](../QUICK_START_CUSTOMER_VERIFICATION.md)

---

### Issue 4.5: Stock Level Inaccuracies

**Symptoms:**
- Stock levels shown are incorrect
- Out-of-stock items show as available
- Stock not updating after orders

**Possible Causes:**
- Cache not invalidating
- WooCommerce stock management disabled
- Sync delay
- Multiple stock sources

**Diagnosis:**
```bash
# Check stock in WooCommerce
curl "https://example.com/wp-json/wc/v3/products/123" \
  --user "ck_xxx:cs_xxx" | jq '.stock_quantity'

# Check cached stock
npx tsx << 'EOF'
import { getProductStock } from './lib/woocommerce-api/products';
const stock = await getProductStock('123');
console.log('Cached:', stock);
EOF

# Compare with database
psql $DATABASE_URL -c "
  SELECT extracted_data->>'stock_quantity'
  FROM structured_extractions
  WHERE extract_type = 'product'
    AND extracted_data->>'id' = '123';
"
```

**Solutions:**
1. Enable WooCommerce stock management:
   - WooCommerce → Settings → Products → Inventory
   - Enable "Manage stock"

2. Force cache refresh:
   ```bash
   npx tsx invalidate-product-cache.ts --product-id=123
   ```

3. Implement webhook for stock updates:
   ```typescript
   // app/api/webhooks/woocommerce/route.ts
   if (topic === 'product.updated') {
     await invalidateProductCache(productId);
   }
   ```

4. Show real-time stock:
   ```typescript
   // Always fetch fresh stock for critical operations
   const freshStock = await woocommerce.get(`products/${id}`);
   ```

**Prevention:**
- Set up WooCommerce webhooks
- Monitor stock sync jobs
- Cache with short TTL (5 minutes)
- Alert on stock discrepancies

**Related Docs:**
- [Stock Testing Guide](../woocommerce/STOCK_TESTING_GUIDE.md)
- [Stock Implementation Report](../woocommerce/STOCK_IMPLEMENTATION_REPORT.md)

---

### Issue 4.6: Cart Tracking Not Working

**Symptoms:**
- Abandoned carts not detected
- Cart data not saving
- Webhook not firing

**Possible Causes:**
- Webhook not configured
- Session tracking disabled
- Guest checkout issues
- Cookie blocking

**Diagnosis:**
```bash
# Check webhook configuration
curl "https://example.com/wp-json/wc/v3/webhooks" \
  --user "ck_xxx:cs_xxx"

# Test webhook endpoint
curl -X POST http://localhost:3000/api/webhooks/woocommerce \
  -H "Content-Type: application/json" \
  -d '{"topic": "cart.updated", "cart_key": "test-123"}'

# Check cart storage
psql $DATABASE_URL -c "
  SELECT * FROM abandoned_carts
  WHERE created_at > NOW() - INTERVAL '1 hour';
"
```

**Solutions:**
1. Configure WooCommerce webhook:
   - WooCommerce → Settings → Advanced → Webhooks
   - Add webhook:
     - Name: "Omniops Cart Tracking"
     - Status: Active
     - Topic: Action → woocommerce_cart_updated
     - Delivery URL: https://yourapp.com/api/webhooks/woocommerce

2. Enable session tracking:
   ```php
   // WordPress functions.php
   add_filter('woocommerce_persistent_cart_enabled', '__return_true');
   ```

3. Test cart detection:
   ```bash
   npx tsx test-abandoned-carts.ts
   ```

4. Implement client-side tracking:
   ```javascript
   // Track cart in localStorage
   localStorage.setItem('cart_key', cartKey);
   ```

**Prevention:**
- Monitor webhook delivery rates
- Test cart tracking regularly
- Set up webhook retry logic
- Alert on tracking failures

**Related Docs:**
- [Abandoned Carts](../WOOCOMMERCE_ABANDONED_CARTS.md)
- [WooCommerce Webhooks](../woocommerce/WOOCOMMERCE_IMPLEMENTATION_COMPLETE.md)

---

## 5. Scraping Issues

### Issue 5.1: Scraping Won't Start

**Symptoms:**
- Scrape job stays in "pending" status
- No pages being scraped
- Queue not processing

**Possible Causes:**
- Redis not running
- Worker not started
- Job queue stuck
- Invalid domain

**Diagnosis:**
```bash
# Check Redis connection
redis-cli ping
# or
docker exec -it omniops-redis redis-cli ping

# Check queue status
npx tsx << 'EOF'
import { getJobStatus } from './lib/redis';
const jobs = await getJobStatus('scrape');
console.log('Pending jobs:', jobs.pending);
EOF

# Check worker logs
docker logs omniops-app | grep "worker"

# Test scrape manually
curl -X POST http://localhost:3000/api/scrape \
  -H "Content-Type: application/json" \
  -d '{"domain": "example.com"}'
```

**Solutions:**
1. Start Redis if not running:
   ```bash
   # Docker
   docker-compose up -d redis

   # Local
   redis-server
   ```

2. Start background worker:
   ```bash
   # In separate terminal
   npm run worker

   # Or with Docker
   docker-compose up -d worker
   ```

3. Clear stuck jobs:
   ```bash
   npx tsx << 'EOF'
   import { clearQueue } from './lib/redis';
   await clearQueue('scrape');
   EOF
   ```

4. Validate domain:
   ```bash
   # Ensure domain is accessible
   curl -I https://example.com
   ```

**Prevention:**
- Monitor Redis health
- Auto-restart worker on crash
- Set job timeouts
- Validate domains before queueing

**Related Docs:**
- [Scraping System](../02-FEATURES/scraping/README.md)
- [Background Worker](../BACKGROUND_WORKER_README.md)

---

### Issue 5.2: Scraping Stuck/Slow

**Symptoms:**
- Scrape runs for hours
- Only a few pages scraped
- Worker using 100% CPU

**Possible Causes:**
- JavaScript-heavy site
- Infinite pagination
- Rate limiting
- Memory leak

**Diagnosis:**
```bash
# Check scrape progress
psql $DATABASE_URL -c "
  SELECT
    domain_id,
    COUNT(*) as pages_scraped,
    MAX(scraped_at) as last_page,
    MIN(scraped_at) as first_page
  FROM scraped_pages
  GROUP BY domain_id;
"

# Monitor memory usage
docker stats omniops-app --no-stream

# Check worker logs
docker logs omniops-app --tail 100 | grep "scraping"

# Test problematic URL
curl -I https://example.com/slow-page
```

**Solutions:**
1. Configure crawler limits:
   ```typescript
   // lib/crawler-config.ts
   maxRequestsPerCrawl: 500, // Reduce from 1000
   maxConcurrency: 3, // Reduce from 5
   navigationTimeout: 30000, // 30s timeout
   ```

2. Skip problematic patterns:
   ```typescript
   // Add to exclude patterns
   excludePatterns: [
     /.*\/page\/[0-9]+/,  // Pagination
     /.*\?.*&.*&/,  // Complex query strings
     /.*\/wp-admin/,  // Admin pages
   ]
   ```

3. Enable request caching:
   ```typescript
   // lib/crawler-config.ts
   cacheStorage: new MemoryStorage(),
   ```

4. Restart scraper:
   ```bash
   # Cancel current job
   npx tsx cancel-scrape-job.ts --domain=example.com

   # Restart with limits
   curl -X POST http://localhost:3000/api/scrape \
     -d '{"domain": "example.com", "maxPages": 100}'
   ```

**Prevention:**
- Set reasonable defaults
- Monitor scrape duration
- Implement automatic timeouts
- Test on sample sites first

**Related Docs:**
- [Scraper Configuration](../SCRAPER_CONFIGURATION.md)
- [Scraper Performance](../scraper/SCRAPER_PERFORMANCE_OPTIMIZATION.md)

---

### Issue 5.3: Pages Not Being Indexed

**Symptoms:**
- Pages scraped but not searchable
- No embeddings generated
- Content extraction failed

**Possible Causes:**
- Embedding generation disabled
- Content too short/long
- HTML parsing errors
- Queue backlog

**Diagnosis:**
```bash
# Check scraping vs embeddings
psql $DATABASE_URL -c "
  SELECT
    COUNT(sp.id) as scraped_pages,
    COUNT(pe.id) as pages_with_embeddings,
    COUNT(sp.id) - COUNT(pe.id) as missing_embeddings
  FROM scraped_pages sp
  LEFT JOIN page_embeddings pe ON sp.id = pe.page_id
  WHERE sp.domain_id = (SELECT id FROM domains WHERE domain = 'example.com');
"

# Check content extraction
psql $DATABASE_URL -c "
  SELECT url, LENGTH(content), status
  FROM scraped_pages
  WHERE content IS NULL OR LENGTH(content) < 100
  LIMIT 10;
"

# Check embedding queue
docker logs omniops-app | grep "embedding"
```

**Solutions:**
1. Generate missing embeddings:
   ```bash
   npx tsx regenerate-missing-embeddings.ts --domain=example.com
   ```

2. Fix content extraction:
   ```typescript
   // lib/content-extractor.ts
   // Add fallback extraction methods
   if (!content || content.length < 100) {
     content = extractFromRawHtml(html);
   }
   ```

3. Adjust content filters:
   ```typescript
   // Allow shorter content
   const MIN_CONTENT_LENGTH = 50; // Reduce from 100
   ```

4. Process in batches:
   ```bash
   npx tsx batch-process-embeddings.ts --batch-size=10
   ```

**Prevention:**
- Monitor embedding generation rate
- Set up alerts for backlogs
- Test extraction on various sites
- Validate content before embedding

**Related Docs:**
- [Scraping & Embedding System](../ARCHIVE/old-docs/scraping/SCRAPING_AND_EMBEDDING_SYSTEM.md)
- [Embedding Functions](../lib/embeddings-functions.ts)

---

### Issue 5.4: Content Extraction Failures

**Symptoms:**
- Blank content in database
- HTML stored but no text
- Error: "Failed to extract content"

**Possible Causes:**
- Complex HTML structure
- JavaScript-rendered content
- Cloudflare/bot protection
- Invalid HTML

**Diagnosis:**
```bash
# Check failed extractions
psql $DATABASE_URL -c "
  SELECT url, status, error_message
  FROM scraped_pages
  WHERE content IS NULL OR LENGTH(content) < 50
  LIMIT 10;
"

# Test extraction manually
npx tsx << 'EOF'
import { extractContent } from './lib/content-extractor';
const html = await fetch('https://example.com').then(r => r.text());
const content = extractContent(html);
console.log('Extracted:', content.substring(0, 200));
EOF

# Check for bot protection
curl -A "Mozilla/5.0" https://example.com | grep -i cloudflare
```

**Solutions:**
1. Use Mozilla Readability:
   ```typescript
   // lib/content-extractor.ts
   import { Readability } from '@mozilla/readability';
   import { JSDOM } from 'jsdom';

   const dom = new JSDOM(html);
   const reader = new Readability(dom.window.document);
   const article = reader.parse();
   ```

2. Add fallback extractors:
   ```typescript
   const extractors = [
     extractWithReadability,
     extractWithCheerio,
     extractFromRawHtml
   ];

   for (const extractor of extractors) {
     const content = extractor(html);
     if (content && content.length > 100) {
       return content;
     }
   }
   ```

3. Enable JavaScript rendering:
   ```typescript
   // lib/crawler-config.ts
   preNavigationHooks: [
     async ({ page }) => {
       await page.waitForLoadState('networkidle');
     }
   ]
   ```

4. Add custom selectors:
   ```typescript
   // For specific sites
   const customSelectors = {
     'wordpress.com': 'article.post',
     'shopify.com': '.product-description'
   };
   ```

**Prevention:**
- Test extraction on various sites
- Monitor extraction success rates
- Maintain fallback methods
- Update selectors regularly

**Related Docs:**
- [Content Extraction](../lib/content-extractor.ts)
- [Scraper Enhancements](../SCRAPER_ENHANCEMENTS_COMPLETE_GUIDE.md)

---

### Issue 5.5: Redis Connection Errors

**Symptoms:**
- Error: "Redis connection failed"
- Error: "ECONNREFUSED ::1:6379"
- Jobs not being queued

**Possible Causes:**
- Redis not running
- Wrong Redis URL
- Network issues
- Redis out of memory

**Diagnosis:**
```bash
# Test Redis connection
redis-cli ping

# Check Redis info
redis-cli INFO

# Test from application
npx tsx << 'EOF'
import { redis } from './lib/redis';
const pong = await redis.ping();
console.log('Redis:', pong);
EOF

# Check Redis URL
echo $REDIS_URL
```

**Solutions:**
1. Start Redis:
   ```bash
   # Docker
   docker-compose up -d redis

   # Check status
   docker ps | grep redis
   ```

2. Fix Redis URL:
   ```bash
   # Development (local)
   export REDIS_URL=redis://localhost:6379

   # Docker
   export REDIS_URL=redis://redis:6379

   # Production
   export REDIS_URL=redis://user:pass@host:port
   ```

3. Clear Redis memory:
   ```bash
   redis-cli FLUSHDB
   ```

4. Increase Redis memory:
   ```bash
   # docker-compose.yml
   services:
     redis:
       command: redis-server --maxmemory 512mb
   ```

**Prevention:**
- Monitor Redis health
- Set up automatic restarts
- Implement connection retry logic
- Use Redis persistence

**Related Docs:**
- [Redis Setup](../docs/00-GETTING-STARTED/VERCEL_REDIS_SETUP.md)
- [Docker Configuration](../00-GETTING-STARTED/SETUP_DOCKER_PRODUCTION.md)

---

### Issue 5.6: Queue Stuck/Not Processing

**Symptoms:**
- Jobs piling up in queue
- Worker not consuming jobs
- Queue depth increasing

**Possible Causes:**
- Worker crashed
- Job processing errors
- Concurrency limit reached
- Deadlock in queue

**Diagnosis:**
```bash
# Check queue depth
redis-cli LLEN scrape:queue

# Check worker status
ps aux | grep worker

# Check job statuses
npx tsx << 'EOF'
import { getQueueStats } from './lib/redis';
const stats = await getQueueStats();
console.log('Stats:', stats);
EOF

# Check for stuck jobs
redis-cli LRANGE scrape:active 0 -1
```

**Solutions:**
1. Restart worker:
   ```bash
   pkill -f worker
   npm run worker
   ```

2. Clear stuck jobs:
   ```bash
   npx tsx << 'EOF'
   import { clearStuckJobs } from './lib/redis';
   await clearStuckJobs('scrape');
   EOF
   ```

3. Increase concurrency:
   ```typescript
   // lib/worker.ts
   const concurrency = 5; // Increase from 3
   ```

4. Reset queue:
   ```bash
   redis-cli DEL scrape:queue scrape:active scrape:failed
   ```

**Prevention:**
- Monitor queue depth
- Implement job timeouts
- Add health checks for worker
- Set up automatic recovery

**Related Docs:**
- [Queue Monitoring](../QUEUE_MONITORING_TEST_REPORT.md)
- [Background Worker](../BACKGROUND_WORKER_README.md)

---

### Issue 5.7: Memory Issues During Scraping

**Symptoms:**
- Worker crashes with OOM
- Server becomes unresponsive
- Swap usage high

**Possible Causes:**
- Too many concurrent scrapes
- Large pages (images/videos)
- Memory leaks
- No garbage collection

**Diagnosis:**
```bash
# Monitor memory during scrape
docker stats omniops-app

# Check memory usage
ps aux | grep node | awk '{print $6}'

# Analyze heap
npx tsx << 'EOF'
const used = process.memoryUsage();
for (let key in used) {
  console.log(`${key}: ${Math.round(used[key] / 1024 / 1024 * 100) / 100} MB`);
}
EOF
```

**Solutions:**
1. Reduce concurrency:
   ```typescript
   // lib/crawler-config.ts
   maxConcurrency: 2, // Reduce from 5
   ```

2. Implement pagination:
   ```typescript
   // Process in batches
   for (let i = 0; i < urls.length; i += 50) {
     const batch = urls.slice(i, i + 50);
     await processBatch(batch);
     global.gc && global.gc(); // Force GC
   }
   ```

3. Skip large files:
   ```typescript
   // lib/crawler-config.ts
   preNavigationHooks: [
     async ({ page, request }) => {
       await page.route('**/*', route => {
         const url = route.request().url();
         if (url.match(/\.(jpg|png|gif|mp4|pdf)$/i)) {
           route.abort();
         } else {
           route.continue();
         }
       });
     }
   ]
   ```

4. Increase memory limit:
   ```bash
   # node --max-old-space-size=4096
   NODE_OPTIONS="--max-old-space-size=4096" npm run worker
   ```

**Prevention:**
- Monitor memory usage
- Set memory limits
- Implement streaming where possible
- Profile for memory leaks

**Related Docs:**
- [Scraper Memory Optimization](../SCRAPER_MEMORY_OPTIMIZATION.md)
- [Performance Optimization](../07-REFERENCE/REFERENCE_PERFORMANCE_OPTIMIZATION.md)

---

## 6. Performance Issues

### Issue 6.1: Slow API Responses (>5s)

**Symptoms:**
- API taking 5-30+ seconds
- User complaints about lag
- Timeouts in production

**Possible Causes:**
- Unoptimized database queries
- Large payload sizes
- No caching
- External API slowness

**Diagnosis:**
```bash
# Measure API response times
curl -w "\nTime: %{time_total}s\n" http://localhost:3000/api/chat \
  -X POST -d '{"message":"test","session_id":"123","domain":"example.com"}' \
  -H "Content-Type: application/json"

# Check slow endpoints
docker logs omniops-app | grep "Response time"

# Profile specific endpoint
npx tsx << 'EOF'
import { performance } from 'perf_hooks';
const start = performance.now();
const response = await fetch('http://localhost:3000/api/search');
console.log(`Time: ${performance.now() - start}ms`);
EOF
```

**Solutions:**
1. Add request timing:
   ```typescript
   // app/api/chat/route.ts
   const start = Date.now();
   // ... process request
   console.log(`Response time: ${Date.now() - start}ms`);
   ```

2. Implement caching:
   ```typescript
   import { searchCache } from '@/lib/search-cache';

   const cached = searchCache.get(cacheKey);
   if (cached) {
     return NextResponse.json(cached);
   }
   ```

3. Optimize database queries:
   ```sql
   -- Add indexes for common queries
   CREATE INDEX idx_search_domain_created
   ON scraped_pages(domain_id, created_at);
   ```

4. Use async/parallel processing:
   ```typescript
   // Process in parallel
   const [search, woocommerce] = await Promise.all([
     searchProducts(query),
     fetchWooCommerceProducts(query)
   ]);
   ```

**Prevention:**
- Monitor API response times
- Set SLO (e.g., p95 < 3s)
- Implement APM (Application Performance Monitoring)
- Regular performance testing

**Related Docs:**
- [Performance Optimization](../07-REFERENCE/REFERENCE_PERFORMANCE_OPTIMIZATION.md)
- [API Performance](../PERFORMANCE_IMPROVEMENTS.md)

---

### Issue 6.2: High Memory Usage

**Symptoms:**
- Memory usage above 80%
- Server crashing with OOM
- Swap thrashing

**Possible Causes:**
- Memory leaks
- Large in-memory caches
- Unclosed connections
- Large data structures

**Diagnosis:**
```bash
# Check current memory
free -h
docker stats omniops-app --no-stream

# Profile memory
npx tsx << 'EOF'
const used = process.memoryUsage();
console.log('Heap Used:', Math.round(used.heapUsed / 1024 / 1024), 'MB');
console.log('Heap Total:', Math.round(used.heapTotal / 1024 / 1024), 'MB');
console.log('RSS:', Math.round(used.rss / 1024 / 1024), 'MB');
EOF

# Find memory leaks
node --inspect app.js
# Then use Chrome DevTools
```

**Solutions:**
1. Limit cache sizes:
   ```typescript
   // lib/embedding-cache.ts
   const MAX_CACHE_SIZE = 500;
   if (cache.size > MAX_CACHE_SIZE) {
     const firstKey = cache.keys().next().value;
     cache.delete(firstKey);
   }
   ```

2. Close connections:
   ```typescript
   try {
     const data = await fetchData();
   } finally {
     connection.close();
   }
   ```

3. Use streaming for large data:
   ```typescript
   // Stream results instead of loading all at once
   const stream = supabase
     .from('scraped_pages')
     .select('*')
     .stream();
   ```

4. Increase memory limit temporarily:
   ```bash
   NODE_OPTIONS="--max-old-space-size=4096" npm start
   ```

**Prevention:**
- Monitor memory trends
- Profile regularly
- Implement garbage collection monitoring
- Set memory alerts

**Related Docs:**
- [Memory Monitoring](../ARCHIVE/analysis/MEMORY_MONITOR_IMPLEMENTATION_REPORT.md)
- [Performance Optimization](../07-REFERENCE/REFERENCE_PERFORMANCE_OPTIMIZATION.md)

---

### Issue 6.3: Slow Database Queries

**Symptoms:**
- Queries taking seconds
- High database CPU
- Connection pool exhaustion

**Possible Causes:**
- Missing indexes
- N+1 queries
- Large table scans
- Unoptimized queries

**Diagnosis:**
```bash
# Find slow queries
psql $DATABASE_URL -c "
  SELECT query, calls, mean_exec_time, max_exec_time
  FROM pg_stat_statements
  ORDER BY mean_exec_time DESC
  LIMIT 10;
"

# Check for missing indexes
psql $DATABASE_URL -c "
  SELECT
    schemaname,
    tablename,
    attname,
    n_distinct,
    correlation
  FROM pg_stats
  WHERE schemaname = 'public'
    AND n_distinct > 100
    AND correlation < 0.5;
"

# Explain specific query
psql $DATABASE_URL -c "EXPLAIN ANALYZE SELECT ..."
```

**Solutions:**
1. Add missing indexes:
   ```sql
   -- Common indexes
   CREATE INDEX CONCURRENTLY idx_scraped_pages_domain_url
   ON scraped_pages(domain_id, url);

   CREATE INDEX CONCURRENTLY idx_messages_conversation_created
   ON messages(conversation_id, created_at);
   ```

2. Use select specific columns:
   ```typescript
   // Don't select *
   const { data } = await supabase
     .from('scraped_pages')
     .select('id, url, title') // Not '*'
     .eq('domain_id', domainId);
   ```

3. Batch queries:
   ```typescript
   // Instead of N queries
   for (const id of ids) {
     await supabase.from('table').select('*').eq('id', id);
   }

   // Use 1 query
   const { data } = await supabase
     .from('table')
     .select('*')
     .in('id', ids);
   ```

4. Update statistics:
   ```sql
   ANALYZE scraped_pages;
   ANALYZE page_embeddings;
   ```

**Prevention:**
- Monitor query performance
- Review all queries before production
- Use query explain plans
- Regular index maintenance

**Related Docs:**
- [Database Optimization](../DATABASE_OPTIMIZATION.md)
- [Database Performance](../reports/DATABASE_PERFORMANCE_ANALYSIS.md)

---

### Issue 6.4: Cache Not Working

**Symptoms:**
- Repeated expensive operations
- No cache hits
- Cache always empty

**Possible Causes:**
- Cache not enabled
- Wrong cache keys
- Cache expiry too short
- Cache not configured

**Diagnosis:**
```bash
# Check cache hit rates
docker logs omniops-app | grep "\[Cache\]"

# Test cache directly
npx tsx << 'EOF'
import { searchCache } from './lib/search-cache';
searchCache.set('test', { data: 'test' });
console.log('Cached:', searchCache.get('test'));
EOF

# Check Redis cache
redis-cli KEYS '*'
redis-cli GET "cache:search:test"
```

**Solutions:**
1. Enable caching:
   ```typescript
   // lib/search-cache.ts
   export const searchCache = new Map<string, any>();

   // Or Redis
   import { redis } from './redis';
   export async function getCache(key: string) {
     const cached = await redis.get(`cache:${key}`);
     return cached ? JSON.parse(cached) : null;
   }
   ```

2. Use consistent cache keys:
   ```typescript
   // Normalize keys
   const cacheKey = `${query.toLowerCase().trim()}:${domain}:${limit}`;
   ```

3. Increase TTL:
   ```typescript
   // 1 hour instead of 5 minutes
   await redis.set(key, value, 'EX', 3600);
   ```

4. Implement cache warming:
   ```bash
   npx tsx warm-cache.ts
   ```

**Prevention:**
- Monitor cache hit rates
- Log cache operations
- Test cache in staging
- Document caching strategy

**Related Docs:**
- [Cache Consistency](../CACHE_CONSISTENCY.md)
- [Performance Optimization](../07-REFERENCE/REFERENCE_PERFORMANCE_OPTIMIZATION.md)

---

### Issue 6.5: Rate Limiting Kicking In

**Symptoms:**
- Error: "Rate limit exceeded"
- 429 status code
- Intermittent failures

**Possible Causes:**
- Too many requests from single source
- Rate limit too low
- No rate limit bypass
- Shared IP address

**Diagnosis:**
```bash
# Check rate limits
psql $DATABASE_URL -c "
  SELECT domain, rate_limit,
    COUNT(*) as request_count
  FROM customer_configs c
  JOIN rate_limit_log r ON c.id = r.customer_id
  WHERE r.created_at > NOW() - INTERVAL '1 minute'
  GROUP BY domain, rate_limit;
"

# Test rate limit
for i in {1..20}; do
  curl http://localhost:3000/api/chat \
    -X POST -d '{"message":"test","session_id":"123","domain":"example.com"}' \
    -H "Content-Type: application/json"
done
```

**Solutions:**
1. Increase rate limit:
   ```sql
   UPDATE customer_configs
   SET rate_limit = 100
   WHERE domain = 'example.com';
   ```

2. Implement token bucket:
   ```typescript
   // lib/rate-limit.ts
   const tokensPerMinute = 60;
   const burstSize = 10;
   ```

3. Add rate limit exemptions:
   ```typescript
   // Skip rate limit for authenticated users
   if (user?.role === 'admin') {
     return { allowed: true };
   }
   ```

4. Use distributed rate limiting:
   ```typescript
   // Use Redis for cross-instance limits
   import { redis } from './redis';
   const key = `ratelimit:${domain}:${minute}`;
   const count = await redis.incr(key);
   ```

**Prevention:**
- Monitor rate limit hits
- Set appropriate limits per tier
- Implement gradual backoff
- Alert on limit breaches

**Related Docs:**
- [Rate Limiting](../lib/rate-limit.ts)
- [API Security](../SECURITY_HARDENING_SUMMARY.md)

---

## 7. Authentication & Authorization

### Issue 7.1: Can't Login

**Symptoms:**
- Login button doesn't work
- Redirect loop
- Blank page after login

**Possible Causes:**
- Supabase Auth misconfigured
- Redirect URL wrong
- Cookie issues
- Session expired

**Diagnosis:**
```bash
# Test auth flow
curl http://localhost:3000/api/auth/login

# Check Supabase auth config
psql $DATABASE_URL -c "SELECT * FROM auth.users LIMIT 1;"

# Check browser console for errors
# Look for CORS or cookie errors

# Test auth directly
npx tsx << 'EOF'
import { createClient } from '@supabase/supabase-js';
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'test@example.com',
  password: 'password'
});
console.log(error || 'Success');
EOF
```

**Solutions:**
1. Configure Supabase redirect URLs:
   - Supabase Dashboard → Authentication → URL Configuration
   - Site URL: `http://localhost:3000`
   - Redirect URLs: `http://localhost:3000/auth/callback`

2. Fix cookie settings:
   ```typescript
   // app/api/auth/route.ts
   cookies().set('session', token, {
     httpOnly: true,
     secure: process.env.NODE_ENV === 'production',
     sameSite: 'lax',
     path: '/'
   });
   ```

3. Clear old sessions:
   ```typescript
   await supabase.auth.signOut();
   localStorage.clear();
   sessionStorage.clear();
   ```

4. Verify email provider:
   - Supabase Dashboard → Authentication → Providers
   - Enable Email provider
   - Disable "Confirm email" for development

**Prevention:**
- Test auth flow regularly
- Document auth configuration
- Monitor auth errors
- Set up auth logs

**Related Docs:**
- [Supabase Auth Setup](../SUPABASE_AUTH_SETUP.md)
- [Authentication Linkage](../AUTHENTICATION_LINKAGE.md)

---

### Issue 7.2: Session Expired/Invalid

**Symptoms:**
- Frequent logouts
- "Invalid session" errors
- Have to login repeatedly

**Possible Causes:**
- Short session duration
- Token not refreshing
- Cookie expiry
- Server time mismatch

**Diagnosis:**
```bash
# Check session in cookies
# Browser DevTools → Application → Cookies

# Check token expiry
npx tsx << 'EOF'
import { createClient } from '@supabase/supabase-js';
const supabase = createClient(url, key);
const { data: { session } } = await supabase.auth.getSession();
console.log('Expires at:', new Date(session?.expires_at * 1000));
EOF

# Check server time
date
```

**Solutions:**
1. Extend session duration:
   ```typescript
   // Supabase Dashboard → Settings → Auth
   // JWT expiry: 3600 (seconds)
   ```

2. Implement token refresh:
   ```typescript
   // Automatic refresh
   supabase.auth.onAuthStateChange((event, session) => {
     if (event === 'TOKEN_REFRESHED') {
       console.log('Token refreshed');
     }
   });
   ```

3. Fix cookie expiry:
   ```typescript
   cookies().set('session', token, {
     maxAge: 60 * 60 * 24 * 7, // 7 days
     path: '/'
   });
   ```

4. Sync server time:
   ```bash
   # Ensure NTP is running
   sudo systemctl status systemd-timesyncd
   ```

**Prevention:**
- Use longer session durations
- Implement automatic refresh
- Monitor session expiry rates
- Test on various timezones

**Related Docs:**
- [Session Improvements](../SESSION_IMPROVEMENTS_2025_09_22.md)
- [Supabase Auth](../SUPABASE_AUTH_SETUP.md)

---

### Issue 7.3: RLS Denying Access

**Symptoms:**
- Can't access own data
- Empty results despite data existing
- Different behavior for different users

**Possible Causes:**
- RLS policy too restrictive
- Wrong user context
- Missing RLS policy
- JWT claims incorrect

**Diagnosis:**
```bash
# Check RLS policies
psql $DATABASE_URL -c "
  SELECT tablename, policyname, permissive, roles, cmd, qual
  FROM pg_policies
  WHERE schemaname = 'public';
"

# Test with different users
psql $DATABASE_URL -c "
  SET ROLE authenticated;
  SELECT * FROM scraped_pages LIMIT 1;
"

# Check JWT claims
npx tsx << 'EOF'
import { createClient } from '@supabase/supabase-js';
const supabase = createClient(url, key);
const { data: { user } } = await supabase.auth.getUser();
console.log('User:', user);
EOF
```

**Solutions:**
1. Fix RLS policy:
   ```sql
   -- Allow users to see their own data
   CREATE POLICY "Users see own data"
   ON scraped_pages
   FOR SELECT
   USING (
     domain_id IN (
       SELECT id FROM domains
       WHERE user_id = auth.uid()
     )
   );
   ```

2. Use service role for backend:
   ```typescript
   // Use service role, not anon key
   const supabase = createServiceRoleClient();
   ```

3. Add proper JWT claims:
   ```sql
   -- Custom claim for domain access
   CREATE OR REPLACE FUNCTION auth.custom_claims(user_id uuid)
   RETURNS jsonb AS $$
   BEGIN
     RETURN jsonb_build_object(
       'domains', (
         SELECT array_agg(domain)
         FROM domains
         WHERE user_id = $1
       )
     );
   END;
   $$ LANGUAGE plpgsql;
   ```

4. Test RLS policies:
   ```bash
   npm run test:rls
   ```

**Prevention:**
- Write RLS tests for all tables
- Document RLS policies
- Test with different user roles
- Monitor RLS denials

**Related Docs:**
- [RLS Testing](../RLS_TESTING_INFRASTRUCTURE.md)
- [Database Schema](../09-REFERENCE/REFERENCE_DATABASE_SCHEMA.md)

---

### Issue 7.4: Domain Verification Failing

**Symptoms:**
- Can't verify domain ownership
- Verification endpoint unreachable
- "Domain not verified" error

**Possible Causes:**
- Verification file not accessible
- DNS not propagated
- Firewall blocking
- Wrong verification code

**Diagnosis:**
```bash
# Test verification endpoint
curl https://example.com/.well-known/omniops-verify.txt

# Check DNS
nslookup example.com
dig example.com TXT

# Test from different location
curl --resolve example.com:443:1.2.3.4 \
  https://example.com/.well-known/omniops-verify.txt
```

**Solutions:**
1. Place verification file:
   ```bash
   # In website root
   mkdir -p .well-known
   echo "omniops-verification:code-123" > .well-known/omniops-verify.txt
   ```

2. Add DNS TXT record:
   ```
   Type: TXT
   Name: _omniops-verify
   Value: code-123
   TTL: 3600
   ```

3. Configure web server:
   ```nginx
   # nginx
   location /.well-known/ {
     allow all;
     try_files $uri =404;
   }
   ```

4. Use alternative verification:
   ```typescript
   // Meta tag verification
   <meta name="omniops-verification" content="code-123" />
   ```

**Prevention:**
- Support multiple verification methods
- Provide clear instructions
- Test verification before requiring
- Monitor verification success rates

**Related Docs:**
- [Customer Verification](../CUSTOMER_VERIFICATION_SYSTEM.md)
- [Domain Verification Implementation](../CUSTOMER_VERIFICATION_IMPLEMENTATION.md)

---

### Issue 7.5: API Key Errors

**Symptoms:**
- "Invalid API key"
- 401/403 errors
- API calls rejected

**Possible Causes:**
- API key expired
- Wrong environment
- Key not in request
- Typo in key

**Diagnosis:**
```bash
# Check environment variables
env | grep API_KEY

# Test API key
curl -H "Authorization: Bearer $OPENAI_API_KEY" \
  https://api.openai.com/v1/models

# Verify key format
echo $OPENAI_API_KEY | wc -c
# Should be 51 characters for OpenAI

# Test in application
npx tsx << 'EOF'
console.log('OpenAI Key:', process.env.OPENAI_API_KEY?.substring(0, 10) + '...');
console.log('Supabase Key:', process.env.SUPABASE_SERVICE_ROLE_KEY?.substring(0, 10) + '...');
EOF
```

**Solutions:**
1. Regenerate API keys:
   - OpenAI: https://platform.openai.com/api-keys
   - Supabase: Dashboard → Settings → API

2. Update environment variables:
   ```bash
   # .env.local
   OPENAI_API_KEY=sk-...
   SUPABASE_SERVICE_ROLE_KEY=eyJ...

   # Restart app
   npm run dev
   ```

3. Verify key format:
   ```typescript
   // OpenAI key starts with sk-
   if (!process.env.OPENAI_API_KEY?.startsWith('sk-')) {
     throw new Error('Invalid OpenAI API key format');
   }
   ```

4. Test keys before deploying:
   ```bash
   npm run test:api-keys
   ```

**Prevention:**
- Store keys in secrets manager
- Rotate keys regularly
- Monitor key usage
- Set up key expiry alerts

**Related Docs:**
- [Environment Variables](../DEPLOYMENT_ENVIRONMENT_VARIABLES.md)
- [API Reference](../API_REFERENCE.md)

---

## 8. Development Environment

### Issue 8.1: Can't Start Dev Server

**Symptoms:**
- `npm run dev` fails
- Port already in use
- Module not found errors

**Possible Causes:**
- Port 3000 in use
- Missing dependencies
- Node version mismatch
- Corrupted node_modules

**Diagnosis:**
```bash
# Check port usage
lsof -i :3000
netstat -an | grep 3000

# Check Node version
node --version
# Should be 18+ for Next.js 15

# Check dependencies
npm list --depth=0

# Check for errors
npm run dev 2>&1 | tee dev.log
```

**Solutions:**
1. Kill process on port 3000:
   ```bash
   # macOS/Linux
   pkill -f "next dev"
   lsof -ti:3000 | xargs kill -9

   # Windows
   npx kill-port 3000
   ```

2. Reinstall dependencies:
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

3. Update Node version:
   ```bash
   # Using nvm
   nvm install 20
   nvm use 20

   # Verify
   node --version
   ```

4. Use different port:
   ```bash
   PORT=3001 npm run dev
   ```

**Prevention:**
- Document required Node version
- Use .nvmrc file
- Regular dependency updates
- Clean install in CI

**Related Docs:**
- [Setup Guide](../SETUP_GUIDE.md)
- [Quick Start](../docs/00-GETTING-STARTED/QUICK_START.md)

---

### Issue 8.2: Docker Issues

**Symptoms:**
- Docker won't start
- Container crashes
- Build failures

**Possible Causes:**
- Docker not running
- Insufficient resources
- Build cache issues
- Port conflicts

**Diagnosis:**
```bash
# Check Docker status
docker ps
docker info

# Check container logs
docker logs omniops-app

# Check resource usage
docker stats

# Test Docker
docker run hello-world
```

**Solutions:**
1. Start Docker Desktop:
   ```bash
   # macOS
   open -a "Docker"

   # Check status
   docker ps
   ```

2. Increase Docker resources:
   - Docker Desktop → Settings → Resources
   - Memory: 4GB+ recommended
   - CPUs: 2+ recommended

3. Clean Docker cache:
   ```bash
   docker system prune -a
   docker volume prune
   ```

4. Rebuild containers:
   ```bash
   docker-compose down
   docker-compose build --no-cache
   docker-compose up -d
   ```

**Prevention:**
- Monitor Docker resources
- Regular cleanup of unused images
- Use .dockerignore properly
- Document Docker requirements

**Related Docs:**
- [Docker Setup](../00-GETTING-STARTED/SETUP_DOCKER_PRODUCTION.md)
- [Docker Improvements](../ARCHIVE/analysis/DOCKER_IMPROVEMENTS_2025.md)

---

### Issue 8.3: Environment Variables Not Loading

**Symptoms:**
- `undefined` for env vars
- Different behavior in dev vs prod
- API calls failing with bad credentials

**Possible Causes:**
- .env.local missing
- Wrong file name (.env vs .env.local)
- Not restarted after changes
- Server vs client variables

**Diagnosis:**
```bash
# Check env file exists
ls -la .env.local

# Check variables loaded
npx tsx << 'EOF'
console.log('OpenAI:', process.env.OPENAI_API_KEY ? 'SET' : 'NOT SET');
console.log('Supabase:', process.env.NEXT_PUBLIC_SUPABASE_URL ? 'SET' : 'NOT SET');
EOF

# Check Next.js env loading
npm run dev
# Look for "Loaded env from" message
```

**Solutions:**
1. Create .env.local:
   ```bash
   cp .env.example .env.local
   # Edit with your values
   ```

2. Use correct prefix for client vars:
   ```bash
   # Server-only
   OPENAI_API_KEY=sk-...

   # Client-accessible
   NEXT_PUBLIC_SUPABASE_URL=https://...
   ```

3. Restart dev server:
   ```bash
   pkill -f "next dev"
   npm run dev
   ```

4. Check Docker env:
   ```bash
   # docker-compose.yml
   services:
     app:
       env_file:
         - .env
   ```

**Prevention:**
- Document all required env vars
- Use .env.example template
- Validate env on startup
- Test in clean environment

**Related Docs:**
- [Environment Setup](../DEPLOYMENT_ENVIRONMENT_VARIABLES.md)
- [Vercel Env Setup](../docs/00-GETTING-STARTED/VERCEL_ENV_SETUP.md)

---

### Issue 8.4: TypeScript Type Errors

**Symptoms:**
- Red squiggly lines in IDE
- Build fails with type errors
- Type mismatches

**Possible Causes:**
- Outdated type definitions
- Missing types
- Incorrect type annotations
- tsconfig issues

**Diagnosis:**
```bash
# Check TypeScript version
npx tsc --version

# Run type checking
npx tsc --noEmit

# Check specific file
npx tsc --noEmit path/to/file.ts

# Update types
npm update @types/node @types/react
```

**Solutions:**
1. Install missing types:
   ```bash
   npm install --save-dev @types/node @types/react @types/react-dom
   ```

2. Fix type errors:
   ```typescript
   // Add proper types
   interface Props {
     message: string;
     count?: number;
   }

   function Component({ message, count = 0 }: Props) {
     // ...
   }
   ```

3. Update tsconfig.json:
   ```json
   {
     "compilerOptions": {
       "strict": true,
       "skipLibCheck": true,
       "esModuleInterop": true
     }
   }
   ```

4. Use type assertion cautiously:
   ```typescript
   const data = response as MyType; // Last resort
   ```

**Prevention:**
- Enable strict mode
- Add types to all functions
- Use TypeScript in tests
- Regular type checking in CI

**Related Docs:**
- [Type Documentation](../TYPE_DOCUMENTATION_INDEX.md)
- [Code Patterns](../04-DEVELOPMENT/code-patterns/)

---

### Issue 8.5: Test Failures

**Symptoms:**
- Tests fail locally
- Different results than CI
- Flaky tests

**Possible Causes:**
- Database state issues
- Missing test data
- Async race conditions
- Environment differences

**Diagnosis:**
```bash
# Run tests
npm test

# Run specific test
npm test -- chat.test.ts

# Run with verbose output
npm test -- --verbose

# Check test coverage
npm run test:coverage
```

**Solutions:**
1. Reset test database:
   ```bash
   # Clear test data
   psql $TEST_DATABASE_URL -c "TRUNCATE scraped_pages CASCADE;"

   # Or use test utility
   npm run test:db:reset
   ```

2. Fix async issues:
   ```typescript
   // Use waitFor
   await waitFor(() => {
     expect(element).toBeInTheDocument();
   });

   // Proper cleanup
   afterEach(() => {
     cleanup();
   });
   ```

3. Mock external services:
   ```typescript
   // Mock OpenAI
   jest.mock('@/lib/openai-client', () => ({
     chat: jest.fn().mockResolvedValue({ message: 'test' })
   }));
   ```

4. Use consistent test data:
   ```typescript
   // Use factories
   const testUser = createTestUser({ email: 'test@example.com' });
   ```

**Prevention:**
- Isolate tests properly
- Use test fixtures
- Run tests in CI
- Monitor flaky tests

**Related Docs:**
- [Testing Guide](../TESTING.md)
- [Testing Quickstart](../TESTING_QUICKSTART.md)

---

### Issue 8.6: Build Errors

**Symptoms:**
- `npm run build` fails
- Production build different from dev
- Module resolution errors

**Possible Causes:**
- Type errors in production mode
- Missing environment variables
- Import path issues
- Next.js config issues

**Diagnosis:**
```bash
# Run production build
npm run build

# Check build output
ls -lh .next/

# Analyze bundle
npm run build -- --analyze

# Check for import errors
npx tsc --noEmit
```

**Solutions:**
1. Fix type errors:
   ```bash
   npx tsc --noEmit
   # Fix all errors before building
   ```

2. Set production env vars:
   ```bash
   # .env.production
   NEXT_PUBLIC_SUPABASE_URL=https://production-url
   ```

3. Fix import paths:
   ```typescript
   // Use absolute imports
   import { Component } from '@/components/Component';
   // Not: import { Component } from '../../../components/Component';
   ```

4. Update Next.js config:
   ```javascript
   // next.config.js
   module.exports = {
     output: 'standalone',
     typescript: {
       ignoreBuildErrors: false
     }
   };
   ```

**Prevention:**
- Build locally before pushing
- Type check in pre-commit hook
- Test production build in CI
- Use consistent imports

**Related Docs:**
- [Deployment Guide](../PRODUCTION-DEPLOYMENT.md)
- [Build Configuration](../next.config.js)

---

## 9. Production Deployment

### Issue 9.1: Deployment Failing

**Symptoms:**
- Deploy never completes
- Build fails on server
- Application won't start

**Possible Causes:**
- Environment variables missing
- Build errors
- Resource limits
- Health check failing

**Diagnosis:**
```bash
# Check deployment logs
# (Platform specific - Vercel, Railway, etc.)

# Test build locally
npm run build
npm run start

# Check health endpoint
curl https://your-app.com/api/health

# Check resource usage
# (Platform monitoring dashboard)
```

**Solutions:**
1. Set all environment variables:
   ```bash
   # Vercel CLI
   vercel env add OPENAI_API_KEY

   # Or in dashboard
   # Settings → Environment Variables
   ```

2. Increase build resources:
   ```json
   // vercel.json
   {
     "builds": [
       {
         "src": "package.json",
         "use": "@vercel/node",
         "config": {
           "maxLambdaSize": "50mb"
         }
       }
     ]
   }
   ```

3. Fix health check:
   ```typescript
   // Ensure /api/health responds quickly
   export async function GET() {
     return NextResponse.json({ status: 'ok' }, { status: 200 });
   }
   ```

4. Check logs for specific error:
   ```bash
   # Download logs and search
   grep -i error deployment.log
   ```

**Prevention:**
- Test production build locally
- Use staging environment
- Monitor deployments
- Document deployment process

**Related Docs:**
- [Production Deployment](../PRODUCTION-DEPLOYMENT.md)
- [Deployment Checklist](../PRODUCTION_DEPLOYMENT_CHECKLIST.md)

---

### Issue 9.2: Environment Variables Not Working in Production

**Symptoms:**
- Works locally but not in production
- "undefined" errors in production
- API calls failing

**Possible Causes:**
- Variables not set in platform
- Wrong environment (preview vs production)
- Client vs server variable confusion
- Encryption issues

**Diagnosis:**
```bash
# Check which vars are set (platform dashboard)
# Vercel: Settings → Environment Variables

# Test from production
curl https://your-app.com/api/debug-env

# Check build logs for "Loaded env from"
```

**Solutions:**
1. Set in deployment platform:
   ```bash
   # Vercel
   vercel env add OPENAI_API_KEY production

   # Railway
   railway variables set OPENAI_API_KEY=sk-...

   # Render
   # Dashboard → Environment → Add Variable
   ```

2. Set for correct environment:
   - Production
   - Preview
   - Development

3. Rebuild after setting vars:
   ```bash
   # Trigger new deployment
   git commit --allow-empty -m "Update env vars"
   git push
   ```

4. Use secrets for sensitive values:
   ```bash
   # Never commit to git
   # Use platform's secrets management
   ```

**Prevention:**
- Document all required env vars
- Use .env.example as checklist
- Validate env on startup
- Set up env var monitoring

**Related Docs:**
- [Deployment Environment Variables](../DEPLOYMENT_ENVIRONMENT_VARIABLES.md)
- [Vercel Setup](../docs/00-GETTING-STARTED/VERCEL_ENV_SETUP.md)

---

### Issue 9.3: Database Connection Failing in Production

**Symptoms:**
- Can't connect to Supabase
- Connection timeouts
- RLS errors

**Possible Causes:**
- Wrong connection string
- IP not whitelisted
- Connection pooling issues
- SSL/TLS problems

**Diagnosis:**
```bash
# Test connection from production
curl https://your-app.com/api/health | jq '.checks.database'

# Test Supabase URL
curl https://your-project.supabase.co

# Check connection string format
echo $DATABASE_URL | sed 's/:[^:]*@/:****@/'
```

**Solutions:**
1. Verify connection string:
   ```bash
   # Should be production URL
   NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=eyJ...
   ```

2. Enable connection pooling:
   ```typescript
   // Use Supavisor
   const connectionString = process.env.DATABASE_URL + '?pgbouncer=true';
   ```

3. Check SSL requirements:
   ```typescript
   const supabase = createClient(url, key, {
     db: {
       schema: 'public',
       ssl: true
     }
   });
   ```

4. Whitelist IP (if using IP restrictions):
   - Supabase Dashboard → Settings → Database
   - Add your platform's IP ranges

**Prevention:**
- Use connection pooling
- Monitor connection health
- Set up database alerts
- Test with production database

**Related Docs:**
- [Supabase Setup](../SUPABASE_SETUP_INSTRUCTIONS.md)
- [Database Schema](../09-REFERENCE/REFERENCE_DATABASE_SCHEMA.md)

---

### Issue 9.4: CORS Errors in Production

**Symptoms:**
- API works locally but not in production
- "CORS policy" errors
- Requests blocked by browser

**Possible Causes:**
- Origin not whitelisted
- Wrong CORS headers
- Credentials not allowed
- Preflight failing

**Diagnosis:**
```bash
# Test CORS
curl -H "Origin: https://example.com" \
     -H "Access-Control-Request-Method: POST" \
     -X OPTIONS \
     https://your-app.com/api/chat

# Check response headers
curl -I https://your-app.com/api/chat

# Test from browser console
fetch('https://your-app.com/api/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ message: 'test' })
});
```

**Solutions:**
1. Update allowed origins:
   ```sql
   UPDATE customer_configs
   SET allowed_origins = ARRAY['https://example.com', 'https://www.example.com']
   WHERE domain = 'example.com';
   ```

2. Add CORS headers:
   ```typescript
   // app/api/chat/route.ts
   export async function POST(req: NextRequest) {
     const response = NextResponse.json(data);
     response.headers.set('Access-Control-Allow-Origin', origin);
     response.headers.set('Access-Control-Allow-Credentials', 'true');
     return response;
   }
   ```

3. Handle OPTIONS preflight:
   ```typescript
   export async function OPTIONS(req: NextRequest) {
     return new NextResponse(null, {
       status: 200,
       headers: {
         'Access-Control-Allow-Origin': '*',
         'Access-Control-Allow-Methods': 'POST, OPTIONS',
         'Access-Control-Allow-Headers': 'Content-Type'
       }
     });
   }
   ```

4. Use Next.js config:
   ```javascript
   // next.config.js
   module.exports = {
     async headers() {
       return [
         {
           source: '/api/:path*',
           headers: [
             { key: 'Access-Control-Allow-Origin', value: '*' },
             { key: 'Access-Control-Allow-Methods', value: 'GET,POST,OPTIONS' }
           ]
         }
       ];
     }
   };
   ```

**Prevention:**
- Test CORS from production domains
- Document allowed origins
- Use wildcard cautiously
- Monitor CORS errors

**Related Docs:**
- [API Security](../SECURITY_HARDENING_SUMMARY.md)
- [Multi-tenant Setup](../MULTI_TENANT_SETUP.md)

---

### Issue 9.5: SSL/HTTPS Errors

**Symptoms:**
- Mixed content warnings
- Certificate errors
- Insecure connection

**Possible Causes:**
- HTTP instead of HTTPS
- Self-signed certificate
- Certificate expired
- Mixed content

**Diagnosis:**
```bash
# Check certificate
openssl s_client -connect your-app.com:443

# Check certificate expiry
echo | openssl s_client -connect your-app.com:443 2>/dev/null | \
  openssl x509 -noout -dates

# Test HTTPS redirect
curl -I http://your-app.com
```

**Solutions:**
1. Enable HTTPS redirect:
   ```javascript
   // next.config.js
   module.exports = {
     async redirects() {
       return [
         {
           source: '/:path*',
           has: [{ type: 'header', key: 'x-forwarded-proto', value: 'http' }],
           destination: 'https://your-app.com/:path*',
           permanent: true
         }
       ];
     }
   };
   ```

2. Fix mixed content:
   ```typescript
   // Use protocol-relative URLs
   const url = `${window.location.protocol}//api.example.com`;

   // Or force HTTPS
   const url = 'https://api.example.com';
   ```

3. Renew certificate:
   - Most platforms auto-renew (Vercel, Netlify)
   - Manual: Use Let's Encrypt `certbot`

4. Update all URLs to HTTPS:
   ```bash
   # Search codebase
   grep -r "http://" --include="*.ts" --include="*.tsx"
   ```

**Prevention:**
- Monitor certificate expiry
- Use HTTPS everywhere
- Set up auto-renewal
- Test SSL configuration

**Related Docs:**
- [Production Checklist](../PRODUCTION_CHECKLIST.md)
- [Security Hardening](../SECURITY_HARDENING_SUMMARY.md)

---

## Additional Resources

### Diagnostic Commands Quick Reference

```bash
# Health Checks
curl http://localhost:3000/api/health | jq
docker ps
redis-cli ping
psql $DATABASE_URL -c "SELECT 1;"

# Performance
docker stats omniops-app --no-stream
npm run test:performance
npx tsx monitor-embeddings-health.ts check

# Database
psql $DATABASE_URL -c "SELECT * FROM pg_stat_activity;"
psql $DATABASE_URL -c "SELECT * FROM pg_stat_statements ORDER BY mean_exec_time DESC LIMIT 10;"

# Logs
docker logs omniops-app --tail 100
docker logs omniops-app --follow
docker logs omniops-app | grep ERROR

# Cleanup
npx tsx test-database-cleanup.ts stats
docker system prune -a
redis-cli FLUSHDB
```

---

### Getting Help

1. **Check Documentation:**
   - [Main README](../README.md)
   - [Architecture Docs](../01-ARCHITECTURE/)
   - [Feature Docs](../02-FEATURES/)

2. **Search Issues:**
   - Search this troubleshooting guide
   - Check GitHub issues (if applicable)
   - Review error logs

3. **Test Environment:**
   - Reproduce in clean environment
   - Test with minimal configuration
   - Compare dev vs production

4. **Gather Information:**
   - Error messages (full stack trace)
   - Steps to reproduce
   - Environment details
   - Recent changes

5. **Contact Support:**
   - Provide all diagnostic info
   - Include logs and screenshots
   - Share minimal reproduction

---

## Contribution

Found a common issue not covered here? Please contribute!

1. Document the issue with symptoms, causes, diagnosis, and solutions
2. Add real error messages and commands
3. Include prevention tips
4. Link to relevant docs

---

**Last Updated:** 2025-10-24
**Version:** 1.0.0
**Maintainer:** Omniops Development Team
