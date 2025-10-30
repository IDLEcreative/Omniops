#!/usr/bin/env tsx
/**
 * Check Root Directory Clutter
 *
 * Validates that no misplaced files exist in the root directory.
 * Should only contain essential config files.
 *
 * Usage:
 *   npx tsx scripts/check-root-clutter.ts          # Check all files
 *   npx tsx scripts/check-root-clutter.ts --staged # Check only staged files (for pre-commit)
 */

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

// Allowed files in root directory
const ALLOWED_ROOT_FILES = new Set([
  // Package files
  'package.json',
  'package-lock.json',

  // TypeScript config
  'tsconfig.json',
  'tsconfig.test.json',
  'jsconfig.json',
  'next-env.d.ts',

  // Next.js
  'next.config.js',
  'next.config.ts',
  'middleware.ts',

  // Styling
  'tailwind.config.js',
  'tailwind.config.ts',
  'postcss.config.mjs',
  'postcss.config.js',

  // Testing
  'jest.config.js',
  'jest.config.ts',
  'playwright.config.js',
  'playwright.config.ts',

  // Linting
  'eslint.config.mjs',
  '.eslintignore',

  // Component library
  'components.json',

  // Deployment
  'vercel.json',

  // Docker
  'Dockerfile',
  'Dockerfile.dev',
  'docker-compose.yml',
  'docker-compose.dev.yml',
  '.dockerignore',

  // Environment files (examples only)
  '.env.example',
  '.env.docker.example',
  '.env.monitoring.example',

  // Git
  '.gitignore',
  '.vercelignore',

  // MCP
  '.mcp.json',

  // Documentation
  'README.md',
  'CLAUDE.md',
]);

// Patterns that should NEVER be in root
const FORBIDDEN_PATTERNS = [
  // Test files
  { pattern: /^test-.*\.(ts|js|tsx|jsx)$/, message: 'Test files belong in __tests__/' },
  { pattern: /^.*\.test\.(ts|js|tsx|jsx)$/, message: 'Test files belong in __tests__/' },
  { pattern: /^.*\.spec\.(ts|js|tsx|jsx)$/, message: 'Test files belong in __tests__/' },
  { pattern: /^verify-.*\.ts$/, message: 'Verification scripts belong in scripts/verification/' },
  { pattern: /^diagnose-.*\.html$/, message: 'Diagnostic files belong in __tests__/diagnostics/' },

  // Utility scripts
  { pattern: /^apply-.*\.ts$/, message: 'Migration scripts belong in scripts/migrations/' },
  { pattern: /^migrate-.*\.ts$/, message: 'Migration scripts belong in scripts/migrations/' },
  { pattern: /^check-.*\.ts$/, message: 'Check scripts belong in scripts/database/ or scripts/verification/' },
  { pattern: /^fix-.*\.ts$/, message: 'Fix scripts belong in scripts/utilities/' },
  { pattern: /^monitor-.*\.ts$/, message: 'Monitor scripts belong in scripts/monitoring/' },
  { pattern: /^benchmark-.*\.ts$/, message: 'Benchmark scripts belong in scripts/monitoring/' },
  { pattern: /^batch-.*\.(ts|py)$/, message: 'Batch scripts belong in scripts/utilities/' },

  // SQL files
  { pattern: /^.*\.sql$/, message: 'SQL scripts belong in scripts/sql/' },

  // Completion reports
  { pattern: /.*_REPORT\.md$/, message: 'Reports belong in ARCHIVE/completion-reports-[date]/' },
  { pattern: /.*_SUMMARY\.md$/, message: 'Summaries belong in ARCHIVE/completion-reports-[date]/' },
  { pattern: /.*_COMPLETE.*\.md$/, message: 'Completion docs belong in ARCHIVE/completion-reports-[date]/' },
  { pattern: /.*_COMPLETION.*\.md$/, message: 'Completion docs belong in ARCHIVE/completion-reports-[date]/' },
  { pattern: /^PHASE.*\.md$/, message: 'Phase reports belong in ARCHIVE/completion-reports-[date]/' },
  { pattern: /^AGENT.*\.md$/, message: 'Agent reports belong in ARCHIVE/completion-reports-[date]/' },
  { pattern: /^ARCHITECTURE_.*\.md$/, message: 'Architecture docs belong in docs/01-ARCHITECTURE/' },
  { pattern: /^WOOCOMMERCE_.*\.md$/, message: 'WooCommerce docs belong in docs/06-INTEGRATIONS/' },

  // Test artifacts
  { pattern: /.*-results.*\.json$/, message: 'Test results belong in ARCHIVE/test-results/' },
  { pattern: /.*-report.*\.json$/, message: 'Reports belong in ARCHIVE/benchmarks/ or ARCHIVE/investigations/' },
  { pattern: /^benchmark-.*\.json$/, message: 'Benchmarks belong in ARCHIVE/benchmarks/' },
  { pattern: /^performance-report-.*\.json$/, message: 'Performance reports belong in ARCHIVE/benchmarks/' },

  // Log files
  { pattern: /^.*\.log$/, message: 'Log files belong in logs/[category]/' },
  { pattern: /^.*\.heapsnapshot$/, message: 'Heap snapshots should be deleted (can regenerate)' },

  // HTML test files
  { pattern: /^test-.*\.html$/, message: 'Test HTML files belong in __tests__/ui/' },
  { pattern: /^performance-report-.*\.html$/, message: 'Performance reports belong in ARCHIVE/reports/' },
];

