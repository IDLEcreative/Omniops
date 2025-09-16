/**
 * Live Customer Service Test Suite
 * Tests the actual AI agent against experienced customer service operative standards
 * This version makes real API calls to get actual AI responses
 */

import { createClient } from '@supabase/supabase-js';
import { CustomerServiceAgent } from './lib/agents/customer-service-agent';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface TestScenario {
  category: string;
  subcategory?: string;
  description: string;
  customerQuery: string;
  context?: {
    verificationLevel?: 'none' | 'basic' | 'full';
    customerData?: any;
    productData?: any;
  };
  expectedBehaviors: string[];
  failureIndicators: string[];
  weight: number;
  difficultyLevel: 'basic' | 'intermediate' | 'advanced' | 'expert';
}

interface TestResult {
  scenario: TestScenario;
  response: string;
  score: number;
  passed: boolean;
  notes: string[];
  timeTaken: number;
}

class LiveCustomerServiceTest {
  private agent: CustomerServiceAgent;
  private scenarios: TestScenario[] = [];
  private results: TestResult[] = [];
  private domain: string = 'test.example.com';

  constructor() {
    this.agent = new CustomerServiceAgent();
    this.initializeScenarios();
  }

  private initializeScenarios() {
    // Test a variety of scenarios
    this.scenarios = [
      {
        category: 'Routine Inquiries',
        subcategory: 'Business Hours',
        description: 'Customer asking about store hours',
        customerQuery: 'What are your business hours?',
        expectedBehaviors: [
          'hours', 'open', 'Monday', 'Friday', 'contact'
        ],
        failureIndicators: [
          'verification', 'email', 'order number'
        ],
        weight: 1,
        difficultyLevel: 'basic'
      },
      {
        category: 'Product Inquiry',
        subcategory: 'Product Search',
        description: 'Customer looking for pumps',
        customerQuery: 'Do you have any hydraulic pumps?',
        context: {
          productData: [
            { name: 'Hydraulic Pump A4VTG71', url: '/products/pump-a4vtg71', price: '$2,450' },
            { name: 'Cifa Mixer Pump', url: '/products/cifa-pump', price: '$3,200' }
          ]
        },
        expectedBehaviors: [
          'pump', 'available', 'Hydraulic', 'A4VTG71', 'Cifa'
        ],
        failureIndicators: [
          'verification', 'email required', 'cannot help'
        ],
        weight: 2,
        difficultyLevel: 'basic'
      },
      {
        category: 'Order Tracking',
        subcategory: 'Unverified',
        description: 'Customer wants to track order without verification',
        customerQuery: 'Where is my order? I need to track my package',
        expectedBehaviors: [
          'help', 'track', 'order number', 'email', 'look it up'
        ],
        failureIndicators: [
          'cannot access', 'don\'t have access', 'unable to view'
        ],
        weight: 3,
        difficultyLevel: 'intermediate'
      },
      {
        category: 'Order Tracking',
        subcategory: 'With Email',
        description: 'Customer provides email for verification',
        customerQuery: 'My email is john@example.com. Can you show me my recent orders?',
        context: {
          verificationLevel: 'full',
          customerData: {
            email: 'john@example.com',
            orders: [
              {
                number: '12345',
                date_created: '2024-01-10T10:00:00Z',
                status: 'delivered',
                total: '450.00',
                currency: 'USD'
              }
            ]
          }
        },
        expectedBehaviors: [
          'Order #12345', 'delivered', '$450', 'January'
        ],
        failureIndicators: [
          'need more information', 'cannot find', 'no orders'
        ],
        weight: 4,
        difficultyLevel: 'intermediate'
      },
      {
        category: 'Problem Resolution',
        subcategory: 'Missing Items',
        description: 'Customer reports missing items',
        customerQuery: 'I received order #12345 but the hydraulic valve is missing from the box!',
        context: {
          verificationLevel: 'full',
          customerData: {
            orders: [{
              number: '12345',
              status: 'delivered'
            }]
          }
        },
        expectedBehaviors: [
          'sorry', 'apologize', 'missing', 'resolve', 'replacement', 'refund'
        ],
        failureIndicators: [
          'prove', 'not my problem', 'contact carrier'
        ],
        weight: 5,
        difficultyLevel: 'advanced'
      },
      {
        category: 'Emotional Intelligence',
        subcategory: 'Frustrated Customer',
        description: 'Dealing with angry customer',
        customerQuery: 'This is RIDICULOUS! My order is 2 weeks late! You people are incompetent!',
        context: {
          verificationLevel: 'full',
          customerData: {
            orders: [{
              number: '77889',
              status: 'in_transit',
              date_created: '2024-01-01T10:00:00Z'
            }]
          }
        },
        expectedBehaviors: [
          'understand', 'frustration', 'sorry', 'apologize', 'help', 'resolve'
        ],
        failureIndicators: [
          'calm down', 'not our fault', 'nothing I can do'
        ],
        weight: 5,
        difficultyLevel: 'advanced'
      }
    ];
  }

