/**
 * Tests for getCompletePageDetails MCP Tool
 *
 * Purpose: Comprehensive test coverage for complete page retrieval functionality
 * Category: content
 * Version: 1.0.0
 * Last Updated: 2025-11-05
 *
 * Test Coverage: 25 tests covering all scenarios
 */

import { getCompletePageDetails } from '../getCompletePageDetails';
import { ExecutionContext } from '../../shared/types';
import { searchAndReturnFullPage } from '@/lib/full-page-retrieval';
import { normalizeDomain } from '@/lib/chat/tool-handlers/domain-utils';

// Mock dependencies
jest.mock('@/lib/full-page-retrieval');
jest.mock('@/lib/chat/tool-handlers/domain-utils');
jest.mock('../../shared/utils/logger', () => ({
  logToolExecution: jest.fn(),
  PerformanceTimer: jest.fn().mockImplementation(() => ({
    elapsed: jest.fn(() => 42) // Mock timer returns 42ms
  }))
}));

const mockSearchAndReturnFullPage = searchAndReturnFullPage as jest.MockedFunction<typeof searchAndReturnFullPage>;
const mockNormalizeDomain = normalizeDomain as jest.MockedFunction<typeof normalizeDomain>;

describe('getCompletePageDetails MCP Tool', () => {
  const mockContext: ExecutionContext = {
    customerId: '8dccd788-1ec1-43c2-af56-78aa3366bad3',
    domain: 'thompsonseparts.co.uk',
    sessionId: 'test-session-123'
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Default: domain normalization succeeds
    mockNormalizeDomain.mockReturnValue('thompsonseparts.co.uk');
  });

  // =====================================================
  // SECTION 1: Successful Page Retrieval
  // =====================================================

  describe('Successful Page Retrieval', () => {
    it('should retrieve complete page details with all chunks', async () => {
      const mockChunks = [
        {
          content: 'Hydraulic pump A4VTG90 - High performance',
          url: 'https://thompsonseparts.co.uk/product/a4vtg90',
          title: 'A4VTG90 Hydraulic Pump',
          similarity: 0.95,
          metadata: { chunk_index: 0, total_chunks: 3, retrieval_strategy: 'full_page' }
        },
        {
          content: 'Technical specifications: 90cc displacement',
          url: 'https://thompsonseparts.co.uk/product/a4vtg90',
          title: 'A4VTG90 Hydraulic Pump',
          similarity: 0.94,
          metadata: { chunk_index: 1, total_chunks: 3, retrieval_strategy: 'full_page' }
        },
        {
          content: 'Price: £450.00 - Available in stock',
          url: 'https://thompsonseparts.co.uk/product/a4vtg90',
          title: 'A4VTG90 Hydraulic Pump',
          similarity: 0.93,
          metadata: { chunk_index: 2, total_chunks: 3, retrieval_strategy: 'full_page' }
        }
      ];

      mockSearchAndReturnFullPage.mockResolvedValue({
        success: true,
        results: mockChunks,
        source: 'full_page',
        pageInfo: {
          url: 'https://thompsonseparts.co.uk/product/a4vtg90',
          title: 'A4VTG90 Hydraulic Pump',
          totalChunks: 3
        }
      });

      const result = await getCompletePageDetails(
        { pageQuery: 'hydraulic pump A4VTG90' },
        mockContext
      );

      expect(result.success).toBe(true);
      expect(result.data?.results).toHaveLength(3);
      expect(result.data?.totalChunks).toBe(3);
      expect(result.data?.source).toBe('full-page');
      expect(result.data?.pageInfo).toBeDefined();
      expect(result.data?.pageInfo?.title).toBe('A4VTG90 Hydraulic Pump');
      expect(result.data?.executionTime).toBe(42);
      expect(result.metadata?.executionTime).toBe(42);
    });

    it('should include page metadata when includeMetadata is true', async () => {
      mockSearchAndReturnFullPage.mockResolvedValue({
        success: true,
        results: [
          {
            content: 'Test content',
            url: 'https://thompsonseparts.co.uk/test',
            title: 'Test Page',
            similarity: 0.9,
            metadata: {}
          }
        ],
        source: 'full_page',
        pageInfo: { url: 'https://thompsonseparts.co.uk/test', title: 'Test Page', totalChunks: 1 }
      });

      const result = await getCompletePageDetails(
        { pageQuery: 'test query', includeMetadata: true },
        mockContext
      );

      expect(result.success).toBe(true);
      expect(result.data?.metadata).toBeDefined();
      expect(result.data?.metadata?.retrievalStrategy).toBe('full_page');
      expect(result.data?.metadata?.queryUsed).toBe('test query');
      expect(result.data?.metadata?.similarityThreshold).toBe(0.3);
    });

    it('should exclude page metadata when includeMetadata is false', async () => {
      mockSearchAndReturnFullPage.mockResolvedValue({
        success: true,
        results: [
          {
            content: 'Test content',
            url: 'https://thompsonseparts.co.uk/test',
            title: 'Test Page',
            similarity: 0.9,
            metadata: {}
          }
        ],
        source: 'full_page',
        pageInfo: { url: 'https://thompsonseparts.co.uk/test', title: 'Test Page', totalChunks: 1 }
      });

      const result = await getCompletePageDetails(
        { pageQuery: 'test query', includeMetadata: false },
        mockContext
      );

      expect(result.success).toBe(true);
      expect(result.data?.metadata).toBeUndefined();
    });

    it('should handle custom fallback chunk limit', async () => {
      mockSearchAndReturnFullPage.mockResolvedValue({
        success: true,
        results: [],
        source: 'full_page',
        pageInfo: { url: '', title: '', totalChunks: 0 }
      });

      await getCompletePageDetails(
        { pageQuery: 'test', fallbackChunkLimit: 25 },
        mockContext
      );

      expect(mockSearchAndReturnFullPage).toHaveBeenCalledWith(
        'test',
        'thompsonseparts.co.uk',
        25,
        0.3
      );
    });

    it('should handle custom similarity threshold', async () => {
      mockSearchAndReturnFullPage.mockResolvedValue({
        success: true,
        results: [],
        source: 'full_page',
        pageInfo: { url: '', title: '', totalChunks: 0 }
      });

      await getCompletePageDetails(
        { pageQuery: 'test', similarityThreshold: 0.5 },
        mockContext
      );

      expect(mockSearchAndReturnFullPage).toHaveBeenCalledWith(
        'test',
        'thompsonseparts.co.uk',
        15,
        0.5
      );
    });

    it('should retrieve documentation page with multiple sections', async () => {
      const mockDocChunks = Array.from({ length: 10 }, (_, i) => ({
        content: `Documentation section ${i + 1}`,
        url: 'https://thompsonseparts.co.uk/docs/installation',
        title: 'Installation Guide',
        similarity: 0.9 - i * 0.01,
        metadata: { chunk_index: i, total_chunks: 10, retrieval_strategy: 'full_page' }
      }));

      mockSearchAndReturnFullPage.mockResolvedValue({
        success: true,
        results: mockDocChunks,
        source: 'full_page',
        pageInfo: {
          url: 'https://thompsonseparts.co.uk/docs/installation',
          title: 'Installation Guide',
          totalChunks: 10
        }
      });

      const result = await getCompletePageDetails(
        { pageQuery: 'installation guide' },
        mockContext
      );

      expect(result.success).toBe(true);
      expect(result.data?.results).toHaveLength(10);
      expect(result.data?.pageInfo?.title).toBe('Installation Guide');
    });
  });

  // =====================================================
  // SECTION 2: Error Handling
  // =====================================================

  describe('Error Handling', () => {
    it('should handle invalid domain', async () => {
      mockNormalizeDomain.mockReturnValue(null);

      const result = await getCompletePageDetails(
        { pageQuery: 'test' },
        mockContext
      );

      expect(result.success).toBe(false);
      expect(result.data?.source).toBe('invalid-domain');
      expect(result.error?.code).toBe('INVALID_DOMAIN');
      expect(result.error?.message).toContain('Invalid or localhost domain');
    });

    it('should handle missing domain in context', async () => {
      const contextWithoutDomain: ExecutionContext = {
        customerId: '8dccd788-1ec1-43c2-af56-78aa3366bad3'
      };

      const result = await getCompletePageDetails(
        { pageQuery: 'test' },
        contextWithoutDomain
      );

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('GET_PAGE_DETAILS_ERROR');
      expect(result.error?.message).toContain('Missing required context: domain');
    });

    it('should handle page not found', async () => {
      mockSearchAndReturnFullPage.mockResolvedValue({
        success: false,
        results: [],
        source: 'chunks_fallback'
      });

      const result = await getCompletePageDetails(
        { pageQuery: 'nonexistent page' },
        mockContext
      );

      expect(result.success).toBe(false);
      expect(result.data?.source).toBe('failed');
      expect(result.error?.code).toBe('PAGE_NOT_FOUND');
      expect(result.error?.message).toContain('no matching page found');
    });

    it('should handle full page retrieval error', async () => {
      mockSearchAndReturnFullPage.mockRejectedValue(new Error('Database connection failed'));

      const result = await getCompletePageDetails(
        { pageQuery: 'test' },
        mockContext
      );

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('GET_PAGE_DETAILS_ERROR');
      expect(result.error?.message).toContain('Database connection failed');
    });

    it('should handle empty results from full page retrieval', async () => {
      mockSearchAndReturnFullPage.mockResolvedValue({
        success: true,
        results: [],
        source: 'full_page',
        pageInfo: { url: '', title: '', totalChunks: 0 }
      });

      const result = await getCompletePageDetails(
        { pageQuery: 'test' },
        mockContext
      );

      expect(result.success).toBe(true);
      expect(result.data?.results).toHaveLength(0);
      expect(result.data?.totalChunks).toBe(0);
    });
  });

  // =====================================================
  // SECTION 3: Input Validation
  // =====================================================

  describe('Input Validation', () => {
    it('should reject empty pageQuery', async () => {
      const result = await getCompletePageDetails(
        { pageQuery: '' },
        mockContext
      );

      expect(result.success).toBe(false);
      expect(result.error?.message).toContain('Validation failed');
    });

    it('should reject pageQuery exceeding max length', async () => {
      const longQuery = 'a'.repeat(501);

      const result = await getCompletePageDetails(
        { pageQuery: longQuery },
        mockContext
      );

      expect(result.success).toBe(false);
      expect(result.error?.message).toContain('Validation failed');
    });

    it('should reject invalid fallbackChunkLimit (negative)', async () => {
      const result = await getCompletePageDetails(
        { pageQuery: 'test', fallbackChunkLimit: -1 },
        mockContext
      );

      expect(result.success).toBe(false);
      expect(result.error?.message).toContain('Validation failed');
    });

    it('should reject invalid fallbackChunkLimit (exceeds max)', async () => {
      const result = await getCompletePageDetails(
        { pageQuery: 'test', fallbackChunkLimit: 51 },
        mockContext
      );

      expect(result.success).toBe(false);
      expect(result.error?.message).toContain('Validation failed');
    });

    it('should reject invalid similarityThreshold (negative)', async () => {
      const result = await getCompletePageDetails(
        { pageQuery: 'test', similarityThreshold: -0.1 },
        mockContext
      );

      expect(result.success).toBe(false);
      expect(result.error?.message).toContain('Validation failed');
    });

    it('should reject invalid similarityThreshold (exceeds max)', async () => {
      const result = await getCompletePageDetails(
        { pageQuery: 'test', similarityThreshold: 1.1 },
        mockContext
      );

      expect(result.success).toBe(false);
      expect(result.error?.message).toContain('Validation failed');
    });

    it('should accept valid input with all optional parameters', async () => {
      mockSearchAndReturnFullPage.mockResolvedValue({
        success: true,
        results: [],
        source: 'full_page',
        pageInfo: { url: '', title: '', totalChunks: 0 }
      });

      const result = await getCompletePageDetails(
        {
          pageQuery: 'test',
          fallbackChunkLimit: 20,
          similarityThreshold: 0.4,
          includeMetadata: true
        },
        mockContext
      );

      expect(result.success).toBe(true);
    });
  });

  // =====================================================
  // SECTION 4: Multi-Tenant Isolation
  // =====================================================

  describe('Multi-Tenant Isolation', () => {
    it('should use correct domain for customer A', async () => {
      const customerAContext: ExecutionContext = {
        customerId: 'customer-a-uuid',
        domain: 'customera.com'
      };

      mockNormalizeDomain.mockReturnValue('customera.com');
      mockSearchAndReturnFullPage.mockResolvedValue({
        success: true,
        results: [],
        source: 'full_page',
        pageInfo: { url: '', title: '', totalChunks: 0 }
      });

      await getCompletePageDetails(
        { pageQuery: 'test' },
        customerAContext
      );

      expect(mockNormalizeDomain).toHaveBeenCalledWith('customera.com');
      expect(mockSearchAndReturnFullPage).toHaveBeenCalledWith(
        'test',
        'customera.com',
        15,
        0.3
      );
    });

    it('should use correct domain for customer B', async () => {
      const customerBContext: ExecutionContext = {
        customerId: 'customer-b-uuid',
        domain: 'customerb.com'
      };

      mockNormalizeDomain.mockReturnValue('customerb.com');
      mockSearchAndReturnFullPage.mockResolvedValue({
        success: true,
        results: [],
        source: 'full_page',
        pageInfo: { url: '', title: '', totalChunks: 0 }
      });

      await getCompletePageDetails(
        { pageQuery: 'test' },
        customerBContext
      );

      expect(mockNormalizeDomain).toHaveBeenCalledWith('customerb.com');
      expect(mockSearchAndReturnFullPage).toHaveBeenCalledWith(
        'test',
        'customerb.com',
        15,
        0.3
      );
    });
  });

  // =====================================================
  // SECTION 5: Performance & Response Format
  // =====================================================

  describe('Performance & Response Format', () => {
    it('should track execution time', async () => {
      mockSearchAndReturnFullPage.mockResolvedValue({
        success: true,
        results: [],
        source: 'full_page',
        pageInfo: { url: '', title: '', totalChunks: 0 }
      });

      const result = await getCompletePageDetails(
        { pageQuery: 'test' },
        mockContext
      );

      expect(result.metadata?.executionTime).toBe(42);
      expect(result.data?.executionTime).toBe(42);
    });

    it('should return proper ToolResult format on success', async () => {
      mockSearchAndReturnFullPage.mockResolvedValue({
        success: true,
        results: [
          {
            content: 'Test',
            url: 'https://test.com',
            title: 'Test',
            similarity: 0.9,
            metadata: {}
          }
        ],
        source: 'full_page',
        pageInfo: { url: 'https://test.com', title: 'Test', totalChunks: 1 }
      });

      const result = await getCompletePageDetails(
        { pageQuery: 'test' },
        mockContext
      );

      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('metadata');
      expect(result.data).toHaveProperty('results');
      expect(result.data).toHaveProperty('totalChunks');
      expect(result.data).toHaveProperty('executionTime');
      expect(result.data).toHaveProperty('source');
    });

    it('should return proper ToolResult format on error', async () => {
      mockNormalizeDomain.mockReturnValue(null);

      const result = await getCompletePageDetails(
        { pageQuery: 'test' },
        mockContext
      );

      expect(result).toHaveProperty('success', false);
      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('error');
      expect(result).toHaveProperty('metadata');
      expect(result.error).toHaveProperty('code');
      expect(result.error).toHaveProperty('message');
    });

    it('should set cached flag to false', async () => {
      mockSearchAndReturnFullPage.mockResolvedValue({
        success: true,
        results: [],
        source: 'full_page',
        pageInfo: { url: '', title: '', totalChunks: 0 }
      });

      const result = await getCompletePageDetails(
        { pageQuery: 'test' },
        mockContext
      );

      expect(result.metadata?.cached).toBe(false);
    });
  });

  // =====================================================
  // SECTION 6: Domain Normalization
  // =====================================================

  describe('Domain Normalization', () => {
    it('should handle www prefix in domain', async () => {
      const contextWithWWW: ExecutionContext = {
        customerId: 'test',
        domain: 'www.example.com'
      };

      mockNormalizeDomain.mockReturnValue('example.com');
      mockSearchAndReturnFullPage.mockResolvedValue({
        success: true,
        results: [],
        source: 'full_page',
        pageInfo: { url: '', title: '', totalChunks: 0 }
      });

      await getCompletePageDetails(
        { pageQuery: 'test' },
        contextWithWWW
      );

      expect(mockNormalizeDomain).toHaveBeenCalledWith('www.example.com');
      expect(mockSearchAndReturnFullPage).toHaveBeenCalledWith(
        'test',
        'example.com',
        15,
        0.3
      );
    });

    it('should handle https protocol in domain', async () => {
      const contextWithProtocol: ExecutionContext = {
        customerId: 'test',
        domain: 'https://example.com'
      };

      mockNormalizeDomain.mockReturnValue('example.com');
      mockSearchAndReturnFullPage.mockResolvedValue({
        success: true,
        results: [],
        source: 'full_page',
        pageInfo: { url: '', title: '', totalChunks: 0 }
      });

      await getCompletePageDetails(
        { pageQuery: 'test' },
        contextWithProtocol
      );

      expect(mockNormalizeDomain).toHaveBeenCalledWith('https://example.com');
    });
  });
});
