/**
 * Type Definitions for Refresh Workflow Tests
 */

export interface TestResult {
  phase: string;
  test: string;
  passed: boolean;
  message: string;
  details?: any;
}
