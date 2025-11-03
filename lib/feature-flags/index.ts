/**
 * Feature Flag Management System
 *
 * Purpose: Centralized feature flag evaluation with database overrides,
 * environment-based defaults, and per-customer customization.
 *
 * Last Updated: 2025-11-03
 * Status: Active
 *
 * Features:
 * - Environment-based default flags (dev/staging/production)
 * - Per-customer flag overrides from database
 * - Fallback to defaults on errors
 * - Logging and analytics for flag changes
 * - Cache for performance
 */

import { createServiceRoleClientSync } from '@/lib/supabase-server';
import type { ChatWidgetFeatureFlags } from '@/lib/chat-widget/default-config';
import { DEFAULT_CHAT_WIDGET_CONFIG, getEnvironmentConfig } from '@/lib/chat-widget/default-config';

/**
 * Feature Flag Sources (in order of priority)
 */
export enum FlagSource {
  CUSTOMER_OVERRIDE = 'customer_override',   // Highest priority
  ORGANIZATION_OVERRIDE = 'organization_override',
  ENVIRONMENT = 'environment',                // Environment-based
  DEFAULT = 'default',                        // Lowest priority
}

/**
 * Feature Flag Evaluation Result
 */
export interface FlagEvaluation {
  config: ChatWidgetFeatureFlags;
  source: FlagSource;
  customerId?: string;
  organizationId?: string;
  evaluatedAt: Date;
}

/**
 * Feature Flag Change Event
 */
export interface FlagChangeEvent {
  customerId?: string;
  organizationId?: string;
  flagPath: string;                           // e.g., "sessionPersistence.phase2.enhancedStorage"
  oldValue: boolean;
  newValue: boolean;
  changedBy?: string;                         // User ID who made the change
  changedAt: Date;
  reason?: string;                            // Why the change was made
}

/**
 * Feature Flag Manager
 *
 * Central service for evaluating feature flags with database overrides
 */
export class FeatureFlagManager {
  private cache: Map<string, { config: ChatWidgetFeatureFlags; timestamp: number }>;
  private cacheTTL: number = 5 * 60 * 1000; // 5 minutes

  constructor() {
    this.cache = new Map();
  }

  /**
   * Get feature flags for a customer
   *
   * Priority order:
   * 1. Customer-specific overrides (database)
   * 2. Organization-wide overrides (database)
   * 3. Environment-based defaults
   * 4. System defaults
   */
  async getFlags(params: {
    customerId?: string;
    organizationId?: string;
  }): Promise<FlagEvaluation> {
    const { customerId, organizationId } = params;
    const cacheKey = `${customerId || 'none'}:${organizationId || 'none'}`;

    // Check cache first
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
      return {
        config: cached.config,
        source: FlagSource.CUSTOMER_OVERRIDE, // Cached source
        customerId,
        organizationId,
        evaluatedAt: new Date(cached.timestamp),
      };
    }

