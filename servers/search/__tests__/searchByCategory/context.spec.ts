import { searchByCategory } from '../../searchByCategory';
import { baseContext, mockNormalizeDomain, resetMocks } from './helpers/mocks';

describe('searchByCategory – Context validation', () => {
  beforeEach(() => {
    resetMocks();
  });

  it('rejects missing domain', async () => {
    const result = await searchByCategory({ category: 'pumps', limit: 10 }, { ...baseContext, domain: undefined as any });
    expect(result.success).toBe(false);
    expect(result.error?.message).toContain('Missing required context: domain');
  });

  it('handles invalid domain normalization', async () => {
    mockNormalizeDomain.mockReturnValue('');

    const result = await searchByCategory({ category: 'pumps', limit: 10 }, baseContext);
    expect(result.success).toBe(false);
    expect(result.error?.code).toBe('INVALID_DOMAIN');
  });
});
