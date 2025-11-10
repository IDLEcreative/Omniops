#!/usr/bin/env node
import { ChatTester } from './chat-response-suite/index.js';

async function main() {
  const tester = new ChatTester();
  await tester.runAllTests();
}

main().catch(error => {
  console.error('❌ Test suite failed:', error);
  process.exit(1);
});
