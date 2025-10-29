import Stripe from 'stripe';

let stripeInstance: Stripe | null = null;

/**
 * Get or create Stripe client instance
 * Uses lazy initialization to prevent build-time errors
 *
 * @throws {Error} If STRIPE_SECRET_KEY is not configured (runtime only)
 */
export function getStripeClient(): Stripe {
  // Return cached instance if available
  if (stripeInstance) {
    return stripeInstance;
  }

  // Check for API key at runtime, not build time
  const apiKey = process.env.STRIPE_SECRET_KEY;
  if (!apiKey) {
    throw new Error(
      'STRIPE_SECRET_KEY is not set. Configure this environment variable to enable Stripe functionality.'
    );
  }

  // Initialize and cache the client
  stripeInstance = new Stripe(apiKey, {
    apiVersion: '2023-10-16',
    typescript: true,
  });

  return stripeInstance;
}

/**
 * Check if Stripe is configured without throwing errors
 * Useful for conditional feature availability
 */
export function isStripeConfigured(): boolean {
  return !!process.env.STRIPE_SECRET_KEY;
}

/**
 * Lazy-loading Stripe proxy
 * Delays initialization until first use, preventing build-time errors
 * Provides helpful error messages if Stripe is not configured
 */
const stripeProxy = new Proxy({} as Stripe, {
  get(_target, prop) {
    // Lazily initialize Stripe on first property access
    const client = getStripeClient();
    return (client as any)[prop];
  },
});

// For backward compatibility with existing imports
// Uses proxy pattern to delay initialization until first use
export const stripe = stripeProxy;

export default stripe;
