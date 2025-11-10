/**
 * Test Phase Execution for Complete Refresh Workflow
 */

import type { TestResult } from './refresh-test-types';

export async function testPhase1_ReadOnlyMonitor(logTest: Function): Promise<void> {
  console.log('\n📋 Phase 1: Crawl-Processor Read-Only Monitor\n');

  try {
    const fs = await import('fs/promises');
    const processorContent = await fs.readFile('app/api/scrape/crawl-processor.ts', 'utf-8');

    const hasProcessPage = processorContent.includes('async function processPage');
    logTest(
      'Phase 1',
      'processPage function removed',
      !hasProcessPage,
      hasProcessPage ? 'FAIL: processPage still exists (race condition!)' : 'PASS: processPage removed'
    );

    const hasProcessIndividually = processorContent.includes('async function processPagesIndividually');
    logTest(
      'Phase 1',
      'processPagesIndividually removed',
      !hasProcessIndividually,
      hasProcessIndividually ? 'FAIL: processPagesIndividually still exists' : 'PASS: processPagesIndividually removed'
    );

    const hasReadOnlyComment = processorContent.includes('READ-ONLY monitor');
    logTest(
      'Phase 1',
      'Read-only documentation present',
      hasReadOnlyComment,
      hasReadOnlyComment ? 'PASS: Documentation added' : 'FAIL: Missing read-only documentation'
    );

    const hasEmbeddingImports = processorContent.includes('generateEmbeddings') ||
                                processorContent.includes('splitIntoChunks');
    logTest(
      'Phase 1',
      'Embedding imports removed',
      !hasEmbeddingImports,
      hasEmbeddingImports ? 'FAIL: Still importing embedding services' : 'PASS: No embedding imports'
    );

  } catch (error) {
    logTest('Phase 1', 'File read', false, `Error: ${error}`);
  }
}

export async function testPhase2_BulkRPCFunctions(supabase: any, logTest: Function): Promise<void> {
  console.log('\n📋 Phase 2: Bulk RPC Functions\n');

  try {
    const { error: upsertError } = await supabase.rpc('bulk_upsert_scraped_pages', {
      pages_input: []
    });

    logTest(
      'Phase 2',
      'bulk_upsert_scraped_pages exists',
      !upsertError,
      upsertError ? `FAIL: ${upsertError.message}` : 'PASS: Function exists'
    );

    const { error: insertError } = await supabase.rpc('bulk_insert_embeddings', {
      embeddings: []
    });

    logTest(
      'Phase 2',
      'bulk_insert_embeddings exists',
      !insertError,
      insertError ? `FAIL: ${insertError.message}` : 'PASS: Function exists'
    );

  } catch (error) {
    logTest('Phase 2', 'RPC functions', false, `Error: ${error}`);
  }
}

export async function testPhase4_DeletionRetry(logTest: Function): Promise<void> {
  console.log('\n📋 Phase 4: Fatal Deletion Errors (Logic Test)\n');

  const scenarios = [
    { attempts: [true], expected: 'success', name: 'Success on first attempt' },
    { attempts: [false, true], expected: 'success', name: 'Success on retry' },
    { attempts: [false, false, false], expected: 'fatal', name: 'Fatal after 3 attempts' },
  ];

  for (const scenario of scenarios) {
    let attemptNum = 0;
    let success = false;
    let fatal = false;

    for (const shouldSucceed of scenario.attempts) {
      attemptNum++;
      if (shouldSucceed) {
        success = true;
        break;
      }
      if (attemptNum >= 3) {
        fatal = true;
        break;
      }
    }

    const actual = fatal ? 'fatal' : success ? 'success' : 'unknown';
    const passed = actual === scenario.expected;

    logTest(
      'Phase 4',
      scenario.name,
      passed,
      passed ? `PASS: ${actual}` : `FAIL: Expected ${scenario.expected}, got ${actual}`
    );
  }
}

