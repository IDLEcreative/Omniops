-- Migration: Add Alert Thresholds System
-- Date: 2025-11-07
-- Description: Threshold-based alerting for analytics metrics

-- =====================================================
-- ALERT THRESHOLDS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS alert_thresholds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  metric TEXT NOT NULL,
  condition TEXT NOT NULL CHECK (condition IN ('above', 'below')),
  threshold NUMERIC NOT NULL,
  enabled BOOLEAN DEFAULT true,
  notification_channels JSONB DEFAULT '["email"]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT alert_thresholds_metric_not_empty CHECK (char_length(metric) > 0),
  CONSTRAINT alert_thresholds_threshold_positive CHECK (threshold >= 0)
);

-- =====================================================
-- ALERT HISTORY TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS alert_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  threshold_id UUID REFERENCES alert_thresholds(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  metric TEXT NOT NULL,
  value NUMERIC NOT NULL,
  threshold NUMERIC NOT NULL,
  condition TEXT NOT NULL,
  triggered_at TIMESTAMPTZ DEFAULT NOW(),
  acknowledged_at TIMESTAMPTZ,
  acknowledged_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  notification_sent BOOLEAN DEFAULT false,
  notification_error TEXT,
  CONSTRAINT alert_history_metric_not_empty CHECK (char_length(metric) > 0)
);

-- Indexes for performance
CREATE INDEX idx_alert_thresholds_org ON alert_thresholds(organization_id);
CREATE INDEX idx_alert_thresholds_enabled ON alert_thresholds(organization_id, enabled) WHERE enabled = true;
CREATE INDEX idx_alert_thresholds_metric ON alert_thresholds(metric);

CREATE INDEX idx_alert_history_org ON alert_history(organization_id);
CREATE INDEX idx_alert_history_triggered ON alert_history(triggered_at DESC);
CREATE INDEX idx_alert_history_unacknowledged ON alert_history(organization_id, acknowledged_at)
  WHERE acknowledged_at IS NULL;

-- RLS Policies for alert_thresholds
ALTER TABLE alert_thresholds ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view organization alert thresholds"
  ON alert_thresholds
  FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id
      FROM organization_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage alert thresholds"
  ON alert_thresholds
  FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id
      FROM organization_members
      WHERE user_id = auth.uid()
        AND role IN ('admin', 'owner')
    )
  );

-- RLS Policies for alert_history
ALTER TABLE alert_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view organization alert history"
  ON alert_history
  FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id
      FROM organization_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can acknowledge alerts"
  ON alert_history
  FOR UPDATE
  USING (
    organization_id IN (
      SELECT organization_id
      FROM organization_members
      WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    acknowledged_by = auth.uid()
  );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_alert_thresholds_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER alert_thresholds_updated_at
  BEFORE UPDATE ON alert_thresholds
  FOR EACH ROW
  EXECUTE FUNCTION update_alert_thresholds_updated_at();

-- Example metrics that can be monitored:
-- - response_time: Average chat response time in seconds
-- - error_rate: Percentage of errors (0-100)
-- - sentiment_score: Average sentiment score (0-5)
-- - conversion_rate: Conversion percentage (0-100)
-- - resolution_rate: Resolution percentage (0-100)
-- - message_volume: Number of messages per hour/day

COMMENT ON TABLE alert_thresholds IS 'Configurable alert thresholds for analytics metrics';
COMMENT ON TABLE alert_history IS 'Historical record of triggered alerts';
COMMENT ON COLUMN alert_thresholds.notification_channels IS 'Array of notification methods: email, webhook, slack';
COMMENT ON COLUMN alert_history.acknowledged_at IS 'When the alert was acknowledged by a user';
