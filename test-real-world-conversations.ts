#!/usr/bin/env npx tsx
/**
 * Real-World Conversation Validator
 *
 * Tests the AI chat agent with realistic customer scenarios using actual inventory.
 * More valuable than synthetic tests because it shows real user experience.
 *
 * Usage:
 *   npx tsx test-real-world-conversations.ts
 *   npx tsx test-real-world-conversations.ts --scenario=product-inquiry
 */

import { v4 as uuidv4 } from 'uuid';
import chalk from 'chalk';

const API_URL = process.env.API_URL || 'http://localhost:3000/api/chat';
const TEST_DOMAIN = process.env.TEST_DOMAIN || 'thompsonseparts.co.uk';

interface ConversationMessage {
  user: string;
  expectations: {
    natural_language: boolean;      // Should sound natural, not robotic
    context_aware: boolean;         // Should remember previous turns
    no_hallucinations: boolean;     // Should not make up products/info
    helpful: boolean;               // Should provide useful information
  };
}

interface RealWorldScenario {
  name: string;
  description: string;
  user_persona: string;
  messages: ConversationMessage[];
}

const REAL_WORLD_SCENARIOS: RealWorldScenario[] = [
  {
    name: 'Product Discovery - Hydraulic Parts',
    description: 'Customer looking for specific hydraulic components',
    user_persona: 'Maintenance technician for Cifa concrete mixers',
    messages: [
      {
        user: "Hi, I need a hydraulic pump for my Cifa mixer",
        expectations: {
          natural_language: true,
          context_aware: false, // First message
          no_hallucinations: true,
          helpful: true
        }
      },
      {
        user: "Do you have the A4VTG90 model?",
        expectations: {
          natural_language: true,
          context_aware: true, // Should remember "hydraulic pump"
          no_hallucinations: true,
          helpful: true
        }
      },
      {
        user: "What's the price?",
        expectations: {
          natural_language: true, // Should say "it's £X" not "Referring to..."
          context_aware: true, // Should know we're talking about A4VTG90
          no_hallucinations: true,
          helpful: true
        }
      },
      {
        user: "Do you have any alternatives?",
        expectations: {
          natural_language: true,
          context_aware: true,
          no_hallucinations: true,
          helpful: true
        }
      }
    ]
  },
  {
    name: 'Multi-Product Inquiry',
    description: 'Customer needs multiple types of parts',
    user_persona: 'Fleet manager ordering parts for multiple machines',
    messages: [
      {
        user: "I need pumps and seals for Cifa mixers",
        expectations: {
          natural_language: true,
          context_aware: false,
          no_hallucinations: true,
          helpful: true
        }
      },
      {
        user: "Let's start with pumps. What do you have?",
        expectations: {
          natural_language: true,
          context_aware: true,
          no_hallucinations: true,
          helpful: true
        }
      },
      {
        user: "OK, now show me the seals",
        expectations: {
          natural_language: true,
          context_aware: true, // Should remember we mentioned seals earlier
          no_hallucinations: true,
          helpful: true
        }
      },
      {
        user: "Can I get a discount if I order both?",
        expectations: {
          natural_language: true, // Should use "both"
          context_aware: true,
          no_hallucinations: true,
          helpful: true
        }
      }
    ]
  },
  {
    name: 'Topic Switching - Product to Shipping',
    description: 'Customer switches from product inquiry to shipping questions',
    user_persona: 'International customer concerned about delivery',
    messages: [
      {
        user: "Do you sell Cifa mixer parts?",
        expectations: {
          natural_language: true,
          context_aware: false,
          no_hallucinations: true,
          helpful: true
        }
      },
      {
        user: "Actually, do you ship to Germany?",
        expectations: {
          natural_language: true,
          context_aware: false, // Topic switch - should NOT mention parts
          no_hallucinations: true,
          helpful: true
        }
      },
      {
        user: "How much is shipping?",
        expectations: {
          natural_language: true,
          context_aware: true, // Should remember Germany
          no_hallucinations: true,
          helpful: true
        }
      }
    ]
  },
  {
    name: 'Correction Handling',
    description: 'Customer corrects themselves mid-conversation',
    user_persona: 'Technician who initially gives wrong model number',
    messages: [
      {
        user: "I need parts for my ZF5 pump",
        expectations: {
          natural_language: true,
          context_aware: false,
          no_hallucinations: true,
          helpful: true
        }
      },
      {
        user: "Sorry, I meant ZF4 not ZF5",
        expectations: {
          natural_language: true,
          context_aware: true, // Should acknowledge correction explicitly
          no_hallucinations: true,
          helpful: true
        }
      },
      {
        user: "What's the difference between them?",
        expectations: {
          natural_language: true,
          context_aware: true, // Should know ZF4 and ZF5
          no_hallucinations: true,
          helpful: true
        }
      }
    ]
  },
  {
    name: 'Quick Order Lookup',
    description: 'Customer wants to check order status',
    user_persona: 'Customer tracking recent purchase',
    messages: [
      {
        user: "Can you check my order status?",
        expectations: {
          natural_language: true,
          context_aware: false,
          no_hallucinations: true,
          helpful: true
        }
      },
      {
        user: "My email is test@example.com",
        expectations: {
          natural_language: true,
          context_aware: true,
          no_hallucinations: true,
          helpful: true
        }
      }
    ]
  }
];

