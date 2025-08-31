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

SELECT 'Chunk 1 complete: Basic indexes created' as status;