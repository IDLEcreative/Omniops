-- CHUNK 1: Basic Indexes (Run First)
-- This adds the most critical indexes for immediate performance improvement
-- Estimated time: 5-10 seconds

-- Add indexes for foreign key columns (improves JOINs)
CREATE INDEX IF NOT EXISTS idx_scraped_pages_domain_id 
ON scraped_pages(domain_id);

CREATE INDEX IF NOT EXISTS idx_page_embeddings_page_id 
ON page_embeddings(page_id);

CREATE INDEX IF NOT EXISTS idx_messages_conversation_id 
ON messages(conversation_id);

CREATE INDEX IF NOT EXISTS idx_conversations_domain_id 
ON conversations(domain_id);

-- Add composite index for domain + URL filtering
CREATE INDEX IF NOT EXISTS idx_scraped_pages_domain_url 
ON scraped_pages(domain_id, url);

-- Add timestamp indexes for sorting
CREATE INDEX IF NOT EXISTS idx_page_embeddings_created_at 
ON page_embeddings(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_scraped_pages_created_at 
ON scraped_pages(created_at DESC);

-- Update statistics for better query planning
ANALYZE scraped_pages;
ANALYZE page_embeddings;

SELECT 'Chunk 1 complete: Basic indexes created' as status;-- CHUNK 2: Full-Text Search Setup
-- This replaces slow ILIKE queries with fast full-text search
-- Estimated time: 10-15 seconds

-- Add tsvector column for full-text search if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'scraped_pages' 
    AND column_name = 'content_search_vector'
  ) THEN
    ALTER TABLE scraped_pages 
    ADD COLUMN content_search_vector tsvector 
    GENERATED ALWAYS AS (
      to_tsvector('english', 
        coalesce(title, '') || ' ' || 
        coalesce(content, '')
      )
    ) STORED;
  END IF;
END $$;

-- Create GIN index for full-text search (this is the key optimization)
CREATE INDEX IF NOT EXISTS idx_scraped_pages_content_search 
ON scraped_pages USING GIN (content_search_vector);

SELECT 'Chunk 2 complete: Full-text search enabled' as status;-- CHUNK 3: Vector Search Optimization
-- This speeds up embedding similarity searches
-- Estimated time: 5-10 seconds

-- Try to create a simple IVFFlat index with minimal parameters
-- This should work even with memory constraints
DO $$
BEGIN
  -- Check if any vector index already exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'page_embeddings' 
    AND indexname LIKE '%vector%'
  ) THEN
    BEGIN
      -- Try IVFFlat with very few lists (uses less memory)
      CREATE INDEX idx_page_embeddings_vector_simple
      ON page_embeddings 
      USING ivfflat (embedding vector_l2_ops)
      WITH (lists = 10);
      
      RAISE NOTICE 'Vector index created successfully';
    EXCEPTION WHEN OTHERS THEN
      -- If that fails, just create a btree index on page_id for join optimization
      RAISE NOTICE 'Vector index creation failed, skipping: %', SQLERRM;
    END;
  END IF;
END $$;

-- Create composite index for efficient lookups
CREATE INDEX IF NOT EXISTS idx_page_embeddings_page_domain
ON page_embeddings(page_id)
WHERE embedding IS NOT NULL;

SELECT 'Chunk 3 complete: Vector indexes optimized' as status;-- CHUNK 4: Query Cache Table
-- Creates a table for caching expensive query results
-- Estimated time: 2-3 seconds

-- Create query cache table if it doesn't exist
CREATE TABLE IF NOT EXISTS query_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  domain_id uuid NOT NULL,
  query_hash text NOT NULL,
  query_text text,
  query_embedding vector(1536),
  results jsonb NOT NULL,
  hit_count int DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz DEFAULT now() + interval '1 hour'
);

-- Create indexes for cache lookups (very important for performance)
CREATE INDEX IF NOT EXISTS idx_query_cache_lookup 
ON query_cache(domain_id, query_hash) 
WHERE expires_at > now();

