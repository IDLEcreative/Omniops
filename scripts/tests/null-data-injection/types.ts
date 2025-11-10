export interface ValidationResult {
  passed: boolean;
  hasTypeError: boolean;
  gracefulHandling: boolean;
  reason: string;
}

export interface NullInjectionTest {
  name: string;
  description: string;
  injectionPoint: string;
  nullValue: null | undefined;
  query: string;
  validateResponse: (response: any) => ValidationResult;
}

export interface TestResult {
  scenario: string;
  status: 'pass' | 'fail' | 'skip';
  hadTypeError: boolean;
  gracefulHandling: boolean;
  error?: string;
  details: Record<string, any>;
}
