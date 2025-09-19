#!/usr/bin/env tsx

/**
 * Comprehensive Test Suite for Agentic Search Capabilities
 * 
 * This test evaluates whether the chat system exhibits true agentic search behavior
 * versus simple tool-calling patterns. A truly agentic system should demonstrate:
 * 
 * 1. Autonomous Strategy Selection - Different approaches for different queries
 * 2. Iterative Refinement - Re-searching with better queries when results are poor
 * 3. Result Quality Awareness - Knowing when results don't answer the question
 * 4. Multi-turn Context - Remembering previous searches in conversations
 * 5. Dynamic Iteration Control - Stopping early when confident or continuing when uncertain
 */

import { v4 as uuidv4 } from 'uuid';

// Test configuration
const CONFIG = {
  // Use localhost for development testing
  baseUrl: process.env.TEST_BASE_URL || 'http://localhost:3000',
  apiEndpoint: '/api/chat-intelligent',
  testDomain: 'thompsonseparts.co.uk', // Default domain from the system
  timeoutMs: 30000,
  verbose: process.env.VERBOSE === 'true'
};

interface ChatRequest {
  message: string;
  conversation_id?: string;
  session_id: string;
  domain?: string;
  config?: {
    ai?: {
      maxSearchIterations?: number;
      searchTimeout?: number;
    };
    features?: {
      websiteScraping?: { enabled: boolean };
      woocommerce?: { enabled: boolean };
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
    executionTime?: number;
    searchCount?: number;
    [key: string]: any;
  };
}

interface TestResult {
  testName: string;
  passed: boolean;
  score: number; // 0-100
  details: string;
  evidence?: any;
  agenticBehaviors: string[];
  simpleToolCallIndicators: string[];
}

interface AgenticCapabilityScore {
  capability: string;
  description: string;
  maxScore: number;
  actualScore: number;
  evidence: string[];
  recommendations: string[];
}

class AgenticSearchTester {
  private results: TestResult[] = [];
  private conversationStates: Map<string, any> = new Map();

  constructor() {
    console.log('🔬 Agentic Search Capabilities Test Suite');
    console.log('='.repeat(50));
    console.log(`Base URL: ${CONFIG.baseUrl}`);
    console.log(`Test Domain: ${CONFIG.testDomain}`);
    console.log('');
  }

  private async makeRequest(request: ChatRequest): Promise<{
    response: ChatResponse;
    rawResponse: any;
    responseTime: number;
    error?: Error;
  }> {
    const startTime = Date.now();
    
    try {
      const response = await fetch(`${CONFIG.baseUrl}${CONFIG.apiEndpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'AgenticSearchTester/1.0'
        },
        body: JSON.stringify({
          ...request,
          domain: request.domain || CONFIG.testDomain,
          config: {
            ai: {
              maxSearchIterations: 3, // Allow more iterations to test agentic behavior
              searchTimeout: 10000,
            },
            features: {
              websiteScraping: { enabled: true },
              woocommerce: { enabled: true }
            },
            ...request.config
          }
        }),
        timeout: CONFIG.timeoutMs
      });

      const responseTime = Date.now() - startTime;
      const rawResponse = await response.json();

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${rawResponse.error || 'Unknown error'}`);
      }

      if (CONFIG.verbose) {
        console.log(`📤 Request: ${request.message.substring(0, 50)}...`);
        console.log(`📥 Response (${responseTime}ms): ${rawResponse.message?.substring(0, 100)}...`);
      }

      return {
        response: rawResponse as ChatResponse,
        rawResponse,
        responseTime,
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;
      return {
        response: { message: '', conversation_id: '' } as ChatResponse,
        rawResponse: null,
        responseTime,
        error: error as Error
      };
    }
  }

