#!/usr/bin/env npx tsx

/**
 * Customer Satisfaction Journey Test
 * 
 * Simulates real customer journeys to verify the AI achieves 100% customer satisfaction.
 * Tests the complete interaction flow from initial query to finding exact products.
 * 
 * Focus areas:
 * - Search completeness
 * - Context preservation across queries
 * - Effective narrowing of results
 * - Final customer satisfaction
 */

import { performance } from 'perf_hooks';
import { v4 as uuidv4 } from 'uuid';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatResponse {
  response: string;
  products_found?: number;
  search_results?: any[];
  context_preserved?: boolean;
}

interface ScenarioResult {
  name: string;
  steps: StepResult[];
  overall_satisfaction: number;
  completion_time: number;
  issues: string[];
  success: boolean;
}

interface StepResult {
  step: number;
  query: string;
  response: string;
  products_found: number;
  context_preserved: boolean;
  satisfaction_score: number;
  issues: string[];
  response_time: number;
}

class CustomerSatisfactionTester {
  private baseUrl = 'http://localhost:3000';
  private domain = 'thompsonseparts.co.uk';
  private conversationHistory: ChatMessage[] = [];
  private sessionId: string;

  private generateSessionId(): string {
    if (!this.sessionId) {
      this.sessionId = uuidv4();
    }
    return this.sessionId;
  }

