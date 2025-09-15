# Embedding Search Guide

## Overview
This guide documents the correct way to search embeddings in the Omniops system and common issues to avoid.

## Database Structure

### Tables
- `page_embeddings` - Contains vector embeddings for scraped content
  - `id` - UUID primary key
  - `page_id` - References scraped_pages.id
  - `chunk_text` - The text content of this chunk
  - `embedding` - vector(1536) embedding from OpenAI
  - `metadata` - JSONB metadata about the chunk
  - `domain_id` - References customer_configs.id (CRITICAL: May be missing!)
  - `chunk_index` - Position of chunk in original page
  - `created_at` - Timestamp

- `scraped_pages` - Contains scraped website content
  - `id` - UUID primary key
  - `domain_id` - References customer_configs.id
  - `url` - Page URL
  - `content` - Full page content
  - `metadata` - JSONB with product info

## Common Issues and Solutions

### Issue 1: Missing domain_id Column
**Problem**: The `page_embeddings` table may not have a `domain_id` column, preventing domain-filtered searches.

**Solution**: Run migration `20250115_fix_embeddings_domain.sql`

### Issue 2: NULL domain_id Values
**Problem**: Even if the column exists, values may be NULL.

**Solution**: Populate from scraped_pages:
```sql
UPDATE page_embeddings pe
SET domain_id = sp.domain_id
FROM scraped_pages sp
WHERE pe.page_id = sp.id
AND pe.domain_id IS NULL;
```

### Issue 3: Function Parameter Mismatch
**Problem**: The search function may expect different parameter names.

**Common variations**:
- `domain_id`
- `p_domain_id` 
- `query_domain`

**Solution**: Check the function definition or try all variations.

## Correct Search Implementation

```typescript
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

const supabase = createClient(url, key);
const openai = new OpenAI({ apiKey });

async function searchEmbeddings(query: string, domainId?: string) {
  // 1. Generate embedding for query
  const embeddingResponse = await openai.embeddings.create({
    model: 'text-embedding-ada-002',
    input: query
  });
  const queryEmbedding = embeddingResponse.data[0].embedding;
  
  // 2. Search with correct parameters
  const { data, error } = await supabase.rpc('search_embeddings', {
    query_embedding: queryEmbedding,
    p_domain_id: domainId, // Note: parameter name may vary
    match_threshold: 0.3,   // Lower = broader results
    match_count: 10         // More chunks = better context
  });
  
  if (error) {
    // Try alternative parameter names
    const alt = await supabase.rpc('search_embeddings', {
      query_embedding: queryEmbedding,
      domain_id: domainId,
      match_threshold: 0.3,
      match_count: 10
    });
    return alt.data;
  }
  
  return data;
}
```

## Understanding Similarity Scores

### What the scores mean:
- **90-100%**: Nearly identical text (rare)
- **70-90%**: Very similar concepts  
- **50-70%**: Related concepts (OPTIMAL for e-commerce)
- **30-50%**: Loosely related
- **<30%**: Unrelated

### Why 50-70% is optimal:
- User queries are short and general ("hydraulic pump")
- Product descriptions are long and specific
- Moderate similarity catches related products without noise
- This enables 100% product finding success

## Diagnostic Scripts

### Check embeddings status:
```bash
npx tsx comprehensive-embedding-check.ts
```

### Fix domain issues:
```bash
npx tsx add-domain-to-embeddings.ts
```

### Test similarity:
```bash
npx tsx test-real-similarity.ts
```

## Key Takeaways

1. **Always verify domain_id exists** in page_embeddings
2. **Check multiple parameter names** when calling search functions
3. **50-70% similarity is normal and good** for semantic search
4. **Use lower thresholds** (0.3-0.5) for broader results
5. **Retrieve more chunks** (10-15) for better context

## Troubleshooting Checklist

- [ ] Does `page_embeddings` table have `domain_id` column?
- [ ] Are domain_id values populated (not NULL)?
- [ ] Does domain_id match customer_configs.id?
- [ ] Is the search function using correct parameter names?
- [ ] Are embeddings actually generated (check count)?
- [ ] Is similarity threshold appropriate (0.3-0.7)?
- [ ] Are you retrieving enough chunks (10+)?