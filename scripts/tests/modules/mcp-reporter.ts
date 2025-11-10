/**
 * Report Generation for MCP Comparison Tests
 *
 * Generates comprehensive markdown reports with statistics,
 * analysis, and recommendations.
 */

import * as fs from 'fs';
import * as path from 'path';
import { ComparisonResult } from './mcp-types';
import {
  average,
  getCategorySummary,
  generateKeyFindings,
  generateCategoryBreakdown,
  generateOverallRecommendations
} from './mcp-report-utils';

/**
 * Generate comprehensive comparison report
 */
export function generateReport(
  results: ComparisonResult[],
  outputPath?: string
): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const defaultPath = path.join(
    process.cwd(),
    'ARCHIVE',
    'test-results',
    `mcp-comparison-${timestamp}.md`
  );

  const reportPath = outputPath || defaultPath;

  // Calculate summary statistics
  const passed = results.filter(r => r.functionalEquivalence.passed);
  const avgTokenSavings = average(results.map(r => r.tokenUsage.tokensSaved));
  const avgPercentReduction = average(results.map(r => r.tokenUsage.percentReduction));
  const avgSpeedImprovement = average(results.map(r => r.performance.speedImprovement));
  const avgEquivalenceScore = average(results.map(r => r.functionalEquivalence.score));

  // Generate report content
  const report = `# MCP vs Traditional Tool Calling - Comparison Report

**Generated:** ${new Date().toISOString()}
**Total Test Cases:** ${results.length}
**Test Categories:** ${getCategorySummary(results)}

## Executive Summary

- **Functional Equivalence:** ${passed.length}/${results.length} passed (${((passed.length / results.length) * 100).toFixed(1)}%)
- **Average Equivalence Score:** ${avgEquivalenceScore.toFixed(1)}/100
- **Average Token Savings:** ${avgTokenSavings.toFixed(0)} tokens/query (${avgPercentReduction.toFixed(1)}%)
- **Average Speed Improvement:** ${avgSpeedImprovement.toFixed(1)}%

### Key Findings

${generateKeyFindings(results)}

## Detailed Results by Category

${generateCategoryBreakdown(results)}

## Individual Test Results

${results.map(r => formatTestResult(r)).join('\n\n---\n\n')}

## Performance Analysis

### Token Usage Distribution

${generateTokenUsageAnalysis(results)}

### Execution Time Distribution

${generateExecutionTimeAnalysis(results)}

## Recommendations

${generateOverallRecommendations(results)}

## Appendix: Raw Data

\`\`\`json
${JSON.stringify(results, null, 2)}
\`\`\`
  `.trim();

  // Ensure output directory exists
  const outputDir = path.dirname(reportPath);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Write report
  fs.writeFileSync(reportPath, report);
  console.log(`✅ Report generated: ${reportPath}`);

  return reportPath;
}

/**
 * Format individual test result
 */
function formatTestResult(result: ComparisonResult): string {
  const status = result.functionalEquivalence.passed ? '✅ PASSED' : '❌ FAILED';

  return `### ${result.testCaseId}: ${result.description}

**Query:** "${result.userQuery}"

**Status:** ${status} (Score: ${result.functionalEquivalence.score}/100)

**Performance:**
- Traditional: ${result.performance.traditionalTime}ms
- MCP: ${result.performance.mcpTime}ms
- Improvement: ${result.performance.speedImprovement.toFixed(1)}%

**Token Usage:**
- Traditional: ${result.tokenUsage.traditionalTokens} tokens
- MCP: ${result.tokenUsage.mcpTokens} tokens
- Saved: ${result.tokenUsage.tokensSaved} tokens (${result.tokenUsage.percentReduction.toFixed(1)}%)

${result.functionalEquivalence.differences.length > 0 ? `**Differences:**
${result.functionalEquivalence.differences.map(d => `- ${d}`).join('\n')}` : '**No differences detected**'}

**Recommendations:**
${result.recommendations.map(r => `- ${r}`).join('\n')}`;
}

/**
 * Generate token usage analysis
 */
function generateTokenUsageAnalysis(results: ComparisonResult[]): string {
  const tokenReductions = results.map(r => r.tokenUsage.percentReduction).sort((a, b) => b - a);

  return `
- **Best:** ${tokenReductions[0].toFixed(1)}%
- **Worst:** ${tokenReductions[tokenReductions.length - 1].toFixed(1)}%
- **Median:** ${tokenReductions[Math.floor(tokenReductions.length / 2)].toFixed(1)}%
- **Total Tokens Saved:** ${results.reduce((sum, r) => sum + r.tokenUsage.tokensSaved, 0)} tokens
  `.trim();
}

/**
 * Generate execution time analysis
 */
function generateExecutionTimeAnalysis(results: ComparisonResult[]): string {
  const improvements = results.map(r => r.performance.speedImprovement).sort((a, b) => b - a);

  return `
- **Best Improvement:** ${improvements[0].toFixed(1)}%
- **Worst Improvement:** ${improvements[improvements.length - 1].toFixed(1)}%
- **Median:** ${improvements[Math.floor(improvements.length / 2)].toFixed(1)}%
  `.trim();
}

/**
 * Print summary to console
 */
export function printSummary(results: ComparisonResult[]): void {
  const passed = results.filter(r => r.functionalEquivalence.passed);
  const avgTokenSavings = average(results.map(r => r.tokenUsage.percentReduction));
  const avgSpeed = average(results.map(r => r.performance.speedImprovement));

  console.log('\n' + '='.repeat(60));
  console.log('📊 COMPARISON TEST SUMMARY');
  console.log('='.repeat(60));
  console.log(`\n✅ Passed: ${passed.length}/${results.length} (${((passed.length / results.length) * 100).toFixed(1)}%)`);
  console.log(`💾 Avg Token Savings: ${avgTokenSavings.toFixed(1)}%`);
  console.log(`⚡ Avg Speed Improvement: ${avgSpeed.toFixed(1)}%`);

  if (passed.length === results.length) {
    console.log('\n🎉 All tests passed! MCP system is functionally equivalent.');
  } else {
    console.log(`\n⚠️  ${results.length - passed.length} tests failed. Review detailed report.`);
  }

  console.log('\n' + '='.repeat(60) + '\n');
}
