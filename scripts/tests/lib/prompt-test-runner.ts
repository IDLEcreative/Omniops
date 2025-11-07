/**
 * Test runner for chat prompt decision tree validation
 */

import fs from 'fs';
import path from 'path';
import { log, type TestResult } from './test-utils';
import type { PromptTestCase } from './prompt-test-cases';

interface PromptAnalysis {
  hasDecisionTree: boolean;
  hasCriticalRule: boolean;
  hasReformulation: boolean;
  hasAntiHallucination: boolean;
  searchTriggers: string[];
}

export function analyzePromptFile(): PromptAnalysis {
  const promptPath = path.join(process.cwd(), 'lib/chat/system-prompts/base-prompt.ts');

  if (!fs.existsSync(promptPath)) {
    throw new Error(`Prompt file not found: ${promptPath}`);
  }

  const content = fs.readFileSync(promptPath, 'utf-8');

  return {
    hasDecisionTree: content.includes('DECISION TREE') && content.includes('ALWAYS SEARCH if'),
    hasCriticalRule: content.includes('DEFAULT TO SEARCHING'),
    hasReformulation: content.includes('QUERY REFORMULATION'),
    hasAntiHallucination: content.includes('SEARCH FIRST to get data'),
    searchTriggers: [
      'Product names',
      'Categories',
      'Comparisons',
      'Availability',
      'Pricing',
      'Action phrases',
      'Single-word queries',
      'Negative questions',
      'Implied product queries'
    ]
  };
}

export function checkQueryMatchesTriggers(query: string, shouldTrigger: boolean): boolean {
  const lowerQuery = query.toLowerCase();

  const productIndicators = [
    'model', 'sku', 'part', 'product', 'hyva',
    'pump', 'equipment', 'parts', 'gloves', 'tools',
    'components'
  ];

  const comparisonIndicators = [
    'which is better', 'what\'s the difference', 'compare', 'vs', 'versus'
  ];

  const availabilityIndicators = [
    'do you have', 'is this in stock', 'do you sell', 'can i get', 'available'
  ];

  const pricingIndicators = [
    'how much', 'cost', 'price', 'what does', 'how expensive'
  ];

  const actionIndicators = [
    'show me', 'i need', 'looking for', 'find', 'want to buy', 'interested in'
  ];

  const vagueIndicators = [
    'tell me more', 'what about', 'that one', 'item', 'maybe'
  ];

  const negativeIndicators = [
    'don\'t you', 'you don\'t', 'do you not'
  ];

  const matchesProduct = productIndicators.some(ind => lowerQuery.includes(ind));
  const matchesComparison = comparisonIndicators.some(ind => lowerQuery.includes(ind));
  const matchesAvailability = availabilityIndicators.some(ind => lowerQuery.includes(ind));
  const matchesPricing = pricingIndicators.some(ind => lowerQuery.includes(ind));
  const matchesAction = actionIndicators.some(ind => lowerQuery.includes(ind));
  const matchesVague = vagueIndicators.some(ind => lowerQuery.includes(ind));
  const matchesNegative = negativeIndicators.some(ind => lowerQuery.includes(ind));

  const shouldTriggerSearch = matchesProduct || matchesComparison || matchesAvailability ||
                              matchesPricing || matchesAction || matchesVague || matchesNegative;

  return shouldTriggerSearch === shouldTrigger;
}

export function runPromptTests(testCases: PromptTestCase[]): { testCase: PromptTestCase; passed: boolean }[] {
  const results: { testCase: PromptTestCase; passed: boolean }[] = [];

  testCases.forEach(testCase => {
    const matches = checkQueryMatchesTriggers(testCase.userQuery, testCase.shouldTriggerSearch);

    results.push({ testCase, passed: matches });

    const status = matches ? '✅' : '❌';
    const color = matches ? 'green' : 'red';

    console.log(`\n  ${status} [${testCase.category}] "${testCase.userQuery}"`);
    log('blue', `     Reasoning: ${testCase.reasoning}`);
    log(color, `     Expected: ${testCase.shouldTriggerSearch ? 'SEARCH' : 'NO SEARCH'} | Result: ${matches ? 'PASS' : 'FAIL'}`);
  });

  return results;
}

export function printCategoryBreakdown(testCases: PromptTestCase[], results: { testCase: PromptTestCase; passed: boolean }[]): void {
  const categories = [...new Set(testCases.map(tc => tc.category))];

  categories.forEach(category => {
    const categoryTests = testCases.filter(tc => tc.category === category);
    const categoryResults = results.filter(r => r.testCase.category === category);
    const passed = categoryResults.filter(r => r.passed).length;
    const total = categoryTests.length;
    const passRate = ((passed / total) * 100).toFixed(0);

    const color = passed === total ? 'green' : passed >= total * 0.7 ? 'yellow' : 'red';

    log(color, `${category}: ${passed}/${total} tests passed (${passRate}%)`);
  });
}
