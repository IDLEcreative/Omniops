#!/usr/bin/env npx tsx
import { runPerformanceBenchmark } from './benchmarks/performance/runner';

runPerformanceBenchmark().catch(error => {
  console.error('Benchmark failed:', error);
  process.exit(1);
});
