/**
 * Scrape Queue - Proxy File
 *
 * This file maintains backward compatibility by re-exporting from the modular implementation.
 * The actual implementation is in lib/queue/scrape-queue/
 */

export * from './scrape-queue/index';
export { ScrapeQueueManager, getQueueManager, default } from './scrape-queue/index';
