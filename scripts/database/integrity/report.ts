import { IntegrityIssue } from './types';

export function reportIssues(issues: IntegrityIssue[]) {
  console.log('\n' + '═'.repeat(80));
  console.log('📊 DATABASE INTEGRITY REPORT');
  console.log('═'.repeat(80));

  if (issues.length === 0) {
    console.log('\n✅ No issues detected. Database integrity looks good!\n');
    return;
  }

  const severityOrder = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
  issues.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

  issues.forEach((issue, idx) => {
    console.log(`\n${idx + 1}. [${issue.severity}] ${issue.category}${issue.table ? ` (${issue.table})` : ''}`);
    console.log(`   Issue: ${issue.issue}`);
    if (issue.count) console.log(`   Count: ${issue.count}`);
    console.log(`   ➜ Recommendation: ${issue.recommendation}`);
  });
}