CREATE INDEX IF NOT EXISTS idx_query_cache_expires 
ON query_cache(expires_at);

-- Enable RLS for security
ALTER TABLE query_cache ENABLE ROW LEVEL SECURITY;

-- Create policy for service role
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'query_cache' 
    AND policyname = 'Service role can manage cache'
  ) THEN
    CREATE POLICY "Service role can manage cache" ON query_cache
      FOR ALL TO service_role
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

SELECT 'Chunk 4 complete: Query cache table created' as status;-- CHUNK 5: Optimized Search Functions
-- Creates fast search functions using the new indexes
-- Estimated time: 2-3 seconds

-- Fast text search function using full-text search
CREATE OR REPLACE FUNCTION search_text_content(
  query_text text,
  p_domain_id uuid,
  match_count int DEFAULT 10
)
RETURNS TABLE (
  id uuid,
  url text,
  title text,
  content text,
  rank float
)
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    sp.id,
    sp.url,
    sp.title,
    sp.content,
    ts_rank(sp.content_search_vector, websearch_to_tsquery('english', query_text)) as rank
  FROM scraped_pages sp
  WHERE 
    (p_domain_id IS NULL OR sp.domain_id = p_domain_id)
    AND sp.content_search_vector @@ websearch_to_tsquery('english', query_text)
  ORDER BY rank DESC
  LIMIT match_count;
END;
$$;

-- Optimized vector search function
CREATE OR REPLACE FUNCTION search_embeddings_optimized(
  query_embedding vector(1536),
  p_domain_id uuid,
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 10
)
RETURNS TABLE (
  id uuid,
  page_id uuid,
  content text,
  metadata jsonb,
  similarity float
)
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pe.id,
    pe.page_id,
    sp.content,
    sp.metadata,
    1 - (pe.embedding <=> query_embedding) as similarity
  FROM page_embeddings pe
  INNER JOIN scraped_pages sp ON sp.id = pe.page_id
  WHERE 
    (p_domain_id IS NULL OR sp.domain_id = p_domain_id)
    AND pe.embedding IS NOT NULL
    AND 1 - (pe.embedding <=> query_embedding) > match_threshold
  ORDER BY pe.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION search_text_content TO service_role, authenticated;
GRANT EXECUTE ON FUNCTION search_embeddings_optimized TO service_role, authenticated;

SELECT 'Chunk 5 complete: Search functions created' as status;-- CHUNK 6: Cleanup Function
-- Creates a function to clean up expired cache entries
-- Estimated time: 1-2 seconds

-- Create cleanup function for cache
CREATE OR REPLACE FUNCTION cleanup_expired_cache()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  DELETE FROM query_cache WHERE expires_at < now();
  
  -- Optional: cleanup old conversations based on retention policy
  -- Uncomment if you want automatic cleanup
  -- DELETE FROM conversations 
  -- WHERE created_at < now() - interval '90 days'
  --   AND (metadata->>'retained')::boolean IS NOT true;
END;
$$;

-- Try to schedule cleanup with pg_cron (if available)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    -- Remove any existing schedule first
    PERFORM cron.unschedule('cleanup-expired-cache');
    
    -- Schedule hourly cleanup
    PERFORM cron.schedule(
      'cleanup-expired-cache',
      '0 * * * *',  -- Every hour
      'SELECT cleanup_expired_cache();'
    );
    
    RAISE NOTICE 'Scheduled automatic cache cleanup';
  ELSE
    RAISE NOTICE 'pg_cron not available, manual cleanup required';
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Could not schedule cleanup: %', SQLERRM;
END $$;

-- Final statistics update
ANALYZE scraped_pages;
ANALYZE page_embeddings;
ANALYZE query_cache;
ANALYZE customer_configs;
ANALYZE messages;
ANALYZE conversations;

SELECT 'Chunk 6 complete: Cleanup and statistics updated' as status;