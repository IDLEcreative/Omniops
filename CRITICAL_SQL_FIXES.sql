-- ============================================================================
-- CRITICAL DATABASE FIXES - Apply Immediately
-- ============================================================================
-- Date: 2025-10-26
-- Purpose: Fix critical schema, data integrity, and security issues
-- Estimated Time: 1.5 hours
-- ============================================================================

-- ============================================================================
-- FIX 1: page_embeddings Foreign Key Cascade (30 minutes)
-- ============================================================================
-- CRITICAL: page_embeddings.domain_id currently has ON DELETE NO ACTION
-- This allows orphaned embeddings and breaks domain isolation
-- Risk Level: CRITICAL - Data integrity violation
-- ============================================================================

BEGIN TRANSACTION ISOLATION LEVEL SERIALIZABLE;

-- Step 1: Identify any orphaned embeddings
SELECT COUNT(*) as orphaned_embeddings FROM page_embeddings
WHERE domain_id NOT IN (SELECT id FROM customer_configs);

-- Step 2: Delete orphaned embeddings (if any found)
DELETE FROM page_embeddings
WHERE domain_id NOT IN (SELECT id FROM customer_configs);

-- Step 3: Fix the foreign key constraint
ALTER TABLE page_embeddings
DROP CONSTRAINT IF EXISTS page_embeddings_domain_id_fkey;

ALTER TABLE page_embeddings
ADD CONSTRAINT page_embeddings_domain_id_fkey
  FOREIGN KEY (domain_id) REFERENCES customer_configs(id) ON DELETE CASCADE;

-- Step 4: Verify the constraint
SELECT constraint_name, constraint_type 
FROM information_schema.table_constraints 
WHERE table_name = 'page_embeddings' AND constraint_name LIKE '%domain%';

COMMIT;

-- ============================================================================
-- FIX 2: Add NOT NULL Constraints (20 minutes)
-- ============================================================================
-- MEDIUM: These columns should enforce NOT NULL for data quality
-- ============================================================================

BEGIN TRANSACTION ISOLATION LEVEL SERIALIZABLE;

-- Fix 2.1: embedding_queue.status
UPDATE embedding_queue SET status = 'pending' WHERE status IS NULL;
ALTER TABLE embedding_queue ALTER COLUMN status SET NOT NULL;

-- Fix 2.2: chat_telemetry.domain
UPDATE chat_telemetry SET domain = 'unknown' WHERE domain IS NULL;
ALTER TABLE chat_telemetry ALTER COLUMN domain SET NOT NULL;

-- Fix 2.3: conversations.domain_id
DELETE FROM conversations WHERE domain_id IS NULL;
ALTER TABLE conversations ALTER COLUMN domain_id SET NOT NULL;

COMMIT;

-- ============================================================================
-- FIX 3: Remove Duplicate Vector Indexes (20 minutes)
-- ============================================================================
-- HIGH: Both IVFFlat and HNSW indexes exist on page_embeddings.embedding
-- HNSW is superior; remove IVFFlat to reduce index overhead
-- ============================================================================

-- Step 1: Verify both indexes exist
SELECT indexname, indexdef FROM pg_indexes
WHERE tablename = 'page_embeddings' AND indexname LIKE '%embedding%';

-- Step 2: Drop IVFFlat index (keep HNSW)
DROP INDEX IF EXISTS idx_page_embeddings_vector_ivfflat CASCADE;

-- Step 3: Verify only HNSW remains
SELECT indexname, indexdef FROM pg_indexes
WHERE tablename = 'page_embeddings' AND indexname LIKE '%embedding%';

-- ============================================================================
-- FIX 4: Remove Overly Permissive RLS Policy (15 minutes)
-- ============================================================================
-- CRITICAL: global_synonym_mappings allows ANY authenticated user to read
-- This is security risk; should be service-role only
-- Risk Level: CRITICAL - Multi-tenant isolation bypass
-- ============================================================================

BEGIN TRANSACTION ISOLATION LEVEL SERIALIZABLE;

-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Anyone can read safe global synonyms" ON global_synonym_mappings;

-- Add restrictive policy - service role only for all operations
CREATE POLICY "Service role full access to global synonyms" ON global_synonym_mappings
  FOR ALL USING (auth.role() = 'service_role');

