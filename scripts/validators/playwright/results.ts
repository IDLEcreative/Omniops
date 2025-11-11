import fs from 'fs/promises';

interface VerificationResult {
  summary: any;
  browsers: any;
  system: any;
  issues: Array<{ type: string; message: string; recommendation: string }>;
  recommendations: string[];
  dependencies: Record<string, string | undefined>;
  webScraping: any;
}

export async function saveResults(results: VerificationResult) {
  await fs.mkdir('./test-results', { recursive: true });
  await fs.writeFile('./test-results/playwright-setup-verification.json', JSON.stringify(results, null, 2));
}
