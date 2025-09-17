#!/usr/bin/env npx tsx

/**
 * Quick Customer Satisfaction Journey Test (Fast Version)
 * 
 * Tests customer journeys with shorter timeouts for rapid feedback
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

class QuickCustomerSatisfactionTester {
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

  async sendChatMessage(message: string, timeoutMs: number = 15000): Promise<ChatResponse> {
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
              searchTimeout: 10000 // Reduced timeout
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

  async runQuickTest(): Promise<void> {
    console.log('🚀 Quick Customer Satisfaction Journey Test');
    console.log('Testing domain:', this.domain);
    console.log('API endpoint:', `${this.baseUrl}/api/chat-intelligent`);
    console.log('\n' + '='.repeat(80));

    // Run simplified scenarios
    const scenarios = [
      {
        name: 'Quick Test: Basic Product Search',
        steps: [
          {
            query: 'I need Cifa parts',
            expectedOutcome: 'find products',
          },
        ],
      },
      {
        name: 'Quick Test: Specific Part',
        steps: [
          {
            query: 'Cifa water pump',
            expectedOutcome: 'water pump product',
          },
        ],
      },
    ];

    const results: ScenarioResult[] = [];

    for (const scenario of scenarios) {
      try {
        console.log(`\n🎯 Testing: ${scenario.name}`);
        console.log('=' .repeat(50));

        // Reset for each scenario
        this.conversationHistory = [];
        this.sessionId = uuidv4();

        const startTime = performance.now();
        const stepResults: StepResult[] = [];
        const issues: string[] = [];

        for (const step of scenario.steps) {
          console.log(`\n📝 Query: "${step.query}"`);
          
          try {
            const stepStartTime = performance.now();
            const response = await this.sendChatMessage(step.query, 20000); // 20 second timeout
            const stepEndTime = performance.now();
            const responseTime = stepEndTime - stepStartTime;

            const satisfactionScore = this.calculateSatisfactionScore(
              step.query,
              response.response,
              response.products_found || 0,
              response.context_preserved || false,
              step.expectedOutcome
            );

            console.log(`✅ Products found: ${response.products_found || 0}`);
            console.log(`🎯 Satisfaction: ${satisfactionScore}/100`);
            console.log(`⏱️  Time: ${Math.round(responseTime)}ms`);
            
            if (response.response.length > 200) {
              console.log(`📄 Response preview: ${response.response.substring(0, 200)}...`);
            } else {
              console.log(`📄 Response: ${response.response}`);
            }

            stepResults.push({
              step: 1,
              query: step.query,
              response: response.response,
              products_found: response.products_found || 0,
              context_preserved: response.context_preserved || false,
              satisfaction_score: satisfactionScore,
              issues: [],
              response_time: responseTime,
            });

          } catch (error) {
            console.error(`❌ Failed: ${error.message}`);
            stepResults.push({
              step: 1,
              query: step.query,
              response: 'ERROR: ' + error.message,
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

        const averageSatisfaction = stepResults.reduce(
          (sum, step) => sum + step.satisfaction_score, 0
        ) / stepResults.length;

        results.push({
          name: scenario.name,
          steps: stepResults,
          overall_satisfaction: Math.round(averageSatisfaction),
          completion_time: completionTime,
          issues,
          success: averageSatisfaction >= 70 && issues.length === 0,
        });

      } catch (error) {
        console.error(`❌ Scenario failed: ${scenario.name}`, error);
      }
    }

    this.printQuickReport(results);
  }

  private printQuickReport(results: ScenarioResult[]): void {
    console.log('\n' + '='.repeat(80));
    console.log('📊 QUICK TEST RESULTS');
    console.log('='.repeat(80));

    let totalSatisfaction = 0;
    let successfulScenarios = 0;

    results.forEach((result, index) => {
      console.log(`\n${index + 1}. ${result.name}`);
      console.log(`   Satisfaction: ${result.overall_satisfaction}/100`);
      console.log(`   Success: ${result.success ? '✅' : '❌'}`);
      console.log(`   Time: ${Math.round(result.completion_time)}ms`);
      
      totalSatisfaction += result.overall_satisfaction;
      if (result.success) successfulScenarios++;
    });

    const averageSatisfaction = totalSatisfaction / results.length;
    const successRate = (successfulScenarios / results.length) * 100;

    console.log('\n' + '-'.repeat(50));
    console.log(`Average Satisfaction: ${Math.round(averageSatisfaction)}/100`);
    console.log(`Success Rate: ${Math.round(successRate)}%`);

    if (averageSatisfaction >= 80) {
      console.log('\n🎉 EXCELLENT: System performs well!');
    } else if (averageSatisfaction >= 70) {
      console.log('\n✅ GOOD: System provides satisfactory results.');
    } else if (averageSatisfaction >= 60) {
      console.log('\n⚠️  NEEDS IMPROVEMENT: Room for enhancement.');
    } else {
      console.log('\n❌ POOR: System needs significant improvements.');
    }

    console.log('\n' + '='.repeat(80));
  }
}

// Run the quick test
async function main() {
  const tester = new QuickCustomerSatisfactionTester();
  
  try {
    await tester.runQuickTest();
  } catch (error) {
    console.error('❌ Test suite failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch(console.error);
}

export { QuickCustomerSatisfactionTester };