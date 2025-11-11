#!/usr/bin/env npx tsx
import { runEnhancedMetadataMigration } from './enhanced-metadata/runner';

runEnhancedMetadataMigration().catch(error => {
  console.error('Migration failed:', error);
  process.exit(1);
});
