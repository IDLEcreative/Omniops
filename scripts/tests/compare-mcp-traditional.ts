#!/usr/bin/env tsx
/**
 * MCP vs Traditional Tool Calling - Comparison Framework
 *
 * Purpose: Validates functional equivalence and measures performance improvements
 * when switching from traditional tool calling to MCP code execution.
 *
 * Architecture:
 * 1. Test Case Definition - Diverse conversation queries
 * 2. Execution Engine - Runs identical queries through both systems
 * 3. Comparison Logic - Assesses functional equivalence
 * 4. Performance Metrics - Measures speed and token usage
 * 5. Report Generation - Comprehensive analysis output
 *
 * Usage:
 *   npx tsx scripts/tests/compare-mcp-traditional.ts
 *
 * Prerequisites:
 * - Dev server running on port 3000
 * - Both systems enabled via environment flags
 * - Test customer configured in database
 */

import * as fs from 'fs';
import * as path from 'path';

// =====================================================
// SECTION 1: TYPE DEFINITIONS
// =====================================================

export interface ComparisonTestCase {
  id: string;
  description: string;
  userQuery: string;
  expectedBehavior: string;
  category: 'product_search' | 'exact_sku' | 'semantic_search' | 'error_handling' | 'multi_result' | 'edge_case';
  metadata?: Record<string, any>;
}

export interface ExecutionResult {
  system: 'traditional' | 'mcp';
  testCaseId: string;
  success: boolean;
  response: string;
  products?: any[];
  executionTime: number;
  tokensUsed: {
    prompt: number;
    completion: number;
    total: number;
  };
  toolCalls?: any[];
  codeExecuted?: string;
  error?: string;
}

export interface ComparisonResult {
  testCaseId: string;
  description: string;
  userQuery: string;
  functionalEquivalence: {
    passed: boolean;
    differences: string[];
    score: number;
  };
  performance: {
    traditionalTime: number;
    mcpTime: number;
    speedImprovement: number;
  };
  tokenUsage: {
    traditionalTokens: number;
    mcpTokens: number;
    tokensSaved: number;
    percentReduction: number;
  };
  recommendations: string[];
}

// =====================================================
// SECTION 2: TEST CASES
// =====================================================

