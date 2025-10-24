#!/usr/bin/env npx tsx
/**
 * File Length Checker
 *
 * Enforces the project's strict 300 LOC (lines of code) limit per file.
 * Scans the codebase and reports any violations.
 *
 * Usage:
 *   npx tsx scripts/check-file-length.ts           # Check all files
 *   npx tsx scripts/check-file-length.ts --fix     # Show refactoring suggestions
 *   npx tsx scripts/check-file-length.ts --strict  # Exit 1 on any violation
 *
 * Configuration is loaded from CLAUDE.md
 */

import * as fs from 'fs';
import * as path from 'path';

// Configuration
const MAX_LOC = 300;
const EXCLUDE_PATTERNS = [
  '**/node_modules/**',
  '**/dist/**',
  '**/build/**',
  '**/.next/**',
  '**/coverage/**',
  '**/*.generated.*',
  '**/*.min.*',
  '**/package-lock.json',
  '**/pnpm-lock.yaml',
];

interface FileViolation {
  file: string;
  lines: number;
  violation: string;
  percentage: number;
}

/**
 * Counts lines of code in a file (excluding blanks and comments).
 */
function countLinesOfCode(filePath: string): number {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');

  let loc = 0;
  let inBlockComment = false;

  for (let line of lines) {
    line = line.trim();

    // Skip empty lines
    if (line.length === 0) continue;

    // Handle block comments
    if (line.startsWith('/*')) {
      inBlockComment = true;
    }
    if (inBlockComment) {
      if (line.includes('*/')) {
        inBlockComment = false;
      }
      continue;
    }

    // Skip single-line comments
    if (line.startsWith('//') || line.startsWith('#')) continue;

    // Count as LOC
    loc++;
  }

  return loc;
}

/**
 * Recursively finds all source files in a directory.
 */
function findSourceFiles(dir: string, files: string[] = []): string[] {
  if (!fs.existsSync(dir)) return files;

  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    // Skip excluded patterns
    const shouldExclude = EXCLUDE_PATTERNS.some(pattern =>
      fullPath.includes(pattern.replace(/\*\*/g, '').replace(/\*/g, ''))
    );
    if (shouldExclude) continue;

    if (entry.isDirectory()) {
      findSourceFiles(fullPath, files);
    } else if (entry.isFile()) {
      // Only include TypeScript and JavaScript files
      if (/\.(ts|tsx|js|jsx)$/.test(entry.name)) {
        files.push(fullPath);
      }
    }
  }

  return files;
}

/**
 * Scans the codebase for file length violations.
 */
function checkFileLengths(): FileViolation[] {
  const violations: FileViolation[] = [];

  // Directories to scan
  const directories = ['app', 'lib', '__tests__', 'components', 'pages'];

  for (const dir of directories) {
    const files = findSourceFiles(dir);

    for (const file of files) {
      const loc = countLinesOfCode(file);

      if (loc > MAX_LOC) {
        const percentage = Math.round((loc / MAX_LOC) * 100);
        violations.push({
          file,
          lines: loc,
          violation: `${percentage}% over limit`,
          percentage,
        });
      }
    }
  }

  return violations.sort((a, b) => b.lines - a.lines);
}

/**
 * Suggests refactoring strategy based on file size.
 */
function suggestRefactoring(file: string, lines: number): string {
  const filesNeeded = Math.ceil(lines / 200); // Target ~200 LOC per file
  const category = file.includes('test') ? 'test' : 'source';

  if (category === 'test') {
    return `  💡 Suggestion: Split into ${filesNeeded} test files by feature/scenario`;
  } else if (file.includes('route.ts')) {
    return `  💡 Suggestion: Extract into ${filesNeeded} modules (handlers, utils, types)`;
  } else {
    return `  💡 Suggestion: Break into ${filesNeeded} smaller, focused modules`;
  }
}

/**
 * Formats violation output with color.
 */
function formatViolation(violation: FileViolation, showSuggestions: boolean): string {
  const { file, lines, violation: violationText, percentage } = violation;

  let output = '';
  output += `\n❌ ${file}\n`;
  output += `   Lines: ${lines} LOC (${violationText})\n`;

  if (showSuggestions) {
    output += suggestRefactoring(file, lines) + '\n';
  }

  return output;
}

/**
 * Main execution
 */
function main() {
  const args = process.argv.slice(2);
  const showSuggestions = args.includes('--fix');
  const strictMode = args.includes('--strict');

  console.log('🔍 Checking file lengths...\n');
  console.log(`📏 Maximum allowed: ${MAX_LOC} LOC per file\n`);

  const violations = checkFileLengths();

  if (violations.length === 0) {
    console.log('✅ All files are within the 300 LOC limit!\n');
    process.exit(0);
  }

  // Report violations
  console.log(`⚠️  Found ${violations.length} file(s) exceeding the limit:\n`);

  for (const violation of violations) {
    console.log(formatViolation(violation, showSuggestions));
  }

  // Summary statistics
  const totalExcessLines = violations.reduce((sum, v) => sum + (v.lines - MAX_LOC), 0);
  const avgViolation = Math.round(totalExcessLines / violations.length);

  console.log('\n📊 Summary:');
  console.log(`   Total violations: ${violations.length}`);
  console.log(`   Total excess lines: ${totalExcessLines} LOC`);
  console.log(`   Average violation: ${avgViolation} LOC over limit`);
  console.log(`   Worst offender: ${violations[0].file} (${violations[0].lines} LOC)\n`);

  // Guidance
  if (showSuggestions) {
    console.log('💡 Refactoring Tips:');
    console.log('   • Aim for 150-200 LOC per file for optimal readability');
    console.log('   • Extract utilities, types, and helpers into separate files');
    console.log('   • Split test files by feature/scenario');
    console.log('   • Use clear, descriptive file names for extracted modules\n');
  } else {
    console.log('💡 Run with --fix to see refactoring suggestions\n');
  }

  // Exit code
  if (strictMode) {
    console.log('⛔ Strict mode: Exiting with error code 1\n');
    process.exit(1);
  }

  process.exit(0);
}

try {
  main();
} catch (error) {
  console.error('❌ Error checking file lengths:', error);
  process.exit(1);
}
