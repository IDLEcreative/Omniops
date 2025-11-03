-- Feature Flags Infrastructure
-- Purpose: Tables for managing feature flags and rollout configurations
-- Created: 2025-11-03

-- Customer feature flags table
CREATE TABLE IF NOT EXISTS customer_feature_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customer_configs(id) ON DELETE CASCADE,
  flags JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(customer_id)
);

-- Organization feature flags table
CREATE TABLE IF NOT EXISTS organization_feature_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  flags JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(organization_id)
);

-- Feature rollouts table (for gradual rollout management)
CREATE TABLE IF NOT EXISTS feature_rollouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feature_name TEXT NOT NULL UNIQUE,
  current_tier TEXT NOT NULL DEFAULT 'tier_0_disabled',
  target_tier TEXT NOT NULL DEFAULT 'tier_4_full',
  percentage INTEGER NOT NULL DEFAULT 0 CHECK (percentage >= 0 AND percentage <= 100),
  status TEXT NOT NULL DEFAULT 'planned',
  whitelisted_customers TEXT[] DEFAULT '{}',
  blacklisted_customers TEXT[] DEFAULT '{}',
  rollback_threshold JSONB DEFAULT '{"errorRate": 0.05, "timeWindow": 3600000}',
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Rollout events table (for tracking and analytics)
CREATE TABLE IF NOT EXISTS rollout_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feature_name TEXT NOT NULL,
  customer_id UUID,
  event TEXT NOT NULL CHECK (event IN ('enabled', 'disabled', 'error', 'rollback')),
  event_type TEXT,
  reason TEXT,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
  metadata JSONB DEFAULT '{}'
);

-- Feature flag changes table (audit trail)
CREATE TABLE IF NOT EXISTS feature_flag_changes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID,
  organization_id UUID,
  flag_path TEXT NOT NULL,
  old_value BOOLEAN,
  new_value BOOLEAN,
  changed_by UUID,
  changed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  reason TEXT
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_customer_feature_flags_customer_id
  ON customer_feature_flags(customer_id);

CREATE INDEX IF NOT EXISTS idx_organization_feature_flags_org_id
  ON organization_feature_flags(organization_id);

CREATE INDEX IF NOT EXISTS idx_feature_rollouts_feature_name
  ON feature_rollouts(feature_name);

CREATE INDEX IF NOT EXISTS idx_feature_rollouts_status
  ON feature_rollouts(status);

CREATE INDEX IF NOT EXISTS idx_rollout_events_feature_name
  ON rollout_events(feature_name);

CREATE INDEX IF NOT EXISTS idx_rollout_events_customer_id
  ON rollout_events(customer_id);

CREATE INDEX IF NOT EXISTS idx_rollout_events_timestamp
  ON rollout_events(timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_feature_flag_changes_customer_id
  ON feature_flag_changes(customer_id);

CREATE INDEX IF NOT EXISTS idx_feature_flag_changes_organization_id
  ON feature_flag_changes(organization_id);

CREATE INDEX IF NOT EXISTS idx_feature_flag_changes_changed_at
  ON feature_flag_changes(changed_at DESC);

-- Row Level Security (RLS) policies

-- Enable RLS
ALTER TABLE customer_feature_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_feature_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE feature_rollouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE rollout_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE feature_flag_changes ENABLE ROW LEVEL SECURITY;

-- Service role has full access
CREATE POLICY "Service role has full access to customer_feature_flags"
  ON customer_feature_flags FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role')
  WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role has full access to organization_feature_flags"
  ON organization_feature_flags FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role')
  WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role has full access to feature_rollouts"
  ON feature_rollouts FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role')
  WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role has full access to rollout_events"
  ON rollout_events FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role')
  WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role has full access to feature_flag_changes"
  ON feature_flag_changes FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role')
  WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- Authenticated users can read their own organization's feature flags
CREATE POLICY "Users can read their organization feature flags"
  ON organization_feature_flags FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id
      FROM user_organizations
      WHERE user_id = auth.uid()
    )
  );

-- Admin users can manage feature flags for their organization
CREATE POLICY "Admins can manage organization feature flags"
  ON organization_feature_flags FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id
      FROM user_organizations
      WHERE user_id = auth.uid()
        AND role IN ('owner', 'admin')
    )
  )
  WITH CHECK (
    organization_id IN (
      SELECT organization_id
      FROM user_organizations
      WHERE user_id = auth.uid()
        AND role IN ('owner', 'admin')
    )
  );

-- Comments for documentation
COMMENT ON TABLE customer_feature_flags IS
  'Customer-specific feature flag overrides';

COMMENT ON TABLE organization_feature_flags IS
  'Organization-wide feature flag overrides';

COMMENT ON TABLE feature_rollouts IS
  'Configuration for gradual feature rollouts with percentage-based targeting';

COMMENT ON TABLE rollout_events IS
  'Tracking events for feature rollouts (enables, disables, errors)';

COMMENT ON TABLE feature_flag_changes IS
  'Audit trail for all feature flag changes';

COMMENT ON COLUMN feature_rollouts.current_tier IS
  'Current rollout tier: tier_0_disabled, tier_1_internal, tier_2_early_adopters, tier_3_general, tier_4_full';

COMMENT ON COLUMN feature_rollouts.percentage IS
  'Percentage of customers with feature enabled (0-100)';

COMMENT ON COLUMN feature_rollouts.rollback_threshold IS
  'Automatic rollback triggers: {"errorRate": 0.05, "timeWindow": 3600000}';

COMMENT ON COLUMN feature_rollouts.whitelisted_customers IS
  'Customer IDs always included in rollout regardless of percentage';

COMMENT ON COLUMN feature_rollouts.blacklisted_customers IS
  'Customer IDs always excluded from rollout';
