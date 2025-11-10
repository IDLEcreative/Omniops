/**
 * Report Utilities for MCP Comparison
 *
 * Helper functions for report generation, statistics calculation,
 * and category analysis.
 */

import { ComparisonResult } from './mcp-types';
import { TEST_CASES } from './mcp-scenarios';

/**
 * Helper: Calculate average of numbers
 */
export function average(numbers: number[]): number {
  if (numbers.length === 0) return 0;
  return numbers.reduce((sum, n) => sum + n, 0) / numbers.length;
}

/**
 * Get category summary
 */
export function getCategorySummary(results: ComparisonResult[]): string {
  const categories = new Set(
    TEST_CASES.filter(tc => results.some(r => r.testCaseId === tc.id))
      .map(tc => tc.category)
  );
  return Array.from(categories).join(', ');
}

/**
 * Categorize error message
 */
export function categorizeError(diff: string): string {
  if (diff.includes('success status')) return 'Success status mismatch';
  if (diff.includes('product')) return 'Product result differences';
  if (diff.includes('semantic')) return 'Response quality';
  if (diff.includes('error')) return 'Error handling';
  return 'Other';
}

/**
 * Get most common differences from failed tests
 */
export function getMostCommonDifferences(failedTests: ComparisonResult[]): string {
  const allDiffs = failedTests.flatMap(t => t.functionalEquivalence.differences);
  const diffCounts = new Map<string, number>();

  allDiffs.forEach(diff => {
    const category = categorizeError(diff);
    diffCounts.set(category, (diffCounts.get(category) || 0) + 1);
  });

  const sorted = Array.from(diffCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  return sorted.map(([cat, count]) => `${cat} (${count})`).join(', ');
}

/**
 * Find category-specific issues
 */
export function findCategoryIssues(results: ComparisonResult[]): string[] {
  const issues: string[] = [];

  const categorize = (testId: string) => TEST_CASES.find(tc => tc.id === testId)?.category;

  const categories = new Map<string, ComparisonResult[]>();
  results.forEach(r => {
    const cat = categorize(r.testCaseId);
    if (cat) {
      if (!categories.has(cat)) categories.set(cat, []);
      categories.get(cat)!.push(r);
    }
  });

  categories.forEach((categoryResults, category) => {
    const passRate = categoryResults.filter(r => r.functionalEquivalence.passed).length / categoryResults.length;

    if (passRate < 0.8) {
      issues.push(`- **${category}:** Low pass rate (${(passRate * 100).toFixed(0)}%) - investigate this category`);
    }
  });

  return issues;
}

/**
 * Generate category breakdown
 */
export function generateCategoryBreakdown(results: ComparisonResult[]): string {
  const categories = new Map<string, ComparisonResult[]>();

  TEST_CASES.forEach(tc => {
    const result = results.find(r => r.testCaseId === tc.id);
    if (result) {
      if (!categories.has(tc.category)) {
        categories.set(tc.category, []);
      }
      categories.get(tc.category)!.push(result);
    }
  });

  return Array.from(categories.entries())
    .map(([category, categoryResults]) => {
      const passed = categoryResults.filter(r => r.functionalEquivalence.passed).length;
      const avgTokens = average(categoryResults.map(r => r.tokenUsage.percentReduction));
      const avgSpeed = average(categoryResults.map(r => r.performance.speedImprovement));

      return `### ${category.replace(/_/g, ' ').toUpperCase()}

- **Tests:** ${categoryResults.length}
- **Passed:** ${passed}/${categoryResults.length} (${((passed / categoryResults.length) * 100).toFixed(1)}%)
- **Avg Token Savings:** ${avgTokens.toFixed(1)}%
- **Avg Speed Improvement:** ${avgSpeed.toFixed(1)}%`;
    })
    .join('\n\n');
}

/**
 * Generate key findings
 */
export function generateKeyFindings(results: ComparisonResult[]): string {
  const findings: string[] = [];

  // Functional equivalence trends
  const failedTests = results.filter(r => !r.functionalEquivalence.passed);
  if (failedTests.length === 0) {
    findings.push('✅ All tests passed functional equivalence checks');
  } else {
    findings.push(`⚠️ ${failedTests.length} tests failed functional equivalence`);
    findings.push(`   Most common issues: ${getMostCommonDifferences(failedTests)}`);
  }

  // Token savings trends
  const avgTokenSavings = average(results.map(r => r.tokenUsage.percentReduction));
  if (avgTokenSavings > 60) {
    findings.push(`✅ Excellent token efficiency: ${avgTokenSavings.toFixed(1)}% average reduction`);
  } else if (avgTokenSavings > 40) {
    findings.push(`✓ Good token efficiency: ${avgTokenSavings.toFixed(1)}% average reduction`);
  } else {
    findings.push(`⚠️ Lower token efficiency: ${avgTokenSavings.toFixed(1)}% average reduction`);
  }

  // Speed trends
  const avgSpeed = average(results.map(r => r.performance.speedImprovement));
  if (avgSpeed > 15) {
    findings.push(`✅ MCP system is faster: ${avgSpeed.toFixed(1)}% average improvement`);
  } else if (avgSpeed > 0) {
    findings.push(`✓ MCP system slightly faster: ${avgSpeed.toFixed(1)}% average improvement`);
  } else {
    findings.push(`⚠️ MCP system slower: ${Math.abs(avgSpeed).toFixed(1)}% average slower`);
  }

  return findings.map(f => `- ${f}`).join('\n');
}

/**
 * Generate overall recommendations
 */
export function generateOverallRecommendations(results: ComparisonResult[]): string {
  const recommendations: string[] = [];

  const passRate = results.filter(r => r.functionalEquivalence.passed).length / results.length;

  if (passRate >= 0.95) {
    recommendations.push('✅ **Ready for Production:** Functional equivalence is excellent (>95%)');
  } else if (passRate >= 0.85) {
    recommendations.push('✓ **Nearly Ready:** Functional equivalence is good (>85%), address remaining issues');
  } else {
    recommendations.push('⚠️ **Not Ready:** Functional equivalence needs improvement (<85%)');
  }

  const avgTokenSavings = average(results.map(r => r.tokenUsage.percentReduction));
  if (avgTokenSavings > 50) {
    recommendations.push('✅ **Token Efficiency:** Excellent savings justify MCP overhead');
  } else {
    recommendations.push('⚠️ **Token Efficiency:** Lower than expected, verify progressive disclosure');
  }

  const avgSpeed = average(results.map(r => r.performance.speedImprovement));
  if (avgSpeed > 10) {
    recommendations.push('✅ **Performance:** MCP system shows speed improvements');
  } else if (avgSpeed < -10) {
    recommendations.push('⚠️ **Performance:** MCP slower, investigate execution overhead');
  }

  // Category-specific recommendations
  const categoryIssues = findCategoryIssues(results);
  if (categoryIssues.length > 0) {
    recommendations.push('\n**Category-Specific Issues:**');
    recommendations.push(...categoryIssues);
  }

  return recommendations.map((r, i) => `${i + 1}. ${r}`).join('\n');
}
