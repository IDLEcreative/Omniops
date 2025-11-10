/**
 * Rollout Statistics
 *
 * Purpose: Calculates and reports rollout metrics and statistics
 * Last Updated: 2025-11-03
 */

import { createServiceRoleClientSync } from '@/lib/supabase-server';
import type { RolloutStats } from './types';

/**
 * Get rollout statistics
 */
export async function getRolloutStats(featureName: string): Promise<RolloutStats> {
  try {
    const supabase = createServiceRoleClientSync();
    if (!supabase) {
      return {
        featureName,
        totalCustomers: 0,
        enabledCustomers: 0,
        errorCount: 0,
        successRate: 0,
        errorRate: 0,
      };
    }

    // Get total customers
    const { count: totalCustomers } = await supabase
      .from('customer_configs')
      .select('*', { count: 'exact', head: true });

    // Get enabled customers
    const { count: enabledCustomers } = await supabase
      .from('rollout_events')
      .select('*', { count: 'exact', head: true })
      .eq('feature_name', featureName)
      .eq('event', 'enabled');

    // Get error count
    const { count: errorCount } = await supabase
      .from('rollout_events')
      .select('*', { count: 'exact', head: true })
      .eq('feature_name', featureName)
      .eq('event', 'error');

    const total = totalCustomers || 0;
    const enabled = enabledCustomers || 0;
    const errors = errorCount || 0;

    return {
      featureName,
      totalCustomers: total,
      enabledCustomers: enabled,
      errorCount: errors,
      errorRate: enabled > 0 ? errors / enabled : 0,
      successRate: enabled > 0 ? (enabled - errors) / enabled : 0,
    };
  } catch (error) {
    console.error('Error getting rollout stats:', error);
    return {
      featureName,
      totalCustomers: 0,
      enabledCustomers: 0,
      errorCount: 0,
      errorRate: 0,
      successRate: 0,
    };
  }
}
