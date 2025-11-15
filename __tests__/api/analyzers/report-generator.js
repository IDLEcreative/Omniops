/**
 * Analysis Report Generator
 * Generates summary reports and recommendations
 */

const { printFinding } = require('../helpers/error-analysis-helpers');

function generateReport(tracker) {
  console.log('\n========== ANALYSIS RESULTS ==========\n');

  const bySeverity = tracker.getGroupedBySeverity();

  if (bySeverity.critical.length > 0) {
    console.log('🔴 CRITICAL ISSUES\n');
    bySeverity.critical.forEach(f => printFinding(f));
  }

  if (bySeverity.high.length > 0) {
    console.log('\n🟠 HIGH PRIORITY ISSUES\n');
    bySeverity.high.forEach(f => printFinding(f));
  }

  if (bySeverity.medium.length > 0) {
    console.log('\n🟡 MEDIUM PRIORITY ISSUES\n');
    bySeverity.medium.forEach(f => printFinding(f));
  }

  if (bySeverity.low.length > 0) {
    console.log('\n🟢 LOW PRIORITY / GOOD PATTERNS\n');
    bySeverity.low.forEach(f => printFinding(f));
  }

  printSummary(tracker, bySeverity);
  printRecommendations();
}

function printSummary(tracker, bySeverity) {
  const findings = tracker.getFindings();
  const riskScore = tracker.calculateRiskScore();

  console.log('\n========== SUMMARY ==========\n');
  console.log(`Total Findings: ${findings.length}`);
  console.log(`Critical: ${bySeverity.critical.length}`);
  console.log(`High: ${bySeverity.high.length}`);
  console.log(`Medium: ${bySeverity.medium.length}`);
  console.log(`Low/Good: ${bySeverity.low.length}`);

  console.log(`\nRisk Score: ${riskScore.toFixed(1)} / 100`);

  if (riskScore >= 30) {
    console.log('⚠️  HIGH RISK - Address critical and high-priority issues immediately');
  } else if (riskScore >= 15) {
    console.log('⚠️  MEDIUM RISK - Address high-priority issues soon');
  } else {
    console.log('✅ ACCEPTABLE - Error handling is generally good');
  }
}

function printRecommendations() {
  console.log('\n========== TOP RECOMMENDATIONS ==========\n');

  const recommendations = [
    {
      priority: 'CRITICAL',
      action: 'Add timeout handling to fetch requests in ChatWidget',
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
      impact: 'Users understand what went wrong and can retry',
      files: ['components/ChatWidget.tsx (sendMessage error handling)'],
    },
    {
      priority: 'HIGH',
      action: 'Add timeout to AI conversation processing',
      impact: 'Prevents indefinite hanging on OpenAI API calls',
      files: ['app/api/chat/route.ts:175 (processAIConversation)'],
    },
    {
      priority: 'HIGH',
      action: 'Add error handling to WooCommerce config fetch',
      impact: 'Users informed if WooCommerce config check fails',
      files: ['components/ChatWidget/hooks/useChatState.ts:145'],
    },
    {
      priority: 'MEDIUM',
      action: 'Add Retry-After header to 429 rate limit responses',
      impact: 'Guides clients on optimal retry strategy',
      files: ['app/api/chat/route.ts:103'],
    },
    {
      priority: 'MEDIUM',
      action: 'Validate domain format in ChatWidget hooks',
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

module.exports = { generateReport };
