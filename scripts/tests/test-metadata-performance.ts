#!/usr/bin/env npx tsx

import { runMetadataPerformanceAnalysis } from './metadata-performance';

runMetadataPerformanceAnalysis().catch(error => {
  console.error('Metadata performance analysis failed:', error);
  process.exit(1);
});
