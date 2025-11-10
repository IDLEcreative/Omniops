/**
 * Alert Reporter Service
 *
 * Generates alert statistics and reports.
 * Single Responsibility: Alert data aggregation and reporting
 */

import type { Alert, AlertSeverity, AlertCategory } from './alerting';

export interface AlertStats {
  total: number;
  unresolved: number;
  bySeverity: Record<AlertSeverity, number>;
  byCategory: Record<AlertCategory, number>;
}

export interface AlertFilterOptions {
  severity?: AlertSeverity;
  category?: AlertCategory;
  resolved?: boolean;
  limit?: number;
}

/**
 * Alert reporter - generates statistics and filtered views
 */
export class AlertReporter {
  /**
   * Filter and sort alerts based on options
   */
  filterAlerts(alerts: Alert[], options?: AlertFilterOptions): Alert[] {
    let filtered = [...alerts];

    if (options?.severity) {
      filtered = filtered.filter((a) => a.severity === options.severity);
    }

    if (options?.category) {
      filtered = filtered.filter((a) => a.category === options.category);
    }

    if (options?.resolved !== undefined) {
      filtered = filtered.filter((a) => a.resolved === options.resolved);
    }

    // Sort by timestamp descending
    filtered.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    if (options?.limit) {
      filtered = filtered.slice(0, options.limit);
    }

    return filtered;
  }

  /**
   * Generate alert statistics
   */
  generateStats(alerts: Alert[]): AlertStats {
    const unresolved = alerts.filter((a) => !a.resolved);

    const bySeverity = alerts.reduce(
      (acc, alert) => {
        acc[alert.severity] = (acc[alert.severity] || 0) + 1;
        return acc;
      },
      {} as Record<AlertSeverity, number>
    );

    const byCategory = alerts.reduce(
      (acc, alert) => {
        acc[alert.category] = (acc[alert.category] || 0) + 1;
        return acc;
      },
      {} as Record<AlertCategory, number>
    );

    return {
      total: alerts.length,
      unresolved: unresolved.length,
      bySeverity,
      byCategory,
    };
  }

  /**
   * Check if an alert is a duplicate of recent alerts
   */
  isDuplicate(
    newAlert: Omit<Alert, 'id' | 'timestamp'>,
    existingAlerts: Alert[],
    windowMs: number = 300000
  ): boolean {
    return existingAlerts
      .filter((a) => !a.resolved)
      .some(
        (a) =>
          a.category === newAlert.category &&
          a.title === newAlert.title &&
          Date.now() - a.timestamp.getTime() < windowMs
      );
  }
}
