/**
 * Send Alert Slack Notifications
 * Sends alerts to Slack using incoming webhooks
 */

import { createServiceRoleClient } from '@/lib/supabase-server';
import type { TriggeredAlert } from './threshold-checker';
import { formatMetricName } from './threshold-checker';

/**
 * Get organization Slack webhook URL from settings
 */
async function getSlackWebhookUrl(organizationId: string): Promise<string | null> {
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
  return settings.slack_webhook_url || null;
}

/**
 * Send alert to Slack
 */
export async function sendAlertSlack(
  alert: TriggeredAlert,
  organizationId: string
): Promise<void> {
  const webhookUrl = await getSlackWebhookUrl(organizationId);

  if (!webhookUrl) {
    console.log('[Alert Slack] No Slack webhook URL configured for organization:', organizationId);
    return;
  }

  const metricName = formatMetricName(alert.threshold.metric);
  const severity = determineSeverity(alert);
  const emoji = getEmojiForSeverity(severity);

  const slackPayload = {
    text: `${emoji} Analytics Alert: ${metricName}`,
    blocks: [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: `${emoji} Analytics Alert Triggered`,
          emoji: true,
        },
      },
      {
        type: 'section',
        fields: [
          {
            type: 'mrkdwn',
            text: `*Metric:*\n${metricName}`,
          },
          {
            type: 'mrkdwn',
            text: `*Severity:*\n${severity.toUpperCase()}`,
          },
          {
            type: 'mrkdwn',
            text: `*Condition:*\n${alert.threshold.condition}`,
          },
          {
            type: 'mrkdwn',
            text: `*Threshold:*\n${alert.threshold.threshold}`,
          },
          {
            type: 'mrkdwn',
            text: `*Current Value:*\n${alert.value}`,
          },
          {
            type: 'mrkdwn',
            text: `*Time:*\n${alert.timestamp.toLocaleString()}`,
          },
        ],
      },
      {
        type: 'actions',
        elements: [
          {
            type: 'button',
            text: {
              type: 'plain_text',
              text: 'View Dashboard',
              emoji: true,
            },
            url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://omniops.co.uk'}/dashboard/analytics`,
            style: 'primary',
          },
          {
            type: 'button',
            text: {
              type: 'plain_text',
              text: 'Alert Settings',
              emoji: true,
            },
            url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://omniops.co.uk'}/dashboard/alerts`,
          },
        ],
      },
      {
        type: 'context',
        elements: [
          {
            type: 'mrkdwn',
            text: `Alert triggered at ${alert.timestamp.toISOString()}`,
          },
        ],
      },
    ],
  };

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(slackPayload),
    });

    if (!response.ok) {
      console.error('[Alert Slack] Failed to send Slack message:', response.status);
    } else {
      console.log('[Alert Slack] Successfully sent alert to Slack');
    }
  } catch (error) {
    console.error('[Alert Slack] Error sending Slack message:', error);
    throw error;
  }
}

/**
 * Determine alert severity
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

/**
 * Get emoji based on severity
 */
function getEmojiForSeverity(severity: 'low' | 'medium' | 'high'): string {
  switch (severity) {
    case 'high':
      return '🚨';
    case 'medium':
      return '⚠️';
    case 'low':
      return '📊';
    default:
      return '📊';
  }
}
