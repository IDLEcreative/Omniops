-- CHUNK 2: Full-Text Search Setup
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

SELECT 'Chunk 2 complete: Full-text search enabled' as status;