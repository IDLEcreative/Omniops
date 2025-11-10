/**
 * Tests for Product Lookup Strategies
 *
 * Purpose: Tests for primary product lookup via commerce providers (WooCommerce/Shopify)
 * Test Count: 8 tests covering provider lookups, SKU fallback, and provider failures
 * Coverage: Strategy selection, provider integration, fallback mechanisms
 */

import { getProductDetails } from '../../../servers/commerce/getProductDetails';
import { getCommerceProvider } from '@/lib/agents/commerce-provider';
import { formatProviderProduct } from '@/lib/chat/product-formatters';
import { normalizeDomain } from '@/lib/chat/tool-handlers/domain-utils';
import { isSkuPattern, exactMatchSearch } from '@/lib/search/exact-match-search';
import { trackLookupFailure } from '@/lib/telemetry/lookup-failures';
import {
  mockContext,
  mockWooCommerceProvider,
  mockShopifyProvider,
  mockProductData,
  mockFormattedResult
} from './test-helpers';

// Mock dependencies
jest.mock('@/lib/agents/commerce-provider');
jest.mock('@/lib/chat/product-formatters');
jest.mock('@/lib/chat/tool-handlers/domain-utils');
jest.mock('@/lib/search/exact-match-search');
jest.mock('@/lib/telemetry/lookup-failures');

const mockGetCommerceProvider = getCommerceProvider as jest.MockedFunction<typeof getCommerceProvider>;
const mockFormatProviderProduct = formatProviderProduct as jest.MockedFunction<typeof formatProviderProduct>;
const mockNormalizeDomain = normalizeDomain as jest.MockedFunction<typeof normalizeDomain>;
const mockIsSkuPattern = isSkuPattern as jest.MockedFunction<typeof isSkuPattern>;
const mockExactMatchSearch = exactMatchSearch as jest.MockedFunction<typeof exactMatchSearch>;
const mockTrackLookupFailure = trackLookupFailure as jest.MockedFunction<typeof trackLookupFailure>;

describe('Product Lookup Strategies', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockNormalizeDomain.mockReturnValue('thompsonseparts.co.uk');
    mockTrackLookupFailure.mockResolvedValue(undefined);
  });

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
