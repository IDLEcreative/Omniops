/**
 * Security Event Logger
 *
 * Provides comprehensive security event logging and real-time alerting
 * with automatic IP blocking for repeated violations.
 */

import { createServiceRoleClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';

export type SecurityEventType =
  | 'auth_failure'
  | 'rate_limit_exceeded'
  | 'invalid_signature'
  | 'suspicious_activity'
  | 'unauthorized_access'
  | 'sql_injection_attempt'
  | 'xss_attempt'
  | 'credential_access'
  | 'invalid_webhook_signature'
  | 'replay_attack_detected';

export type Severity = 'low' | 'medium' | 'high' | 'critical';

export interface SecurityEvent {
  type: SecurityEventType;
  severity: Severity;
  userId?: string;
  ip: string;
  userAgent?: string;
  endpoint: string;
  metadata: Record<string, any>;
  timestamp: string;
}

/**
 * Log security event to database
 */
export async function logSecurityEvent(event: Omit<SecurityEvent, 'timestamp'>) {
  const supabase = await createServiceRoleClient();

  try {
    const { error } = await supabase
      .from('security_events')
      .insert({
        ...event,
        timestamp: new Date().toISOString(),
      });

    if (error) {
      logger.error('[Security] Failed to log event:', { error, event });
    } else {
      logger.info('[Security] Event logged:', {
        type: event.type,
        severity: event.severity,
        endpoint: event.endpoint
      });
    }

    // Alert on critical events
    if (event.severity === 'critical') {
      await sendCriticalAlert(event);
    }

    // Auto-block on repeated auth failures
    if (event.type === 'auth_failure') {
      await checkAndBlockIP(event.ip);
    }

    // Auto-block on attack attempts
    if (event.type === 'sql_injection_attempt' || event.type === 'xss_attempt') {
      await blockIPImmediately(event.ip, `${event.type} detected`);
    }
  } catch (err) {
    logger.error('[Security] Exception logging event:', { err, event });
  }
}

/**
 * Check if IP should be blocked based on failure count
 * Blocks IP for 24 hours after 10 auth failures in 1 hour
 */
async function checkAndBlockIP(ip: string) {
  const supabase = await createServiceRoleClient();

  try {
    // Count failures in last hour
    const oneHourAgo = new Date(Date.now() - 3600000).toISOString();

    const { data, error } = await supabase
      .from('security_events')
      .select('id')
      .eq('ip', ip)
      .eq('type', 'auth_failure')
      .gte('timestamp', oneHourAgo);

    if (!error && data && data.length >= 10) {
      await blockIPImmediately(
        ip,
        `Too many auth failures (${data.length} in 1 hour)`
      );
    }
  } catch (err) {
    logger.error('[Security] Error checking IP block status:', { err, ip });
  }
}

/**
 * Block IP immediately for 24 hours
 */
async function blockIPImmediately(ip: string, reason: string) {
  const supabase = await createServiceRoleClient();

  try {
    const blockedUntil = new Date(Date.now() + 86400000).toISOString(); // 24 hours

    const { error } = await supabase
      .from('blocked_ips')
      .upsert({
        ip,
        reason,
        blocked_until: blockedUntil,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'ip'
      });

    if (error) {
      logger.error('[Security] Failed to block IP:', { error, ip });
    } else {
      logger.warn(`[Security] Blocked IP ${ip} for 24h: ${reason}`);

      // Send alert for IP block
      await sendCriticalAlert({
        type: 'suspicious_activity',
        severity: 'critical',
        ip,
        endpoint: '/security/auto-block',
        metadata: { reason, blockedUntil },
      } as SecurityEvent);
    }
  } catch (err) {
    logger.error('[Security] Exception blocking IP:', { err, ip });
  }
}

/**
 * Check if an IP is currently blocked
 */
export async function isIPBlocked(ip: string): Promise<boolean> {
  const supabase = await createServiceRoleClient();

  try {
    const { data, error } = await supabase
      .from('blocked_ips')
      .select('id, blocked_until')
      .eq('ip', ip)
      .gt('blocked_until', new Date().toISOString())
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows
      logger.error('[Security] Error checking IP block status:', { error, ip });
    }

    return !!data;
  } catch (err) {
    logger.error('[Security] Exception checking IP block:', { err, ip });
    return false; // Fail open to avoid blocking legitimate users
  }
}

/**
 * Send critical security alert
 * TODO: Integrate with alerting service (Slack, PagerDuty, email)
 */
async function sendCriticalAlert(event: Partial<SecurityEvent>) {
  logger.error('[CRITICAL SECURITY EVENT]', {
    type: event.type,
    severity: event.severity,
    ip: event.ip,
    endpoint: event.endpoint,
    metadata: event.metadata,
    timestamp: new Date().toISOString(),
  });

  // TODO: Add integration with:
  // - Slack webhook for team notifications
  // - PagerDuty for on-call alerts
  // - Email for security team
  // - SMS for critical incidents
}

/**
 * Get security event summary for an IP
 * Useful for security dashboard and investigations
 */
export async function getIPSecuritySummary(ip: string) {
  const supabase = await createServiceRoleClient();

  try {
    const last24Hours = new Date(Date.now() - 86400000).toISOString();

    const { data, error } = await supabase
      .from('security_events')
      .select('type, severity, timestamp, endpoint')
      .eq('ip', ip)
      .gte('timestamp', last24Hours)
      .order('timestamp', { ascending: false })
      .limit(100);

    if (error) {
      logger.error('[Security] Error fetching IP summary:', { error, ip });
      return null;
    }

    return {
      ip,
      eventCount: data?.length || 0,
      events: data || [],
      criticalEvents: data?.filter(e => e.severity === 'critical').length || 0,
      recentTypes: [...new Set(data?.map(e => e.type) || [])],
    };
  } catch (err) {
    logger.error('[Security] Exception fetching IP summary:', { err, ip });
    return null;
  }
}

/**
 * Clean up old blocked IPs (expired blocks)
 * Should be run periodically via cron job
 */
export async function cleanupExpiredBlocks() {
  const supabase = await createServiceRoleClient();

  try {
    const { data, error } = await supabase
      .from('blocked_ips')
      .delete()
      .lt('blocked_until', new Date().toISOString())
      .select('ip');

    if (error) {
      logger.error('[Security] Error cleaning up expired blocks:', { error });
    } else if (data && data.length > 0) {
      logger.info(`[Security] Cleaned up ${data.length} expired IP blocks`);
    }
  } catch (err) {
    logger.error('[Security] Exception cleaning up blocks:', { err });
  }
}
