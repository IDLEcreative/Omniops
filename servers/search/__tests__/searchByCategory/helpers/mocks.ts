import { ExecutionContext } from '../../../../shared/types';
import { searchSimilarContent } from '@/lib/embeddings-optimized';
import { normalizeDomain } from '@/lib/chat/tool-handlers/domain-utils';

jest.mock('@/lib/embeddings-optimized');
jest.mock('@/lib/chat/tool-handlers/domain-utils');
jest.mock('../../../shared/utils/logger', () => ({
  logToolExecution: jest.fn(),
  PerformanceTimer: jest.fn().mockImplementation(() => ({
    elapsed: () => 150,
  })),
}));

export const mockSearchSimilarContent = searchSimilarContent as jest.MockedFunction<
  typeof searchSimilarContent
>;
export const mockNormalizeDomain = normalizeDomain as jest.MockedFunction<typeof normalizeDomain>;

export const baseContext: ExecutionContext = {
  customerId: '8dccd788-1ec1-43c2-af56-78aa3366bad3',
  domain: 'thompsonseparts.co.uk',
  platform: 'woocommerce',
  traceId: 'test-trace-123',
};

export function resetMocks() {
  jest.clearAllMocks();
  mockNormalizeDomain.mockReturnValue('thompsonseparts.co.uk');
}
