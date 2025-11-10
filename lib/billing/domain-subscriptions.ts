/**
 * Domain Subscription Management
 *
 * DEPRECATED: This file is maintained for backward compatibility.
 * All new code should import from '@/lib/billing/subscriptions' directly.
 *
 * Handles per-domain subscription creation, updates, and cancellation
 * Includes multi-domain discount calculations and Stripe integration
 *
 * Key Functions:
 * - createDomainSubscription: Create subscription for a domain
 * - updateDomainSubscription: Update tier or pricing
 * - cancelDomainSubscription: Cancel domain subscription
 * - applyMultiDomainDiscount: Calculate and apply discounts for multiple domains
 * - getDomainSubscription: Fetch subscription details
 * - getOrganizationSubscriptions: Get all subscriptions for an organization
 */

// Re-export all types and functions from the new modular structure
export type {
  CreateDomainSubscriptionInput,
  UpdateDomainSubscriptionInput,
  DomainSubscription,
  PricingTier,
  DomainSubscriptionWithTier,
} from './subscriptions';

export {
  createDomainSubscription,
  updateDomainSubscription,
  cancelDomainSubscription,
  applyMultiDomainDiscount,
  calculateDiscountPercentage,
  getDomainSubscription,
  getOrganizationSubscriptions,
  getDomainSubscriptionWithTier,
  getPricingTier,
  updateStripeSubscriptionItem,
  cancelStripeSubscription,
} from './subscriptions';
