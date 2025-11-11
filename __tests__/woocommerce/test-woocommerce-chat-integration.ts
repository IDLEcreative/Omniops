/**
 * Comprehensive WooCommerce Chat Integration Test orchestrator.
 * Delegates API calls and summaries to helpers in ./chat-integration.
 */

import { DOMAIN, CHAT_API_URL } from './chat-integration/config';
import { OperationTest } from './chat-integration/types';
import { ChatClient } from './chat-integration/chat-client';
import { OPERATION_GROUPS } from './chat-integration/operations';
import { runOperation } from './chat-integration/run-operation';
import { printSuiteHeader, printSummary } from './chat-integration/summary';

async function runTests() {
  const sessionId = `test-${Date.now()}`;
  printSuiteHeader(DOMAIN, CHAT_API_URL, sessionId);

  const client = new ChatClient(sessionId);
  const results: Array<Awaited<ReturnType<typeof runOperation>>> = [];
  const startTime = Date.now();

  for (const group of OPERATION_GROUPS) {
    console.log(`\n\n${group.title}`);
    console.log('='.repeat(70));

    for (const test of group.tests) {
      results.push(await runOperation(client, test as OperationTest));
    }
  }

  const totalDuration = Date.now() - startTime;
  printSummary(results, totalDuration);
}

console.log('⏳ Starting WooCommerce chat integration tests in 3 seconds...\n');
setTimeout(() => {
  runTests().catch((error) => {
    console.error('\n❌ Test suite failed:', error);
    process.exit(1);
  });
}, 3000);