  private analyzeResponseForAgenticBehaviors(
    query: string,
    response: ChatResponse,
    rawResponse: any,
    responseTime: number
  ): {
    agenticBehaviors: string[];
    simpleToolCallIndicators: string[];
    qualityScore: number;
  } {
    const agenticBehaviors: string[] = [];
    const simpleToolCallIndicators: string[] = [];
    let qualityScore = 0;

    // Check metadata for iteration evidence
    const metadata = response.metadata || {};
    const searchCount = metadata.searchCount || 0;
    const executionTime = metadata.executionTime || responseTime;

    // 1. Multiple search iterations (agentic refinement)
    if (searchCount > 1) {
      agenticBehaviors.push(`Multiple searches performed (${searchCount})`);
      qualityScore += 20;
    } else if (searchCount === 1) {
      simpleToolCallIndicators.push('Single search execution - no refinement');
    }

    // 2. Adaptive execution time (suggests thinking/processing)
    if (executionTime > 15000) {
      agenticBehaviors.push('Extended processing time suggesting iterative refinement');
      qualityScore += 15;
    } else if (executionTime < 3000) {
      simpleToolCallIndicators.push('Very fast response - likely cached or single operation');
    }

    // 3. Response quality and awareness
    const responseText = response.message.toLowerCase();
    
    // Check for uncertainty expressions (agentic awareness)
    const uncertaintyPhrases = [
      'i couldn\'t find', 'no results', 'not available', 'let me search',
      'i\'ll try', 'let me look', 'searching for', 'i searched'
    ];
    
    if (uncertaintyPhrases.some(phrase => responseText.includes(phrase))) {
      agenticBehaviors.push('Demonstrates search awareness and uncertainty handling');
      qualityScore += 25;
    }

    // Check for over-confident responses (anti-agentic)
    const overConfidentPhrases = [
      'i know that', 'definitely', 'certainly', 'always', 'never'
    ];
    
    if (overConfidentPhrases.some(phrase => responseText.includes(phrase))) {
      simpleToolCallIndicators.push('Over-confident language without search verification');
    }

    // 4. Source utilization and reasoning
    const sources = response.sources || [];
    if (sources.length > 0) {
      qualityScore += 20;
      
      // Check if sources are diverse (suggests comprehensive search)
      const uniqueDomains = new Set(sources.map(s => new URL(s.url).hostname));
      if (uniqueDomains.size > 1) {
        agenticBehaviors.push('Diverse source utilization');
        qualityScore += 10;
      }

      // Check relevance scores
      const avgRelevance = sources.reduce((sum, s) => sum + s.relevance, 0) / sources.length;
      if (avgRelevance > 0.8) {
        agenticBehaviors.push('High-quality source matching');
        qualityScore += 10;
      } else if (avgRelevance < 0.3) {
        simpleToolCallIndicators.push('Low relevance sources - poor quality filtering');
      }
    }

    // 5. Response structure and reasoning
    const responseLength = response.message.length;
    if (responseLength > 500 && responseLength < 2000) {
      agenticBehaviors.push('Balanced response length showing comprehensive analysis');
      qualityScore += 10;
    } else if (responseLength < 100) {
      simpleToolCallIndicators.push('Very brief response - minimal reasoning');
    }

    return {
      agenticBehaviors,
      simpleToolCallIndicators,
      qualityScore: Math.min(qualityScore, 100)
    };
  }

