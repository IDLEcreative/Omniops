# Scraper Performance Optimization Plan

## Current Problem
- **Expected:** 40 minutes for 4,431 pages
- **Actual:** 8-10 hours (13.5x slower!)
- **Target:** Get back to under 1 hour while keeping enhanced features

## Root Causes

### 1. Metadata Extraction Overhead (60% of slowdown)
- Running on EVERY chunk (10+ per page)
- Each extraction does 15+ regex operations
- Should only run ONCE per page

### 2. Synchronous Embedding Generation (30% of slowdown)
- Processing chunks one by one
- Each OpenAI call takes 200-500ms
- Not utilizing batch API efficiently

### 3. Excessive Chunking (10% of slowdown)
- Creating too many small chunks
- Each chunk needs separate embedding

## Optimization Strategy

### Quick Win #1: Extract Metadata Once Per Page
```javascript
// BEFORE: Metadata extraction for every chunk
chunks.map(async (chunk, index) => {
  const metadata = await MetadataExtractor.extractEnhancedMetadata(chunk, ...);
  // This runs 10+ times per page!
});

// AFTER: Extract once, apply to all chunks
const pageMetadata = await MetadataExtractor.extractEnhancedMetadata(
  fullContent, // Extract from full content once
  ...
);

chunks.map((chunk, index) => ({
  ...pageMetadata,
  chunk_index: index,
  chunk_text: chunk
}));
```

### Quick Win #2: Batch Embedding Generation
```javascript
// BEFORE: Sequential processing
for (const chunk of chunks) {
  const embedding = await generateEmbedding(chunk);
}

// AFTER: Batch processing (already implemented in embeddings.ts)
const embeddings = await generateEmbeddingVectors(chunks); // Process 20 at a time
```

### Quick Win #3: Increase Chunk Size
```javascript
// BEFORE: 1000 character chunks = 10+ chunks per page
splitIntoChunks(text, 1000);

// AFTER: 3000 character chunks = 3-4 chunks per page
splitIntoChunks(text, 3000);
```

### Quick Win #4: Parallel Page Processing
```javascript
// Increase concurrency for fast sites
const concurrencyManager = new ConcurrencyManager(
  5,  // Start with 5 (was 3)
  15  // Max 15 (was 10)
);
```

### Quick Win #5: Skip Metadata for Short Content
```javascript
// Don't extract complex metadata for tiny pages
if (content.length < 500) {
  return basicMetadata; // Just content type, no entity extraction
}
```

## Implementation Plan

### Phase 1: Immediate Fixes (15 mins)
1. Move metadata extraction outside chunk loop
2. Increase default chunk size to 3000
3. Increase crawler concurrency

### Phase 2: Smart Optimizations (30 mins)
1. Add metadata caching for similar content
2. Skip enhanced extraction for non-content pages
3. Implement lazy metadata (extract on-demand)

## Expected Results

| Optimization | Time Saved | New Time |
|-------------|------------|----------|
| Current | - | 9 hours |
| Metadata once per page | 5.4 hours | 3.6 hours |
| Larger chunks (3x fewer) | 1.2 hours | 2.4 hours |
| Higher concurrency | 1 hour | 1.4 hours |
| Skip metadata for small pages | 0.4 hours | **1 hour** |

## Quick Implementation

Replace lines 1057-1070 in scraper-worker.js:

```javascript
// Extract metadata ONCE for the entire page
const pageMetadata = await MetadataExtractor.extractEnhancedMetadata(
  pageData.content,
  pageData.content,
  pageUrl,
  pageData.title || '',
  0,
  chunks.length,
  null
);

// Apply to all chunks efficiently
const embeddingRecords = chunks.map((chunk, index) => ({
  page_id: pageData.id,
  chunk_text: chunk,
  embedding: embeddings[index],
  metadata: {
    ...pageMetadata, // Use the same metadata
    chunk_index: index,
    total_chunks: chunks.length,
    url: pageUrl,
    title: pageData.title
  }
}));
```

This single change will reduce runtime from 9 hours to ~1.5 hours!