#!/usr/bin/env npx tsx
/**
 * Comprehensive Agent Conversation Test Suite
 * Tests multi-turn conversations, topic switching, context retention, and history referencing
 */

import { v4 as uuidv4 } from 'uuid';
import chalk from 'chalk';

const API_URL = process.env.API_URL || 'http://localhost:3000/api/chat';
const TEST_DOMAIN = process.env.TEST_DOMAIN || 'thompsonseparts.co.uk';

interface ChatRequest {
  message: string;
  conversation_id?: string;
  session_id: string;
  domain: string;
  config?: {
    features?: {
      woocommerce?: { enabled: boolean };
      websiteScraping?: { enabled: boolean };
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
}

interface TestScenario {
  name: string;
  description: string;
  messages: Array<{
    input: string;
    expectations: {
      shouldContain?: string[];
      shouldNotContain?: string[];
      shouldReferenceHistory?: boolean;
      shouldMaintainContext?: boolean;
      contextKeywords?: string[];
    };
  }>;
}

class ConversationTester {
  private sessionId: string;
  private conversationId?: string;
  private messageHistory: Array<{ input: string; response: string }> = [];

  constructor() {
    this.sessionId = uuidv4();
  }

  async sendMessage(message: string): Promise<ChatResponse> {
    // Create abort controller with 60 second timeout per request
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 60000);
    
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          conversation_id: this.conversationId,
          session_id: this.sessionId,
          domain: TEST_DOMAIN,
          config: {
            features: {
              woocommerce: { enabled: true },
              websiteScraping: { enabled: true },
            },
          },
        } as ChatRequest),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`Chat API error: ${response.status} ${response.statusText}`);
      }

      const data: ChatResponse = await response.json();
      this.conversationId = data.conversation_id;
      this.messageHistory.push({ input: message, response: data.message });
      return data;
    } finally {
      clearTimeout(timeout);
    }
  }

  async runScenario(scenario: TestScenario): Promise<boolean> {
    console.log(chalk.cyan(`\n📋 Running Scenario: ${scenario.name}`));
    console.log(chalk.gray(`   ${scenario.description}`));
    console.log(chalk.gray('   ' + '─'.repeat(60)));

    let allTestsPassed = true;

    for (let i = 0; i < scenario.messages.length; i++) {
      const { input, expectations } = scenario.messages[i];
      
      console.log(chalk.yellow(`\n   Turn ${i + 1}: "${input}"`));
      
      try {
        const response = await this.sendMessage(input);
        console.log(chalk.gray(`   Response: ${response.message.substring(0, 150)}...`));

        const results = this.evaluateExpectations(response.message, expectations);
        
        if (results.passed) {
          console.log(chalk.green(`   ✅ All expectations met`));
        } else {
          console.log(chalk.red(`   ❌ Failed expectations:`));
          results.failures.forEach(failure => {
            console.log(chalk.red(`      - ${failure}`));
          });
          allTestsPassed = false;
        }

        await this.delay(1000);
      } catch (error) {
        console.log(chalk.red(`   ❌ Error: ${error}`));
        allTestsPassed = false;
      }
    }

    return allTestsPassed;
  }

  private evaluateExpectations(
    response: string,
    expectations: TestScenario['messages'][0]['expectations']
  ): { passed: boolean; failures: string[] } {
    const failures: string[] = [];
    const lowerResponse = response.toLowerCase();

    if (expectations.shouldContain) {
      for (const term of expectations.shouldContain) {
        if (!lowerResponse.includes(term.toLowerCase())) {
          failures.push(`Should contain "${term}"`);
        }
      }
    }

    if (expectations.shouldNotContain) {
      for (const term of expectations.shouldNotContain) {
        if (lowerResponse.includes(term.toLowerCase())) {
          failures.push(`Should NOT contain "${term}"`);
        }
      }
    }

    if (expectations.shouldReferenceHistory && this.messageHistory.length > 1) {
      const hasHistoricalReference = this.checkHistoricalReference(response);
      if (!hasHistoricalReference) {
        failures.push('Should reference previous conversation');
      }
    }

    if (expectations.shouldMaintainContext && expectations.contextKeywords) {
      const maintainsContext = expectations.contextKeywords.some(keyword =>
        lowerResponse.includes(keyword.toLowerCase())
      );
      if (!maintainsContext) {
        failures.push(`Should maintain context with keywords: ${expectations.contextKeywords.join(', ')}`);
      }
    }

    return {
      passed: failures.length === 0,
      failures,
    };
  }

  private checkHistoricalReference(response: string): boolean {
    const lowerResponse = response.toLowerCase();
    const historicalPhrases = [
      'as mentioned',
      'you asked',
      'earlier',
      'previously',
      'before',
      'you said',
      'we discussed',
      'referring to',
      'about the',
      'regarding',
    ];
    
    return historicalPhrases.some(phrase => lowerResponse.includes(phrase));
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  reset(): void {
    this.sessionId = uuidv4();
    this.conversationId = undefined;
    this.messageHistory = [];
  }
}

