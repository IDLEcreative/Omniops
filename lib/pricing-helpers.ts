/**
 * Pricing Helpers - Maps pricing tiers to Stripe price IDs
 *
 * This module provides utility functions for converting between pricing tiers
 * and Stripe price IDs. All pricing information comes from environment variables
 * to support multi-tenant configuration and easy updates.
 *
 * Last Updated: 2025-11-03
 * Status: Active
 * Used by: AIQuoteWidget, PricingTiers, Checkout flows
 */

/**
 * Map of pricing tier names to environment variable names
 * Each tier must have a corresponding NEXT_PUBLIC_STRIPE_PRICE_* environment variable
 */
const TIER_TO_ENV_VAR: Record<string, string> = {
  small_business: 'NEXT_PUBLIC_STRIPE_PRICE_SMALL_BUSINESS',
  sme: 'NEXT_PUBLIC_STRIPE_PRICE_SME',
  'small-business': 'NEXT_PUBLIC_STRIPE_PRICE_SMALL_BUSINESS',
  'mid-market': 'NEXT_PUBLIC_STRIPE_PRICE_MID_MARKET',
  'mid_market': 'NEXT_PUBLIC_STRIPE_PRICE_MID_MARKET',
  enterprise: 'NEXT_PUBLIC_STRIPE_PRICE_ENTERPRISE',
};

/**
 * Get the Stripe price ID for a given pricing tier
 *
 * @param tierName - The pricing tier name (e.g., 'sme', 'mid-market', 'enterprise')
 * @returns The Stripe price ID, or undefined if not configured
 *
 * @example
 * const priceId = getPriceIdForTier('sme');
 * // Returns: 'price_1234567890abcdef' (if configured in env vars)
 *
 * @throws Will not throw, but returns undefined if tier or env var not found
 */
export function getPriceIdForTier(tierName: string): string | undefined {
  // Normalize tier name to match env var keys
  const normalizedTier = tierName.toLowerCase();
  const envVarName = TIER_TO_ENV_VAR[normalizedTier];

  if (!envVarName) {
    console.warn(`Unknown pricing tier: ${tierName}. Available tiers: ${Object.keys(TIER_TO_ENV_VAR).join(', ')}`);
    return undefined;
  }

  // Get the price ID from environment variables
  // Note: We're accessing it via window in browser context (NEXT_PUBLIC_* variables)
  // or process.env in server context
  const priceId = typeof window !== 'undefined'
    ? (window as any)[envVarName]
    : process.env[envVarName];

  if (!priceId) {
    console.warn(`Stripe price ID not configured for tier: ${tierName}. Set ${envVarName} in environment variables.`);
    return undefined;
  }

  return priceId;
}

/**
 * Get all configured Stripe price IDs from environment variables
 *
 * @returns Object mapping tier names to their Stripe price IDs (only configured ones)
 *
 * @example
 * const prices = getAllConfiguredPrices();
 * // Returns: { sme: 'price_xxx', enterprise: 'price_yyy' }
 */
export function getAllConfiguredPrices(): Record<string, string> {
  const prices: Record<string, string> = {};

  Object.entries(TIER_TO_ENV_VAR).forEach(([tier, envVarName]) => {
    const priceId = typeof window !== 'undefined'
      ? (window as any)[envVarName]
      : process.env[envVarName];

    if (priceId) {
      prices[tier] = priceId;
    }
  });

  return prices;
}

/**
 * Check if a pricing tier is properly configured with a Stripe price ID
 *
 * @param tierName - The pricing tier name to check
 * @returns true if the tier has a valid Stripe price ID configured
 *
 * @example
 * if (isPricingTierConfigured('sme')) {
 *   // Safe to use this tier for checkout
 * }
 */
export function isPricingTierConfigured(tierName: string): boolean {
  const priceId = getPriceIdForTier(tierName);
  return !!priceId && !priceId.startsWith('price_');
}

/**
 * Validate that all required pricing tiers are configured
 *
 * @param requiredTiers - Array of tier names that must be configured (default: all tiers)
 * @returns Object with validation results
 *
 * @example
 * const validation = validatePricingConfiguration(['sme', 'enterprise']);
 * if (!validation.isValid) {
 *   console.error('Missing pricing tiers:', validation.missing);
 * }
 */
export function validatePricingConfiguration(
  requiredTiers: string[] = Object.keys(TIER_TO_ENV_VAR)
): {
  isValid: boolean;
  configured: string[];
  missing: string[];
} {
  const configured: string[] = [];
  const missing: string[] = [];

  requiredTiers.forEach(tier => {
    if (isPricingTierConfigured(tier)) {
      configured.push(tier);
    } else {
      missing.push(tier);
    }
  });

  return {
    isValid: missing.length === 0,
    configured,
    missing,
  };
}
