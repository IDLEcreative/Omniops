/**
 * Tests for Error Handling
 *
 * Purpose: Tests for error scenarios including provider failures, API errors, and telemetry tracking
 * Test Count: 6 tests covering provider errors, search failures, malformed data, and telemetry
 * Coverage: Error handling, failure tracking, resilience, telemetry integration
 */

import { getProductDetails } from '../../../servers/commerce/getProductDetails';
import { getCommerceProvider } from '@/lib/agents/commerce-provider';
import { formatProviderProduct } from '@/lib/chat/product-formatters';
import { normalizeDomain } from '@/lib/chat/tool-handlers/domain-utils';
import { isSkuPattern, exactMatchSearch } from '@/lib/search/exact-match-search';
import { searchSimilarContent } from '@/lib/embeddings-optimized';
import { trackLookupFailure } from '@/lib/telemetry/lookup-failures';
import {
  mockContext,
  mockWooCommerceProvider,
  mockShopifyProvider,
  mockSemanticResults
} from './test-helpers';

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

describe('Error Handling', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockNormalizeDomain.mockReturnValue('thompsonseparts.co.uk');
    mockTrackLookupFailure.mockResolvedValue(undefined);
  });

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
