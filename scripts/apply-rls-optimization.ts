#!/usr/bin/env npx tsx
import { runRlsOptimizations } from './optimizations/rls/runner';

runRlsOptimizations().catch(error => {
  console.error('RLS optimization script failed:', error);
  process.exit(1);
});
