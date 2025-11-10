/**
 * Analysis and Comparison Logic for MCP Tests
 *
 * Compares results from traditional and MCP systems,
 * calculates similarity metrics, and assesses functional equivalence.
 */

import { ComparisonTestCase, ExecutionResult, ComparisonResult } from './mcp-types';

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
export function calculateSemanticSimilarity(text1: string, text2: string): number {
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
  const words1Array = Array.from(words1);
  const words2Array = Array.from(words2);
  const intersection = new Set(words1Array.filter(w => words2.has(w)));
  const union = new Set([...words1Array, ...words2Array]);

  return intersection.size / union.size;
}

/**
 * Calculate string similarity (Levenshtein distance based)
 */
export function calculateStringSimilarity(str1: string, str2: string): number {
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
