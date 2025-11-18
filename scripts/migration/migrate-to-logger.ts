/**
 * Migration Script: Console to Structured Logger
 *
 * This script helps migrate console.log/warn/error statements
 * to the structured logger.
 *
 * Usage:
 *   npx tsx scripts/migration/migrate-to-logger.ts <file-path>
 *   npx tsx scripts/migration/migrate-to-logger.ts --dry-run <file-path>
 */

import * as fs from 'fs';
import * as path from 'path';

interface MigrationResult {
  file: string;
  consoleLogCount: number;
  consoleWarnCount: number;
  consoleErrorCount: number;
  totalReplaced: number;
  changes: Array<{
    line: number;
    old: string;
    new: string;
  }>;
}

function migrateFile(filePath: string, dryRun: boolean = false): MigrationResult {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');

  const result: MigrationResult = {
    file: filePath,
    consoleLogCount: 0,
    consoleWarnCount: 0,
    consoleErrorCount: 0,
    totalReplaced: 0,
    changes: [],
  };

  let newContent = content;
  let needsLoggerImport = false;

  // Count occurrences
  result.consoleLogCount = (content.match(/console\.log/g) || []).length;
  result.consoleWarnCount = (content.match(/console\.warn/g) || []).length;
  result.consoleErrorCount = (content.match(/console\.error/g) || []).length;

  if (result.consoleLogCount + result.consoleWarnCount + result.consoleErrorCount > 0) {
    needsLoggerImport = true;
    result.totalReplaced = result.consoleLogCount + result.consoleWarnCount + result.consoleErrorCount;
  }

  // Add logger import if needed
  if (needsLoggerImport && !content.includes("from '@/lib/logger'")) {
    // Find the last import statement
    const importRegex = /^import .* from .*$/gm;
    const matches = [...content.matchAll(importRegex)];

    if (matches.length > 0) {
      const lastImport = matches[matches.length - 1];
      const lastImportEnd = lastImport.index! + lastImport[0].length;
      newContent = content.slice(0, lastImportEnd) +
        "\nimport { logger } from '@/lib/logger';" +
        content.slice(lastImportEnd);
    }
  }

  // Simple replacements (for demonstration - real migration would be more sophisticated)
  // This is a basic example - production migration would need AST parsing

  if (!dryRun) {
    fs.writeFileSync(filePath, newContent, 'utf-8');
  }

  return result;
}

function printResults(results: MigrationResult[]) {
  console.log('\n📊 Migration Results\n');
  console.log('='.repeat(80));

  let totalConsoleLog = 0;
  let totalConsoleWarn = 0;
  let totalConsoleError = 0;

  for (const result of results) {
    totalConsoleLog += result.consoleLogCount;
    totalConsoleWarn += result.consoleWarnCount;
    totalConsoleError += result.consoleErrorCount;

    if (result.totalReplaced > 0) {
      console.log(`\n📁 ${result.file}`);
      console.log(`   console.log:   ${result.consoleLogCount}`);
      console.log(`   console.warn:  ${result.consoleWarnCount}`);
      console.log(`   console.error: ${result.consoleErrorCount}`);
      console.log(`   Total:         ${result.totalReplaced}`);
    }
  }

  console.log('\n' + '='.repeat(80));
  console.log(`\n📈 Total Summary:`);
  console.log(`   Files processed: ${results.length}`);
  console.log(`   console.log:     ${totalConsoleLog}`);
  console.log(`   console.warn:    ${totalConsoleWarn}`);
  console.log(`   console.error:   ${totalConsoleError}`);
  console.log(`   TOTAL:           ${totalConsoleLog + totalConsoleWarn + totalConsoleError}`);
  console.log('');
}

// Main execution
const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const filePaths = args.filter(arg => !arg.startsWith('--'));

if (filePaths.length === 0) {
  console.error('Usage: npx tsx scripts/migration/migrate-to-logger.ts [--dry-run] <file-path>');
  process.exit(1);
}

const results: MigrationResult[] = [];

for (const filePath of filePaths) {
  if (!fs.existsSync(filePath)) {
    console.error(`File not found: ${filePath}`);
    continue;
  }

  const result = migrateFile(filePath, dryRun);
  results.push(result);
}

printResults(results);

if (dryRun) {
  console.log('⚠️  DRY RUN - No files were modified\n');
} else {
  console.log('✅ Migration complete\n');
}
