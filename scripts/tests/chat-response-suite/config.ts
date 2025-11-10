import { v4 as uuidv4 } from 'uuid';

export interface TestConfig {
  baseUrl: string;
  domain: string;
  sessionId: string;
  maxRetries: number;
  retryDelay: number;
}

export const TEST_CONFIG: TestConfig = {
  baseUrl: 'http://localhost:3000',
  domain: 'thompsonseparts.co.uk',
  sessionId: uuidv4(),
  maxRetries: 3,
  retryDelay: 1000
};