  async sendChatMessage(message: string, timeoutMs: number = 30000): Promise<ChatResponse> {
    const startTime = performance.now();
    
    this.conversationHistory.push({ role: 'user', content: message });

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      const response = await fetch(`${this.baseUrl}/api/chat-intelligent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          session_id: this.sessionId || this.generateSessionId(),
          domain: this.domain,
          config: {
            ai: {
              maxSearchIterations: 2, // Reduced for speed
              searchTimeout: 15000 // Reduced timeout
            },
            features: {
              websiteScraping: { enabled: true },
              woocommerce: { enabled: true }
            }
          }
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      const responseTime = performance.now() - startTime;

      this.conversationHistory.push({ role: 'assistant', content: data.message || data.response });

      return {
        response: data.message || data.response,
        products_found: this.countProductsInResponse(data.message || data.response),
        search_results: data.sources || data.search_results,
        context_preserved: this.checkContextPreservation(data.message || data.response),
      };
    } catch (error) {
      if (error.name === 'AbortError') {
        throw new Error(`Request timeout after ${timeoutMs}ms`);
      }
      console.error('Error sending chat message:', error);
      throw error;
    }
  }

  private countProductsInResponse(response: string): number {
    // Count product mentions and listings
    const productPatterns = [
      /\$\d+/g, // Price mentions
      /£\d+/g, // UK price mentions
      /Product:/gi,
      /Part:/gi,
      /Model:/gi,
      /SKU:/gi,
      /\d+\.\s+[A-Z]/g, // Numbered lists
      /•\s+[A-Z]/g, // Bullet points
    ];

    let totalMatches = 0;
    productPatterns.forEach(pattern => {
      const matches = response.match(pattern);
      if (matches) totalMatches += matches.length;
    });

    return Math.max(totalMatches, this.countCifaProducts(response));
  }

  private countCifaProducts(response: string): number {
    const cifaMatches = response.match(/cifa/gi);
    return cifaMatches ? cifaMatches.length : 0;
  }

  private checkContextPreservation(response: string): boolean {
    // Check if the response acknowledges previous conversation context
    const contextIndicators = [
      'based on your previous',
      'following up on',
      'from the options',
      'narrowing down',
      'filtering',
      'from what we found',
      'as mentioned',
      'continuing with',
      'from the results',
      'previous search',
      'earlier you',
      'you asked for',
      'from those',
      'of the',
      'these options',
      'refining',
      'narrower',
    ];

    return contextIndicators.some(indicator => 
      response.toLowerCase().includes(indicator.toLowerCase())
    );
  }

  private calculateSatisfactionScore(
    query: string,
    response: string,
    productsFound: number,
    contextPreserved: boolean,
    expectedOutcome: string
  ): number {
    let score = 0;

    // Base score for response quality (0-40 points)
    if (response.length > 100) score += 10; // Detailed response
    if (response.includes('Cifa') || response.includes('cifa')) score += 10; // Brand relevance
    if (response.includes('£') || response.includes('$')) score += 10; // Pricing info
    if (response.length > 300) score += 10; // Comprehensive response

    // Product finding score (0-30 points)
    if (productsFound > 0) score += 15;
    if (productsFound >= 5) score += 10;
    if (productsFound >= 10) score += 5;

    // Context preservation (0-20 points)
    if (contextPreserved) score += 20;

    // Expected outcome matching (0-10 points)
    if (this.matchesExpectedOutcome(response, expectedOutcome)) score += 10;

    return Math.min(score, 100);
  }

  private matchesExpectedOutcome(response: string, expectedOutcome: string): boolean {
    const outcomeKeywords = expectedOutcome.toLowerCase().split(' ');
    const responseLower = response.toLowerCase();
    
    return outcomeKeywords.some(keyword => responseLower.includes(keyword));
  }

  async runScenario(
    name: string,
    steps: { query: string; expectedOutcome: string }[]
  ): Promise<ScenarioResult> {
    console.log(`\n🎯 Starting scenario: ${name}`);
    console.log('=' .repeat(60));

    const startTime = performance.now();
    const stepResults: StepResult[] = [];
    const issues: string[] = [];
    
    // Reset conversation and session for new scenario
    this.conversationHistory = [];
    this.sessionId = uuidv4();

    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      const stepStartTime = performance.now();

      console.log(`\n📝 Step ${i + 1}: "${step.query}"`);

      try {
        const response = await this.sendChatMessage(step.query, 25000); // 25 second timeout
        const stepEndTime = performance.now();
        const responseTime = stepEndTime - stepStartTime;

        const satisfactionScore = this.calculateSatisfactionScore(
          step.query,
          response.response,
          response.products_found || 0,
          response.context_preserved || false,
          step.expectedOutcome
        );

        const stepIssues: string[] = [];

        // Identify potential issues
        if (response.products_found === 0 && step.expectedOutcome.includes('find')) {
          stepIssues.push('No products found when products were expected');
        }
        if (!response.context_preserved && i > 0) {
          stepIssues.push('Context not preserved from previous interaction');
        }
        if (responseTime > 10000) {
          stepIssues.push(`Slow response time: ${Math.round(responseTime)}ms`);
        }
        if (satisfactionScore < 70) {
          stepIssues.push(`Low satisfaction score: ${satisfactionScore}/100`);
        }

        const stepResult: StepResult = {
          step: i + 1,
          query: step.query,
          response: response.response,
          products_found: response.products_found || 0,
          context_preserved: response.context_preserved || false,
          satisfaction_score: satisfactionScore,
          issues: stepIssues,
          response_time: responseTime,
        };

        stepResults.push(stepResult);
        issues.push(...stepIssues);

        console.log(`✅ Products found: ${response.products_found || 0}`);
        console.log(`🎯 Satisfaction score: ${satisfactionScore}/100`);
        console.log(`⏱️  Response time: ${Math.round(responseTime)}ms`);
        if (stepIssues.length > 0) {
          console.log(`⚠️  Issues: ${stepIssues.join(', ')}`);
        }

      } catch (error) {
        console.error(`❌ Step ${i + 1} failed:`, error);
        stepResults.push({
          step: i + 1,
          query: step.query,
          response: 'ERROR: ' + (error as Error).message,
          products_found: 0,
          context_preserved: false,
          satisfaction_score: 0,
          issues: ['Request failed'],
          response_time: 0,
        });
        issues.push('Request failed');
      }
    }

    const endTime = performance.now();
    const completionTime = endTime - startTime;

    // Calculate overall satisfaction
    const averageSatisfaction = stepResults.reduce(
      (sum, step) => sum + step.satisfaction_score, 0
    ) / stepResults.length;

    const success = averageSatisfaction >= 80 && issues.length === 0;

    return {
      name,
      steps: stepResults,
      overall_satisfaction: Math.round(averageSatisfaction),
      completion_time: completionTime,
      issues,
      success,
    };
  }

  async runAllScenarios(): Promise<void> {
    console.log('🚀 Customer Satisfaction Journey Test');
    console.log('Testing domain:', this.domain);
    console.log('API endpoint:', `${this.baseUrl}/api/chat-intelligent`);
    console.log('\n' + '='.repeat(80));

    const scenarios = [
      {
        name: 'Scenario A: Broad to Specific',
        steps: [
          {
            query: 'I need Cifa parts',
            expectedOutcome: 'find all 209 products categorize',
          },
          {
            query: 'Just the hydraulic ones',
            expectedOutcome: 'narrow hydraulic category',
          },
          {
            query: 'Under £200',
            expectedOutcome: 'filter price present options',
          },
        ],
      },
      {
        name: 'Scenario B: Specific Part Search',
        steps: [
          {
            query: 'I need a Cifa Mixer Proportional Mag Solenoid',
            expectedOutcome: 'find exact product price £285',
          },
          {
            query: 'What are the specs?',
            expectedOutcome: 'provide specifications',
          },
        ],
      },
      {
        name: 'Scenario C: Problem-Based Search',
        steps: [
          {
            query: 'My Cifa mixer needs a new water pump',
            expectedOutcome: 'find Cifa water pumps',
          },
          {
            query: 'Which one fits the Alpha model?',
            expectedOutcome: 'identify Alpha POMPE Water Pump £540',
          },
        ],
      },
      {
        name: 'Scenario D: Price-Conscious Customer',
        steps: [
          {
            query: "What's your cheapest Cifa part?",
            expectedOutcome: 'find lowest priced items',
          },
        ],
      },
    ];

    const results: ScenarioResult[] = [];

    for (const scenario of scenarios) {
      try {
        const result = await this.runScenario(scenario.name, scenario.steps);
        results.push(result);
        
        // Wait between scenarios to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (error) {
        console.error(`❌ Scenario failed: ${scenario.name}`, error);
      }
    }

    this.printFinalReport(results);
  }

  private printFinalReport(results: ScenarioResult[]): void {
    console.log('\n' + '='.repeat(80));
    console.log('📊 FINAL CUSTOMER SATISFACTION REPORT');
    console.log('='.repeat(80));

    let totalSatisfaction = 0;
    let successfulScenarios = 0;
    let totalIssues = 0;

    results.forEach((result, index) => {
      console.log(`\n${index + 1}. ${result.name}`);
      console.log(`   Satisfaction Score: ${result.overall_satisfaction}/100`);
      console.log(`   Success: ${result.success ? '✅' : '❌'}`);
      console.log(`   Completion Time: ${Math.round(result.completion_time)}ms`);
      console.log(`   Issues: ${result.issues.length}`);
      
      if (result.issues.length > 0) {
        console.log(`   Details: ${result.issues.join(', ')}`);
      }

      totalSatisfaction += result.overall_satisfaction;
      if (result.success) successfulScenarios++;
      totalIssues += result.issues.length;
    });

    const averageSatisfaction = totalSatisfaction / results.length;
    const successRate = (successfulScenarios / results.length) * 100;

    console.log('\n' + '-'.repeat(80));
    console.log('📈 OVERALL SYSTEM PERFORMANCE');
    console.log('-'.repeat(80));
    console.log(`Average Satisfaction Score: ${Math.round(averageSatisfaction)}/100`);
    console.log(`Success Rate: ${Math.round(successRate)}%`);
    console.log(`Total Issues: ${totalIssues}`);
    console.log(`Scenarios Tested: ${results.length}`);

    // Final assessment
    if (averageSatisfaction >= 90 && successRate >= 80) {
      console.log('\n🎉 EXCELLENT: System achieves high customer satisfaction!');
    } else if (averageSatisfaction >= 80 && successRate >= 70) {
      console.log('\n✅ GOOD: System provides satisfactory customer experience.');
    } else if (averageSatisfaction >= 70 && successRate >= 60) {
      console.log('\n⚠️  NEEDS IMPROVEMENT: Customer satisfaction could be better.');
    } else {
      console.log('\n❌ POOR: System needs significant improvements for customer satisfaction.');
    }

    console.log('\n' + '='.repeat(80));
  }
}

// Run the test
async function main() {
  const tester = new CustomerSatisfactionTester();
  
  try {
    await tester.runAllScenarios();
  } catch (error) {
    console.error('❌ Test suite failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch(console.error);
}

export { CustomerSatisfactionTester };