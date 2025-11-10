import { getCompletePageDetails } from '../../getCompletePageDetails';
import {
  mockContext,
  mockNormalizeDomain,
  mockSearchAndReturnFullPage,
  resetMocks,
} from './helpers/mocks';

describe('getCompletePageDetails - Error Handling', () => {
  beforeEach(() => {
    resetMocks();
  });

  it('handles invalid domain', async () => {
    mockNormalizeDomain.mockReturnValue(null);

    const result = await getCompletePageDetails({ pageQuery: 'test' }, mockContext);

    expect(result.success).toBe(false);
    expect(result.data?.source).toBe('invalid-domain');
    expect(result.error?.code).toBe('INVALID_DOMAIN');
  });

  it('handles missing domain in context', async () => {
    const contextWithoutDomain = { customerId: '8dccd788-1ec1-43c2-af56-78aa3366bad3' };

    const result = await getCompletePageDetails({ pageQuery: 'test' }, contextWithoutDomain);

    expect(result.success).toBe(false);
    expect(result.error?.code).toBe('GET_PAGE_DETAILS_ERROR');
    expect(result.error?.message).toContain('Missing required context: domain');
  });

  it('handles page not found', async () => {
    mockSearchAndReturnFullPage.mockResolvedValue({
      success: false,
      results: [],
      source: 'chunks_fallback',
    });

    const result = await getCompletePageDetails({ pageQuery: 'nonexistent page' }, mockContext);

    expect(result.success).toBe(false);
    expect(result.data?.source).toBe('failed');
    expect(result.error?.code).toBe('PAGE_NOT_FOUND');
  });

  it('handles full page retrieval rejection', async () => {
    mockSearchAndReturnFullPage.mockRejectedValue(new Error('Database connection failed'));

    const result = await getCompletePageDetails({ pageQuery: 'test' }, mockContext);

    expect(result.success).toBe(false);
    expect(result.error?.code).toBe('GET_PAGE_DETAILS_ERROR');
    expect(result.error?.message).toContain('Database connection failed');
  });

  it('handles empty successful retrieval', async () => {
    mockSearchAndReturnFullPage.mockResolvedValue({
      success: true,
      results: [],
      source: 'full_page',
      pageInfo: { url: '', title: '', totalChunks: 0 },
    });

    const result = await getCompletePageDetails({ pageQuery: 'test' }, mockContext);

    expect(result.success).toBe(true);
    expect(result.data?.results).toHaveLength(0);
    expect(result.data?.totalChunks).toBe(0);
  });
});
