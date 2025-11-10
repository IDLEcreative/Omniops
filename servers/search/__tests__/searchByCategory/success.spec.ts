import { searchByCategory } from '../../searchByCategory';
import { baseContext, mockSearchSimilarContent, mockNormalizeDomain, resetMocks } from './helpers/mocks';
import { buildProductResults } from './helpers/results';

describe('searchByCategory – Successful searches', () => {
  beforeEach(() => {
    resetMocks();
  });

  it('finds products in valid category', async () => {
    const mockResults = buildProductResults(2);
    mockSearchSimilarContent.mockResolvedValue(mockResults);

    const result = await searchByCategory({ category: 'hydraulic-pumps', limit: 10 }, baseContext);

    expect(result.success).toBe(true);
    expect(result.data.results).toEqual(mockResults);
    expect(result.data.totalMatches).toBe(2);
    expect(result.data.category).toBe('hydraulic-pumps');
    expect(result.data.source).toBe('semantic');
    expect(result.data.threshold).toBe(0.15);
    expect(result.metadata.executionTime).toBeGreaterThan(0);
  });

  it('supports categories with spaces', async () => {
    mockSearchSimilarContent.mockResolvedValue(buildProductResults(1));

    const result = await searchByCategory({ category: 'spare parts', limit: 20 }, baseContext);

    expect(result.success).toBe(true);
    expect(result.data.category).toBe('spare parts');
    expect(mockSearchSimilarContent).toHaveBeenCalledWith('spare parts', 'thompsonseparts.co.uk', 20, 0.15);
  });

  it('supports special characters', async () => {
    mockSearchSimilarContent.mockResolvedValue([]);

    const result = await searchByCategory({ category: 'parts-&-accessories', limit: 10 }, baseContext);

    expect(result.success).toBe(true);
    expect(result.data.category).toBe('parts-&-accessories');
  });

  it('handles empty result sets', async () => {
    mockSearchSimilarContent.mockResolvedValue([]);

    const result = await searchByCategory({ category: 'nonexistent', limit: 10 }, baseContext);

    expect(result.success).toBe(true);
    expect(result.data.results).toEqual([]);
    expect(result.data.totalMatches).toBe(0);
  });
});
