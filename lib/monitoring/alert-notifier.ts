/**
 * Alert Notification Service
 *
 * Handles dispatching alerts to configured channels (console, database, webhook, email).
 * Single Responsibility: Alert notification/delivery
 */

import { logger } from '@/lib/logger';
import type { Alert, AlertChannel } from './alerting';

/**
 * Alert notification service - dispatches alerts to configured channels
 */
export class AlertNotifier {
  constructor(private channels: AlertChannel[]) {}

  /**
   * Dispatch alert to all configured channels
   */
  dispatch(alert: Alert): void {
    for (const channel of this.channels) {
      switch (channel) {
        case 'console':
          this.logToConsole(alert);
          break;
        case 'database':
          this.saveToDatabase(alert);
          break;
        case 'webhook':
          this.sendToWebhook(alert);
          break;
        case 'email':
          this.sendEmail(alert);
          break;
      }
    }
  }

  /**
   * Log alert to console
   */
  private logToConsole(alert: Alert): void {
    const logFn =
      alert.severity === 'critical' || alert.severity === 'error'
        ? logger.error
        : alert.severity === 'warning'
          ? logger.warn
          : logger.info;

    logFn(`[${alert.severity.toUpperCase()}] ${alert.title}`, {
      category: alert.category,
      message: alert.message,
      metadata: alert.metadata,
    });
  }

  /**
   * Save alert to database (placeholder)
   */
  private saveToDatabase(alert: Alert): void {
    // Future implementation: Save to Supabase alerts table
    logger.info('Alert would be saved to database', { alertId: alert.id });
  }

  /**
   * Send alert to webhook (placeholder)
   */
  private sendToWebhook(alert: Alert): void {
    // Future implementation: POST to configured webhook URL
    logger.info('Alert would be sent to webhook', { alertId: alert.id });
  }

  /**
   * Send alert via email (placeholder)
   */
  private sendEmail(alert: Alert): void {
    // Future implementation: Send email via SendGrid/SES
    logger.info('Alert would be sent via email', { alertId: alert.id });
  }

  /**
   * Update notification channels
   */
  setChannels(channels: AlertChannel[]): void {
    this.channels = channels;
  }

  /**
   * Get current channels
   */
  getChannels(): AlertChannel[] {
    return [...this.channels];
  }
}
