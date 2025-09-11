# RAG System Fix Documentation

## Overview
This document details the fixes applied to restore the Retrieval-Augmented Generation (RAG) system for the customer service chat widget, enabling it to retrieve and use scraped website content when answering queries.

## Issues Identified and Resolved

### 1. Database Function Mismatch
**Problem**: The `search_embeddings` RPC function was searching for a non-existent `content_embeddings` table (removed to simplify schema) instead of the existing `page_embeddings` table.

**Root Cause**: Database migration inconsistency where the function wasn't updated after table restructuring.

**Solution**: Updated the RPC function to query the correct table:
```sql
CREATE OR REPLACE FUNCTION public.search_embeddings(
  query_embedding vector(1536),
  p_domain_id UUID,
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 5
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
    pe.chunk_text as content,
    COALESCE((pe.metadata->>'url')::text, sp.url) as url,
    COALESCE((pe.metadata->>'title')::text, sp.title) as title,
    1 - (pe.embedding <=> query_embedding) as similarity
  FROM page_embeddings pe
  JOIN scraped_pages sp ON pe.page_id = sp.id
  WHERE 
    (p_domain_id IS NULL OR sp.domain_id = p_domain_id)
    AND 1 - (pe.embedding <=> query_embedding) > match_threshold
  ORDER BY pe.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
```

### 2. Parameter Order Mismatch
**Problem**: TypeScript code was passing RPC parameters in the wrong order.

**File**: `/lib/embeddings.ts` (line 265-270)

**Before**:
```typescript
const { data, error } = await supabase.rpc('search_embeddings', {
  query_embedding: queryEmbedding,
  match_threshold: similarityThreshold,
  match_count: limit,
  p_domain_id: domainId
});
```

**After**:
```typescript
const { data, error } = await supabase.rpc('search_embeddings', {
  query_embedding: queryEmbedding,
  p_domain_id: domainId,  // Must be second parameter
  match_threshold: similarityThreshold,
  match_count: limit
});
```

### 3. Domain Filtering in Fallback Path
**Problem**: The fallback error handler in the chat route was passing `p_domain_id: null`, preventing domain-specific content filtering.

**File**: `/app/api/chat/route.ts` (line 116-146)

**Solution**: Added domain lookup in the fallback path to properly filter content:
```typescript
// First, look up the domain_id for fallback search
let domainId: string | null = null;
if (domain) {
  const { data: domainData } = await adminSupabase
    .from('domains')
    .select('id')
    .eq('domain', domain.replace('www.', ''))
    .single();
  
  if (domainData) {
    domainId = domainData.id;
  }
}
```

### 4. Server Component Context Error
**Problem**: `DomainValidator` singleton was creating a Supabase client in its constructor, causing "cookies called outside request scope" error.

**File**: `/lib/utils/domain-validator.ts`

**Root Cause**: Next.js 13+ App Router requires server-only functions that need request context (cookies, headers) to be called within request handlers, not at module initialization.

**Solution**: Made Supabase client creation lazy:
```typescript
export class DomainValidator {
  private static instance: DomainValidator

  constructor() {
    // Don't create Supabase client in constructor - it needs request context
  }

  private async getSupabase() {
    // Create client on-demand during request handling
    return await createClient()
  }
}
```

## Local Testing Configuration

### The Domain Detection Issue
The chat widget determines which domain's content to search based on:
1. URL parameter: `?domain=example.com` (highest priority)
2. Current hostname: `window.location.hostname` (fallback)

When testing locally at `http://localhost:3000/embed`:
- The widget defaults to `domain: "localhost"`
- No content exists for localhost in the database
- RAG returns no results, triggering generic responses

### Solution for Local Testing
Always include the domain parameter when testing locally:
```
http://localhost:3000/embed?domain=thompsonseparts.co.uk
```

### Production Behavior
In production, when the widget is embedded on the actual website:
- The widget automatically detects the correct domain from `window.location.hostname`
- No manual configuration needed
- Example: When embedded on thompsonseparts.co.uk, it automatically uses that domain

## Testing the RAG System

### Prerequisites
1. Ensure Docker is running (for Redis): `docker-compose up -d`
2. Start the development server: `npm run dev`
3. Verify embeddings exist in the database for your test domain

### Test Commands

#### Via cURL (Direct API Testing)
```bash
# Test with correct domain - should return product information
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What excavator parts do you have?",
    "session_id": "test-session",
    "domain": "thompsonseparts.co.uk",
    "config": {
      "features": {
        "websiteScraping": {
          "enabled": true
        }
      }
    }
  }' | jq .

# Test with wrong domain - returns generic response
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What products do you sell?",
    "session_id": "test-session",
    "domain": "localhost",
    "config": {
      "features": {
        "websiteScraping": {
          "enabled": true
        }
      }
    }
  }' | jq .
```