class RealWorldTester {
  private sessionId: string;
  private conversationId?: string;

  constructor() {
    this.sessionId = uuidv4();
  }

  async sendMessage(message: string): Promise<string> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 60000);

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          conversation_id: this.conversationId,
          session_id: this.sessionId,
          domain: TEST_DOMAIN,
          config: {
            features: {
              woocommerce: { enabled: true },
              websiteScraping: { enabled: true }
            }
          }
        }),
        signal: controller.signal
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      this.conversationId = data.conversation_id;
      return data.message;
    } finally {
      clearTimeout(timeout);
    }
  }

  evaluateResponse(
    userMessage: string,
    aiResponse: string,
    expectations: ConversationMessage['expectations']
  ): {
    passed: boolean;
    issues: string[];
    score: number;
  } {
    const issues: string[] = [];
    let score = 0;

    // Check natural language (no robotic "Referring to...")
    if (expectations.natural_language) {
      const roboticPatterns = [
        /Referring to the .{30,}/i,
        /As mentioned in turn \d+/i,
        /You asked about .{30,} in your previous/i
      ];

      const hasRoboticLanguage = roboticPatterns.some(pattern =>
        pattern.test(aiResponse)
      );

      if (hasRoboticLanguage) {
        issues.push('❌ Language too robotic/explicit');
      } else {
        score += 25;
      }
    }

    // Check for hallucinations (making up specific products/prices)
    if (expectations.no_hallucinations) {
      const suspiciousPatterns = [
        /£\d+\.\d{2}/,  // Specific prices (unless from search)
        /SKU: [A-Z0-9]+-[A-Z0-9]+-[A-Z0-9]+/, // Made-up SKUs
        /Part number: [0-9]{10}/  // Fake part numbers
      ];

      // This is a weak check - real validation needs to verify against inventory
      // For now, just check if response admits uncertainty appropriately
      const admitsUncertainty = /I don't have|I can't find|I need to|let me check/i.test(aiResponse);

      if (admitsUncertainty || !suspiciousPatterns.some(p => p.test(aiResponse))) {
        score += 25;
      } else {
        issues.push('⚠️  Possible hallucination (specific details without search)');
      }
    }

    // Check helpfulness (provides useful information or next steps)
    if (expectations.helpful) {
      const helpfulIndicators = [
        /found|available|offer|have|provide/i,
        /let me|I can|would you like/i,
        /search|check|look/i
      ];

      const isHelpful = helpfulIndicators.some(pattern => pattern.test(aiResponse));

      if (isHelpful) {
        score += 25;
      } else {
        issues.push('❌ Response not helpful or actionable');
      }
    }

    // Check context awareness (remembers previous conversation)
    if (expectations.context_aware) {
      // This is hard to check automatically - just verify it's not starting fresh
      const startsFresh = /thanks.*can.*help|how.*may.*assist/i.test(aiResponse);

      if (!startsFresh) {
        score += 25;
      } else {
        issues.push('❌ Lost conversation context');
      }
    }

    return {
      passed: issues.length === 0,
      issues,
      score
    };
  }

  async runScenario(scenario: RealWorldScenario): Promise<{
    passed: boolean;
    totalScore: number;
    maxScore: number;
    results: Array<{
      user: string;
      ai: string;
      passed: boolean;
      issues: string[];
      score: number;
    }>;
  }> {
    console.log(chalk.cyan(`\n📋 Scenario: ${scenario.name}`));
    console.log(chalk.gray(`   ${scenario.description}`));
    console.log(chalk.gray(`   Persona: ${scenario.user_persona}`));
    console.log(chalk.gray('   ────────────────────────────────────────────────────────────\n'));

    const results = [];
    let totalScore = 0;
    const maxScore = scenario.messages.length * 100; // 100 points per message

    for (let i = 0; i < scenario.messages.length; i++) {
      const msg = scenario.messages[i];

      console.log(chalk.blue(`   Turn ${i + 1}: "${msg.user}"`));

      try {
        const aiResponse = await this.sendMessage(msg.user);
        const evaluation = this.evaluateResponse(msg.user, aiResponse, msg.expectations);

        totalScore += evaluation.score;

        // Show AI response (truncated)
        const truncated = aiResponse.length > 150
          ? aiResponse.substring(0, 150) + '...'
          : aiResponse;
        console.log(chalk.gray(`   AI: ${truncated}`));

        // Show evaluation
        if (evaluation.passed) {
          console.log(chalk.green(`   ✅ Pass (${evaluation.score}/100)`));
        } else {
          console.log(chalk.yellow(`   ⚠️  Issues (${evaluation.score}/100):`));
          evaluation.issues.forEach(issue => {
            console.log(chalk.yellow(`      ${issue}`));
          });
        }

        results.push({
          user: msg.user,
          ai: aiResponse,
          passed: evaluation.passed,
          issues: evaluation.issues,
          score: evaluation.score
        });

        console.log('');
      } catch (error) {
        console.log(chalk.red(`   ❌ Error: ${error}`));
        results.push({
          user: msg.user,
          ai: '',
          passed: false,
          issues: [`Error: ${error}`],
          score: 0
        });
      }
    }

    const scenarioPassed = results.every(r => r.passed);
    const percentage = Math.round((totalScore / maxScore) * 100);

    if (scenarioPassed) {
      console.log(chalk.green(`✅ Scenario PASSED (${percentage}%)`));
    } else {
      console.log(chalk.yellow(`⚠️  Scenario PARTIAL (${percentage}%)`));
    }

    return {
      passed: scenarioPassed,
      totalScore,
      maxScore,
      results
    };
  }

  reset() {
    this.sessionId = uuidv4();
    this.conversationId = undefined;
  }
}

