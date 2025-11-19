-- Migration: Add missing user_id column to domains table
-- Date: 2025-11-19
-- Issue: Schema drift - column exists in schema files but missing in production

-- Add user_id column (should have been created in initial schema)
ALTER TABLE domains
ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- Create index for efficient user domain queries
CREATE INDEX IF NOT EXISTS idx_domains_user_id ON domains(user_id);

-- Add helpful comment
COMMENT ON COLUMN domains.user_id IS 'Individual user who owns this domain (alternative to organization ownership)';

-- Verify column was added
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'domains'
    AND column_name = 'user_id'
  ) THEN
    RAISE NOTICE 'SUCCESS: user_id column added to domains table';
  ELSE
    RAISE EXCEPTION 'FAILED: user_id column not found after migration';
  END IF;
END $$;