  // Test 1: Autonomous Strategy Selection
  async testAutonomousStrategySelection(): Promise<TestResult> {
    console.log('🎯 Testing Autonomous Strategy Selection...');
    
    const testQueries = [
      { query: 'Show me all brake products', expectedStrategy: 'product_search' },
      { query: 'What is your return policy?', expectedStrategy: 'information_search' },
      { query: 'How do I install brake pads on a Honda Civic?', expectedStrategy: 'mixed_search' },
      { query: 'Compare brake fluid types', expectedStrategy: 'comparative_search' }
    ];

    const sessionId = uuidv4();
    const results = [];

    for (const test of testQueries) {
      const { response, responseTime } = await this.makeRequest({
        message: test.query,
        session_id: sessionId
      });

      const analysis = this.analyzeResponseForAgenticBehaviors(test.query, response, null, responseTime);
      results.push({ ...test, response, analysis, responseTime });
    }

    // Analyze if different strategies were used
    const strategies = results.map(r => ({
      query: r.query,
      searchCount: r.response.metadata?.searchCount || 0,
      sourceCount: r.response.sources?.length || 0,
      responseTime: r.responseTime,
      hasProducts: r.response.message.toLowerCase().includes('product') || r.response.message.toLowerCase().includes('£'),
      hasInstructions: r.response.message.toLowerCase().includes('install') || r.response.message.toLowerCase().includes('step'),
    }));

    let strategyVariance = 0;
    let agenticBehaviors: string[] = [];
    let simpleToolCallIndicators: string[] = [];

    // Check for variance in approach
    const searchCounts = strategies.map(s => s.searchCount);
    const sourceCounts = strategies.map(s => s.sourceCount);
    const responseTimes = strategies.map(s => s.responseTime);

    if (new Set(searchCounts).size > 1) {
      agenticBehaviors.push('Different search iteration counts for different query types');
      strategyVariance += 25;
    }

    if (new Set(sourceCounts).size > 2) {
      agenticBehaviors.push('Adaptive source utilization based on query type');
      strategyVariance += 25;
    }

    // Check for appropriate responses
    const productQuery = strategies[0]; // brake products
    const policyQuery = strategies[1]; // return policy
    
    if (productQuery.hasProducts && !policyQuery.hasProducts) {
      agenticBehaviors.push('Appropriate content type matching for different queries');
      strategyVariance += 25;
    }

    if (Math.max(...responseTimes) - Math.min(...responseTimes) > 5000) {
      agenticBehaviors.push('Variable processing time suggests adaptive complexity');
      strategyVariance += 25;
    } else {
      simpleToolCallIndicators.push('Uniform response times suggest fixed processing approach');
    }

    const passed = strategyVariance >= 50;
    const details = `Strategy variance: ${strategyVariance}%. Tested ${testQueries.length} different query types.`;

    return {
      testName: 'Autonomous Strategy Selection',
      passed,
      score: strategyVariance,
      details,
      evidence: { strategies, results: results.map(r => ({ query: r.query, response: r.response.message.substring(0, 100) })) },
      agenticBehaviors,
      simpleToolCallIndicators
    };
  }

  // Test 2: Iterative Refinement Capability
  async testIterativeRefinement(): Promise<TestResult> {
    console.log('🔄 Testing Iterative Refinement Capability...');
    
    // Use intentionally ambiguous/challenging queries that should trigger refinement
    const challengingQueries = [
      'Find products for a 2010 vehicle', // Ambiguous - should ask for clarification or try multiple searches
      'Show me the best brakes', // Subjective - should search multiple categories
      'I need parts for maintenance', // Vague - should refine search
    ];

    const sessionId = uuidv4();
    const refinementScores = [];

    for (const query of challengingQueries) {
      const { response, rawResponse, responseTime } = await this.makeRequest({
        message: query,
        session_id: sessionId,
        config: {
          ai: {
            maxSearchIterations: 5, // Allow more iterations
            searchTimeout: 15000,
          }
        }
      });

      const analysis = this.analyzeResponseForAgenticBehaviors(query, response, rawResponse, responseTime);
      
      let refinementScore = 0;
      let evidence = [];

      // Check for multiple search iterations
      const searchCount = response.metadata?.searchCount || 0;
      if (searchCount > 2) {
        refinementScore += 40;
        evidence.push(`Multiple searches: ${searchCount}`);
      }

      // Check for clarifying questions or refinement language
      const responseText = response.message.toLowerCase();
      const refinementPhrases = [
        'could you be more specific', 'what type of', 'which model', 'let me search',
        'i found several', 'here are some options', 'could you clarify'
      ];

      if (refinementPhrases.some(phrase => responseText.includes(phrase))) {
        refinementScore += 30;
        evidence.push('Uses clarifying language');
      }

      // Check for progressive improvement in sources
      const sources = response.sources || [];
      if (sources.length > 3) {
        refinementScore += 20;
        evidence.push(`Comprehensive source gathering: ${sources.length}`);
      }

      // Check for execution time indicating iteration
      if (responseTime > 10000) {
        refinementScore += 10;
        evidence.push(`Extended processing time: ${responseTime}ms`);
      }

      refinementScores.push({
        query,
        score: refinementScore,
        evidence,
        analysis,
        response: response.message.substring(0, 200)
      });
    }

    const avgRefinementScore = refinementScores.reduce((sum, r) => sum + r.score, 0) / refinementScores.length;
    const passed = avgRefinementScore >= 60;

    const allAgenticBehaviors = refinementScores.flatMap(r => r.analysis.agenticBehaviors);
    const allSimpleIndicators = refinementScores.flatMap(r => r.analysis.simpleToolCallIndicators);

    return {
      testName: 'Iterative Refinement',
      passed,
      score: Math.round(avgRefinementScore),
      details: `Average refinement score: ${Math.round(avgRefinementScore)}%. ${refinementScores.filter(r => r.score >= 60).length}/${challengingQueries.length} queries showed good refinement.`,
      evidence: refinementScores,
      agenticBehaviors: [...new Set(allAgenticBehaviors)],
      simpleToolCallIndicators: [...new Set(allSimpleIndicators)]
    };
  }

