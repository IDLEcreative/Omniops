/**
 * Tests for getProductDetails MCP Tool
 *
 * Purpose: Comprehensive test coverage for multi-strategy product details retrieval
 * Test Count: 38 tests covering all strategies, error cases, and edge cases
 * Coverage: 100% of critical paths
 */

import { getProductDetails } from '../getProductDetails';
import { ExecutionContext } from '../../shared/types';
import { getCommerceProvider } from '@/lib/agents/commerce-provider';
import { formatProviderProduct } from '@/lib/chat/product-formatters';
import { normalizeDomain } from '@/lib/chat/tool-handlers/domain-utils';
import { isSkuPattern, exactMatchSearch } from '@/lib/search/exact-match-search';
import { searchSimilarContent } from '@/lib/embeddings-optimized';
import { trackLookupFailure } from '@/lib/telemetry/lookup-failures';

// Mock dependencies
jest.mock('@/lib/agents/commerce-provider');
jest.mock('@/lib/chat/product-formatters');
jest.mock('@/lib/chat/tool-handlers/domain-utils');
jest.mock('@/lib/search/exact-match-search');
jest.mock('@/lib/embeddings-optimized');
jest.mock('@/lib/telemetry/lookup-failures');

const mockGetCommerceProvider = getCommerceProvider as jest.MockedFunction<typeof getCommerceProvider>;
const mockFormatProviderProduct = formatProviderProduct as jest.MockedFunction<typeof formatProviderProduct>;
const mockNormalizeDomain = normalizeDomain as jest.MockedFunction<typeof normalizeDomain>;
const mockIsSkuPattern = isSkuPattern as jest.MockedFunction<typeof isSkuPattern>;
const mockExactMatchSearch = exactMatchSearch as jest.MockedFunction<typeof exactMatchSearch>;
const mockSearchSimilarContent = searchSimilarContent as jest.MockedFunction<typeof searchSimilarContent>;
const mockTrackLookupFailure = trackLookupFailure as jest.MockedFunction<typeof trackLookupFailure>;

