-- Migration: Add Multi-Seat Organization Support
-- Date: 2025-10-20
-- Description: Implements organization-based multi-user access to business data
-- Allows multiple users (seats) to access the same organization's scraped data

-- =====================================================
-- ORGANIZATION TABLES
-- =====================================================

-- Organizations table (represents a business/company)
CREATE TABLE IF NOT EXISTS organizations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  settings JSONB DEFAULT '{}'::jsonb,
  plan_type TEXT DEFAULT 'free',
  seat_limit INTEGER DEFAULT 5,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT organizations_name_length CHECK (char_length(name) >= 2 AND char_length(name) <= 100),
  CONSTRAINT organizations_slug_format CHECK (slug ~ '^[a-z0-9-]+$')
);

-- Organization members (links users to organizations with roles)
CREATE TABLE IF NOT EXISTS organization_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member',
  invited_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT unique_organization_user UNIQUE(organization_id, user_id),
  CONSTRAINT valid_role CHECK (role IN ('owner', 'admin', 'member', 'viewer'))
);

-- Organization invitations (pending invites)
CREATE TABLE IF NOT EXISTS organization_invitations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'member',
  token TEXT UNIQUE NOT NULL,
  invited_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  accepted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT valid_invitation_role CHECK (role IN ('admin', 'member', 'viewer')),
  CONSTRAINT unique_pending_invitation UNIQUE(organization_id, email)
);

-- =====================================================
-- UPDATE EXISTING TABLES FOR ORGANIZATION SUPPORT
-- =====================================================

-- Add organization_id to domains table
ALTER TABLE domains
  ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

-- Add organization_id to customer_configs table
ALTER TABLE customer_configs
  ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

