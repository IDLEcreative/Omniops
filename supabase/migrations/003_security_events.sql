-- Security Events & IP Blocking System
-- Comprehensive logging and automatic blocking for security incidents

-- ========================================
-- Security Events Table
-- ========================================
CREATE TABLE IF NOT EXISTS security_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN (
    'auth_failure',
    'rate_limit_exceeded',
    'invalid_signature',
    'suspicious_activity',
    'unauthorized_access',
    'sql_injection_attempt',
    'xss_attempt',
    'credential_access',
    'invalid_webhook_signature',
    'replay_attack_detected'
  )),
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ip TEXT NOT NULL,
  user_agent TEXT,
  endpoint TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for fast queries and analytics
CREATE INDEX IF NOT EXISTS idx_security_events_type ON security_events(type);
CREATE INDEX IF NOT EXISTS idx_security_events_severity ON security_events(severity);
CREATE INDEX IF NOT EXISTS idx_security_events_ip ON security_events(ip);
CREATE INDEX IF NOT EXISTS idx_security_events_timestamp ON security_events(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_security_events_user_id ON security_events(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_security_events_ip_type ON security_events(ip, type);

-- Composite index for failure rate checks
CREATE INDEX IF NOT EXISTS idx_security_events_ip_timestamp
  ON security_events(ip, timestamp DESC)
  WHERE type = 'auth_failure';

-- ========================================
-- Blocked IPs Table
-- ========================================
CREATE TABLE IF NOT EXISTS blocked_ips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ip TEXT NOT NULL UNIQUE,
  reason TEXT NOT NULL,
  blocked_until TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for IP blocking middleware
CREATE INDEX IF NOT EXISTS idx_blocked_ips_ip ON blocked_ips(ip);
CREATE INDEX IF NOT EXISTS idx_blocked_ips_blocked_until ON blocked_ips(blocked_until);
CREATE INDEX IF NOT EXISTS idx_blocked_ips_active
  ON blocked_ips(ip, blocked_until)
  WHERE blocked_until > NOW();

-- ========================================
-- Automatic Cleanup Function
-- ========================================

-- Clean up old security events (keep 90 days for compliance)
CREATE OR REPLACE FUNCTION cleanup_old_security_events()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM security_events
  WHERE timestamp < NOW() - INTERVAL '90 days';

  GET DIAGNOSTICS deleted_count = ROW_COUNT;

  IF deleted_count > 0 THEN
    RAISE NOTICE 'Cleaned up % old security events', deleted_count;
  END IF;
END;
$$;

-- Clean up expired IP blocks
CREATE OR REPLACE FUNCTION cleanup_expired_ip_blocks()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM blocked_ips
  WHERE blocked_until < NOW();

  GET DIAGNOSTICS deleted_count = ROW_COUNT;

  IF deleted_count > 0 THEN
    RAISE NOTICE 'Cleaned up % expired IP blocks', deleted_count;
  END IF;
END;
$$;

-- ========================================
-- Row Level Security (RLS)
-- ========================================

-- Enable RLS
ALTER TABLE security_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocked_ips ENABLE ROW LEVEL SECURITY;

-- Security events: Service role only (sensitive data)
CREATE POLICY "Service role can manage security events"
  ON security_events
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Blocked IPs: Service role only
CREATE POLICY "Service role can manage blocked IPs"
  ON blocked_ips
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ========================================
-- Analytics Views
-- ========================================

-- Security event summary by type (last 24 hours)
CREATE OR REPLACE VIEW security_events_summary AS
SELECT
  type,
  severity,
  COUNT(*) as event_count,
  COUNT(DISTINCT ip) as unique_ips,
  MAX(timestamp) as last_occurrence
FROM security_events
WHERE timestamp > NOW() - INTERVAL '24 hours'
GROUP BY type, severity
ORDER BY event_count DESC;

-- Most active IPs (potential attackers)
CREATE OR REPLACE VIEW security_active_ips AS
SELECT
  ip,
  COUNT(*) as total_events,
  COUNT(DISTINCT type) as event_types,
  MAX(severity) as max_severity,
  MAX(timestamp) as last_event,
  jsonb_agg(DISTINCT type) as event_type_list
FROM security_events
WHERE timestamp > NOW() - INTERVAL '24 hours'
GROUP BY ip
HAVING COUNT(*) > 5
ORDER BY total_events DESC;

-- ========================================
-- Grant Permissions
-- ========================================

GRANT SELECT ON security_events_summary TO service_role;
GRANT SELECT ON security_active_ips TO service_role;

-- ========================================
-- Comments
-- ========================================

COMMENT ON TABLE security_events IS 'Comprehensive security event logging with automatic threat detection';
COMMENT ON TABLE blocked_ips IS 'Automatically blocked IP addresses with expiration';
COMMENT ON FUNCTION cleanup_old_security_events() IS 'Clean up security events older than 90 days (run via cron)';
COMMENT ON FUNCTION cleanup_expired_ip_blocks() IS 'Remove expired IP blocks (run via cron)';