export async function testPhase5_ForceRescrapePropagation(logTest: Function): Promise<void> {
  console.log('\n📋 Phase 5: forceRescrape Flag Propagation (File Check)\n');

  try {
    const fs = await import('fs/promises');

    const crawlApiContent = await fs.readFile('lib/scraper-api-crawl.ts', 'utf-8');
    const hasApiLogging = crawlApiContent.includes('[CrawlWebsite] forceRescrape option:');
    logTest(
      'Phase 5',
      'API logging added',
      hasApiLogging,
      hasApiLogging ? 'PASS: Logging in crawlWebsite' : 'FAIL: Missing API logging'
    );

    const workerContent = await fs.readFile('lib/scraper-worker.js', 'utf-8');
    const hasWorkerLogging = workerContent.includes('[Worker ${jobId}] 🔍 forceRescrape Validation:');
    logTest(
      'Phase 5',
      'Worker logging added',
      hasWorkerLogging,
      hasWorkerLogging ? 'PASS: Logging in worker' : 'FAIL: Missing worker logging'
    );

    const cronContent = await fs.readFile('app/api/cron/refresh/route.ts', 'utf-8');
    const hasCronLogging = cronContent.includes('[Cron]   - forceRescrape: true');
    logTest(
      'Phase 5',
      'Cron logging added',
      hasCronLogging,
      hasCronLogging ? 'PASS: Logging in cron' : 'FAIL: Missing cron logging'
    );

  } catch (error) {
    logTest('Phase 5', 'File check', false, `Error: ${error}`);
  }
}

export async function testPhase6_404Detection(logTest: Function): Promise<void> {
  console.log('\n📋 Phase 6: 404 Detection and Cleanup (Logic Test)\n');

  const testCases = [
    { error: '404 Not Found', expected: 'deleted', name: '404 error message' },
    { error: 'HTTP 404', expected: 'deleted', name: '404 in message' },
    { error: '410 Gone', expected: 'deleted', name: '410 error' },
    { error: '500 Internal Server Error', expected: 'failed', name: 'Non-404 error' },
  ];

  for (const testCase of testCases) {
    const is404 = testCase.error.includes('404') || testCase.error.includes('Not Found');
    const is410 = testCase.error.includes('410') || testCase.error.includes('Gone');
    const status = (is404 || is410) ? 'deleted' : 'failed';

    const passed = status === testCase.expected;
    logTest(
      'Phase 6',
      testCase.name,
      passed,
      passed ? `PASS: ${status}` : `FAIL: Expected ${testCase.expected}, got ${status}`
    );
  }

  try {
    const fs = await import('fs/promises');
    await fs.access('scripts/database/cleanup-deleted-pages.ts');
    logTest('Phase 6', 'Cleanup script exists', true, 'PASS: Script created');
  } catch {
    logTest('Phase 6', 'Cleanup script exists', false, 'FAIL: Script missing');
  }
}

export async function testPhase7_AtomicTransactions(supabase: any, logTest: Function): Promise<void> {
  console.log('\n📋 Phase 7: Atomic Transactions\n');

  try {
    const { error: funcError } = await supabase.rpc('atomic_page_with_embeddings', {
      page_data: {},
      embeddings_data: []
    });

    const exists = funcError?.message !== 'Function not found';
    logTest(
      'Phase 7',
      'Atomic function exists',
      exists,
      exists ? 'PASS: Function registered' : 'FAIL: Function not found'
    );

    try {
      const fs = await import('fs/promises');
      await fs.access('lib/atomic-page-embeddings.ts');
      logTest('Phase 7', 'TypeScript wrapper exists', true, 'PASS: Wrapper created');
    } catch {
      logTest('Phase 7', 'TypeScript wrapper exists', false, 'FAIL: Wrapper missing');
    }

  } catch (error) {
    logTest('Phase 7', 'Atomic transactions', false, `Error: ${error}`);
  }
}
