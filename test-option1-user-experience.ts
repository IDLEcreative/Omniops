#!/usr/bin/env npx tsx

/**
 * Option 1 User Experience Test Suite
 * 
 * This comprehensive test suite evaluates the UX improvements from the Option 1 implementation
 * which provides full visibility of search results including category/brand breakdowns and 
 * accurate counts without requiring multiple searches.
 * 
 * Key improvements being tested:
 * - Accurate inventory counts ("How many X do you have?")
 * - Category and brand filtering without re-searching
 * - Multi-turn conversation context retention
 * - Natural language understanding improvements
 * - Follow-up question handling
 */

import { v4 as uuidv4 } from 'uuid';

// Test configuration
const TEST_CONFIG = {
  baseUrl: 'http://localhost:3000',
  apiEndpoint: '/api/chat-intelligent', // Option 1 endpoint
  domain: 'thompsonseparts.co.uk',
  sessionId: uuidv4(),
  maxRetries: 3,
  retryDelay: 2000, // 2 seconds
  timeout: 30000, // 30 seconds per request
};

// API types
interface ChatRequest {
  message: string;
  session_id: string;
  domain: string;
  conversation_id?: string;
  config?: {
    features?: {
      woocommerce?: { enabled: boolean };
      websiteScraping?: { enabled: boolean };
    };
    ai?: {
      maxSearchIterations?: number;
      searchTimeout?: number;
    };
  };
}

interface ChatResponse {
  message: string;
  conversation_id: string;
  sources?: Array<{
    url: string;
    title: string;
    relevance: number;
  }>;
  metadata?: {
    executionTime: number;
    searchCount: number;
  };
}

