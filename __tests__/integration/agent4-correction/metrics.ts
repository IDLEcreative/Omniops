import { TestMetrics } from './types';

export const testMetrics: TestMetrics = {
  totalTests: 0,
  passedTests: 0,
  failedTests: 0,
  correctionTests: 0,
  correctionPassed: 0,
  listReferenceTests: 0,
  listReferencePassed: 0,
  executionTimes: [],
};

export function recordExecutionTime(duration: number) {
  testMetrics.executionTimes.push(duration);
}
