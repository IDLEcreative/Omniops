#!/usr/bin/env npx tsx
import { runHallucinationTests } from './hallucination-prevention/runner';

console.log('Starting comprehensive hallucination tests...\n');

runHallucinationTests().catch((error) => {
  console.error(error);
  process.exit(1);
});
