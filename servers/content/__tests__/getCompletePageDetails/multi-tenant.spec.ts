import { getCompletePageDetails } from '../../getCompletePageDetails';
import { mockSearchAndReturnFullPage, mockNormalizeDomain, resetMocks } from './helpers/mocks';

describe('getCompletePageDetails - Multi-Tenant Isolation', () => {
  beforeEach(() => {
    resetMocks();
    mockSearchAndReturnFullPage.mockResolvedValue({
      success: true,
      results: [],
      source: 'full_page',
      pageInfo: { url: '', title: '', totalChunks: 0 },
    });
  });

  it('uses normalized domain for customer A', async () => {
    mockNormalizeDomain.mockReturnValue('customera.com');

    await getCompletePageDetails(
      { pageQuery: 'test' },
      { customerId: 'customer-a-uuid', domain: 'customera.com' }
    );

    expect(mockNormalizeDomain).toHaveBeenCalledWith('customera.com');
    expect(mockSearchAndReturnFullPage).toHaveBeenCalledWith('test', 'customera.com', 15, 0.3);
  });

  it('uses normalized domain for customer B', async () => {
    mockNormalizeDomain.mockReturnValue('customerb.com');

    await getCompletePageDetails(
      { pageQuery: 'test' },
      { customerId: 'customer-b-uuid', domain: 'customerb.com' }
    );

    expect(mockNormalizeDomain).toHaveBeenCalledWith('customerb.com');
    expect(mockSearchAndReturnFullPage).toHaveBeenCalledWith('test', 'customerb.com', 15, 0.3);
  });
});
