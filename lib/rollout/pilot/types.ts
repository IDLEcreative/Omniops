/**
 * Pilot Rollout Type Definitions
 *
 * Purpose: Core types, enums, and interfaces for the pilot rollout system
 * Last Updated: 2025-11-03
 */

/**
 * Rollout Tier Definitions
 */
export enum RolloutTier {
  TIER_0_DISABLED = 'tier_0_disabled',           // Feature disabled (0%)
  TIER_1_INTERNAL = 'tier_1_internal',           // Internal testing only (1-2 customers)
  TIER_2_EARLY_ADOPTERS = 'tier_2_early_adopters', // Early adopters (10% of customers)
  TIER_3_GENERAL = 'tier_3_general',             // General rollout (50% of customers)
  TIER_4_FULL = 'tier_4_full',                   // Full rollout (100% of customers)
}

/**
 * Rollout Status
 */
export enum RolloutStatus {
  PLANNED = 'planned',                           // Not started yet
  IN_PROGRESS = 'in_progress',                   // Currently rolling out
  PAUSED = 'paused',                             // Temporarily paused
  COMPLETED = 'completed',                       // Fully rolled out
  ROLLED_BACK = 'rolled_back',                   // Rolled back due to issues
}

/**
 * Rollout Configuration
 */
export interface RolloutConfig {
  featureName: string;                           // e.g., "phase2_enhanced_storage"
  currentTier: RolloutTier;
  targetTier: RolloutTier;
  percentage: number;                            // 0-100
  status: RolloutStatus;
  startedAt?: Date;
  completedAt?: Date;
  whitelistedCustomers: string[];                // Always included
  blacklistedCustomers: string[];                // Always excluded
  rollbackThreshold: {
    errorRate: number;                           // Max error rate (0-1)
    timeWindow: number;                          // Time window in ms
  };
}

/**
 * Rollout Event
 */
export interface RolloutEvent {
  featureName: string;
  customerId: string;
  event: 'enabled' | 'disabled' | 'error';
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

/**
 * Rollout Statistics
 */
export interface RolloutStats {
  featureName: string;
  totalCustomers: number;
  enabledCustomers: number;
  errorCount: number;
  errorRate: number;
  successRate: number;
  averagePerformance?: number;
}
