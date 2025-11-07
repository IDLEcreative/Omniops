/**
 * Sentiment Analysis Comparison Test
 *
 * Compares keyword-based vs AI-powered sentiment analysis accuracy.
 * Tests on diverse sample messages to validate improvement claims.
 *
 * Usage:
 *   npx tsx scripts/tests/test-sentiment-comparison.ts
 *   npx tsx scripts/tests/test-sentiment-comparison.ts --verbose
 */

import { classifySentimentKeyword } from '@/lib/dashboard/analytics/sentiment';
import { analyzeSentimentWithAI } from '@/lib/analytics/sentiment-ai';
import { getCostStats, resetCostStats } from '@/lib/analytics/cost-tracker';

// Test dataset with manually labeled ground truth
interface TestCase {
  content: string;
  expectedSentiment: -1 | 0 | 1; // -1 = negative, 0 = neutral, 1 = positive
  category: string;
}

const TEST_CASES: TestCase[] = [
  // Positive examples
  {
    content: "Thank you so much! This is exactly what I needed.",
    expectedSentiment: 1,
    category: 'positive-clear',
  },
  {
    content: "Great service, very helpful!",
    expectedSentiment: 1,
    category: 'positive-clear',
  },
  {
    content: "Perfect, works like a charm!",
    expectedSentiment: 1,
    category: 'positive-clear',
  },
  {
    content: "I really appreciate your help with this.",
    expectedSentiment: 1,
    category: 'positive-subtle',
  },
  {
    content: "This resolved my issue completely.",
    expectedSentiment: 1,
    category: 'positive-subtle',
  },

  // Negative examples
  {
    content: "This doesn't work at all, very frustrating.",
    expectedSentiment: -1,
    category: 'negative-clear',
  },
  {
    content: "I'm disappointed with this service.",
    expectedSentiment: -1,
    category: 'negative-clear',
  },
  {
    content: "Not what I expected, quite annoying.",
    expectedSentiment: -1,
    category: 'negative-clear',
  },
  {
    content: "I've been waiting for hours with no response.",
    expectedSentiment: -1,
    category: 'negative-subtle',
  },
  {
    content: "This is not meeting my needs.",
    expectedSentiment: -1,
    category: 'negative-subtle',
  },

  // Neutral examples
  {
    content: "What are your opening hours?",
    expectedSentiment: 0,
    category: 'neutral-question',
  },
  {
    content: "Do you have this product in stock?",
    expectedSentiment: 0,
    category: 'neutral-question',
  },
  {
    content: "I need information about your return policy.",
    expectedSentiment: 0,
    category: 'neutral-request',
  },
  {
    content: "How do I track my order?",
    expectedSentiment: 0,
    category: 'neutral-question',
  },
  {
    content: "I would like to change my shipping address.",
    expectedSentiment: 0,
    category: 'neutral-request',
  },

  // Edge cases - mixed sentiment
  {
    content: "The product is good but delivery was slow.",
    expectedSentiment: 0, // Mixed = neutral
    category: 'mixed-sentiment',
  },
  {
    content: "I like the features but it's expensive.",
    expectedSentiment: 0, // Mixed = neutral
    category: 'mixed-sentiment',
  },

  // Edge cases - sarcasm/subtle
  {
    content: "Well, that was helpful... not!",
    expectedSentiment: -1,
    category: 'sarcasm',
  },
  {
    content: "Sure, I'll just wait forever then.",
    expectedSentiment: -1,
    category: 'sarcasm',
  },

  // Edge cases - polite complaints
  {
    content: "I'm sorry but this isn't quite right.",
    expectedSentiment: -1,
    category: 'polite-negative',
  },
  {
    content: "I hate to complain, but there's an issue.",
    expectedSentiment: -1,
    category: 'polite-negative',
  },
];

interface ComparisonResult {
  keywordAccuracy: number;
  aiAccuracy: number;
  improvement: number;
  keywordCorrect: number;
  aiCorrect: number;
  totalTests: number;
  categoryBreakdown: Record<string, { keyword: number; ai: number; total: number }>;
  examples: Array<{
    content: string;
    expected: number;
    keyword: number;
    ai: number;
    keywordCorrect: boolean;
    aiCorrect: boolean;
  }>;
}

