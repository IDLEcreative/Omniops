# Metadata Vectorization Implementation Plan

## Executive Summary
Currently, our e-commerce extraction system successfully captures rich product metadata (SKU, price, availability, specifications) but fails to include this data in vector embeddings. This limits semantic search capabilities, preventing natural language queries about product attributes from working effectively. This plan outlines a phased approach to vectorize metadata, improving search relevance by 60-80% for e-commerce queries.

## Problem Statement

### Current State
- **What Works**: E-commerce data extraction captures product details successfully
- **What's Missing**: Metadata is stored but NOT included in vector embeddings
- **Impact**: Semantic search cannot understand product attributes like price, availability, or SKU

### Examples of Failed Queries
- ❌ "Show me hydraulic pumps under £500"
- ❌ "Which products are in stock?"
- ❌ "Find all items with SKU starting with DC"
- ❌ "What's the cheapest oil tank available?"

### Root Cause
```javascript
// Current: Only page text content is vectorized
const chunks = await splitIntoChunks(pageData.content, 3000);

// Metadata exists but isn't included
metadata: {
  productName: "Binotto/OMFB 21ltr Oil Tank",
  productSku: "13550000214", 
  productPrice: "Contact for price",
  productInStock: undefined
}
```

## Proposed Solution

### Three-Phase Implementation

#### Phase 1: Quick Win - Content Enrichment (Week 1)
**Approach**: Enrich text content with metadata before vectorization

**Implementation**:
```javascript
// lib/scraper-worker.js - Enhanced content preparation
function enrichContentWithMetadata(content, metadata) {
  const metadataSection = [];
  
  if (metadata?.productName) {
    metadataSection.push(`Product: ${metadata.productName}`);
  }
  if (metadata?.productSku) {
    metadataSection.push(`SKU: ${metadata.productSku}`);
  }
  if (metadata?.productPrice) {
    metadataSection.push(`Price: ${metadata.productPrice}`);
  }
  if (metadata?.productInStock !== undefined) {
    metadataSection.push(`Availability: ${metadata.productInStock ? 'In Stock' : 'Out of Stock'}`);
  }
  
  // Add metadata at the beginning for better embedding relevance
  return metadataSection.length > 0 
    ? `${metadataSection.join('\n')}\n\n${content}`
    : content;
}
```

**Benefits**:
- Minimal code changes (< 50 lines)
- No database schema changes
- Immediate improvement in search relevance
- Works with existing infrastructure

**Estimated Impact**: 30-40% improvement in product search accuracy

#### Phase 2: Dual Embedding Strategy (Week 2-3)
**Approach**: Create separate embeddings for content and metadata

**Database Schema Changes**:
```sql
-- Add metadata embedding column
ALTER TABLE page_embeddings 
ADD COLUMN metadata_embedding vector(1536),
ADD COLUMN embedding_type text DEFAULT 'content';

-- Create index for metadata embeddings
CREATE INDEX idx_page_embeddings_metadata 
ON page_embeddings USING ivfflat (metadata_embedding vector_cosine_ops)
WITH (lists = 100);
```

**Implementation**:
```javascript
// Generate dual embeddings
async function generateDualEmbeddings(pageData) {
  const [contentEmbedding, metadataEmbedding] = await Promise.all([
    generateEmbedding(pageData.content),
    generateEmbedding(JSON.stringify(pageData.metadata, null, 2))
  ]);
  
  return {
    content: contentEmbedding,
    metadata: metadataEmbedding
  };
}
```

**Search Enhancement**:
```sql
-- Hybrid vector search function
CREATE OR REPLACE FUNCTION search_with_metadata(
  query_embedding vector(1536),
  metadata_weight float DEFAULT 0.3
)
RETURNS TABLE(...) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    id,
    -- Weighted combination of content and metadata similarity
    (content_similarity * (1 - metadata_weight) + 
     metadata_similarity * metadata_weight) as combined_score
  FROM (
    SELECT 
      id,
      1 - (embedding <=> query_embedding) as content_similarity,
      1 - (metadata_embedding <=> query_embedding) as metadata_similarity
    FROM page_embeddings
  ) scores
  ORDER BY combined_score DESC;
END;
$$;
```

**Benefits**:
- Separate optimization for content vs metadata search
- Adjustable weighting based on query type
- Better handling of structured data

**Estimated Impact**: 50-60% improvement in product search accuracy

#### Phase 3: Intelligent Query Routing (Week 4)
**Approach**: Detect query intent and route to appropriate search strategy

**Query Classification**:
```javascript
class QueryClassifier {
  static classify(query) {
    const lower = query.toLowerCase();
    
    // Product attribute queries
    if (/price|cost|cheap|expensive|£|\$|€/.test(lower)) {
      return { type: 'price', weight: { metadata: 0.7, content: 0.3 } };
    }
    
    // Availability queries
    if (/stock|available|inventory|ship/.test(lower)) {
      return { type: 'availability', weight: { metadata: 0.8, content: 0.2 } };
    }
    
    // SKU/Part number queries
    if (/sku|part|model|code|[A-Z]{2,}\d{2,}/.test(query)) {
      return { type: 'identifier', weight: { metadata: 0.9, content: 0.1 } };
    }
    
    // General product queries
    return { type: 'general', weight: { metadata: 0.3, content: 0.7 } };
  }
}
```

