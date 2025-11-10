/**
 * Feature Flag Evaluation Engine
 *
 * Purpose: Core logic for evaluating feature flags with fallback hierarchy
 * Last Updated: 2025-11-08
 */

import { DEFAULT_CHAT_WIDGET_CONFIG, getEnvironmentConfig } from '@/lib/chat-widget/default-config';
import type { ChatWidgetFeatureFlags } from '@/lib/chat-widget/default-config';
import { FlagSource, type FlagEvaluation } from './types';
import { FlagCache } from './cache';
import { getCustomerOverride, getOrganizationOverride } from './storage';
import { mergeFlags } from './merge';

/**
 * Feature flag evaluator with caching and fallback logic
 */
export class FlagEvaluator {
  private cache: FlagCache;

  constructor(cacheTTL?: number) {
    this.cache = new FlagCache(cacheTTL);
  }

  /**
   * Evaluate feature flags with priority hierarchy
   *
   * Priority order:
   * 1. Customer-specific overrides (database)
   * 2. Organization-wide overrides (database)
   * 3. Environment-based defaults
   * 4. System defaults
   */
  async evaluate(params: {
    customerId?: string;
    organizationId?: string;
  }): Promise<FlagEvaluation> {
    const { customerId, organizationId } = params;
    const cacheKey = this.cache.generateKey(customerId, organizationId);

    // Check cache first
    const cached = this.cache.getEntry(cacheKey);
    if (cached) {
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
        const customerOverride = await getCustomerOverride(customerId);
        if (customerOverride) {
          const config = mergeFlags(DEFAULT_CHAT_WIDGET_CONFIG, customerOverride);
          this.cache.set(cacheKey, config);
          return {
            config,
            source: FlagSource.CUSTOMER_OVERRIDE,
            customerId,
            organizationId,
            evaluatedAt: new Date(),
          };
        }
      }

      // Try organization-wide override
      if (organizationId) {
        const orgOverride = await getOrganizationOverride(organizationId);
        if (orgOverride) {
          const config = mergeFlags(DEFAULT_CHAT_WIDGET_CONFIG, orgOverride);
          this.cache.set(cacheKey, config);
          return {
            config,
            source: FlagSource.ORGANIZATION_OVERRIDE,
            customerId,
            organizationId,
            evaluatedAt: new Date(),
          };
        }
      }

      // Fall back to environment-based defaults
      const envConfig = getEnvironmentConfig();
      this.cache.set(cacheKey, envConfig);
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
   * Get cache instance for external management
   */
  getCache(): FlagCache {
    return this.cache;
  }
}
