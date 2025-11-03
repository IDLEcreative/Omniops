/**
 * Chat Widget Default Configuration
 *
 * Purpose: Production-ready default configuration for chat widget features
 * including session persistence phases and feature flags.
 *
 * Last Updated: 2025-11-03
 * Status: Active
 *
 * Phase Rollout Strategy:
 * - Phase 1: Enabled by default (stable, production-ready)
 * - Phase 2: ENABLED BY DEFAULT (production-ready as of 2025-11-03)
 * - Phase 3: ENABLED BY DEFAULT (production-ready as of 2025-11-03)
 */

/**
 * Session Persistence Feature Phases
 *
 * Phase 1: Parent Storage (STABLE - Enabled by Default)
 * - Basic conversation persistence via parent window localStorage
 * - Cross-domain messaging for iframe communication
 * - Automatic session restoration on page reload
 * - Production-ready since 2025-11-03
 *
 * Phase 2: Enhanced Reliability (PRODUCTION - Enabled by Default)
 * - Advanced storage with compression and versioning
 * - Connection monitoring and automatic reconnection
 * - Retry logic with exponential backoff
 * - Offline mode support
 *
 * Phase 3: Advanced Features (PRODUCTION - Enabled by Default)
 * - Multi-tab synchronization via BroadcastChannel
 * - Performance optimization for 500+ messages
 * - Session analytics and tracking
 * - Memory management and virtual scrolling
 */

export interface ChatWidgetSessionConfig {
  phase1: {
    parentStorage: boolean;              // Enable parent window storage
    crossDomainMessaging: boolean;       // Enable iframe-parent communication
    autoRestore: boolean;                // Auto-restore sessions on load
  };
  phase2: {
    enhancedStorage: boolean;            // Advanced storage features
    connectionMonitoring: boolean;       // Monitor connection health
    retryLogic: boolean;                 // Auto-retry failed operations
    offlineMode: boolean;                // Support offline usage
  };
  phase3: {
    tabSync: boolean;                    // Multi-tab synchronization
    performanceMode: boolean;            // Performance optimizations
    sessionTracking: boolean;            // Track session metrics
    analytics: boolean;                  // Enable analytics collection
  };
}

export interface ChatWidgetFeatureFlags {
  sessionPersistence: ChatWidgetSessionConfig;
  experimental: {
    aiEnhancements: boolean;             // Experimental AI features
    customThemes: boolean;               // Custom theme support
    voiceInput: boolean;                 // Voice message input
  };
}

/**
 * Default Configuration - Production Ready
 *
 * This configuration is automatically applied to all widget instances
 * unless overridden via dashboard settings or API configuration.
 */
export const DEFAULT_CHAT_WIDGET_CONFIG: ChatWidgetFeatureFlags = {
  sessionPersistence: {
    // Phase 1: Enabled by default (STABLE)
    phase1: {
      parentStorage: true,               // ✅ Production ready
      crossDomainMessaging: true,        // ✅ Production ready
      autoRestore: true,                 // ✅ Production ready
    },

    // Phase 2: Enabled by default (PRODUCTION)
    phase2: {
      enhancedStorage: true,             // ✅ Production ready - Full rollout
      connectionMonitoring: true,        // ✅ Production ready - Full rollout
      retryLogic: true,                  // ✅ Production ready - Full rollout
      offlineMode: true,                 // ✅ Production ready - Full rollout
    },

    // Phase 3: Enabled by default (PRODUCTION)
    phase3: {
      tabSync: true,                     // ✅ Production ready - Full rollout
      performanceMode: true,             // ✅ Production ready - Full rollout
      sessionTracking: true,             // ✅ Production ready - Full rollout
      analytics: true,                   // ✅ Production ready - Full rollout
    },
  },

  experimental: {
    aiEnhancements: false,               // Future feature
    customThemes: false,                 // Future feature
    voiceInput: false,                   // Future feature
  },
};

/**
 * Environment-Based Configuration Overrides
 *
 * Allows different configurations for dev/staging/production
 */
