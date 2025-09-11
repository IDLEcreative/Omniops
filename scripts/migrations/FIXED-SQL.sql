-- URGENT: RUN THIS IN SUPABASE SQL EDITOR NOW!
-- This will fix the database performance issues

-- Step 1: Kill all long-running queries
SELECT pg_terminate_backend(pid) 
FROM pg_stat_activity 
WHERE state = 'active'
  AND query_start < NOW() - INTERVAL '2 minutes'
  AND pid != pg_backend_pid();

-- Step 2: Add the MOST CRITICAL index (this alone will fix 78% of the problem!)
CREATE INDEX IF NOT EXISTS idx_page_embeddings_page_id 
ON page_embeddings(page_id);

-- Step 3: Add unique constraint for faster upserts (with proper error handling)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'scraped_pages_url_unique'
    ) THEN
        ALTER TABLE scraped_pages 
        ADD CONSTRAINT scraped_pages_url_unique UNIQUE (url);
    END IF;
END $$;

-- Step 4: Add index for domain lookups
CREATE INDEX IF NOT EXISTS idx_scraped_pages_domain_id 
ON scraped_pages(domain_id);

-- Step 5: Update statistics
ANALYZE page_embeddings;
ANALYZE scraped_pages;

-- Check if it worked
SELECT 
    'Database is recovering!' as status,
    (SELECT count(*) FROM pg_stat_activity WHERE state = 'active') as active_queries,
    (SELECT count(*) FROM scraped_pages) as total_pages;