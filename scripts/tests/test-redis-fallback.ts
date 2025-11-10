#!/usr/bin/env npx tsx

import { runRedisFallbackTests } from './redis-fallback';

runRedisFallbackTests().catch(error => {
  console.error('Test suite error:', error);
  process.exit(1);
});
