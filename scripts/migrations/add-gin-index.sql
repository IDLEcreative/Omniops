-- Add GIN index for fast text search on scraped_pages content
-- This dramatically improves full-text search performance

-- Create GIN index for text search
CREATE INDEX IF NOT EXISTS idx_scraped_pages_content_gin 
ON scraped_pages 
USING gin(to_tsvector('english', content));

-- Also add GIN index on title for faster title searches
CREATE INDEX IF NOT EXISTS idx_scraped_pages_title_gin 
ON scraped_pages 
USING gin(to_tsvector('english', title));

-- Add composite index for better join performance
CREATE INDEX IF NOT EXISTS idx_page_embeddings_composite 
ON page_embeddings(page_id, chunk_index);

-- Optional: Add HNSW index for vector similarity search (if extension available)
-- Note: This requires the vector extension with HNSW support
DO $$ 
BEGIN
  BEGIN
    CREATE INDEX IF NOT EXISTS idx_page_embeddings_hnsw 
    ON page_embeddings 
    USING hnsw (embedding vector_cosine_ops);
    RAISE NOTICE 'HNSW index created successfully';
  EXCEPTION
    WHEN OTHERS THEN
      RAISE NOTICE 'HNSW index could not be created (extension may not be available): %', SQLERRM;
  END;
END $$;

-- Update statistics for query planner
ANALYZE scraped_pages;
ANALYZE page_embeddings;

-- Check index creation
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename IN ('scraped_pages', 'page_embeddings')
ORDER BY tablename, indexname;