/**
 * Type Definitions for Test Stability Monitoring
 */

export interface TestRun {
  timestamp: string;
  date: string;
  memoryLimit: string;
  totalTests: number;
  passedTests: number;
  failedTests: number;
  skippedTests: number;
  duration: number;
  memoryUsage: {
    peak: number;
    average: number;
  };
  errors: {
    sigkill: number;
    timeout: number;
    memoryLeak: number;
    other: number;
  };
  failedSuites: string[];
  sigkillOccurrences: string[];
  warnings: string[];
  nodeVersion: string;
  jestWorkers: number;
}

export interface StabilityMetrics {
  runs: TestRun[];
  summary: {
    totalRuns: number;
    averageSuccessRate: number;
    sigkillFrequency: number;
    mostFailedSuites: { [key: string]: number };
    memoryIssues: number;
    recommendations: string[];
  };
}
