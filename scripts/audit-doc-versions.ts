#!/usr/bin/env tsx
/**
 * Documentation Version Audit Script
 *
 * Validates that documentation versions match code versions and checks for:
 * - Outdated documentation
 * - Missing version metadata
 * - Broken links to version-specific docs
 * - Undocumented breaking changes
 *
 * Usage:
 *   npx tsx scripts/audit-doc-versions.ts                    # Full audit
 *   npx tsx scripts/audit-doc-versions.ts --doc=FILE.md      # Check specific file
 *   npx tsx scripts/audit-doc-versions.ts --report           # Generate report
 *   npx tsx scripts/audit-doc-versions.ts --fix              # Auto-fix version numbers
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
};

interface AuditResult {
  file: string;
  status: 'pass' | 'warn' | 'fail';
  issues: string[];
  lastModified?: string;
  lastUpdatedInDoc?: string;
  verifiedFor?: string;
}

interface PackageJson {
  version: string;
  name: string;
}

class DocumentationAuditor {
  private rootDir: string;
  private docsDir: string;
  private currentVersion: string;
  private results: AuditResult[] = [];
  private options: {
    specificDoc?: string;
    generateReport?: boolean;
    autoFix?: boolean;
  };

  constructor(options: { specificDoc?: string; generateReport?: boolean; autoFix?: boolean } = {}) {
    this.rootDir = path.resolve(__dirname, '..');
    this.docsDir = path.join(this.rootDir, 'docs');
    this.options = options;

    // Read current version from package.json
    const packageJson = JSON.parse(
      fs.readFileSync(path.join(this.rootDir, 'package.json'), 'utf-8')
    ) as PackageJson;
    this.currentVersion = packageJson.version;
  }

  /**
   * Main audit execution
   */
  async run(): Promise<void> {
    console.log(`${colors.cyan}📋 Documentation Version Audit${colors.reset}`);
    console.log(`${colors.gray}Current application version: ${colors.reset}${colors.green}v${this.currentVersion}${colors.reset}\n`);

    if (this.options.specificDoc) {
      await this.auditSpecificFile(this.options.specificDoc);
    } else {
      await this.auditAllDocumentation();
    }

    this.printSummary();

    if (this.options.generateReport) {
      this.generateReport();
    }

    // Exit with error code if any failures
    const hasFailures = this.results.some(r => r.status === 'fail');
    if (hasFailures) {
      process.exit(1);
    }
  }

  /**
   * Audit all documentation files
   */
  private async auditAllDocumentation(): Promise<void> {
    const criticalDocs = this.getCriticalDocs();

    console.log(`${colors.blue}Checking critical documentation...${colors.reset}\n`);

    for (const doc of criticalDocs) {
      await this.auditDocument(doc);
    }
  }

  /**
   * Audit a specific file
   */
  private async auditSpecificFile(filename: string): Promise<void> {
    const filePath = path.join(this.rootDir, filename);

    if (!fs.existsSync(filePath)) {
      console.error(`${colors.red}❌ File not found: ${filename}${colors.reset}`);
      process.exit(1);
    }

    await this.auditDocument(filePath);
  }

  /**
   * Get list of critical documentation files
   */
  private getCriticalDocs(): string[] {
    const docs = [
      'SUPABASE_SCHEMA.md',
      'README.md',
      'CLAUDE.md',
      'CHANGELOG.md',
      'docs/SEARCH_ARCHITECTURE.md',
      'docs/01-ARCHITECTURE/performance-optimization.md',
      'docs/02-FEATURES/chat-system/hallucination-prevention.md',
      'docs/02-FEATURES/chat-system/README.md',
      'docs/02-FEATURES/woocommerce/README.md',
      'docs/02-FEATURES/shopify/README.md',
      'docs/02-FEATURES/scraping/README.md',
      'docs/.metadata/version-matrix.md',
    ];

    return docs.map(d => path.join(this.rootDir, d)).filter(f => fs.existsSync(f));
  }

  /**
   * Audit a single document
   */
  private async auditDocument(filePath: string): Promise<void> {
    const relativePath = path.relative(this.rootDir, filePath);
    const content = fs.readFileSync(filePath, 'utf-8');

    const result: AuditResult = {
      file: relativePath,
      status: 'pass',
      issues: [],
    };

    // Get file last modified date from git
    try {
      const gitDate = execSync(`git log -1 --format=%cd --date=short "${filePath}"`, {
        encoding: 'utf-8',
        cwd: this.rootDir,
      }).trim();
      result.lastModified = gitDate;
    } catch (error) {
      // File might not be in git yet
      const stats = fs.statSync(filePath);
      result.lastModified = stats.mtime.toISOString().split('T')[0];
    }

    // Extract metadata from document
    const lastUpdatedMatch = content.match(/\*\*Last Updated:\*\*\s*(\d{4}-\d{2}-\d{2})/i);
    if (lastUpdatedMatch) {
      result.lastUpdatedInDoc = lastUpdatedMatch[1];
    }

    const verifiedForMatch = content.match(/\*\*Verified Accurate For:\*\*\s*v?([\d.]+)/i);
    if (verifiedForMatch) {
      result.verifiedFor = verifiedForMatch[1];
    }

    // Check 1: Document has "Last Updated" metadata
    if (!result.lastUpdatedInDoc) {
      result.issues.push('Missing "Last Updated" metadata');
      result.status = 'warn';
    }

    // Check 2: "Last Updated" is not too old (>90 days for critical docs)
    if (result.lastUpdatedInDoc) {
      const daysSinceUpdate = this.getDaysSince(result.lastUpdatedInDoc);
      if (daysSinceUpdate > 90) {
        result.issues.push(`Last updated ${daysSinceUpdate} days ago (>90 days)`);
        result.status = 'warn';
      }
    }

    // Check 3: Document verified for current version or recent version
    if (result.verifiedFor) {
      if (result.verifiedFor !== this.currentVersion) {
        // Check if it's verified for a recent version (within 1 minor version)
        const versionDiff = this.compareVersions(this.currentVersion, result.verifiedFor);
        if (versionDiff > 1) {
          result.issues.push(
            `Verified for v${result.verifiedFor} but current is v${this.currentVersion}`
          );
          result.status = 'warn';
        }
      }
    }

    // Check 4: Critical files should have version metadata
    if (this.isCriticalDoc(filePath)) {
      if (!result.verifiedFor) {
        result.issues.push('Critical doc missing "Verified Accurate For" metadata');
        result.status = 'fail';
      }
      if (!result.lastUpdatedInDoc) {
        result.status = 'fail'; // Upgrade from warn to fail for critical docs
      }
    }

    // Check 5: Look for broken version references
    const versionRefs = content.match(/v?\d+\.\d+\.\d+/g) || [];
    const outdatedRefs = versionRefs.filter(ref => {
      const version = ref.replace(/^v/, '');
      const diff = this.compareVersions(this.currentVersion, version);
      return diff > 2; // More than 2 minor versions behind
    });
    if (outdatedRefs.length > 0 && outdatedRefs.length > 5) {
      result.issues.push(`Contains ${outdatedRefs.length} references to old versions`);
      result.status = result.status === 'fail' ? 'fail' : 'warn';
    }

    // Check 6: Changelog should have entry for current version
    if (relativePath === 'CHANGELOG.md') {
      if (!content.includes(`[${this.currentVersion}]`) && !content.includes(`## [Unreleased]`)) {
        result.issues.push(`Missing entry for v${this.currentVersion}`);
        result.status = 'warn';
      }
    }

    this.results.push(result);
    this.printResult(result);

    // Auto-fix if enabled
    if (this.options.autoFix && result.issues.length > 0) {
      this.autoFixDocument(filePath, content, result);
    }
  }

  /**
   * Check if document is critical
   */
  private isCriticalDoc(filePath: string): boolean {
    const criticalFiles = [
      'SUPABASE_SCHEMA.md',
      'CLAUDE.md',
      'README.md',
      'docs/SEARCH_ARCHITECTURE.md',
      'docs/.metadata/version-matrix.md',
    ];

    const relativePath = path.relative(this.rootDir, filePath);
    return criticalFiles.some(cf => relativePath.includes(cf));
  }

  /**
   * Auto-fix common issues
   */
  private autoFixDocument(filePath: string, content: string, result: AuditResult): void {
    let updated = content;
    let changed = false;

    // Fix missing "Last Updated"
    if (!result.lastUpdatedInDoc) {
      const today = new Date().toISOString().split('T')[0];

      // Try to find and replace existing pattern
      if (content.includes('**Last Updated:**')) {
        updated = updated.replace(
          /\*\*Last Updated:\*\*\s*\S*/,
          `**Last Updated:** ${today}`
        );
      } else {
        // Add at top of document
        updated = `**Last Updated:** ${today}\n\n${updated}`;
      }
      changed = true;
    }

    // Fix missing "Verified Accurate For"
    if (!result.verifiedFor && this.isCriticalDoc(filePath)) {
      if (content.includes('**Verified Accurate For:**')) {
        updated = updated.replace(
          /\*\*Verified Accurate For:\*\*\s*\S*/,
          `**Verified Accurate For:** v${this.currentVersion}`
        );
      } else {
        // Add after Last Updated
        updated = updated.replace(
          /(\*\*Last Updated:\*\*\s*\S+)/,
          `$1\n**Verified Accurate For:** v${this.currentVersion}`
        );
      }
      changed = true;
    }

    if (changed) {
      fs.writeFileSync(filePath, updated, 'utf-8');
      console.log(`${colors.green}   ✓ Auto-fixed${colors.reset}`);
    }
  }

  /**
   * Print result for a single document
   */
  private printResult(result: AuditResult): void {
    const statusIcon = {
      pass: `${colors.green}✓${colors.reset}`,
      warn: `${colors.yellow}⚠${colors.reset}`,
      fail: `${colors.red}✗${colors.reset}`,
    };

    console.log(`${statusIcon[result.status]} ${result.file}`);

    if (result.lastUpdatedInDoc) {
      console.log(`  ${colors.gray}Last updated: ${result.lastUpdatedInDoc}${colors.reset}`);
    }

    if (result.verifiedFor) {
      console.log(`  ${colors.gray}Verified for: v${result.verifiedFor}${colors.reset}`);
    }

    if (result.issues.length > 0) {
      result.issues.forEach(issue => {
        const color = result.status === 'fail' ? colors.red : colors.yellow;
        console.log(`  ${color}• ${issue}${colors.reset}`);
      });
    }

    console.log(''); // Empty line
  }

  /**
   * Print summary
   */
  private printSummary(): void {
    const passed = this.results.filter(r => r.status === 'pass').length;
    const warned = this.results.filter(r => r.status === 'warn').length;
    const failed = this.results.filter(r => r.status === 'fail').length;
    const total = this.results.length;

    console.log(`${colors.cyan}─────────────────────────────────────────${colors.reset}`);
    console.log(`${colors.cyan}Summary${colors.reset}`);
    console.log(`${colors.cyan}─────────────────────────────────────────${colors.reset}\n`);

    console.log(`Total documents: ${total}`);
    console.log(`${colors.green}✓ Passed: ${passed}${colors.reset}`);
    console.log(`${colors.yellow}⚠ Warnings: ${warned}${colors.reset}`);
    console.log(`${colors.red}✗ Failed: ${failed}${colors.reset}\n`);

    if (failed > 0) {
      console.log(`${colors.red}❌ Audit failed - please update documentation${colors.reset}\n`);
    } else if (warned > 0) {
      console.log(`${colors.yellow}⚠️  Audit passed with warnings${colors.reset}\n`);
    } else {
      console.log(`${colors.green}✅ All documentation is up to date!${colors.reset}\n`);
    }
  }

  /**
   * Generate detailed report
   */
  private generateReport(): void {
    const reportPath = path.join(this.rootDir, 'docs', 'reports', 'doc-version-audit.md');
    const reportDir = path.dirname(reportPath);

    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }

    const date = new Date().toISOString().split('T')[0];
    const time = new Date().toISOString().split('T')[1].split('.')[0];

    let report = `# Documentation Version Audit Report\n\n`;
    report += `**Generated:** ${date} ${time}\n`;
    report += `**Application Version:** v${this.currentVersion}\n\n`;
    report += `---\n\n`;

    report += `## Summary\n\n`;
    report += `| Status | Count |\n`;
    report += `|--------|-------|\n`;
    report += `| ✅ Passed | ${this.results.filter(r => r.status === 'pass').length} |\n`;
    report += `| ⚠️ Warnings | ${this.results.filter(r => r.status === 'warn').length} |\n`;
    report += `| ❌ Failed | ${this.results.filter(r => r.status === 'fail').length} |\n`;
    report += `| **Total** | **${this.results.length}** |\n\n`;

    report += `---\n\n`;

    // Group by status
    ['fail', 'warn', 'pass'].forEach(status => {
      const resultsForStatus = this.results.filter(r => r.status === status);

      if (resultsForStatus.length === 0) return;

      const emoji = { fail: '❌', warn: '⚠️', pass: '✅' }[status];
      const title = { fail: 'Failed', warn: 'Warnings', pass: 'Passed' }[status];

      report += `## ${emoji} ${title}\n\n`;

      resultsForStatus.forEach(result => {
        report += `### \`${result.file}\`\n\n`;

        if (result.lastUpdatedInDoc) {
          report += `- **Last Updated:** ${result.lastUpdatedInDoc}\n`;
        }
        if (result.verifiedFor) {
          report += `- **Verified For:** v${result.verifiedFor}\n`;
        }
        if (result.lastModified) {
          report += `- **Last Modified (Git):** ${result.lastModified}\n`;
        }

        if (result.issues.length > 0) {
          report += `\n**Issues:**\n\n`;
          result.issues.forEach(issue => {
            report += `- ${issue}\n`;
          });
        }

        report += `\n`;
      });

      report += `---\n\n`;
    });

    fs.writeFileSync(reportPath, report, 'utf-8');
    console.log(`${colors.blue}📄 Report generated: ${reportPath}${colors.reset}\n`);
  }

  /**
   * Calculate days since a date
   */
  private getDaysSince(dateStr: string): number {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  }

  /**
   * Compare two semantic versions
   * Returns difference in minor versions
   */
  private compareVersions(v1: string, v2: string): number {
    const parts1 = v1.split('.').map(Number);
    const parts2 = v2.split('.').map(Number);

    // Compare major version
    if (parts1[0] !== parts2[0]) {
      return Math.abs(parts1[0] - parts2[0]) * 100; // Major diff is significant
    }

    // Compare minor version
    return Math.abs(parts1[1] - parts2[1]);
  }
}

