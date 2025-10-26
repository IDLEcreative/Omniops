/**
 * Brand Reference Audit Script
 *
 * Scans production code for hardcoded brand references
 * Run: npx tsx scripts/audit-brand-references.ts
 */

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

interface ViolationReport {
  file: string;
  line: number;
  content: string;
  brand: string;
  severity: 'critical' | 'warning' | 'info';
}

const BRANDS = [
  { term: 'thompsonseparts', severity: 'critical' as const },
  { term: "Thompson's", severity: 'critical' as const },
  { term: 'Thompsons', severity: 'critical' as const },
  { term: 'Cifa', severity: 'critical' as const },
  { term: 'Agri Flip', severity: 'critical' as const },
  { term: 'agri-flip', severity: 'critical' as const },
  { term: 'A4VTG90', severity: 'warning' as const },
  { term: 'K2053463', severity: 'warning' as const },
];

const PRODUCTION_DIRS = ['lib/', 'components/', 'app/api/'];
const EXCLUDE_PATTERNS = [
  'node_modules',
  '.next',
  'REMOVED',
  'deprecated',
  'Example:',
  'BRAND_AGNOSTIC',
  'test-',
  '__tests__',
];

class BrandAuditor {
  private violations: ViolationReport[] = [];

  async audit(): Promise<void> {
    console.log('🔍 Starting brand reference audit...\n');

    for (const dir of PRODUCTION_DIRS) {
      console.log(`📂 Scanning ${dir}...`);
      await this.scanDirectory(dir);
    }

    this.generateReport();
  }

  private async scanDirectory(dir: string): Promise<void> {
    for (const brand of BRANDS) {
      try {
        const result = execSync(
          `grep -rn "${brand.term}" ${dir} --include="*.ts" --include="*.tsx" 2>&1 || true`,
          { encoding: 'utf-8' }
        );

        const lines = result.split('\n').filter(line => {
          if (!line) return false;

          // Exclude acceptable patterns
          for (const pattern of EXCLUDE_PATTERNS) {
            if (line.includes(pattern)) return false;
          }

          return true;
        });

        for (const line of lines) {
          const match = line.match(/^(.+):(\d+):(.+)$/);
          if (match) {
            this.violations.push({
              file: match[1],
              line: parseInt(match[2]),
              content: match[3].trim(),
              brand: brand.term,
              severity: brand.severity,
            });
          }
        }
      } catch (error) {
        // Grep returns non-zero when no matches, which is expected
      }
    }
  }

  private generateReport(): void {
    console.log('\n' + '='.repeat(70));
    console.log('📊 BRAND REFERENCE AUDIT REPORT');
    console.log('='.repeat(70));

    if (this.violations.length === 0) {
      console.log('\n✅ No brand references found in production code!');
      console.log('   System is fully brand-agnostic.\n');
      return;
    }

    // Group by severity
    const critical = this.violations.filter(v => v.severity === 'critical');
    const warnings = this.violations.filter(v => v.severity === 'warning');

    console.log(`\n🔴 Critical Violations: ${critical.length}`);
    console.log(`🟡 Warnings: ${warnings.length}`);
    console.log(`📊 Total: ${this.violations.length}\n`);

    // Print critical violations
    if (critical.length > 0) {
      console.log('🔴 CRITICAL VIOLATIONS:');
      for (const v of critical) {
        console.log(`\n  File: ${v.file}:${v.line}`);
        console.log(`  Brand: ${v.brand}`);
        console.log(`  Content: ${v.content.substring(0, 100)}...`);
      }
    }

    // Print warnings
    if (warnings.length > 0) {
      console.log('\n🟡 WARNINGS:');
      for (const v of warnings) {
        console.log(`\n  File: ${v.file}:${v.line}`);
        console.log(`  Brand: ${v.brand}`);
        console.log(`  Content: ${v.content.substring(0, 100)}...`);
      }
    }

    console.log('\n' + '='.repeat(70));
    console.log(`\n⚠️  Found ${this.violations.length} brand references`);
    console.log('   Review and fix violations above.\n');

    // Exit with error code if critical violations found
    if (critical.length > 0) {
      process.exit(1);
    }
  }
}

// Run audit
const auditor = new BrandAuditor();
auditor.audit();
