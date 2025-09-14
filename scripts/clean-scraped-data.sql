-- =====================================================
-- Clean All Scraped Data Script
-- =====================================================
-- This script removes all scraped data while preserving
-- customer configurations and domain settings
-- 
-- Usage:
-- 1. Run this in Supabase SQL Editor
-- 2. Or use: psql $DATABASE_URL < clean-scraped-data.sql
-- =====================================================

BEGIN;

-- Show current counts before deletion
SELECT 
  'Current Data Summary' as info,
  (SELECT COUNT(*) FROM scraped_pages) as scraped_pages,
  (SELECT COUNT(*) FROM website_content) as website_content,
  (SELECT COUNT(*) FROM page_embeddings) as embeddings,
  (SELECT COUNT(*) FROM structured_extractions) as extractions;

-- Delete in correct order (respecting foreign key constraints)

-- 1. Delete page embeddings (references scraped_pages)
DELETE FROM page_embeddings;
SELECT 'Deleted all page embeddings' as status;

-- 2. Delete structured extractions
DELETE FROM structured_extractions;
SELECT 'Deleted all structured extractions' as status;

-- 3. Delete website content
DELETE FROM website_content;
SELECT 'Deleted all website content' as status;

-- 4. Delete scraped pages
DELETE FROM scraped_pages;
SELECT 'Deleted all scraped pages' as status;

-- 5. Delete scrape jobs (if table exists)
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'scrape_jobs') THEN
    DELETE FROM scrape_jobs;
    RAISE NOTICE 'Deleted all scrape jobs';
  END IF;
END $$;

-- 6. Delete query cache (if table exists)
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'query_cache') THEN
    DELETE FROM query_cache;
    RAISE NOTICE 'Deleted all cached queries';
  END IF;
END $$;

-- 7. Optional: Delete all conversations and messages
-- Uncomment if you want to clear chat history too
-- DELETE FROM messages;
-- DELETE FROM conversations;
-- SELECT 'Deleted all conversations and messages' as status;

-- 8. Reset domain timestamps
UPDATE domains 
SET 
  last_scraped_at = NULL,
  last_content_refresh = NULL;
SELECT 'Reset all domain scraping timestamps' as status;

-- Show final counts (should all be 0)
SELECT 
  'Final Data Summary (should be 0)' as info,
  (SELECT COUNT(*) FROM scraped_pages) as scraped_pages,
  (SELECT COUNT(*) FROM website_content) as website_content,
  (SELECT COUNT(*) FROM page_embeddings) as embeddings,
  (SELECT COUNT(*) FROM structured_extractions) as extractions;

COMMIT;

-- =====================================================
-- Domain-Specific Cleanup (Alternative)
-- =====================================================
-- To clean data for a specific domain only, use:
/*
-- Replace 'example.com' with your domain
WITH target_domain AS (
  SELECT id FROM domains WHERE domain = 'example.com'
)
DELETE FROM page_embeddings 
WHERE domain_id IN (SELECT id FROM target_domain);

-- Continue with other tables using the same pattern...
*/