  private async callChatAPI(query: string, context?: any): Promise<string> {
    try {
      // Build the context for the agent
      const fullContext = this.agent.buildCompleteContext(
        context?.verificationLevel || 'none',
        this.buildCustomerContext(context?.customerData),
        '',
        query
      );

      // Prepare the request body
      const requestBody = {
        messages: [
          {
            role: 'system',
            content: fullContext
          },
          {
            role: 'user',
            content: query
          }
        ],
        domain: this.domain,
        stream: false
      };

      // Add product context if available
      if (context?.productData) {
        requestBody.messages[0].content += `\n\nAvailable Products:\n${
          context.productData.map((p: any) => 
            `- [${p.name}](${p.url}) - ${p.price || 'Contact for price'}`
          ).join('\n')
        }`;
      }

      console.log('   Calling chat API...');
      
      // Call the actual chat API
      const response = await fetch('http://localhost:3000/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        console.error(`   API Error: ${response.status} ${response.statusText}`);
        const errorText = await response.text();
        console.error(`   Error details: ${errorText.substring(0, 200)}`);
        return 'Error: Failed to get response from API';
      }

      const data = await response.json();
      return data.content || data.message || 'No response content';

    } catch (error) {
      console.error('   Error calling chat API:', error);
      return `Error: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  }

  private buildCustomerContext(customerData?: any): string {
    if (!customerData) return '';
    
    let context = 'Customer Information:\n';
    
    if (customerData.email) {
      context += `Email: ${customerData.email}\n`;
    }
    
    if (customerData.orders && customerData.orders.length > 0) {
      context += `\nRecent Orders:\n`;
      context += this.agent.formatOrdersForAI(customerData.orders);
    }
    
    return context;
  }

  private analyzeResponse(response: string, scenario: TestScenario): TestResult {
    const startTime = Date.now();
    const responseLower = response.toLowerCase();
    
    let score = 0;
    const maxScore = scenario.expectedBehaviors.length;
    const notes: string[] = [];
    
    // Check for expected behaviors (simplified keyword matching)
    for (const behavior of scenario.expectedBehaviors) {
      if (responseLower.includes(behavior.toLowerCase())) {
        score++;
        notes.push(`✓ Found: "${behavior}"`);
      } else {
        notes.push(`✗ Missing: "${behavior}"`);
      }
    }
    
    // Check for failure indicators (deduct points)
    for (const indicator of scenario.failureIndicators) {
      if (responseLower.includes(indicator.toLowerCase())) {
        score = Math.max(0, score - 0.5);
        notes.push(`⚠️ Issue: Contains "${indicator}"`);
      }
    }
    
    const normalizedScore = maxScore > 0 ? (score / maxScore) * 100 : 0;
    const passed = normalizedScore >= 60; // 60% threshold for passing
    
    return {
      scenario,
      response,
      score: normalizedScore,
      passed,
      notes,
      timeTaken: Date.now() - startTime
    };
  }

  async runTests(options?: { limit?: number }): Promise<void> {
    console.log('🧪 Live Customer Service Agent Test');
    console.log('=' .repeat(60));
    console.log('Testing against actual chat API at http://localhost:3000\n');
    
    const testScenarios = options?.limit 
      ? this.scenarios.slice(0, options.limit)
      : this.scenarios;
    
    console.log(`Running ${testScenarios.length} live test scenarios...\n`);
    
    for (let i = 0; i < testScenarios.length; i++) {
      const scenario = testScenarios[i];
      
      console.log(`\n📋 Test ${i + 1}/${testScenarios.length}: ${scenario.category} - ${scenario.subcategory || 'General'}`);
      console.log(`   Difficulty: ${scenario.difficultyLevel.toUpperCase()}`);
      console.log(`   Query: "${scenario.customerQuery}"`);
      
      // Get actual AI response
      const aiResponse = await this.callChatAPI(scenario.customerQuery, scenario.context);
      
      // Show the actual response (truncated)
      const truncatedResponse = aiResponse.length > 150 
        ? aiResponse.substring(0, 150) + '...' 
        : aiResponse;
      console.log(`   Response: "${truncatedResponse}"`);
      
      // Analyze the response
      const result = this.analyzeResponse(aiResponse, scenario);
      this.results.push(result);
      
      console.log(`   Score: ${result.score.toFixed(1)}% ${result.passed ? '✅ PASSED' : '❌ FAILED'}`);
      
      // Show top 3 notes
      if (result.notes.length > 0) {
        console.log('   Analysis:');
        result.notes.slice(0, 3).forEach(note => console.log(`     ${note}`));
        if (result.notes.length > 3) {
          console.log(`     ... and ${result.notes.length - 3} more`);
        }
      }
      
      // Small delay between API calls to avoid rate limiting
      if (i < testScenarios.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
    
    this.generateReport();
  }

  private generateReport(): void {
    console.log('\n' + '='.repeat(60));
    console.log('📊 LIVE TEST RESULTS SUMMARY');
    console.log('='.repeat(60));
    
    const totalTests = this.results.length;
    const passedTests = this.results.filter(r => r.passed).length;
    const averageScore = totalTests > 0 
      ? this.results.reduce((sum, r) => sum + r.score, 0) / totalTests
      : 0;
    
    console.log(`\n📈 Overall Performance:`);
    console.log(`   Total Tests: ${totalTests}`);
    console.log(`   Passed: ${passedTests} (${((passedTests/totalTests)*100).toFixed(1)}%)`);
    console.log(`   Failed: ${totalTests - passedTests}`);
    console.log(`   Average Score: ${averageScore.toFixed(1)}%`);
    
    // Performance by category
    console.log(`\n📊 Performance by Category:`);
    const categories = Array.from(new Set(this.results.map(r => r.scenario.category)));
    
    for (const category of categories) {
      const categoryResults = this.results.filter(r => r.scenario.category === category);
      const categoryScore = categoryResults.reduce((sum, r) => sum + r.score, 0) / categoryResults.length;
      const categoryPassed = categoryResults.filter(r => r.passed).length;
      
      console.log(`   ${category}:`);
      console.log(`     - Score: ${categoryScore.toFixed(1)}%`);
      console.log(`     - Passed: ${categoryPassed}/${categoryResults.length}`);
    }
    
    // Best and worst performances
    const sortedResults = [...this.results].sort((a, b) => b.score - a.score);
    
    console.log(`\n✨ Best Performance:`);
    const bestResult = sortedResults[0];
    if (bestResult) {
      console.log(`   ${bestResult.scenario.category} - ${bestResult.scenario.subcategory}: ${bestResult.score.toFixed(1)}%`);
    }
    
    console.log(`\n⚠️ Needs Improvement:`);
    const worstResult = sortedResults[sortedResults.length - 1];
    if (worstResult && worstResult.score < 60) {
      console.log(`   ${worstResult.scenario.category} - ${worstResult.scenario.subcategory}: ${worstResult.score.toFixed(1)}%`);
    }
    
    // Final verdict
    console.log(`\n🎯 FINAL VERDICT:`);
    if (averageScore >= 85) {
      console.log('   ✅ EXCELLENT: Agent performs at expert customer service level');
    } else if (averageScore >= 70) {
      console.log('   ✅ GOOD: Agent meets experienced customer service standards');
    } else if (averageScore >= 60) {
      console.log('   ⚠️ ADEQUATE: Agent performs acceptably but has room for improvement');
    } else {
      console.log('   ❌ NEEDS IMPROVEMENT: Agent does not yet meet professional standards');
    }
    
    console.log('\n' + '='.repeat(60));
  }
}

// Main execution
async function main() {
  console.log('Starting Live Customer Service Test...\n');
  console.log('⚠️  Make sure the dev server is running on port 3000!');
  console.log('   Run `npm run dev` in another terminal if needed.\n');
  
  const tester = new LiveCustomerServiceTest();
  
  // Check command line arguments
  const args = process.argv.slice(2);
  
  if (args.includes('--quick')) {
    console.log('Running quick test (3 scenarios)...\n');
    await tester.runTests({ limit: 3 });
  } else {
    console.log('Running full test suite...\n');
    await tester.runTests();
  }
}

// Run the tests
main().catch(console.error);

export { LiveCustomerServiceTest };