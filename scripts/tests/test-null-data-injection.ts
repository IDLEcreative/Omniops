#!/usr/bin/env npx tsx

import { runNullDataInjectionSuite } from './null-data-injection';

runNullDataInjectionSuite().catch(error => {
  console.error('Test suite error:', error);
  process.exit(1);
});
