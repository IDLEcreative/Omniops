/**
 * Threshold Checker Service
 *
 * Coordinates threshold checking across all alert rules.
 * Single Responsibility: Orchestrate threshold checks and baseline comparisons
 */

import { getPersistenceStats, type PersistenceStats } from './persistence-monitor';
import { getPerformanceSnapshot, type PerformanceSnapshot } from './performance-collector';
import { AlertRules, type AlertRuleResult } from './alert-rules';

export interface BaselineMetrics {
  persistence?: PersistenceStats;
  performance?: PerformanceSnapshot;
  timestamp?: Date;
}

/**
 * Threshold checker - orchestrates all threshold checks
 */
export class ThresholdChecker {
  private baseline: BaselineMetrics = {};

  constructor(private rules: AlertRules) {}

  /**
   * Check all thresholds and return alert results
   */
  checkAll(windowMs: number = 300000): AlertRuleResult[] {
    const persistenceStats = getPersistenceStats(windowMs);
    const performanceSnapshot = getPerformanceSnapshot(windowMs);

    const results: AlertRuleResult[] = [
      ...this.rules.checkPersistence(persistenceStats),
      ...this.rules.checkPerformance(performanceSnapshot, this.baseline.performance),
      ...this.rules.checkMemory(performanceSnapshot),
      ...this.rules.checkAPI(performanceSnapshot),
      ...this.rules.checkScroll(performanceSnapshot),
      ...this.rules.checkTabSync(performanceSnapshot),
    ];

    return results.filter((r) => r.shouldAlert);
  }

  /**
   * Capture performance baseline for degradation detection
   */
  captureBaseline(): void {
    this.baseline = {
      persistence: getPersistenceStats(),
      performance: getPerformanceSnapshot(),
      timestamp: new Date(),
    };
  }

  /**
   * Get current baseline metrics
   */
  getBaseline(): BaselineMetrics {
    return { ...this.baseline };
  }

  /**
   * Reset baseline
   */
  resetBaseline(): void {
    this.baseline = {};
  }
}
