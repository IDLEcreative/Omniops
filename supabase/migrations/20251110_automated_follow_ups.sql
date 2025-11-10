/**
 * Automated Follow-ups System
 *
 * Creates tables and functions for automated follow-up management:
 * - follow_up_messages: Scheduled follow-up messages
 * - follow_up_logs: Audit trail of follow-up attempts
 * - notifications: In-app notifications
 * - follow_up_analytics: Effectiveness tracking
 */

-- ============================================================================
-- 1. Follow-up Messages Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS follow_up_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL,
  reason TEXT NOT NULL CHECK (reason IN (
    'abandoned_conversation',
    'unresolved_issue',
    'low_satisfaction',
    'cart_abandonment',
    'unanswered_question',
    'product_inquiry'
  )),
  channel TEXT NOT NULL CHECK (channel IN ('email', 'in_app', 'sms')),
  recipient TEXT NOT NULL,
  subject TEXT NOT NULL,
  content TEXT NOT NULL,
  scheduled_at TIMESTAMPTZ NOT NULL,
  sent_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'cancelled')),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for follow_up_messages
CREATE INDEX idx_follow_up_messages_conversation ON follow_up_messages(conversation_id);
CREATE INDEX idx_follow_up_messages_session ON follow_up_messages(session_id);
CREATE INDEX idx_follow_up_messages_status_scheduled ON follow_up_messages(status, scheduled_at) WHERE status = 'pending';
CREATE INDEX idx_follow_up_messages_reason ON follow_up_messages(reason);
CREATE INDEX idx_follow_up_messages_sent_at ON follow_up_messages(sent_at) WHERE sent_at IS NOT NULL;

-- ============================================================================
-- 2. Follow-up Logs Table (Audit Trail)
-- ============================================================================

CREATE TABLE IF NOT EXISTS follow_up_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  scheduled_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for follow_up_logs
CREATE INDEX idx_follow_up_logs_conversation ON follow_up_logs(conversation_id);
CREATE INDEX idx_follow_up_logs_created_at ON follow_up_logs(created_at);

-- ============================================================================
-- 3. Notifications Table (In-App Notifications)
-- ============================================================================

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('follow_up', 'system', 'promotion', 'alert')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ
);

-- Indexes for notifications
CREATE INDEX idx_notifications_session ON notifications(session_id);
CREATE INDEX idx_notifications_type ON notifications(type);
CREATE INDEX idx_notifications_read ON notifications(read) WHERE read = FALSE;
CREATE INDEX idx_notifications_created_at ON notifications(created_at);

-- ============================================================================
-- 4. Follow-up Analytics View
-- ============================================================================

CREATE OR REPLACE VIEW follow_up_analytics AS
SELECT
  reason,
  channel,
  status,
  COUNT(*) AS total_messages,
  COUNT(*) FILTER (WHERE status = 'sent') AS sent_count,
  COUNT(*) FILTER (WHERE status = 'failed') AS failed_count,
  COUNT(*) FILTER (WHERE status = 'cancelled') AS cancelled_count,
  ROUND(
    AVG(EXTRACT(EPOCH FROM (sent_at - scheduled_at)) / 60)::NUMERIC,
    2
  ) AS avg_send_delay_minutes,
  COUNT(*) FILTER (WHERE status = 'sent' AND sent_at > NOW() - INTERVAL '7 days') AS sent_last_7_days,
  COUNT(*) FILTER (WHERE status = 'sent' AND sent_at > NOW() - INTERVAL '30 days') AS sent_last_30_days
FROM follow_up_messages
GROUP BY reason, channel, status;

-- ============================================================================
-- 5. Helper Functions
-- ============================================================================

/**
 * Get follow-up effectiveness metrics
 * Returns response rate and conversion metrics for follow-ups
 */
