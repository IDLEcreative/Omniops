/**
 * Rollout Lifecycle Management
 *
 * Purpose: Handles creating and starting rollouts
 * Last Updated: 2025-11-03
 */

import { createServiceRoleClientSync } from '@/lib/supabase-server';
import { RolloutTier, RolloutStatus } from './types';

/**
 * Create new rollout configuration
 */
export async function createRollout(config: {
  featureName: string;
  whitelistedCustomers?: string[];
  rollbackThreshold?: { errorRate: number; timeWindow: number };
}): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createServiceRoleClientSync();
    if (!supabase) {
      return { success: false, error: 'Database service unavailable' };
    }

    const { error } = await supabase.from('feature_rollouts').insert({
      feature_name: config.featureName,
      current_tier: RolloutTier.TIER_0_DISABLED,
      target_tier: RolloutTier.TIER_4_FULL,
      percentage: 0,
      status: RolloutStatus.PLANNED,
      whitelisted_customers: config.whitelistedCustomers || [],
      blacklisted_customers: [],
      rollback_threshold: config.rollbackThreshold || {
        errorRate: 0.05,
        timeWindow: 3600000,
      },
      created_at: new Date().toISOString(),
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Error creating rollout:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Start rollout (move to Tier 1 - Internal)
 */
export async function startRollout(featureName: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const supabase = createServiceRoleClientSync();
    if (!supabase) {
      return { success: false, error: 'Database service unavailable' };
    }

    const { error } = await supabase
      .from('feature_rollouts')
      .update({
        current_tier: RolloutTier.TIER_1_INTERNAL,
        percentage: 1,
        status: RolloutStatus.IN_PROGRESS,
        started_at: new Date().toISOString(),
      })
      .eq('feature_name', featureName);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Error starting rollout:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
