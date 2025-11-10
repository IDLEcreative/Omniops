/**
 * Tests for Input and Context Validation
 *
 * Purpose: Tests for request validation, domain normalization, and context requirements
 * Test Count: 8 tests covering input validation, context validation, and domain handling
 * Coverage: Schema validation, domain normalization, context requirements
 */

import { getProductDetails } from '../../../servers/commerce/getProductDetails';
import { getCommerceProvider } from '@/lib/agents/commerce-provider';
import { normalizeDomain } from '@/lib/chat/tool-handlers/domain-utils';
import { isSkuPattern } from '@/lib/search/exact-match-search';
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
const mockSearchSimilarContent = searchSimilarContent as jest.MockedFunction<typeof searchSimilarContent>;
const mockTrackLookupFailure = trackLookupFailure as jest.MockedFunction<typeof trackLookupFailure>;

describe('Input Validation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockNormalizeDomain.mockReturnValue('thompsonseparts.co.uk');
    mockTrackLookupFailure.mockResolvedValue(undefined);
  });

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

describe('Context Validation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockNormalizeDomain.mockReturnValue('thompsonseparts.co.uk');
    mockTrackLookupFailure.mockResolvedValue(undefined);
  });

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
