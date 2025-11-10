import { lookupOrder } from '../../lookupOrder';
import { mockWooCommerceOrder } from './helpers/orders';
import {
  baseContext,
  mockGetCommerceProvider,
  mockNormalizeDomain,
  resetMocks,
  buildProvider,
} from './helpers/mocks';

describe('lookupOrder – Response Format', () => {
  beforeEach(() => {
    resetMocks();
    mockNormalizeDomain.mockReturnValue('thompsonseparts.co.uk');
    mockGetCommerceProvider.mockResolvedValue(
      buildProvider({
        platform: 'woocommerce',
        lookupOrder: jest.fn().mockResolvedValue(mockWooCommerceOrder),
      })
    );
  });

  it('returns ToolResult with metadata', async () => {
    const result = await lookupOrder({ orderId: '12345' }, baseContext);

    expect(result).toHaveProperty('success');
    expect(result).toHaveProperty('data');
    expect(result).toHaveProperty('metadata');
    expect(result.metadata?.executionTime).toBeGreaterThan(0);
    expect(result.metadata?.cached).toBe(false);
    expect(result.metadata?.source).toBe('woocommerce');
  });

  it('formats SearchResult payloads', async () => {
    const result = await lookupOrder({ orderId: '12345' }, baseContext);
    const searchResult = result.data?.formattedResult;

    expect(searchResult?.title).toBe('Order #12345');
    expect(searchResult?.url).toBe('https://thompsonseparts.co.uk/order/12345');
    expect(searchResult?.similarity).toBeDefined();
    expect(searchResult?.content).toContain('Status: processing');
  });
});
