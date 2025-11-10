/**
 * Alert Rule Checkers
 * Individual checking functions for different alert categories
 */

import type { PersistenceStats } from './persistence-monitor';
import type { PerformanceSnapshot } from './performance-collector';
import type { AlertRuleResult, AlertThresholds } from './alert-rules';

export function checkPersistenceRules(
  stats: PersistenceStats,
  thresholds: AlertThresholds
): AlertRuleResult[] {
  const results: AlertRuleResult[] = [];

  // Success rate check
  if (stats.successRate < thresholds.persistence.successRate) {
    results.push({
      shouldAlert: true,
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
    results.push({
      shouldAlert: true,
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

export function checkMemoryRules(
  snapshot: PerformanceSnapshot,
  thresholds: AlertThresholds
): AlertRuleResult[] {
  const results: AlertRuleResult[] = [];

  if (snapshot.memory.peak > thresholds.memory.maxUsage) {
    const peakMB = snapshot.memory.peak / 1024 / 1024;
    const thresholdMB = thresholds.memory.maxUsage / 1024 / 1024;

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

export function checkScrollRules(
  snapshot: PerformanceSnapshot,
  thresholds: AlertThresholds
): AlertRuleResult[] {
  const results: AlertRuleResult[] = [];

  // FPS check
  if (snapshot.scroll.avgFps > 0 && snapshot.scroll.avgFps < thresholds.scroll.minFps) {
    results.push({
      shouldAlert: true,
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
    results.push({
      shouldAlert: true,
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

  return results;
}