// Parse CLI arguments
const args = process.argv.slice(2);
const options: {
  specificDoc?: string;
  generateReport?: boolean;
  autoFix?: boolean;
} = {};

for (const arg of args) {
  if (arg.startsWith('--doc=')) {
    options.specificDoc = arg.split('=')[1];
  } else if (arg === '--report') {
    options.generateReport = true;
  } else if (arg === '--fix') {
    options.autoFix = true;
  } else if (arg === '--help' || arg === '-h') {
    console.log(`
Documentation Version Audit Tool

Usage:
  npx tsx scripts/audit-doc-versions.ts [options]

Options:
  --doc=FILE.md    Check specific file only
  --report         Generate detailed markdown report
  --fix            Auto-fix common issues (updates dates/versions)
  --help, -h       Show this help message

Examples:
  # Full audit
  npx tsx scripts/audit-doc-versions.ts

  # Check specific file
  npx tsx scripts/audit-doc-versions.ts --doc=README.md

  # Generate report
  npx tsx scripts/audit-doc-versions.ts --report

  # Auto-fix issues
  npx tsx scripts/audit-doc-versions.ts --fix
`);
    process.exit(0);
  }
}

// Run auditor
const auditor = new DocumentationAuditor(options);
auditor.run().catch(error => {
  console.error(`${colors.red}Error:${colors.reset}`, error);
  process.exit(1);
});
