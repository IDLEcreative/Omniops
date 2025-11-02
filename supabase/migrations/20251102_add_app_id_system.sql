-- App ID System Migration
-- Adds public app_id for simplified widget integration
-- Adds configuration versioning for rollback capability

-- ============================================================================
-- 1. Add app_id column to customer_configs
-- ============================================================================

-- Add app_id column (nullable initially for migration)
ALTER TABLE customer_configs
ADD COLUMN IF NOT EXISTS app_id VARCHAR(255);

-- Generate app IDs for existing customers (format: app_RANDOM16CHAR)
-- Uses MD5 hash of random + id for uniqueness
UPDATE customer_configs
SET app_id = 'app_' || substr(md5(random()::text || id::text), 1, 16)
WHERE app_id IS NULL;

-- Now make it NOT NULL and UNIQUE
ALTER TABLE customer_configs
ALTER COLUMN app_id SET NOT NULL;

ALTER TABLE customer_configs
ADD CONSTRAINT customer_configs_app_id_unique UNIQUE (app_id);

-- Add index for fast lookups
CREATE INDEX IF NOT EXISTS idx_customer_configs_app_id
ON customer_configs(app_id);

-- Add helpful comment
COMMENT ON COLUMN customer_configs.app_id IS
'Public identifier for widget integration. Format: app_[16 random chars]. Used in embed code instead of domain for simplified setup.';

-- ============================================================================
-- 2. Configuration Versioning System
-- ============================================================================

-- Create widget_config_versions table for rollback capability
CREATE TABLE IF NOT EXISTS widget_config_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_config_id UUID NOT NULL REFERENCES customer_configs(id) ON DELETE CASCADE,
  config_snapshot JSONB NOT NULL,
  version INTEGER NOT NULL,
  deployed_at TIMESTAMPTZ DEFAULT NOW(),
  deployed_by VARCHAR(255),
  rollback_available BOOLEAN DEFAULT true,
  notes TEXT,

  -- Ensure version uniqueness per customer
  CONSTRAINT widget_config_versions_unique_version
    UNIQUE (customer_config_id, version)
);

-- Index for version lookups (descending order for latest-first)
CREATE INDEX IF NOT EXISTS idx_widget_config_versions_customer
ON widget_config_versions(customer_config_id, version DESC);

CREATE INDEX IF NOT EXISTS idx_widget_config_versions_deployed
ON widget_config_versions(deployed_at DESC);

-- Add comments
COMMENT ON TABLE widget_config_versions IS
'Stores historical snapshots of widget configurations for rollback and audit trail';

COMMENT ON COLUMN widget_config_versions.config_snapshot IS
'Complete JSONB snapshot of widget configuration at time of deployment';

COMMENT ON COLUMN widget_config_versions.version IS
'Auto-incrementing version number per customer (1, 2, 3, ...)';

COMMENT ON COLUMN widget_config_versions.rollback_available IS
'Whether this version can be rolled back to (false for breaking changes)';

-- ============================================================================
-- 3. Auto-increment version function
-- ============================================================================

CREATE OR REPLACE FUNCTION increment_config_version()
RETURNS TRIGGER AS $$
BEGIN
  -- Auto-set version to max + 1 for this customer
  NEW.version := COALESCE(
    (SELECT MAX(version) FROM widget_config_versions WHERE customer_config_id = NEW.customer_config_id),
    0
  ) + 1;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-increment version
DROP TRIGGER IF EXISTS set_config_version ON widget_config_versions;
CREATE TRIGGER set_config_version
BEFORE INSERT ON widget_config_versions
FOR EACH ROW
EXECUTE FUNCTION increment_config_version();

-- ============================================================================
-- 4. Helper function to save config snapshot
-- ============================================================================

CREATE OR REPLACE FUNCTION save_config_snapshot(
  p_customer_config_id UUID,
  p_config_data JSONB,
  p_deployed_by VARCHAR DEFAULT NULL,
  p_notes TEXT DEFAULT NULL
)
RETURNS INTEGER AS $$
DECLARE
  v_version INTEGER;
BEGIN
  -- Insert new version (trigger will set version number)
  INSERT INTO widget_config_versions (
    customer_config_id,
    config_snapshot,
    deployed_by,
    notes
  ) VALUES (
    p_customer_config_id,
    p_config_data,
    p_deployed_by,
    p_notes
  )
  RETURNING version INTO v_version;

  RETURN v_version;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION save_config_snapshot IS
'Convenience function to save a configuration snapshot. Returns new version number.';

-- ============================================================================
-- 5. Validation and verification
-- ============================================================================

-- Verify all customers have app_ids
DO $$
DECLARE
  missing_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO missing_count
  FROM customer_configs
  WHERE app_id IS NULL;

  IF missing_count > 0 THEN
    RAISE EXCEPTION 'Migration failed: % customers missing app_id', missing_count;
  END IF;

  RAISE NOTICE 'Migration successful: All customers have app_ids';
END $$;

-- Log migration completion
DO $$
BEGIN
  RAISE NOTICE '✅ App ID System Migration Complete';
  RAISE NOTICE '   - app_id column added and populated';
  RAISE NOTICE '   - widget_config_versions table created';
  RAISE NOTICE '   - Auto-versioning enabled';
  RAISE NOTICE '';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '   1. Update widget API to support app_id lookups';
  RAISE NOTICE '   2. Generate new embed code using app_id';
  RAISE NOTICE '   3. Create migration guide for customers';
END $$;
