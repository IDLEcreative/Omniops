-- Migration: Add missing foreign key index
-- Date: 2025-01-22
-- Purpose: Fix performance issue with entity_catalog foreign key

-- Add index for entity_catalog.page_id foreign key
-- This index is REQUIRED for optimal JOIN performance with scraped_pages table
-- Without this index, queries joining these tables will be significantly slower
CREATE INDEX IF NOT EXISTS idx_entity_catalog_page_id 
ON public.entity_catalog(page_id)
WHERE page_id IS NOT NULL;

-- Update statistics for query planner
ANALYZE public.entity_catalog;

-- Note: The Supabase advisor shows many "unused" indexes, but these are likely
-- unused only because this is a development environment without production traffic.
-- These indexes support critical functionality like:
-- - Product search and filtering
-- - Multi-tenant domain isolation  
-- - Full-text search
-- - Job queue management
-- They should NOT be removed without thorough production usage analysis.