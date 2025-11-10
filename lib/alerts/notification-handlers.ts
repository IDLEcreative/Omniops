/**
 * Alert Notification Handlers
 * Handles sending notifications through different channels
 */

import { createServiceRoleClient } from '@/lib/supabase-server';
import { sendAlertEmail } from './send-alert-email';
import { sendAlertWebhook } from './send-alert-webhook';
import { sendAlertSlack } from './send-alert-slack';
import type { TriggeredAlert } from './threshold-checker';

/**
 * Send notifications through configured channels
 */
export async function sendAlertNotifications(
  alert: TriggeredAlert,
  organizationId: string
): Promise<void> {
  const channels = alert.threshold.notification_channels || ['email'];

  const results = await Promise.allSettled([
    channels.includes('email') ? sendAlertEmail(alert, organizationId) : Promise.resolve(),
    channels.includes('webhook')
      ? sendAlertWebhook(alert, organizationId)
      : Promise.resolve(),
    channels.includes('slack') ? sendAlertSlack(alert, organizationId) : Promise.resolve(),
  ]);

  // Update alert history with notification status
  const supabase = await createServiceRoleClient();

  const notificationErrors = results
    .filter((r) => r.status === 'rejected')
    .map((r) => (r as PromiseRejectedResult).reason?.message || 'Unknown error')
    .join('; ');

  await supabase
    .from('alert_history')
    .update({
      notification_sent: results.some((r) => r.status === 'fulfilled'),
      notification_error: notificationErrors || null,
    })
    .eq('organization_id', organizationId)
    .eq('metric', alert.threshold.metric)
    .eq('value', alert.value)
    .is('notification_sent', false);
}
