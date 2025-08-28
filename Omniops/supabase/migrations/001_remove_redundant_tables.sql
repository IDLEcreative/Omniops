-- Migration: Remove Redundant Tables
-- Date: 2025-08-25
-- Purpose: Clean up unused and redundant tables to simplify schema

-- 1. Drop website_content table (redundant with structured_extractions)
DROP TABLE IF EXISTS website_content CASCADE;

-- 2. Drop content_embeddings table (duplicate of page_embeddings)
DROP TABLE IF EXISTS content_embeddings CASCADE;

-- 3. Drop unused feature tables (can recreate when needed)
DROP TABLE IF EXISTS content_refresh_jobs CASCADE;
DROP TABLE IF EXISTS ai_optimized_content CASCADE;
DROP TABLE IF EXISTS content_hashes CASCADE;
DROP TABLE IF EXISTS page_content_references CASCADE;

-- Note: Keeping these tables for future use:
-- - customers, customer_configs (multi-tenancy)
-- - training_data (custom AI training)
-- - conversations, messages (chat history)

-- These are core tables we're keeping:
-- - domains (website tracking)
-- - scraped_pages (raw content)
-- - page_embeddings (vector search)
-- - structured_extractions (products, FAQs, etc.)

COMMENT ON TABLE domains IS 'Websites being scraped and monitored';
COMMENT ON TABLE scraped_pages IS 'Raw HTML and text content from scraped pages';
COMMENT ON TABLE page_embeddings IS 'Vector embeddings for semantic search across page content';
COMMENT ON TABLE structured_extractions IS 'Flexible JSONB storage for products, FAQs, contact info, etc.';