/**
 * Persistence Statistics Calculators
 * Pure calculation functions for persistence metrics
 */

import type {
  PersistenceMetric,
  PersistenceStats,
  SessionRestorationMetric,
  CrossPageNavigationMetric,
} from './persistence-monitor';

export function calculatePersistenceStats(
  metrics: PersistenceMetric[],
  dataLossCount: number
): PersistenceStats {
  const totalOperations = metrics.length;
  const successCount = metrics.filter((m) => m.success).length;
  const failureCount = totalOperations - successCount;

  const durations = metrics.map((m) => m.duration).sort((a, b) => a - b);
  const avgDuration = durations.reduce((a, b) => a + b, 0) / (durations.length || 1);

  // Count errors by type
  const errorsByType: Record<string, number> = {};
  metrics
    .filter((m) => !m.success && m.errorType)
    .forEach((m) => {
      const type = m.errorType!;
      errorsByType[type] = (errorsByType[type] || 0) + 1;
    });

  return {
    totalOperations,
    successCount,
    failureCount,
    successRate: totalOperations > 0 ? (successCount / totalOperations) * 100 : 100,
    avgDuration,
    p50Duration: percentile(durations, 50),
    p95Duration: percentile(durations, 95),
    p99Duration: percentile(durations, 99),
    dataLossIncidents: dataLossCount,
    errorsByType,
    lastUpdated: new Date(),
  };
}

export function calculateRestorationStats(restorations: SessionRestorationMetric[]): {
  totalRestorations: number;
  successCount: number;
  failureCount: number;
  successRate: number;
  avgDuration: number;
  avgMessagesRestored: number;
  errorsByType: Record<string, number>;
} {
  const totalRestorations = restorations.length;
  const successCount = restorations.filter((r) => r.success).length;
  const failureCount = totalRestorations - successCount;

  const durations = restorations.map((r) => r.duration);
  const avgDuration = durations.reduce((a, b) => a + b, 0) / (durations.length || 1);

  const messagesRestored = restorations.map((r) => r.messagesRestored);
  const avgMessagesRestored =
    messagesRestored.reduce((a, b) => a + b, 0) / (messagesRestored.length || 1);

  const errorsByType: Record<string, number> = {};
  restorations
    .filter((r) => !r.success && r.errorType)
    .forEach((r) => {
      const type = r.errorType!;
      errorsByType[type] = (errorsByType[type] || 0) + 1;
    });

  return {
    totalRestorations,
    successCount,
    failureCount,
    successRate: totalRestorations > 0 ? (successCount / totalRestorations) * 100 : 100,
    avgDuration,
    avgMessagesRestored,
    errorsByType,
  };
}

export function calculateNavigationStats(navigations: CrossPageNavigationMetric[]): {
  totalNavigations: number;
  successCount: number;
  dataPreservedCount: number;
  dataLossCount: number;
  avgDuration: number;
} {
  const totalNavigations = navigations.length;
  const successCount = navigations.filter((n) => n.success).length;
  const dataPreservedCount = navigations.filter((n) => n.dataPreserved).length;
  const dataLossCount = totalNavigations - dataPreservedCount;

  const durations = navigations.map((n) => n.duration);
  const avgDuration = durations.reduce((a, b) => a + b, 0) / (durations.length || 1);

  return {
    totalNavigations,
    successCount,
    dataPreservedCount,
    dataLossCount,
    avgDuration,
  };
}

function percentile(sortedArray: number[], percentile: number): number {
  if (sortedArray.length === 0) return 0;
  const index = Math.ceil((percentile / 100) * sortedArray.length) - 1;
  return sortedArray[Math.max(0, index)];
}
