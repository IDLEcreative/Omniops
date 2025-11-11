import fs from 'fs';
import path from 'path';
import { ValidationIssue, ValidationStats } from './types';

export function logSummary(stats: ValidationStats, issues: ValidationIssue[]) {
  console.log('\n📊 Validation Results');
  console.log('═'.repeat(80));
  console.log(`Total Documentation Files: ${stats.totalFiles}`);
  console.log(`Total Code Blocks: ${stats.totalCodeBlocks}`);
  console.log('\nCode Blocks by Language:');
  Object.entries(stats.byLanguage)
    .sort(([, a], [, b]) => b - a)
    .forEach(([lang, count]) => console.log(`  ${lang.padEnd(20)} ${count}`));

  console.log('\n' + '═'.repeat(80));
  console.log(`🔴 Critical Issues: ${stats.criticalIssues}`);
  console.log(`🟡 Warnings: ${stats.warnings}`);
  console.log(`🔵 Info: ${stats.info}`);
  console.log(`📝 Total Issues: ${issues.length}`);
}

export function writeReport(stats: ValidationStats, issues: ValidationIssue[]) {
  const report = createMarkdownReport(stats, issues);
  const reportPath = path.join(process.cwd(), 'DOC_CODE_VALIDATION_REPORT.md');
  fs.writeFileSync(reportPath, report);
  console.log(`\n✓ Detailed report written to: ${reportPath}`);
}

function createMarkdownReport(stats: ValidationStats, issues: ValidationIssue[]): string {
  let report = '# Documentation Code Example Validation Report\n\n';
  report += `Generated: ${new Date().toISOString()}\n\n`;
  report += `- **Total Documentation Files**: ${stats.totalFiles}\n`;
  report += `- **Total Code Blocks**: ${stats.totalCodeBlocks}\n`;
  report += `- **Critical Issues**: ${stats.criticalIssues}\n`;
  report += `- **Warnings**: ${stats.warnings}\n`;
  report += `- **Info**: ${stats.info}\n\n`;

  report += '## Issues by File\n\n';
  const byFile = issues.reduce((acc, issue) => {
    if (!acc[issue.file]) acc[issue.file] = [];
    acc[issue.file].push(issue);
    return acc;
  }, {} as Record<string, ValidationIssue[]>);

  Object.entries(byFile).forEach(([file, fileIssues]) => {
    report += `### ${file}\n\n`;
    fileIssues.forEach(issue => {
      report += `- **${issue.severity.toUpperCase()}** (Line ${issue.lineNumber}, ${issue.language}): ${issue.message}\n`;
    });
    report += '\n';
  });

  return report;
}
