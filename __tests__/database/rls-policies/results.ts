export interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
  duration: number;
}

const results: TestResult[] = [];

export function getResults() {
  return results;
}

export async function runTest(name: string, testFn: () => Promise<void>): Promise<void> {
  const startTime = Date.now();
  try {
    await testFn();
    results.push({ name, passed: true, duration: Date.now() - startTime });
    console.log(`✅ ${name}`);
  } catch (error) {
    results.push({
      name,
      passed: false,
      error: error instanceof Error ? error.message : String(error),
      duration: Date.now() - startTime,
    });
    console.error(`❌ ${name}`);
    console.error(`   Error: ${error instanceof Error ? error.message : String(error)}`);
  }
}

export async function assertCount(actual: number, expected: number | 'any', message: string) {
  if (expected === 'any') {
    if (actual === 0) {
      throw new Error(`${message}: Expected any rows but got 0`);
    }
    return;
  }

  if (actual !== expected) {
    throw new Error(`${message}: Expected ${expected} rows but got ${actual}`);
  }
}
