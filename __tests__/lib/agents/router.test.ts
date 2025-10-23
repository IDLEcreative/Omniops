/**
 * Tests for Agent Router
 * Critical: Provider selection logic must work correctly for multi-tenant routing
 */

import { selectProviderAgent, ProviderKey } from '@/lib/agents/router';

describe('Agent Router', () => {
  describe('selectProviderAgent', () => {
    describe('with explicit config', () => {
      it('should return woocommerce when explicitly enabled in config', () => {
        const config = {
          features: {
            woocommerce: {
              enabled: true
            }
          }
        };

        const result = selectProviderAgent(config, {});

        expect(result).toBe('woocommerce');
      });

      it('should return generic when explicitly disabled in config', () => {
        const config = {
          features: {
            woocommerce: {
              enabled: false
            }
          }
        };

        // Even with env vars set, config should override
        const env = {
          WOOCOMMERCE_URL: 'https://example.com',
          WOOCOMMERCE_CONSUMER_KEY: 'ck_test',
          WOOCOMMERCE_CONSUMER_SECRET: 'cs_test'
        };

        const result = selectProviderAgent(config, env);

        expect(result).toBe('generic');
      });

      it('should respect explicit config over environment variables', () => {
        const config = {
          features: {
            woocommerce: {
              enabled: true
            }
          }
        };

        // No env vars, but config says enabled
        const result = selectProviderAgent(config, {});

        expect(result).toBe('woocommerce');
      });
    });

    describe('with environment variables (no config)', () => {
      it('should return woocommerce when all env vars are present', () => {
        const env = {
          WOOCOMMERCE_URL: 'https://shop.example.com',
          WOOCOMMERCE_CONSUMER_KEY: 'ck_abc123',
          WOOCOMMERCE_CONSUMER_SECRET: 'cs_xyz789'
        };

        const result = selectProviderAgent(undefined, env);

        expect(result).toBe('woocommerce');
      });

      it('should return generic when WOOCOMMERCE_URL is missing', () => {
        const env = {
          WOOCOMMERCE_CONSUMER_KEY: 'ck_abc123',
          WOOCOMMERCE_CONSUMER_SECRET: 'cs_xyz789'
        };

        const result = selectProviderAgent(undefined, env);

        expect(result).toBe('generic');
      });

      it('should return generic when WOOCOMMERCE_CONSUMER_KEY is missing', () => {
        const env = {
          WOOCOMMERCE_URL: 'https://shop.example.com',
          WOOCOMMERCE_CONSUMER_SECRET: 'cs_xyz789'
        };

        const result = selectProviderAgent(undefined, env);

        expect(result).toBe('generic');
      });

      it('should return generic when WOOCOMMERCE_CONSUMER_SECRET is missing', () => {
        const env = {
          WOOCOMMERCE_URL: 'https://shop.example.com',
          WOOCOMMERCE_CONSUMER_KEY: 'ck_abc123'
        };

        const result = selectProviderAgent(undefined, env);

        expect(result).toBe('generic');
      });

      it('should return generic when no env vars are present', () => {
        const result = selectProviderAgent(undefined, {});

        expect(result).toBe('generic');
      });
    });

    describe('edge cases', () => {
      it('should handle empty config object', () => {
        const config = {};

        const result = selectProviderAgent(config, {});

        expect(result).toBe('generic');
      });

      it('should handle config with empty features', () => {
        const config = {
          features: {}
        };

        const result = selectProviderAgent(config, {});

        expect(result).toBe('generic');
      });

      it('should handle config with woocommerce but no enabled property', () => {
        const config = {
          features: {
            woocommerce: {}
          }
        };

        const env = {
          WOOCOMMERCE_URL: 'https://shop.example.com',
          WOOCOMMERCE_CONSUMER_KEY: 'ck_abc123',
          WOOCOMMERCE_CONSUMER_SECRET: 'cs_xyz789'
        };

        // Should fall back to env check
        const result = selectProviderAgent(config, env);

        expect(result).toBe('woocommerce');
      });

      it('should handle falsy enabled value correctly', () => {
        const config = {
          features: {
            woocommerce: {
              enabled: null as any // Force null
            }
          }
        };

        const result = selectProviderAgent(config, {});

        expect(result).toBe('generic');
      });

      it('should use process.env when no env parameter provided', () => {
        // Set up process.env
        process.env.WOOCOMMERCE_URL = 'https://test.com';
        process.env.WOOCOMMERCE_CONSUMER_KEY = 'ck_test';
        process.env.WOOCOMMERCE_CONSUMER_SECRET = 'cs_test';

        const result = selectProviderAgent(undefined);

        expect(result).toBe('woocommerce');

        // Cleanup
        delete process.env.WOOCOMMERCE_URL;
        delete process.env.WOOCOMMERCE_CONSUMER_KEY;
        delete process.env.WOOCOMMERCE_CONSUMER_SECRET;
      });
    });

    describe('type safety', () => {
      it('should return valid ProviderKey type', () => {
        const result = selectProviderAgent(undefined, {});

        const validKeys: ProviderKey[] = ['woocommerce', 'generic'];
        expect(validKeys).toContain(result);
      });
    });
  });
});
