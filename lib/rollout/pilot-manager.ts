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

import { createServiceRoleClientSync } from '@/lib/supabase-server';
import { getFeatureFlagManager } from '@/lib/feature-flags';
import type { ChatWidgetFeatureFlags } from '@/lib/chat-widget/default-config';

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

  /**
   * Check if feature should be enabled for a customer
   *
   * Uses deterministic hashing to ensure consistent results
   */
  async shouldEnableFeature(
    featureName: string,
    customerId: string
  ): Promise<boolean> {
    const config = await this.getRolloutConfig(featureName);
    if (!config) {
      return false; // Feature not configured for rollout
    }

    // Check status
    if (config.status !== RolloutStatus.IN_PROGRESS && config.status !== RolloutStatus.COMPLETED) {
      return false;
    }

    // Check blacklist first
    if (config.blacklistedCustomers.includes(customerId)) {
      return false;
    }

    // Check whitelist
    if (config.whitelistedCustomers.includes(customerId)) {
      return true;
    }

    // Check percentage-based rollout using deterministic hash
    const hash = this.hashCustomerId(customerId, featureName);
    const shouldEnable = hash < config.percentage;

    return shouldEnable;
  }

  /**
   * Deterministic hash function for customer ID
   *
   * Returns a number between 0-100 based on customer ID and feature name
   * Same inputs always produce same output (deterministic)
   */
  private hashCustomerId(customerId: string, featureName: string): number {
    const input = `${customerId}:${featureName}`;
    let hash = 0;

    for (let i = 0; i < input.length; i++) {
      const char = input.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }

    // Convert to 0-100 range
    return Math.abs(hash % 100);
  }

  /**
   * Advance rollout to next tier
   */
  async advanceRollout(featureName: string): Promise<{
    success: boolean;
    newTier?: RolloutTier;
    error?: string;
  }> {
    try {
      const config = await this.getRolloutConfig(featureName);
      if (!config) {
        return { success: false, error: 'Feature not found' };
      }

      // Check if we can advance
      const stats = await this.getRolloutStats(featureName);
      if (stats.errorRate > config.rollbackThreshold.errorRate) {
        return {
          success: false,
          error: `Error rate too high: ${(stats.errorRate * 100).toFixed(2)}%`,
        };
      }

      // Determine next tier
      const nextTier = this.getNextTier(config.currentTier);
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
          percentage: this.getTierPercentage(nextTier),
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
  private getNextTier(currentTier: RolloutTier): RolloutTier | null {
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

    return tierSequence[currentIndex + 1];
  }

  /**
   * Get percentage for a tier
   */
  private getTierPercentage(tier: RolloutTier): number {
    const percentages: Record<RolloutTier, number> = {
      [RolloutTier.TIER_0_DISABLED]: 0,
      [RolloutTier.TIER_1_INTERNAL]: 1,
      [RolloutTier.TIER_2_EARLY_ADOPTERS]: 10,
      [RolloutTier.TIER_3_GENERAL]: 50,
      [RolloutTier.TIER_4_FULL]: 100,
    };

    return percentages[tier] || 0;
  }

  /**
   * Rollback feature to previous tier
   */
  async rollbackFeature(
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

  /**
   * Get rollout statistics
   */
  async getRolloutStats(featureName: string): Promise<RolloutStats> {
    try {
      const supabase = createServiceRoleClientSync();
      if (!supabase) {
        return {
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

  /**
   * Record rollout event
   */
  async recordEvent(event: RolloutEvent): Promise<void> {
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
      const config = await this.getRolloutConfig(event.featureName);
      if (config && event.event === 'error') {
        const stats = await this.getRolloutStats(event.featureName);
        if (stats.errorRate > config.rollbackThreshold.errorRate) {
          await this.rollbackFeature(
            event.featureName,
            `Automatic rollback: error rate ${(stats.errorRate * 100).toFixed(2)}% exceeds threshold ${(config.rollbackThreshold.errorRate * 100).toFixed(2)}%`
          );
        }
      }
    } catch (error) {
      console.error('Error recording rollout event:', error);
    }
  }

  /**
   * Create new rollout configuration
   */
  async createRollout(config: {
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
  async startRollout(featureName: string): Promise<{
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
