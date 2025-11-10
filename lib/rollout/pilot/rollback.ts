/**
 * Rollback Control
 *
 * Purpose: Handles feature rollbacks when issues are detected
 * Last Updated: 2025-11-03
 */

import { createServiceRoleClientSync } from '@/lib/supabase-server';
import { RolloutStatus, RolloutTier } from './types';

/**
 * Rollback feature to previous tier
 */
export async function rollbackFeature(
  featureName: string,
  reason: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createServiceRoleClientSync();
    if (!supabase) {
      return { success: false, error: 'Database service unavailable' };
    }

    // Update status to rolled back
    const { error } = await supabase
      .from('feature_rollouts')
      .update({
        status: RolloutStatus.ROLLED_BACK,
        current_tier: RolloutTier.TIER_0_DISABLED,
        percentage: 0,
        updated_at: new Date().toISOString(),
      })
      .eq('feature_name', featureName);

    if (error) {
      return { success: false, error: error.message };
    }

    // Log rollback event
    await supabase.from('rollout_events').insert({
      feature_name: featureName,
      event_type: 'rollback',
      reason,
      timestamp: new Date().toISOString(),
    });

    return { success: true };
  } catch (error) {
    console.error('Error rolling back feature:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
