-- Migration: Add RLS policies for domain_mappings table
-- Created: 2025-01-08
-- Purpose: Protect staging-to-production domain mappings with multi-tenant isolation

-- Enable RLS on domain_mappings table
ALTER TABLE domain_mappings ENABLE ROW LEVEL SECURITY;

-- Service role has full access (bypasses RLS for admin operations)
CREATE POLICY "Service role has full access to domain_mappings"
ON domain_mappings
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Organization members can access domain mappings for their domains
-- User must be a member of the organization that owns either the staging or production domain
CREATE POLICY "Organization members can access domain mappings"
ON domain_mappings
FOR ALL
TO public
USING (
  staging_domain_id IN (
    SELECT id
    FROM domains
    WHERE organization_id IN (
      SELECT organization_id
      FROM organization_members
      WHERE user_id = auth.uid()
    )
  )
  OR
  production_domain_id IN (
    SELECT id
    FROM domains
    WHERE organization_id IN (
      SELECT organization_id
      FROM organization_members
      WHERE user_id = auth.uid()
    )
  )
);
