#!/usr/bin/env npx tsx

import { runTengInvestigation } from './teng-investigation';

runTengInvestigation().catch(error => {
  console.error('❌ Investigation failed:', error);
  process.exitCode = 1;
});
