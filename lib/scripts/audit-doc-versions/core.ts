import fs from 'fs';
import path from 'path';
import {
  getFileLastModified,
  extractMetadata,
  getDaysSince,
  compareVersions,
  autoFixDocument
} from './utils';

export interface AuditResult {
  file: string;
  status: 'pass' | 'warn' | 'fail';
  issues: string[];
  lastModified?: string;
  lastUpdatedInDoc?: string;
  verifiedFor?: string;
}

export interface PackageJson {
  version: string;
  name: string;
}

export class DocumentationAuditor {
  private rootDir: string;
  private docsDir: string;
  private currentVersion: string;
  private results: AuditResult[] = [];
  private options: {
    specificDoc?: string;
    generateReport?: boolean;
    autoFix?: boolean;
  };
  private staleThresholdDays = 90;

  constructor(options: { specificDoc?: string; generateReport?: boolean; autoFix?: boolean } = {}) {
    this.rootDir = path.resolve(__dirname, '../../..');
    this.docsDir = path.join(this.rootDir, 'docs');
    this.options = options;

    const packageJson = JSON.parse(
      fs.readFileSync(path.join(this.rootDir, 'package.json'), 'utf-8')
    ) as PackageJson;
    this.currentVersion = packageJson.version;
  }

  getCurrentVersion(): string {
    return this.currentVersion;
  }

  getResults(): AuditResult[] {
    return this.results;
  }

  async run(): Promise<void> {
    if (this.options.specificDoc) {
      await this.auditSpecificFile(this.options.specificDoc);
    } else {
      await this.auditAllDocumentation();
    }

    const hasFailures = this.results.some(r => r.status === 'fail');
    if (hasFailures) {
      process.exit(1);
    }
  }

  private async auditAllDocumentation(): Promise<void> {
    const criticalDocs = this.getCriticalDocs();
    for (const doc of criticalDocs) {
      await this.auditDocument(doc);
    }
  }

  private async auditSpecificFile(filename: string): Promise<void> {
    const filePath = path.join(this.rootDir, filename);
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filename}`);
    }
    await this.auditDocument(filePath);
  }

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

  private async auditDocument(filePath: string): Promise<void> {
    const relativePath = path.relative(this.rootDir, filePath);
    const content = fs.readFileSync(filePath, 'utf-8');

    const result: AuditResult = {
      file: relativePath,
      status: 'pass',
      issues: [],
    };

    result.lastModified = getFileLastModified(filePath, this.rootDir);

    const metadata = extractMetadata(content);
    result.lastUpdatedInDoc = metadata.lastUpdatedInDoc;
    result.verifiedFor = metadata.verifiedFor;

    if (!result.lastUpdatedInDoc) {
      result.issues.push('Missing "Last Updated" metadata');
      result.status = 'warn';
    }

    if (result.lastUpdatedInDoc) {
      const daysSinceUpdate = getDaysSince(result.lastUpdatedInDoc);
      if (daysSinceUpdate > this.staleThresholdDays) {
        result.issues.push(`Last updated ${daysSinceUpdate} days ago (>${this.staleThresholdDays} days)`);
        result.status = 'warn';
      }
    }

    if (result.verifiedFor) {
      if (result.verifiedFor !== this.currentVersion) {
        const versionDiff = compareVersions(this.currentVersion, result.verifiedFor);
        if (versionDiff > 1) {
          result.issues.push(
            `Verified for v${result.verifiedFor} but current is v${this.currentVersion}`
          );
          result.status = 'warn';
        }
      }
    }

    const isCritical = this.isCriticalDoc(filePath);
    if (isCritical) {
      if (!result.verifiedFor) {
        result.issues.push('Critical doc missing "Verified Accurate For" metadata');
        result.status = 'fail';
      }
      if (!result.lastUpdatedInDoc) {
        result.status = 'fail';
      }
    }

    const versionRefs = content.match(/v?\d+\.\d+\.\d+/g) || [];
    const outdatedRefs = versionRefs.filter(ref => {
      const version = ref.replace(/^v/, '');
      const diff = compareVersions(this.currentVersion, version);
      return diff > 2;
    });
    if (outdatedRefs.length > 0 && outdatedRefs.length > 5) {
      result.issues.push(`Contains ${outdatedRefs.length} references to old versions`);
      result.status = result.status === 'fail' ? 'fail' : 'warn';
    }

    if (relativePath === 'CHANGELOG.md') {
      if (!content.includes(`[${this.currentVersion}]`) && !content.includes(`## [Unreleased]`)) {
        result.issues.push(`Missing entry for v${this.currentVersion}`);
        result.status = 'warn';
      }
    }

    this.results.push(result);

    if (this.options.autoFix && result.issues.length > 0) {
      autoFixDocument(filePath, content, result, this.currentVersion, isCritical);
    }
  }

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

  generateReport(): string {
    const reportPath = path.join(this.rootDir, 'docs', 'reports', 'doc-version-audit.md');
    const reportDir = path.dirname(reportPath);

    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }

    const date = new Date().toISOString().split('T')[0];
    const time = new Date().toISOString().split('T')[1]?.split('.')[0] || '00:00:00';

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

    fs.writeFileSync(reportPath, report, 'utf-8');
    return reportPath;
  }
}
