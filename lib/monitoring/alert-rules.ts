/**
 * Alert Rules and Threshold Definitions
 *
 * Defines all alert thresholds and rule checking logic for the monitoring system.
 * Single Responsibility: Threshold definition and validation
 */

import type { PersistenceStats } from './persistence-monitor';
import type { PerformanceSnapshot } from './performance-collector';
import type { Alert, AlertSeverity, AlertCategory } from './alerting';

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

export interface AlertRuleResult {
  shouldAlert: boolean;
  severity?: AlertSeverity;
  category?: AlertCategory;
  title?: string;
  message?: string;
  metadata?: Record<string, any>;
}

/**
 * Alert rules engine - checks thresholds and generates alert data
 */
export class AlertRules {
  constructor(private thresholds: AlertThresholds) {}

  /**
   * Check persistence-related thresholds
   */
  checkPersistence(stats: PersistenceStats): AlertRuleResult[] {
    const results: AlertRuleResult[] = [];

    // Success rate check
    if (stats.successRate < this.thresholds.persistence.successRate) {
      results.push({
        shouldAlert: true,
        severity: stats.successRate < 90 ? 'critical' : 'error',
        category: 'persistence',
        title: 'Low Persistence Success Rate',
        message: `Persistence success rate is ${stats.successRate.toFixed(2)}%, below threshold of ${this.thresholds.persistence.successRate}%`,
        metadata: {
          successRate: stats.successRate,
          threshold: this.thresholds.persistence.successRate,
          totalOperations: stats.totalOperations,
          failures: stats.failureCount,
        },
      });
    }

    // Restore time check
    if (stats.p95Duration > this.thresholds.persistence.restoreTime) {
      results.push({
        shouldAlert: true,
        severity: 'warning',
        category: 'persistence',
        title: 'Slow Persistence Operations',
        message: `P95 persistence time is ${stats.p95Duration.toFixed(2)}ms, above threshold of ${this.thresholds.persistence.restoreTime}ms`,
        metadata: {
          p95Duration: stats.p95Duration,
          threshold: this.thresholds.persistence.restoreTime,
          avgDuration: stats.avgDuration,
        },
      });
    }

    // Data loss check
    if (stats.dataLossIncidents > this.thresholds.persistence.dataLoss) {
      results.push({
        shouldAlert: true,
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

    return results;
  }

  /**
   * Check performance-related thresholds
   */
  checkPerformance(snapshot: PerformanceSnapshot, baseline?: PerformanceSnapshot): AlertRuleResult[] {
    const results: AlertRuleResult[] = [];

    // Render time check
    if (snapshot.renders.p95Time > this.thresholds.performance.renderTime) {
      results.push({
        shouldAlert: true,
        severity: 'warning',
        category: 'performance',
        title: 'Slow Message Renders',
        message: `P95 render time is ${snapshot.renders.p95Time.toFixed(2)}ms, above threshold of ${this.thresholds.performance.renderTime}ms`,
        metadata: {
          p95Time: snapshot.renders.p95Time,
          threshold: this.thresholds.performance.renderTime,
          slowRenders: snapshot.renders.slowRenders,
          totalRenders: snapshot.renders.count,
        },
      });
    }

    // Performance degradation check
    if (baseline) {
      const currentAvg = snapshot.renders.avgTime;
      const baselineAvg = baseline.renders.avgTime;

      if (baselineAvg > 0) {
        const degradation = ((currentAvg - baselineAvg) / baselineAvg) * 100;

        if (degradation > this.thresholds.performance.degradationPercent) {
          results.push({
            shouldAlert: true,
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

    return results;
  }

  /**
   * Check memory-related thresholds
   */
  checkMemory(snapshot: PerformanceSnapshot): AlertRuleResult[] {
    const results: AlertRuleResult[] = [];

    if (snapshot.memory.peak > this.thresholds.memory.maxUsage) {
      const peakMB = snapshot.memory.peak / 1024 / 1024;
      const thresholdMB = this.thresholds.memory.maxUsage / 1024 / 1024;

      results.push({
        shouldAlert: true,
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

    return results;
  }

  /**
   * Check API-related thresholds
   */
  checkAPI(snapshot: PerformanceSnapshot): AlertRuleResult[] {
    const results: AlertRuleResult[] = [];

    // Latency check
    if (snapshot.api.p95Duration > this.thresholds.api.latency) {
      results.push({
        shouldAlert: true,
        severity: 'warning',
        category: 'api',
        title: 'High API Latency',
        message: `P95 API latency is ${snapshot.api.p95Duration.toFixed(2)}ms, above threshold of ${this.thresholds.api.latency}ms`,
        metadata: {
          p95Duration: snapshot.api.p95Duration,
          threshold: this.thresholds.api.latency,
          avgDuration: snapshot.api.avgDuration,
          totalCalls: snapshot.api.totalCalls,
        },
      });
    }

    // Error rate check
    if (snapshot.api.errorRate > this.thresholds.api.errorRate) {
      results.push({
        shouldAlert: true,
        severity: snapshot.api.errorRate > 5 ? 'error' : 'warning',
        category: 'error_rate',
        title: 'High API Error Rate',
        message: `API error rate is ${snapshot.api.errorRate.toFixed(2)}%, above threshold of ${this.thresholds.api.errorRate}%`,
        metadata: {
          errorRate: snapshot.api.errorRate,
          threshold: this.thresholds.api.errorRate,
          totalCalls: snapshot.api.totalCalls,
        },
      });
    }

    return results;
  }

  /**
   * Check scroll-related thresholds
   */
  checkScroll(snapshot: PerformanceSnapshot): AlertRuleResult[] {
    const results: AlertRuleResult[] = [];

    // FPS check
    if (snapshot.scroll.avgFps > 0 && snapshot.scroll.avgFps < this.thresholds.scroll.minFps) {
      results.push({
        shouldAlert: true,
        severity: 'warning',
        category: 'scroll',
        title: 'Poor Scroll Performance',
        message: `Average scroll FPS is ${snapshot.scroll.avgFps.toFixed(2)}, below threshold of ${this.thresholds.scroll.minFps}`,
        metadata: {
          avgFps: snapshot.scroll.avgFps,
          minFps: snapshot.scroll.minFps,
          threshold: this.thresholds.scroll.minFps,
          jankPercentage: snapshot.scroll.jankPercentage,
        },
      });
    }

    // Jank percentage check
    if (snapshot.scroll.jankPercentage > this.thresholds.scroll.jankPercent) {
      results.push({
        shouldAlert: true,
        severity: 'warning',
        category: 'scroll',
        title: 'High Scroll Jank',
        message: `Scroll jank is ${snapshot.scroll.jankPercentage.toFixed(2)}%, above threshold of ${this.thresholds.scroll.jankPercent}%`,
        metadata: {
          jankPercentage: snapshot.scroll.jankPercentage,
          threshold: this.thresholds.scroll.jankPercent,
          avgFps: snapshot.scroll.avgFps,
        },
      });
    }

    return results;
  }

  /**
   * Check tab sync-related thresholds
   */
  checkTabSync(snapshot: PerformanceSnapshot): AlertRuleResult[] {
    const results: AlertRuleResult[] = [];

    // Latency check
    if (snapshot.tabSync.p95Latency > this.thresholds.tabSync.latency) {
      results.push({
        shouldAlert: true,
        severity: 'warning',
        category: 'tab_sync',
        title: 'Slow Tab Synchronization',
        message: `P95 tab sync latency is ${snapshot.tabSync.p95Latency.toFixed(2)}ms, above threshold of ${this.thresholds.tabSync.latency}ms`,
        metadata: {
          p95Latency: snapshot.tabSync.p95Latency,
          threshold: this.thresholds.tabSync.latency,
          avgLatency: snapshot.tabSync.avgLatency,
          operations: snapshot.tabSync.count,
        },
      });
    }

    // Failure rate check
    if (snapshot.tabSync.count > 0) {
      const failureRate = (snapshot.tabSync.failures / snapshot.tabSync.count) * 100;

      if (failureRate > this.thresholds.tabSync.failureRate) {
        results.push({
          shouldAlert: true,
          severity: 'error',
          category: 'tab_sync',
          title: 'High Tab Sync Failure Rate',
          message: `Tab sync failure rate is ${failureRate.toFixed(2)}%, above threshold of ${this.thresholds.tabSync.failureRate}%`,
          metadata: {
            failureRate,
            threshold: this.thresholds.tabSync.failureRate,
            failures: snapshot.tabSync.failures,
            total: snapshot.tabSync.count,
          },
        });
      }
    }

    return results;
  }
}
