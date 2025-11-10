import { getCompletePageDetails } from '../../getCompletePageDetails';
import { mockContext, mockSearchAndReturnFullPage, mockNormalizeDomain, resetMocks } from './helpers/mocks';

describe('getCompletePageDetails - Performance & Response Format', () => {
  beforeEach(() => {
    resetMocks();
  });

  it('tracks execution time in data and metadata', async () => {
    mockSearchAndReturnFullPage.mockResolvedValue({
      success: true,
      results: [],
      source: 'full_page',
      pageInfo: { url: '', title: '', totalChunks: 0 },
    });

    const result = await getCompletePageDetails({ pageQuery: 'test' }, mockContext);

    expect(result.metadata?.executionTime).toBe(42);
    expect(result.data?.executionTime).toBe(42);
  });

  it('returns ToolResult format on success', async () => {
    mockSearchAndReturnFullPage.mockResolvedValue({
      success: true,
      results: [
        {
          content: 'Test',
          url: 'https://test.com',
          title: 'Test',
          similarity: 0.9,
          metadata: {},
        },
      ],
      source: 'full_page',
      pageInfo: { url: 'https://test.com', title: 'Test', totalChunks: 1 },
    });

    const result = await getCompletePageDetails({ pageQuery: 'test' }, mockContext);

    expect(result.success).toBe(true);
    expect(result.data).toMatchObject({
      results: expect.any(Array),
      totalChunks: expect.any(Number),
      executionTime: expect.any(Number),
      source: 'full-page',
    });
  });

  it('returns ToolResult format on error', async () => {
    mockNormalizeDomain.mockReturnValue(null);

    const result = await getCompletePageDetails({ pageQuery: 'test' }, mockContext);

    expect(result.success).toBe(false);
    expect(result.error).toMatchObject({
      code: expect.any(String),
      message: expect.any(String),
    });
  });

  it('marks metadata.cached as false', async () => {
    mockSearchAndReturnFullPage.mockResolvedValue({
      success: true,
      results: [],
      source: 'full_page',
      pageInfo: { url: '', title: '', totalChunks: 0 },
    });

    const result = await getCompletePageDetails({ pageQuery: 'test' }, mockContext);

    expect(result.metadata?.cached).toBe(false);
  });
});
