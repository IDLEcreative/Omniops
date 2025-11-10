/**
 * Feature Flag Type Definitions
 *
 * Purpose: Core types and interfaces for feature flag system
 * Last Updated: 2025-11-08
 */

import type { ChatWidgetFeatureFlags } from '@/lib/chat-widget/default-config';

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
 * Cache entry structure
 */
export interface CacheEntry {
  config: ChatWidgetFeatureFlags;
  timestamp: number;
}
