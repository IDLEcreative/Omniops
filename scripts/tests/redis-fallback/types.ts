export interface RedisFailureTest {
  name: string;
  description: string;
  failureType: 'unavailable' | 'timeout' | 'command_error' | 'connection_error';
  injectFailure: () => Promise<void>;
  validateBehavior: (response: any) => {
    passed: boolean;
    reason: string;
    failOpenBehavior: boolean;
  };
}

export interface TestResult {
  scenario: string;
  status: 'pass' | 'fail' | 'skip';
  failOpenActivated: boolean;
  requestsAllowed: number;
  error?: string;
  details: Record<string, any>;
}
