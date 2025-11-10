/**
 * Pilot Rollout Manager
 *
 * Purpose: Gradual feature rollout with percentage-based targeting,
 * A/B testing, and safe rollback capabilities.
 *
 * Last Updated: 2025-11-03
 * Status: Active
 *
 * Features:
 * - Tiered rollout (Internal → Early Adopters → General → Full)
 * - Percentage-based gradual rollout
 * - Customer whitelist/blacklist
 * - A/B testing support
 * - Automatic rollback on errors
 * - Rollout status tracking
 */

// Re-export all types
export type {
  RolloutConfig,
  RolloutEvent,
  RolloutStats,
} from './pilot/types';

export {
  RolloutTier,
  RolloutStatus,
} from './pilot/types';

// Import module functions
import { getRolloutConfig } from './pilot/config-loader';
import { shouldEnableFeature } from './pilot/selection';
import { advanceRollout } from './pilot/tier-management';
import { rollbackFeature } from './pilot/rollback';
import { getRolloutStats } from './pilot/statistics';
import { recordEvent } from './pilot/event-recorder';
import { createRollout, startRollout } from './pilot/lifecycle';

import type {
  RolloutConfig,
  RolloutEvent,
  RolloutStats,
} from './pilot/types';

import type { RolloutTier } from './pilot/types';

/**
 * Pilot Rollout Manager
 *
 * Manages gradual feature rollout with safety controls
 */
export class PilotRolloutManager {
  /**
   * Get rollout configuration for a feature
   */
  async getRolloutConfig(featureName: string): Promise<RolloutConfig | null> {
    return getRolloutConfig(featureName);
  }

  /**
   * Check if feature should be enabled for a customer
   */
  async shouldEnableFeature(
    featureName: string,
    customerId: string
  ): Promise<boolean> {
    return shouldEnableFeature(featureName, customerId);
  }

  /**
   * Advance rollout to next tier
   */
  async advanceRollout(featureName: string): Promise<{
    success: boolean;
    newTier?: RolloutTier;
    error?: string;
  }> {
    return advanceRollout(featureName);
  }

  /**
   * Rollback feature to previous tier
   */
  async rollbackFeature(
    featureName: string,
    reason: string
  ): Promise<{ success: boolean; error?: string }> {
    return rollbackFeature(featureName, reason);
  }

  /**
   * Get rollout statistics
   */
  async getRolloutStats(featureName: string): Promise<RolloutStats> {
    return getRolloutStats(featureName);
  }

  /**
   * Record rollout event
   */
  async recordEvent(event: RolloutEvent): Promise<void> {
    return recordEvent(event);
  }

  /**
   * Create new rollout configuration
   */
  async createRollout(config: {
    featureName: string;
    whitelistedCustomers?: string[];
    rollbackThreshold?: { errorRate: number; timeWindow: number };
  }): Promise<{ success: boolean; error?: string }> {
    return createRollout(config);
  }

  /**
   * Start rollout (move to Tier 1 - Internal)
   */
  async startRollout(featureName: string): Promise<{
    success: boolean;
    error?: string;
  }> {
    return startRollout(featureName);
  }
}

/**
 * Singleton instance
 */
let pilotRolloutManager: PilotRolloutManager | null = null;

/**
 * Get pilot rollout manager instance
 */
export function getPilotRolloutManager(): PilotRolloutManager {
  if (!pilotRolloutManager) {
    pilotRolloutManager = new PilotRolloutManager();
  }
  return pilotRolloutManager;
}
