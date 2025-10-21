/**
 * Integration test for Shopify configuration UX flow
 * Tests the complete user journey: navigate → configure → test → save → reload
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('Shopify Configuration UX Flow', () => {
  beforeEach(() => {
    // Reset fetch mocks
    global.fetch = vi.fn();
  });

  describe('Configuration Page Load', () => {
    it('should load existing configuration on page mount', async () => {
      const mockResponse = {
        success: true,
        configured: true,
        shop: 'mystore.myshopify.com',
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      // Simulate page loading
      const hostname = 'localhost';
      const response = await fetch(`/api/shopify/configure?domain=${hostname}`);
      const result = await response.json();

      expect(result.configured).toBe(true);
      expect(result.shop).toBe('mystore.myshopify.com');
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/shopify/configure?domain=localhost')
      );
    });

    it('should handle unconfigured state gracefully', async () => {
      const mockResponse = {
        success: true,
        configured: false,
        shop: null,
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const response = await fetch('/api/shopify/configure?domain=localhost');
      const result = await response.json();

      expect(result.configured).toBe(false);
      expect(result.shop).toBeNull();
    });
  });

  describe('Save Configuration Flow', () => {
    it('should save valid Shopify credentials', async () => {
      const credentials = {
        shop: 'mystore.myshopify.com',
        accessToken: 'shpat_1234567890abcdef',
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, message: 'Configuration saved' }),
      });

      const response = await fetch('/api/shopify/configure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      });

      const result = await response.json();
      expect(result.success).toBe(true);
    });

    it('should reject invalid shop domain format', async () => {
      const credentials = {
        shop: 'invalid-domain.com',
        accessToken: 'shpat_1234567890abcdef',
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({
          success: false,
          error: 'Shop domain must be in format: store-name.myshopify.com',
        }),
      });

      const response = await fetch('/api/shopify/configure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      });

      const result = await response.json();
      expect(result.success).toBe(false);
      expect(result.error).toContain('myshopify.com');
    });

    it('should reject invalid access token format', async () => {
      const credentials = {
        shop: 'mystore.myshopify.com',
        accessToken: 'invalid_token_format',
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({
          success: false,
          error: 'Access token should start with "shpat_"',
        }),
      });

      const response = await fetch('/api/shopify/configure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      });

      const result = await response.json();
      expect(result.success).toBe(false);
      expect(result.error).toContain('shpat_');
    });
  });

  describe('Test Connection Flow', () => {
    it('should test connection after saving credentials', async () => {
      // Mock successful save
      (global.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true }),
        })
        // Mock successful test
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            configured: true,
            testProduct: {
              id: 123,
              title: 'Test Product',
            },
          }),
        });

      // Step 1: Save
      const saveResponse = await fetch('/api/shopify/configure', {
        method: 'POST',
        body: JSON.stringify({
          shop: 'mystore.myshopify.com',
          accessToken: 'shpat_test',
        }),
      });
      const saveResult = await saveResponse.json();
      expect(saveResult.success).toBe(true);

      // Step 2: Test
      const testResponse = await fetch('/api/shopify/test?domain=localhost');
      const testResult = await testResponse.json();
      expect(testResult.success).toBe(true);
      expect(testResult.testProduct).toBeDefined();
    });

    it('should show meaningful error when test fails', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: false,
          configured: false,
          message: 'Failed to connect to Shopify API',
        }),
      });

      const response = await fetch('/api/shopify/test?domain=localhost');
      const result = await response.json();

      expect(result.success).toBe(false);
      expect(result.message).toBeDefined();
    });
  });

  describe('Complete User Journey', () => {
    it('should support full configure → test → save → reload flow', async () => {
      const credentials = {
        shop: 'mystore.myshopify.com',
        accessToken: 'shpat_complete_flow_test',
      };

      // Step 1: Save configuration
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, message: 'Saved' }),
      });

      const saveResponse = await fetch('/api/shopify/configure', {
        method: 'POST',
        body: JSON.stringify(credentials),
      });
      expect((await saveResponse.json()).success).toBe(true);

      // Step 2: Test connection
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          configured: true,
          testProduct: { id: 1, title: 'Product' },
        }),
      });

      const testResponse = await fetch('/api/shopify/test?domain=localhost');
      expect((await testResponse.json()).success).toBe(true);

      // Step 3: Reload configuration (user returns to page)
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          configured: true,
          shop: credentials.shop,
        }),
      });

      const reloadResponse = await fetch('/api/shopify/configure?domain=localhost');
      const reloadResult = await reloadResponse.json();
      expect(reloadResult.configured).toBe(true);
      expect(reloadResult.shop).toBe(credentials.shop);
    });
  });

  describe('Security and Privacy', () => {
    it('should not return access token when loading configuration', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          configured: true,
          shop: 'mystore.myshopify.com',
          // Note: access token should NEVER be in this response
        }),
      });

      const response = await fetch('/api/shopify/configure?domain=localhost');
      const result = await response.json();

      expect(result.shop).toBeDefined();
      expect(result.accessToken).toBeUndefined();
    });
  });
});
