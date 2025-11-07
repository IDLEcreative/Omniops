-- Create report_subscriptions table for scheduled analytics email reports
CREATE TABLE IF NOT EXISTS report_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  user_email TEXT NOT NULL,
  frequency TEXT NOT NULL CHECK (frequency IN ('daily', 'weekly', 'monthly')),
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for efficient querying
CREATE INDEX idx_report_subs_org ON report_subscriptions(organization_id);
CREATE INDEX idx_report_subs_enabled ON report_subscriptions(enabled) WHERE enabled = true;
CREATE INDEX idx_report_subs_frequency ON report_subscriptions(frequency);

-- Add unique constraint to prevent duplicate subscriptions
CREATE UNIQUE INDEX idx_report_subs_unique ON report_subscriptions(organization_id, frequency);

-- Add RLS policies
ALTER TABLE report_subscriptions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own subscriptions
CREATE POLICY "Users can view own subscriptions"
  ON report_subscriptions
  FOR SELECT
  USING (auth.uid()::text = organization_id::text);

-- Policy: Users can insert their own subscriptions
CREATE POLICY "Users can create own subscriptions"
  ON report_subscriptions
  FOR INSERT
  WITH CHECK (auth.uid()::text = organization_id::text);

-- Policy: Users can update their own subscriptions
CREATE POLICY "Users can update own subscriptions"
  ON report_subscriptions
  FOR UPDATE
  USING (auth.uid()::text = organization_id::text);

-- Policy: Users can delete their own subscriptions
CREATE POLICY "Users can delete own subscriptions"
  ON report_subscriptions
  FOR DELETE
  USING (auth.uid()::text = organization_id::text);

-- Add comment
COMMENT ON TABLE report_subscriptions IS 'Stores user preferences for scheduled analytics email reports';