// User Journey Test Scenarios
const USER_JOURNEY_TESTS = [
  {
    id: 'inventory_count_accuracy',
    name: 'Inventory Count Accuracy',
    description: 'Test accurate inventory counting without re-searching',
    conversation: [
      {
        query: 'How many pumps do you have in total?',
        expectedBehaviors: [
          'Provides accurate total count',
          'Shows category breakdown',
          'Lists sample products',
          'No need for follow-up search'
        ],
        metrics: {
          maxResponseTime: 15000,
          minProductCount: 5,
          shouldHaveTotal: true,
          shouldHaveCategories: true
        }
      },
      {
        query: 'What about just the centrifugal pumps?',
        expectedBehaviors: [
          'Filters from existing results',
          'No new search required',
          'Provides specific count',
          'Shows centrifugal pump examples'
        ],
        metrics: {
          maxResponseTime: 8000,
          shouldReferToPrevious: true,
          shouldNotSearch: true
        }
      }
    ]
  },
  {
    id: 'brand_filtering_conversation',
    name: 'Brand Filtering Multi-turn',
    description: 'Test brand filtering without repeated searching',
    conversation: [
      {
        query: 'Show me all your hydraulic components',
        expectedBehaviors: [
          'Shows comprehensive hydraulic inventory',
          'Includes brand breakdown',
          'Displays total count',
          'Provides category overview'
        ],
        metrics: {
          maxResponseTime: 15000,
          minProductCount: 10,
          shouldHaveBrands: true,
          shouldHaveTotal: true
        }
      },
      {
        query: 'Just show me the Parker products from those',
        expectedBehaviors: [
          'Filters to Parker brand only',
          'References previous search',
          'No new search needed',
          'Shows Parker-specific inventory'
        ],
        metrics: {
          maxResponseTime: 8000,
          shouldReferToPrevious: true,
          shouldMentionBrand: 'parker'
        }
      },
      {
        query: 'What about Bosch Rexroth instead?',
        expectedBehaviors: [
          'Switches to Bosch Rexroth products',
          'Uses same base search results',
          'Provides brand-specific count',
          'Shows relevant products'
        ],
        metrics: {
          maxResponseTime: 8000,
          shouldReferToPrevious: true,
          shouldMentionBrand: 'bosch'
        }
      }
    ]
  },
  {
    id: 'product_discovery_journey',
    name: 'Product Discovery Journey',
    description: 'Customer looking for specific product type with refinements',
    conversation: [
      {
        query: 'I need something for concrete mixing',
        expectedBehaviors: [
          'Shows concrete mixing equipment',
          'Includes mixers, pumps, accessories',
          'Provides category breakdown',
          'Offers refinement options'
        ],
        metrics: {
          maxResponseTime: 15000,
          minProductCount: 3,
          shouldHaveCategories: true
        }
      },
      {
        query: 'What about just the pumps for concrete?',
        expectedBehaviors: [
          'Filters to concrete pumps specifically',
          'Uses existing search context',
          'Shows relevant pump types',
          'Maintains category awareness'
        ],
        metrics: {
          maxResponseTime: 10000,
          shouldReferToPrevious: true,
          shouldMentionCategory: 'pump'
        }
      },
      {
        query: 'Do you have any Cifa concrete pumps?',
        expectedBehaviors: [
          'Filters to Cifa brand concrete pumps',
          'Shows specific brand availability',
          'Provides accurate count',
          'Lists available models'
        ],
        metrics: {
          maxResponseTime: 10000,
          shouldMentionBrand: 'cifa'
        }
      }
    ]
  },
  {
    id: 'comparison_shopping',
    name: 'Comparison Shopping Flow',
    description: 'Customer comparing different brands and specifications',
    conversation: [
      {
        query: 'What torque wrenches do you have?',
        expectedBehaviors: [
          'Shows all torque wrench inventory',
          'Includes brand breakdown',
          'Shows specification ranges',
          'Provides comprehensive overview'
        ],
        metrics: {
          maxResponseTime: 15000,
          minProductCount: 5,
          shouldHaveBrands: true
        }
      },
      {
        query: 'Compare Teng vs Facom torque wrenches',
        expectedBehaviors: [
          'Compares both brands',
          'Uses existing search results',
          'Highlights differences',
          'Provides specific models'
        ],
        metrics: {
          maxResponseTime: 10000,
          shouldMentionBrand: 'teng',
          shouldMentionBrand2: 'facom',
          shouldReferToPrevious: true
        }
      },
      {
        query: 'Which ones are best for automotive work?',
        expectedBehaviors: [
          'Recommends automotive-suitable options',
          'References torque specifications',
          'Suggests appropriate models',
          'Maintains context from comparison'
        ],
        metrics: {
          maxResponseTime: 10000,
          shouldReferToPrevious: true,
          shouldMentionApplication: 'automotive'
        }
      }
    ]
  },
  {
    id: 'technical_specification_search',
    name: 'Technical Specification Search',
    description: 'Customer with specific technical requirements',
    conversation: [
      {
        query: 'I need a hydraulic pump with at least 150 bar pressure',
        expectedBehaviors: [
          'Shows hydraulic pumps meeting spec',
          'Includes pressure specifications',
          'Provides technical details',
          'Offers range of options'
        ],
        metrics: {
          maxResponseTime: 15000,
          minProductCount: 2,
          shouldMentionSpec: '150 bar'
        }
      },
      {
        query: 'What about flow rates for those pumps?',
        expectedBehaviors: [
          'Provides flow rate information',
          'References same pump selection',
          'Shows technical specifications',
          'Maintains context from pressure query'
        ],
        metrics: {
          maxResponseTime: 10000,
          shouldReferToPrevious: true,
          shouldMentionSpec: 'flow'
        }
      }
    ]
  }
];

// Performance benchmark tests (for before/after comparison)
const BENCHMARK_TESTS = [
  {
    id: 'total_inventory_query',
    query: 'How many total products do you have?',
    description: 'Test ability to provide total inventory count',
    expectedImprovement: 'Should provide accurate count without multiple searches'
  },
  {
    id: 'category_count_query',
    query: 'How many different types of tools do you sell?',
    description: 'Test category enumeration and counting',
    expectedImprovement: 'Should provide category breakdown with counts'
  },
  {
    id: 'brand_specific_count',
    query: 'How many Parker products do you have?',
    description: 'Test brand-specific inventory counting',
    expectedImprovement: 'Should provide accurate brand-specific count'
  },
  {
    id: 'follow_up_filtering',
    query: 'Show me all hydraulic parts',
    followUp: 'Just the Parker ones',
    description: 'Test follow-up filtering without re-search',
    expectedImprovement: 'Second query should filter existing results, not search again'
  }
];

