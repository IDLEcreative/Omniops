#!/usr/bin/env tsx
/**
 * Quick Documentation Version Check (Pre-commit Hook)
 *
 * Fast check to prevent committing outdated docs.
 * Runs as part of pre-commit hook for quick validation.
 *
 * Usage:
 *   npx tsx scripts/check-doc-versions.ts --quick
 */

import fs from 'fs';
import path from 'path';

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
};

interface PackageJson {
  version: string;
}

/**
 * Quick check for pre-commit hook
 */
function quickCheck(): boolean {
  const rootDir = path.resolve(__dirname, '..');
  const packageJson = JSON.parse(
    fs.readFileSync(path.join(rootDir, 'package.json'), 'utf-8')
  ) as PackageJson;
  const currentVersion = packageJson.version;

  let hasIssues = false;

  // Check critical files
  const criticalFiles = [
    'CHANGELOG.md',
    'README.md',
    'docs/.metadata/version-matrix.md',
  ];

  console.log(`${colors.cyan}🔍 Quick doc version check (v${currentVersion})${colors.reset}\n`);

  for (const file of criticalFiles) {
    const filePath = path.join(rootDir, file);

    if (!fs.existsSync(filePath)) {
      console.log(`${colors.yellow}⚠ Skipping ${file} (not found)${colors.reset}`);
      continue;
    }

    const content = fs.readFileSync(filePath, 'utf-8');

    // Check 1: Has "Last Updated" within last 180 days
    const lastUpdatedMatch = content.match(/\*\*Last Updated:\*\*\s*(\d{4}-\d{2}-\d{2})/i);
    if (lastUpdatedMatch) {
      const lastUpdated = new Date(lastUpdatedMatch[1]);
      const daysSince = Math.floor((Date.now() - lastUpdated.getTime()) / (1000 * 60 * 60 * 24));

      if (daysSince > 180) {
        console.log(`${colors.red}✗ ${file}: Last updated ${daysSince} days ago${colors.reset}`);
        hasIssues = true;
      } else {
        console.log(`${colors.green}✓ ${file}${colors.reset}`);
      }
    } else {
      console.log(`${colors.yellow}⚠ ${file}: Missing "Last Updated" metadata${colors.reset}`);
    }

    // Check 2: CHANGELOG has current version or Unreleased
    if (file === 'CHANGELOG.md') {
      if (!content.includes(`[${currentVersion}]`) && !content.includes('[Unreleased]')) {
        console.log(
          `${colors.yellow}⚠ CHANGELOG.md: No entry for v${currentVersion} (add to [Unreleased])${colors.reset}`
        );
      }
    }
  }

  console.log('');

  if (hasIssues) {
    console.log(`${colors.red}❌ Doc version check failed${colors.reset}`);
    console.log(
      `${colors.yellow}Hint: Run 'npx tsx scripts/audit-doc-versions.ts' for details${colors.reset}\n`
    );
    return false;
  }

  console.log(`${colors.green}✅ Doc version check passed${colors.reset}\n`);
  return true;
}

// Run quick check
const args = process.argv.slice(2);

if (args.includes('--quick') || args.includes('-q')) {
  const passed = quickCheck();
  process.exit(passed ? 0 : 1);
} else {
  console.log('Usage: npx tsx scripts/check-doc-versions.ts --quick');
  process.exit(1);
}