export const TEST_CASES: ComparisonTestCase[] = [
  // ========== Exact SKU Matches ==========
  {
    id: 'exact_sku_1',
    description: 'Exact SKU match - should use fast path',
    userQuery: 'Do you have part number A4VTG90?',
    expectedBehavior: 'Returns exact product match',
    category: 'exact_sku',
    metadata: { expectedSKU: 'A4VTG90' }
  },
  {
    id: 'exact_sku_2',
    description: 'SKU with spaces',
    userQuery: 'Show me A4VTG 90',
    expectedBehavior: 'Normalizes SKU and finds match',
    category: 'exact_sku',
    metadata: { expectedSKU: 'A4VTG90' }
  },
  {
    id: 'exact_sku_3',
    description: 'SKU in lowercase',
    userQuery: 'do you stock a4vtg90?',
    expectedBehavior: 'Case-insensitive SKU matching',
    category: 'exact_sku',
    metadata: { expectedSKU: 'A4VTG90' }
  },
  {
    id: 'exact_sku_4',
    description: 'SKU with dashes',
    userQuery: 'I need BP-001',
    expectedBehavior: 'Matches SKU with special characters',
    category: 'exact_sku',
    metadata: { expectedSKU: 'BP-001' }
  },

  // ========== Semantic Product Search ==========
  {
    id: 'semantic_1',
    description: 'Generic product search',
    userQuery: 'I need hydraulic pumps',
    expectedBehavior: 'Returns relevant pump products',
    category: 'semantic_search'
  },
  {
    id: 'semantic_2',
    description: 'Feature-based search',
    userQuery: 'Show me high pressure pumps for industrial use',
    expectedBehavior: 'Returns pumps with high pressure ratings',
    category: 'semantic_search'
  },
  {
    id: 'semantic_3',
    description: 'Application-based search',
    userQuery: 'What do you recommend for concrete pumping?',
    expectedBehavior: 'Returns products suitable for concrete',
    category: 'semantic_search'
  },
  {
    id: 'semantic_4',
    description: 'Compatibility query',
    userQuery: 'What products work with ZF5 systems?',
    expectedBehavior: 'Returns compatible products',
    category: 'semantic_search'
  },
  {
    id: 'semantic_5',
    description: 'Technical specification search',
    userQuery: 'I need a pump with 3000 PSI minimum',
    expectedBehavior: 'Returns products meeting spec',
    category: 'semantic_search'
  },

  // ========== Multiple Results ==========
  {
    id: 'multi_result_1',
    description: 'Category browse',
    userQuery: 'Show me all available pumps',
    expectedBehavior: 'Returns paginated pump results',
    category: 'multi_result'
  },
  {
    id: 'multi_result_2',
    description: 'Filtered search',
    userQuery: 'Show me pumps under $500',
    expectedBehavior: 'Returns price-filtered results',
    category: 'multi_result'
  },
  {
    id: 'multi_result_3',
    description: 'Brand-specific search',
    userQuery: 'What Cifa products do you have?',
    expectedBehavior: 'Returns brand-filtered results',
    category: 'multi_result'
  },
  {
    id: 'multi_result_4',
    description: 'Broad category query',
    userQuery: 'Show me parts',
    expectedBehavior: 'Returns general parts listing',
    category: 'multi_result'
  },

  // ========== Edge Cases ==========
  {
    id: 'edge_case_1',
    description: 'Ambiguous query',
    userQuery: 'parts',
    expectedBehavior: 'Asks for clarification or returns top results',
    category: 'edge_case'
  },
  {
    id: 'edge_case_2',
    description: 'Non-existent product',
    userQuery: 'Do you have flying carpets?',
    expectedBehavior: 'Politely indicates product not found',
    category: 'edge_case'
  },
  {
    id: 'edge_case_3',
    description: 'Very long query',
    userQuery: 'I am looking for a high-quality industrial hydraulic pump that can handle at least 3000 PSI with a flow rate of 20 GPM and is compatible with ZF5 transmission systems for use in concrete pumping applications',
    expectedBehavior: 'Extracts key requirements and searches',
    category: 'edge_case'
  },
  {
    id: 'edge_case_4',
    description: 'Special characters in query',
    userQuery: 'Do you have pump with 3/4" NPT connection?',
    expectedBehavior: 'Handles special chars correctly',
    category: 'edge_case'
  },
  {
    id: 'edge_case_5',
    description: 'Multi-word product name',
    userQuery: 'Looking for Rexroth A4VTG variable displacement pump',
    expectedBehavior: 'Matches full product name',
    category: 'edge_case'
  },

  // ========== Error Handling ==========
  {
    id: 'error_handling_1',
    description: 'Misspelled product',
    userQuery: 'Do you have hydrualic pumps?',
    expectedBehavior: 'Tolerates typos and suggests corrections',
    category: 'error_handling'
  },
  {
    id: 'error_handling_2',
    description: 'Mixed language query',
    userQuery: 'Necesito bombas hydraulicas',
    expectedBehavior: 'Handles mixed language gracefully',
    category: 'error_handling'
  },
  {
    id: 'error_handling_3',
    description: 'Stock availability question',
    userQuery: 'Is A4VTG90 in stock?',
    expectedBehavior: 'Searches product and provides info',
    category: 'error_handling'
  },
];

// =====================================================
// SECTION 3: EXECUTION ENGINE
// =====================================================

/**
 * Execute query through traditional tool calling system
 */
