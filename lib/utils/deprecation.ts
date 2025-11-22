/**
 * Deprecation Utilities
 *
 * Provides helpers for managing deprecated APIs and features
 * Last Updated: 2025-11-22
 */

/**
 * Deprecation phases for customer_id → organization_id migration
 */
export enum DeprecationPhase {
  /** Phase 1: Silent deprecation (current) - code migrated, warnings in dev only */
  SILENT = 'silent',
  /** Phase 2: Warn (3 months) - console warnings in production */
  WARN = 'warn',
  /** Phase 3: Error (6 months) - throw errors for legacy usage */
  ERROR = 'error',
  /** Phase 4: Removed (12 months) - feature completely removed */
  REMOVED = 'removed',
}

/**
 * Configuration for deprecation timeline
 */
const DEPRECATION_CONFIG = {
  customer_id: {
    phase: DeprecationPhase.SILENT,
    startDate: new Date('2025-11-22'),
    warnDate: new Date('2026-02-22'), // 3 months
    errorDate: new Date('2026-05-22'), // 6 months
    removeDate: new Date('2026-11-22'), // 12 months
    replacement: 'organization_id',
  },
};

/**
 * Log a deprecation warning for a feature
 *
 * @param feature - The deprecated feature name
 * @param message - Additional context about the deprecation
 * @param currentPhase - Override the current deprecation phase (for testing)
 */
export function logDeprecationWarning(
  feature: keyof typeof DEPRECATION_CONFIG,
  message?: string,
  currentPhase?: DeprecationPhase
): void {
  const config = DEPRECATION_CONFIG[feature];
  if (!config) {
    console.error(`Unknown deprecated feature: ${feature}`);
    return;
  }

  const phase = currentPhase ?? config.phase;
  const now = new Date();

  // Determine appropriate phase based on current date
  let activePhase = DeprecationPhase.SILENT;
  if (now >= config.removeDate) {
    activePhase = DeprecationPhase.REMOVED;
  } else if (now >= config.errorDate) {
    activePhase = DeprecationPhase.ERROR;
  } else if (now >= config.warnDate) {
    activePhase = DeprecationPhase.WARN;
  }

  const defaultMessage = `"${feature}" is deprecated and will be removed on ${config.removeDate.toISOString().split('T')[0]}. Use "${config.replacement}" instead.`;
  const fullMessage = message ? `${defaultMessage} ${message}` : defaultMessage;

  switch (phase === DeprecationPhase.SILENT ? activePhase : phase) {
    case DeprecationPhase.SILENT:
      // Only log in development
      if (process.env.NODE_ENV === 'development') {
        console.warn(`[DEPRECATED] ${fullMessage}`);
      }
      break;

    case DeprecationPhase.WARN:
      console.warn(`[DEPRECATED] ${fullMessage}`);
      break;

    case DeprecationPhase.ERROR:
      console.error(`[DEPRECATED ERROR] ${fullMessage}`);
      throw new Error(`Deprecated feature used: ${feature}. ${fullMessage}`);

    case DeprecationPhase.REMOVED:
      throw new Error(`Removed feature accessed: ${feature}. This feature was removed on ${config.removeDate.toISOString().split('T')[0]}.`);
  }
}

/**
 * Get deprecation info for a feature
 */
export function getDeprecationInfo(feature: keyof typeof DEPRECATION_CONFIG) {
  return DEPRECATION_CONFIG[feature];
}

/**
 * Check if a feature is deprecated
 */
export function isDeprecated(feature: keyof typeof DEPRECATION_CONFIG): boolean {
  return feature in DEPRECATION_CONFIG;
}

/**
 * Get all deprecation timelines
 */
export function getDeprecationTimeline() {
  return Object.entries(DEPRECATION_CONFIG).map(([feature, config]) => ({
    feature,
    ...config,
    daysUntilWarn: Math.ceil((config.warnDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
    daysUntilError: Math.ceil((config.errorDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
    daysUntilRemoval: Math.ceil((config.removeDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
  }));
}