#### Via Browser (Widget Testing)
1. **Correct Usage**: 
   ```
   http://localhost:3000/embed?domain=thompsonseparts.co.uk
   ```
   
2. **Test Queries**:
   - "What products do you sell?"
   - "Do you have hydraulic cylinders for tipper trucks?"
   - "Tell me about your excavator parts"
   - "What hydraulic pumps are available?"

3. **Expected Behavior**:
   - Should return specific product information
   - Includes source URLs from the scraped website
   - Shows similarity scores (typically 0.4-0.6 range)

## Verifying the Fix

### Database Verification
```sql
-- Check if the function exists with correct signature
SELECT proname, pg_get_function_identity_arguments(oid) AS arguments 
FROM pg_proc 
WHERE proname = 'search_embeddings';

-- Expected output:
-- proname: search_embeddings
-- arguments: query_embedding vector, p_domain_id uuid, match_threshold double precision, match_count integer

-- Test the function directly
SELECT * FROM search_embeddings(
  (SELECT embedding FROM page_embeddings LIMIT 1),  -- Use an existing embedding as test
  '8dccd788-1ec1-43c2-af56-78aa3366bad3'::uuid,    -- Thompson's domain ID
  0.3,  -- Lower threshold for testing
  5     -- Return top 5 results
);
```

### Application Verification
1. **Check Server Logs**: Look for successful domain lookups:
   ```
   Found domain_id 8dccd788-1ec1-43c2-af56-78aa3366bad3 for domain "thompsonseparts.co.uk"
   Search found 3 results for domain "thompsonseparts.co.uk" and query: "..."
   ```

2. **Check Response Sources**: Valid RAG responses include:
   ```json
   {
     "sources": [
       {
         "url": "https://www.thompsonseparts.co.uk",
         "title": "...",
         "relevance": 0.498852133887755
       }
     ]
   }
   ```

## Troubleshooting

### Issue: "I don't have access to specific information"
**Cause**: Domain not properly set or no content indexed for domain
**Fix**: 
1. Verify domain parameter in URL
2. Check if domain exists in database: 
   ```sql
   SELECT * FROM domains WHERE domain = 'thompsonseparts.co.uk';
   ```
3. Verify embeddings exist:
   ```sql
   SELECT COUNT(*) FROM page_embeddings pe 
   JOIN scraped_pages sp ON pe.page_id = sp.id 
   WHERE sp.domain_id = (SELECT id FROM domains WHERE domain = 'thompsonseparts.co.uk');
   ```

### Issue: 500 Error on Dashboard Pages
**Cause**: Server components trying to access request context at module initialization
**Fix**: Ensure all `cookies()`, `headers()` calls are inside request handlers or made lazy

### Issue: Slow Response Times
**Cause**: Embedding generation or search taking too long
**Optimization**:
1. Lower similarity threshold (0.3 instead of 0.7)
2. Reduce match_count (3 instead of 5)
3. Ensure proper database indexes exist

## Performance Considerations

### Similarity Thresholds
- **0.7+**: High similarity, very relevant but may miss some content
- **0.5-0.7**: Moderate similarity, good balance
- **0.3-0.5**: Lower similarity, more results but potentially less relevant
- **<0.3**: Too low, may return irrelevant content

### Current Configuration
- Production threshold: 0.3 (to ensure results are found)
- Match count: 3-5 results
- Embedding model: text-embedding-3-small (fast and efficient)

## Migration SQL for Reference
The complete migration that fixed the RPC function is saved at:
`/Users/jamesguy/Omniops/fix-search-embeddings.sql`

To apply manually if needed:
1. Go to Supabase Dashboard SQL Editor
2. Paste the migration SQL
3. Execute

## Summary
The RAG system is now fully operational with:
- ✅ Correct database function searching the right table
- ✅ Proper parameter ordering in TypeScript code  
- ✅ Domain filtering working in all code paths
- ✅ Server component context issues resolved
- ✅ Local testing requires domain parameter: `?domain=thompsonseparts.co.uk`
- ✅ Production deployment will auto-detect domain from hostname

## Related Files Modified
- `/lib/embeddings.ts` - Fixed RPC parameter order
- `/app/api/chat/route.ts` - Fixed fallback domain handling  
- `/lib/utils/domain-validator.ts` - Fixed server context issue
- Database function `search_embeddings` - Fixed to use correct table

## Last Updated
August 28, 2025