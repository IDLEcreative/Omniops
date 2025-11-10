-- Migration: Add RLS policies for widget_config_versions table
-- Created: 2025-01-08
-- Purpose: Protect widget configuration version history with multi-tenant isolation

-- Enable RLS on widget_config_versions table
ALTER TABLE widget_config_versions ENABLE ROW LEVEL SECURITY;

-- Service role has full access (bypasses RLS for admin operations)
CREATE POLICY "Service role has full access to widget_config_versions"
ON widget_config_versions
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Organization members can access widget config versions for their customer configs
-- This follows the same pattern as customer_configs table
CREATE POLICY "Organization members can access widget config versions"
ON widget_config_versions
FOR ALL
TO public
USING (
  customer_config_id IN (
    SELECT id
    FROM customer_configs
    WHERE is_organization_member(organization_id, auth.uid())
  )
);
