/**
 * Domain Subscription Management
 *
 * Public API for domain subscription operations
 *
 * Key Functions:
 * - createDomainSubscription: Create subscription for a domain
 * - updateDomainSubscription: Update tier or pricing
 * - cancelDomainSubscription: Cancel domain subscription
 * - applyMultiDomainDiscount: Calculate and apply discounts for multiple domains
 * - getDomainSubscription: Fetch subscription details
 * - getOrganizationSubscriptions: Get all subscriptions for an organization
 */

// Export all types
export type {
  CreateDomainSubscriptionInput,
  UpdateDomainSubscriptionInput,
  DomainSubscription,
  PricingTier,
  DomainSubscriptionWithTier,
} from './types';

// Export subscription management functions
export {
  createDomainSubscription,
  updateDomainSubscription,
  cancelDomainSubscription,
} from './subscription-manager';

// Export discount calculation
export {
  applyMultiDomainDiscount,
  calculateDiscountPercentage,
} from './discount-calculator';

// Export database queries
export {
  getDomainSubscription,
  getOrganizationSubscriptions,
  getDomainSubscriptionWithTier,
  getPricingTier,
} from './database-queries';

// Export Stripe operations
export {
  updateStripeSubscriptionItem,
  cancelStripeSubscription,
} from './stripe-operations';
