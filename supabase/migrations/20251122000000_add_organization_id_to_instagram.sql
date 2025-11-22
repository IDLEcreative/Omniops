-- Migration: Add organization_id to Instagram Integration Tables
-- Date: 2025-11-22
-- Description: Completes customer_id → organization_id migration for Instagram integration
-- Part of Issue #002: Legacy customer_id Architecture refactoring

-- =====================================================
-- ADD ORGANIZATION_ID TO INSTAGRAM TABLES
-- =====================================================

-- Add organization_id to instagram_credentials
ALTER TABLE instagram_credentials
  ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

-- Backfill organization_id from customer_configs
-- instagram_credentials.customer_id references customer_configs.id
UPDATE instagram_credentials ic
SET organization_id = cc.organization_id
FROM customer_configs cc
WHERE ic.customer_id = cc.id
  AND cc.organization_id IS NOT NULL
  AND ic.organization_id IS NULL;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_instagram_credentials_organization_id
  ON instagram_credentials(organization_id)
  WHERE organization_id IS NOT NULL;

-- Update RLS policy to use organization_id
DROP POLICY IF EXISTS instagram_credentials_customer_isolation ON instagram_credentials;

CREATE POLICY instagram_credentials_organization_isolation ON instagram_credentials
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id
      FROM organization_members
      WHERE user_id = auth.uid()
    )
  );

-- Add comments
COMMENT ON COLUMN instagram_credentials.organization_id IS 'Organization that owns this Instagram integration';
COMMENT ON COLUMN instagram_credentials.customer_id IS 'DEPRECATED: Use organization_id instead. References customer_configs.id for backward compatibility.';

-- Verification query
DO $$
DECLARE
  total_creds INTEGER;
  migrated_creds INTEGER;
  migration_percentage NUMERIC;
BEGIN
  SELECT COUNT(*) INTO total_creds FROM instagram_credentials;
  SELECT COUNT(*) INTO migrated_creds FROM instagram_credentials WHERE organization_id IS NOT NULL;

  IF total_creds > 0 THEN
    migration_percentage := (migrated_creds::NUMERIC / total_creds::NUMERIC) * 100;
    RAISE NOTICE 'Instagram Credentials Migration: %/% migrated (%.1f%%)',
      migrated_creds, total_creds, migration_percentage;
  ELSE
    RAISE NOTICE 'No Instagram credentials to migrate';
  END IF;
END $$;

-- =====================================================
-- ADD ORGANIZATION_ID TO OTHER INSTAGRAM TABLES
-- =====================================================

-- Check if instagram_messages table exists and add organization_id
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name = 'instagram_messages'
  ) THEN
    -- Add organization_id column
    ALTER TABLE instagram_messages
      ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

    -- Backfill from instagram_credentials
    UPDATE instagram_messages im
    SET organization_id = ic.organization_id
    FROM instagram_credentials ic
    WHERE im.credentials_id = ic.id
      AND ic.organization_id IS NOT NULL
      AND im.organization_id IS NULL;

    -- Add index
    CREATE INDEX IF NOT EXISTS idx_instagram_messages_organization_id
      ON instagram_messages(organization_id)
      WHERE organization_id IS NOT NULL;

    RAISE NOTICE 'instagram_messages table migrated successfully';
  ELSE
    RAISE NOTICE 'instagram_messages table does not exist - skipping';
  END IF;
END $$;

-- Check if customer_feature_flags table exists and add organization_id
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name = 'customer_feature_flags'
  ) THEN
    -- Add organization_id column
    ALTER TABLE customer_feature_flags
      ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

    -- Backfill from customer_configs (if customer_id references customer_configs)
    UPDATE customer_feature_flags cff
    SET organization_id = cc.organization_id
    FROM customer_configs cc
    WHERE cff.customer_id = cc.id
      AND cc.organization_id IS NOT NULL
      AND cff.organization_id IS NULL;

    -- Add index
    CREATE INDEX IF NOT EXISTS idx_customer_feature_flags_organization_id
      ON customer_feature_flags(organization_id)
      WHERE organization_id IS NOT NULL;

    RAISE NOTICE 'customer_feature_flags table migrated successfully';
  ELSE
    RAISE NOTICE 'customer_feature_flags table does not exist - skipping';
  END IF;
END $$;

-- =====================================================
-- COMPLETION MESSAGE
-- =====================================================

SELECT 'organization_id migration for Instagram integration complete!' as status;
