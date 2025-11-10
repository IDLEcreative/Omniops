import { getCompletePageDetails } from '../../getCompletePageDetails';
import { mockContext, mockSearchAndReturnFullPage, resetMocks } from './helpers/mocks';
import { buildDocumentationChunks, buildProductChunks } from './helpers/test-data';

describe('getCompletePageDetails - Successful Retrieval', () => {
  beforeEach(() => {
    resetMocks();
  });

  it('retrieves complete page with all chunks', async () => {
    mockSearchAndReturnFullPage.mockResolvedValue({
      success: true,
      results: buildProductChunks(),
      source: 'full_page',
      pageInfo: {
        url: 'https://thompsonseparts.co.uk/product/a4vtg90',
        title: 'A4VTG90 Hydraulic Pump',
        totalChunks: 3,
      },
    });

    const result = await getCompletePageDetails({ pageQuery: 'hydraulic pump A4VTG90' }, mockContext);

    expect(result.success).toBe(true);
    expect(result.data?.results).toHaveLength(3);
    expect(result.data?.totalChunks).toBe(3);
    expect(result.data?.pageInfo?.title).toBe('A4VTG90 Hydraulic Pump');
    expect(result.data?.executionTime).toBe(42);
    expect(result.metadata?.executionTime).toBe(42);
  });

  it('includes metadata when includeMetadata flag is true', async () => {
    mockSearchAndReturnFullPage.mockResolvedValue({
      success: true,
      results: [
        {
          content: 'Test content',
          url: 'https://thompsonseparts.co.uk/test',
          title: 'Test Page',
          similarity: 0.9,
          metadata: {},
        },
      ],
      source: 'full_page',
      pageInfo: { url: 'https://thompsonseparts.co.uk/test', title: 'Test Page', totalChunks: 1 },
    });

    const result = await getCompletePageDetails(
      { pageQuery: 'test query', includeMetadata: true },
      mockContext
    );

    expect(result.success).toBe(true);
    expect(result.data?.metadata?.retrievalStrategy).toBe('full_page');
    expect(result.data?.metadata?.queryUsed).toBe('test query');
    expect(result.data?.metadata?.similarityThreshold).toBe(0.3);
  });

  it('excludes metadata when includeMetadata is false', async () => {
    mockSearchAndReturnFullPage.mockResolvedValue({
      success: true,
      results: [
        {
          content: 'Test content',
          url: 'https://thompsonseparts.co.uk/test',
          title: 'Test Page',
          similarity: 0.9,
          metadata: {},
        },
      ],
      source: 'full_page',
      pageInfo: { url: 'https://thompsonseparts.co.uk/test', title: 'Test Page', totalChunks: 1 },
    });

    const result = await getCompletePageDetails(
      { pageQuery: 'test query', includeMetadata: false },
      mockContext
    );

    expect(result.success).toBe(true);
    expect(result.data?.metadata).toBeUndefined();
  });

  it('passes custom fallback chunk limit', async () => {
    mockSearchAndReturnFullPage.mockResolvedValue({
      success: true,
      results: [],
      source: 'full_page',
      pageInfo: { url: '', title: '', totalChunks: 0 },
    });

    await getCompletePageDetails({ pageQuery: 'test', fallbackChunkLimit: 25 }, mockContext);

    expect(mockSearchAndReturnFullPage).toHaveBeenCalledWith('test', 'thompsonseparts.co.uk', 25, 0.3);
  });

  it('passes custom similarity threshold', async () => {
    mockSearchAndReturnFullPage.mockResolvedValue({
      success: true,
      results: [],
      source: 'full_page',
      pageInfo: { url: '', title: '', totalChunks: 0 },
    });

    await getCompletePageDetails({ pageQuery: 'test', similarityThreshold: 0.5 }, mockContext);

    expect(mockSearchAndReturnFullPage).toHaveBeenCalledWith('test', 'thompsonseparts.co.uk', 15, 0.5);
  });

  it('retrieves documentation page with multiple sections', async () => {
    mockSearchAndReturnFullPage.mockResolvedValue({
      success: true,
      results: buildDocumentationChunks(10),
      source: 'full_page',
      pageInfo: {
        url: 'https://thompsonseparts.co.uk/docs/installation',
        title: 'Installation Guide',
        totalChunks: 10,
      },
    });

    const result = await getCompletePageDetails({ pageQuery: 'installation guide' }, mockContext);

    expect(result.success).toBe(true);
    expect(result.data?.results).toHaveLength(10);
    expect(result.data?.pageInfo?.title).toBe('Installation Guide');
  });
});
