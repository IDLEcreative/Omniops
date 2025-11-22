-- Migration: Add webhook_events table for replay attack prevention
-- Purpose: Track processed webhook events to prevent replay attacks
-- Created: 2025-11-18

-- Create webhook_events table
CREATE TABLE IF NOT EXISTS webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id TEXT NOT NULL,
  webhook_type TEXT NOT NULL,
  event_data JSONB NOT NULL,
  processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraints
  CONSTRAINT webhook_events_event_id_type_unique UNIQUE (event_id, webhook_type)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_webhook_events_event_id ON webhook_events(event_id);
CREATE INDEX IF NOT EXISTS idx_webhook_events_webhook_type ON webhook_events(webhook_type);
CREATE INDEX IF NOT EXISTS idx_webhook_events_processed_at ON webhook_events(processed_at);
CREATE INDEX IF NOT EXISTS idx_webhook_events_created_at ON webhook_events(created_at);

-- Create composite index for fast duplicate detection
CREATE INDEX IF NOT EXISTS idx_webhook_events_event_id_type ON webhook_events(event_id, webhook_type);

-- Add comments for documentation
COMMENT ON TABLE webhook_events IS 'Tracks processed webhook events to prevent replay attacks';
COMMENT ON COLUMN webhook_events.event_id IS 'Unique event identifier from webhook provider (order ID, payment ID, etc.)';
COMMENT ON COLUMN webhook_events.webhook_type IS 'Type of webhook (shopify_order, woocommerce_order, stripe_payment, etc.)';
COMMENT ON COLUMN webhook_events.event_data IS 'Full webhook payload for audit trail';
COMMENT ON COLUMN webhook_events.processed_at IS 'When the webhook was successfully processed';

-- Enable Row Level Security (RLS)
ALTER TABLE webhook_events ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Service role can do everything
CREATE POLICY "Service role has full access to webhook_events"
  ON webhook_events
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- RLS Policy: Authenticated users can only read their organization's events
-- (Assuming we add organization_id column in future for multi-tenancy)
CREATE POLICY "Authenticated users can read webhook events"
  ON webhook_events
  FOR SELECT
  TO authenticated
  USING (true);

-- Create function to cleanup old webhook events (older than 90 days)
CREATE OR REPLACE FUNCTION cleanup_old_webhook_events()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM webhook_events
  WHERE processed_at < NOW() - INTERVAL '90 days';

  GET DIAGNOSTICS deleted_count = ROW_COUNT;

  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION cleanup_old_webhook_events IS 'Deletes webhook events older than 90 days (run via cron job)';

-- Grant execute permission to authenticated users (for admin cleanup)
GRANT EXECUTE ON FUNCTION cleanup_old_webhook_events TO authenticated, service_role;
