/**
 * Alerting System for Chat Widget Monitoring
 *
 * Main orchestrator for the alerting system using dependency injection.
 * Coordinates alert rules, threshold checking, notification, and reporting.
 *
 * Architecture:
 * - AlertRules: Defines and checks thresholds
 * - ThresholdChecker: Orchestrates threshold checking
 * - AlertNotifier: Dispatches alerts to channels
 * - AlertReporter: Generates statistics and reports
 */

import { logger } from '@/lib/logger';
import { AlertRules, type AlertThresholds } from './alert-rules';
import { AlertNotifier } from './alert-notifier';
import { ThresholdChecker } from './threshold-checker';
import { AlertReporter, type AlertFilterOptions } from './alert-reporter';

export type AlertSeverity = 'info' | 'warning' | 'error' | 'critical';
export type AlertCategory =
  | 'persistence'
  | 'performance'
  | 'memory'
  | 'api'
  | 'error_rate'
  | 'scroll'
  | 'tab_sync';

export interface Alert {
  id: string;
  severity: AlertSeverity;
  category: AlertCategory;
  title: string;
  message: string;
  timestamp: Date;
  metadata?: Record<string, any>;
  resolved?: boolean;
  resolvedAt?: Date;
}

export interface AlertingConfig {
  enabled: boolean;
  checkIntervalMs: number;
  thresholds: AlertThresholds;
  channels: AlertChannel[];
}

export type AlertChannel = 'console' | 'webhook' | 'email' | 'database';

/**
 * Default alert thresholds
 */
const DEFAULT_THRESHOLDS: AlertThresholds = {
  persistence: {
    successRate: 95,
    restoreTime: 200,
    dataLoss: 0,
  },
  performance: {
    renderTime: 16,
    degradationPercent: 20,
  },
  memory: {
    maxUsage: 50 * 1024 * 1024, // 50MB
  },
  api: {
    latency: 500,
    errorRate: 1,
  },
  scroll: {
    minFps: 55,
    jankPercent: 10,
  },
  tabSync: {
    latency: 50,
    failureRate: 1,
  },
};

/**
 * Main alerting system with dependency injection
 */
export class AlertingSystem {
  private static instance: AlertingSystem;
  private alerts: Alert[] = [];
  private config: AlertingConfig;
  private lastCheckTimestamp: Date | null = null;
  private readonly MAX_ALERTS = 1000;

  // Injected dependencies
  private rules: AlertRules;
  private checker: ThresholdChecker;
  private notifier: AlertNotifier;
  private reporter: AlertReporter;

  private constructor(config?: Partial<AlertingConfig>) {
    this.config = {
      enabled: true,
      checkIntervalMs: 60000, // Check every minute
      thresholds: DEFAULT_THRESHOLDS,
      channels: ['console', 'database'],
      ...config,
    };

    // Initialize dependencies with dependency injection
    this.rules = new AlertRules(this.config.thresholds);
    this.checker = new ThresholdChecker(this.rules);
    this.notifier = new AlertNotifier(this.config.channels);
    this.reporter = new AlertReporter();

    // Capture baseline on initialization
    if (this.config.enabled) {
      this.checker.captureBaseline();
      logger.info('Performance baseline captured');
    }
  }

  static getInstance(config?: Partial<AlertingConfig>): AlertingSystem {
    if (!AlertingSystem.instance) {
      AlertingSystem.instance = new AlertingSystem(config);
    }
    return AlertingSystem.instance;
  }

  /**
   * Check thresholds lazily (only if enough time has passed since last check)
   */
  private lazyCheckThresholds(): void {
    if (!this.config.enabled) return;

    const now = new Date();
    const shouldCheck =
      !this.lastCheckTimestamp ||
      now.getTime() - this.lastCheckTimestamp.getTime() >= this.config.checkIntervalMs;

    if (shouldCheck) {
      this.checkThresholds();
      this.lastCheckTimestamp = now;
    }
  }

  /**
   * Manually trigger threshold check
   */
  checkThresholds(): void {
    const results = this.checker.checkAll(300000); // Last 5 minutes

    // Create alerts from results
    for (const result of results) {
      if (result.shouldAlert && result.severity && result.category && result.title && result.message) {
        this.createAlert({
          severity: result.severity,
          category: result.category,
          title: result.title,
          message: result.message,
          metadata: result.metadata,
        });
      }
    }
  }

  /**
   * Create and dispatch alert
   */
  private createAlert(alert: Omit<Alert, 'id' | 'timestamp'>): void {
    // Check for duplicate recent alerts
    if (this.reporter.isDuplicate(alert, this.alerts, 300000)) {
      return;
    }

    const fullAlert: Alert = {
      ...alert,
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
    };

    this.alerts.push(fullAlert);

    // Trim old alerts
    if (this.alerts.length > this.MAX_ALERTS) {
      this.alerts = this.alerts.slice(-this.MAX_ALERTS);
    }

    // Dispatch to configured channels
    this.notifier.dispatch(fullAlert);
  }

  /**
   * Get all alerts (with lazy threshold checking)
   */
  getAlerts(options?: AlertFilterOptions): Alert[] {
    this.lazyCheckThresholds();
    return this.reporter.filterAlerts(this.alerts, options);
  }

  /**
   * Resolve an alert
   */
  resolveAlert(alertId: string): boolean {
    const alert = this.alerts.find((a) => a.id === alertId);
    if (!alert) return false;

    alert.resolved = true;
    alert.resolvedAt = new Date();

    logger.info('Alert resolved', {
      alertId,
      title: alert.title,
      category: alert.category,
    });

    return true;
  }

  /**
   * Get alert statistics
   */
  getAlertStats() {
    return this.reporter.generateStats(this.alerts);
  }

  /**
   * Capture performance baseline
   */
  captureBaseline(): void {
    this.checker.captureBaseline();
    logger.info('Performance baseline captured');
  }

  /**
   * Reset (for testing)
   */
  reset(): void {
    this.alerts = [];
    this.checker.resetBaseline();
  }
}

// Export singleton instance
export const alertingSystem = AlertingSystem.getInstance();

// Convenience functions
export function getAlerts(options?: AlertFilterOptions): Alert[] {
  return alertingSystem.getAlerts(options);
}

export function resolveAlert(alertId: string): boolean {
  return alertingSystem.resolveAlert(alertId);
}

export function getAlertStats() {
  return alertingSystem.getAlertStats();
}

export function checkThresholds(): void {
  alertingSystem.checkThresholds();
}

export function captureBaseline(): void {
  alertingSystem.captureBaseline();
}