    try {
      // Try customer-specific override
      if (customerId) {
        const customerConfig = await this.getCustomerOverride(customerId);
        if (customerConfig) {
          this.cache.set(cacheKey, {
            config: customerConfig,
            timestamp: Date.now(),
          });
          return {
            config: customerConfig,
            source: FlagSource.CUSTOMER_OVERRIDE,
            customerId,
            organizationId,
            evaluatedAt: new Date(),
          };
        }
      }

      // Try organization-wide override
      if (organizationId) {
        const orgConfig = await this.getOrganizationOverride(organizationId);
        if (orgConfig) {
          this.cache.set(cacheKey, {
            config: orgConfig,
            timestamp: Date.now(),
          });
          return {
            config: orgConfig,
            source: FlagSource.ORGANIZATION_OVERRIDE,
            customerId,
            organizationId,
            evaluatedAt: new Date(),
          };
        }
      }

      // Fall back to environment-based defaults
      const envConfig = getEnvironmentConfig();
      this.cache.set(cacheKey, {
        config: envConfig,
        timestamp: Date.now(),
      });
      return {
        config: envConfig,
        source: FlagSource.ENVIRONMENT,
        customerId,
        organizationId,
        evaluatedAt: new Date(),
      };
    } catch (error) {
      console.error('Error evaluating feature flags:', error);

      // Ultimate fallback: system defaults
      return {
        config: DEFAULT_CHAT_WIDGET_CONFIG,
        source: FlagSource.DEFAULT,
        customerId,
        organizationId,
        evaluatedAt: new Date(),
      };
    }
  }

  /**
   * Get customer-specific feature flag overrides
   */
  private async getCustomerOverride(customerId: string): Promise<ChatWidgetFeatureFlags | null> {
    try {
      const supabase = createServiceRoleClientSync();
      if (!supabase) return null;

      const { data, error } = await supabase
        .from('customer_feature_flags')
        .select('flags')
        .eq('customer_id', customerId)
        .single();

      if (error || !data) {
        return null;
      }

      return this.mergeFlags(DEFAULT_CHAT_WIDGET_CONFIG, data.flags);
    } catch (error) {
      console.error('Error fetching customer feature flags:', error);
      return null;
    }
  }

  /**
   * Get organization-wide feature flag overrides
   */
  private async getOrganizationOverride(
    organizationId: string
  ): Promise<ChatWidgetFeatureFlags | null> {
    try {
      const supabase = createServiceRoleClientSync();
      if (!supabase) return null;

      const { data, error } = await supabase
        .from('organization_feature_flags')
        .select('flags')
        .eq('organization_id', organizationId)
        .single();

      if (error || !data) {
        return null;
      }

      return this.mergeFlags(DEFAULT_CHAT_WIDGET_CONFIG, data.flags);
    } catch (error) {
      console.error('Error fetching organization feature flags:', error);
      return null;
    }
  }

  /**
   * Merge partial flag overrides with defaults
   */
  private mergeFlags(
    defaults: ChatWidgetFeatureFlags,
    overrides: Partial<ChatWidgetFeatureFlags>
  ): ChatWidgetFeatureFlags {
    return {
      sessionPersistence: {
        phase1: {
          ...defaults.sessionPersistence.phase1,
          ...overrides.sessionPersistence?.phase1,
        },
        phase2: {
          ...defaults.sessionPersistence.phase2,
          ...overrides.sessionPersistence?.phase2,
        },
        phase3: {
          ...defaults.sessionPersistence.phase3,
          ...overrides.sessionPersistence?.phase3,
        },
      },
      experimental: {
        ...defaults.experimental,
        ...overrides.experimental,
      },
    };
  }

  /**
   * Set feature flags for a customer
   */
  async setCustomerFlags(
    customerId: string,
    flags: Partial<ChatWidgetFeatureFlags>,
    changedBy?: string,
    reason?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const supabase = createServiceRoleClientSync();
      if (!supabase) {
        return { success: false, error: 'Database service unavailable' };
      }

      // Get current flags for change tracking
      const current = await this.getFlags({ customerId });

      // Update database
      const { error } = await supabase
        .from('customer_feature_flags')
        .upsert({
          customer_id: customerId,
          flags,
          updated_at: new Date().toISOString(),
          updated_by: changedBy,
        });

      if (error) {
        return { success: false, error: error.message };
      }

      // Clear cache
      this.invalidateCache(customerId);

      // Log change
      await this.logFlagChanges(current.config, flags, {
        customerId,
        changedBy,
        reason,
      });

      return { success: true };
    } catch (error) {
      console.error('Error setting customer feature flags:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Set feature flags for an organization
   */
  async setOrganizationFlags(
    organizationId: string,
    flags: Partial<ChatWidgetFeatureFlags>,
    changedBy?: string,
    reason?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const supabase = createServiceRoleClientSync();
      if (!supabase) {
        return { success: false, error: 'Database service unavailable' };
      }

      // Get current flags for change tracking
      const current = await this.getFlags({ organizationId });

      // Update database
      const { error } = await supabase
        .from('organization_feature_flags')
        .upsert({
          organization_id: organizationId,
          flags,
          updated_at: new Date().toISOString(),
          updated_by: changedBy,
        });

      if (error) {
        return { success: false, error: error.message };
      }

      // Clear cache for all customers in organization
      this.invalidateCacheForOrganization(organizationId);

      // Log change
      await this.logFlagChanges(current.config, flags, {
        organizationId,
        changedBy,
        reason,
      });

      return { success: true };
    } catch (error) {
      console.error('Error setting organization feature flags:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Log feature flag changes for audit trail
   */
  private async logFlagChanges(
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
      const changes = this.detectChanges(oldConfig, newConfig);
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

  /**
   * Detect changes between old and new configs
   */
  private detectChanges(
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
   * Invalidate cache for a customer
   */
  invalidateCache(customerId: string): void {
    const keysToDelete: string[] = [];
    for (const key of this.cache.keys()) {
      if (key.startsWith(`${customerId}:`)) {
        keysToDelete.push(key);
      }
    }
    keysToDelete.forEach(key => this.cache.delete(key));
  }

  /**
   * Invalidate cache for all customers in an organization
   */
  invalidateCacheForOrganization(organizationId: string): void {
    const keysToDelete: string[] = [];
    for (const key of this.cache.keys()) {
      if (key.includes(`:${organizationId}`)) {
        keysToDelete.push(key);
      }
    }
    keysToDelete.forEach(key => this.cache.delete(key));
  }

  /**
   * Clear entire cache (use sparingly)
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }
}

/**
 * Singleton instance
 */
let featureFlagManager: FeatureFlagManager | null = null;

/**
 * Get feature flag manager instance
 */
export function getFeatureFlagManager(): FeatureFlagManager {
  if (!featureFlagManager) {
    featureFlagManager = new FeatureFlagManager();
  }
  return featureFlagManager;
}

/**
 * Convenience function: Get flags for customer
 */
export async function getCustomerFlags(
  customerId: string
): Promise<ChatWidgetFeatureFlags> {
  const manager = getFeatureFlagManager();
  const evaluation = await manager.getFlags({ customerId });
  return evaluation.config;
}

/**
 * Convenience function: Get flags for organization
 */
export async function getOrganizationFlags(
  organizationId: string
): Promise<ChatWidgetFeatureFlags> {
  const manager = getFeatureFlagManager();
  const evaluation = await manager.getFlags({ organizationId });
  return evaluation.config;
}
