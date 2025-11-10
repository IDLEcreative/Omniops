/**
 * Tests for Response Format and Multi-Platform Support
 *
 * Purpose: Tests for response structure, metadata, multi-platform integration, and edge cases
 * Test Count: 10 tests covering response envelope, metadata, platform support, and edge cases
 * Coverage: Response structure, execution time, multi-platform formatting, edge case handling
 */

import { getProductDetails } from '../../../servers/commerce/getProductDetails';
import { getCommerceProvider } from '@/lib/agents/commerce-provider';
import { formatProviderProduct } from '@/lib/chat/product-formatters';
import { normalizeDomain } from '@/lib/chat/tool-handlers/domain-utils';
import { isSkuPattern } from '@/lib/search/exact-match-search';
import { searchSimilarContent } from '@/lib/embeddings-optimized';
import { trackLookupFailure } from '@/lib/telemetry/lookup-failures';
import {
  mockContext,
  mockWooCommerceProvider,
  mockShopifyProvider,
  mockProductData,
  mockFormattedResult,
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
const mockSearchSimilarContent = searchSimilarContent as jest.MockedFunction<typeof searchSimilarContent>;
const mockTrackLookupFailure = trackLookupFailure as jest.MockedFunction<typeof trackLookupFailure>;

describe('Response Format', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockNormalizeDomain.mockReturnValue('thompsonseparts.co.uk');
    mockTrackLookupFailure.mockResolvedValue(undefined);
  });

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

describe('Multi-Platform Support', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockNormalizeDomain.mockReturnValue('thompsonseparts.co.uk');
    mockTrackLookupFailure.mockResolvedValue(undefined);
  });

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

describe('Edge Cases', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockNormalizeDomain.mockReturnValue('thompsonseparts.co.uk');
    mockTrackLookupFailure.mockResolvedValue(undefined);
  });

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
