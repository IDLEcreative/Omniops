#!/usr/bin/env npx tsx

import { runAnalyticsVerification } from './analytics-verification';

runAnalyticsVerification().catch(error => {
  console.error('\n❌ Verification script failed:', error);
  process.exit(1);
});