const testScenarios: TestScenario[] = [
  {
    name: 'Basic Context Retention',
    description: 'Test if the agent remembers information from earlier in the conversation',
    messages: [
      {
        input: 'I need a hydraulic pump for my Cifa mixer',
        expectations: {
          shouldContain: ['pump', 'cifa'],
          shouldMaintainContext: true,
          contextKeywords: ['pump', 'hydraulic', 'cifa'],
        },
      },
      {
        input: 'What models do you have available?',
        expectations: {
          shouldMaintainContext: true,
          contextKeywords: ['pump', 'model', 'hydraulic'],
          shouldReferenceHistory: false,
        },
      },
      {
        input: 'Tell me more about the first one',
        expectations: {
          shouldMaintainContext: true,
          contextKeywords: ['pump'],
          shouldReferenceHistory: true,
        },
      },
    ],
  },
  {
    name: 'Topic Switching and Return',
    description: 'Test if the agent can handle topic changes and return to previous topics',
    messages: [
      {
        input: 'What hydraulic pumps do you have for Cifa mixers?',
        expectations: {
          shouldContain: ['pump', 'cifa'],
        },
      },
      {
        input: 'Actually, do you ship internationally?',
        expectations: {
          shouldContain: ['ship'],
          shouldNotContain: ['pump'],
        },
      },
      {
        input: 'How much does shipping to France cost?',
        expectations: {
          shouldMaintainContext: true,
          contextKeywords: ['france', 'ship', 'cost'],
        },
      },
      {
        input: 'OK, back to the pumps - what was the price of the A4VTG90?',
        expectations: {
          shouldContain: ['pump', 'a4vtg90'],
          shouldReferenceHistory: true,
          shouldMaintainContext: true,
          contextKeywords: ['pump', 'price'],
        },
      },
    ],
  },
  {
    name: 'Complex Multi-Turn Order Inquiry',
    description: 'Test handling of order-related questions with context',
    messages: [
      {
        input: 'I want to check on my order',
        expectations: {
          shouldContain: ['email', 'order'],
        },
      },
      {
        input: 'My email is samguy@thompsonsuk.com',
        expectations: {
          shouldContain: ['order'],
          shouldMaintainContext: true,
          contextKeywords: ['order'],
        },
      },
      {
        input: 'Why is it on hold?',
        expectations: {
          shouldMaintainContext: true,
          contextKeywords: ['hold', 'order', 'status'],
          shouldReferenceHistory: true,
        },
      },
      {
        input: 'Can you expedite the shipping?',
        expectations: {
          shouldMaintainContext: true,
          contextKeywords: ['ship', 'order'],
        },
      },
    ],
  },
  {
    name: 'Numbered List Reference',
    description: 'Test if agent understands references to numbered items',
    messages: [
      {
        input: 'Show me all Cifa mixer pumps you have',
        expectations: {
          shouldContain: ['cifa', 'pump'],
        },
      },
      {
        input: 'Tell me more about item 2',
        expectations: {
          shouldReferenceHistory: true,
          shouldMaintainContext: true,
          contextKeywords: ['pump'],
        },
      },
      {
        input: 'Is that one in stock?',
        expectations: {
          shouldMaintainContext: true,
          contextKeywords: ['stock', 'available'],
          shouldReferenceHistory: true,
        },
      },
    ],
  },
  {
    name: 'Clarification and Correction',
    description: 'Test if agent handles clarifications and corrections properly',
    messages: [
      {
        input: 'I need parts for my ZF5 pump',
        expectations: {
          shouldContain: ['zf5', 'pump', 'parts'],
        },
      },
      {
        input: 'Sorry, I meant ZF4 not ZF5',
        expectations: {
          shouldContain: ['zf4'],
          shouldReferenceHistory: true,
          shouldMaintainContext: true,
          contextKeywords: ['pump', 'parts'],
        },
      },
      {
        input: 'What\'s the difference between them?',
        expectations: {
          shouldContain: ['zf4', 'zf5'],
          shouldReferenceHistory: true,
          shouldMaintainContext: true,
          contextKeywords: ['difference', 'pump'],
        },
      },
    ],
  },
  {
    name: 'Pronoun Resolution',
    description: 'Test if agent correctly resolves pronouns and references',
    messages: [
      {
        input: 'Do you have the Cifa Mixer Hydraulic Pump A4VTG90?',
        expectations: {
          shouldContain: ['a4vtg90', 'pump'],
        },
      },
      {
        input: 'How much does it cost?',
        expectations: {
          shouldMaintainContext: true,
          contextKeywords: ['price', 'cost', 'pump'],
          shouldReferenceHistory: true,
        },
      },
      {
        input: 'Do you have any alternatives to it?',
        expectations: {
          shouldMaintainContext: true,
          contextKeywords: ['alternative', 'pump'],
          shouldReferenceHistory: true,
        },
      },
      {
        input: 'Which one would you recommend?',
        expectations: {
          shouldMaintainContext: true,
          contextKeywords: ['recommend', 'pump'],
        },
      },
    ],
  },
  {
    name: 'Complex Topic Weaving',
    description: 'Test handling of multiple interwoven topics',
    messages: [
      {
        input: 'I need a pump for my Cifa mixer and also some spare seals',
        expectations: {
          shouldContain: ['pump', 'cifa', 'seals'],
        },
      },
      {
        input: 'Let\'s focus on the pump first. What options do I have?',
        expectations: {
          shouldContain: ['pump', 'option'],
          shouldMaintainContext: true,
          contextKeywords: ['pump', 'cifa'],
        },
      },
      {
        input: 'OK, and for the seals?',
        expectations: {
          shouldContain: ['seal'],
          shouldReferenceHistory: true,
        },
      },
      {
        input: 'Can I get a discount if I buy both?',
        expectations: {
          shouldContain: ['discount', 'both'],
          shouldReferenceHistory: true,
          shouldMaintainContext: true,
          contextKeywords: ['pump', 'seal'],
        },
      },
      {
        input: 'What\'s the total if I get the A4VTG90 pump and a seal kit?',
        expectations: {
          shouldContain: ['total', 'a4vtg90', 'seal'],
          shouldReferenceHistory: true,
        },
      },
    ],
  },
  {
    name: 'Time-Based Context',
    description: 'Test if agent understands temporal references',
    messages: [
      {
        input: 'What new products did you get this month?',
        expectations: {
          shouldContain: ['product', 'new'],
        },
      },
      {
        input: 'And last month?',
        expectations: {
          shouldReferenceHistory: true,
          shouldMaintainContext: true,
          contextKeywords: ['product', 'month'],
        },
      },
      {
        input: 'Show me the most popular ones from what you mentioned',
        expectations: {
          shouldReferenceHistory: true,
          shouldContain: ['popular'],
          shouldMaintainContext: true,
          contextKeywords: ['product'],
        },
      },
    ],
  },
];

