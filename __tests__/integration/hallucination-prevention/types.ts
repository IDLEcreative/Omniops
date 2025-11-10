export interface HallucinationCheckResult {
  passed: boolean;
  reason: string;
  hallucinationDetected?: boolean;
}

export interface TestCase {
  name: string;
  category: string;
  query: string;
  checkForHallucination: (response: string) => HallucinationCheckResult;
}

export interface TestResult {
  testCase: TestCase;
  response: string;
  passed: boolean;
  reason: string;
  hallucinationDetected: boolean;
  duration: number;
}

export interface RunOptions {
  domain: string;
  verbose: boolean;
  category?: string;
}
