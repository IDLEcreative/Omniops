import type { TestScenario } from './scenarios';
import type { ResponseAnalysis } from './analysis';

export interface ScenarioTestResult {
  scenario: TestScenario;
  analysis: ResponseAnalysis;
  concerns: string[];
  response: string;
  success: boolean;
}

export function formatAnalysis(
  scenario: TestScenario,
  analysis: ResponseAnalysis,
  concerns: string[],
  response: string
): string {
  const status = concerns.length === 0 ? '✅ PASS' : '❌ ISSUES FOUND';
  const internalPreview = analysis.internalLinks.slice(0, 3).join(', ');

  return `
${status} - ${scenario.id.toUpperCase()}
Query: "${scenario.query}"
Description: ${scenario.description}

📊 METRICS:
• Response Time: ${analysis.responseTime}ms
• Word Count: ${analysis.wordCount} words
• Character Count: ${analysis.characterCount} chars
• Bullet Points: ${analysis.bulletPoints}
• Questions Asked: ${analysis.questionsAsked}
• Products Shown: ${analysis.productCount}
• Immediate Product Display: ${analysis.immediateProductShow ? 'Yes' : 'No'}

🔗 LINKS:
• Internal Links: ${analysis.internalLinks.length} (${internalPreview}${analysis.internalLinks.length > 3 ? '...' : ''})
• External Links: ${analysis.externalLinks.length} ${analysis.externalLinks.length > 0 ? `(${analysis.externalLinks.join(', ')})` : ''}

💰 CURRENCY:
• GBP (£): ${analysis.currency.gbp}
• USD ($): ${analysis.currency.usd}
• EUR (€): ${analysis.currency.euro}

${concerns.length > 0 ? `
⚠️ CONCERNS DETECTED:
${concerns.map(c => `• ${c}`).join('\n')}
` : ''}

📝 RESPONSE PREVIEW:
${response.substring(0, 300)}${response.length > 300 ? '...' : ''}

---
`;
}

export function printComprehensiveReport(results: ScenarioTestResult[]): void {
  console.log('\n' + '='.repeat(80));
  console.log('📊 COMPREHENSIVE TEST REPORT');
  console.log('='.repeat(80));

  results.forEach(result => {
    console.log(formatAnalysis(result.scenario, result.analysis, result.concerns, result.response));
  });
}

export function printSummaryStatistics(results: ScenarioTestResult[]): void {
  const successful = results.filter(r => r.success).length;
  const failed = results.length - successful;
  const avgResponseTime = results.reduce((sum, r) => sum + r.analysis.responseTime, 0) / results.length || 0;
  const avgWordCount = results.reduce((sum, r) => sum + r.analysis.wordCount, 0) / results.length || 0;
  const totalExternalLinks = results.reduce((sum, r) => sum + r.analysis.externalLinks.length, 0);

  console.log('\n📈 SUMMARY STATISTICS');
  console.log('='.repeat(40));
  console.log(`Total Tests: ${results.length}`);
  console.log(`Successful: ${successful} (${Math.round((successful / results.length) * 100) || 0}%)`);
  console.log(`Failed: ${failed} (${Math.round((failed / results.length) * 100) || 0}%)`);
  console.log(`Average Response Time: ${Math.round(avgResponseTime)}ms`);
  console.log(`Average Word Count: ${Math.round(avgWordCount)} words`);
  console.log(`Total External Links Found: ${totalExternalLinks}`);
}

export function printKeyFindings(results: ScenarioTestResult[]): void {
  console.log('\n🔍 KEY FINDINGS');
  console.log('='.repeat(40));

  const externalLinkTests = results.filter(r => r.analysis.externalLinks.length > 0);
  if (externalLinkTests.length > 0) {
    console.log(`❌ External Links Found in ${externalLinkTests.length} tests:`);
    externalLinkTests.forEach(test => {
      console.log(`   • ${test.scenario.id}: ${test.analysis.externalLinks.join(', ')}`);
    });
  } else {
    console.log('✅ No external links found in any responses');
  }

  const currencyIssues = results.filter(r => r.analysis.currency.usd > 0 && r.analysis.currency.gbp === 0);
  if (currencyIssues.length > 0) {
    console.log(`❌ USD Currency Issues in ${currencyIssues.length} tests:`);
    currencyIssues.forEach(test => {
      console.log(`   • ${test.scenario.id}: Found ${test.analysis.currency.usd} USD references`);
    });
  } else {
    console.log('✅ No USD currency issues found');
  }

  const verboseResponses = results.filter(r => r.analysis.wordCount > 150);
  if (verboseResponses.length > 0) {
    console.log(`⚠️ Verbose Responses (>150 words) in ${verboseResponses.length} tests:`);
    verboseResponses.forEach(test => {
      console.log(`   • ${test.scenario.id}: ${test.analysis.wordCount} words`);
    });
  } else {
    console.log('✅ All responses are concise (<150 words)');
  }
}
