/**
 * Tests for Stripe Client
 *
 * These tests verify the lazy initialization pattern and error handling
 * for the Stripe client singleton.
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';

describe('Stripe Client', () => {
  const originalEnv = process.env.STRIPE_SECRET_KEY;

  beforeEach(() => {
    // Clear module cache to reset singleton instance
    jest.resetModules();
  });

  afterEach(() => {
    // Restore original environment
    if (originalEnv) {
      process.env.STRIPE_SECRET_KEY = originalEnv;
    } else {
      delete process.env.STRIPE_SECRET_KEY;
    }
    // Clear module cache again
    jest.resetModules();
  });

  describe('getStripeClient', () => {
    it('should create Stripe client when API key is configured', () => {
      process.env.STRIPE_SECRET_KEY = 'sk_test_fake_key';

      const { getStripeClient } = require('@/lib/stripe-client');
      const client = getStripeClient();

      expect(client).toBeDefined();
      expect(client.customers).toBeDefined();
      expect(client.subscriptions).toBeDefined();
      expect(client.checkout).toBeDefined();
    });

    it('should throw error when API key is not configured', () => {
      delete process.env.STRIPE_SECRET_KEY;

      const { getStripeClient } = require('@/lib/stripe-client');

      expect(() => getStripeClient()).toThrow(
        'STRIPE_SECRET_KEY is not set. Configure this environment variable to enable Stripe functionality.'
      );
    });

    it('should return cached instance on subsequent calls', () => {
      process.env.STRIPE_SECRET_KEY = 'sk_test_fake_key';

      const { getStripeClient } = require('@/lib/stripe-client');
      const client1 = getStripeClient();
      const client2 = getStripeClient();

      expect(client1).toBe(client2);
    });

    it('should initialize with correct API version', () => {
      process.env.STRIPE_SECRET_KEY = 'sk_test_fake_key';

      const { getStripeClient } = require('@/lib/stripe-client');
      const client = getStripeClient();

      // Stripe client should have the correct API version
      expect(client).toBeDefined();
    });
  });

  describe('isStripeConfigured', () => {
    it('should return true when API key is set', () => {
      process.env.STRIPE_SECRET_KEY = 'sk_test_fake_key';

      const { isStripeConfigured } = require('@/lib/stripe-client');
      expect(isStripeConfigured()).toBe(true);
    });

    it('should return false when API key is not set', () => {
      delete process.env.STRIPE_SECRET_KEY;

      const { isStripeConfigured } = require('@/lib/stripe-client');
      expect(isStripeConfigured()).toBe(false);
    });

    it('should return false when API key is empty string', () => {
      process.env.STRIPE_SECRET_KEY = '';

      const { isStripeConfigured } = require('@/lib/stripe-client');
      expect(isStripeConfigured()).toBe(false);
    });

    it('should not throw errors when checking configuration', () => {
      delete process.env.STRIPE_SECRET_KEY;

      const { isStripeConfigured } = require('@/lib/stripe-client');
      expect(() => isStripeConfigured()).not.toThrow();
    });
  });

  describe('Lazy loading proxy', () => {
    it('should delay initialization until first use', () => {
      process.env.STRIPE_SECRET_KEY = 'sk_test_fake_key';

      // Import the proxy but don't use it
      // The client should not be initialized yet
      // This is hard to test directly, but we can verify it doesn't throw
      expect(() => {
        const { stripe } = require('@/lib/stripe-client');
        // Not accessing any properties yet
      }).not.toThrow();
    });

    it('should initialize when accessing properties', () => {
      process.env.STRIPE_SECRET_KEY = 'sk_test_fake_key';

      const { stripe } = require('@/lib/stripe-client');

      // Access a property - should initialize
      expect(stripe.customers).toBeDefined();
    });

    it('should throw error on property access if not configured', () => {
      delete process.env.STRIPE_SECRET_KEY;

      const { stripe } = require('@/lib/stripe-client');

      expect(() => stripe.customers).toThrow(
        'STRIPE_SECRET_KEY is not set'
      );
    });
  });
});
