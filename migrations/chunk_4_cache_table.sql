-- CHUNK 4: Query Cache Table
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

SELECT 'Chunk 4 complete: Query cache table created' as status;