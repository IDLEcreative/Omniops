import { ExecutionContext } from '../../../shared/types';
import { searchAndReturnFullPage } from '@/lib/full-page-retrieval';
import { normalizeDomain } from '@/lib/chat/tool-handlers/domain-utils';

jest.mock('@/lib/full-page-retrieval');
jest.mock('@/lib/chat/tool-handlers/domain-utils');
jest.mock('../../../shared/utils/logger', () => ({
  logToolExecution: jest.fn(),
  PerformanceTimer: jest.fn().mockImplementation(() => ({
    elapsed: jest.fn(() => 42),
  })),
}));

export const mockSearchAndReturnFullPage = searchAndReturnFullPage as jest.MockedFunction<
  typeof searchAndReturnFullPage
>;
export const mockNormalizeDomain = normalizeDomain as jest.MockedFunction<typeof normalizeDomain>;

export const mockContext: ExecutionContext = {
  customerId: '8dccd788-1ec1-43c2-af56-78aa3366bad3',
  domain: 'thompsonseparts.co.uk',
  sessionId: 'test-session-123',
};

export function resetMocks() {
  jest.clearAllMocks();
  mockNormalizeDomain.mockReturnValue('thompsonseparts.co.uk');
}
