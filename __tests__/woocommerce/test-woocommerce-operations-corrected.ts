/**
 * CORRECTED WooCommerce Operations Integration Test orchestrator.
 * Delegates per-operation execution to helpers in ./operations-corrected/.
 */

import { runOperation } from './operations-corrected/run-operation';
import { OPERATION_GROUPS } from './operations-corrected/operations';
import { printHeader, printCategoryHeading, printSummary } from './operations-corrected/summary';
import { DOMAIN } from './operations-corrected/constants';
import { TestResult } from './operations-corrected/types';

async function runAllTests() {
  printHeader('CORRECTED WOOCOMMERCE INTEGRATION TEST');
  console.log('Testing all 25 ACTUAL operations from WOOCOMMERCE_TOOL enum');
  console.log(`Domain: ${DOMAIN}`);
  console.log('='.repeat(80));

  const results: TestResult[] = [];
  const startTime = Date.now();

  for (const group of OPERATION_GROUPS) {
    printCategoryHeading(group.title);

    for (const operation of group.operations) {
      results.push(await runOperation(operation));
    }
  }

  const totalTime = Date.now() - startTime;
  printSummary(results, totalTime);
}

runAllTests().catch((error) => {
  console.error('\n❌ Test suite failed:', error);
  process.exit(1);
});
