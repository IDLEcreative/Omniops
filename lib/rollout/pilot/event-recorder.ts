/**
 * Event Recording
 *
 * Purpose: Records rollout events and triggers automatic rollbacks
 * Last Updated: 2025-11-03
 */

import { createServiceRoleClientSync } from '@/lib/supabase-server';
import { getRolloutConfig } from './config-loader';
import { getRolloutStats } from './statistics';
import { rollbackFeature } from './rollback';
import type { RolloutEvent } from './types';

/**
 * Record rollout event
 */
export async function recordEvent(event: RolloutEvent): Promise<void> {
  try {
    const supabase = createServiceRoleClientSync();
    if (!supabase) return;

    await supabase.from('rollout_events').insert({
      feature_name: event.featureName,
      customer_id: event.customerId,
      event: event.event,
      timestamp: event.timestamp.toISOString(),
      metadata: event.metadata || {},
    });

    // Check if we should auto-rollback
    const config = await getRolloutConfig(event.featureName);
    if (config && event.event === 'error') {
      const stats = await getRolloutStats(event.featureName);
      if (stats.errorRate > config.rollbackThreshold.errorRate) {
        await rollbackFeature(
          event.featureName,
          `Automatic rollback: error rate ${(stats.errorRate * 100).toFixed(2)}% exceeds threshold ${(config.rollbackThreshold.errorRate * 100).toFixed(2)}%`
        );
      }
    }
  } catch (error) {
    console.error('Error recording rollout event:', error);
  }
}