  // Test 3: Result Quality Awareness
  async testResultQualityAwareness(): Promise<TestResult> {
    console.log('🎯 Testing Result Quality Awareness...');
    
    const qualityTestCases = [
      {
        query: 'Find products for a 1995 Trabant', // Likely to have no results
        expectsLowResults: true,
        description: 'Obscure vehicle test'
      },
      {
        query: 'Show me brake pads', // Should have good results
        expectsLowResults: false,
        description: 'Common product test'
      },
      {
        query: 'What is the quantum mechanics of brake fluid?', // Nonsensical query
        expectsLowResults: true,
        description: 'Nonsensical query test'
      }
    ];

    const sessionId = uuidv4();
    const qualityResults = [];

    for (const testCase of qualityTestCases) {
      const { response, responseTime } = await this.makeRequest({
        message: testCase.query,
        session_id: sessionId
      });

      const responseText = response.message.toLowerCase();
      const sources = response.sources || [];
      
      let qualityAwarenessScore = 0;
      let evidence = [];

      // Check if system acknowledges when it can't find good results
      if (testCase.expectsLowResults) {
        const acknowledgesLimitation = [
          'couldn\'t find', 'no results', 'not available', 'unable to locate',
          'no information', 'not in stock', 'don\'t have', 'not found'
        ].some(phrase => responseText.includes(phrase));

        if (acknowledgesLimitation) {
          qualityAwarenessScore += 50;
          evidence.push('Acknowledges search limitations');
        } else {
          evidence.push('Does not acknowledge poor results - may be hallucinating');
        }

        // Check if it provides alternatives or suggestions
        const offersAlternatives = [
          'you might', 'try searching', 'consider', 'similar products',
          'alternative', 'instead', 'other options'
        ].some(phrase => responseText.includes(phrase));

        if (offersAlternatives) {
          qualityAwarenessScore += 30;
          evidence.push('Offers alternatives when results are poor');
        }
      } else {
        // For queries that should have good results
        if (sources.length > 0) {
          qualityAwarenessScore += 40;
          evidence.push(`Found ${sources.length} relevant sources`);
        }

        // Check for confidence in good results
        const showsConfidence = responseText.length > 100 && sources.length > 0;
        if (showsConfidence) {
          qualityAwarenessScore += 20;
          evidence.push('Shows appropriate confidence with good results');
        }
      }

      // Check source quality assessment
      if (sources.length > 0) {
        const avgRelevance = sources.reduce((sum, s) => sum + s.relevance, 0) / sources.length;
        if (avgRelevance > 0.7) {
          qualityAwarenessScore += 20;
          evidence.push(`High average source relevance: ${avgRelevance.toFixed(2)}`);
        }
      }

      qualityResults.push({
        ...testCase,
        score: qualityAwarenessScore,
        evidence,
        responseLength: response.message.length,
        sourceCount: sources.length,
        response: response.message.substring(0, 150)
      });
    }

    const avgQualityScore = qualityResults.reduce((sum, r) => sum + r.score, 0) / qualityResults.length;
    const passed = avgQualityScore >= 60;

    const agenticBehaviors = qualityResults.filter(r => r.score >= 60).map(r => r.evidence).flat();
    const simpleToolCallIndicators = qualityResults.filter(r => r.score < 40).map(r => 
      r.expectsLowResults ? 'Fails to acknowledge poor results' : 'Poor result quality without awareness'
    );

    return {
      testName: 'Result Quality Awareness',
      passed,
      score: Math.round(avgQualityScore),
      details: `Average quality awareness: ${Math.round(avgQualityScore)}%. ${qualityResults.filter(r => r.score >= 60).length}/${qualityTestCases.length} tests passed.`,
      evidence: qualityResults,
      agenticBehaviors: [...new Set(agenticBehaviors)],
      simpleToolCallIndicators: [...new Set(simpleToolCallIndicators)]
    };
  }

