import { searchByCategory } from '../../searchByCategory';
import { baseContext, mockSearchSimilarContent, resetMocks } from './helpers/mocks';

describe('searchByCategory – Category input validation', () => {
  beforeEach(() => {
    resetMocks();
  });

  it('rejects empty category', async () => {
    const result = await searchByCategory({ category: '', limit: 10 }, baseContext);
    expect(result.success).toBe(false);
  });

  it('rejects category length >200', async () => {
    const result = await searchByCategory({ category: 'a'.repeat(201), limit: 10 }, baseContext);
    expect(result.success).toBe(false);
  });

  it('accepts category length 200', async () => {
    mockSearchSimilarContent.mockResolvedValue([]);
    const category = 'a'.repeat(200);

    const result = await searchByCategory({ category, limit: 10 }, baseContext);
    expect(result.success).toBe(true);
    expect(result.data?.category).toBe(category);
  });
});
