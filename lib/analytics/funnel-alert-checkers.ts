/**
 * Funnel Alert Checkers
 * Individual alert checking functions for different alert types
 */

import { createServiceRoleClient } from '@/lib/supabase-server';
import { getFunnelMetrics } from './funnel-analytics';
import type { AlertRule } from './funnel-alerts';

export async function checkConversionDropAlert(rule: AlertRule): Promise<boolean> {
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
    const { triggerAlert } = await import('./funnel-alerts');
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

export async function checkHighValueCartAlert(rule: AlertRule): Promise<boolean> {
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

  const { triggerAlert } = await import('./funnel-alerts');

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

export async function checkFunnelStageDropAlert(rule: AlertRule): Promise<boolean> {
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
    const { triggerAlert } = await import('./funnel-alerts');
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
      return Math.abs(actual - threshold) < 0.01;
    default:
      return false;
  }
}
