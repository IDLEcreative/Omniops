/**
 * Tests for Semantic Search Fallback
 *
 * Purpose: Tests for semantic search when commerce provider is unavailable or returns no results
 * Test Count: 6 tests covering semantic search parameters, query enhancement, and fallback behavior
 * Coverage: Semantic search configuration, query expansion, threshold validation
 */

import { getProductDetails } from '../../../servers/commerce/getProductDetails';
import { getCommerceProvider } from '@/lib/agents/commerce-provider';
import { normalizeDomain } from '@/lib/chat/tool-handlers/domain-utils';
import { isSkuPattern, exactMatchSearch } from '@/lib/search/exact-match-search';
import { searchSimilarContent } from '@/lib/embeddings-optimized';
import { trackLookupFailure } from '@/lib/telemetry/lookup-failures';
import { mockContext, mockSemanticResults } from './test-helpers';

// Mock dependencies
jest.mock('@/lib/agents/commerce-provider');
jest.mock('@/lib/chat/tool-handlers/domain-utils');
jest.mock('@/lib/search/exact-match-search');
jest.mock('@/lib/embeddings-optimized');
jest.mock('@/lib/telemetry/lookup-failures');

const mockGetCommerceProvider = getCommerceProvider as jest.MockedFunction<typeof getCommerceProvider>;
const mockNormalizeDomain = normalizeDomain as jest.MockedFunction<typeof normalizeDomain>;
const mockIsSkuPattern = isSkuPattern as jest.MockedFunction<typeof isSkuPattern>;
const mockExactMatchSearch = exactMatchSearch as jest.MockedFunction<typeof exactMatchSearch>;
const mockSearchSimilarContent = searchSimilarContent as jest.MockedFunction<typeof searchSimilarContent>;
const mockTrackLookupFailure = trackLookupFailure as jest.MockedFunction<typeof trackLookupFailure>;

describe('Semantic Search Fallback', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockNormalizeDomain.mockReturnValue('thompsonseparts.co.uk');
    mockTrackLookupFailure.mockResolvedValue(undefined);
  });

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
