import { getCompletePageDetails } from '../../getCompletePageDetails';
import { mockSearchAndReturnFullPage, mockNormalizeDomain, resetMocks } from './helpers/mocks';

describe('getCompletePageDetails - Domain Normalization', () => {
  beforeEach(() => {
    resetMocks();
    mockSearchAndReturnFullPage.mockResolvedValue({
      success: true,
      results: [],
      source: 'full_page',
      pageInfo: { url: '', title: '', totalChunks: 0 },
    });
  });

  it('strips www prefix', async () => {
    mockNormalizeDomain.mockReturnValue('example.com');

    await getCompletePageDetails({ pageQuery: 'test' }, { customerId: 'test', domain: 'www.example.com' });

    expect(mockNormalizeDomain).toHaveBeenCalledWith('www.example.com');
    expect(mockSearchAndReturnFullPage).toHaveBeenCalledWith('test', 'example.com', 15, 0.3);
  });

  it('strips protocol when normalizing', async () => {
    mockNormalizeDomain.mockReturnValue('example.com');

    await getCompletePageDetails({ pageQuery: 'test' }, { customerId: 'test', domain: 'https://example.com' });

    expect(mockNormalizeDomain).toHaveBeenCalledWith('https://example.com');
  });
});
