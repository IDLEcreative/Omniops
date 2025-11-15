/**
 * LOC (Lines of Code) Compliance Test
 *
 * Validates that ALL code files comply with 300 LOC limit.
 * This test ensures no file exceeds the maximum allowed lines of code.
 *
 * Exempt files:
 * - CLAUDE.md and .claude/*.md (AI instruction files - must be fully loaded)
 * - Documentation files (guidance, not strict enforcement)
 */

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

describe('LOC Compliance', () => {
  const MAX_LOC = 300;
  const WARN_THRESHOLD = 280; // 20 LOC safety buffer

  // Files exempt from LOC rules
  const EXEMPT_PATTERNS = [
    'CLAUDE.md',
    '.claude/',
    'docs/',
    'ARCHIVE/',
    'node_modules/',
    '.next/',
    'dist/',
    'build/',
    'coverage/',
  ];

  interface FileStats {
    path: string;
    loc: number;
  }

  function countLinesOfCode(filePath: string): number {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');

    // Match bash script behavior: exclude blank lines, comments
    return lines.filter(line => {
      const trimmed = line.trim();

      // Exclude blank lines
      if (trimmed.length === 0) return false;

      // Exclude single-line comments
      if (trimmed.startsWith('//')) return false;

      // Exclude multi-line comment lines (starting with * or /*)
      if (trimmed.startsWith('*')) return false;
      if (trimmed.startsWith('/*')) return false;

      return true;
    }).length;
  }

  function isExempt(filePath: string): boolean {
    // Check pattern exemptions
    if (EXEMPT_PATTERNS.some(pattern => filePath.includes(pattern))) {
      return true;
    }

    // Exclude bundle files (match bash script behavior)
    if (filePath.endsWith('-bundle.js') || filePath.endsWith('.bundle.js')) {
      return true;
    }

    return false;
  }

  function getAllCodeFiles(dir: string, files: string[] = []): string[] {
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        // Skip exempt directories
        if (!isExempt(fullPath)) {
          getAllCodeFiles(fullPath, files);
        }
      } else if (entry.isFile()) {
        // Include TypeScript and JavaScript files
        if (/\.(ts|tsx|js|jsx)$/.test(entry.name) && !isExempt(fullPath)) {
          files.push(fullPath);
        }
      }
    }

    return files;
  }

  test('should have zero files exceeding 300 LOC', () => {
    const projectRoot = path.resolve(__dirname, '../..');
    const allCodeFiles = getAllCodeFiles(projectRoot);

    const violations: FileStats[] = [];
    const warnings: FileStats[] = [];
    const compliant: FileStats[] = [];

    for (const file of allCodeFiles) {
      const loc = countLinesOfCode(file);
      const relativePath = path.relative(projectRoot, file);

      if (loc > MAX_LOC) {
        violations.push({ path: relativePath, loc });
      } else if (loc >= WARN_THRESHOLD) {
        warnings.push({ path: relativePath, loc });
      } else {
        compliant.push({ path: relativePath, loc });
      }
    }

    // Sort by LOC descending
    violations.sort((a, b) => b.loc - a.loc);
    warnings.sort((a, b) => b.loc - a.loc);

    // Generate report
    const totalFiles = allCodeFiles.length;
    const violationCount = violations.length;
    const warningCount = warnings.length;
    const compliantCount = compliant.length;

    console.log('\n📊 LOC Compliance Report');
    console.log('━'.repeat(60));
    console.log(`Total files checked: ${totalFiles}`);
    console.log(`✅ Compliant (<280 LOC): ${compliantCount} (${((compliantCount/totalFiles)*100).toFixed(1)}%)`);
    console.log(`⚠️  Warnings (280-300 LOC): ${warningCount} (${((warningCount/totalFiles)*100).toFixed(1)}%)`);
    console.log(`❌ Violations (>300 LOC): ${violationCount} (${((violationCount/totalFiles)*100).toFixed(1)}%)`);
    console.log('━'.repeat(60));

    if (violations.length > 0) {
      console.log('\n❌ VIOLATIONS (Files exceeding 300 LOC):');
      violations.forEach(({ path, loc }) => {
        console.log(`   ${path} (${loc} LOC - ${loc - MAX_LOC} over limit)`);
      });
    }

    if (warnings.length > 0) {
      console.log('\n⚠️  WARNINGS (Files approaching limit):');
      warnings.slice(0, 10).forEach(({ path, loc }) => {
        console.log(`   ${path} (${loc} LOC - ${MAX_LOC - loc} LOC buffer remaining)`);
      });
      if (warnings.length > 10) {
        console.log(`   ... and ${warnings.length - 10} more warnings`);
      }
    }

    if (violations.length === 0) {
      console.log('\n✅ 100% COMPLIANCE - No violations found!');
    }

    console.log('\n');

    // Fail test if violations found
    expect(violations).toHaveLength(0);
  });

  test('should match check-loc-compliance.sh results', () => {
    // Run the existing bash script for cross-validation
    const scriptPath = path.resolve(__dirname, '../../scripts/check-loc-compliance.sh');

    if (!fs.existsSync(scriptPath)) {
      console.warn('⚠️  check-loc-compliance.sh not found, skipping cross-validation');
      return;
    }

    try {
      const output = execSync(`bash ${scriptPath}`, {
        encoding: 'utf-8',
        cwd: path.resolve(__dirname, '../..'),
      });

      // Extract violations count from script output
      const violationMatch = output.match(/Violations:\s+(\d+)/);
      const violationCount = violationMatch ? parseInt(violationMatch[1], 10) : -1;

      console.log('\n📋 Cross-validation with check-loc-compliance.sh:');
      console.log(`   Script reports: ${violationCount} violations`);

      // Both should report zero violations
      expect(violationCount).toBe(0);
    } catch (error) {
      console.error('Failed to run check-loc-compliance.sh:', error);
      throw error;
    }
  });

  test('should identify largest files for monitoring', () => {
    const projectRoot = path.resolve(__dirname, '../..');
    const allCodeFiles = getAllCodeFiles(projectRoot);

    const fileStats: FileStats[] = allCodeFiles.map(file => ({
      path: path.relative(projectRoot, file),
      loc: countLinesOfCode(file),
    }));

    // Sort by LOC descending
    fileStats.sort((a, b) => b.loc - a.loc);

    // Top 20 largest files
    const top20 = fileStats.slice(0, 20);

    console.log('\n📈 Top 20 Largest Files:');
    console.log('━'.repeat(60));
    top20.forEach((file, index) => {
      const status = file.loc > MAX_LOC ? '❌' : file.loc >= WARN_THRESHOLD ? '⚠️' : '✅';
      console.log(`${index + 1}. ${status} ${file.path} (${file.loc} LOC)`);
    });
    console.log('━'.repeat(60));

    // This test always passes - it's for monitoring only
    expect(top20.length).toBeGreaterThan(0);
  });
});
