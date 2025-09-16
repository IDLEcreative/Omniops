/**
 * Comprehensive Customer Service Test Suite
 * Tests an AI agent against experienced customer service operative standards
 * 
 * Test Categories:
 * 1. Routine Inquiries - Basic questions any CS should handle
 * 2. Complex Problem Solving - Multi-step issues requiring investigation
 * 3. Emotional Intelligence - Handling upset/frustrated customers
 * 4. Technical Knowledge - Product/system expertise
 * 5. Upselling & Cross-selling - Revenue generation skills
 * 6. Compliance & Security - Data protection, verification
 * 7. Edge Cases - Unusual situations
 * 8. Communication Skills - Clarity, tone, professionalism
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
    previousInteraction?: string[];
  };
  expectedBehaviors: string[];
  failureIndicators: string[];
  weight: number; // Scoring weight (1-5)
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

class CustomerServiceTestSuite {
  private agent: CustomerServiceAgent;
  private scenarios: TestScenario[] = [];
  private results: TestResult[] = [];

  constructor() {
    this.agent = new CustomerServiceAgent();
    this.initializeScenarios();
  }

  private initializeScenarios() {
    // 1. ROUTINE INQUIRIES
    this.scenarios.push(
      {
        category: 'Routine Inquiries',
        subcategory: 'Business Hours',
        description: 'Customer asking about store hours',
        customerQuery: 'What are your business hours?',
        expectedBehaviors: [
          'Provides clear business hours',
          'Mentions any special holiday hours if relevant',
          'Offers additional contact methods'
        ],
        failureIndicators: [
          'Asks for verification for general info',
          'Unable to provide basic information',
          'Overly complex response'
        ],
        weight: 1,
        difficultyLevel: 'basic'
      },
      {
        category: 'Routine Inquiries',
        subcategory: 'Product Availability',
        description: 'Checking if a product is in stock',
        customerQuery: 'Do you have hydraulic pumps in stock?',
        context: {
          productData: [
            { name: 'Hydraulic Pump A4VTG71', inStock: true, price: '$2,450' },
            { name: 'Cifa Mixer Pump', inStock: false, price: '$3,200' }
          ]
        },
        expectedBehaviors: [
          'Lists available pumps',
          'Provides specific product names',
          'Mentions prices if available',
          'Offers alternatives for out-of-stock items'
        ],
        failureIndicators: [
          'Generic response without specifics',
          'Asks for verification for product inquiry',
          'Fails to mention available options'
        ],
        weight: 2,
        difficultyLevel: 'basic'
      },
      {
        category: 'Routine Inquiries',
        subcategory: 'Shipping Information',
        description: 'General shipping policy question',
        customerQuery: 'How much does shipping cost to California?',
        expectedBehaviors: [
          'Provides shipping rates or rate structure',
          'Mentions delivery timeframes',
          'Notes any free shipping thresholds',
          'Explains calculation method if dynamic'
        ],
        failureIndicators: [
          'Asks for order details for general inquiry',
          'No specific information provided',
          'Requests verification for policy info'
        ],
        weight: 2,
        difficultyLevel: 'basic'
      }
    );

    // 2. COMPLEX PROBLEM SOLVING
    this.scenarios.push(
      {
        category: 'Complex Problem Solving',
        subcategory: 'Order Issues',
        description: 'Missing items from delivered order',
        customerQuery: 'I received my order #12345 but two items are missing. The hydraulic valve and pump connector that I paid for aren\'t in the box.',
        context: {
          verificationLevel: 'full',
          customerData: {
            email: 'john@example.com',
            orders: [{
              number: '12345',
              date: '2024-01-10',
              status: 'delivered',
              items: [
                'Hydraulic Valve HV-200',
                'Pump Connector PC-15',
                'Filter Set FS-3'
              ],
              total: '$450.00'
            }]
          }
        },
        expectedBehaviors: [
          'Acknowledges the issue immediately',
          'Apologizes for the inconvenience',
          'Confirms the missing items',
          'Offers immediate resolution (replacement/refund)',
          'Provides timeline for resolution',
          'May offer compensation for inconvenience'
        ],
        failureIndicators: [
          'Doubts customer claim',
          'No clear resolution offered',
          'Asks customer to prove items missing',
          'Deflects responsibility'
        ],
        weight: 5,
        difficultyLevel: 'intermediate'
      },
      {
        category: 'Complex Problem Solving',
        subcategory: 'Technical Support',
        description: 'Product compatibility issue',
        customerQuery: 'I bought the A4VTG71 pump but it doesn\'t fit my Cifa mixer. The specs said it was compatible. What can I do?',
        context: {
          verificationLevel: 'full',
          customerData: {
            orders: [{
              number: '11223',
              items: ['Hydraulic Pump A4VTG71'],
              date: '2024-01-08'
            }]
          }
        },
        expectedBehaviors: [
          'Shows understanding of technical issue',
          'Asks clarifying questions about mixer model',
          'Offers troubleshooting steps',
          'Suggests compatible alternatives',
          'Offers return/exchange if incompatible',
          'Provides technical support contact if needed'
        ],
        failureIndicators: [
          'No technical understanding shown',
          'Dismisses compatibility concern',
          'No practical solutions offered',
          'Blames customer for wrong selection'
        ],
        weight: 4,
        difficultyLevel: 'advanced'
      },
      {
        category: 'Complex Problem Solving',
        subcategory: 'Billing Disputes',
        description: 'Charged twice for the same order',
        customerQuery: 'I\'ve been charged twice on my credit card for order #98765. Both charges are for $1,250. This is unacceptable!',
        context: {
          verificationLevel: 'full',
          customerData: {
            orders: [{
              number: '98765',
              total: '$1,250.00',
              status: 'processing',
              date: '2024-01-12'
            }]
          }
        },
        expectedBehaviors: [
          'Immediate acknowledgment of severity',
          'Sincere apology',
          'Confirms will investigate immediately',
          'Explains likely cause (technical glitch, etc.)',
          'Commits to refund timeline',
          'Offers to escalate to billing department',
          'Provides case/reference number'
        ],
        failureIndicators: [
          'Minimizes the issue',
          'No clear timeline for resolution',
          'Suggests customer contact their bank',
          'No accountability taken'
        ],
        weight: 5,
        difficultyLevel: 'intermediate'
      }
    );

    // 3. EMOTIONAL INTELLIGENCE
    this.scenarios.push(
      {
        category: 'Emotional Intelligence',
        subcategory: 'Angry Customer',
        description: 'Extremely frustrated customer with late delivery',
        customerQuery: 'WHERE IS MY ORDER?? It\'s been 2 WEEKS! This is RIDICULOUS! You people are incompetent! I needed this for my business and now I\'m losing money because of YOU!',
        context: {
          verificationLevel: 'full',
          customerData: {
            orders: [{
              number: '77889',
              status: 'in_transit',
              date: '2024-01-01',
              expectedDelivery: '2024-01-05'
            }]
          }
        },
        expectedBehaviors: [
          'Remains calm and professional',
          'Acknowledges frustration without being defensive',
          'Sincere apology for the delay',
          'Shows empathy for business impact',
          'Provides specific tracking information',
          'Offers expedited shipping or compensation',
          'Takes ownership of the situation'
        ],
        failureIndicators: [
          'Defensive or argumentative tone',
          'Ignores emotional state',
          'Generic apology without empathy',
          'No concrete solution offered',
          'Blames shipping company only'
        ],
        weight: 5,
        difficultyLevel: 'advanced'
      },
      {
        category: 'Emotional Intelligence',
        subcategory: 'Anxious Customer',
        description: 'Worried about order for important event',
        customerQuery: 'Hi, I\'m really worried... I ordered items for my daughter\'s wedding next week and the tracking hasn\'t updated in 3 days. Order #44556. This is really important to us.',
        context: {
          verificationLevel: 'full',
          customerData: {
            orders: [{
              number: '44556',
              status: 'in_transit',
              lastUpdate: '3 days ago'
            }]
          }
        },
        expectedBehaviors: [
          'Reassuring tone',
          'Acknowledges importance of the event',
          'Provides detailed tracking investigation',
          'Offers to contact carrier directly',
          'Provides backup plan if needed',
          'Regular update commitment',
          'Shows genuine care'
        ],
        failureIndicators: [
          'Dismissive of concerns',
          'No empathy for special occasion',
          'Generic tracking response',
          'No proactive solutions'
        ],
        weight: 4,
        difficultyLevel: 'intermediate'
      },
      {
        category: 'Emotional Intelligence',
        subcategory: 'Disappointed Customer',
        description: 'Product didn\'t meet expectations',
        customerQuery: 'I\'m really disappointed. The pump I bought based on your site\'s description doesn\'t work as advertised. It\'s much weaker than stated. I feel misled.',
        context: {
          verificationLevel: 'full'
        },
        expectedBehaviors: [
          'Validates customer feelings',
          'Apologizes for unmet expectations',
          'Asks for specific performance issues',
          'Offers immediate return/exchange',
          'Suggests suitable alternatives',
          'May offer discount on replacement',
          'Commits to updating product description'
        ],
        failureIndicators: [
          'Dismisses disappointment',
          'Defends product without listening',
          'No solution offered',
          'Blames customer usage'
        ],
        weight: 4,
        difficultyLevel: 'intermediate'
      }
    );

    // 4. TECHNICAL KNOWLEDGE
    this.scenarios.push(
      {
        category: 'Technical Knowledge',
        subcategory: 'Product Specifications',
        description: 'Detailed technical question',
        customerQuery: 'What\'s the maximum operating pressure and flow rate for the A4VTG71 pump? Also, is it compatible with mineral oil or do I need synthetic hydraulic fluid?',
        expectedBehaviors: [
          'Provides specific technical data',
          'Mentions pressure ratings accurately',
          'Discusses fluid compatibility',
          'May reference documentation',
          'Offers to send detailed specs',
          'Suggests consultation for complex needs'
        ],
        failureIndicators: [
          'Vague or generic response',
          'No technical details provided',
          'Incorrect information',
          'Deflects to "check manual"'
        ],
        weight: 3,
        difficultyLevel: 'advanced'
      },
      {
        category: 'Technical Knowledge',
        subcategory: 'Troubleshooting',
        description: 'Equipment malfunction diagnosis',
        customerQuery: 'My hydraulic pump is making a whining noise and the pressure drops intermittently. It\'s only 6 months old. What could be wrong?',
        expectedBehaviors: [
          'Shows technical understanding',
          'Asks diagnostic questions',
          'Suggests common causes (cavitation, air, wear)',
          'Provides troubleshooting steps',
          'Mentions warranty coverage',
          'Offers service options'
        ],
        failureIndicators: [
          'No technical insight',
          'Immediately suggests replacement',
          'No troubleshooting offered',
          'Dismisses issue'
        ],
        weight: 4,
        difficultyLevel: 'expert'
      }
    );

    // 5. UPSELLING & CROSS-SELLING
    this.scenarios.push(
      {
        category: 'Upselling & Cross-selling',
        subcategory: 'Complementary Products',
        description: 'Opportunity to suggest related items',
        customerQuery: 'I\'d like to order the A4VTG71 hydraulic pump.',
        context: {
          productData: [
            { name: 'Hydraulic Fluid Premium', price: '$45' },
            { name: 'Pump Installation Kit', price: '$125' },
            { name: 'Extended Warranty', price: '$200' }
          ]
        },
        expectedBehaviors: [
          'Confirms the pump order',
          'Suggests compatible hydraulic fluid',
          'Mentions installation kit benefits',
          'Offers warranty option',
          'Explains value of additions',
          'Not pushy - customer-benefit focused'
        ],
        failureIndicators: [
          'No additional suggestions',
          'Overly aggressive selling',
          'Irrelevant product suggestions',
          'No value explanation'
        ],
        weight: 3,
        difficultyLevel: 'intermediate'
      }
    );

    // 6. COMPLIANCE & SECURITY
    this.scenarios.push(
      {
        category: 'Compliance & Security',
        subcategory: 'Verification Process',
        description: 'Proper verification before sharing sensitive info',
        customerQuery: 'Can you tell me what credit card I used for my last order?',
        context: {
          verificationLevel: 'none'
        },
        expectedBehaviors: [
          'Recognizes sensitive information request',
          'Requires email verification first',
          'Explains security protocol',
          'Never shares full card details',
          'May share last 4 digits only after verification'
        ],
        failureIndicators: [
          'Shares information without verification',
          'No security awareness shown',
          'Provides full card details'
        ],
        weight: 5,
        difficultyLevel: 'basic'
      },
      {
        category: 'Compliance & Security',
        subcategory: 'Data Privacy',
        description: 'GDPR/Privacy compliance request',
        customerQuery: 'I want all my personal data deleted from your systems immediately. This is my right under GDPR.',
        expectedBehaviors: [
          'Acknowledges privacy rights',
          'Confirms ability to process request',
          'Explains deletion process',
          'Mentions data retention requirements',
          'Provides timeline (usually 30 days)',
          'Offers data export option first'
        ],
        failureIndicators: [
          'Dismisses privacy rights',
          'No clear process explained',
          'Refuses without valid reason',
          'No timeline provided'
        ],
        weight: 4,
        difficultyLevel: 'intermediate'
      }
    );

    // 7. EDGE CASES
    this.scenarios.push(
      {
        category: 'Edge Cases',
        subcategory: 'Unusual Request',
        description: 'Bulk order with special requirements',
        customerQuery: 'I need 500 hydraulic pumps delivered to 10 different locations across Europe, with staggered delivery dates over 3 months. Each shipment needs custom labeling and our company PO on the invoice. Can you handle this?',
        expectedBehaviors: [
          'Shows enthusiasm for large order',
          'Confirms ability to handle or escalates',
          'Asks for specific requirements list',
          'Mentions bulk discount possibility',
          'Suggests dedicated account manager',
          'Proposes formal quote process',
          'Discusses logistics coordination'
        ],
        failureIndicators: [
          'Says "no" without alternatives',
          'No escalation offered',
          'Overwhelmed response',
          'No structured approach'
        ],
        weight: 4,
        difficultyLevel: 'expert'
      },
      {
        category: 'Edge Cases',
        subcategory: 'Competitor Mention',
        description: 'Customer comparing with competitor',
        customerQuery: 'Your competitor sells the same pump for $200 less. Why should I buy from you?',
        expectedBehaviors: [
          'Remains professional about competitor',
          'Highlights unique value propositions',
          'Mentions quality differences',
          'Discusses service/support advantages',
          'May offer price match if policy exists',
          'Focuses on total value not just price'
        ],
        failureIndicators: [
          'Badmouths competitor',
          'No value differentiation',
          'Immediately drops price',
          'Defensive response'
        ],
        weight: 3,
        difficultyLevel: 'advanced'
      },
      {
        category: 'Edge Cases',
        subcategory: 'Language Barrier',
        description: 'Customer with limited English',
        customerQuery: 'Hello... my English not so good. I need... how you say... the machine for water move? For farm. You understand?',
        expectedBehaviors: [
          'Patient and understanding',
          'Uses simple, clear language',
          'Confirms understanding',
          'Asks clarifying questions gently',
          'Suggests "water pump" for farm',
          'Lists agricultural pump options',
          'Offers translation help if available'
        ],
        failureIndicators: [
          'Impatient or dismissive',
          'Uses complex language',
          'No effort to understand',
          'No clarification attempts'
        ],
        weight: 3,
        difficultyLevel: 'intermediate'
      }
    );

    // 8. COMMUNICATION SKILLS
    this.scenarios.push(
      {
        category: 'Communication Skills',
        subcategory: 'Clarity',
        description: 'Complex explanation needed',
        customerQuery: 'I don\'t understand the difference between all these pump models. Can you explain which one I need for a 50HP motor running at 1800 RPM?',
        expectedBehaviors: [
          'Breaks down technical info simply',
          'Uses analogies if helpful',
          'Asks about specific application',
          'Provides clear recommendation',
          'Explains reasoning',
          'Avoids jargon overload'
        ],
        failureIndicators: [
          'Overly technical response',
          'No clear recommendation',
          'Confusing explanation',
          'Information dump'
        ],
        weight: 3,
        difficultyLevel: 'intermediate'
      },
      {
        category: 'Communication Skills',
        subcategory: 'Conciseness',
        description: 'Quick answer needed',
        customerQuery: 'Quick question - do you ship to Canada?',
        expectedBehaviors: [
          'Direct yes/no answer first',
          'Brief additional info (rates/time)',
          'Offers more details if needed',
          'Respects customer\'s time'
        ],
        failureIndicators: [
          'Overly long response',
          'Doesn\'t answer directly',
          'Unnecessary information'
        ],
        weight: 2,
        difficultyLevel: 'basic'
      }
    );
  }

  async evaluateResponse(scenario: TestScenario, response: string): Promise<TestResult> {
    const startTime = Date.now();
    
    // Analyze response against expected behaviors and failure indicators
    let score = 0;
    const maxScore = scenario.expectedBehaviors.length;
    const notes: string[] = [];
    
    // Check for expected behaviors
    for (const behavior of scenario.expectedBehaviors) {
      // This is a simplified check - in production, use NLP/sentiment analysis
      const behaviorMet = this.checkBehaviorInResponse(response, behavior);
      if (behaviorMet) {
        score++;
        notes.push(`✓ ${behavior}`);
      } else {
        notes.push(`✗ Missing: ${behavior}`);
      }
    }
    
    // Check for failure indicators (deduct points)
    for (const indicator of scenario.failureIndicators) {
      if (this.checkBehaviorInResponse(response, indicator)) {
        score = Math.max(0, score - 0.5);
        notes.push(`⚠️ Issue: ${indicator}`);
      }
    }
    
    const normalizedScore = (score / maxScore) * 100;
    const passed = normalizedScore >= 70; // 70% threshold for passing
    
    return {
      scenario,
      response,
      score: normalizedScore,
      passed,
      notes,
      timeTaken: Date.now() - startTime
    };
  }

  private checkBehaviorInResponse(response: string, behavior: string): boolean {
    // Simplified keyword matching - in production, use advanced NLP
    const responseL= response.toLowerCase();
    const behaviorKeywords = this.extractKeywords(behavior);
    
    let matchCount = 0;
    for (const keyword of behaviorKeywords) {
      if (responseL.includes(keyword.toLowerCase())) {
        matchCount++;
      }
    }
    
    // Consider behavior met if >50% keywords found
    return matchCount >= behaviorKeywords.length * 0.5;
  }

  private extractKeywords(text: string): string[] {
    // Extract meaningful keywords from behavior description
    const stopWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for'];
    return text
      .split(/\s+/)
      .filter(word => 
        word.length > 3 && 
        !stopWords.includes(word.toLowerCase())
      );
  }

  async runTestSuite(options?: {
    categories?: string[];
    difficultyLevels?: string[];
    sampleSize?: number;
  }): Promise<void> {
    console.log('🧪 Customer Service Agent Comprehensive Test Suite');
    console.log('=' .repeat(60));
    
    let testScenarios = this.scenarios;
    
    // Filter by categories if specified
    if (options?.categories) {
      testScenarios = testScenarios.filter(s => 
        options.categories!.includes(s.category)
      );
    }
    
    // Filter by difficulty if specified
    if (options?.difficultyLevels) {
      testScenarios = testScenarios.filter(s => 
        options.difficultyLevels!.includes(s.difficultyLevel)
      );
    }
    
    // Sample if specified
    if (options?.sampleSize) {
      testScenarios = this.sampleScenarios(testScenarios, options.sampleSize);
    }
    
    console.log(`Running ${testScenarios.length} test scenarios...\n`);
    
    for (const scenario of testScenarios) {
      console.log(`\n📋 Test: ${scenario.category} - ${scenario.subcategory || 'General'}`);
      console.log(`   Difficulty: ${scenario.difficultyLevel.toUpperCase()}`);
      console.log(`   Scenario: ${scenario.description}`);
      console.log(`   Query: "${scenario.customerQuery}"`);
      
      // Generate agent response
      const context = this.agent.buildCompleteContext(
        scenario.context?.verificationLevel || 'none',
        this.buildCustomerContext(scenario.context?.customerData),
        '',
        scenario.customerQuery
      );
      
      // Here you would call your actual AI/chat endpoint
      // For now, we'll simulate with the context
      console.log(`   Context Generated: ${context.substring(0, 100)}...`);
      
      // Simulate response (in production, call actual AI)
      const mockResponse = await this.getMockResponse(scenario);
      
      // Evaluate the response
      const result = await this.evaluateResponse(scenario, mockResponse);
      this.results.push(result);
      
      console.log(`   Score: ${result.score.toFixed(1)}% ${result.passed ? '✅ PASSED' : '❌ FAILED'}`);
      console.log(`   Time: ${result.timeTaken}ms`);
      
      if (result.notes.length > 0) {
        console.log('   Notes:');
        result.notes.slice(0, 3).forEach(note => console.log(`     ${note}`));
      }
    }
    
    this.generateReport();
  }

  private sampleScenarios(scenarios: TestScenario[], size: number): TestScenario[] {
    const shuffled = [...scenarios].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, Math.min(size, scenarios.length));
  }

  private buildCustomerContext(customerData?: any): string {
    if (!customerData) return '';
    
    let context = 'Customer Information:\n';
    
    if (customerData.email) {
      context += `Email: ${customerData.email}\n`;
    }
    
    if (customerData.orders) {
      context += `\nRecent Orders:\n`;
      context += this.agent.formatOrdersForAI(customerData.orders);
    }
    
    return context;
  }

  private async getMockResponse(scenario: TestScenario): Promise<string> {
    // In production, this would call your actual AI endpoint
    // For testing, return appropriate mock responses
    
    const mockResponses: Record<string, string> = {
      'Business Hours': 'We\'re open Monday-Friday 9 AM to 6 PM, and Saturday 10 AM to 4 PM. We\'re closed on Sundays. You can also reach us 24/7 through our website or email support@example.com.',
      'Product Availability': 'Great question! I have the Hydraulic Pump A4VTG71 in stock at $2,450. Unfortunately, the Cifa Mixer Pump is currently out of stock, but I expect new inventory next week. Would you like me to notify you when it arrives?',
      // Add more mock responses as needed
    };
    
    return mockResponses[scenario.subcategory || ''] || 
           'Thank you for your inquiry. Let me help you with that...';
  }

  private generateReport(): void {
    console.log('\n' + '='.repeat(60));
    console.log('📊 TEST SUITE SUMMARY REPORT');
    console.log('='.repeat(60));
    
    // Overall statistics
    const totalTests = this.results.length;
    const passedTests = this.results.filter(r => r.passed).length;
    const overallScore = this.results.reduce((sum, r) => sum + r.score, 0) / totalTests;
    
    console.log(`\n📈 Overall Performance:`);
    console.log(`   Total Tests: ${totalTests}`);
    console.log(`   Passed: ${passedTests} (${((passedTests/totalTests)*100).toFixed(1)}%)`);
    console.log(`   Failed: ${totalTests - passedTests}`);
    console.log(`   Average Score: ${overallScore.toFixed(1)}%`);
    
    // Performance by category
    console.log(`\n📊 Performance by Category:`);
    const categories = Array.from(new Set(this.results.map(r => r.scenario.category)));
    
    for (const category of categories) {
      const categoryResults = this.results.filter(r => r.scenario.category === category);
      const categoryScore = categoryResults.reduce((sum, r) => sum + r.score, 0) / categoryResults.length;
      const categoryPassed = categoryResults.filter(r => r.passed).length;
      
      console.log(`   ${category}:`);
      console.log(`     - Tests: ${categoryResults.length}`);
      console.log(`     - Pass Rate: ${((categoryPassed/categoryResults.length)*100).toFixed(1)}%`);
      console.log(`     - Avg Score: ${categoryScore.toFixed(1)}%`);
    }
    
    // Performance by difficulty
    console.log(`\n🎯 Performance by Difficulty:`);
    const difficulties = ['basic', 'intermediate', 'advanced', 'expert'];
    
    for (const difficulty of difficulties) {
      const diffResults = this.results.filter(r => r.scenario.difficultyLevel === difficulty);
      if (diffResults.length === 0) continue;
      
      const diffScore = diffResults.reduce((sum, r) => sum + r.score, 0) / diffResults.length;
      console.log(`   ${difficulty.toUpperCase()}: ${diffScore.toFixed(1)}% (${diffResults.length} tests)`);
    }
    
    // Weakest areas (need improvement)
    console.log(`\n⚠️ Areas Needing Improvement:`);
    const failedResults = this.results
      .filter(r => !r.passed)
      .sort((a, b) => a.score - b.score)
      .slice(0, 5);
    
    failedResults.forEach(result => {
      console.log(`   - ${result.scenario.category} / ${result.scenario.subcategory}: ${result.score.toFixed(1)}%`);
    });
    
    // Strongest areas
    console.log(`\n✨ Strongest Performance Areas:`);
    const topResults = this.results
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);
    
    topResults.forEach(result => {
      console.log(`   - ${result.scenario.category} / ${result.scenario.subcategory}: ${result.score.toFixed(1)}%`);
    });
    
    // Final verdict
    console.log(`\n🎯 FINAL VERDICT:`);
    if (overallScore >= 85) {
      console.log('   ✅ EXCELLENT: Agent performs at expert customer service level');
    } else if (overallScore >= 70) {
      console.log('   ✅ GOOD: Agent meets experienced customer service standards');
    } else if (overallScore >= 60) {
      console.log('   ⚠️ ADEQUATE: Agent needs improvement in some areas');
    } else {
      console.log('   ❌ NEEDS IMPROVEMENT: Agent does not meet professional standards');
    }
    
    // Recommendations
    console.log(`\n💡 Recommendations:`);
    if (overallScore < 70) {
      const weakCategories = categories
        .map(cat => ({
          name: cat,
          score: this.results
            .filter(r => r.scenario.category === cat)
            .reduce((sum, r) => sum + r.score, 0) / 
            this.results.filter(r => r.scenario.category === cat).length
        }))
        .sort((a, b) => a.score - b.score)
        .slice(0, 3);
      
      weakCategories.forEach(cat => {
        console.log(`   - Focus training on ${cat.name} (current: ${cat.score.toFixed(1)}%)`);
      });
    } else {
      console.log('   - Continue monitoring performance');
      console.log('   - Add more edge case scenarios');
      console.log('   - Regular retraining on failed scenarios');
    }
    
    console.log('\n' + '='.repeat(60));
  }
}

// Main execution
async function main() {
  const testSuite = new CustomerServiceTestSuite();
  
  // Run different test configurations
  const args = process.argv.slice(2);
  
  if (args.includes('--quick')) {
    // Quick test with sample
    console.log('Running quick test (sample of 10 scenarios)...\n');
    await testSuite.runTestSuite({
      sampleSize: 10
    });
  } else if (args.includes('--category')) {
    // Test specific category
    const categoryIndex = args.indexOf('--category');
    const category = args[categoryIndex + 1];
    console.log(`Running tests for category: ${category}\n`);
    await testSuite.runTestSuite({
      categories: [category]
    });
  } else if (args.includes('--difficulty')) {
    // Test specific difficulty
    const diffIndex = args.indexOf('--difficulty');
    const difficulty = args[diffIndex + 1];
    console.log(`Running tests for difficulty: ${difficulty}\n`);
    await testSuite.runTestSuite({
      difficultyLevels: [difficulty]
    });
  } else {
    // Run full test suite
    console.log('Running full test suite...\n');
    await testSuite.runTestSuite();
  }
}

// Run the tests
main().catch(console.error);

// Export for use in other tests
export { CustomerServiceTestSuite, TestScenario, TestResult };