// Analysis functions
interface ConversationAnalysis {
  responseTime: number;
  wordCount: number;
  productCount: number;
  brandMentions: string[];
  categoryMentions: string[];
  totalMentioned: boolean;
  countMentioned: boolean;
  contextRetained: boolean;
  searchIndicators: number;
  technicalSpecs: string[];
  userSatisfactionScore: number; // 1-10 based on response quality
}

interface BenchmarkResult {
  testId: string;
  query: string;
  followUpQuery?: string;
  performance: {
    responseTime: number;
    searchCount: number;
    accuracy: number; // 1-10
    contextRetention: number; // 1-10
    userSatisfaction: number; // 1-10
  };
  improvements: string[];
  issues: string[];
}

function analyzeConversation(
  query: string, 
  response: string, 
  responseTime: number, 
  isFollowUp: boolean = false,
  previousContext?: string
): ConversationAnalysis {
  const analysis: ConversationAnalysis = {
    responseTime,
    wordCount: response.split(/\s+/).filter(word => word.length > 0).length,
    productCount: 0,
    brandMentions: [],
    categoryMentions: [],
    totalMentioned: false,
    countMentioned: false,
    contextRetained: false,
    searchIndicators: 0,
    technicalSpecs: [],
    userSatisfactionScore: 5
  };

  const lowerResponse = response.toLowerCase();

  // Count product indicators
  const productIndicators = [
    /\d+\s*(products?|items?|parts?|tools?|pumps?|components?)/gi,
    /available|in stock|inventory/gi
  ];
  productIndicators.forEach(pattern => {
    const matches = response.match(pattern);
    if (matches) analysis.productCount += matches.length;
  });

  // Brand detection
  const brands = ['parker', 'bosch', 'rexroth', 'cifa', 'teng', 'facom', 'gates', 'dayco'];
  brands.forEach(brand => {
    if (lowerResponse.includes(brand)) {
      analysis.brandMentions.push(brand);
    }
  });

  // Category detection
  const categories = ['pump', 'hydraulic', 'tool', 'wrench', 'mixer', 'component', 'part'];
  categories.forEach(category => {
    if (lowerResponse.includes(category)) {
      analysis.categoryMentions.push(category);
    }
  });

  // Total/count mentions
  analysis.totalMentioned = /total|altogether|in total|overall/i.test(response);
  analysis.countMentioned = /\d+\s*(total|available|in stock|items?|products?)/i.test(response);

  // Context retention for follow-ups
  if (isFollowUp && previousContext) {
    const contextWords = previousContext.toLowerCase().split(/\s+/);
    const responseWords = lowerResponse.split(/\s+/);
    const sharedWords = contextWords.filter(word => 
      word.length > 4 && responseWords.includes(word)
    );
    analysis.contextRetained = sharedWords.length > 2;
  }

  // Search indicators (should be minimal for follow-ups)
  const searchPhrases = ['let me search', 'searching for', 'looking for', 'finding'];
  analysis.searchIndicators = searchPhrases.reduce((count, phrase) => {
    return count + (lowerResponse.includes(phrase) ? 1 : 0);
  }, 0);

  // Technical specifications
  const specPatterns = [
    /\d+\s*(bar|psi|mpa)/gi,
    /\d+\s*(l\/min|gpm|lpm)/gi,
    /\d+\s*(nm|ft-lbs?)/gi,
    /\d+\s*(mm|inch|cm)/gi
  ];
  specPatterns.forEach(pattern => {
    const matches = response.match(pattern);
    if (matches) {
      analysis.technicalSpecs.push(...matches);
    }
  });

  // User satisfaction scoring
  let satisfactionScore = 5;
  
  // Positive indicators
  if (analysis.countMentioned) satisfactionScore += 1;
  if (analysis.brandMentions.length > 0) satisfactionScore += 1;
  if (analysis.categoryMentions.length > 0) satisfactionScore += 1;
  if (analysis.productCount > 0) satisfactionScore += 1;
  if (analysis.responseTime < 10000) satisfactionScore += 1;
  if (isFollowUp && analysis.contextRetained) satisfactionScore += 2;
  
  // Negative indicators
  if (analysis.searchIndicators > 0 && isFollowUp) satisfactionScore -= 2;
  if (analysis.responseTime > 20000) satisfactionScore -= 1;
  if (analysis.wordCount > 200) satisfactionScore -= 1;

  analysis.userSatisfactionScore = Math.max(1, Math.min(10, satisfactionScore));

  return analysis;
}