**SQL Filtering Layer**:
```javascript
// Pre-filter by metadata before vector search
async function smartProductSearch(query, filters = {}) {
  let sqlFilters = [];
  
  if (filters.priceMax) {
    sqlFilters.push(`(metadata->>'productPrice')::numeric <= ${filters.priceMax}`);
  }
  
  if (filters.inStock) {
    sqlFilters.push(`metadata->>'productInStock' = 'true'`);
  }
  
  if (filters.sku) {
    sqlFilters.push(`metadata->>'productSku' ILIKE '%${filters.sku}%'`);
  }
  
  // First: SQL filter on metadata
  const filtered = await supabase
    .from('scraped_pages')
    .select('id')
    .filter(sqlFilters.join(' AND '));
  
  // Then: Vector search within filtered results
  return await vectorSearch(query, filtered.map(r => r.id));
}
```

**Benefits**:
- Precise filtering before expensive vector operations
- Query-appropriate search strategies
- Optimal performance for different query types

**Estimated Impact**: 70-80% improvement in product search accuracy

## Implementation Timeline

### Week 1: Phase 1 - Quick Win
- **Day 1-2**: Implement content enrichment function
- **Day 3**: Update scraper-worker.js to use enriched content
- **Day 4**: Test with Thompson's eParts data
- **Day 5**: Deploy and monitor improvements

### Week 2-3: Phase 2 - Dual Embeddings
- **Day 1-2**: Database schema updates
- **Day 3-4**: Implement dual embedding generation
- **Day 5-6**: Update search functions
- **Day 7-8**: Migration script for existing data
- **Day 9-10**: Testing and optimization

### Week 4: Phase 3 - Query Routing
- **Day 1-2**: Build query classifier
- **Day 3-4**: Implement SQL pre-filtering
- **Day 5**: Integration and testing

## Technical Requirements

### Dependencies
- No new dependencies required
- Existing: OpenAI API, Supabase, pgvector

### Database Changes
- Phase 1: None
- Phase 2: Add metadata_embedding column (migration required)
- Phase 3: Add filtering indexes on JSONB fields

### API Changes
- Phase 1: None (backward compatible)
- Phase 2: Optional metadata_weight parameter
- Phase 3: New /api/search/products endpoint

## Performance Considerations

### Embedding Costs
- Phase 1: No additional costs (same number of embeddings)
- Phase 2: 2x embedding costs (mitigated by caching)
- Phase 3: Reduced costs through pre-filtering

### Storage Impact
- Phase 1: No change
- Phase 2: ~2x embedding storage (1.5KB per additional embedding)
- Phase 3: No additional storage

### Query Performance
- Phase 1: Same performance
- Phase 2: Slightly slower (dual similarity calculation)
- Phase 3: Faster (SQL filtering reduces vector operations)

## Success Metrics

### Quantitative
- Search relevance score: Target 80% (from current ~40%)
- Query response time: < 500ms
- False positive rate: < 10%
- Product discovery rate: > 90% for exact SKU matches

### Qualitative
- Natural language product queries work intuitively
- Users can filter by price, availability, specifications
- Reduced "no results found" responses

## Risk Mitigation

### Risks
1. **Increased embedding costs**: Mitigated by intelligent caching
2. **Migration complexity**: Phased approach allows rollback
3. **Performance degradation**: Pre-filtering actually improves performance

### Rollback Plan
- Phase 1: Simply remove enrichment function
- Phase 2: Keep schema, ignore metadata embeddings
- Phase 3: Revert to simple vector search

## Testing Strategy

### Unit Tests
```javascript
describe('Metadata Vectorization', () => {
  test('enriched content includes product metadata', () => {
    const enriched = enrichContentWithMetadata(content, metadata);
    expect(enriched).toContain('SKU: 13550000214');
    expect(enriched).toContain('Price: Contact for price');
  });
  
  test('query classifier identifies product queries', () => {
    const result = QueryClassifier.classify('pumps under £500');
    expect(result.type).toBe('price');
    expect(result.weight.metadata).toBeGreaterThan(0.5);
  });
});
```

### Integration Tests
- Test with real Thompson's eParts data
- Verify search improvements for common queries
- Measure performance impact

### A/B Testing
- Run both old and new search in parallel
- Compare relevance scores
- Gather user feedback

## Documentation Updates

### Code Documentation
- Update inline comments in scraper-worker.js
- Document new search parameters
- Add examples to API documentation

### User Documentation
- Update search tips for users
- Document new filtering capabilities
- Provide query examples

## Expected Outcomes

### Immediate (Phase 1)
- Basic product queries start working
- SKU searches become more reliable
- Price mentions in queries are understood

### Short-term (Phase 2)
- Complex product filtering works
- Multi-attribute queries supported
- Better relevance ranking

### Long-term (Phase 3)
- Natural language shopping experience
- Intelligent query understanding
- Optimal performance at scale

## Conclusion

This implementation will transform our search from text-based to truly semantic, understanding product attributes and relationships. The phased approach ensures quick wins while building toward a sophisticated e-commerce search system that rivals dedicated product search engines.

The total implementation time is 4 weeks, with measurable improvements starting from Week 1. The ROI is significant: better search leads to higher conversion rates and improved user satisfaction.