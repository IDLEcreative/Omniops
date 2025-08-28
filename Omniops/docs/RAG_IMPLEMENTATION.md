# RAG (Retrieval-Augmented Generation) Implementation Guide

## Overview
This document describes the RAG system that enables the customer service chat to use scraped website content to provide contextual responses.

## System Architecture

### Components
1. **Embeddings Storage**: `page_embeddings` table with 153 vector embeddings from thompsonseparts.co.uk
2. **Search Function**: `search_embeddings` PostgreSQL function using pgvector
3. **Embedding Service**: `lib/embeddings.ts` - generates and searches embeddings
4. **Chat API**: `app/api/chat/route.ts` - integrates RAG into responses

## Database Structure

### Tables
- `page_embeddings`: Stores text chunks with their vector embeddings
  - `id`: UUID primary key
  - `page_id`: Reference to source page
  - `chunk_text`: The actual text content
  - `embedding`: vector(1536) - OpenAI embedding vectors
  - `metadata`: JSONB with URL, title, etc.

### SQL Function
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
```

## Implementation Details

### 1. Embedding Generation (`lib/embeddings.ts`)

```typescript
// Generate embeddings for a query
export async function generateQueryEmbedding(query: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: query,
  });
  return response.data[0]?.embedding;
}

// Search for similar content
export async function searchSimilarContent(
  query: string,
  domain: string,
  limit: number = 5,
  similarityThreshold: number = 0.7
): Promise<Array<{content, url, title, similarity}>> {
  const supabase = await createServiceRoleClient(); // Important: Use service role
  const queryEmbedding = await generateQueryEmbedding(query);
  
  const { data, error } = await supabase.rpc('search_embeddings', {
    query_embedding: queryEmbedding,
    similarity_threshold: similarityThreshold,
    match_count: limit
  });
  
  return data || [];
}
```

### 2. Chat Integration (`app/api/chat/route.ts`)

```typescript
// In the chat API route
if (config?.features?.websiteScraping?.enabled !== false && domain) {
  embeddingSearchPromise = searchSimilarContent(
    message,
    domain,
    3, // Get top 3 results
    0.3 // Similarity threshold (30% match minimum)
  );
}

// Process results
if (embeddingResults.length > 0) {
  context += '\n\nRelevant website content:\n';
  for (const result of embeddingResults) {
    context += `- ${result.content}\n`;
    sources.push({
      url: result.url,
      title: result.title,
      relevance: result.similarity,
    });
  }
}
```

## Configuration Requirements

### Environment Variables
```env
NEXT_PUBLIC_SUPABASE_URL=https://birugqyuqhiahxvxeyqg.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
OPENAI_API_KEY=your_openai_api_key
```

### Customer Configuration
The `customer_configs` table must have an entry for the domain:
```sql
INSERT INTO customer_configs (domain, business_name, ...) 
VALUES ('thompsonseparts.co.uk', 'Thompson eParts', ...);
```

## Common Issues and Solutions

### Issue 1: "Search found 0 results"
**Cause**: Similarity threshold too high
**Solution**: Lower threshold from 0.7 to 0.3 in `searchSimilarContent` call

### Issue 2: RPC function not found
**Cause**: Function doesn't exist in database
**Solution**: Run the CREATE FUNCTION SQL in Supabase SQL editor

### Issue 3: Permission denied errors
**Cause**: Using anon key instead of service role key
**Solution**: Use `createServiceRoleClient()` instead of `createClient()`

### Issue 4: Wrong parameter names
**Cause**: RPC parameters don't match function signature
**Solution**: Use correct names: `query_embedding`, `similarity_threshold`, `match_count`

## Testing the RAG System

### 1. Test Search Function Directly
```javascript
// Test endpoint: /api/test-search-function
const response = await supabase.rpc('search_embeddings', {
  query_embedding: embedding,
  similarity_threshold: 0.3,
  match_count: 10
});
```

### 2. Test Chat API with RAG
```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What tipper products do you offer?",
    "session_id": "test-session",
    "domain": "thompsonseparts.co.uk",
    "config": {
      "features": {
        "websiteScraping": { "enabled": true }
      }
    }
  }'
```

### Expected Response with Working RAG:
```json
{
  "message": "Response text here...",
  "conversation_id": "uuid",
  "sources": [
    {
      "url": "https://www.thompsonseparts.co.uk/",
      "title": "Thompson eParts",
      "relevance": 0.588
    }
  ]
}
```

## Performance Considerations

### Similarity Thresholds
- **0.7-1.0**: Very high similarity, few results
- **0.5-0.7**: Good balance, relevant results
- **0.3-0.5**: Lower similarity, more results
- **< 0.3**: Too many irrelevant results

### Optimization Tips
1. **Batch Processing**: Generate embeddings in batches of 20
2. **Caching**: Consider caching frequent queries
3. **Index**: Ensure vector index exists: `CREATE INDEX ON page_embeddings USING ivfflat (embedding vector_cosine_ops)`

## Adding More Training Data

### 1. Scrape New Pages
Use the admin panel at `/admin/scraping` to add new URLs

### 2. Generate Embeddings
```typescript
await generateEmbeddings({
  contentId: pageId,
  content: pageContent,
  url: pageUrl,
  title: pageTitle
});
```

### 3. Verify Embeddings
```sql
SELECT COUNT(*) FROM page_embeddings;
SELECT chunk_text, metadata FROM page_embeddings LIMIT 5;
```

## Monitoring and Debugging

### Check Embedding Count
```sql
SELECT COUNT(*) FROM page_embeddings;
-- Current: 153 embeddings
```

### Test Similarity Search
```sql
SELECT content, similarity 
FROM search_embeddings(
  (SELECT embedding FROM page_embeddings LIMIT 1),
  0.5, 
  5
);
```

### View Server Logs
Look for: `Search found X results for query: "..."`

## Future Improvements

1. **Domain-Specific Filtering**: Re-enable domain filtering when scraped_pages table is properly populated
2. **Better Chunking**: Implement semantic chunking for better context preservation
3. **Hybrid Search**: Combine vector search with keyword search
4. **Reranking**: Implement a reranking model for better result ordering
5. **Feedback Loop**: Track which sources users find helpful

## Maintenance

### Regular Tasks
- Monitor embedding count and quality
- Update embeddings when content changes
- Adjust similarity thresholds based on user feedback
- Clean up old/outdated embeddings

### SQL Maintenance Queries
```sql
-- Remove duplicate embeddings
DELETE FROM page_embeddings a USING page_embeddings b 
WHERE a.id < b.id AND a.chunk_text = b.chunk_text;

-- Update statistics
ANALYZE page_embeddings;

-- Vacuum table
VACUUM page_embeddings;
```