-- Create index on organization_id for performance
CREATE INDEX IF NOT EXISTS idx_domains_organization ON domains(organization_id);
CREATE INDEX IF NOT EXISTS idx_customer_configs_organization ON customer_configs(organization_id);
CREATE INDEX IF NOT EXISTS idx_organization_members_user ON organization_members(user_id);
CREATE INDEX IF NOT EXISTS idx_organization_members_org ON organization_members(organization_id);
CREATE INDEX IF NOT EXISTS idx_organization_invitations_email ON organization_invitations(email);
CREATE INDEX IF NOT EXISTS idx_organization_invitations_token ON organization_invitations(token);

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Function to check if user is member of organization
CREATE OR REPLACE FUNCTION is_organization_member(p_organization_id UUID, p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM organization_members
    WHERE organization_id = p_organization_id
      AND user_id = p_user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user has specific role in organization
CREATE OR REPLACE FUNCTION has_organization_role(p_organization_id UUID, p_user_id UUID, p_required_role TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  user_role TEXT;
  role_hierarchy JSONB := '{"owner": 4, "admin": 3, "member": 2, "viewer": 1}'::jsonb;
BEGIN
  -- Get user's role
  SELECT role INTO user_role
  FROM organization_members
  WHERE organization_id = p_organization_id
    AND user_id = p_user_id;

  -- If user not found, return false
  IF user_role IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Check if user's role is >= required role
  RETURN (role_hierarchy->>user_role)::int >= (role_hierarchy->>p_required_role)::int;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's organizations
CREATE OR REPLACE FUNCTION get_user_organizations(p_user_id UUID)
RETURNS TABLE (
  organization_id UUID,
  organization_name TEXT,
  organization_slug TEXT,
  user_role TEXT,
  joined_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    o.id,
    o.name,
    o.slug,
    om.role,
    om.joined_at
  FROM organizations o
  JOIN organization_members om ON o.id = om.organization_id
  WHERE om.user_id = p_user_id
  ORDER BY om.joined_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- ROW LEVEL SECURITY POLICIES
-- =====================================================

-- Enable RLS on new tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_invitations ENABLE ROW LEVEL SECURITY;

-- Organizations: Users can view organizations they belong to
CREATE POLICY "Users can view their organizations" ON organizations
  FOR SELECT USING (
    id IN (
      SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
    )
  );

-- Organizations: Only owners can update
CREATE POLICY "Owners can update organization" ON organizations
  FOR UPDATE USING (
    has_organization_role(id, auth.uid(), 'owner')
  );

-- Organizations: Only owners can delete
CREATE POLICY "Owners can delete organization" ON organizations
  FOR DELETE USING (
    has_organization_role(id, auth.uid(), 'owner')
  );

-- Organization Members: Users can view members of their organizations
CREATE POLICY "Users can view members of their organizations" ON organization_members
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
    )
  );

-- Organization Members: Admins and owners can add members
CREATE POLICY "Admins can add organization members" ON organization_members
  FOR INSERT WITH CHECK (
    has_organization_role(organization_id, auth.uid(), 'admin')
  );

-- Organization Members: Admins and owners can update members
CREATE POLICY "Admins can update organization members" ON organization_members
  FOR UPDATE USING (
    has_organization_role(organization_id, auth.uid(), 'admin')
  );

-- Organization Members: Only owners can remove other owners
CREATE POLICY "Owners can remove members" ON organization_members
  FOR DELETE USING (
    has_organization_role(organization_id, auth.uid(), 'owner')
    OR (user_id = auth.uid()) -- Users can remove themselves
  );

-- Organization Invitations: Members can view pending invitations
CREATE POLICY "Members can view organization invitations" ON organization_invitations
  FOR SELECT USING (
    is_organization_member(organization_id, auth.uid())
  );

-- Organization Invitations: Admins can create invitations
CREATE POLICY "Admins can create invitations" ON organization_invitations
  FOR INSERT WITH CHECK (
    has_organization_role(organization_id, auth.uid(), 'admin')
  );

-- Organization Invitations: Admins can delete invitations
CREATE POLICY "Admins can delete invitations" ON organization_invitations
  FOR DELETE USING (
    has_organization_role(organization_id, auth.uid(), 'admin')
  );

-- Update domains RLS to use organization membership
DROP POLICY IF EXISTS "Users can view their own domains" ON domains;
DROP POLICY IF EXISTS "Users can insert their own domains" ON domains;
DROP POLICY IF EXISTS "Users can update their own domains" ON domains;
DROP POLICY IF EXISTS "Users can delete their own domains" ON domains;

CREATE POLICY "Organization members can view domains" ON domains
  FOR SELECT USING (
    user_id = auth.uid() -- Backward compatibility for domains without organization_id
    OR organization_id IN (
      SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Organization members can insert domains" ON domains
  FOR INSERT WITH CHECK (
    user_id = auth.uid() -- Backward compatibility
    OR (
      organization_id IS NOT NULL
      AND has_organization_role(organization_id, auth.uid(), 'member')
    )
  );

CREATE POLICY "Organization admins can update domains" ON domains
  FOR UPDATE USING (
    user_id = auth.uid() -- Backward compatibility
    OR (
      organization_id IS NOT NULL
      AND has_organization_role(organization_id, auth.uid(), 'admin')
    )
  );

CREATE POLICY "Organization admins can delete domains" ON domains
  FOR DELETE USING (
    user_id = auth.uid() -- Backward compatibility
    OR (
      organization_id IS NOT NULL
      AND has_organization_role(organization_id, auth.uid(), 'admin')
    )
  );

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Trigger to update updated_at on organizations
CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger to update updated_at on organization_members
CREATE TRIGGER update_organization_members_updated_at BEFORE UPDATE ON organization_members
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger to ensure at least one owner per organization
CREATE OR REPLACE FUNCTION ensure_organization_has_owner()
RETURNS TRIGGER AS $$
DECLARE
  owner_count INTEGER;
BEGIN
  -- If deleting or updating a member
  IF TG_OP = 'DELETE' OR (TG_OP = 'UPDATE' AND OLD.role = 'owner') THEN
    -- Count remaining owners
    SELECT COUNT(*) INTO owner_count
    FROM organization_members
    WHERE organization_id = OLD.organization_id
      AND role = 'owner'
      AND id != OLD.id;

    -- Prevent deletion/role change if this is the last owner
    IF owner_count = 0 THEN
      RAISE EXCEPTION 'Cannot remove the last owner from an organization';
    END IF;
  END IF;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER prevent_last_owner_removal
  BEFORE DELETE OR UPDATE ON organization_members
  FOR EACH ROW
  WHEN (OLD.role = 'owner')
  EXECUTE FUNCTION ensure_organization_has_owner();

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================

GRANT ALL ON organizations TO authenticated;
GRANT ALL ON organization_members TO authenticated;
GRANT ALL ON organization_invitations TO authenticated;

-- =====================================================
-- COMMENTS FOR DOCUMENTATION
-- =====================================================

COMMENT ON TABLE organizations IS 'Organizations (businesses/companies) that own domains and data';
COMMENT ON TABLE organization_members IS 'Users belonging to organizations with specific roles';
COMMENT ON TABLE organization_invitations IS 'Pending invitations to join organizations';
COMMENT ON COLUMN organization_members.role IS 'Role hierarchy: owner > admin > member > viewer';
COMMENT ON FUNCTION is_organization_member IS 'Check if a user is a member of an organization';
COMMENT ON FUNCTION has_organization_role IS 'Check if a user has at least the specified role in an organization';
COMMENT ON FUNCTION get_user_organizations IS 'Get all organizations a user belongs to';

SELECT 'Multi-seat organization support added successfully!' as status;
