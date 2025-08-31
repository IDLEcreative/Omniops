-- CHUNK 6: Cleanup Function
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