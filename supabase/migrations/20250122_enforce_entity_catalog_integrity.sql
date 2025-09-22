-- Migration: Enforce entity_catalog data integrity
-- Date: 2025-01-22
-- Purpose: Add NOT NULL constraint to page_id since all entities must come from scraped pages

-- First verify that no NULL values exist (this will fail if there are any)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM entity_catalog WHERE page_id IS NULL) THEN
        RAISE EXCEPTION 'Cannot add NOT NULL constraint: NULL page_id values exist';
    END IF;
END $$;

-- Add NOT NULL constraint to enforce that all entities must have a source page
ALTER TABLE public.entity_catalog
ALTER COLUMN page_id SET NOT NULL;

-- Now we can simplify our index since we know page_id is never NULL
-- Drop the partial index
DROP INDEX IF EXISTS idx_entity_catalog_page_id;

-- Create a regular index (more efficient when no NULLs exist)
CREATE INDEX idx_entity_catalog_page_id 
ON public.entity_catalog(page_id);

-- Update table comment to document this requirement
COMMENT ON COLUMN public.entity_catalog.page_id IS 
'Required reference to the source page this entity was extracted from. All entities must originate from a scraped page.';

-- Update statistics for query planner
ANALYZE public.entity_catalog;