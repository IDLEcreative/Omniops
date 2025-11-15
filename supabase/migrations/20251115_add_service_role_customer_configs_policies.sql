-- Add service role policies for customer_configs to enable E2E testing
-- Date: 2025-11-15
-- Description: Service role should bypass RLS but explicit policies make this clearer

-- Drop existing policies first to avoid conflicts
DROP POLICY IF EXISTS "service_role_all_customer_configs" ON customer_configs;
DROP POLICY IF EXISTS "service_role_insert_customer_configs" ON customer_configs;
DROP POLICY IF EXISTS "service_role_select_customer_configs" ON customer_configs;
DROP POLICY IF EXISTS "service_role_update_customer_configs" ON customer_configs;
DROP POLICY IF EXISTS "service_role_delete_customer_configs" ON customer_configs;

-- Service role can SELECT all customer_configs
CREATE POLICY "service_role_select_customer_configs" ON customer_configs
  FOR SELECT
  TO public
  USING (
    (SELECT (auth.jwt() ->> 'role'::text) = 'service_role'::text)
    OR is_organization_member(organization_id, auth.uid())
  );

-- Service role can INSERT customer_configs
CREATE POLICY "service_role_insert_customer_configs" ON customer_configs
  FOR INSERT
  TO public
  WITH CHECK (
    (SELECT (auth.jwt() ->> 'role'::text) = 'service_role'::text)
  );

-- Service role can UPDATE all customer_configs
CREATE POLICY "service_role_update_customer_configs" ON customer_configs
  FOR UPDATE
  TO public
  USING (
    (SELECT (auth.jwt() ->> 'role'::text) = 'service_role'::text)
  )
  WITH CHECK (
    (SELECT (auth.jwt() ->> 'role'::text) = 'service_role'::text)
  );

-- Service role can DELETE all customer_configs
CREATE POLICY "service_role_delete_customer_configs" ON customer_configs
  FOR DELETE
  TO public
  USING (
    (SELECT (auth.jwt() ->> 'role'::text) = 'service_role'::text)
  );

COMMENT ON POLICY "service_role_select_customer_configs" ON customer_configs IS
'Allow service role to SELECT all configs, regular users can only see their org configs';

COMMENT ON POLICY "service_role_insert_customer_configs" ON customer_configs IS
'Allow service role to INSERT configs for E2E testing and system operations';

COMMENT ON POLICY "service_role_update_customer_configs" ON customer_configs IS
'Allow service role to UPDATE all configs for system maintenance';

COMMENT ON POLICY "service_role_delete_customer_configs" ON customer_configs IS
'Allow service role to DELETE all configs for cleanup operations';
