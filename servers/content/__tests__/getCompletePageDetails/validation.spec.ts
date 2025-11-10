import { getCompletePageDetails } from '../../getCompletePageDetails';
import { mockContext, resetMocks, mockSearchAndReturnFullPage } from './helpers/mocks';

describe('getCompletePageDetails - Input Validation', () => {
  beforeEach(() => {
    resetMocks();
  });

  it('rejects empty pageQuery', async () => {
    const result = await getCompletePageDetails({ pageQuery: '' }, mockContext);
    expect(result.success).toBe(false);
    expect(result.error?.message).toContain('Validation failed');
  });

  it('rejects pageQuery exceeding max length', async () => {
    const result = await getCompletePageDetails({ pageQuery: 'a'.repeat(501) }, mockContext);
    expect(result.success).toBe(false);
  });

  it('rejects negative fallbackChunkLimit', async () => {
    const result = await getCompletePageDetails({ pageQuery: 'test', fallbackChunkLimit: -1 }, mockContext);
    expect(result.success).toBe(false);
  });

  it('rejects fallbackChunkLimit > 50', async () => {
    const result = await getCompletePageDetails({ pageQuery: 'test', fallbackChunkLimit: 51 }, mockContext);
    expect(result.success).toBe(false);
  });

  it('rejects similarityThreshold below 0', async () => {
    const result = await getCompletePageDetails({ pageQuery: 'test', similarityThreshold: -0.1 }, mockContext);
    expect(result.success).toBe(false);
  });

  it('rejects similarityThreshold above 1', async () => {
    const result = await getCompletePageDetails({ pageQuery: 'test', similarityThreshold: 1.1 }, mockContext);
    expect(result.success).toBe(false);
  });

  it('accepts valid input with optional parameters', async () => {
    mockSearchAndReturnFullPage.mockResolvedValue({
      success: true,
      results: [],
      source: 'full_page',
      pageInfo: { url: '', title: '', totalChunks: 0 },
    });

    const result = await getCompletePageDetails(
      { pageQuery: 'test', fallbackChunkLimit: 20, similarityThreshold: 0.4, includeMetadata: true },
      mockContext
    );

    expect(result.success).toBe(true);
  });
});
