/**
 * Shared types for WooCommerce integration tests
 */

export interface TestResult {
  operation: string;
  category: string;
  status: 'PASS' | 'FAIL' | 'VALIDATION';
  duration: number;
  message: string;
  error?: string;
}

export interface TestContext {
  domain: string;
}
