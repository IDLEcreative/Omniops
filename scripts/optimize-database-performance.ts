#!/usr/bin/env npx tsx
import { runDatabaseOptimizations } from './optimizations/database/runner';

runDatabaseOptimizations().catch(error => {
  console.error('Optimization script failed:', error);
  process.exit(1);
});
