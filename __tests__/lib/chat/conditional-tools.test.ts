/**
 * Tests for Conditional Tool Availability
 *
 * Ensures that e-commerce tools (WooCommerce, Shopify) are only available
 * when properly configured for each customer domain.
 */

import { getAvailableTools, checkToolAvailability, getToolInstructions } from '@/lib/chat/get-available-tools';
import { createServiceRoleClient } from '@/lib/supabase-server';

// Mock Supabase
jest.mock('@/lib/supabase-server', () => ({
  createServiceRoleClient: jest.fn()
}));

const mockSupabase = createServiceRoleClient as jest.Mock;

describe('Conditional Tool Availability', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset environment variables
    delete process.env.TEST_DOMAIN;
    delete process.env.DEFAULT_DOMAIN;
  });

  describe('checkToolAvailability', () => {
    it('should return true for WooCommerce when configured in database', async () => {
      const mockClient = {
        from: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: {
            woocommerce_url: 'https://store.example.com',
            shopify_shop: null
          },
          error: null
        })
      };
      mockSupabase.mockResolvedValue(mockClient);

      const availability = await checkToolAvailability('configured-store.com');

      expect(availability.hasWooCommerce).toBe(true);
      expect(availability.hasShopify).toBe(false);
      expect(mockClient.from).toHaveBeenCalledWith('customer_configs');
      expect(mockClient.eq).toHaveBeenCalledWith('domain', 'configured-store.com');
    });

    it('should return true for Shopify when configured in database', async () => {
      const mockClient = {
        from: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: {
            woocommerce_url: null,
            shopify_shop: 'myshop.myshopify.com'
          },
          error: null
        })
      };
      mockSupabase.mockResolvedValue(mockClient);

      const availability = await checkToolAvailability('shopify-store.com');

      expect(availability.hasWooCommerce).toBe(false);
      expect(availability.hasShopify).toBe(true);
    });

    it('should return false for both when no configuration exists', async () => {
      const mockClient = {
        from: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: { code: 'PGRST116', message: 'Not found' }
        })
      };
      mockSupabase.mockResolvedValue(mockClient);

      const availability = await checkToolAvailability('unconfigured-domain.com');

      expect(availability.hasWooCommerce).toBe(false);
      expect(availability.hasShopify).toBe(false);
    });

    it('should use environment variables ONLY for primary customer domain', async () => {
      // Set environment variables for primary customer
      process.env.WOOCOMMERCE_URL = 'https://thompsonseparts.co.uk';
      process.env.WOOCOMMERCE_CONSUMER_KEY = 'ck_test';
      process.env.WOOCOMMERCE_CONSUMER_SECRET = 'cs_test';

      const mockClient = {
        from: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: { code: 'PGRST116', message: 'Not found' }
        })
      };
      mockSupabase.mockResolvedValue(mockClient);

      // Test primary customer domain - should use env vars
      const primaryAvailability = await checkToolAvailability('thompsonseparts.co.uk');
      expect(primaryAvailability.hasWooCommerce).toBe(true);

      // Test random domain - should NOT use env vars
      const randomAvailability = await checkToolAvailability('random-site.com');
      expect(randomAvailability.hasWooCommerce).toBe(false);
    });

    it('should handle database errors gracefully', async () => {
      const mockClient = null; // Simulate connection failure
      mockSupabase.mockResolvedValue(mockClient);

      const availability = await checkToolAvailability('any-domain.com');

      expect(availability.hasWooCommerce).toBe(false);
      expect(availability.hasShopify).toBe(false);
    });
  });

  describe('getAvailableTools', () => {
    it('should include WooCommerce tool when configured', async () => {
      const mockClient = {
        from: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: {
            woocommerce_url: 'https://store.example.com',
            shopify_shop: null
          },
          error: null
        })
      };
      mockSupabase.mockResolvedValue(mockClient);

      const tools = await getAvailableTools('configured-store.com');
      const toolNames = tools.map(t => t.function.name);

      // Should have base tools plus WooCommerce
      expect(toolNames).toContain('search_website_content');
      expect(toolNames).toContain('search_by_category');
      expect(toolNames).toContain('search_similar');
      expect(toolNames).toContain('woocommerce_operations');
      expect(tools.length).toBe(4); // 3 base + 1 WooCommerce
    });

    it('should NOT include WooCommerce tool when not configured', async () => {
      const mockClient = {
        from: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: { code: 'PGRST116', message: 'Not found' }
        })
      };
      mockSupabase.mockResolvedValue(mockClient);

      const tools = await getAvailableTools('unconfigured-store.com');
      const toolNames = tools.map(t => t.function.name);

      // Should only have base tools
      expect(toolNames).toContain('search_website_content');
      expect(toolNames).toContain('search_by_category');
      expect(toolNames).toContain('search_similar');
      expect(toolNames).not.toContain('woocommerce_operations');
      expect(tools.length).toBe(3); // Only 3 base tools
    });

    it('should always include base search tools', async () => {
      const mockClient = {
        from: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: { code: 'PGRST116', message: 'Not found' }
        })
      };
      mockSupabase.mockResolvedValue(mockClient);

      const tools = await getAvailableTools('any-domain.com');
      const toolNames = tools.map(t => t.function.name);

      // Base tools should always be present
      expect(toolNames).toContain('search_website_content');
      expect(toolNames).toContain('search_by_category');
      expect(toolNames).toContain('search_similar');
    });
  });

  describe('getToolInstructions', () => {
    it('should provide warning when no e-commerce configured', () => {
      const instructions = getToolInstructions({
        hasWooCommerce: false,
        hasShopify: false
      });

      expect(instructions).toContain('E-commerce operations are NOT available');
      expect(instructions).toContain('DO NOT offer to add items to cart');
      expect(instructions).toContain('Focus on providing information');
    });

    it('should provide WooCommerce instructions when configured', () => {
      const instructions = getToolInstructions({
        hasWooCommerce: true,
        hasShopify: false
      });

      expect(instructions).toContain('WooCommerce is configured');
      expect(instructions).toContain('you can perform cart operations');
      expect(instructions).toContain('woocommerce_operations');
    });

    it('should provide Shopify instructions when configured', () => {
      const instructions = getToolInstructions({
        hasWooCommerce: false,
        hasShopify: true
      });

      expect(instructions).toContain('Shopify is configured');
      expect(instructions).toContain('shopify_operations');
    });

    it('should provide both instructions when both configured', () => {
      const instructions = getToolInstructions({
        hasWooCommerce: true,
        hasShopify: true
      });

      expect(instructions).toContain('WooCommerce is configured');
      expect(instructions).toContain('Shopify is configured');
    });
  });

  describe('Multi-tenancy', () => {
    it('should isolate tools per domain', async () => {
      const mockClient = {
        from: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn()
      };

      // Domain A has WooCommerce
      mockClient.single.mockResolvedValueOnce({
        data: { woocommerce_url: 'https://a.com', shopify_shop: null },
        error: null
      });
      mockSupabase.mockResolvedValue(mockClient);
      const toolsA = await getAvailableTools('domain-a.com');

      // Domain B has nothing
      mockClient.single.mockResolvedValueOnce({
        data: null,
        error: { code: 'PGRST116', message: 'Not found' }
      });
      const toolsB = await getAvailableTools('domain-b.com');

      // Domain A should have WooCommerce
      expect(toolsA.some(t => t.function.name === 'woocommerce_operations')).toBe(true);

      // Domain B should NOT have WooCommerce
      expect(toolsB.some(t => t.function.name === 'woocommerce_operations')).toBe(false);
    });
  });
});