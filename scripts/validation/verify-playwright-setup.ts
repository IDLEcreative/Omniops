#!/usr/bin/env npx tsx
import { runPlaywrightVerification } from '../validators/playwright/runner';

runPlaywrightVerification().catch(error => {
  console.error('Playwright verification failed:', error);
  process.exit(1);
});
