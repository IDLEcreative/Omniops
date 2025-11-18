import { searchByCategory } from '../../searchByCategory';
import { baseContext, mockSearchSimilarContent, resetMocks } from './helpers/mocks';

describe('searchByCategory – Threshold validation', () => {
  beforeEach(() => {
    resetMocks();
  });

  it('applies default threshold 0.15', async () => {
    mockSearchSimilarContent.mockResolvedValue([]);

    const result = await searchByCategory({ category: 'pumps', limit: 10 }, baseContext);

    expect(result.success).toBe(true);
    expect(result.data?.threshold).toBe(0.15);
  });

  it('accepts custom threshold', async () => {
    mockSearchSimilarContent.mockResolvedValue([]);

    const result = await searchByCategory({ category: 'pumps', limit: 10, threshold: 0.5 }, baseContext);

    expect(result.success).toBe(true);
    expect(result.data?.threshold).toBe(0.5);
  });

  it('allows threshold of 0', async () => {
    mockSearchSimilarContent.mockResolvedValue([]);

    const result = await searchByCategory({ category: 'pumps', limit: 10, threshold: 0 }, baseContext);
    expect(result.success).toBe(true);
  });

  it('allows threshold of 1', async () => {
    mockSearchSimilarContent.mockResolvedValue([]);

    const result = await searchByCategory({ category: 'pumps', limit: 10, threshold: 1 }, baseContext);
    expect(result.success).toBe(true);
  });

  it('rejects threshold above 1', async () => {
    const result = await searchByCategory({ category: 'pumps', limit: 10, threshold: 1.5 }, baseContext);
    expect(result.success).toBe(false);
  });

  it('rejects negative threshold', async () => {
    const result = await searchByCategory({ category: 'pumps', limit: 10, threshold: -0.1 }, baseContext);
    expect(result.success).toBe(false);
  });
});
