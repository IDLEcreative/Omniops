/**
 * Feature Flag Change Tracking
 *
 * Purpose: Audit trail for feature flag modifications
 * Last Updated: 2025-11-08
 */

import { createServiceRoleClientSync } from '@/lib/supabase-server';
import type { ChatWidgetFeatureFlags } from '@/lib/chat-widget/default-config';
import type { FlagChangeEvent } from './types';

/**
 * Detect changes between old and new configs
 *
 * Returns array of individual flag changes with paths
 */
export function detectChanges(
  oldConfig: ChatWidgetFeatureFlags,
  newConfig: Partial<ChatWidgetFeatureFlags>
): Array<{ flagPath: string; oldValue: boolean; newValue: boolean }> {
  const changes: Array<{ flagPath: string; oldValue: boolean; newValue: boolean }> = [];

  // Check session persistence phases
  if (newConfig.sessionPersistence) {
    ['phase1', 'phase2', 'phase3'].forEach(phase => {
      const phaseKey = phase as 'phase1' | 'phase2' | 'phase3';
      if (newConfig.sessionPersistence?.[phaseKey]) {
        Object.entries(newConfig.sessionPersistence[phaseKey]!).forEach(([key, value]) => {
          const oldValue = oldConfig.sessionPersistence[phaseKey][key as keyof typeof oldConfig.sessionPersistence.phase1];
          if (oldValue !== value) {
            changes.push({
              flagPath: `sessionPersistence.${phase}.${key}`,
              oldValue: oldValue as boolean,
              newValue: value as boolean,
            });
          }
        });
      }
    });
  }

  // Check experimental features
  if (newConfig.experimental) {
    Object.entries(newConfig.experimental).forEach(([key, value]) => {
      const oldValue = oldConfig.experimental[key as keyof typeof oldConfig.experimental];
      if (oldValue !== value) {
        changes.push({
          flagPath: `experimental.${key}`,
          oldValue: oldValue as boolean,
          newValue: value as boolean,
        });
      }
    });
  }

  return changes;
}

/**
 * Log feature flag changes to database for audit trail
 */
export async function logFlagChanges(
  oldConfig: ChatWidgetFeatureFlags,
  newConfig: Partial<ChatWidgetFeatureFlags>,
  context: {
    customerId?: string;
    organizationId?: string;
    changedBy?: string;
    reason?: string;
  }
): Promise<void> {
  try {
    const changes = detectChanges(oldConfig, newConfig);
    if (changes.length === 0) return;

    const supabase = createServiceRoleClientSync();
    if (!supabase) return;

    const events: FlagChangeEvent[] = changes.map(change => ({
      ...context,
      ...change,
      changedAt: new Date(),
    }));

    await supabase.from('feature_flag_changes').insert(events);
  } catch (error) {
    console.error('Error logging feature flag changes:', error);
    // Don't fail the operation if logging fails
  }
}
