/**
 * Priority management and scheduling utilities
 *
 * Extracted from queue-utils.ts for modularity
 */

import { CronPatterns } from './queue-utils-types';

/**
 * Helper function to validate cron patterns
 */
export function validateCronPattern(pattern: string): boolean {
  // Basic cron pattern validation (5 fields)
  const parts = pattern.split(' ');
  if (parts.length !== 5) return false;

  // Each part should be valid cron syntax
  const cronRegex = /^(\*|\d+(-\d+)?)(\/\d+)?$/;
  return parts.every(part => {
    if (part.includes(',')) {
      return part.split(',').every(p => cronRegex.test(p.trim()));
    }
    return cronRegex.test(part);
  });
}

/**
 * Calculate next run time for a cron pattern
 */
export function getNextRunTime(cronPattern: string): Date | null {
  if (!validateCronPattern(cronPattern)) {
    return null;
  }

  // This is a simplified implementation
  // In production, use a proper cron parsing library like node-cron
  const now = new Date();
  const nextHour = new Date(now.getTime() + 60 * 60 * 1000);
  return nextHour;
}

/**
 * Priority scheduling utilities
 */
export class PriorityScheduler {
  /**
   * Calculate optimal stagger delay based on job count
   */
  static calculateStaggerDelay(jobCount: number): number {
    // Use a smaller delay for fewer jobs, larger for more
    if (jobCount <= 10) return 500; // 0.5 seconds
    if (jobCount <= 50) return 1000; // 1 second
    if (jobCount <= 100) return 2000; // 2 seconds
    return 3000; // 3 seconds for very large batches
  }

  /**
   * Get recommended cron pattern based on frequency requirement
   */
  static getRecommendedCronPattern(frequency: 'frequent' | 'regular' | 'infrequent'): string {
    switch (frequency) {
      case 'frequent':
        return CronPatterns.EVERY_15_MINUTES;
      case 'regular':
        return CronPatterns.EVERY_6_HOURS;
      case 'infrequent':
        return CronPatterns.DAILY_AT_MIDNIGHT;
      default:
        return CronPatterns.EVERY_HOUR;
    }
  }

  /**
   * Validate that a delay value is reasonable
   */
  static validateDelay(delay: number): boolean {
    // Delay should be between 0 and 24 hours (in milliseconds)
    return delay >= 0 && delay <= 24 * 60 * 60 * 1000;
  }
}

/**
 * Export all scheduling utilities
 */
export const SchedulingUtils = {
  validateCronPattern,
  getNextRunTime,
  PriorityScheduler,
  CronPatterns,
} as const;
