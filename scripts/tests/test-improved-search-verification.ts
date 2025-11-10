#!/usr/bin/env npx tsx

import { runImprovedSearchVerification } from './improved-search-verification';

runImprovedSearchVerification().catch(error => {
  console.error('❌ TEST EXECUTION ERROR:', error);
  process.exit(1);
});