async function main() {
  const args = process.argv.slice(2);
  const scenarioFilter = args.find(a => a.startsWith('--scenario='))?.split('=')[1];

  console.log(chalk.bold('\n🌍 REAL-WORLD CONVERSATION VALIDATOR\n'));
  console.log(chalk.gray('Testing with realistic customer scenarios\n'));
  console.log(chalk.gray('═'.repeat(70)));

  const scenariosToRun = scenarioFilter
    ? REAL_WORLD_SCENARIOS.filter(s => s.name.toLowerCase().includes(scenarioFilter.toLowerCase()))
    : REAL_WORLD_SCENARIOS;

  if (scenariosToRun.length === 0) {
    console.log(chalk.red(`\n❌ No scenarios found matching: ${scenarioFilter}\n`));
    return;
  }

  console.log(chalk.gray(`\nRunning ${scenariosToRun.length} scenario(s)...\n`));

  const tester = new RealWorldTester();
  const scenarioResults = [];

  for (const scenario of scenariosToRun) {
    tester.reset();
    const result = await tester.runScenario(scenario);
    scenarioResults.push({
      name: scenario.name,
      ...result
    });
  }

  // Summary
  console.log(chalk.bold('\n═'.repeat(70)));
  console.log(chalk.bold('📊 REAL-WORLD TEST SUMMARY\n'));

  scenarioResults.forEach(result => {
    const percentage = Math.round((result.totalScore / result.maxScore) * 100);
    const status = result.passed ? chalk.green('✅ PASS') : chalk.yellow('⚠️  PARTIAL');
    console.log(`${status} ${result.name} (${percentage}%)`);
  });

  const totalScore = scenarioResults.reduce((sum, r) => sum + r.totalScore, 0);
  const maxScore = scenarioResults.reduce((sum, r) => sum + r.maxScore, 0);
  const overallPercentage = Math.round((totalScore / maxScore) * 100);

  console.log(chalk.gray('─'.repeat(70)));
  console.log(chalk.bold(`Overall Quality: ${overallPercentage}%\n`));

  if (overallPercentage >= 80) {
    console.log(chalk.green('🎉 Excellent! Production ready.'));
  } else if (overallPercentage >= 60) {
    console.log(chalk.yellow('👍 Good! Some room for improvement.'));
  } else {
    console.log(chalk.red('⚠️  Needs work before production.'));
  }

  console.log('');
}

main().catch(console.error);
