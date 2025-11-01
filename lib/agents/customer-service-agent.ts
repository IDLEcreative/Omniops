/**
 * Generic Customer Service Agent instructions and orchestration.
 * Provider-agnostic by default; can work with different e-commerce agents.
 *
 * This file is a proxy to the refactored module structure.
 * All logic is now split into focused modules under customer-service-agent/
 */

export { CustomerServiceAgent } from './customer-service-agent/index';
export type { ECommerceAgent } from './customer-service-agent/index';
