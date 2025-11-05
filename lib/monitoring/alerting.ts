/**
 * Alerting System for Chat Widget Monitoring
 *
 * Triggers alerts based on:
 * - Persistence success rate < 95%
 * - Error rate > 1%
 * - Performance degradation > 20%
 * - Memory usage > 50MB
 * - API latency > 500ms
 *
 * Supports multiple alert channels and severity levels.
 */

import { logger } from '@/lib/logger';
import { getPersistenceStats, PersistenceStats } from './persistence-monitor';
import { getPerformanceSnapshot, PerformanceSnapshot } from './performance-collector';

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

export interface AlertThresholds {
  persistence: {
    successRate: number; // Alert if below (default: 95%)
    restoreTime: number; // Alert if above in ms (default: 200ms)
    dataLoss: number; // Alert if any (default: 0)
  };
  performance: {
    renderTime: number; // Alert if p95 above in ms (default: 16ms)
    degradationPercent: number; // Alert if degraded by % (default: 20%)
  };
  memory: {
    maxUsage: number; // Alert if above in bytes (default: 50MB)
  };
  api: {
    latency: number; // Alert if p95 above in ms (default: 500ms)
    errorRate: number; // Alert if above % (default: 1%)
  };
  scroll: {
    minFps: number; // Alert if below (default: 55)
    jankPercent: number; // Alert if above % (default: 10%)
  };
  tabSync: {
    latency: number; // Alert if p95 above in ms (default: 50ms)
    failureRate: number; // Alert if above % (default: 1%)
  };
}

export interface AlertingConfig {
  enabled: boolean;
  checkIntervalMs: number; // How often to check thresholds
  thresholds: AlertThresholds;
  channels: AlertChannel[];
}

export type AlertChannel = 'console' | 'webhook' | 'email' | 'database';

export class AlertingSystem {
  private static instance: AlertingSystem;
  private alerts: Alert[] = [];
  private config: AlertingConfig;
  private checkInterval: NodeJS.Timeout | null = null;
  private readonly MAX_ALERTS = 1000;
  private baselineMetrics: {
    persistence?: PersistenceStats;
    performance?: PerformanceSnapshot;
    timestamp?: Date;
  } = {};

  private lastCheckTimestamp: Date | null = null;