async function runAllTests() {
  console.log(chalk.bold.cyan('\n🤖 COMPREHENSIVE AGENT CONVERSATION TEST SUITE'));
  console.log(chalk.bold.cyan('=' .repeat(70)));
  console.log(chalk.gray(`Testing API: ${API_URL}`));
  console.log(chalk.gray(`Test Domain: ${TEST_DOMAIN}`));
  console.log(chalk.gray(`Total Scenarios: ${testScenarios.length}`));

  const results: { scenario: string; passed: boolean }[] = [];
  
  for (const scenario of testScenarios) {
    const tester = new ConversationTester();
    const passed = await tester.runScenario(scenario);
    results.push({ scenario: scenario.name, passed });
    
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  console.log(chalk.bold.cyan('\n' + '=' .repeat(70)));
  console.log(chalk.bold.cyan('📊 TEST RESULTS SUMMARY'));
  console.log(chalk.bold.cyan('=' .repeat(70)));

  const passedCount = results.filter(r => r.passed).length;
  const failedCount = results.filter(r => !r.passed).length;

  results.forEach(result => {
    const icon = result.passed ? chalk.green('✅') : chalk.red('❌');
    const status = result.passed ? chalk.green('PASSED') : chalk.red('FAILED');
    console.log(`${icon} ${result.scenario}: ${status}`);
  });

  console.log(chalk.cyan('\n' + '─'.repeat(70)));
  console.log(chalk.bold(`Total Passed: ${chalk.green(passedCount)}/${testScenarios.length}`));
  console.log(chalk.bold(`Total Failed: ${chalk.red(failedCount)}/${testScenarios.length}`));
  
  const passRate = (passedCount / testScenarios.length * 100).toFixed(1);
  const color = passedCount === testScenarios.length ? chalk.green : 
                passedCount > testScenarios.length / 2 ? chalk.yellow : chalk.red;
  
  console.log(chalk.bold(`Pass Rate: ${color(passRate + '%')}`));
  console.log(chalk.cyan('=' .repeat(70)));

  process.exit(failedCount > 0 ? 1 : 0);
}

runAllTests().catch(error => {
  console.error(chalk.red('Fatal error:'), error);
  process.exit(1);
});