-- Migration: Chart Annotations System
-- Purpose: Add business context to analytics charts via annotations
-- Created: 2025-11-17

-- Create chart_annotations table
CREATE TABLE IF NOT EXISTS chart_annotations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL,
  annotation_date DATE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'other',
  color TEXT NOT NULL DEFAULT '#3b82f6',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraints
  CONSTRAINT valid_category CHECK (category IN ('campaign', 'incident', 'release', 'event', 'other')),
  CONSTRAINT valid_title_length CHECK (LENGTH(title) > 0 AND LENGTH(title) <= 200),
  CONSTRAINT valid_description_length CHECK (description IS NULL OR LENGTH(description) <= 1000)
);

-- Create indexes for performance
CREATE INDEX idx_annotations_org_date ON chart_annotations(organization_id, annotation_date);
CREATE INDEX idx_annotations_org_created ON chart_annotations(organization_id, created_at DESC);
CREATE INDEX idx_annotations_category ON chart_annotations(category);

-- Add RLS policies
ALTER TABLE chart_annotations ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view annotations for their organization
CREATE POLICY "Users can view own organization annotations"
  ON chart_annotations
  FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id
      FROM organization_members
      WHERE user_id = auth.uid()
    )
  );

-- Policy: Users can create annotations for their organization
CREATE POLICY "Users can create own organization annotations"
  ON chart_annotations
  FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id
      FROM organization_members
      WHERE user_id = auth.uid()
    )
  );

-- Policy: Users can update annotations for their organization
CREATE POLICY "Users can update own organization annotations"
  ON chart_annotations
  FOR UPDATE
  USING (
    organization_id IN (
      SELECT organization_id
      FROM organization_members
      WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    organization_id IN (
      SELECT organization_id
      FROM organization_members
      WHERE user_id = auth.uid()
    )
  );

-- Policy: Users can delete annotations for their organization
CREATE POLICY "Users can delete own organization annotations"
  ON chart_annotations
  FOR DELETE
  USING (
    organization_id IN (
      SELECT organization_id
      FROM organization_members
      WHERE user_id = auth.uid()
    )
  );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_chart_annotation_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER update_chart_annotation_timestamp
  BEFORE UPDATE ON chart_annotations
  FOR EACH ROW
  EXECUTE FUNCTION update_chart_annotation_timestamp();

-- Add comments for documentation
COMMENT ON TABLE chart_annotations IS 'Business context annotations for analytics charts';
COMMENT ON COLUMN chart_annotations.annotation_date IS 'Date the annotation applies to on charts';
COMMENT ON COLUMN chart_annotations.category IS 'Type of annotation: campaign, incident, release, event, or other';
COMMENT ON COLUMN chart_annotations.color IS 'Hex color code for visual marker';
COMMENT ON COLUMN chart_annotations.created_by IS 'User who created the annotation';