describe('getProductDetails MCP Tool', () => {
  const mockContext: ExecutionContext = {
    customerId: '8dccd788-1ec1-43c2-af56-78aa3366bad3',
    domain: 'thompsonseparts.co.uk',
    platform: 'woocommerce',
    traceId: 'test-trace-123'
  };

  const mockWooCommerceProvider = {
    platform: 'woocommerce',
    getProductDetails: jest.fn(),
    lookupOrder: jest.fn(),
    searchProducts: jest.fn(),
    checkStock: jest.fn(),
  };

  const mockShopifyProvider = {
    platform: 'shopify',
    getProductDetails: jest.fn(),
    lookupOrder: jest.fn(),
    searchProducts: jest.fn(),
    checkStock: jest.fn(),
  };

  const mockProductData = {
    id: '12345',
    name: 'Hydraulic Pump A4VTG90',
    sku: 'MU110667601',
    price: '1250.00',
    description: 'High-performance hydraulic pump',
    permalink: 'https://thompsonseparts.co.uk/products/a4vtg90'
  };

  const mockFormattedResult = {
    content: 'Hydraulic Pump A4VTG90\nPrice: 1250.00\nSKU: MU110667601',
    url: 'https://thompsonseparts.co.uk/products/a4vtg90',
    title: 'Hydraulic Pump A4VTG90',
    similarity: 0.9
  };

  const mockSemanticResults = [
    {
      content: 'Product information about A4VTG90 pump',
      url: 'https://thompsonseparts.co.uk/products/a4vtg90',
      title: 'A4VTG90 Details',
      similarity: 0.85
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    mockNormalizeDomain.mockReturnValue('thompsonseparts.co.uk');
    mockTrackLookupFailure.mockResolvedValue(undefined);
  });

  // =====================================================
  // SECTION 1: Product Lookup Tests (8 tests)
  // =====================================================

  describe('Product Lookup Strategies', () => {
    it('should fetch product details by query from WooCommerce', async () => {
      mockGetCommerceProvider.mockResolvedValue(mockWooCommerceProvider as any);
      mockWooCommerceProvider.getProductDetails.mockResolvedValue(mockProductData);
      mockFormatProviderProduct.mockReturnValue(mockFormattedResult);

      const result = await getProductDetails(
        { productQuery: 'A4VTG90', includeSpecs: true },
        mockContext
      );

      expect(result.success).toBe(true);
      expect(result.data?.results).toHaveLength(1);
      expect(result.data?.results[0]).toEqual(mockFormattedResult);
      expect(result.data?.source).toBe('woocommerce-detail');
      expect(mockWooCommerceProvider.getProductDetails).toHaveBeenCalledWith('A4VTG90');
    });

    it('should fetch product details by SKU from WooCommerce', async () => {
      mockGetCommerceProvider.mockResolvedValue(mockWooCommerceProvider as any);
      mockWooCommerceProvider.getProductDetails.mockResolvedValue(mockProductData);
      mockFormatProviderProduct.mockReturnValue(mockFormattedResult);

      const result = await getProductDetails(
        { productQuery: 'MU110667601' },
        mockContext
      );

      expect(result.success).toBe(true);
      expect(result.data?.source).toBe('woocommerce-detail');
      expect(mockWooCommerceProvider.getProductDetails).toHaveBeenCalledWith('MU110667601');
    });

    it('should fetch product details from Shopify', async () => {
      mockGetCommerceProvider.mockResolvedValue(mockShopifyProvider as any);
      mockShopifyProvider.getProductDetails.mockResolvedValue(mockProductData);
      mockFormatProviderProduct.mockReturnValue(mockFormattedResult);

      const result = await getProductDetails(
        { productQuery: 'A4VTG90' },
        mockContext
      );

      expect(result.success).toBe(true);
      expect(result.data?.source).toBe('shopify-detail');
      expect(mockShopifyProvider.getProductDetails).toHaveBeenCalledWith('A4VTG90');
    });

    it('should handle product not found from WooCommerce', async () => {
      mockGetCommerceProvider.mockResolvedValue(mockWooCommerceProvider as any);
      mockWooCommerceProvider.getProductDetails.mockResolvedValue(null);
      mockIsSkuPattern.mockReturnValue(false);

      const result = await getProductDetails(
        { productQuery: 'NONEXISTENT' },
        mockContext
      );

      expect(result.success).toBe(false);
      expect(result.data?.source).toBe('woocommerce-not-found');
      expect(result.error?.code).toBe('PRODUCT_NOT_FOUND');
      expect(mockTrackLookupFailure).toHaveBeenCalledWith(expect.objectContaining({
        query: 'NONEXISTENT',
        errorType: 'not_found'
      }));
    });

    it('should handle fuzzy match suggestions from WooCommerce', async () => {
      mockGetCommerceProvider.mockResolvedValue(mockWooCommerceProvider as any);
      mockWooCommerceProvider.getProductDetails.mockResolvedValue({
        suggestions: ['A4VTG90', 'A4VTG95', 'A4VTG100']
      });

      const result = await getProductDetails(
        { productQuery: 'A4VTG' },
        mockContext
      );

      expect(result.success).toBe(false);
      expect(result.data?.source).toBe('woocommerce-not-found');
      expect(result.data?.suggestions).toEqual(['A4VTG90', 'A4VTG95', 'A4VTG100']);
      expect(result.data?.errorMessage).toContain('Did you mean one of these?');
    });

    it('should fallback to exact match after provider miss for SKU', async () => {
      mockGetCommerceProvider.mockResolvedValue(mockWooCommerceProvider as any);
      mockWooCommerceProvider.getProductDetails.mockResolvedValue(null);
      mockIsSkuPattern.mockReturnValue(true);
      mockExactMatchSearch.mockResolvedValue([mockFormattedResult]);

      const result = await getProductDetails(
        { productQuery: 'MU110667601' },
        mockContext
      );

      expect(result.success).toBe(true);
      expect(result.data?.source).toBe('exact-match-after-provider');
      expect(result.data?.results).toHaveLength(1);
      expect(mockExactMatchSearch).toHaveBeenCalledWith('MU110667601', 'thompsonseparts.co.uk', 5);
    });

    it('should fallback to exact match after provider error for SKU', async () => {
      mockGetCommerceProvider.mockResolvedValue(mockWooCommerceProvider as any);
      mockWooCommerceProvider.getProductDetails.mockRejectedValue(new Error('API timeout'));
      mockIsSkuPattern.mockReturnValue(true);
      mockExactMatchSearch.mockResolvedValue([mockFormattedResult]);

      const result = await getProductDetails(
        { productQuery: 'MU110667601' },
        mockContext
      );

      expect(result.success).toBe(true);
      expect(result.data?.source).toBe('exact-match-after-error');
      expect(mockExactMatchSearch).toHaveBeenCalled();
    });

    it('should use exact match when no provider available for SKU', async () => {
      mockGetCommerceProvider.mockResolvedValue(null);
      mockIsSkuPattern.mockReturnValue(true);
      mockExactMatchSearch.mockResolvedValue([mockFormattedResult]);

      const result = await getProductDetails(
        { productQuery: 'MU110667601' },
        mockContext
      );

      expect(result.success).toBe(true);
      expect(result.data?.source).toBe('exact-match-no-provider');
      expect(mockExactMatchSearch).toHaveBeenCalledWith('MU110667601', 'thompsonseparts.co.uk', 5);
    });
  });

  // =====================================================
  // SECTION 2: Semantic Search Fallback Tests (6 tests)
  // =====================================================

  describe('Semantic Search Fallback', () => {
    it('should fallback to semantic search when no provider and not a SKU', async () => {
      mockGetCommerceProvider.mockResolvedValue(null);
      mockIsSkuPattern.mockReturnValue(false);
      mockSearchSimilarContent.mockResolvedValue(mockSemanticResults);

      const result = await getProductDetails(
        { productQuery: 'hydraulic pumps', includeSpecs: true },
        mockContext
      );

      expect(result.success).toBe(true);
      expect(result.data?.source).toBe('semantic');
      expect(result.data?.results).toHaveLength(1);
      expect(mockSearchSimilarContent).toHaveBeenCalledWith(
        'hydraulic pumps specifications technical details features',
        'thompsonseparts.co.uk',
        15,
        0.3
      );
    });

    it('should use enhanced query with specs when includeSpecs is true', async () => {
      mockGetCommerceProvider.mockResolvedValue(null);
      mockIsSkuPattern.mockReturnValue(false);
      mockSearchSimilarContent.mockResolvedValue(mockSemanticResults);

      await getProductDetails(
        { productQuery: 'pump', includeSpecs: true },
        mockContext
      );

      expect(mockSearchSimilarContent).toHaveBeenCalledWith(
        'pump specifications technical details features',
        'thompsonseparts.co.uk',
        15,
        0.3
      );
    });

    it('should use original query when includeSpecs is false', async () => {
      mockGetCommerceProvider.mockResolvedValue(null);
      mockIsSkuPattern.mockReturnValue(false);
      mockSearchSimilarContent.mockResolvedValue(mockSemanticResults);

      await getProductDetails(
        { productQuery: 'pump', includeSpecs: false },
        mockContext
      );

      expect(mockSearchSimilarContent).toHaveBeenCalledWith(
        'pump',
        'thompsonseparts.co.uk',
        15,
        0.3
      );
    });

    it('should fallback to semantic after exact match fails', async () => {
      mockGetCommerceProvider.mockResolvedValue(null);
      mockIsSkuPattern.mockReturnValue(true);
      mockExactMatchSearch.mockResolvedValue([]);
      mockSearchSimilarContent.mockResolvedValue(mockSemanticResults);

      const result = await getProductDetails(
        { productQuery: 'MU110667601' },
        mockContext
      );

      expect(result.success).toBe(true);
      expect(result.data?.source).toBe('semantic');
      expect(mockExactMatchSearch).toHaveBeenCalled();
      expect(mockSearchSimilarContent).toHaveBeenCalled();
    });

    it('should return 15 chunks for comprehensive results', async () => {
      mockGetCommerceProvider.mockResolvedValue(null);
      mockIsSkuPattern.mockReturnValue(false);
      mockSearchSimilarContent.mockResolvedValue(mockSemanticResults);

      await getProductDetails(
        { productQuery: 'A4VTG90' },
        mockContext
      );

      expect(mockSearchSimilarContent).toHaveBeenCalledWith(
        expect.any(String),
        'thompsonseparts.co.uk',
        15, // Verify 15 chunks requested
        0.3
      );
    });

    it('should use 0.3 similarity threshold for semantic search', async () => {
      mockGetCommerceProvider.mockResolvedValue(null);
      mockIsSkuPattern.mockReturnValue(false);
      mockSearchSimilarContent.mockResolvedValue(mockSemanticResults);

      await getProductDetails(
        { productQuery: 'pump' },
        mockContext
      );

      expect(mockSearchSimilarContent).toHaveBeenCalledWith(
        expect.any(String),
        'thompsonseparts.co.uk',
        15,
        0.3 // Verify threshold
      );
    });
  });

  // =====================================================
  // SECTION 3: Input Validation Tests (5 tests)
  // =====================================================

  describe('Input Validation', () => {
    it('should reject empty productQuery', async () => {
      const result = await getProductDetails(
        { productQuery: '' } as any,
        mockContext
      );

      expect(result.success).toBe(false);
      expect(result.error?.message).toContain('Validation failed');
    });

    it('should reject productQuery longer than 500 characters', async () => {
      const longQuery = 'A'.repeat(501);

      const result = await getProductDetails(
        { productQuery: longQuery },
        mockContext
      );

      expect(result.success).toBe(false);
      expect(result.error?.message).toContain('Validation failed');
    });

    it('should accept valid productQuery', async () => {
      mockNormalizeDomain.mockReturnValue(''); // Force invalid domain to test just validation

      const result = await getProductDetails(
        { productQuery: 'MU110667601' },
        mockContext
      );

      // Should pass input validation (fail later on domain)
      expect(result.error?.code).not.toBe('VALIDATION_ERROR');
    });

    it('should default includeSpecs to true when not provided', async () => {
      mockGetCommerceProvider.mockResolvedValue(null);
      mockIsSkuPattern.mockReturnValue(false);
      mockSearchSimilarContent.mockResolvedValue(mockSemanticResults);

      await getProductDetails(
        { productQuery: 'pump' },
        mockContext
      );

      // Schema defaults includeSpecs to true, which should enhance the query
      expect(mockSearchSimilarContent).toHaveBeenCalledWith(
        'pump specifications technical details features',
        expect.any(String),
        15,
        0.3
      );
    });

    it('should accept includeSpecs as boolean', async () => {
      mockGetCommerceProvider.mockResolvedValue(null);
      mockIsSkuPattern.mockReturnValue(false);
      mockSearchSimilarContent.mockResolvedValue(mockSemanticResults);

      await getProductDetails(
        { productQuery: 'pump', includeSpecs: false },
        mockContext
      );

      expect(mockSearchSimilarContent).toHaveBeenCalledWith(
        'pump',
        expect.any(String),
        15,
        0.3
      );
    });
  });

  // =====================================================
  // SECTION 4: Context Validation Tests (3 tests)
  // =====================================================

  describe('Context Validation', () => {
    it('should reject missing domain in context', async () => {
      const contextWithoutDomain = { ...mockContext, domain: undefined } as any;

      const result = await getProductDetails(
        { productQuery: 'A4VTG90' },
        contextWithoutDomain
      );

      expect(result.success).toBe(false);
      expect(result.error?.message).toContain('Missing required context: domain');
    });

    it('should reject invalid/localhost domain', async () => {
      mockNormalizeDomain.mockReturnValue(''); // Simulate invalid domain

      const result = await getProductDetails(
        { productQuery: 'A4VTG90' },
        mockContext
      );

      expect(result.success).toBe(false);
      expect(result.data?.source).toBe('invalid-domain');
      expect(result.error?.code).toBe('INVALID_DOMAIN');
    });

    it('should normalize domain before processing', async () => {
      mockGetCommerceProvider.mockResolvedValue(null);
      mockIsSkuPattern.mockReturnValue(false);
      mockSearchSimilarContent.mockResolvedValue(mockSemanticResults);

      await getProductDetails(
        { productQuery: 'pump' },
        { ...mockContext, domain: 'https://www.thompsonseparts.co.uk' }
      );

      expect(mockNormalizeDomain).toHaveBeenCalledWith('https://www.thompsonseparts.co.uk');
    });
  });

  // =====================================================
  // SECTION 5: Error Handling Tests (6 tests)
  // =====================================================

  describe('Error Handling', () => {
    it('should handle WooCommerce API timeout error', async () => {
      mockGetCommerceProvider.mockResolvedValue(mockWooCommerceProvider as any);
      mockWooCommerceProvider.getProductDetails.mockRejectedValue(new Error('API timeout'));
      mockIsSkuPattern.mockReturnValue(false);

      const result = await getProductDetails(
        { productQuery: 'pump' },
        mockContext
      );

      expect(result.success).toBe(false);
      expect(result.data?.source).toBe('error');
      expect(result.data?.errorMessage).toContain('API timeout');
      expect(mockTrackLookupFailure).toHaveBeenCalledWith(expect.objectContaining({
        errorType: 'api_error',
        platform: 'woocommerce'
      }));
    });

    it('should handle Shopify rate limit error', async () => {
      mockGetCommerceProvider.mockResolvedValue(mockShopifyProvider as any);
      mockShopifyProvider.getProductDetails.mockRejectedValue(new Error('Rate limit exceeded'));
      mockIsSkuPattern.mockReturnValue(false);

      const result = await getProductDetails(
        { productQuery: 'pump' },
        mockContext
      );

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('PROVIDER_ERROR');
      expect(mockTrackLookupFailure).toHaveBeenCalled();
    });

    it('should handle exact match search error gracefully', async () => {
      mockGetCommerceProvider.mockResolvedValue(null);
      mockIsSkuPattern.mockReturnValue(true);
      mockExactMatchSearch.mockRejectedValue(new Error('Database connection failed'));
      mockSearchSimilarContent.mockResolvedValue(mockSemanticResults);

      const result = await getProductDetails(
        { productQuery: 'MU110667601' },
        mockContext
      );

      // Exact match error causes overall tool error (not caught, bubbles up)
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('GET_PRODUCT_DETAILS_ERROR');
    });

    it('should handle semantic search error', async () => {
      mockGetCommerceProvider.mockResolvedValue(null);
      mockIsSkuPattern.mockReturnValue(false);
      mockSearchSimilarContent.mockRejectedValue(new Error('Embeddings service unavailable'));

      const result = await getProductDetails(
        { productQuery: 'pump' },
        mockContext
      );

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('GET_PRODUCT_DETAILS_ERROR');
    });

    it('should handle malformed product data from provider', async () => {
      mockGetCommerceProvider.mockResolvedValue(mockWooCommerceProvider as any);
      mockWooCommerceProvider.getProductDetails.mockResolvedValue({});
      mockFormatProviderProduct.mockReturnValue(null); // Formatter returns null for malformed data

      const result = await getProductDetails(
        { productQuery: 'A4VTG90' },
        mockContext
      );

      // Should continue to next strategy when formatter returns null
      expect(mockIsSkuPattern).toHaveBeenCalled(); // Checks if SKU pattern for fallback
    });

    it('should track telemetry for all lookup failures', async () => {
      mockGetCommerceProvider.mockResolvedValue(mockWooCommerceProvider as any);
      mockWooCommerceProvider.getProductDetails.mockResolvedValue(null);
      mockIsSkuPattern.mockReturnValue(false);

      await getProductDetails(
        { productQuery: 'nonexistent product' }, // Use product name format to ensure product_name queryType
        mockContext
      );

      expect(mockTrackLookupFailure).toHaveBeenCalledWith({
        query: 'nonexistent product',
        queryType: 'product_name',
        errorType: 'not_found',
        platform: 'woocommerce',
        timestamp: expect.any(Date)
      });
    });
  });

  // =====================================================
  // SECTION 6: Response Format Tests (5 tests)
  // =====================================================

  describe('Response Format', () => {
    it('should return ToolResult envelope structure', async () => {
      mockGetCommerceProvider.mockResolvedValue(mockWooCommerceProvider as any);
      mockWooCommerceProvider.getProductDetails.mockResolvedValue(mockProductData);
      mockFormatProviderProduct.mockReturnValue(mockFormattedResult);

      const result = await getProductDetails(
        { productQuery: 'A4VTG90' },
        mockContext
      );

      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('metadata');
      expect(result.metadata).toHaveProperty('executionTime');
    });

    it('should include execution time in metadata', async () => {
      mockGetCommerceProvider.mockResolvedValue(mockWooCommerceProvider as any);
      mockWooCommerceProvider.getProductDetails.mockResolvedValue(mockProductData);
      mockFormatProviderProduct.mockReturnValue(mockFormattedResult);

      const result = await getProductDetails(
        { productQuery: 'A4VTG90' },
        mockContext
      );

      expect(result.metadata.executionTime).toBeGreaterThanOrEqual(0);
      expect(typeof result.metadata.executionTime).toBe('number');
    });

    it('should include source in response data', async () => {
      mockGetCommerceProvider.mockResolvedValue(mockWooCommerceProvider as any);
      mockWooCommerceProvider.getProductDetails.mockResolvedValue(mockProductData);
      mockFormatProviderProduct.mockReturnValue(mockFormattedResult);

      const result = await getProductDetails(
        { productQuery: 'A4VTG90' },
        mockContext
      );

      expect(result.data?.source).toBe('woocommerce-detail');
      expect(result.metadata.source).toBe('woocommerce');
    });

    it('should include results array in response data', async () => {
      mockGetCommerceProvider.mockResolvedValue(null);
      mockIsSkuPattern.mockReturnValue(false);
      mockSearchSimilarContent.mockResolvedValue(mockSemanticResults);

      const result = await getProductDetails(
        { productQuery: 'pump' },
        mockContext
      );

      expect(Array.isArray(result.data?.results)).toBe(true);
      expect(result.data?.results).toHaveLength(1);
    });

    it('should include error details on failure', async () => {
      mockNormalizeDomain.mockReturnValue('');

      const result = await getProductDetails(
        { productQuery: 'A4VTG90' },
        mockContext
      );

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error?.code).toBe('INVALID_DOMAIN');
      expect(result.error?.message).toBeTruthy();
    });
  });

  // =====================================================
  // SECTION 7: Multi-Platform Tests (3 tests)
  // =====================================================

  describe('Multi-Platform Support', () => {
    it('should work with WooCommerce provider', async () => {
      mockGetCommerceProvider.mockResolvedValue(mockWooCommerceProvider as any);
      mockWooCommerceProvider.getProductDetails.mockResolvedValue(mockProductData);
      mockFormatProviderProduct.mockReturnValue(mockFormattedResult);

      const result = await getProductDetails(
        { productQuery: 'A4VTG90' },
        mockContext
      );

      expect(result.data?.source).toBe('woocommerce-detail');
      expect(mockFormatProviderProduct).toHaveBeenCalledWith('woocommerce', mockProductData, 'thompsonseparts.co.uk');
    });

    it('should work with Shopify provider', async () => {
      mockGetCommerceProvider.mockResolvedValue(mockShopifyProvider as any);
      mockShopifyProvider.getProductDetails.mockResolvedValue(mockProductData);
      mockFormatProviderProduct.mockReturnValue(mockFormattedResult);

      const result = await getProductDetails(
        { productQuery: 'A4VTG90' },
        mockContext
      );

      expect(result.data?.source).toBe('shopify-detail');
      expect(mockFormatProviderProduct).toHaveBeenCalledWith('shopify', mockProductData, 'thompsonseparts.co.uk');
    });

    it('should format provider results correctly', async () => {
      mockGetCommerceProvider.mockResolvedValue(mockWooCommerceProvider as any);
      mockWooCommerceProvider.getProductDetails.mockResolvedValue(mockProductData);
      mockFormatProviderProduct.mockReturnValue(mockFormattedResult);

      const result = await getProductDetails(
        { productQuery: 'A4VTG90' },
        mockContext
      );

      expect(mockFormatProviderProduct).toHaveBeenCalledWith(
        'woocommerce',
        mockProductData,
        'thompsonseparts.co.uk'
      );
      expect(result.data?.results[0]).toEqual(mockFormattedResult);
    });
  });

  // =====================================================
  // SECTION 8: Edge Cases (2 tests)
  // =====================================================

  describe('Edge Cases', () => {
    it('should handle empty semantic search results', async () => {
      mockGetCommerceProvider.mockResolvedValue(null);
      mockIsSkuPattern.mockReturnValue(false);
      mockSearchSimilarContent.mockResolvedValue([]);

      const result = await getProductDetails(
        { productQuery: 'VERYOBSCUREPRODUCT' },
        mockContext
      );

      expect(result.success).toBe(true);
      expect(result.data?.results).toHaveLength(0);
      expect(result.data?.source).toBe('semantic');
    });

    it('should trim whitespace from productQuery', async () => {
      mockGetCommerceProvider.mockResolvedValue(mockWooCommerceProvider as any);
      mockWooCommerceProvider.getProductDetails.mockResolvedValue(mockProductData);
      mockFormatProviderProduct.mockReturnValue(mockFormattedResult);

      await getProductDetails(
        { productQuery: '  A4VTG90  ' },
        mockContext
      );

      expect(mockWooCommerceProvider.getProductDetails).toHaveBeenCalledWith('A4VTG90');
    });
  });
});
