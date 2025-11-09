-- Funnel Alerts Configuration
-- Automated alerts for conversion rate drops and high-value cart abandonment

-- Alert rules table
CREATE TABLE IF NOT EXISTS funnel_alert_rules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  domain TEXT NOT NULL,

  -- Alert configuration
  alert_type TEXT NOT NULL CHECK (alert_type IN ('conversion_drop', 'high_value_cart', 'funnel_stage_drop')),
  is_enabled BOOLEAN NOT NULL DEFAULT true,

  -- Thresholds
  threshold_value DECIMAL(10,2), -- For conversion rates (percentage) or cart value (currency)
  comparison_operator TEXT CHECK (comparison_operator IN ('less_than', 'greater_than', 'equals')),
  time_window_hours INTEGER DEFAULT 24, -- Time window for metric calculation

  -- Notification settings
  notification_email TEXT,
  notification_webhook TEXT,
  notify_immediately BOOLEAN DEFAULT true,
  max_alerts_per_day INTEGER DEFAULT 10, -- Prevent alert spam

  -- Alert-specific config (JSON)
  config JSONB DEFAULT '{}'::jsonb,

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Alert history table
CREATE TABLE IF NOT EXISTS funnel_alert_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  alert_rule_id UUID NOT NULL REFERENCES funnel_alert_rules(id) ON DELETE CASCADE,
  domain TEXT NOT NULL,

  -- Alert details
  alert_type TEXT NOT NULL,
  triggered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metric_value DECIMAL(10,2), -- Actual metric value that triggered alert
  threshold_value DECIMAL(10,2), -- Threshold that was breached

  -- Alert content
  alert_title TEXT NOT NULL,
  alert_message TEXT NOT NULL,
  alert_data JSONB DEFAULT '{}'::jsonb, -- Additional context (affected customers, cart IDs, etc.)

  -- Delivery status
  notification_sent BOOLEAN DEFAULT false,
  notification_sent_at TIMESTAMPTZ,
  notification_error TEXT,

  -- Resolution
  resolved BOOLEAN DEFAULT false,
  resolved_at TIMESTAMPTZ,
  resolved_by TEXT,
  resolution_notes TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_funnel_alert_rules_domain ON funnel_alert_rules(domain);
CREATE INDEX idx_funnel_alert_rules_enabled ON funnel_alert_rules(is_enabled);
CREATE INDEX idx_funnel_alert_history_domain ON funnel_alert_history(domain);
CREATE INDEX idx_funnel_alert_history_triggered ON funnel_alert_history(triggered_at);
CREATE INDEX idx_funnel_alert_history_resolved ON funnel_alert_history(resolved);
CREATE INDEX idx_funnel_alert_history_rule_id ON funnel_alert_history(alert_rule_id);

-- Row Level Security
ALTER TABLE funnel_alert_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE funnel_alert_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies for funnel_alert_rules
CREATE POLICY "Users can view their domain's alert rules"
  ON funnel_alert_rules
  FOR SELECT
  USING (
    domain IN (
      SELECT cc.domain
      FROM customer_configs cc
      JOIN organization_members om ON om.organization_id = cc.organization_id
      WHERE om.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage their domain's alert rules"
  ON funnel_alert_rules
  FOR ALL
  USING (
    domain IN (
      SELECT cc.domain
      FROM customer_configs cc
      JOIN organization_members om ON om.organization_id = cc.organization_id
      WHERE om.user_id = auth.uid()
      AND om.role IN ('owner', 'admin')
    )
  );

-- RLS Policies for funnel_alert_history
CREATE POLICY "Users can view their domain's alert history"
  ON funnel_alert_history
  FOR SELECT
  USING (
    domain IN (
      SELECT cc.domain
      FROM customer_configs cc
      JOIN organization_members om ON om.organization_id = cc.organization_id
      WHERE om.user_id = auth.uid()
    )
  );

CREATE POLICY "Service role can insert alerts"
  ON funnel_alert_history
  FOR INSERT
  WITH CHECK (true);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_funnel_alert_rules_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
CREATE TRIGGER update_funnel_alert_rules_timestamp
  BEFORE UPDATE ON funnel_alert_rules
  FOR EACH ROW
  EXECUTE FUNCTION update_funnel_alert_rules_updated_at();

-- Create default alert rules for new domains (optional)
-- This can be called when a new domain is added
CREATE OR REPLACE FUNCTION create_default_funnel_alerts(p_domain TEXT)
RETURNS VOID AS $$
BEGIN
  -- Conversion drop alert (if overall conversion < 10%)
  INSERT INTO funnel_alert_rules (
    domain,
    alert_type,
    threshold_value,
    comparison_operator,
    time_window_hours,
    config
  ) VALUES (
    p_domain,
    'conversion_drop',
    10.0, -- 10% threshold
    'less_than',
    24,
    '{"stage": "overall", "min_chats": 10}'::jsonb
  );

  -- High-value cart abandonment alert (carts > £100)
  INSERT INTO funnel_alert_rules (
    domain,
    alert_type,
    threshold_value,
    comparison_operator,
    time_window_hours,
    config
  ) VALUES (
    p_domain,
    'high_value_cart',
    100.0, -- £100 threshold
    'greater_than',
    1, -- Check hourly
    '{"priority": "high"}'::jsonb
  );
END;
$$ LANGUAGE plpgsql;

-- Refresh function for alert stats (can be scheduled via cron)
CREATE OR REPLACE FUNCTION check_funnel_alerts()
RETURNS TABLE (
  domain TEXT,
  alert_type TEXT,
  triggered BOOLEAN,
  metric_value DECIMAL
) AS $$
BEGIN
  -- This would be implemented by the alert monitoring service
  -- Returns domains that have breached alert thresholds
  RETURN QUERY
  SELECT
    cf.domain,
    'conversion_drop'::TEXT as alert_type,
    true as triggered,
    0.0::DECIMAL as metric_value
  FROM conversation_funnel cf
  WHERE 1=0; -- Placeholder
END;
$$ LANGUAGE plpgsql;

-- Comments for documentation
COMMENT ON TABLE funnel_alert_rules IS 'Configuration for automated funnel alerts';
COMMENT ON TABLE funnel_alert_history IS 'History of triggered funnel alerts';
COMMENT ON COLUMN funnel_alert_rules.alert_type IS 'Type of alert: conversion_drop, high_value_cart, funnel_stage_drop';
COMMENT ON COLUMN funnel_alert_rules.threshold_value IS 'Numeric threshold for triggering alert';
COMMENT ON COLUMN funnel_alert_rules.time_window_hours IS 'Time window in hours for calculating metrics';
COMMENT ON COLUMN funnel_alert_history.alert_data IS 'Additional context like affected customer emails, cart IDs, etc.';
