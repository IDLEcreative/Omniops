/**
 * Domain Subscription Types
 *
 * TypeScript interfaces for domain subscription management
 */

export interface CreateDomainSubscriptionInput {
  domainId: string;
  organizationId: string;
  pricingTierId: string;
  stripeCustomerId: string;
  stripeSubscriptionId?: string; // For legacy migrations
  isLegacyMigration?: boolean;
}

export interface UpdateDomainSubscriptionInput {
  domainSubscriptionId: string;
  pricingTierId?: string;
  status?: 'active' | 'canceled' | 'past_due' | 'trialing' | 'incomplete';
  cancelAtPeriodEnd?: boolean;
}

export interface DomainSubscription {
  id: string;
  domain_id: string;
  organization_id: string;
  pricing_tier_id: string;
  stripe_subscription_id: string | null;
  stripe_subscription_item_id: string | null;
  status: string;
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  multi_domain_discount: number;
  effective_monthly_price: number;
  created_at: string;
  updated_at: string;
}

export interface PricingTier {
  id: string;
  tier_name: string;
  display_name: string;
  monthly_price: number;
  included_completions: number;
  overage_rate: number;
  stripe_product_id: string | null;
  stripe_price_id: string | null;
  features: Record<string, boolean>;
}

export interface DomainSubscriptionWithTier extends DomainSubscription {
  pricing_tier: PricingTier;
}