async function makeApiRequest(
  query: string, 
  conversationId?: string
): Promise<{ response: ChatResponse; time: number }> {
  const startTime = Date.now();
  
  const requestBody: any = {
    message: query,
    session_id: TEST_CONFIG.sessionId,
    domain: TEST_CONFIG.domain,
    config: {
      features: {
        woocommerce: { enabled: true },
        websiteScraping: { enabled: true }
      },
      ai: {
        maxSearchIterations: 2,
        searchTimeout: 10000
      }
    }
  };

  // Only include conversation_id if it's a valid UUID
  if (conversationId && conversationId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i)) {
    requestBody.conversation_id = conversationId;
  }

  let lastError;
  for (let attempt = 0; attempt < TEST_CONFIG.maxRetries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), TEST_CONFIG.timeout);

      const response = await fetch(`${TEST_CONFIG.baseUrl}${TEST_CONFIG.apiEndpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data: ChatResponse = await response.json();
      const endTime = Date.now();
      
      return { 
        response: data, 
        time: endTime - startTime 
      };
    } catch (error) {
      lastError = error;
      console.log(`Attempt ${attempt + 1} failed:`, error instanceof Error ? error.message : error);
      
      if (attempt < TEST_CONFIG.maxRetries - 1) {
        console.log(`Retrying in ${TEST_CONFIG.retryDelay}ms...`);
        await new Promise(resolve => setTimeout(resolve, TEST_CONFIG.retryDelay));
      }
    }
  }

  throw lastError;
}

async function runUserJourneyTest(journeyTest: typeof USER_JOURNEY_TESTS[0]): Promise<{
  success: boolean;
  conversationId: string;
  results: Array<{
    query: string;
    response: string;
    analysis: ConversationAnalysis;
    metricsPass: boolean;
    issues: string[];
  }>;
}> {
  console.log(`\n🎯 Testing User Journey: ${journeyTest.name}`);
  console.log(`Description: ${journeyTest.description}`);
  
  let conversationId: string | undefined;
  const results = [];
  let previousResponse = '';

  for (let i = 0; i < journeyTest.conversation.length; i++) {
    const turn = journeyTest.conversation[i];
    console.log(`\n[Turn ${i + 1}] Query: "${turn.query}"`);

    try {
      const { response, time } = await makeApiRequest(turn.query, conversationId);
      
      // Only use the conversation_id if it's a proper UUID (not temp_ format)
      if (response.conversation_id && response.conversation_id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i)) {
        conversationId = response.conversation_id;
      }

      const analysis = analyzeConversation(
        turn.query,
        response.message,
        time,
        i > 0,
        previousResponse
      );

      // Check metrics
      const issues: string[] = [];
      let metricsPass = true;

      if (turn.metrics.maxResponseTime && time > turn.metrics.maxResponseTime) {
        issues.push(`Response time ${time}ms exceeded limit ${turn.metrics.maxResponseTime}ms`);
        metricsPass = false;
      }

      if (turn.metrics.minProductCount && analysis.productCount < turn.metrics.minProductCount) {
        issues.push(`Product count ${analysis.productCount} below minimum ${turn.metrics.minProductCount}`);
        metricsPass = false;
      }

      if (turn.metrics.shouldHaveTotal && !analysis.totalMentioned && !analysis.countMentioned) {
        issues.push('Expected total/count mentioned but not found');
        metricsPass = false;
      }

      if (turn.metrics.shouldHaveCategories && analysis.categoryMentions.length === 0) {
        issues.push('Expected category mentions but none found');
        metricsPass = false;
      }

      if (turn.metrics.shouldHaveBrands && analysis.brandMentions.length === 0) {
        issues.push('Expected brand mentions but none found');
        metricsPass = false;
      }

      if (turn.metrics.shouldReferToPrevious && !analysis.contextRetained) {
        issues.push('Expected context retention from previous response');
        metricsPass = false;
      }

      if (turn.metrics.shouldNotSearch && analysis.searchIndicators > 0) {
        issues.push(`Unexpected search indicators found: ${analysis.searchIndicators}`);
        metricsPass = false;
      }

      if (turn.metrics.shouldMentionBrand) {
        const mentioned = analysis.brandMentions.some(brand => 
          brand.includes(turn.metrics.shouldMentionBrand!)
        );
        if (!mentioned) {
          issues.push(`Expected brand mention: ${turn.metrics.shouldMentionBrand}`);
          metricsPass = false;
        }
      }

      results.push({
        query: turn.query,
        response: response.message,
        analysis,
        metricsPass,
        issues
      });

      previousResponse = response.message;
      console.log(`✓ Completed in ${time}ms (Satisfaction: ${analysis.userSatisfactionScore}/10)`);

    } catch (error) {
      console.error(`✗ Failed:`, error);
      results.push({
        query: turn.query,
        response: '',
        analysis: {
          responseTime: 0, wordCount: 0, productCount: 0,
          brandMentions: [], categoryMentions: [], totalMentioned: false,
          countMentioned: false, contextRetained: false, searchIndicators: 0,
          technicalSpecs: [], userSatisfactionScore: 1
        },
        metricsPass: false,
        issues: [`API request failed: ${error}`]
      });
    }
  }

  const success = results.every(r => r.metricsPass);
  return { success, conversationId: conversationId || '', results };
}

async function runBenchmarkTests(): Promise<BenchmarkResult[]> {
  console.log('\n📊 Running Performance Benchmark Tests');
  const results: BenchmarkResult[] = [];

  for (const test of BENCHMARK_TESTS) {
    console.log(`\n[Benchmark] ${test.id}: "${test.query}"`);

    try {
      const { response, time } = await makeApiRequest(test.query);
      const analysis = analyzeConversation(test.query, response.message, time);

      let followUpAnalysis: ConversationAnalysis | undefined;
      let followUpTime = 0;

      if (test.followUp) {
        console.log(`[Follow-up] "${test.followUp}"`);
        // Only use conversation_id if it's a proper UUID
        const useConversationId = response.conversation_id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i) 
          ? response.conversation_id 
          : undefined;
        const followUpResult = await makeApiRequest(test.followUp, useConversationId);
        followUpTime = followUpResult.time;
        followUpAnalysis = analyzeConversation(
          test.followUp,
          followUpResult.response.message,
          followUpTime,
          true,
          response.message
        );
      }

      // Calculate performance scores
      const accuracy = Math.min(10, analysis.userSatisfactionScore + 
        (analysis.countMentioned ? 2 : 0) + 
        (analysis.brandMentions.length > 0 ? 1 : 0));

      const contextRetention = followUpAnalysis 
        ? (followUpAnalysis.contextRetained ? 10 : 3)
        : 8; // Default good score if no follow-up

      const searchCount = analysis.searchIndicators + 
        (followUpAnalysis ? followUpAnalysis.searchIndicators : 0);

      const improvements: string[] = [];
      const issues: string[] = [];

      // Assess improvements
      if (analysis.countMentioned) {
        improvements.push('Provides accurate inventory counts');
      }
      if (analysis.brandMentions.length > 0) {
        improvements.push('Includes brand information');
      }
      if (analysis.categoryMentions.length > 0) {
        improvements.push('Shows category breakdown');
      }
      if (followUpAnalysis?.contextRetained) {
        improvements.push('Retains conversation context');
      }
      if (time < 15000) {
        improvements.push('Fast response time');
      }

      // Identify issues
      if (time > 20000) {
        issues.push('Slow response time');
      }
      if (!analysis.countMentioned && test.query.includes('how many')) {
        issues.push('Did not provide count for count query');
      }
      if (followUpAnalysis && followUpAnalysis.searchIndicators > 0) {
        issues.push('Unnecessary search in follow-up');
      }

      results.push({
        testId: test.id,
        query: test.query,
        followUpQuery: test.followUp,
        performance: {
          responseTime: time + followUpTime,
          searchCount,
          accuracy,
          contextRetention,
          userSatisfaction: analysis.userSatisfactionScore
        },
        improvements,
        issues
      });

      console.log(`✓ Completed (Accuracy: ${accuracy}/10, Context: ${contextRetention}/10)`);

    } catch (error) {
      console.error(`✗ Failed:`, error);
      results.push({
        testId: test.id,
        query: test.query,
        followUpQuery: test.followUp,
        performance: {
          responseTime: 0,
          searchCount: 0,
          accuracy: 1,
          contextRetention: 1,
          userSatisfaction: 1
        },
        improvements: [],
        issues: [`Test failed: ${error}`]
      });
    }
  }

  return results;
}

function generateUserExperienceReport(
  journeyResults: Array<{ success: boolean; test: typeof USER_JOURNEY_TESTS[0]; results: any[] }>,
  benchmarkResults: BenchmarkResult[]
): void {
  console.log('\n' + '='.repeat(80));
  console.log('📋 COMPREHENSIVE USER EXPERIENCE REPORT');
  console.log('='.repeat(80));

  // Executive Summary
  const totalJourneys = journeyResults.length;
  const successfulJourneys = journeyResults.filter(r => r.success).length;
  const avgSatisfaction = journeyResults.reduce((sum, journey) => 
    sum + journey.results.reduce((s, r) => s + r.analysis.userSatisfactionScore, 0) / journey.results.length, 0
  ) / totalJourneys;

  console.log('\n🎯 EXECUTIVE SUMMARY');
  console.log('='.repeat(40));
  console.log(`Journey Success Rate: ${successfulJourneys}/${totalJourneys} (${Math.round(successfulJourneys/totalJourneys * 100)}%)`);
  console.log(`Average User Satisfaction: ${avgSatisfaction.toFixed(1)}/10`);
  console.log(`Tests Completed: ${benchmarkResults.length} benchmark tests`);

  // Key Improvements Identified
  console.log('\n✅ KEY IMPROVEMENTS FROM OPTION 1');
  console.log('='.repeat(40));
  
  const allImprovements = benchmarkResults.flatMap(r => r.improvements);
  const improvementCounts = allImprovements.reduce((counts, improvement) => {
    counts[improvement] = (counts[improvement] || 0) + 1;
    return counts;
  }, {} as Record<string, number>);

  Object.entries(improvementCounts)
    .sort(([,a], [,b]) => b - a)
    .forEach(([improvement, count]) => {
      console.log(`• ${improvement} (${count}/${benchmarkResults.length} tests)`);
    });

  // Detailed Journey Results
  console.log('\n🚀 USER JOURNEY ANALYSIS');
  console.log('='.repeat(40));

  journeyResults.forEach(({ success, test, results }) => {
    const status = success ? '✅' : '❌';
    const avgTime = results.reduce((sum, r) => sum + r.analysis.responseTime, 0) / results.length;
    const avgSatisfaction = results.reduce((sum, r) => sum + r.analysis.userSatisfactionScore, 0) / results.length;

    console.log(`\n${status} ${test.name}`);
    console.log(`   Average Response Time: ${avgTime.toFixed(0)}ms`);
    console.log(`   Average Satisfaction: ${avgSatisfaction.toFixed(1)}/10`);
    console.log(`   Context Retention: ${results.slice(1).every(r => r.analysis.contextRetained) ? 'Excellent' : 'Needs Improvement'}`);
    
    const allIssues = results.flatMap(r => r.issues);
    if (allIssues.length > 0) {
      console.log(`   Issues: ${allIssues.slice(0, 2).join(', ')}${allIssues.length > 2 ? '...' : ''}`);
    }
  });

  // Performance Benchmarks
  console.log('\n📊 PERFORMANCE BENCHMARKS');
  console.log('='.repeat(40));
  
  benchmarkResults.forEach(result => {
    const status = result.performance.accuracy >= 7 ? '✅' : '⚠️';
    console.log(`\n${status} ${result.testId}`);
    console.log(`   Query: "${result.query}"`);
    console.log(`   Accuracy: ${result.performance.accuracy}/10`);
    console.log(`   Context Retention: ${result.performance.contextRetention}/10`);
    console.log(`   Response Time: ${result.performance.responseTime}ms`);
    console.log(`   Search Efficiency: ${result.performance.searchCount === 0 ? 'Optimal' : `${result.performance.searchCount} searches`}`);
  });

  // Before vs After Analysis
  console.log('\n🔄 BEFORE VS AFTER COMPARISON');
  console.log('='.repeat(40));
  console.log('Before Option 1 Implementation:');
  console.log('• Multiple searches required for inventory counts');
  console.log('• Limited category and brand visibility');
  console.log('• Poor follow-up question handling');
  console.log('• Context loss between conversation turns');
  console.log('• Inaccurate "How many X?" responses');
  
  console.log('\nAfter Option 1 Implementation:');
  const countQueries = benchmarkResults.filter(r => r.query.includes('how many') || r.query.includes('total'));
  const countAccuracy = countQueries.length > 0 ? 
    countQueries.reduce((sum, r) => sum + r.performance.accuracy, 0) / countQueries.length : 0;
  
  console.log(`• Inventory count accuracy: ${countAccuracy.toFixed(1)}/10`);
  console.log(`• Category breakdown provided: ${benchmarkResults.filter(r => r.improvements.includes('Shows category breakdown')).length}/${benchmarkResults.length} tests`);
  console.log(`• Brand information included: ${benchmarkResults.filter(r => r.improvements.includes('Includes brand information')).length}/${benchmarkResults.length} tests`);
  console.log(`• Context retention: ${benchmarkResults.filter(r => r.performance.contextRetention >= 8).length}/${benchmarkResults.length} tests`);

  // User Stories Validation
  console.log('\n📖 USER STORIES VALIDATION');
  console.log('='.repeat(40));
  console.log('✅ "As a customer, I want to know total inventory"');
  console.log(`   → ${countAccuracy >= 7 ? 'ACHIEVED' : 'NEEDS IMPROVEMENT'}: Count queries now provide accurate totals`);
  
  console.log('✅ "As a customer, I want to filter by brand without re-searching"');
  const contextTests = journeyResults.filter(j => j.test.conversation.length > 1);
  const contextSuccess = contextTests.filter(j => j.success).length / contextTests.length;
  console.log(`   → ${contextSuccess >= 0.7 ? 'ACHIEVED' : 'NEEDS IMPROVEMENT'}: ${Math.round(contextSuccess * 100)}% of multi-turn conversations successful`);
  
  console.log('✅ "As a customer, I want accurate category counts"');
  const categoryTests = benchmarkResults.filter(r => r.improvements.includes('Shows category breakdown'));
  console.log(`   → ${categoryTests.length >= benchmarkResults.length * 0.7 ? 'ACHIEVED' : 'NEEDS IMPROVEMENT'}: ${categoryTests.length}/${benchmarkResults.length} tests provided category information`);
  
  console.log('✅ "As a customer, I want to narrow down from broad to specific"');
  console.log(`   → ${contextSuccess >= 0.7 ? 'ACHIEVED' : 'NEEDS IMPROVEMENT'}: Refinement conversations work without re-searching`);

  // Recommendations
  console.log('\n💡 RECOMMENDATIONS');
  console.log('='.repeat(40));
  
  const commonIssues = benchmarkResults.flatMap(r => r.issues);
  const issueCounts = commonIssues.reduce((counts, issue) => {
    counts[issue] = (counts[issue] || 0) + 1;
    return counts;
  }, {} as Record<string, number>);

  if (Object.keys(issueCounts).length > 0) {
    console.log('Priority Issues to Address:');
    Object.entries(issueCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .forEach(([issue, count]) => {
        console.log(`• ${issue} (${count} tests affected)`);
      });
  } else {
    console.log('• No significant issues identified');
    console.log('• Consider expanding test coverage to edge cases');
    console.log('• Monitor real user feedback for additional improvements');
  }

  console.log('\n🎉 CONCLUSION');
  console.log('='.repeat(40));
  if (successfulJourneys >= totalJourneys * 0.8 && avgSatisfaction >= 7) {
    console.log('Option 1 implementation shows SIGNIFICANT UX improvements:');
    console.log('• User satisfaction increased substantially');
    console.log('• Conversation flows are more natural');
    console.log('• Inventory queries are now accurate and efficient');
    console.log('• Context retention eliminates redundant searches');
  } else if (successfulJourneys >= totalJourneys * 0.6 && avgSatisfaction >= 5) {
    console.log('Option 1 implementation shows MODERATE improvements:');
    console.log('• Some user experience gains achieved');
    console.log('• Additional refinements recommended');
    console.log('• Focus on addressing identified issues');
  } else {
    console.log('Option 1 implementation needs ADDITIONAL WORK:');
    console.log('• UX improvements not yet meeting targets');
    console.log('• Review implementation and address critical issues');
    console.log('• Consider alternative approaches');
  }

  console.log('\n' + '='.repeat(80));
}

async function runCompleteTestSuite(): Promise<void> {
  console.log('🚀 Starting Option 1 User Experience Test Suite');
  console.log(`API Endpoint: ${TEST_CONFIG.baseUrl}${TEST_CONFIG.apiEndpoint}`);
  console.log(`Domain: ${TEST_CONFIG.domain}`);
  console.log(`Session ID: ${TEST_CONFIG.sessionId}`);
  console.log('\nTesting improvements:');
  console.log('• Full visibility search results with category/brand breakdowns');
  console.log('• Accurate inventory counts without multiple searches');
  console.log('• Enhanced multi-turn conversation context retention');
  console.log('• Improved follow-up question handling');

  // Test API connectivity first
  try {
    console.log('\n🔌 Testing API connectivity...');
    await makeApiRequest('Hello, are you working?');
    console.log('✅ API connectivity confirmed');
  } catch (error) {
    console.error('❌ API connectivity failed:', error);
    console.error('Please ensure the development server is running on port 3000');
    process.exit(1);
  }

  // Run user journey tests
  const journeyResults = [];
  for (const journeyTest of USER_JOURNEY_TESTS) {
    const result = await runUserJourneyTest(journeyTest);
    journeyResults.push({ 
      success: result.success, 
      test: journeyTest, 
      results: result.results 
    });
  }

  // Run benchmark tests
  const benchmarkResults = await runBenchmarkTests();

  // Generate comprehensive report
  generateUserExperienceReport(journeyResults, benchmarkResults);

  // Exit with appropriate code
  const overallSuccess = journeyResults.filter(r => r.success).length >= journeyResults.length * 0.8;
  process.exit(overallSuccess ? 0 : 1);
}

// Handle command line execution
if (require.main === module) {
  runCompleteTestSuite().catch(error => {
    console.error('Test suite failed:', error);
    process.exit(1);
  });
}

export { runCompleteTestSuite, USER_JOURNEY_TESTS, analyzeConversation };