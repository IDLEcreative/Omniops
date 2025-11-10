/**
 * Tier Management
 *
 * Purpose: Handles tier progression and percentage calculations
 * Last Updated: 2025-11-03
 */

import { createServiceRoleClientSync } from '@/lib/supabase-server';
import { getRolloutConfig } from './config-loader';
import { getRolloutStats } from './statistics';
import { RolloutTier } from './types';

/**
 * Advance rollout to next tier
 */
export async function advanceRollout(featureName: string): Promise<{
  success: boolean;
  newTier?: RolloutTier;
  error?: string;
}> {
  try {
    const config = await getRolloutConfig(featureName);
    if (!config) {
      return { success: false, error: 'Feature not found' };
    }

    // Check if we can advance
    const stats = await getRolloutStats(featureName);
    if (stats.errorRate > config.rollbackThreshold.errorRate) {
      return {
        success: false,
        error: `Error rate too high: ${(stats.errorRate * 100).toFixed(2)}%`,
      };
    }

    // Determine next tier
    const nextTier = getNextTier(config.currentTier);
    if (!nextTier) {
      return {
        success: false,
        error: 'Already at maximum tier',
      };
    }

    // Update configuration
    const supabase = createServiceRoleClientSync();
    if (!supabase) {
      return { success: false, error: 'Database service unavailable' };
    }

    const { error } = await supabase
      .from('feature_rollouts')
      .update({
        current_tier: nextTier,
        percentage: getTierPercentage(nextTier),
        updated_at: new Date().toISOString(),
      })
      .eq('feature_name', featureName);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, newTier: nextTier };
  } catch (error) {
    console.error('Error advancing rollout:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get next tier in rollout sequence
 */
export function getNextTier(currentTier: RolloutTier): RolloutTier | null {
  const tierSequence = [
    RolloutTier.TIER_0_DISABLED,
    RolloutTier.TIER_1_INTERNAL,
    RolloutTier.TIER_2_EARLY_ADOPTERS,
    RolloutTier.TIER_3_GENERAL,
    RolloutTier.TIER_4_FULL,
  ];

  const currentIndex = tierSequence.indexOf(currentTier);
  if (currentIndex === -1 || currentIndex === tierSequence.length - 1) {
    return null;
  }

  return tierSequence[currentIndex + 1] ?? null;
}

/**
 * Get percentage for a tier
 */
export function getTierPercentage(tier: RolloutTier): number {
  const percentages: Record<RolloutTier, number> = {
    [RolloutTier.TIER_0_DISABLED]: 0,
    [RolloutTier.TIER_1_INTERNAL]: 1,
    [RolloutTier.TIER_2_EARLY_ADOPTERS]: 10,
    [RolloutTier.TIER_3_GENERAL]: 50,
    [RolloutTier.TIER_4_FULL]: 100,
  };

  return percentages[tier] || 0;
}
