-- Migration: Drop Dead conversations.customer_id Column
-- Created: 2025-10-29
-- Issue: #6 Phase 3 - Cleanup
--
-- Purpose: Remove deprecated customer_id column from conversations table
-- This column was never used (100% NULL values) and has no foreign key.
-- The correct columns are domain_id and organization_id.
--
-- Safety Check: Verified 2,263 rows all have NULL customer_id
-- Breaking Change: None (column never used in application code)

-- =============================================================================
-- SAFETY VERIFICATION (Run this first to confirm it's safe)
-- =============================================================================

DO $$
DECLARE
  v_total_rows INTEGER;
  v_non_null_count INTEGER;
BEGIN
  -- Count total rows and non-null customer_id values
  SELECT COUNT(*), COUNT(customer_id)
  INTO v_total_rows, v_non_null_count
  FROM conversations;

  RAISE NOTICE 'Conversations table analysis:';
  RAISE NOTICE '  Total rows: %', v_total_rows;
  RAISE NOTICE '  Non-null customer_id: %', v_non_null_count;
  RAISE NOTICE '  Null customer_id: %', v_total_rows - v_non_null_count;

  IF v_non_null_count > 0 THEN
    RAISE EXCEPTION 'ABORT: Found % rows with non-null customer_id. Manual investigation required!', v_non_null_count;
  ELSE
    RAISE NOTICE 'SAFE: All customer_id values are NULL. Safe to drop column.';
  END IF;
END $$;

-- =============================================================================
-- DROP COLUMN
-- =============================================================================

-- Drop the dead column
ALTER TABLE conversations DROP COLUMN IF EXISTS customer_id;

-- =============================================================================
-- VERIFICATION
-- =============================================================================

DO $$
DECLARE
  v_column_exists BOOLEAN;
BEGIN
  -- Check if column was successfully dropped
  SELECT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'conversations'
      AND column_name = 'customer_id'
  ) INTO v_column_exists;

  IF v_column_exists THEN
    RAISE WARNING 'Column still exists! DROP may have failed.';
  ELSE
    RAISE NOTICE 'SUCCESS: customer_id column dropped from conversations table';
  END IF;
END $$;

-- =============================================================================
-- MIGRATION SUMMARY
-- =============================================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'MIGRATION COMPLETE: Drop conversations.customer_id';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Changes:';
  RAISE NOTICE '  ✓ Dropped conversations.customer_id (dead column)';
  RAISE NOTICE '';
  RAISE NOTICE 'Remaining ID columns in conversations:';
  RAISE NOTICE '  ✓ domain_id → domains.id (NOT NULL, FK)';
  RAISE NOTICE '  ✓ organization_id → organizations.id (FK)';
  RAISE NOTICE '  ✓ session_id (TEXT, for tracking)';
  RAISE NOTICE '';
  RAISE NOTICE 'No code changes required (column never used)';
  RAISE NOTICE '========================================';
END $$;
