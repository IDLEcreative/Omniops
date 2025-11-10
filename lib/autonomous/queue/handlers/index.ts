/**
 * Job Handlers Index
 *
 * Central export for all job type handlers.
 *
 * @module lib/autonomous/queue/handlers
 */

export { executeWooCommerceSetup, type JobHandlerResult, type ProgressUpdater } from './woocommerce-handler';
export { executeShopifySetup } from './shopify-handler';