function getRootFiles(stagedOnly: boolean): string[] {
  if (stagedOnly) {
    try {
      // Get staged files in root directory only
      const output = execSync('git diff --cached --name-only --diff-filter=ACM', {
        encoding: 'utf-8'
      });
      return output
        .split('\n')
        .filter(f => f.trim())
        .filter(f => !f.includes('/')) // Only root files (no subdirectories)
        .filter(f => !f.startsWith('.')); // Ignore dotfiles
    } catch (error) {
      console.error('Error getting staged files:', error);
      return [];
    }
  } else {
    // Get all files in root directory
    return fs.readdirSync('.')
      .filter(f => {
        const stat = fs.statSync(f);
        return stat.isFile() && !f.startsWith('.');
      });
  }
}

function checkFile(filename: string): { allowed: boolean; reason?: string } {
  // Check if it's in the allowed list
  if (ALLOWED_ROOT_FILES.has(filename)) {
    return { allowed: true };
  }

  // Check against forbidden patterns
  for (const { pattern, message } of FORBIDDEN_PATTERNS) {
    if (pattern.test(filename)) {
      return { allowed: false, reason: message };
    }
  }

  // If not in allowed list and doesn't match forbidden patterns,
  // it's probably a mistake
  return {
    allowed: false,
    reason: 'Not in allowed root files list. Check CLAUDE.md for placement rules.'
  };
}

function main() {
  const args = process.argv.slice(2);
  const stagedOnly = args.includes('--staged');

  console.log(`🔍 Checking root directory for misplaced files${stagedOnly ? ' (staged only)' : ''}...`);

  const rootFiles = getRootFiles(stagedOnly);

  if (rootFiles.length === 0) {
    console.log('✅ No files to check in root directory');
    return;
  }

  const violations: Array<{ file: string; reason: string }> = [];

  for (const file of rootFiles) {
    const result = checkFile(file);
    if (!result.allowed) {
      violations.push({ file, reason: result.reason || 'Unknown reason' });
    }
  }

  if (violations.length === 0) {
    console.log(`✅ All root files are properly placed (checked ${rootFiles.length} files)`);
    process.exit(0);
  }

  // Report violations
  console.error(`\n❌ Found ${violations.length} misplaced file(s) in root directory:\n`);

  for (const { file, reason } of violations) {
    console.error(`  ❌ ${file}`);
    console.error(`     → ${reason}\n`);
  }

  console.error('📖 See CLAUDE.md "FILE PLACEMENT RULES" for correct locations.');
  console.error('🔧 Move these files to the correct directory before committing.\n');

  process.exit(1);
}

main();
