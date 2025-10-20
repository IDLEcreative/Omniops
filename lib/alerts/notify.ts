/**
 * Alert notification helper for monitoring failures
 * Sends Slack notifications when health checks fail
 */

export interface AlertPayload {
  title: string;
  message: string;
  severity: 'error' | 'warning' | 'info';
  context?: Record<string, string | number | boolean>;
}

/**
 * Send alert notification to configured webhook
 * @param payload Alert details to send
 * @returns true if notification sent successfully
 */
export async function sendAlert(payload: AlertPayload): Promise<boolean> {
  const webhookUrl = process.env.MONITOR_ALERT_WEBHOOK_URL;

  if (!webhookUrl) {
    console.warn(
      'MONITOR_ALERT_WEBHOOK_URL not configured. Skipping alert notification.',
    );
    return false;
  }

  try {
    const slackPayload = {
      text: `*${payload.title}*`,
      blocks: [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: payload.title,
            emoji: true,
          },
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: payload.message,
          },
        },
        ...(payload.context
          ? [
              {
                type: 'section',
                fields: Object.entries(payload.context).map(([key, value]) => ({
                  type: 'mrkdwn',
                  text: `*${key}:*\n${value}`,
                })),
              },
            ]
          : []),
        {
          type: 'context',
          elements: [
            {
              type: 'mrkdwn',
              text: `Severity: *${payload.severity.toUpperCase()}* | ${new Date().toISOString()}`,
            },
          ],
        },
      ],
    };

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(slackPayload),
    });

    if (!response.ok) {
      console.error(
        `Failed to send alert: ${response.status} ${response.statusText}`,
      );
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error sending alert notification:', error);
    return false;
  }
}

/**
 * Send error alert for monitoring failure
 */
export async function alertMonitorFailure(
  monitorName: string,
  errorMessage: string,
  context?: Record<string, string | number | boolean>,
): Promise<boolean> {
  return sendAlert({
    title: `❌ ${monitorName} Monitor Failed`,
    message: errorMessage,
    severity: 'error',
    context: {
      Monitor: monitorName,
      Timestamp: new Date().toISOString(),
      ...context,
    },
  });
}

/**
 * Send warning alert for degraded monitoring
 */
export async function alertMonitorWarning(
  monitorName: string,
  warningMessage: string,
  context?: Record<string, string | number | boolean>,
): Promise<boolean> {
  return sendAlert({
    title: `⚠️ ${monitorName} Monitor Warning`,
    message: warningMessage,
    severity: 'warning',
    context: {
      Monitor: monitorName,
      Timestamp: new Date().toISOString(),
      ...context,
    },
  });
}
