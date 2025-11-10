/**
 * Feature Flag Merging Utilities
 *
 * Purpose: Deep merge logic for combining default flags with overrides
 * Last Updated: 2025-11-08
 */

import type { ChatWidgetFeatureFlags } from '@/lib/chat-widget/default-config';

/**
 * Merge partial flag overrides with defaults
 *
 * Performs deep merge of nested feature flag structure
 */
export function mergeFlags(
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
