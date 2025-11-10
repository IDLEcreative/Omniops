import { searchByCategory } from '../../searchByCategory';
import { baseContext, mockSearchSimilarContent, resetMocks } from './helpers/mocks';

describe('searchByCategory – Error handling', () => {
  beforeEach(() => {
    resetMocks();
  });

  it('handles database errors', async () => {
    mockSearchSimilarContent.mockRejectedValue(new Error('Database connection failed'));

    const result = await searchByCategory({ category: 'pumps', limit: 10 }, baseContext);

    expect(result.success).toBe(false);
    expect(result.error?.message).toContain('Database connection failed');
  });

  it('handles embeddings errors', async () => {
    mockSearchSimilarContent.mockRejectedValue(new Error('OpenAI API error'));

    const result = await searchByCategory({ category: 'pumps', limit: 10 }, baseContext);
    expect(result.success).toBe(false);
    expect(result.error?.message).toContain('OpenAI API error');
  });

  it('handles unexpected errors gracefully', async () => {
    mockSearchSimilarContent.mockRejectedValue(new Error('Unknown error'));

    const result = await searchByCategory({ category: 'pumps', limit: 10 }, baseContext);
    expect(result.success).toBe(false);
  });
});
