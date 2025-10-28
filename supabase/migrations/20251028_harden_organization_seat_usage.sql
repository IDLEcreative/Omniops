-- Migration: Harden organization_seat_usage Materialized View Security
-- Date: 2025-10-28
-- Description: Creates secure wrapper function and revokes direct access to materialized view
-- Related: SECURITY_ADVISORIES_RESOLUTION.md - Materialized View Access Control

-- =============================================================================
-- PART 1: Create Secure Wrapper Function
-- =============================================================================

-- Secure wrapper function to access organization_seat_usage data
-- Enforces organization membership checks before returning data
CREATE OR REPLACE FUNCTION get_organization_seat_usage(org_id UUID DEFAULT NULL)
RETURNS TABLE (
  organization_id UUID,
  organization_name TEXT,
  plan_type TEXT,
  seat_limit INTEGER,
  active_members BIGINT,
  pending_invitations BIGINT,
  available_seats BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- If org_id is NULL, return all organizations the user is a member of
  IF org_id IS NULL THEN
    RETURN QUERY
    SELECT
      osu.organization_id,
      osu.organization_name,
      osu.plan_type,
      osu.seat_limit,
      osu.active_members,
      osu.pending_invitations,
      osu.available_seats
    FROM public.organization_seat_usage osu
    WHERE osu.organization_id IN (
      SELECT organization_id
      FROM public.organization_members
      WHERE user_id = auth.uid()
    )
    ORDER BY osu.organization_name;
  ELSE
    -- Verify user is a member of the requested organization
    IF NOT EXISTS (
      SELECT 1
      FROM public.organization_members
      WHERE organization_id = org_id
      AND user_id = auth.uid()
    ) THEN
      RAISE EXCEPTION 'Access denied: You are not a member of this organization';
    END IF;

    -- Return the specific organization's data
    RETURN QUERY
    SELECT
      osu.organization_id,
      osu.organization_name,
      osu.plan_type,
      osu.seat_limit,
      osu.active_members,
      osu.pending_invitations,
      osu.available_seats
    FROM public.organization_seat_usage osu
    WHERE osu.organization_id = org_id;
  END IF;
END;
$$;

-- Add helpful comment
COMMENT ON FUNCTION get_organization_seat_usage IS
'Secure wrapper for organization_seat_usage materialized view.
Enforces organization membership checks.
Pass NULL to get all organizations you belong to, or a UUID to get a specific organization.
SECURITY DEFINER with search_path protection against SQL injection.';

-- =============================================================================
-- PART 2: Revoke Direct Access to Materialized View
-- =============================================================================

-- Revoke all direct access to the materialized view from regular users
REVOKE ALL ON public.organization_seat_usage FROM anon;
REVOKE ALL ON public.organization_seat_usage FROM authenticated;

-- Service role still needs access for background jobs and refreshes
-- (This is implicit, but we'll verify it's set correctly)
GRANT SELECT ON public.organization_seat_usage TO service_role;

-- Add security comment to the view
COMMENT ON MATERIALIZED VIEW public.organization_seat_usage IS
'Materialized view of organization seat usage statistics.
SECURITY: Direct access is REVOKED. Use get_organization_seat_usage() function instead.
Service role has SELECT for background jobs and REFRESH MATERIALIZED VIEW operations.';

-- =============================================================================
-- PART 3: Grant Access to Secure Wrapper Function
-- =============================================================================

-- Grant EXECUTE permission on the wrapper function to authenticated users
GRANT EXECUTE ON FUNCTION public.get_organization_seat_usage(UUID) TO authenticated;

-- Revoke from anon (anonymous users don't have organizations)
REVOKE EXECUTE ON FUNCTION public.get_organization_seat_usage(UUID) FROM anon;

-- =============================================================================
-- PART 4: Verification
-- =============================================================================

-- Verify the security model is correct
DO $$
DECLARE
  view_anon_privs TEXT;
  view_auth_privs TEXT;
  func_auth_privs TEXT;
BEGIN
  -- Check materialized view permissions for anon
  SELECT privilege_type INTO view_anon_privs
  FROM information_schema.role_table_grants
  WHERE table_schema = 'public'
  AND table_name = 'organization_seat_usage'
  AND grantee = 'anon'
  LIMIT 1;

  -- Check materialized view permissions for authenticated
  SELECT privilege_type INTO view_auth_privs
  FROM information_schema.role_table_grants
  WHERE table_schema = 'public'
  AND table_name = 'organization_seat_usage'
  AND grantee = 'authenticated'
  LIMIT 1;

  -- Check function permissions for authenticated
  SELECT privilege_type INTO func_auth_privs
  FROM information_schema.routine_privileges
  WHERE routine_schema = 'public'
  AND routine_name = 'get_organization_seat_usage'
  AND grantee = 'authenticated'
  LIMIT 1;

  RAISE NOTICE '=================================================================';
  RAISE NOTICE 'Organization Seat Usage Security Hardening Complete';
  RAISE NOTICE '=================================================================';
  RAISE NOTICE 'Materialized View Direct Access:';
  RAISE NOTICE '  - anon role: %', COALESCE(view_anon_privs, 'NONE (✓ Correct)');
  RAISE NOTICE '  - authenticated role: %', COALESCE(view_auth_privs, 'NONE (✓ Correct)');
  RAISE NOTICE '';
  RAISE NOTICE 'Secure Wrapper Function Access:';
  RAISE NOTICE '  - authenticated role: %', COALESCE(func_auth_privs, 'NONE (✗ ERROR)');
  RAISE NOTICE '';
  RAISE NOTICE 'Usage Examples:';
  RAISE NOTICE '  -- Get all organizations you belong to';
  RAISE NOTICE '  SELECT * FROM get_organization_seat_usage(NULL);';
  RAISE NOTICE '';
  RAISE NOTICE '  -- Get specific organization (access verified)';
  RAISE NOTICE '  SELECT * FROM get_organization_seat_usage(''org-uuid-here'');';
  RAISE NOTICE '=================================================================';
END $$;

-- =============================================================================
-- PART 5: Future Maintenance Notes
-- =============================================================================

-- To refresh the materialized view (requires service_role or superuser):
-- REFRESH MATERIALIZED VIEW CONCURRENTLY public.organization_seat_usage;

-- To check current seat usage for an organization:
-- SELECT * FROM get_organization_seat_usage('your-org-id');

-- To audit who can access what:
-- SELECT * FROM information_schema.role_table_grants
-- WHERE table_name = 'organization_seat_usage';
--
-- SELECT * FROM information_schema.routine_privileges
-- WHERE routine_name = 'get_organization_seat_usage';
