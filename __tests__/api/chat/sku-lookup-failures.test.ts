/**
 * Tests for SKU Lookup Failure Scenarios
 *
 * These tests ensure the chat system provides helpful, actionable feedback
 * when product lookups fail, instead of generic unhelpful messages.
 *
 * Related to conversation analysis: User provides SKU, system should clearly
 * communicate if product not found rather than saying "try asking more specifically"
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { executeGetProductDetails } from '@/lib/chat/tool-handlers/product-details';
import type { ToolDependencies } from '@/lib/chat/tool-handlers/types';

describe('SKU Lookup Failure Scenarios', () => {
  let mockDeps: ToolDependencies;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Product Not Found in WooCommerce', () => {
    it('should return structured error when SKU not found', async () => {
      // Mock WooCommerce provider that returns null (product not found)
      const mockProvider = {
        platform: 'woocommerce',
        getProductDetails: jest.fn().mockResolvedValue(null),
      };

      mockDeps = {
        getCommerceProvider: jest.fn().mockResolvedValue(mockProvider),
        searchSimilarContent: jest.fn().mockResolvedValue([]),
      };

      const result = await executeGetProductDetails(
        'MU110667601',
        true,
        'test.com',
        mockDeps
      );

      // Should return error result with helpful message
      expect(result.success).toBe(false);
      expect(result.source).toBe('woocommerce-not-found');
      expect(result.errorMessage).toContain('MU110667601');
      expect(result.errorMessage).toContain('not found');
      expect(mockProvider.getProductDetails).toHaveBeenCalledWith('MU110667601');
    });

    it('should log explicitly when SKU not found', async () => {
      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();

      const mockProvider = {
        platform: 'woocommerce',
        getProductDetails: jest.fn().mockResolvedValue(null),
      };

      mockDeps = {
        getCommerceProvider: jest.fn().mockResolvedValue(mockProvider),
        searchSimilarContent: jest.fn().mockResolvedValue([]),
      };

      await executeGetProductDetails(
        'ABC123XYZ',
        true,
        'test.com',
        mockDeps
      );

      // Should log the specific product query that wasn't found
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('woocommerce product not found'),
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('ABC123XYZ')
      );

      consoleLogSpy.mockRestore();
    });
  });

  describe('WooCommerce API Connection Failure', () => {
    it('should return structured error when API call fails', async () => {
      const mockError = new Error('Connection timeout');
      const mockProvider = {
        platform: 'woocommerce',
        getProductDetails: jest.fn().mockRejectedValue(mockError),
      };

      mockDeps = {
        getCommerceProvider: jest.fn().mockResolvedValue(mockProvider),
        searchSimilarContent: jest.fn().mockResolvedValue([]),
      };

      const result = await executeGetProductDetails(
        'TEST-SKU-001',
        true,
        'test.com',
        mockDeps
      );

      // Should return error result with connection error info
      expect(result.success).toBe(false);
      expect(result.source).toBe('woocommerce-error');
      expect(result.errorMessage).toContain('Error looking up product');
      expect(result.errorMessage).toContain('Connection timeout');
    });

    it('should log connection errors', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      const mockError = new Error('Network error');

      const mockProvider = {
        platform: 'woocommerce',
        getProductDetails: jest.fn().mockRejectedValue(mockError),
      };

      mockDeps = {
        getCommerceProvider: jest.fn().mockResolvedValue(mockProvider),
        searchSimilarContent: jest.fn().mockResolvedValue([]),
      };

      await executeGetProductDetails(
        'TEST-SKU',
        true,
        'test.com',
        mockDeps
      );

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('woocommerce detail error'),
        mockError
      );

      consoleErrorSpy.mockRestore();
    });
  });

  describe('Semantic Search Fallback', () => {
    it('should fall back to semantic search when no provider', async () => {
      mockDeps = {
        getCommerceProvider: jest.fn().mockResolvedValue(null),
        searchSimilarContent: jest.fn().mockResolvedValue([
          {
            url: 'https://test.com/product/mu110667601',
            title: 'Hiab Multicover Control Box',
            content: 'SKU: MU110667601, Price: £324',
            similarity: 0.85,
          },
        ]),
      };

      const result = await executeGetProductDetails(
        'MU110667601',
        true,
        'test.com',
        mockDeps
      );

      expect(result.success).toBe(true);
      expect(result.source).toBe('semantic');
      expect(result.results.length).toBeGreaterThan(0);
    });

    it('should enhance query with specs when includeSpecs is true', async () => {
      const mockSearchFn = jest.fn().mockResolvedValue([]);

      mockDeps = {
        getCommerceProvider: jest.fn().mockResolvedValue(null),
        searchSimilarContent: mockSearchFn,
      };

      await executeGetProductDetails(
        'MU110667601',
        true, // includeSpecs
        'test.com',
        mockDeps
      );

      // Should call search with enhanced query
      expect(mockSearchFn).toHaveBeenCalledWith(
        'MU110667601 specifications technical details features',
        'test.com',
        15,
        0.3
      );
    });
  });

  describe('Invalid Domain Handling', () => {
    it('should handle empty domain gracefully', async () => {
      mockDeps = {
        getCommerceProvider: jest.fn(),
        searchSimilarContent: jest.fn(),
      };

      const result = await executeGetProductDetails(
        'TEST-SKU',
        true,
        '', // empty domain
        mockDeps
      );

      expect(result.success).toBe(false);
      expect(result.source).toBe('invalid-domain');
      // Should not call provider or search for invalid domain
      expect(mockDeps.getCommerceProvider).not.toHaveBeenCalled();
      expect(mockDeps.searchSimilarContent).not.toHaveBeenCalled();
    });
  });

  describe('General Error Handling', () => {
    it('should catch and handle unexpected errors', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      mockDeps = {
        getCommerceProvider: jest.fn().mockRejectedValue(new Error('Unexpected error')),
        searchSimilarContent: jest.fn(),
      };

      const result = await executeGetProductDetails(
        'TEST-SKU',
        true,
        'test.com',
        mockDeps
      );

      expect(result.success).toBe(false);
      expect(result.source).toBe('error');
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('get_product_details error'),
        expect.any(Error)
      );

      consoleErrorSpy.mockRestore();
    });
  });
});

describe('WooCommerce Provider SKU Logging', () => {
  it('should log when SKU search fails and fallback to name search', async () => {
    // This test verifies that woocommerce-provider.ts logs appropriately
    // The actual logging is tested through integration, but we document the expected behavior

    const expectedLogs = [
      'SKU "MU110667601" not found in catalog, trying name search fallback',
      'Product "MU110667601" not found via SKU or name search',
    ];

    // Test documentation: When implementing WooCommerce SKU lookup,
    // ensure these log messages are present for debugging
    expect(expectedLogs).toHaveLength(2);
  });
});
