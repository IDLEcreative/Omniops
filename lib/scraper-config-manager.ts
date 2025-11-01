/**
 * Scraper Configuration Manager - Proxy File
 *
 * This file maintains backward compatibility by re-exporting from the modular implementation.
 * The actual implementation is in lib/scraper-config-manager/
 */

export * from './scraper-config-manager/index';
export { ScraperConfigManager, configManager } from './scraper-config-manager/index';
