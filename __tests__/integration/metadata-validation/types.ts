/**
 * Shared Types for Metadata Validation Tests
 */

export interface RealProduct {
  title: string;
  url: string;
  excerpt: string | null;
  domain_id: string;
}

export interface TestResult {
  testName: string;
  passed: boolean;
  details: string;
  productsUsed: string[];
}