export async function executeTraditionalChat(
  testCase: ComparisonTestCase,
  customerId: string,
  domain: string
): Promise<ExecutionResult> {
  const startTime = Date.now();

  try {
    const response = await fetch('http://localhost:3000/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: testCase.userQuery,
        domain,
        session_id: `test-session-traditional-${testCase.id}`,
        config: {
          mcpEnabled: false // Force traditional mode
        }
      })
    });

    const result = await response.json();
    const executionTime = Date.now() - startTime;

    // Extract products from response
    const products = extractProductsFromResponse(result);

    return {
      system: 'traditional',
      testCaseId: testCase.id,
      success: response.ok,
      response: result.message || result.error || '',
      products,
      executionTime,
      tokensUsed: {
        prompt: result.usage?.prompt_tokens || 0,
        completion: result.usage?.completion_tokens || 0,
        total: result.usage?.total_tokens || 0
      },
      toolCalls: result.toolCalls,
      error: response.ok ? undefined : (result.error || 'Unknown error')
    };
  } catch (error) {
    const executionTime = Date.now() - startTime;
    return {
      system: 'traditional',
      testCaseId: testCase.id,
      success: false,
      response: '',
      executionTime,
      tokensUsed: { prompt: 0, completion: 0, total: 0 },
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Execute query through MCP code execution system
 */
export async function executeMCPChat(
  testCase: ComparisonTestCase,
  customerId: string,
  domain: string
): Promise<ExecutionResult> {
  const startTime = Date.now();

  try {
    const response = await fetch('http://localhost:3000/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: testCase.userQuery,
        domain,
        session_id: `test-session-mcp-${testCase.id}`,
        config: {
          mcpEnabled: true // Force MCP mode
        }
      })
    });

    const result = await response.json();
    const executionTime = Date.now() - startTime;

    // Extract products from response
    const products = extractProductsFromResponse(result);

    return {
      system: 'mcp',
      testCaseId: testCase.id,
      success: response.ok,
      response: result.message || result.error || '',
      products,
      executionTime,
      tokensUsed: {
        prompt: result.usage?.prompt_tokens || 0,
        completion: result.usage?.completion_tokens || 0,
        total: result.usage?.total_tokens || 0
      },
      codeExecuted: result.mcpMetadata?.codeExecuted,
      error: response.ok ? undefined : (result.error || 'Unknown error')
    };
  } catch (error) {
    const executionTime = Date.now() - startTime;
    return {
      system: 'mcp',
      testCaseId: testCase.id,
      success: false,
      response: '',
      executionTime,
      tokensUsed: { prompt: 0, completion: 0, total: 0 },
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Extract product information from API response
 */
function extractProductsFromResponse(result: any): any[] | undefined {
  // Check if response has sources (product results)
  if (result.sources && Array.isArray(result.sources)) {
    return result.sources;
  }

  // Check if response has products array
  if (result.products && Array.isArray(result.products)) {
    return result.products;
  }

  // Try to extract from message text (markdown links)
  if (result.message && typeof result.message === 'string') {
    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
    const matches = [...result.message.matchAll(linkRegex)];

    if (matches.length > 0) {
      return matches.map(match => ({
        title: match[1],
        url: match[2]
      }));
    }
  }

  return undefined;
}

// =====================================================
// SECTION 4: COMPARISON LOGIC
// =====================================================

/**
 * Compare results from traditional and MCP systems
 */
export function compareResults(
  traditional: ExecutionResult,
  mcp: ExecutionResult,
  testCase: ComparisonTestCase
): ComparisonResult {
  // Assess functional equivalence
  const equivalence = assessFunctionalEquivalence(traditional, mcp);

  // Calculate performance metrics
  const performance = {
    traditionalTime: traditional.executionTime,
    mcpTime: mcp.executionTime,
    speedImprovement: traditional.executionTime > 0
      ? ((traditional.executionTime - mcp.executionTime) / traditional.executionTime) * 100
      : 0
  };

  // Calculate token usage
  const tokenUsage = {
    traditionalTokens: traditional.tokensUsed.total,
    mcpTokens: mcp.tokensUsed.total,
    tokensSaved: traditional.tokensUsed.total - mcp.tokensUsed.total,
    percentReduction: traditional.tokensUsed.total > 0
      ? ((traditional.tokensUsed.total - mcp.tokensUsed.total) / traditional.tokensUsed.total) * 100
      : 0
  };

  // Generate recommendations
  const recommendations = generateRecommendations(equivalence, performance, tokenUsage);

  return {
    testCaseId: testCase.id,
    description: testCase.description,
    userQuery: testCase.userQuery,
    functionalEquivalence: equivalence,
    performance,
    tokenUsage,
    recommendations
  };
}

/**
 * Assess functional equivalence between two results
 */
function assessFunctionalEquivalence(
  traditional: ExecutionResult,
  mcp: ExecutionResult
): { passed: boolean; differences: string[]; score: number } {
  const differences: string[] = [];
  let score = 100;

  // Compare success status
  if (traditional.success !== mcp.success) {
    differences.push(`Different success status: traditional=${traditional.success}, mcp=${mcp.success}`);
    score -= 50;
  }

  // Compare product results
  if (traditional.products && mcp.products) {
    const productDiff = compareProducts(traditional.products, mcp.products);
    if (productDiff.length > 0) {
      differences.push(...productDiff);
      score -= Math.min(productDiff.length * 10, 30);
    }
  } else if (traditional.products || mcp.products) {
    differences.push('One system returned products, other did not');
    score -= 30;
  }

  // Compare response quality (semantic similarity)
  const semanticSimilarity = calculateSemanticSimilarity(
    traditional.response,
    mcp.response
  );

  if (semanticSimilarity < 0.8) {
    differences.push(`Low semantic similarity: ${semanticSimilarity.toFixed(2)}`);
    score -= (1 - semanticSimilarity) * 20;
  }

  // Compare error handling
  if (traditional.error && mcp.error) {
    // Both systems errored - this is acceptable
    differences.push('Both systems encountered errors (acceptable)');
  } else if (traditional.error || mcp.error) {
    differences.push('Only one system encountered an error');
    score -= 20;
  }

  return {
    passed: score >= 80, // 80% threshold
    differences,
    score: Math.max(0, score)
  };
}

/**
 * Compare product arrays for equivalence
 */
function compareProducts(products1: any[], products2: any[]): string[] {
  const differences: string[] = [];

  // Compare counts
  if (products1.length !== products2.length) {
    differences.push(`Different product counts: traditional=${products1.length}, mcp=${products2.length}`);
  }

  // Compare top results (first 5)
  const compareCount = Math.min(5, Math.min(products1.length, products2.length));

  for (let i = 0; i < compareCount; i++) {
    const p1 = products1[i];
    const p2 = products2[i];

    // Compare titles
    if (p1.title !== p2.title) {
      const similarity = calculateStringSimilarity(p1.title || '', p2.title || '');
      if (similarity < 0.7) {
        differences.push(`Different product at position ${i + 1}: "${p1.title}" vs "${p2.title}"`);
      }
    }
  }

  return differences;
}

/**
 * Calculate semantic similarity between two strings
 * Uses simple word overlap heuristic (can be enhanced with embeddings)
 */
function calculateSemanticSimilarity(text1: string, text2: string): number {
  if (!text1 || !text2) return 0;

  // Normalize texts
  const normalize = (text: string) =>
    text.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 3); // Filter short words

  const words1 = new Set(normalize(text1));
  const words2 = new Set(normalize(text2));

  if (words1.size === 0 || words2.size === 0) return 0;

  // Calculate Jaccard similarity
  const intersection = new Set([...words1].filter(w => words2.has(w)));
  const union = new Set([...words1, ...words2]);

  return intersection.size / union.size;
}

/**
 * Calculate string similarity (Levenshtein distance based)
 */
function calculateStringSimilarity(str1: string, str2: string): number {
  if (!str1 || !str2) return 0;
  if (str1 === str2) return 1;

  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;

  const longerLength = longer.length;
  if (longerLength === 0) return 1;

  const distance = levenshteinDistance(longer, shorter);
  return (longerLength - distance) / longerLength;
}

/**
 * Calculate Levenshtein distance
 */
function levenshteinDistance(str1: string, str2: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[str2.length][str1.length];
}

/**
 * Generate actionable recommendations
 */
function generateRecommendations(
  equivalence: { passed: boolean; differences: string[]; score: number },
  performance: { traditionalTime: number; mcpTime: number; speedImprovement: number },
  tokenUsage: { traditionalTokens: number; mcpTokens: number; tokensSaved: number; percentReduction: number }
): string[] {
  const recommendations: string[] = [];

  // Functional equivalence recommendations
  if (!equivalence.passed) {
    recommendations.push('⚠️ Functional equivalence below threshold - investigate differences');

    if (equivalence.differences.some(d => d.includes('success status'))) {
      recommendations.push('- Review error handling in MCP system');
    }

    if (equivalence.differences.some(d => d.includes('product'))) {
      recommendations.push('- Verify product search logic matches between systems');
    }

    if (equivalence.differences.some(d => d.includes('semantic similarity'))) {
      recommendations.push('- Review response formatting and ensure consistent tone');
    }
  } else {
    recommendations.push('✅ Functional equivalence passed');
  }

  // Performance recommendations
  if (performance.speedImprovement > 20) {
    recommendations.push(`✅ Significant speed improvement: ${performance.speedImprovement.toFixed(1)}%`);
  } else if (performance.speedImprovement < -10) {
    recommendations.push(`⚠️ MCP slower than traditional: ${Math.abs(performance.speedImprovement).toFixed(1)}% slower`);
    recommendations.push('- Investigate code execution overhead');
  }

  // Token usage recommendations
  if (tokenUsage.percentReduction > 50) {
    recommendations.push(`✅ Excellent token savings: ${tokenUsage.percentReduction.toFixed(1)}%`);
  } else if (tokenUsage.percentReduction < 20) {
    recommendations.push(`⚠️ Lower than expected token savings: ${tokenUsage.percentReduction.toFixed(1)}%`);
    recommendations.push('- Verify progressive disclosure is active');
  }

  return recommendations;
}

// =====================================================
// SECTION 5: REPORT GENERATION
// =====================================================

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
 * Helper: Calculate average of numbers
 */
function average(numbers: number[]): number {
  if (numbers.length === 0) return 0;
  return numbers.reduce((sum, n) => sum + n, 0) / numbers.length;
}

/**
 * Get category summary
 */
function getCategorySummary(results: ComparisonResult[]): string {
  const categories = new Set(
    TEST_CASES.filter(tc => results.some(r => r.testCaseId === tc.id))
      .map(tc => tc.category)
  );
  return Array.from(categories).join(', ');
}

/**
 * Generate key findings
 */
function generateKeyFindings(results: ComparisonResult[]): string {
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
 * Get most common differences from failed tests
 */
function getMostCommonDifferences(failedTests: ComparisonResult[]): string {
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
 * Categorize error message
 */
function categorizeError(diff: string): string {
  if (diff.includes('success status')) return 'Success status mismatch';
  if (diff.includes('product')) return 'Product result differences';
  if (diff.includes('semantic')) return 'Response quality';
  if (diff.includes('error')) return 'Error handling';
  return 'Other';
}

/**
 * Generate category breakdown
 */
function generateCategoryBreakdown(results: ComparisonResult[]): string {
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
 * Generate overall recommendations
 */
function generateOverallRecommendations(results: ComparisonResult[]): string {
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

/**
 * Find category-specific issues
 */
function findCategoryIssues(results: ComparisonResult[]): string[] {
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

// =====================================================
// SECTION 6: MAIN EXECUTION FUNCTION
// =====================================================

/**
 * Run complete comparison test suite
 */
export async function compareTraditionalAndMCP(
  customerId: string,
  domain: string,
  testCases: ComparisonTestCase[] = TEST_CASES
): Promise<ComparisonResult[]> {
  console.log(`\n🚀 Starting MCP Comparison Tests`);
  console.log(`📊 Running ${testCases.length} test cases\n`);

  const results: ComparisonResult[] = [];

  for (const testCase of testCases) {
    console.log(`\n▶️  ${testCase.id}: ${testCase.description}`);
    console.log(`   Query: "${testCase.userQuery}"`);

    // Execute traditional
    console.log('   🔹 Running traditional...');
    const traditionalResult = await executeTraditionalChat(testCase, customerId, domain);

    // Wait a bit to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 500));

    // Execute MCP
    console.log('   🔹 Running MCP...');
    const mcpResult = await executeMCPChat(testCase, customerId, domain);

    // Compare results
    const comparison = compareResults(traditionalResult, mcpResult, testCase);

    results.push(comparison);

    // Log immediate result
    const status = comparison.functionalEquivalence.passed ? '✅ PASSED' : '❌ FAILED';
    console.log(`   ${status} (Score: ${comparison.functionalEquivalence.score}/100)`);
    console.log(`   Token savings: ${comparison.tokenUsage.percentReduction.toFixed(1)}%`);
    console.log(`   Speed: ${comparison.performance.speedImprovement.toFixed(1)}%`);

    // Wait between tests to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  return results;
}

// =====================================================
// SECTION 7: CLI INTERFACE
// =====================================================

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

/**
 * Verify server is running
 */
async function verifyServerRunning(): Promise<void> {
  try {
    const response = await fetch('http://localhost:3000/api/health');
    if (!response.ok) {
      throw new Error('Server health check failed');
    }
  } catch (error) {
    console.error('❌ Dev server not responding on http://localhost:3000');
    console.error('   Please start the server with: npm run dev');
    process.exit(1);
  }
}

// Export for use in other modules
export default compareTraditionalAndMCP;
