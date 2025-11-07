/**
 * Send Alert Email Notifications
 * Uses Resend API for transactional emails
 */

import { createServiceRoleClient } from '@/lib/supabase-server';
import type { TriggeredAlert } from './threshold-checker';
import { formatMetricName } from './threshold-checker';

/**
 * Get organization admin emails
 */
async function getOrganizationAdmins(organizationId: string): Promise<string[]> {
  const supabase = await createServiceRoleClient();

  const { data: members } = await supabase
    .from('organization_members')
    .select(
      `
      user_id,
      auth.users!inner (
        email
      )
    `
    )
    .eq('organization_id', organizationId)
    .in('role', ['owner', 'admin']);

  if (!members || members.length === 0) {
    return [];
  }

  return members
    .map((m: any) => m.users?.email)
    .filter((email: string | undefined): email is string => !!email);
}

/**
 * Send alert email notification
 */
export async function sendAlertEmail(
  alert: TriggeredAlert,
  organizationId: string
): Promise<void> {
  const emails = await getOrganizationAdmins(organizationId);

  if (emails.length === 0) {
    console.warn('[Alert Email] No admin emails found for organization:', organizationId);
    return;
  }

  const metricName = formatMetricName(alert.threshold.metric);
  const condition = alert.threshold.condition;
  const threshold = alert.threshold.threshold;
  const value = alert.value;

  // Check if RESEND_API_KEY is configured
  const resendApiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.ALERT_FROM_EMAIL || 'alerts@omniops.co.uk';

  if (!resendApiKey) {
    console.warn(
      '[Alert Email] RESEND_API_KEY not configured. Logging alert instead of sending email.'
    );
    console.log('[Alert Email] Would send to:', emails);
    console.log('[Alert Email] Alert:', {
      metric: metricName,
      condition,
      threshold,
      value,
    });
    return;
  }

  // Send email via Resend API
  for (const email of emails) {
    try {
      const emailHtml = generateAlertEmailHTML({
        metricName,
        condition,
        threshold,
        value,
        timestamp: alert.timestamp,
      });

      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${resendApiKey}`,
        },
        body: JSON.stringify({
          from: fromEmail,
          to: email,
          subject: `🚨 Analytics Alert: ${metricName} ${condition} ${threshold}`,
          html: emailHtml,
        }),
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error('[Alert Email] Failed to send email:', errorData);
      } else {
        console.log('[Alert Email] Successfully sent alert to:', email);
      }
    } catch (error) {
      console.error('[Alert Email] Error sending email:', error);
    }
  }
}

/**
 * Generate HTML email template for alert
 */
function generateAlertEmailHTML(params: {
  metricName: string;
  condition: string;
  threshold: number;
  value: number;
  timestamp: Date;
}): string {
  const { metricName, condition, threshold, value, timestamp } = params;

  const exceedsThreshold = condition === 'above' ? value > threshold : value < threshold;
  const severity = exceedsThreshold ? 'high' : 'low';
  const severityColor = severity === 'high' ? '#dc2626' : '#f59e0b';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Analytics Alert</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 32px; background-color: ${severityColor}; border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 600;">
                🚨 Analytics Alert Triggered
              </h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 32px;">
              <p style="margin: 0 0 24px 0; color: #374151; font-size: 16px; line-height: 1.5;">
                The following threshold has been violated:
              </p>

              <table width="100%" cellpadding="12" cellspacing="0" style="background-color: #f9fafb; border-radius: 6px; border: 1px solid #e5e7eb;">
                <tr>
                  <td style="font-weight: 600; color: #6b7280; font-size: 14px;">Metric:</td>
                  <td style="color: #111827; font-size: 14px;">${metricName}</td>
                </tr>
                <tr>
                  <td style="font-weight: 600; color: #6b7280; font-size: 14px;">Condition:</td>
                  <td style="color: #111827; font-size: 14px; text-transform: capitalize;">${condition}</td>
                </tr>
                <tr>
                  <td style="font-weight: 600; color: #6b7280; font-size: 14px;">Threshold:</td>
                  <td style="color: #111827; font-size: 14px;">${threshold}</td>
                </tr>
                <tr>
                  <td style="font-weight: 600; color: #6b7280; font-size: 14px;">Current Value:</td>
                  <td style="color: ${severityColor}; font-size: 14px; font-weight: 600;">${value}</td>
                </tr>
                <tr>
                  <td style="font-weight: 600; color: #6b7280; font-size: 14px;">Time:</td>
                  <td style="color: #111827; font-size: 14px;">${timestamp.toLocaleString()}</td>
                </tr>
              </table>

              <div style="margin-top: 24px; text-align: center;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://omniops.co.uk'}/dashboard/analytics"
                   style="display: inline-block; background-color: #2563eb; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: 500; font-size: 14px;">
                  View Dashboard
                </a>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 32px; background-color: #f9fafb; border-radius: 0 0 8px 8px; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0; color: #6b7280; font-size: 12px; text-align: center;">
                You received this email because you are an administrator for this organization.
                <br>
                To manage alert settings, visit your <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://omniops.co.uk'}/dashboard/alerts" style="color: #2563eb; text-decoration: none;">alerts dashboard</a>.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}
