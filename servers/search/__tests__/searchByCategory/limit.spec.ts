import { searchByCategory } from '../../searchByCategory';
import { baseContext, mockSearchSimilarContent, resetMocks } from './helpers/mocks';

describe('searchByCategory – Limit parameter validation', () => {
  beforeEach(() => {
    resetMocks();
  });

  it('applies default limit of 100', async () => {
    mockSearchSimilarContent.mockResolvedValue([]);

    const result = await searchByCategory({ category: 'pumps' }, baseContext);

    expect(result.success).toBe(true);
    expect(mockSearchSimilarContent).toHaveBeenCalledWith('pumps', 'thompsonseparts.co.uk', 100, 0.15);
  });

  it('accepts custom limit', async () => {
    mockSearchSimilarContent.mockResolvedValue([]);

    const result = await searchByCategory({ category: 'pumps', limit: 50 }, baseContext);

    expect(result.success).toBe(true);
    expect(mockSearchSimilarContent).toHaveBeenCalledWith('pumps', 'thompsonseparts.co.uk', 50, 0.15);
  });

  it('enforces max limit of 1000', async () => {
    const result = await searchByCategory({ category: 'pumps', limit: 5000 }, baseContext);

    expect(result.success).toBe(false);
    expect(result.error?.code).toBe('SEARCH_BY_CATEGORY_ERROR');
  });

  it('rejects negative limit', async () => {
    const result = await searchByCategory({ category: 'pumps', limit: -10 }, baseContext);
    expect(result.success).toBe(false);
  });

  it('rejects zero limit', async () => {
    const result = await searchByCategory({ category: 'pumps', limit: 0 }, baseContext);
    expect(result.success).toBe(false);
  });
});