  private constructor(config?: Partial<AlertingConfig>) {
    this.config = {
      enabled: true,
      checkIntervalMs: 60000, // Check every minute (used for lazy evaluation)
      thresholds: {
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
      },
      channels: ['console', 'database'],
      ...config,
    };

    // Capture baseline on initialization (no automatic monitoring)
    if (this.config.enabled) {
      this.captureBaseline();
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
   * This is called automatically by getAlerts() for serverless compatibility
   */
  private lazyCheckThresholds(): void {
    if (!this.config.enabled) return;

    const now = new Date();
    const shouldCheck = !this.lastCheckTimestamp ||
      now.getTime() - this.lastCheckTimestamp.getTime() >= this.config.checkIntervalMs;

    if (shouldCheck) {
      this.checkThresholds();
      this.lastCheckTimestamp = now;
    }
  }

  /**
   * Manually trigger threshold check (for on-demand evaluation)
   */
  checkThresholds(): void {
    const persistenceStats = getPersistenceStats(300000); // Last 5 minutes
    const performanceSnapshot = getPerformanceSnapshot(300000); // Last 5 minutes

    // Check persistence thresholds
    this.checkPersistenceThresholds(persistenceStats);

    // Check performance thresholds
    this.checkPerformanceThresholds(performanceSnapshot);

    // Check memory thresholds
    this.checkMemoryThresholds(performanceSnapshot);

    // Check API thresholds
    this.checkAPIThresholds(performanceSnapshot);

    // Check scroll thresholds
    this.checkScrollThresholds(performanceSnapshot);

    // Check tab sync thresholds
    this.checkTabSyncThresholds(performanceSnapshot);
  }

  /**
   * Check persistence-related thresholds
   */
  private checkPersistenceThresholds(stats: PersistenceStats): void {
    const { thresholds } = this.config;

    // Success rate check
    if (stats.successRate < thresholds.persistence.successRate) {
      this.createAlert({
        severity: stats.successRate < 90 ? 'critical' : 'error',
        category: 'persistence',
        title: 'Low Persistence Success Rate',
        message: `Persistence success rate is ${stats.successRate.toFixed(2)}%, below threshold of ${thresholds.persistence.successRate}%`,
        metadata: {
          successRate: stats.successRate,
          threshold: thresholds.persistence.successRate,
          totalOperations: stats.totalOperations,
          failures: stats.failureCount,
        },
      });
    }

    // Restore time check
    if (stats.p95Duration > thresholds.persistence.restoreTime) {
      this.createAlert({
        severity: 'warning',
        category: 'persistence',
        title: 'Slow Persistence Operations',
        message: `P95 persistence time is ${stats.p95Duration.toFixed(2)}ms, above threshold of ${thresholds.persistence.restoreTime}ms`,
        metadata: {
          p95Duration: stats.p95Duration,
          threshold: thresholds.persistence.restoreTime,
          avgDuration: stats.avgDuration,
        },
      });
    }

    // Data loss check
    if (stats.dataLossIncidents > thresholds.persistence.dataLoss) {
      this.createAlert({
        severity: 'critical',
        category: 'persistence',
        title: 'Data Loss Detected',
        message: `${stats.dataLossIncidents} data loss incident(s) detected`,
        metadata: {
          incidents: stats.dataLossIncidents,
          errorsByType: stats.errorsByType,
        },
      });
    }
  }

  /**
   * Check performance-related thresholds
   */
  private checkPerformanceThresholds(snapshot: PerformanceSnapshot): void {
    const { thresholds } = this.config;

    // Render time check
    if (snapshot.renders.p95Time > thresholds.performance.renderTime) {
      this.createAlert({
        severity: 'warning',
        category: 'performance',
        title: 'Slow Message Renders',
        message: `P95 render time is ${snapshot.renders.p95Time.toFixed(2)}ms, above threshold of ${thresholds.performance.renderTime}ms`,
        metadata: {
          p95Time: snapshot.renders.p95Time,
          threshold: thresholds.performance.renderTime,
          slowRenders: snapshot.renders.slowRenders,
          totalRenders: snapshot.renders.count,
        },
      });
    }

    // Performance degradation check (compared to baseline)
    if (this.baselineMetrics.performance) {
      const baseline = this.baselineMetrics.performance;
      const currentAvg = snapshot.renders.avgTime;
      const baselineAvg = baseline.renders.avgTime;

      if (baselineAvg > 0) {
        const degradation = ((currentAvg - baselineAvg) / baselineAvg) * 100;

        if (degradation > thresholds.performance.degradationPercent) {
          this.createAlert({
            severity: 'warning',
            category: 'performance',
            title: 'Performance Degradation Detected',
            message: `Performance degraded by ${degradation.toFixed(2)}% from baseline`,
            metadata: {
              current: currentAvg,
              baseline: baselineAvg,
              degradation: `${degradation.toFixed(2)}%`,
            },
          });
        }
      }
    }
  }

  /**
   * Check memory-related thresholds
   */
  private checkMemoryThresholds(snapshot: PerformanceSnapshot): void {
    const { thresholds } = this.config;

    if (snapshot.memory.peak > thresholds.memory.maxUsage) {
      const peakMB = snapshot.memory.peak / 1024 / 1024;
      const thresholdMB = thresholds.memory.maxUsage / 1024 / 1024;

      this.createAlert({
        severity: peakMB > thresholdMB * 1.5 ? 'error' : 'warning',
        category: 'memory',
        title: 'High Memory Usage',
        message: `Peak memory usage is ${peakMB.toFixed(2)}MB, above threshold of ${thresholdMB}MB`,
        metadata: {
          peakMB,
          thresholdMB,
          currentMB: snapshot.memory.current / 1024 / 1024,
          avgMB: snapshot.memory.avgUsage / 1024 / 1024,
        },
      });
    }
  }

  /**
   * Check API-related thresholds
   */
  private checkAPIThresholds(snapshot: PerformanceSnapshot): void {
    const { thresholds } = this.config;

    // Latency check
    if (snapshot.api.p95Duration > thresholds.api.latency) {
      this.createAlert({
        severity: 'warning',
        category: 'api',
        title: 'High API Latency',
        message: `P95 API latency is ${snapshot.api.p95Duration.toFixed(2)}ms, above threshold of ${thresholds.api.latency}ms`,
        metadata: {
          p95Duration: snapshot.api.p95Duration,
          threshold: thresholds.api.latency,
          avgDuration: snapshot.api.avgDuration,
          totalCalls: snapshot.api.totalCalls,
        },
      });
    }

    // Error rate check
    if (snapshot.api.errorRate > thresholds.api.errorRate) {
      this.createAlert({
        severity: snapshot.api.errorRate > 5 ? 'error' : 'warning',
        category: 'error_rate',
        title: 'High API Error Rate',
        message: `API error rate is ${snapshot.api.errorRate.toFixed(2)}%, above threshold of ${thresholds.api.errorRate}%`,
        metadata: {
          errorRate: snapshot.api.errorRate,
          threshold: thresholds.api.errorRate,
          totalCalls: snapshot.api.totalCalls,
        },
      });
    }
  }

  /**
   * Check scroll-related thresholds
   */
  private checkScrollThresholds(snapshot: PerformanceSnapshot): void {
    const { thresholds } = this.config;

    // FPS check
    if (snapshot.scroll.avgFps > 0 && snapshot.scroll.avgFps < thresholds.scroll.minFps) {
      this.createAlert({
        severity: 'warning',
        category: 'scroll',
        title: 'Poor Scroll Performance',
        message: `Average scroll FPS is ${snapshot.scroll.avgFps.toFixed(2)}, below threshold of ${thresholds.scroll.minFps}`,
        metadata: {
          avgFps: snapshot.scroll.avgFps,
          minFps: snapshot.scroll.minFps,
          threshold: thresholds.scroll.minFps,
          jankPercentage: snapshot.scroll.jankPercentage,
        },
      });
    }

    // Jank percentage check
    if (snapshot.scroll.jankPercentage > thresholds.scroll.jankPercent) {
      this.createAlert({
        severity: 'warning',
        category: 'scroll',
        title: 'High Scroll Jank',
        message: `Scroll jank is ${snapshot.scroll.jankPercentage.toFixed(2)}%, above threshold of ${thresholds.scroll.jankPercent}%`,
        metadata: {
          jankPercentage: snapshot.scroll.jankPercentage,
          threshold: thresholds.scroll.jankPercent,
          avgFps: snapshot.scroll.avgFps,
        },
      });
    }
  }

  /**
   * Check tab sync-related thresholds
   */
  private checkTabSyncThresholds(snapshot: PerformanceSnapshot): void {
    const { thresholds } = this.config;

    // Latency check
    if (snapshot.tabSync.p95Latency > thresholds.tabSync.latency) {
      this.createAlert({
        severity: 'warning',
        category: 'tab_sync',
        title: 'Slow Tab Synchronization',
        message: `P95 tab sync latency is ${snapshot.tabSync.p95Latency.toFixed(2)}ms, above threshold of ${thresholds.tabSync.latency}ms`,
        metadata: {
          p95Latency: snapshot.tabSync.p95Latency,
          threshold: thresholds.tabSync.latency,
          avgLatency: snapshot.tabSync.avgLatency,
          operations: snapshot.tabSync.count,
        },
      });
    }

    // Failure rate check
    if (snapshot.tabSync.count > 0) {
      const failureRate = (snapshot.tabSync.failures / snapshot.tabSync.count) * 100;

      if (failureRate > thresholds.tabSync.failureRate) {
        this.createAlert({
          severity: 'error',
          category: 'tab_sync',
          title: 'High Tab Sync Failure Rate',
          message: `Tab sync failure rate is ${failureRate.toFixed(2)}%, above threshold of ${thresholds.tabSync.failureRate}%`,
          metadata: {
            failureRate,
            threshold: thresholds.tabSync.failureRate,
            failures: snapshot.tabSync.failures,
            total: snapshot.tabSync.count,
          },
        });
      }
    }
  }

  /**
   * Create and dispatch alert
   */
  private createAlert(alert: Omit<Alert, 'id' | 'timestamp'>): void {
    // Check for duplicate recent alerts
    const isDuplicate = this.alerts
      .filter(a => !a.resolved)
      .some(a =>
        a.category === alert.category &&
        a.title === alert.title &&
        Date.now() - a.timestamp.getTime() < 300000 // Within last 5 minutes
      );

    if (isDuplicate) return;

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
    this.dispatchAlert(fullAlert);
  }

  /**
   * Dispatch alert to configured channels
   */
  private dispatchAlert(alert: Alert): void {
    for (const channel of this.config.channels) {
      switch (channel) {
        case 'console':
          this.logAlert(alert);
          break;
        case 'database':
          // Could save to database here
          break;
        case 'webhook':
          // Could POST to webhook here
          break;
        case 'email':
          // Could send email here
          break;
      }
    }
  }

  /**
   * Log alert to console
   */
  private logAlert(alert: Alert): void {
    const logFn = alert.severity === 'critical' || alert.severity === 'error'
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
   * Capture performance baseline
   */
  captureBaseline(): void {
    this.baselineMetrics = {
      persistence: getPersistenceStats(),
      performance: getPerformanceSnapshot(),
      timestamp: new Date(),
    };

    logger.info('Performance baseline captured', {
      timestamp: this.baselineMetrics.timestamp,
    });
  }

  /**
   * Get all alerts (with lazy threshold checking)
   */
  getAlerts(options?: {
    severity?: AlertSeverity;
    category?: AlertCategory;
    resolved?: boolean;
    limit?: number;
  }): Alert[] {
    // Lazy evaluation: Check thresholds if enough time has passed
    this.lazyCheckThresholds();

    let filtered = [...this.alerts];

    if (options?.severity) {
      filtered = filtered.filter(a => a.severity === options.severity);
    }

    if (options?.category) {
      filtered = filtered.filter(a => a.category === options.category);
    }

    if (options?.resolved !== undefined) {
      filtered = filtered.filter(a => a.resolved === options.resolved);
    }

    // Sort by timestamp descending
    filtered.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    if (options?.limit) {
      filtered = filtered.slice(0, options.limit);
    }

    return filtered;
  }

  /**
   * Resolve an alert
   */
  resolveAlert(alertId: string): boolean {
    const alert = this.alerts.find(a => a.id === alertId);
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
  getAlertStats(): {
    total: number;
    unresolved: number;
    bySeverity: Record<AlertSeverity, number>;
    byCategory: Record<AlertCategory, number>;
  } {
    const unresolved = this.alerts.filter(a => !a.resolved);

    const bySeverity = this.alerts.reduce((acc, alert) => {
      acc[alert.severity] = (acc[alert.severity] || 0) + 1;
      return acc;
    }, {} as Record<AlertSeverity, number>);

    const byCategory = this.alerts.reduce((acc, alert) => {
      acc[alert.category] = (acc[alert.category] || 0) + 1;
      return acc;
    }, {} as Record<AlertCategory, number>);

    return {
      total: this.alerts.length,
      unresolved: unresolved.length,
      bySeverity,
      byCategory,
    };
  }

  /**
   * Reset (for testing)
   */
  reset(): void {
    this.alerts = [];
    this.baselineMetrics = {};
  }
}

// Export singleton instance
export const alertingSystem = AlertingSystem.getInstance();

// Convenience functions
export function getAlerts(options?: Parameters<AlertingSystem['getAlerts']>[0]): Alert[] {
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
