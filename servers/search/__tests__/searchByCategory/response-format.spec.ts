import { searchByCategory } from '../../searchByCategory';
import { baseContext, mockSearchSimilarContent, resetMocks } from './helpers/mocks';

describe('searchByCategory – Response format', () => {
  beforeEach(() => {
    resetMocks();
    mockSearchSimilarContent.mockResolvedValue([]);
  });

  it('returns ToolResult structure on success', async () => { 
    const result = await searchByCategory({ category: 'pumps', limit: 10 }, baseContext);

    expect(result.success).toBe(true);
    expect(result).toHaveProperty('data');
    expect(result).toHaveProperty('metadata');
    expect(result.data).toMatchObject({
      results: expect.any(Array),
      totalMatches: expect.any(Number),
      executionTime: expect.any(Number),
      category: 'pumps',
      source: 'semantic',
    });
  });

  it('returns ToolResult structure on error', async () => {
    mockSearchSimilarContent.mockRejectedValue(new Error('Test error'));
    const result = await searchByCategory({ category: 'pumps', limit: 10 }, baseContext);

    expect(result.success).toBe(false);
    expect(result.error).toMatchObject({
      code: expect.any(String),
      message: expect.any(String),
    });
  });

  it('includes execution time in data and metadata', async () => {
    const result = await searchByCategory({ category: 'pumps', limit: 10 }, baseContext);

    expect(result.data.executionTime).toBeGreaterThan(0);
    expect(result.metadata.executionTime).toBeGreaterThan(0);
  });
});
