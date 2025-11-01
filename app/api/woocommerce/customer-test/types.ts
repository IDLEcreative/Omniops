/**
 * Type definitions for WooCommerce customer testing
 */

export interface TestResult {
  success: boolean;
  error?: string;
  [key: string]: any;
}

export interface TestResults {
  timestamp: string;
  tests: Record<string, TestResult>;
  summary?: {
    totalTests: number;
    passed: number;
    failed: number;
    success: boolean;
  };
}

export type TestType = 'all' | 'schema' | 'verification' | 'customer' | 'masking' | 'logging' | 'caching';
