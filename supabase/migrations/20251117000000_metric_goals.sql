-- Metric Goals System
-- Purpose: Store and track progress towards metric goals for organizations
-- Version: 1.0.0
-- Created: 2025-11-17

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create metric_goals table
CREATE TABLE IF NOT EXISTS metric_goals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  metric_name TEXT NOT NULL,
  target_value DECIMAL NOT NULL CHECK (target_value > 0),
  period TEXT NOT NULL CHECK (period IN ('daily', 'weekly', 'monthly')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  UNIQUE(organization_id, metric_name, period)
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_metric_goals_organization_id ON metric_goals(organization_id);
CREATE INDEX IF NOT EXISTS idx_metric_goals_metric_name ON metric_goals(metric_name);
CREATE INDEX IF NOT EXISTS idx_metric_goals_period ON metric_goals(period);

-- Add comment
COMMENT ON TABLE metric_goals IS 'Stores metric goals and targets for organizations';
COMMENT ON COLUMN metric_goals.metric_name IS 'Name of the metric (e.g., conversion_rate, daily_active_users)';
COMMENT ON COLUMN metric_goals.target_value IS 'Target value for the metric';
COMMENT ON COLUMN metric_goals.period IS 'Time period for the goal (daily, weekly, monthly)';

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_metric_goals_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS metric_goals_updated_at_trigger ON metric_goals;
CREATE TRIGGER metric_goals_updated_at_trigger
  BEFORE UPDATE ON metric_goals
  FOR EACH ROW
  EXECUTE FUNCTION update_metric_goals_updated_at();

-- Enable Row Level Security
ALTER TABLE metric_goals ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only view goals for their organization
CREATE POLICY "Users can view their organization's goals"
  ON metric_goals
  FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id
      FROM organization_members
      WHERE user_id = auth.uid()
    )
  );

-- RLS Policy: Users can insert goals for their organization
CREATE POLICY "Users can create goals for their organization"
  ON metric_goals
  FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id
      FROM organization_members
      WHERE user_id = auth.uid()
    )
  );

-- RLS Policy: Users can update goals for their organization
CREATE POLICY "Users can update their organization's goals"
  ON metric_goals
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

-- RLS Policy: Users can delete goals for their organization
CREATE POLICY "Users can delete their organization's goals"
  ON metric_goals
  FOR DELETE
  USING (
    organization_id IN (
      SELECT organization_id
      FROM organization_members
      WHERE user_id = auth.uid()
    )
  );

-- Grant permissions to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON metric_goals TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
