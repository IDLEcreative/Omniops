/**
 * Rollout Configuration Loader
 *
 * Purpose: Handles loading rollout configurations from database
 * Last Updated: 2025-11-03
 */

import { createServiceRoleClientSync } from '@/lib/supabase-server';
import type { RolloutConfig } from './types';

/**
 * Get rollout configuration for a feature from database
 */
export async function getRolloutConfig(featureName: string): Promise<RolloutConfig | null> {
  try {
    const supabase = createServiceRoleClientSync();
    if (!supabase) return null;

    const { data, error } = await supabase
      .from('feature_rollouts')
      .select('*')
      .eq('feature_name', featureName)
      .single();

    if (error || !data) {
      return null;
    }

    return {
      featureName: data.feature_name,
      currentTier: data.current_tier,
      targetTier: data.target_tier,
      percentage: data.percentage,
      status: data.status,
      startedAt: data.started_at ? new Date(data.started_at) : undefined,
      completedAt: data.completed_at ? new Date(data.completed_at) : undefined,
      whitelistedCustomers: data.whitelisted_customers || [],
      blacklistedCustomers: data.blacklisted_customers || [],
      rollbackThreshold: data.rollback_threshold || {
        errorRate: 0.05, // 5% error rate triggers rollback
        timeWindow: 3600000, // 1 hour
      },
    };
  } catch (error) {
    console.error('Error fetching rollout config:', error);
    return null;
  }
}
