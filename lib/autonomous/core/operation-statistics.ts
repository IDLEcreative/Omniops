/**
 * Operation Statistics Module
 *
 * Provides statistical analysis of autonomous operations.
 * Extracted from OperationService to maintain single responsibility.
 *
 * @module lib/autonomous/core/operation-statistics
 */

import type { OperationRecord } from './operation-service';

export interface OperationStats {
  total: number;
  pending: number;
  in_progress: number;
  completed: number;
  failed: number;
  success_rate: number;
}

/**
 * Calculate operation statistics from operation records
 */
export function calculateStats(operations: OperationRecord[]): OperationStats {
  const stats: OperationStats = {
    total: operations.length,
    pending: operations.filter(op => op.status === 'pending').length,
    in_progress: operations.filter(op => op.status === 'in_progress').length,
    completed: operations.filter(op => op.status === 'completed').length,
    failed: operations.filter(op => op.status === 'failed').length,
    success_rate: 0
  };

  const finished = stats.completed + stats.failed;
  if (finished > 0) {
    stats.success_rate = Math.round((stats.completed / finished) * 100);
  }

  return stats;
}