  // Test 4: Multi-turn Context Memory
  async testMultiTurnContext(): Promise<TestResult> {
    console.log('🧠 Testing Multi-turn Context Memory...');
    
    const conversationId = uuidv4();
    const sessionId = uuidv4();
    
    const conversationFlow = [
      {
        message: 'I need brake pads for my Honda',
        expectsContext: false,
        description: 'Initial query'
      },
      {
        message: 'What about the 2015 model?',
        expectsContext: true,
        description: 'Follow-up with context reference'
      },
      {
        message: 'Show me the cheapest option',
        expectsContext: true,
        description: 'Further refinement requiring context'
      },
      {
        message: 'Do you have installation instructions?',
        expectsContext: true,
        description: 'Related query requiring context'
      }
    ];

    const contextResults = [];
    let currentConversationId = conversationId;

    for (let i = 0; i < conversationFlow.length; i++) {
      const turn = conversationFlow[i];
      
      const { response, responseTime } = await this.makeRequest({
        message: turn.message,
        conversation_id: currentConversationId,
        session_id: sessionId
      });

      // Update conversation ID for next turn
      if (response.conversation_id) {
        currentConversationId = response.conversation_id;
      }

      let contextScore = 0;
      let evidence = [];
      const responseText = response.message.toLowerCase();

      if (turn.expectsContext) {
        // Check if response acknowledges previous context
        const contextualPhrases = [
          'honda', 'brake pad', '2015', 'for your', 'the model', 'your vehicle',
          'these brake', 'installation', 'cheapest'
        ];

        const contextualizationScore = contextualPhrases.filter(phrase => 
          responseText.includes(phrase)
        ).length;

        if (contextualizationScore >= 2) {
          contextScore += 40;
          evidence.push(`References ${contextualizationScore} contextual elements`);
        }

        // Check if it builds on previous searches
        const sources = response.sources || [];
        if (sources.length > 0) {
          contextScore += 30;
          evidence.push('Provides relevant sources based on context');
        }

        // Check response relevance to conversation
        if (responseText.includes('honda') || responseText.includes('brake')) {
          contextScore += 30;
          evidence.push('Maintains conversation topic coherence');
        }
      } else {
        // Initial query - just check for baseline functionality
        if (response.message.length > 50) {
          contextScore = 70; // Base score for responding
          evidence.push('Provides initial comprehensive response');
        }
      }

      contextResults.push({
        turn: i + 1,
        ...turn,
        score: contextScore,
        evidence,
        responseLength: response.message.length,
        sourceCount: response.sources?.length || 0,
        conversationId: currentConversationId,
        response: response.message.substring(0, 150)
      });

      // Small delay between turns to simulate real conversation
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    const avgContextScore = contextResults.reduce((sum, r) => sum + r.score, 0) / contextResults.length;
    const passed = avgContextScore >= 60;

    const agenticBehaviors = [];
    const simpleToolCallIndicators = [];

    // Check for conversation memory indicators
    const contextualTurns = contextResults.filter(r => r.expectsContext);
    const successfulContextTurns = contextualTurns.filter(r => r.score >= 60);

    if (successfulContextTurns.length >= contextualTurns.length * 0.7) {
      agenticBehaviors.push('Demonstrates strong conversation memory');
    } else {
      simpleToolCallIndicators.push('Poor context retention between turns');
    }

    if (contextResults.every(r => r.conversationId === contextResults[0].conversationId)) {
      agenticBehaviors.push('Maintains conversation ID across turns');
    }

    return {
      testName: 'Multi-turn Context Memory',
      passed,
      score: Math.round(avgContextScore),
      details: `Average context score: ${Math.round(avgContextScore)}%. ${successfulContextTurns.length}/${contextualTurns.length} contextual turns handled successfully.`,
      evidence: contextResults,
      agenticBehaviors,
      simpleToolCallIndicators
    };
  }

  // Test 5: Dynamic Iteration Control
  async testDynamicIterationControl(): Promise<TestResult> {
    console.log('⚡ Testing Dynamic Iteration Control...');
    
    const iterationTestCases = [
      {
        query: 'What is your phone number?', // Simple, should stop early
        expectedIterations: 1,
        description: 'Simple information query'
      },
      {
        query: 'Compare all brake pad options for different vehicle types', // Complex, should iterate more
        expectedIterations: 2, // Based on system's maxSearchIterations default of 2
        description: 'Complex comparative query'
      },
      {
        query: 'Find the exact part number for Honda Civic 2015 front brake pads, ceramic type', // Specific, moderate iterations
        expectedIterations: 1,
        description: 'Specific product query'
      }
    ];

    const sessionId = uuidv4();
    const iterationResults = [];

    for (const testCase of iterationTestCases) {
      const startTime = Date.now();
      
      const { response, responseTime } = await this.makeRequest({
        message: testCase.query,
        session_id: sessionId,
        config: {
          ai: {
            maxSearchIterations: 5, // Allow system to choose optimal iterations
            searchTimeout: 15000,
          }
        }
      });

      const searchCount = response.metadata?.searchCount || 0;
      const executionTime = response.metadata?.executionTime || responseTime;

      let iterationScore = 0;
      let evidence = [];

      // Check if iteration count makes sense for query complexity
      const queryComplexity = testCase.query.split(' ').length;
      
      if (testCase.expectedIterations === 1 && searchCount <= 1) {
        iterationScore += 50;
        evidence.push('Appropriate single search for simple query');
      } else if (testCase.expectedIterations > 1 && searchCount > 1) {
        iterationScore += 50;
        evidence.push(`Multiple searches (${searchCount}) for complex query`);
      } else if (searchCount === 0) {
        evidence.push('No searches performed - may be using cached/hardcoded response');
      }

      // Check execution time efficiency
      const timePerIteration = searchCount > 0 ? executionTime / searchCount : executionTime;
      if (timePerIteration < 10000) { // Less than 10s per search iteration
        iterationScore += 25;
        evidence.push(`Efficient search iterations: ${Math.round(timePerIteration)}ms per search`);
      }

      // Check result quality vs effort
      const sources = response.sources || [];
      const qualityEfficiencyRatio = sources.length / Math.max(searchCount, 1);
      
      if (qualityEfficiencyRatio > 2) {
        iterationScore += 25;
        evidence.push(`Good quality/effort ratio: ${sources.length} sources from ${searchCount} searches`);
      }

      iterationResults.push({
        ...testCase,
        actualIterations: searchCount,
        score: iterationScore,
        evidence,
        executionTime,
        sourceCount: sources.length,
        qualityEfficiencyRatio,
        response: response.message.substring(0, 120)
      });
    }

    const avgIterationScore = iterationResults.reduce((sum, r) => sum + r.score, 0) / iterationResults.length;
    const passed = avgIterationScore >= 60;

    const agenticBehaviors = [];
    const simpleToolCallIndicators = [];

    // Analyze patterns
    const adaptiveResults = iterationResults.filter(r => r.score >= 70);
    const rigidResults = iterationResults.filter(r => r.actualIterations === iterationResults[0].actualIterations);

    if (adaptiveResults.length >= iterationResults.length * 0.6) {
      agenticBehaviors.push('Shows adaptive iteration control based on query complexity');
    }

    if (rigidResults.length === iterationResults.length) {
      simpleToolCallIndicators.push('Fixed iteration pattern regardless of query complexity');
    }

    return {
      testName: 'Dynamic Iteration Control',
      passed,
      score: Math.round(avgIterationScore),
      details: `Average iteration control score: ${Math.round(avgIterationScore)}%. ${adaptiveResults.length}/${iterationTestCases.length} queries showed good iteration control.`,
      evidence: iterationResults,
      agenticBehaviors,
      simpleToolCallIndicators
    };
  }

  // Comprehensive Analysis
  private calculateOverallAgenticScore(): AgenticCapabilityScore[] {
    const capabilities: AgenticCapabilityScore[] = [
      {
        capability: 'Autonomous Strategy Selection',
        description: 'Ability to choose different search approaches for different query types',
        maxScore: 100,
        actualScore: 0,
        evidence: [],
        recommendations: []
      },
      {
        capability: 'Iterative Refinement',
        description: 'Ability to improve search results through multiple iterations',
        maxScore: 100,
        actualScore: 0,
        evidence: [],
        recommendations: []
      },
      {
        capability: 'Result Quality Awareness',
        description: 'Ability to assess and communicate search result quality',
        maxScore: 100,
        actualScore: 0,
        evidence: [],
        recommendations: []
      },
      {
        capability: 'Multi-turn Context Memory',
        description: 'Ability to maintain context across conversation turns',
        maxScore: 100,
        actualScore: 0,
        evidence: [],
        recommendations: []
      },
      {
        capability: 'Dynamic Iteration Control',
        description: 'Ability to adapt search effort based on query complexity and confidence',
        maxScore: 100,
        actualScore: 0,
        evidence: [],
        recommendations: []
      }
    ];

    // Map test results to capabilities
    const testMapping = [
      'Autonomous Strategy Selection',
      'Iterative Refinement',
      'Result Quality Awareness',
      'Multi-turn Context Memory',
      'Dynamic Iteration Control'
    ];

    this.results.forEach((result, index) => {
      if (index < capabilities.length) {
        capabilities[index].actualScore = result.score;
        capabilities[index].evidence = result.agenticBehaviors;
        
        // Generate recommendations based on performance
        if (result.score < 40) {
          capabilities[index].recommendations.push('Critical: This capability appears to be missing or severely limited');
          capabilities[index].recommendations.push('Consider implementing explicit agent reasoning loops');
        } else if (result.score < 70) {
          capabilities[index].recommendations.push('Moderate: Some agentic behavior present but needs improvement');
          capabilities[index].recommendations.push('Consider enhancing iterative decision-making logic');
        } else {
          capabilities[index].recommendations.push('Good: Strong agentic behavior demonstrated');
        }

        // Add specific recommendations based on simple tool call indicators
        if (result.simpleToolCallIndicators.length > 0) {
          capabilities[index].recommendations.push(
            `Address: ${result.simpleToolCallIndicators.slice(0, 2).join(', ')}`
          );
        }
      }
    });

    return capabilities;
  }

  // Main test execution
  async runAllTests(): Promise<void> {
    try {
      console.log('Starting comprehensive agentic behavior test suite...\n');

      // Run all tests
      this.results.push(await this.testAutonomousStrategySelection());
      this.results.push(await this.testIterativeRefinement());
      this.results.push(await this.testResultQualityAwareness());
      this.results.push(await this.testMultiTurnContext());
      this.results.push(await this.testDynamicIterationControl());

      // Generate comprehensive report
      this.generateReport();

    } catch (error) {
      console.error('❌ Test execution failed:', error);
      process.exit(1);
    }
  }

  private generateReport(): void {
    console.log('\n' + '='.repeat(70));
    console.log('📊 AGENTIC SEARCH CAPABILITIES ASSESSMENT REPORT');
    console.log('='.repeat(70));

    // Overall summary
    const totalScore = this.results.reduce((sum, r) => sum + r.score, 0) / this.results.length;
    const passedTests = this.results.filter(r => r.passed).length;
    
    console.log(`\n🎯 OVERALL ASSESSMENT:`);
    console.log(`   Average Score: ${Math.round(totalScore)}/100`);
    console.log(`   Tests Passed: ${passedTests}/${this.results.length}`);
    
    let overallClassification = '';
    if (totalScore >= 80) {
      overallClassification = '🤖 HIGHLY AGENTIC - Strong autonomous reasoning and adaptation';
    } else if (totalScore >= 60) {
      overallClassification = '⚡ MODERATELY AGENTIC - Some autonomous behaviors present';
    } else if (totalScore >= 40) {
      overallClassification = '🔧 BASIC TOOL-CALLING - Limited agentic behavior';
    } else {
      overallClassification = '📞 SIMPLE TOOL-CALLING - No significant agentic behavior detected';
    }
    
    console.log(`   Classification: ${overallClassification}`);

    // Individual test results
    console.log(`\n📋 DETAILED TEST RESULTS:`);
    this.results.forEach((result, index) => {
      const status = result.passed ? '✅ PASS' : '❌ FAIL';
      console.log(`\n${index + 1}. ${result.testName}`);
      console.log(`   ${status} - Score: ${result.score}/100`);
      console.log(`   ${result.details}`);
      
      if (result.agenticBehaviors.length > 0) {
        console.log(`   🤖 Agentic Behaviors:`);
        result.agenticBehaviors.forEach(behavior => {
          console.log(`      • ${behavior}`);
        });
      }
      
      if (result.simpleToolCallIndicators.length > 0) {
        console.log(`   📞 Simple Tool-Call Indicators:`);
        result.simpleToolCallIndicators.forEach(indicator => {
          console.log(`      • ${indicator}`);
        });
      }
    });

    // Capability analysis
    const capabilities = this.calculateOverallAgenticScore();
    console.log(`\n🧠 CAPABILITY ANALYSIS:`);
    capabilities.forEach(cap => {
      const percentage = Math.round((cap.actualScore / cap.maxScore) * 100);
      const status = percentage >= 70 ? '🟢' : percentage >= 40 ? '🟡' : '🔴';
      
      console.log(`\n${status} ${cap.capability}: ${percentage}%`);
      console.log(`   ${cap.description}`);
      
      if (cap.evidence.length > 0) {
        console.log(`   Evidence: ${cap.evidence.slice(0, 2).join('; ')}`);
      }
      
      cap.recommendations.forEach(rec => {
        console.log(`   💡 ${rec}`);
      });
    });

    // Key findings and recommendations
    console.log(`\n🔍 KEY FINDINGS:`);
    
    const allAgenticBehaviors = [...new Set(this.results.flatMap(r => r.agenticBehaviors))];
    const allSimpleIndicators = [...new Set(this.results.flatMap(r => r.simpleToolCallIndicators))];
    
    if (allAgenticBehaviors.length > 0) {
      console.log(`\n✅ Positive Agentic Behaviors Detected:`);
      allAgenticBehaviors.forEach(behavior => {
        console.log(`   • ${behavior}`);
      });
    }
    
    if (allSimpleIndicators.length > 0) {
      console.log(`\n⚠️  Areas Lacking Agentic Behavior:`);
      allSimpleIndicators.forEach(indicator => {
        console.log(`   • ${indicator}`);
      });
    }

    // Recommendations for improvement
    console.log(`\n🚀 RECOMMENDATIONS FOR ENHANCED AGENTIC BEHAVIOR:`);
    
    if (totalScore < 70) {
      console.log(`
   1. IMPLEMENT EXPLICIT AGENT REASONING:
      • Add decision-making loops that evaluate search quality
      • Implement query refinement strategies based on result quality
      • Add meta-reasoning about search strategy selection

   2. ENHANCE ITERATION CONTROL:
      • Implement confidence-based stopping criteria
      • Add query complexity assessment for iteration planning
      • Create feedback loops for search quality evaluation

   3. IMPROVE CONTEXT AWARENESS:
      • Implement conversation state tracking
      • Add semantic understanding of query relationships
      • Create memory systems for multi-turn conversations

   4. ADD QUALITY ASSESSMENT:
      • Implement result quality scoring mechanisms
      • Add uncertainty quantification and communication
      • Create fallback strategies for poor results`);
    } else {
      console.log(`
   🎉 GOOD AGENTIC FOUNDATIONS DETECTED!
   
   Focus on:
   • Fine-tuning existing agentic behaviors
   • Adding more sophisticated reasoning patterns
   • Enhancing user communication about reasoning process`);
    }

    console.log(`\n📁 TECHNICAL DETAILS:`);
    console.log(`   Test Configuration: ${CONFIG.testDomain}`);
    console.log(`   API Endpoint: ${CONFIG.baseUrl}${CONFIG.apiEndpoint}`);
    console.log(`   Total Test Time: ~${Math.round(this.results.reduce((sum, r) => sum + (r.evidence as any)?.responseTime || 0, 0) / 1000)}s`);

    console.log('\n' + '='.repeat(70));
    console.log('✅ Assessment complete! See detailed analysis above.');
    console.log('='.repeat(70));
  }
}

// Execute tests if run directly
if (require.main === module) {
  const tester = new AgenticSearchTester();
  tester.runAllTests().catch(error => {
    console.error('Test execution failed:', error);
    process.exit(1);
  });
}

export { AgenticSearchTester };