import { AuditResult } from './core';

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
};

export function printResult(result: AuditResult): void {
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

  console.log('');
}

export function printSummary(results: AuditResult[], currentVersion: string): void {
  const passed = results.filter(r => r.status === 'pass').length;
  const warned = results.filter(r => r.status === 'warn').length;
  const failed = results.filter(r => r.status === 'fail').length;
  const total = results.length;

  console.log(`${colors.cyan}📋 Documentation Version Audit${colors.reset}`);
  console.log(`${colors.gray}Current application version: ${colors.reset}${colors.green}v${currentVersion}${colors.reset}\n`);

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

export function printReportGenerated(reportPath: string): void {
  console.log(`${colors.blue}📄 Report generated: ${reportPath}${colors.reset}\n`);
}

export function printAutoFixed(): void {
  console.log(`${colors.green}   ✓ Auto-fixed${colors.reset}`);
}
