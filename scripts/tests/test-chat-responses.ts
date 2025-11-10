#!/usr/bin/env npx tsx

import { runTestSuite } from './chat-response-suite';

export { runTestSuite, TEST_SCENARIOS, analyzeResponse, detectConcerns } from './chat-response-suite';

if (require.main === module) {
  runTestSuite().catch(error => {
    console.error('Test suite failed:', error);
    process.exit(1);
  });
}
