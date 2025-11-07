-- Migration: Add Custom Conversion Funnels
-- Date: 2025-11-07
-- Description: Allows organizations to define custom funnel stages per domain

-- =====================================================
-- CUSTOM FUNNELS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS custom_funnels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  domain_id UUID REFERENCES domains(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  stages JSONB NOT NULL,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT custom_funnels_name_length CHECK (char_length(name) >= 2 AND char_length(name) <= 100),
  CONSTRAINT custom_funnels_stages_not_empty CHECK (jsonb_array_length(stages) > 0)
);

-- Indexes for performance
CREATE INDEX idx_custom_funnels_org ON custom_funnels(organization_id);
CREATE INDEX idx_custom_funnels_domain ON custom_funnels(domain_id);
CREATE INDEX idx_custom_funnels_default ON custom_funnels(organization_id, is_default) WHERE is_default = true;

-- Only one default funnel per organization
CREATE UNIQUE INDEX idx_custom_funnels_unique_default
  ON custom_funnels(organization_id)
  WHERE is_default = true AND domain_id IS NULL;

-- RLS Policies
ALTER TABLE custom_funnels ENABLE ROW LEVEL SECURITY;

-- Users can view funnels from their organization
CREATE POLICY "Users can view organization funnels"
  ON custom_funnels
  FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id
      FROM organization_members
      WHERE user_id = auth.uid()
    )
  );

-- Admins and owners can manage funnels
CREATE POLICY "Admins can manage funnels"
  ON custom_funnels
  FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id
      FROM organization_members
      WHERE user_id = auth.uid()
        AND role IN ('admin', 'owner')
    )
  );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_custom_funnels_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER custom_funnels_updated_at
  BEFORE UPDATE ON custom_funnels
  FOR EACH ROW
  EXECUTE FUNCTION update_custom_funnels_updated_at();

-- Example funnel stages JSONB structure:
-- [
--   { "id": "contact", "name": "Initial Contact", "order": 1 },
--   { "id": "qualify", "name": "Qualification", "order": 2 },
--   { "id": "demo", "name": "Product Demo", "order": 3 },
--   { "id": "proposal", "name": "Proposal", "order": 4 },
--   { "id": "close", "name": "Closed Won", "order": 5 }
-- ]

COMMENT ON TABLE custom_funnels IS 'Custom conversion funnel definitions per organization/domain';
COMMENT ON COLUMN custom_funnels.stages IS 'Array of stage objects with id, name, and order';
COMMENT ON COLUMN custom_funnels.is_default IS 'Default funnel for organization (when domain_id is NULL)';
