#!/usr/bin/env npx tsx

import { generatePerformanceReport } from './performance-analysis/performance-report';

generatePerformanceReport().catch(error => {
  console.error('Performance analysis failed:', error);
  process.exitCode = 1;
});
