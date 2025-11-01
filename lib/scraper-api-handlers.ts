/**
 * Scraper API Handlers - Proxy File
 *
 * This file maintains backward compatibility by re-exporting from the modular implementation.
 * The actual implementation is in lib/scraper-api-handlers/
 */

export * from './scraper-api-handlers/index';
export {
  handlePageRequest,
  setupPreNavigationHook,
  handleFailedRequest,
} from './scraper-api-handlers/index';
