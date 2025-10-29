-- Migration: Rename scraper_configs.customer_id → domain_config_id
-- Created: 2025-10-29
-- Purpose: Fix confusing naming - customer_id doesn't represent customers
--
-- Background:
--   scraper_configs.customer_id actually references customer_configs.id
--   But "customer" is misleading - it's really a domain configuration ID
--   This creates cognitive debt for every developer who reads the code
--
-- Impact:
--   - Table: scraper_configs (EMPTY - 0 rows)
--   - Code: 2 files affected
--   - Risk: LOW (empty table, clear migration path)
--   - Breaking Changes: None
--
-- Reference: RENAME_DECISION.md

-- =====================================================
-- SECTION 1: SAFETY CHECKS
-- =====================================================

-- Verify table is empty (this rename is only safe on empty table)
DO $$
DECLARE
  v_row_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_row_count FROM scraper_configs;

  IF v_row_count > 0 THEN
    RAISE EXCEPTION 'ABORT: scraper_configs has % rows. This migration is only safe on empty table.', v_row_count;
  ELSE
    RAISE NOTICE 'Safety check passed: scraper_configs is empty (0 rows)';
  END IF;
END $$;

-- =====================================================
-- SECTION 2: RENAME COLUMN
-- =====================================================

-- Rename the column
ALTER TABLE scraper_configs
RENAME COLUMN customer_id TO domain_config_id;

-- =====================================================
-- SECTION 3: UPDATE CONSTRAINTS
-- =====================================================

-- Update unique constraint name for clarity
-- (Only if the constraint exists)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'scraper_configs_customer_id_key'
  ) THEN
    ALTER TABLE scraper_configs
    RENAME CONSTRAINT scraper_configs_customer_id_key
    TO scraper_configs_domain_config_id_key;

    RAISE NOTICE 'Renamed constraint: scraper_configs_customer_id_key → scraper_configs_domain_config_id_key';
  ELSE
    RAISE NOTICE 'Constraint scraper_configs_customer_id_key does not exist, skipping';
  END IF;
END $$;

-- =====================================================
-- SECTION 4: VERIFICATION
-- =====================================================

-- Verify column was renamed
DO $$
DECLARE
  v_old_exists BOOLEAN;
  v_new_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'scraper_configs'
    AND column_name = 'customer_id'
  ) INTO v_old_exists;

  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'scraper_configs'
    AND column_name = 'domain_config_id'
  ) INTO v_new_exists;

  IF v_old_exists THEN
    RAISE EXCEPTION 'FAILED: customer_id column still exists';
  END IF;

  IF NOT v_new_exists THEN
    RAISE EXCEPTION 'FAILED: domain_config_id column not found';
  END IF;

  RAISE NOTICE '✓ SUCCESS: Column renamed successfully';
  RAISE NOTICE '  - customer_id → domain_config_id';
  RAISE NOTICE '  - Table: scraper_configs';
  RAISE NOTICE '  - Rows: 0 (empty)';
END $$;

-- =====================================================
-- SECTION 5: SUMMARY
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'MIGRATION COMPLETE: 20251029_rename_scraper_customer_id.sql';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Changes applied:';
  RAISE NOTICE '  ✓ Renamed scraper_configs.customer_id → domain_config_id';
  RAISE NOTICE '  ✓ Updated unique constraint name';
  RAISE NOTICE '';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '  1. Update code files (2 files):';
  RAISE NOTICE '     - lib/scraper-config-manager-persistence.ts';
  RAISE NOTICE '     - lib/scraper-config-manager-loaders.ts';
  RAISE NOTICE '  2. Update function signatures: customerId → domainConfigId';
  RAISE NOTICE '  3. Run TypeScript compilation';
  RAISE NOTICE '  4. Run test suite';
  RAISE NOTICE '========================================';
END $$;
