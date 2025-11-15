#!/usr/bin/env node

/**
 * Data Transformation Tool for AI Optimization CLI
 *
 * Migrates existing scraped data to AI-optimized format.
 * Business logic extracted to lib/scripts/optimize-existing-data/core.ts
 */

import { DataOptimizer, type MigrationConfig } from '../lib/scripts/optimize-existing-data/core';

async function main() {
  const args = process.argv.slice(2);

  const config: MigrationConfig = {
    batchSize: parseInt(args.find(a => a.startsWith('--batch='))?.split('=')[1] || '10'),
    dryRun: args.includes('--dry-run'),
    maxPages: args.find(a => a.startsWith('--max=')) ?
      parseInt(args.find(a => a.startsWith('--max='))!.split('=')[1]) : undefined,
    outputDir: args.find(a => a.startsWith('--output='))?.split('=')[1] || './optimization-reports',
    reportInterval: parseInt(args.find(a => a.startsWith('--report='))?.split('=')[1] || '100'),
    optimizationLevel: (args.find(a => a.startsWith('--level='))?.split('=')[1] || 'standard') as any,
    preserveOriginal: !args.includes('--no-preserve')
  };

  if (args.includes('--help')) {
    console.log(`
AI Content Optimization Migration Tool

Usage: npm run optimize-data [options]

Options:
  --batch=N          Process N pages per batch (default: 10)
  --dry-run          Test without saving changes
  --max=N            Process maximum N pages
  --output=DIR       Output directory for reports (default: ./optimization-reports)
  --report=N         Report progress every N pages (default: 100)
  --level=LEVEL      Optimization level: basic|standard|advanced (default: standard)
  --no-preserve      Don't preserve original content
  --help             Show this help message

Examples:
  npm run optimize-data --dry-run --max=10
  npm run optimize-data --batch=50 --level=advanced
  npm run optimize-data --output=./reports --report=500
    `);
    process.exit(0);
  }

  const requiredEnvVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY',
    'OPENAI_API_KEY'
  ];

  const missingEnvVars = requiredEnvVars.filter(v => !process.env[v]);
  if (missingEnvVars.length > 0) {
    console.error('❌ Missing required environment variables:', missingEnvVars.join(', '));
    process.exit(1);
  }

  try {
    const optimizer = new DataOptimizer(config);
    await optimizer.migrate();
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}
