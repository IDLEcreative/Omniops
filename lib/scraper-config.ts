/**
 * Scraper Configuration System
 *
 * Main entry point for scraper configuration.
 * Re-exports all configuration components and provides utility functions.
 */

// ============================================================================
// RE-EXPORTS
// ============================================================================

// Export all schemas and types
export * from './scraper-config-schemas';

// Export all presets
export * from './scraper-config-presets';

// Export manager class and utilities
export * from './scraper-config-manager';

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

import { ScraperConfigManager } from './scraper-config-manager';
import { ConfigPresets } from './scraper-config-presets';
import type { ScraperConfig } from './scraper-config-schemas';

/**
 * Get the global configuration instance
 */
export function getScraperConfig(): ScraperConfig {
  return ScraperConfigManager.getInstance().getConfig();
}

/**
 * Update configuration at runtime
 */
export function updateScraperConfig(updates: Partial<ScraperConfig>): void {
  ScraperConfigManager.getInstance().update(updates);
}

/**
 * Apply a preset configuration
 */
export function applyConfigPreset(presetName: keyof typeof ConfigPresets): void {
  const preset = ConfigPresets[presetName];
  if (preset) {
    ScraperConfigManager.getInstance().update(preset);
  }
}

/**
 * Load configuration for a specific customer
 */
export async function loadCustomerConfig(customerId: string): Promise<void> {
  await ScraperConfigManager.getInstance().loadCustomerConfig(customerId);
}

/**
 * Save configuration for a specific customer
 */
export async function saveCustomerConfig(customerId: string): Promise<void> {
  await ScraperConfigManager.getInstance().saveConfig(customerId);
}

/**
 * Export configuration manager instance for advanced usage
 */
export const configManager = ScraperConfigManager.getInstance();
