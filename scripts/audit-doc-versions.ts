#!/usr/bin/env tsx
/**
 * Documentation Version Audit CLI
 *
 * Usage:
 *   npx tsx scripts/audit-doc-versions.ts                    # Full audit
 *   npx tsx scripts/audit-doc-versions.ts --doc=FILE.md      # Check specific file
 *   npx tsx scripts/audit-doc-versions.ts --report           # Generate report
 *   npx tsx scripts/audit-doc-versions.ts --fix              # Auto-fix version numbers
 */

import { DocumentationAuditor } from '../lib/scripts/audit-doc-versions/core';
import { printResult, printSummary, printReportGenerated } from '../lib/scripts/audit-doc-versions/formatters';

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
  npx tsx scripts/audit-doc-versions.ts
  npx tsx scripts/audit-doc-versions.ts --doc=README.md
  npx tsx scripts/audit-doc-versions.ts --report
  npx tsx scripts/audit-doc-versions.ts --fix
`);
    process.exit(0);
  }
}

const auditor = new DocumentationAuditor(options);

auditor.run().then(() => {
  const results = auditor.getResults();
  const currentVersion = auditor.getCurrentVersion();

  results.forEach(result => printResult(result));
  printSummary(results, currentVersion);

  if (options.generateReport) {
    const reportPath = auditor.generateReport();
    printReportGenerated(reportPath);
  }
}).catch(error => {
  console.error('Error:', error.message);
  process.exit(1);
});