CREATE OR REPLACE FUNCTION get_follow_up_effectiveness(
  p_days INTEGER DEFAULT 30
)
RETURNS TABLE (
  reason TEXT,
  total_sent INTEGER,
  response_rate NUMERIC,
  avg_response_time_hours NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    fm.reason,
    COUNT(fm.id)::INTEGER AS total_sent,
    ROUND(
      (COUNT(CASE WHEN m.id IS NOT NULL THEN 1 END)::NUMERIC / NULLIF(COUNT(fm.id), 0)) * 100,
      2
    ) AS response_rate,
    ROUND(
      AVG(EXTRACT(EPOCH FROM (m.created_at - fm.sent_at)) / 3600)::NUMERIC,
      2
    ) AS avg_response_time_hours
  FROM follow_up_messages fm
  LEFT JOIN LATERAL (
    SELECT id, created_at
    FROM messages
    WHERE conversation_id = fm.conversation_id
      AND created_at > fm.sent_at
      AND role = 'user'
    ORDER BY created_at ASC
    LIMIT 1
  ) m ON true
  WHERE fm.status = 'sent'
    AND fm.sent_at > NOW() - (p_days || ' days')::INTERVAL
  GROUP BY fm.reason;
END;
$$ LANGUAGE plpgsql STABLE;

/**
 * Clean up old notifications (older than 90 days)
 */
CREATE OR REPLACE FUNCTION cleanup_old_notifications()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM notifications
  WHERE created_at < NOW() - INTERVAL '90 days'
     OR (expires_at IS NOT NULL AND expires_at < NOW());

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 6. Row Level Security (RLS)
-- ============================================================================

-- Enable RLS
ALTER TABLE follow_up_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE follow_up_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for follow_up_messages
CREATE POLICY "Users can view their organization's follow-ups"
  ON follow_up_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM conversations c
      JOIN domains d ON c.domain_id = d.id
      JOIN customer_configs cc ON d.customer_config_id = cc.id
      WHERE c.id = conversation_id
        AND cc.organization_id IN (
          SELECT organization_id
          FROM organization_members
          WHERE user_id = auth.uid()
        )
    )
  );

CREATE POLICY "System can manage all follow-ups"
  ON follow_up_messages FOR ALL
  USING (auth.role() = 'service_role');

-- RLS Policies for follow_up_logs
CREATE POLICY "Users can view their organization's follow-up logs"
  ON follow_up_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM conversations c
      JOIN domains d ON c.domain_id = d.id
      JOIN customer_configs cc ON d.customer_config_id = cc.id
      WHERE c.id = conversation_id
        AND cc.organization_id IN (
          SELECT organization_id
          FROM organization_members
          WHERE user_id = auth.uid()
        )
    )
  );

CREATE POLICY "System can manage all follow-up logs"
  ON follow_up_logs FOR ALL
  USING (auth.role() = 'service_role');

-- RLS Policies for notifications
CREATE POLICY "Users can view their session's notifications"
  ON notifications FOR SELECT
  USING (true); -- Public access (session-based, not user-based)

CREATE POLICY "System can manage all notifications"
  ON notifications FOR ALL
  USING (auth.role() = 'service_role');

-- ============================================================================
-- 7. Trigger for updated_at timestamp
-- ============================================================================

CREATE OR REPLACE FUNCTION update_follow_up_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_follow_up_messages_updated_at
  BEFORE UPDATE ON follow_up_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_follow_up_updated_at();

-- ============================================================================
-- 8. Indexes for Performance
-- ============================================================================

-- Composite index for common query patterns
CREATE INDEX idx_follow_up_messages_conversation_status
  ON follow_up_messages(conversation_id, status);

CREATE INDEX idx_follow_up_messages_sent_reason
  ON follow_up_messages(sent_at, reason)
  WHERE status = 'sent';

-- ============================================================================
-- Done!
-- ============================================================================

COMMENT ON TABLE follow_up_messages IS 'Automated follow-up messages scheduled for conversations';
COMMENT ON TABLE follow_up_logs IS 'Audit trail of all follow-up attempts';
COMMENT ON TABLE notifications IS 'In-app notifications for users';
COMMENT ON VIEW follow_up_analytics IS 'Analytics view for follow-up effectiveness';
