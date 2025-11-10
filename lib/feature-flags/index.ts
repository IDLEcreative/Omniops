/**
 * Feature Flag Management System
 *
 * Purpose: Centralized feature flag evaluation with database overrides,
 * environment-based defaults, and per-customer customization.
 *
 * Last Updated: 2025-11-08
 * Status: Active
 *
 * Features:
 * - Environment-based default flags (dev/staging/production)
 * - Per-customer flag overrides from database
 * - Fallback to defaults on errors
 * - Logging and analytics for flag changes
 * - Cache for performance
 *
 * Architecture: Modular design with separation of concerns
 * - types.ts: Type definitions
 * - cache.ts: In-memory caching
 * - storage.ts: Database operations
 * - merge.ts: Config merging logic
 * - change-tracking.ts: Audit trail
 * - evaluator.ts: Core evaluation engine
 */

import type { ChatWidgetFeatureFlags } from '@/lib/chat-widget/default-config';
import { FlagEvaluator } from './core/evaluator';
import { saveCustomerFlags, saveOrganizationFlags } from './core/storage';
import { logFlagChanges } from './core/change-tracking';

// Re-export public types
export { FlagSource, type FlagEvaluation, type FlagChangeEvent } from './core/types';

/**
 * Feature Flag Manager
 *
 * Main orchestrator for feature flag operations
 */
export class FeatureFlagManager {
  private evaluator: FlagEvaluator;

  constructor(cacheTTL?: number) {
    this.evaluator = new FlagEvaluator(cacheTTL);
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
  }) {
    return this.evaluator.evaluate(params);
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
      // Get current flags for change tracking
      const current = await this.getFlags({ customerId });

      // Update database
      const result = await saveCustomerFlags(customerId, flags, changedBy);
      if (!result.success) {
        return result;
      }

      // Clear cache
      this.invalidateCache(customerId);

      // Log change
      await logFlagChanges(current.config, flags, {
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
      // Get current flags for change tracking
      const current = await this.getFlags({ organizationId });

      // Update database
      const result = await saveOrganizationFlags(organizationId, flags, changedBy);
      if (!result.success) {
        return result;
      }

      // Clear cache for all customers in organization
      this.invalidateCacheForOrganization(organizationId);

      // Log change
      await logFlagChanges(current.config, flags, {
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
   * Invalidate cache for a customer
   */
  invalidateCache(customerId: string): void {
    this.evaluator.getCache().invalidateCustomer(customerId);
  }

  /**
   * Invalidate cache for all customers in an organization
   */
  invalidateCacheForOrganization(organizationId: string): void {
    this.evaluator.getCache().invalidateOrganization(organizationId);
  }

  /**
   * Clear entire cache (use sparingly)
   */
  clearCache(): void {
    this.evaluator.getCache().clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; keys: string[] } {
    return this.evaluator.getCache().getStats();
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
