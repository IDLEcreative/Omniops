/**
 * Domain-Agnostic Customer Service Agent
 * Adapts to any business type using detected classification
 *
 * This file is a proxy to the refactored module structure.
 * All logic is now split into focused modules under domain-agnostic-agent/
 */

export { DomainAgnosticAgent } from './domain-agnostic-agent/index';
export type { BusinessContext } from './domain-agnostic-agent/index';
