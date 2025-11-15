/**
 * Error Analysis Report Generator
 *
 * Generates comprehensive reports from findings.
 */

import { Finding } from './types';

export class ReportGenerator {
  generateReport(findings: Finding[]): void {
    console.log('\n========== ANALYSIS RESULTS ==========\n');

    const bySeverity = {
      critical: findings.filter(f => f.severity === 'critical'),
      high: findings.filter(f => f.severity === 'high'),
      medium: findings.filter(f => f.severity === 'medium'),
      low: findings.filter(f => f.severity === 'low'),
    };

    if (bySeverity.critical.length > 0) {
      console.log('🔴 CRITICAL ISSUES\n');
      bySeverity.critical.forEach(f => this.printFinding(f));
    }

    if (bySeverity.high.length > 0) {
      console.log('\n🟠 HIGH PRIORITY ISSUES\n');
      bySeverity.high.forEach(f => this.printFinding(f));
    }

    if (bySeverity.medium.length > 0) {
      console.log('\n🟡 MEDIUM PRIORITY ISSUES\n');
      bySeverity.medium.forEach(f => this.printFinding(f));
    }

    if (bySeverity.low.length > 0) {
      console.log('\n🟢 LOW PRIORITY / GOOD PATTERNS\n');
      bySeverity.low.forEach(f => this.printFinding(f));
    }

    this.printSummary(findings, bySeverity);
    this.printRecommendations();
  }

  private printFinding(finding: Finding): void {
    console.log(`${finding.file}${finding.line ? `:${finding.line}` : ''}`);
    console.log(`  Pattern: ${finding.pattern}`);
    console.log(`  Issue: ${finding.description}`);
    console.log(`  Suggestion: ${finding.suggestion.split('\n').join('\n  ')}`);
    console.log();
  }

  private printSummary(
    findings: Finding[],
    bySeverity: Record<string, Finding[]>
  ): void {
    console.log('\n========== SUMMARY ==========\n');
    console.log(`Total Findings: ${findings.length}`);
    console.log(`Critical: ${bySeverity.critical.length}`);
    console.log(`High: ${bySeverity.high.length}`);
    console.log(`Medium: ${bySeverity.medium.length}`);
    console.log(`Low/Good: ${bySeverity.low.length}`);

    const riskScore =
      bySeverity.critical.length * 10 +
      bySeverity.high.length * 5 +
      bySeverity.medium.length * 2 +
      bySeverity.low.length * 0.5;

    console.log(`\nRisk Score: ${riskScore.toFixed(1)} / 100`);

    if (riskScore >= 30) {
      console.log('⚠️  HIGH RISK - Address critical and high-priority issues immediately');
    } else if (riskScore >= 15) {
      console.log('⚠️  MEDIUM RISK - Address high-priority issues soon');
    } else {
      console.log('✅ ACCEPTABLE - Error handling is generally good');
    }
  }

  private printRecommendations(): void {
    console.log('\n========== TOP RECOMMENDATIONS ==========\n');

    const recommendations = [
      {
        priority: 'CRITICAL',
        action: 'Add timeout handling to fetch requests',
        impact: 'Prevents UI hang when APIs are slow',
        files: [
          'components/ChatWidget/hooks/useChatState.ts:145',
          'components/ChatWidget.tsx (sendMessage function)',
        ],
      },
      {
        priority: 'CRITICAL',
        action: 'Safely parse localStorage JSON with try-catch',
        impact: 'Prevents crashes from corrupted localStorage',
        files: ['app/embed/page.tsx:43'],
      },
      {
        priority: 'HIGH',
        action: 'Show user-friendly error messages in chat widget',
        impact: 'Users understand what went wrong and how to fix it',
        files: ['components/ChatWidget.tsx (sendMessage error handling)'],
      },
      {
        priority: 'HIGH',
        action: 'Add timeout to AI conversation processing',
        impact: 'Prevents indefinite hanging on OpenAI API calls',
        files: ['app/api/chat/route.ts:175'],
      },
      {
        priority: 'MEDIUM',
        action: 'Add Retry-After header to 429 responses',
        impact: 'Guides clients on optimal retry strategy',
        files: ['app/api/chat/route.ts:103'],
      },
      {
        priority: 'MEDIUM',
        action: 'Validate domain format in useChatState',
        impact: 'Prevents invalid domains reaching API',
        files: ['components/ChatWidget/hooks/useChatState.ts:133'],
      },
    ];

    recommendations.forEach((rec, i) => {
      console.log(`${i + 1}. [${rec.priority}] ${rec.action}`);
      console.log(`   Impact: ${rec.impact}`);
      console.log(`   Files: ${rec.files.join(', ')}`);
      console.log();
    });
  }
}
