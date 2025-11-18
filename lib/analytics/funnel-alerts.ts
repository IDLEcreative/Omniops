/**
 * Funnel Alert Monitoring Service
 *
 * Monitors funnel metrics and triggers alerts based on configured rules
 */

import { createServiceRoleClient } from '@/lib/supabase-server';
import {
  checkConversionDropAlert,
  checkHighValueCartAlert,
  checkFunnelStageDropAlert,
} from './funnel-alert-checkers';

export interface AlertRule {
  id: string;
  domain: string;
  alert_type: 'conversion_drop' | 'high_value_cart' | 'funnel_stage_drop';
  is_enabled: boolean;
  threshold_value: number;
  comparison_operator: 'less_than' | 'greater_than' | 'equals';
  time_window_hours: number;
  notification_email: string | null;
  notification_webhook: string | null;
  notify_immediately: boolean;
  max_alerts_per_day: number;
  config: Record<string, any>;
}

interface AlertHistory {
  alert_rule_id: string;
  domain: string;
  alert_type: string;
  metric_value: number;
  threshold_value: number;
  alert_title: string;
  alert_message: string;
  alert_data: Record<string, any>;
}

/**
 * Check all active alert rules and trigger alerts if thresholds breached
 */
export async function monitorFunnelAlerts(): Promise<{ checked: number; triggered: number }> {
  const supabase = await createServiceRoleClient();

  // Get all enabled alert rules
  const { data: rules, error } = await supabase
    .from('funnel_alert_rules')
    .select('*')
    .eq('is_enabled', true);

  if (error || !rules) {
    console.error('[Funnel Alerts] Error fetching rules:', error);
    return { checked: 0, triggered: 0 };
  }

  let triggeredCount = 0;

  // Check each rule
  for (const rule of rules) {
    const triggered = await checkAlertRule(rule);
    if (triggered) triggeredCount++;
  }

  return { checked: rules.length, triggered: triggeredCount };
}

/**
 * Check a single alert rule
 */
async function checkAlertRule(rule: AlertRule): Promise<boolean> {
  const supabase = await createServiceRoleClient();

  // Check if we've exceeded max alerts per day
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const { data: todayAlerts } = await supabase
    .from('funnel_alert_history')
    .select('id')
    .eq('alert_rule_id', rule.id)
    .gte('triggered_at', todayStart.toISOString());

  if (todayAlerts && todayAlerts.length >= rule.max_alerts_per_day) {
    return false;
  }

  // Check alert type
  switch (rule.alert_type) {
    case 'conversion_drop':
      return await checkConversionDropAlert(rule);
    case 'high_value_cart':
      return await checkHighValueCartAlert(rule);
    case 'funnel_stage_drop':
      return await checkFunnelStageDropAlert(rule);
    default:
      return false;
  }
}

/**
 * Trigger an alert (save to history and send notifications)
 */
export async function triggerAlert(
  rule: AlertRule,
  alertData: {
    metric_value: number;
    alert_title: string;
    alert_message: string;
    alert_data: Record<string, any>;
  }
): Promise<void> {
  const supabase = await createServiceRoleClient();

  // Save to history
  const { data: alert, error } = await supabase
    .from('funnel_alert_history')
    .insert({
      alert_rule_id: rule.id,
      domain: rule.domain,
      alert_type: rule.alert_type,
      metric_value: alertData.metric_value,
      threshold_value: rule.threshold_value,
      alert_title: alertData.alert_title,
      alert_message: alertData.alert_message,
      alert_data: alertData.alert_data,
    })
    .select()
    .single();

  if (error) {
    console.error('[Funnel Alerts] Error saving alert:', error);
    return;
  }

  // Send notifications
  let notificationSent = false;
  let notificationError = null;

  try {
    if (rule.notification_email) {
      await sendEmailNotification(rule.notification_email, alertData);
      notificationSent = true;
    }

    if (rule.notification_webhook) {
      await sendWebhookNotification(rule.notification_webhook, alertData);
      notificationSent = true;
    }
  } catch (err) {
    notificationError = (err as Error).message;
    console.error('[Funnel Alerts] Notification error:', err);
  }

  // Update alert history with notification status
  await supabase
    .from('funnel_alert_history')
    .update({
      notification_sent: notificationSent,
      notification_sent_at: notificationSent ? new Date().toISOString() : null,
      notification_error: notificationError,
    })
    .eq('id', alert.id);
}

/**
 * Send email notification (placeholder - implement with email service)
 */
async function sendEmailNotification(
  email: string,
  alertData: { alert_title: string; alert_message: string; alert_data: Record<string, any> }
): Promise<void> {
  // TODO: Integrate with email service (SendGrid, Postmark, etc.)
}

/**
 * Send webhook notification
 */
async function sendWebhookNotification(
  webhookUrl: string,
  alertData: { alert_title: string; alert_message: string; alert_data: Record<string, any> }
): Promise<void> {
  await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(alertData),
  });
}
