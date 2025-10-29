# RAG Troubleshooting Guide

## Quick Diagnostic Checklist

- [ ] Database connected to production (birugqyuqhiahxvxeyqg.supabase.co)
- [ ] search_embeddings function exists in database
- [ ] page_embeddings table has data (should have 153+ records)
- [ ] customer_configs has entry for your domain
- [ ] Using service role client in embeddings.ts
- [ ] Similarity threshold set to 0.3 or lower
- [ ] Server has been restarted after changes

## Step-by-Step Verification

### 1. Verify Database Connection
```bash
# Check which database you're connected to
echo $NEXT_PUBLIC_SUPABASE_URL
# Should output: https://birugqyuqhiahxvxeyqg.supabase.co
```

### 2. Check Embeddings Exist
```typescript
// API endpoint to check embeddings
// GET /api/check-table-data
const { data } = await supabase
  .from('page_embeddings')
  .select('*', { count: 'exact', head: true });
console.log('Total embeddings:', data);
```

### 3. Test Search Function
```typescript
// API endpoint to test search
// GET /api/test-search-function
const { data, error } = await supabase.rpc('search_embeddings', {
  query_embedding: new Array(1536).fill(0.1),
  similarity_threshold: 0.3,
  match_count: 5
});
```

### 4. Check Chat API Integration
```bash
# Direct test with curl
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What products do you offer?",
    "session_id": "test-123",
    "domain": "thompsonseparts.co.uk",
    "config": {
      "features": {
        "websiteScraping": { "enabled": true }
      }
    }
  }' | jq .sources
```

## Common Error Messages and Fixes

### Error: "Could not find the function public.search_embeddings"
**Fix**: Create the function in Supabase SQL editor
```sql
CREATE OR REPLACE FUNCTION search_embeddings(
  query_embedding vector(1536),
  similarity_threshold float DEFAULT 0.7,
  match_count int DEFAULT 5,
  p_domain_id uuid DEFAULT NULL
)
RETURNS TABLE (
  content text,
  url text,
  title text,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pe.chunk_text AS content,
    COALESCE((pe.metadata->>'url')::text, '') AS url,
    COALESCE((pe.metadata->>'title')::text, 'Thompson eParts') AS title,
    1 - (pe.embedding <=> query_embedding) AS similarity
  FROM page_embeddings pe
  WHERE 
    1 - (pe.embedding <=> query_embedding) > similarity_threshold
  ORDER BY pe.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
```

### Error: "Search found 0 results"
**Fix 1**: Lower similarity threshold
```typescript
// In app/api/chat/route.ts
searchSimilarContent(
  message,
  domain,
  3,
  0.3  // Change from 0.7 to 0.3
)
```

**Fix 2**: Check if embeddings exist
```sql
SELECT COUNT(*) FROM page_embeddings;
-- Should return 153 or more
```

### Error: "permission denied for function search_embeddings"
**Fix**: Use service role client
```typescript
// In lib/embeddings.ts
import { createServiceRoleClient } from '@/lib/supabase/server';

export async function searchSimilarContent(...) {
  const supabase = await createServiceRoleClient(); // Not createClient()
  // ...
}
```

### Error: "No customer config found for domain"
**Fix**: Add customer config entry
```sql
INSERT INTO customer_configs (domain, business_name) 
VALUES ('thompsonseparts.co.uk', 'Thompson eParts')
ON CONFLICT (domain) DO NOTHING;
```

## Debug Logging

### Enable Detailed Logging
```typescript
// In lib/embeddings.ts
export async function searchSimilarContent(...) {
  console.log('Searching for:', query);
  console.log('Domain:', domain);
  console.log('Threshold:', similarityThreshold);
  
  const { data, error } = await supabase.rpc('search_embeddings', {
    query_embedding: queryEmbedding,
    similarity_threshold: similarityThreshold,
    match_count: limit
  });
  
  if (error) {
    console.error('RPC error:', error);
  }
  
  console.log(`Found ${data?.length || 0} results`);
  return data || [];
}
```

### Check Server Logs
```bash
# In terminal running npm run dev
# Look for:
# - "Search found X results for query"
# - "RPC error" messages
# - "Search error" in chat API
```

## Testing Tools

### 1. Simple RAG Test Script
```javascript
// test-rag.js
const fetch = require('node-fetch');

async function testRAG() {
  const response = await fetch('http://localhost:3000/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: 'What tipper products do you offer?',
      session_id: 'test-' + Date.now(),
      domain: 'thompsonseparts.co.uk',
      config: {
        features: {
          websiteScraping: { enabled: true }
        }
      }
    })
  });
  
  const data = await response.json();
  console.log('Sources found:', data.sources?.length || 0);
  console.log('Response:', data.message.substring(0, 200));
}

testRAG();
```

### 2. Direct Database Test
```sql
-- Test if vectors are searchable
SELECT 
  chunk_text,
  1 - (embedding <=> (SELECT embedding FROM page_embeddings LIMIT 1)) as similarity
FROM page_embeddings
ORDER BY similarity DESC
LIMIT 5;
```

## Performance Optimization

### Improve Search Speed
```sql
-- Create better index
CREATE INDEX idx_embeddings_vector 
ON page_embeddings 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Analyze table
ANALYZE page_embeddings;
```

### Adjust for Better Results
```typescript
// Experiment with these values
const SIMILARITY_THRESHOLD = 0.3;  // Lower = more results
const MATCH_COUNT = 5;             // More = better context
const EMBEDDING_MODEL = 'text-embedding-3-small';  // Or ada-002
```

## Emergency Fixes

### Complete Reset
```bash
# 1. Clear and rebuild embeddings
DELETE FROM page_embeddings;

# 2. Re-scrape content
# Use admin panel at /admin/scraping

# 3. Regenerate embeddings
# Will happen automatically after scraping
```

### Quick Fix Script
```typescript
// app/api/fix-rag/route.ts
export async function POST() {
  // 1. Check database connection
  // 2. Verify tables exist
  // 3. Check function exists
  // 4. Test with sample query
  // 5. Return diagnostic info
}
```

## Monitoring

### Health Check Endpoint
```typescript
// app/api/rag-health/route.ts
export async function GET() {
  const health = {
    embeddings_count: 0,
    search_working: false,
    last_error: null
  };
  
  // Check embeddings
  const { count } = await supabase
    .from('page_embeddings')
    .select('*', { count: 'exact', head: true });
  health.embeddings_count = count;
  
  // Test search
  try {
    const results = await searchSimilarContent('test', 'test', 1, 0.1);
    health.search_working = true;
  } catch (e) {
    health.last_error = e.message;
  }
  
  return NextResponse.json(health);
}
```

## When All Else Fails

1. **Check Supabase Dashboard**: Look for errors in the logs
2. **Verify pgvector Extension**: `CREATE EXTENSION IF NOT EXISTS vector;`
3. **Test with Supabase JS Client**: Use their playground to test RPC
4. **Contact Support**: Include your project ID and error messages