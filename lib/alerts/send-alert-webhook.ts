/**
 * Send Alert Webhook Notifications
 * Sends alerts to custom webhook URLs configured per organization
 */

import { createServiceRoleClient } from '@/lib/supabase-server';
import type { TriggeredAlert } from './threshold-checker';

/**
 * Get organization webhook URL from settings
 */
async function getWebhookUrl(organizationId: string): Promise<string | null> {
  const supabase = await createServiceRoleClient();

  const { data: organization } = await supabase
    .from('organizations')
    .select('settings')
    .eq('id', organizationId)
    .single();

  if (!organization || !organization.settings) {
    return null;
  }

  const settings = organization.settings as any;
  return settings.alert_webhook_url || null;
}

/**
 * Send alert to webhook
 */
export async function sendAlertWebhook(
  alert: TriggeredAlert,
  organizationId: string
): Promise<void> {
  const webhookUrl = await getWebhookUrl(organizationId);

  if (!webhookUrl) {
    return;
  }

  const payload = {
    type: 'analytics.alert',
    organization_id: organizationId,
    metric: alert.threshold.metric,
    condition: alert.threshold.condition,
    threshold: alert.threshold.threshold,
    value: alert.value,
    timestamp: alert.timestamp.toISOString(),
    severity: determineSeverity(alert),
  };

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Omniops-Alerts/1.0',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      console.error(
        '[Alert Webhook] Failed to send webhook:',
        response.status,
        response.statusText
      );
    } else {
    }
  } catch (error) {
    console.error('[Alert Webhook] Error sending webhook:', error);
    throw error;
  }
}

/**
 * Determine alert severity based on how much threshold is exceeded
 */
function determineSeverity(alert: TriggeredAlert): 'low' | 'medium' | 'high' {
  const { condition, threshold } = alert.threshold;
  const { value } = alert;

  const difference =
    condition === 'above'
      ? ((value - threshold) / threshold) * 100
      : ((threshold - value) / threshold) * 100;

  if (difference > 50) return 'high';
  if (difference > 20) return 'medium';
  return 'low';
}
