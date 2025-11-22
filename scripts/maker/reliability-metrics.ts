/**
 * MAKER Framework - Reliability Metrics Module
 *
 * @purpose Calculate error propagation and reliability metrics
 *
 * @flow
 *   1. Input per-step accuracy and total steps
 *   2. → Calculate predicted success rate over N steps
 *   3. → Return metrics with confidence intervals
 *
 * @keyFunctions
 *   - calculateReliabilityMetrics (line 43): Calculate single metrics
 *   - compareReliability (line 75): Compare traditional vs MAKER
 *
 * @handles
 *   - Error propagation calculations
 *   - Success rate predictions
 *   - Confidence intervals (95%)
 *   - Performance comparisons
 *
 * @returns ReliabilityMetrics object
 *
 * @dependencies
 *   - ./types.ts (ReliabilityMetrics)
 *
 * @consumers
 *   - scripts/maker/voting-v2-complete.ts
 *
 * @totalLines 86
 * @estimatedTokens 330 (without header), 430 (with header - 23% savings)
 */

import { ReliabilityMetrics } from './types';

/**
 * Calculate reliability metrics for a workflow
 * Based on paper's error propagation analysis
 */
export function calculateReliabilityMetrics(
  perStepAccuracy: number,
  totalSteps: number
): ReliabilityMetrics {
  // Error rate per step
  const errorRate = 1 - perStepAccuracy;

  // Predicted success rate over N steps
  const predictedSuccessRate = Math.pow(perStepAccuracy, totalSteps);

  // Confidence interval (95%) using binomial distribution
  const z = 1.96; // 95% confidence
  const p = perStepAccuracy;
  const n = totalSteps;

  const stderr = Math.sqrt((p * (1 - p)) / n);
  const lowerBound = Math.max(0, Math.pow(p - z * stderr, n));
  const upperBound = Math.min(1, Math.pow(p + z * stderr, n));

  return {
    per_step_accuracy: perStepAccuracy,
    total_steps: totalSteps,
    predicted_success_rate: predictedSuccessRate,
    error_rate: errorRate,
    confidence_interval: [lowerBound, upperBound],
  };
}

/**
 * Compare traditional vs MAKER reliability
 */
export function compareReliability(
  baseAccuracy: number,
  votingAccuracy: number,
  totalSteps: number
) {
  const traditional = calculateReliabilityMetrics(baseAccuracy, totalSteps);
  const maker = calculateReliabilityMetrics(votingAccuracy, totalSteps);

  const improvement = (maker.predicted_success_rate - traditional.predicted_success_rate) /
                      traditional.predicted_success_rate * 100;

  return {
    traditional,
    maker,
    improvement_percentage: improvement,
  };
}
