import { ExecutionContext } from '../../../shared/types';
import { CommerceProvider } from '@/lib/agents/commerce-provider';
import { getCommerceProvider } from '@/lib/agents/commerce-provider';
import { normalizeDomain } from '@/lib/chat/tool-handlers/domain-utils';

jest.mock('@/lib/agents/commerce-provider');
jest.mock('@/lib/chat/tool-handlers/domain-utils');
jest.mock('../../../shared/utils/logger', () => ({
  logToolExecution: jest.fn(),
  PerformanceTimer: jest.fn().mockImplementation(() => ({
    elapsed: jest.fn().mockReturnValue(150),
  })),
}));

export const mockGetCommerceProvider = getCommerceProvider as jest.MockedFunction<
  typeof getCommerceProvider
>;
export const mockNormalizeDomain = normalizeDomain as jest.MockedFunction<typeof normalizeDomain>;

export const baseContext: ExecutionContext = {
  customerId: '8dccd788-1ec1-43c2-af56-78aa3366bad3',
  domain: 'thompsonseparts.co.uk',
};

export function resetMocks() {
  jest.clearAllMocks();
  mockNormalizeDomain.mockImplementation((domain) => {
    if (!domain) return '';
    if (domain.includes('localhost')) return '';
    return domain.replace(/^https?:\/\//, '').replace(/^www\./, '').toLowerCase();
  });
}

export function buildProvider(overrides: Partial<CommerceProvider>): CommerceProvider {
  return {
    platform: 'woocommerce',
    lookupOrder: jest.fn(),
    searchProducts: jest.fn(),
    checkStock: jest.fn(),
    getProductDetails: jest.fn(),
    ...overrides,
  } as unknown as CommerceProvider;
}
