/**
 * Funnel Alert Monitoring Service
 *
 * Monitors funnel metrics and triggers alerts based on configured rules
 */

import { createServiceRoleClient } from '@/lib/supabase-server';
import { getFunnelMetrics } from './funnel-analytics';

interface AlertRule {
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
    console.log(`[Funnel Alerts] Max alerts reached for rule ${rule.id}`);
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
 * Check for conversion rate drops
 */
async function checkConversionDropAlert(rule: AlertRule): Promise<boolean> {
  const end = new Date();
  const start = new Date();
  start.setHours(start.getHours() - rule.time_window_hours);

  const metrics = await getFunnelMetrics(rule.domain, { start, end });

  // Check if we have minimum chats for statistical significance
  const minChats = rule.config.min_chats || 10;
  if (metrics.overview.totalChats < minChats) {
    return false; // Not enough data
  }

  // Get the relevant conversion rate
  let conversionRate: number;
  const stage = rule.config.stage || 'overall';

  switch (stage) {
    case 'chat_to_cart':
      conversionRate = metrics.conversionRates.chatToCart;
      break;
    case 'cart_to_purchase':
      conversionRate = metrics.conversionRates.cartToPurchase;
      break;
    case 'overall':
    default:
      conversionRate = metrics.conversionRates.overallConversion;
      break;
  }

  // Check if threshold breached
  const breached = compareValue(conversionRate, rule.threshold_value, rule.comparison_operator);

  if (breached) {
    await triggerAlert(rule, {
      metric_value: conversionRate,
      alert_title: `Conversion Rate Drop Alert: ${rule.domain}`,
      alert_message: `${stage.replace('_', ' → ')} conversion rate is ${conversionRate.toFixed(1)}%, below threshold of ${rule.threshold_value}%`,
      alert_data: {
        stage,
        totalChats: metrics.overview.totalChats,
        totalCarts: metrics.overview.totalCarts,
        totalPurchases: metrics.overview.totalPurchases,
        timeWindow: `${rule.time_window_hours}h`,
      },
    });
    return true;
  }

  return false;
}

/**
 * Check for high-value cart abandonment
 */
async function checkHighValueCartAlert(rule: AlertRule): Promise<boolean> {
  const supabase = await createServiceRoleClient();

  // Look for carts created in the last time window
  const cutoffTime = new Date();
  cutoffTime.setHours(cutoffTime.getHours() - rule.time_window_hours);

  const { data: highValueCarts } = await supabase
    .from('conversation_funnel')
    .select('*')
    .eq('domain', rule.domain)
    .eq('current_stage', 'cart_abandoned')
    .gte('cart_value', rule.threshold_value)
    .gte('cart_created_at', cutoffTime.toISOString())
    .order('cart_value', { ascending: false });

  if (!highValueCarts || highValueCarts.length === 0) {
    return false;
  }

  // Trigger alert for each high-value cart (if notify_immediately)
  if (rule.notify_immediately) {
    for (const cart of highValueCarts) {
      await triggerAlert(rule, {
        metric_value: cart.cart_value,
        alert_title: `High-Value Cart Abandoned: £${cart.cart_value}`,
        alert_message: `Customer ${cart.customer_email} abandoned a cart worth £${cart.cart_value} with ${cart.cart_item_count} items`,
        alert_data: {
          cartId: cart.cart_order_id,
          customerEmail: cart.customer_email,
          cartValue: cart.cart_value,
          itemCount: cart.cart_item_count,
          conversationId: cart.conversation_id,
          priority: cart.cart_priority,
        },
      });
    }
    return true;
  }

  // Or batch alert
  const totalValue = highValueCarts.reduce((sum, c) => sum + c.cart_value, 0);
  await triggerAlert(rule, {
    metric_value: totalValue,
    alert_title: `${highValueCarts.length} High-Value Carts Abandoned`,
    alert_message: `${highValueCarts.length} carts worth £${totalValue.toFixed(2)} total have been abandoned in the last ${rule.time_window_hours}h`,
    alert_data: {
      cartCount: highValueCarts.length,
      totalValue,
      carts: highValueCarts.map(c => ({
        email: c.customer_email,
        value: c.cart_value,
        conversationId: c.conversation_id,
      })),
    },
  });
  return true;
}

/**
 * Check for funnel stage drop-off
 */
async function checkFunnelStageDropAlert(rule: AlertRule): Promise<boolean> {
  const end = new Date();
  const start = new Date();
  start.setHours(start.getHours() - rule.time_window_hours);

  const metrics = await getFunnelMetrics(rule.domain, { start, end });

  // Check drop-off rates
  const dropOffRate = rule.config.stage === 'cart'
    ? metrics.dropOffAnalysis.chatOnlyRate
    : metrics.dropOffAnalysis.cartAbandonmentRate;

  const breached = compareValue(dropOffRate, rule.threshold_value, rule.comparison_operator);

  if (breached) {
    await triggerAlert(rule, {
      metric_value: dropOffRate,
      alert_title: `High Drop-Off Alert: ${rule.config.stage}`,
      alert_message: `${dropOffRate.toFixed(1)}% drop-off at ${rule.config.stage} stage, threshold: ${rule.threshold_value}%`,
      alert_data: {
        stage: rule.config.stage,
        dropOffCount: rule.config.stage === 'cart'
          ? metrics.overview.totalChats - metrics.overview.totalCarts
          : metrics.overview.totalCarts - metrics.overview.totalPurchases,
      },
    });
    return true;
  }

  return false;
}

/**
 * Trigger an alert (save to history and send notifications)
 */
async function triggerAlert(
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
  console.log(`[Funnel Alerts] Sending email to ${email}:`, alertData.alert_title);
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

/**
 * Compare values based on operator
 */
function compareValue(
  actual: number,
  threshold: number,
  operator: 'less_than' | 'greater_than' | 'equals'
): boolean {
  switch (operator) {
    case 'less_than':
      return actual < threshold;
    case 'greater_than':
      return actual > threshold;
    case 'equals':
      return Math.abs(actual - threshold) < 0.01; // Floating point comparison
    default:
      return false;
  }
}