-- For regular users, create a view instead
DROP VIEW IF EXISTS global_synonym_mappings_safe CASCADE;
CREATE VIEW global_synonym_mappings_safe AS
SELECT id, term, synonyms, category, is_safe_for_all, weight, created_at, updated_at
FROM global_synonym_mappings
WHERE is_safe_for_all = true;

-- Grant read access to authenticated users on the view
GRANT SELECT ON global_synonym_mappings_safe TO authenticated;

COMMIT;

-- ============================================================================
-- FIX 5: Add Missing Unique Constraint (10 minutes)
-- ============================================================================
-- HIGH: widget_config_variants can have duplicate variant names
-- ============================================================================

BEGIN TRANSACTION ISOLATION LEVEL SERIALIZABLE;

-- Check if constraint already exists
SELECT constraint_name FROM information_schema.table_constraints
WHERE table_name = 'widget_config_variants' 
  AND constraint_name = 'unique_variant_per_config';

-- Add constraint (safe if no duplicates exist)
ALTER TABLE widget_config_variants
ADD CONSTRAINT unique_variant_per_config UNIQUE(widget_config_id, variant_name);

COMMIT;

-- ============================================================================
-- VERIFICATION QUERIES - Run after all fixes
-- ============================================================================

-- Verify Fix 1: Foreign key is CASCADE
SELECT 
  constraint_name,
  constraint_type,
  (SELECT delete_rule FROM information_schema.referential_constraints 
   WHERE constraint_name = c.constraint_name) as delete_rule
FROM information_schema.table_constraints c
WHERE table_name = 'page_embeddings' AND constraint_name LIKE '%domain%';

-- Verify Fix 2: NOT NULL constraints applied
SELECT column_name, is_nullable 
FROM information_schema.columns 
WHERE table_name IN ('embedding_queue', 'chat_telemetry', 'conversations')
  AND column_name IN ('status', 'domain', 'domain_id');

-- Verify Fix 3: Only HNSW index remains
SELECT COUNT(*) as vector_indexes FROM pg_indexes
WHERE tablename = 'page_embeddings' AND indexname LIKE '%embedding%';

-- Verify Fix 4: RLS policies updated
SELECT policyname, permissive FROM pg_policies
WHERE tablename = 'global_synonym_mappings';

-- Verify Fix 5: Unique constraint exists
SELECT constraint_name FROM information_schema.table_constraints
WHERE table_name = 'widget_config_variants' 
  AND constraint_type = 'UNIQUE';

-- ============================================================================
-- ROLLBACK PROCEDURES (if needed)
-- ============================================================================

/*
-- To rollback Fix 1:
ALTER TABLE page_embeddings
DROP CONSTRAINT IF EXISTS page_embeddings_domain_id_fkey;
ALTER TABLE page_embeddings
ADD CONSTRAINT page_embeddings_domain_id_fkey
  FOREIGN KEY (domain_id) REFERENCES customer_configs(id) ON DELETE NO ACTION;

-- To rollback Fix 2:
ALTER TABLE embedding_queue ALTER COLUMN status DROP NOT NULL;
ALTER TABLE chat_telemetry ALTER COLUMN domain DROP NOT NULL;
ALTER TABLE conversations ALTER COLUMN domain_id DROP NOT NULL;

-- To rollback Fix 3:
CREATE INDEX idx_page_embeddings_vector_ivfflat ON page_embeddings 
USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- To rollback Fix 4:
DROP VIEW IF EXISTS global_synonym_mappings_safe;
DROP POLICY IF EXISTS "Service role full access to global synonyms" ON global_synonym_mappings;
CREATE POLICY "Anyone can read safe global synonyms" ON global_synonym_mappings
  FOR SELECT USING (is_safe_for_all = true);

-- To rollback Fix 5:
ALTER TABLE widget_config_variants DROP CONSTRAINT unique_variant_per_config;
*/

-- ============================================================================
-- COMPLETION CHECKLIST
-- ============================================================================
/*
Apply these in order:
[ ] FIX 1: page_embeddings FK cascade - Check for orphaned records first
[ ] FIX 2: NOT NULL constraints - Update any NULL values first
[ ] FIX 3: Remove duplicate vector indexes - Can be done anytime
[ ] FIX 4: RLS policy update - Test after applying
[ ] FIX 5: Unique constraint - Verify no duplicates exist first

After all fixes applied:
[ ] Run all verification queries
[ ] Test embeddings search still works
[ ] Test RLS policies with test user
[ ] Monitor application logs for any errors
[ ] Verify backup before starting (if production)
*/
