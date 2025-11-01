/**
 * Scraper Configuration Manager
 *
 * Advanced configuration management with hot reload, multiple sources,
 * and hierarchical priority system.
 */

export * from './core';
export { ScraperConfigManager } from './core';

// Export singleton instance
import { ScraperConfigManager } from './core';
export const configManager = ScraperConfigManager.getInstance();