export const ENVIRONMENT_OVERRIDES: Record<string, Partial<ChatWidgetFeatureFlags>> = {
  development: {
    sessionPersistence: {
      phase1: {
        parentStorage: true,
        crossDomainMessaging: true,
        autoRestore: true,
      },
      phase2: {
        enhancedStorage: true,           // Enable in dev for testing
        connectionMonitoring: true,      // Enable in dev for testing
        retryLogic: true,                // Enable in dev for testing
        offlineMode: true,               // Enable in dev for testing
      },
      phase3: {
        tabSync: true,                   // Enable in dev for testing
        performanceMode: true,           // Enable in dev for testing
        sessionTracking: true,           // Enable in dev for testing
        analytics: true,                 // Enable in dev for testing
      },
    },
    experimental: {
      aiEnhancements: true,              // Test experimental features
      customThemes: true,
      voiceInput: true,
    },
  },

  staging: {
    sessionPersistence: {
      phase1: {
        parentStorage: true,
        crossDomainMessaging: true,
        autoRestore: true,
      },
      phase2: {
        enhancedStorage: true,           // Test in staging before prod
        connectionMonitoring: true,
        retryLogic: true,
        offlineMode: false,              // Not ready yet
      },
      phase3: {
        tabSync: false,                  // Not ready for staging yet
        performanceMode: false,
        sessionTracking: false,
        analytics: false,
      },
    },
  },

  production: {
    // Use defaults (Phase 1 only)
    ...DEFAULT_CHAT_WIDGET_CONFIG,
  },
};

/**
 * Get Configuration for Current Environment
 *
 * Merges default config with environment-specific overrides
 */
export function getEnvironmentConfig(): ChatWidgetFeatureFlags {
  const env = process.env.NODE_ENV || 'production';
  const overrides = ENVIRONMENT_OVERRIDES[env] || {};

  return {
    ...DEFAULT_CHAT_WIDGET_CONFIG,
    ...overrides,
    sessionPersistence: {
      ...DEFAULT_CHAT_WIDGET_CONFIG.sessionPersistence,
      ...overrides.sessionPersistence,
      phase1: {
        ...DEFAULT_CHAT_WIDGET_CONFIG.sessionPersistence.phase1,
        ...overrides.sessionPersistence?.phase1,
      },
      phase2: {
        ...DEFAULT_CHAT_WIDGET_CONFIG.sessionPersistence.phase2,
        ...overrides.sessionPersistence?.phase2,
      },
      phase3: {
        ...DEFAULT_CHAT_WIDGET_CONFIG.sessionPersistence.phase3,
        ...overrides.sessionPersistence?.phase3,
      },
    },
    experimental: {
      ...DEFAULT_CHAT_WIDGET_CONFIG.experimental,
      ...overrides.experimental,
    },
  };
}

/**
 * Validate Configuration
 *
 * Ensures configuration is valid and safe to apply
 */
export function validateConfig(config: Partial<ChatWidgetFeatureFlags>): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Phase 2 requires Phase 1
  if (config.sessionPersistence?.phase2?.enhancedStorage) {
    if (!config.sessionPersistence?.phase1?.parentStorage) {
      errors.push('Phase 2 requires Phase 1 parentStorage to be enabled');
    }
  }

  // Phase 3 requires Phase 1 and Phase 2
  if (config.sessionPersistence?.phase3?.tabSync) {
    if (!config.sessionPersistence?.phase1?.parentStorage) {
      errors.push('Phase 3 requires Phase 1 parentStorage to be enabled');
    }
    if (!config.sessionPersistence?.phase2?.enhancedStorage) {
      errors.push('Phase 3 tabSync requires Phase 2 enhancedStorage to be enabled');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Feature Flag Helpers
 *
 * Utility functions for checking feature availability
 */
export const FeatureFlags = {
  /**
   * Check if Phase 1 (parent storage) is enabled
   */
  isPhase1Enabled(config: ChatWidgetFeatureFlags): boolean {
    return config.sessionPersistence.phase1.parentStorage === true;
  },

  /**
   * Check if Phase 2 (enhanced reliability) is enabled
   */
  isPhase2Enabled(config: ChatWidgetFeatureFlags): boolean {
    return config.sessionPersistence.phase2.enhancedStorage === true;
  },

  /**
   * Check if Phase 3 (advanced features) is enabled
   */
  isPhase3Enabled(config: ChatWidgetFeatureFlags): boolean {
    return config.sessionPersistence.phase3.tabSync === true;
  },

  /**
   * Get all enabled phases
   */
  getEnabledPhases(config: ChatWidgetFeatureFlags): number[] {
    const phases: number[] = [];
    if (this.isPhase1Enabled(config)) phases.push(1);
    if (this.isPhase2Enabled(config)) phases.push(2);
    if (this.isPhase3Enabled(config)) phases.push(3);
    return phases;
  },

  /**
   * Check if any experimental features are enabled
   */
  hasExperimentalFeatures(config: ChatWidgetFeatureFlags): boolean {
    return Object.values(config.experimental).some(enabled => enabled === true);
  },
};