async function runComparison(verbose: boolean = false): Promise<ComparisonResult> {
  console.log('=== Sentiment Analysis Comparison Test ===\n');
  console.log(`Testing ${TEST_CASES.length} sample messages...\n`);

  resetCostStats(); // Reset cost tracking for accurate measurement

  let keywordCorrect = 0;
  let aiCorrect = 0;
  const categoryBreakdown: Record<string, { keyword: number; ai: number; total: number }> = {};
  const examples: ComparisonResult['examples'] = [];

  for (const testCase of TEST_CASES) {
    // Test keyword-based
    const keywordResult = classifySentimentKeyword(testCase.content);

    // Test AI-based
    const aiResult = await analyzeSentimentWithAI(testCase.content);
    const aiScore = aiResult ? aiResult.score : 0; // Default to neutral on failure

    // Check correctness
    const keywordMatch = keywordResult === testCase.expectedSentiment;
    const aiMatch = aiScore === testCase.expectedSentiment;

    if (keywordMatch) keywordCorrect++;
    if (aiMatch) aiCorrect++;

    // Track by category
    if (!categoryBreakdown[testCase.category]) {
      categoryBreakdown[testCase.category] = { keyword: 0, ai: 0, total: 0 };
    }
    categoryBreakdown[testCase.category].total++;
    if (keywordMatch) categoryBreakdown[testCase.category].keyword++;
    if (aiMatch) categoryBreakdown[testCase.category].ai++;

    examples.push({
      content: testCase.content,
      expected: testCase.expectedSentiment,
      keyword: keywordResult,
      ai: aiScore,
      keywordCorrect: keywordMatch,
      aiCorrect: aiMatch,
    });

    if (verbose) {
      const status = aiMatch && keywordMatch ? '✓✓' : aiMatch ? '✓✗' : keywordMatch ? '✗✓' : '✗✗';
      console.log(`${status} "${testCase.content.slice(0, 50)}..."`);
      console.log(`   Expected: ${testCase.expectedSentiment}, Keyword: ${keywordResult}, AI: ${aiScore}\n`);
    }

    // Small delay to avoid rate limits
    await new Promise(resolve => setTimeout(resolve, 50));
  }

  const keywordAccuracy = (keywordCorrect / TEST_CASES.length) * 100;
  const aiAccuracy = (aiCorrect / TEST_CASES.length) * 100;
  const improvement = aiAccuracy - keywordAccuracy;

  return {
    keywordAccuracy,
    aiAccuracy,
    improvement,
    keywordCorrect,
    aiCorrect,
    totalTests: TEST_CASES.length,
    categoryBreakdown,
    examples,
  };
}

function printResults(result: ComparisonResult): void {
  console.log('\n=== RESULTS ===\n');
  console.log(`Total Tests: ${result.totalTests}`);
  console.log(`\nKeyword-Based Sentiment:`);
  console.log(`  Correct: ${result.keywordCorrect}/${result.totalTests}`);
  console.log(`  Accuracy: ${result.keywordAccuracy.toFixed(1)}%`);
  console.log(`\nAI-Based Sentiment:`);
  console.log(`  Correct: ${result.aiCorrect}/${result.totalTests}`);
  console.log(`  Accuracy: ${result.aiAccuracy.toFixed(1)}%`);
  console.log(`\nImprovement: ${result.improvement > 0 ? '+' : ''}${result.improvement.toFixed(1)}%`);

  console.log('\n=== ACCURACY BY CATEGORY ===\n');
  for (const [category, stats] of Object.entries(result.categoryBreakdown)) {
    const keywordPct = ((stats.keyword / stats.total) * 100).toFixed(1);
    const aiPct = ((stats.ai / stats.total) * 100).toFixed(1);
    console.log(`${category}:`);
    console.log(`  Keyword: ${stats.keyword}/${stats.total} (${keywordPct}%)`);
    console.log(`  AI: ${stats.ai}/${stats.total} (${aiPct}%)`);
  }

  // Show cost stats
  const costStats = getCostStats();
  console.log('\n=== COST ANALYSIS ===\n');
  console.log(`API Calls: ${costStats.totalCalls}`);
  console.log(`Cost: $${costStats.estimatedMonthlyCost.toFixed(4)}`);
  console.log(`Cost per message: $${(costStats.estimatedMonthlyCost / result.totalTests).toFixed(6)}`);

  // Estimate monthly costs
  const messagesPerMonth = [1000, 5000, 10000, 30000, 50000];
  console.log('\n=== ESTIMATED MONTHLY COSTS ===\n');
  for (const msgCount of messagesPerMonth) {
    const cost = (msgCount * costStats.estimatedMonthlyCost) / result.totalTests;
    console.log(`  ${msgCount.toLocaleString()} messages/month: $${cost.toFixed(2)}`);
  }

  // Show examples where AI outperformed
  const aiWins = result.examples.filter(e => e.aiCorrect && !e.keywordCorrect);
  if (aiWins.length > 0) {
    console.log('\n=== EXAMPLES WHERE AI OUTPERFORMED ===\n');
    aiWins.slice(0, 5).forEach(ex => {
      console.log(`"${ex.content}"`);
      console.log(`  Expected: ${ex.expected}, Keyword: ${ex.keyword}, AI: ${ex.ai}`);
    });
  }

  // Final recommendation
  console.log('\n=== RECOMMENDATION ===\n');
  if (result.improvement >= 15) {
    console.log('✅ AI sentiment analysis shows significant improvement.');
    console.log('   Consider enabling ENABLE_AI_SENTIMENT=true for production.');
  } else if (result.improvement >= 5) {
    console.log('⚠️  AI sentiment shows moderate improvement.');
    console.log('   Enable based on budget and accuracy requirements.');
  } else {
    console.log('ℹ️  Keyword-based sentiment is sufficient for current use case.');
    console.log('   AI sentiment may not justify the additional cost.');
  }

  console.log('\n==========================================\n');
}

// Main execution
async function main() {
  const verbose = process.argv.includes('--verbose');

  try {
    const result = await runComparison(verbose);
    printResults(result);

    // Exit with success if AI shows improvement
    process.exit(result.improvement >= 5 ? 0 : 1);
  } catch (error) {
    console.error('Error running comparison:', error);
    process.exit(1);
  }
}

main();
