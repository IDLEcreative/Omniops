export interface TestResult {
  feature: string;
  status: '✅' | '❌' | '⚠️';
  details: string;
  issues?: string[];
}
