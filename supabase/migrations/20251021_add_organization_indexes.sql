-- Migration: Add Performance Indexes for Organizations
-- Date: 2025-10-21
-- Description: Adds indexes to improve query performance for organization-related operations

-- =====================================================
-- PERFORMANCE INDEXES
-- =====================================================

-- Index for fast user-to-organization lookups
-- This significantly speeds up queries like "What organizations is this user part of?"
CREATE INDEX IF NOT EXISTS idx_organization_members_user_id
ON organization_members(user_id);

-- Composite index for checking user's role in specific organization
-- Optimizes permission checks that happen on every API request
CREATE INDEX IF NOT EXISTS idx_organization_members_user_org_role
ON organization_members(user_id, organization_id, role);

-- Index for counting members per organization
-- Speeds up seat usage calculations
CREATE INDEX IF NOT EXISTS idx_organization_members_org_id_role
ON organization_members(organization_id, role);

-- Index for finding pending invitations by email
-- Improves invitation duplicate checking
CREATE INDEX IF NOT EXISTS idx_organization_invitations_email
ON organization_invitations(email)
WHERE accepted_at IS NULL;

-- Index for finding active invitations per organization
-- Speeds up seat usage calculations for pending invites
CREATE INDEX IF NOT EXISTS idx_organization_invitations_org_active
ON organization_invitations(organization_id, expires_at)
WHERE accepted_at IS NULL;

-- Index for invitation token lookups
-- Critical for fast invitation acceptance flow
CREATE UNIQUE INDEX IF NOT EXISTS idx_organization_invitations_token
ON organization_invitations(token);

-- Index for organization slug lookups
-- Already exists from main migration, but ensure it's there
CREATE UNIQUE INDEX IF NOT EXISTS idx_organizations_slug
ON organizations(slug);

-- Index for domains table organization lookups
-- Speeds up domain-to-organization resolution
CREATE INDEX IF NOT EXISTS idx_domains_organization_id
ON domains(organization_id)
WHERE organization_id IS NOT NULL;

-- Index for customer_configs organization lookups
-- Improves configuration fetching for organizations
CREATE INDEX IF NOT EXISTS idx_customer_configs_organization_id
ON customer_configs(organization_id)
WHERE organization_id IS NOT NULL;

-- =====================================================
-- QUERY PERFORMANCE VIEWS (Optional but helpful)
-- =====================================================

-- Create a materialized view for quick seat usage lookup
-- This can be refreshed periodically for even better performance
CREATE MATERIALIZED VIEW IF NOT EXISTS organization_seat_usage AS
SELECT
  o.id AS organization_id,
  o.name AS organization_name,
  o.plan_type,
  o.seat_limit,
  COUNT(DISTINCT om.user_id) AS active_members,
  COUNT(DISTINCT oi.email) FILTER (
    WHERE oi.accepted_at IS NULL
    AND oi.expires_at > NOW()
  ) AS pending_invitations,
  o.seat_limit - COUNT(DISTINCT om.user_id) - COUNT(DISTINCT oi.email) FILTER (
    WHERE oi.accepted_at IS NULL
    AND oi.expires_at > NOW()
  ) AS available_seats
FROM organizations o
LEFT JOIN organization_members om ON om.organization_id = o.id
LEFT JOIN organization_invitations oi ON oi.organization_id = o.id
GROUP BY o.id, o.name, o.plan_type, o.seat_limit;

-- Create index on the materialized view
CREATE UNIQUE INDEX IF NOT EXISTS idx_organization_seat_usage_org_id
ON organization_seat_usage(organization_id);

-- =====================================================
-- HELPER FUNCTION FOR SEAT CHECKING (With better performance)
-- =====================================================

-- Optimized function to check if organization has available seats
CREATE OR REPLACE FUNCTION check_organization_seat_availability(
  org_id UUID,
  additional_seats INTEGER DEFAULT 1
) RETURNS BOOLEAN AS $$
DECLARE
  v_seat_limit INTEGER;
  v_used_seats INTEGER;
BEGIN
  -- Get organization seat limit
  SELECT seat_limit INTO v_seat_limit
  FROM organizations
  WHERE id = org_id;

  -- If no limit found or unlimited (-1), return true
  IF v_seat_limit IS NULL OR v_seat_limit = -1 THEN
    RETURN TRUE;
  END IF;

  -- Count used seats (members + pending invitations)
  SELECT
    COUNT(DISTINCT om.user_id) +
    COUNT(DISTINCT oi.email) FILTER (
      WHERE oi.accepted_at IS NULL
      AND oi.expires_at > NOW()
    )
  INTO v_used_seats
  FROM organizations o
  LEFT JOIN organization_members om ON om.organization_id = o.id
  LEFT JOIN organization_invitations oi ON oi.organization_id = o.id
  WHERE o.id = org_id;

  -- Check if adding additional seats would exceed limit
  RETURN (v_used_seats + additional_seats) <= v_seat_limit;
END;
$$ LANGUAGE plpgsql STABLE;

-- =====================================================
-- AUTOMATED CLEANUP OF EXPIRED INVITATIONS
-- =====================================================

-- Function to clean up expired invitations
CREATE OR REPLACE FUNCTION cleanup_expired_invitations() RETURNS void AS $$
BEGIN
  DELETE FROM organization_invitations
  WHERE expires_at < NOW() AND accepted_at IS NULL;
END;
$$ LANGUAGE plpgsql;

-- Optional: Create a periodic job to clean up expired invitations
-- (Requires pg_cron extension or external scheduler)
-- SELECT cron.schedule('cleanup-expired-invitations', '0 2 * * *', 'SELECT cleanup_expired_invitations();');

-- =====================================================
-- PERFORMANCE MONITORING
-- =====================================================

-- Add comment to help identify slow queries in logs
COMMENT ON INDEX idx_organization_members_user_id IS 'Speeds up user organization lookups';
COMMENT ON INDEX idx_organization_members_user_org_role IS 'Optimizes permission checking';
COMMENT ON INDEX idx_organization_invitations_email IS 'Improves duplicate invitation checking';
COMMENT ON INDEX idx_organization_invitations_org_active IS 'Speeds up seat usage calculations';

-- Grant necessary permissions
GRANT SELECT ON organization_seat_usage TO authenticated;
GRANT EXECUTE ON FUNCTION check_organization_seat_availability TO authenticated;