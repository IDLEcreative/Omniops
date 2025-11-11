import { v4 as uuidv4 } from 'uuid';
import chalk from 'chalk';
import { API_URL, TEST_DOMAIN } from './constants';
import { ConversationMessage, RealWorldScenario } from './types';

export class RealWorldTester {
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
              websiteScraping: { enabled: true },
            },
          },
        }),
        signal: controller.signal,
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
    aiResponse: string,
    expectations: ConversationMessage['expectations']
  ): { passed: boolean; issues: string[]; score: number } {
    const issues: string[] = [];
    let score = 0;

    if (expectations.natural_language) {
      const roboticPatterns = [
        /Referring to the .{30,}/i,
        /As mentioned in turn \d+/i,
        /You asked about .{30,} in your previous/i,
      ];

      const hasRoboticLanguage = roboticPatterns.some((pattern) => pattern.test(aiResponse));
      if (hasRoboticLanguage) {
        issues.push('❌ Language too robotic/explicit');
      } else {
        score += 25;
      }
    }

    if (expectations.no_hallucinations) {
      const suspiciousPatterns = [/£\d+\.\d{2}/, /SKU: [A-Z0-9-]+/, /Part number: [0-9]{10}/];
      const admitsUncertainty = /I don't have|I can't find|I need to|let me check/i.test(aiResponse);

      if (admitsUncertainty || !suspiciousPatterns.some((p) => p.test(aiResponse))) {
        score += 25;
      } else {
        issues.push('⚠️  Possible hallucination (specific details without search)');
      }
    }

    if (expectations.helpful) {
      const helpfulIndicators = [/found|available|offer|have|provide/i, /let me|I can|would you like/i, /search|check|look/i];
      const isHelpful = helpfulIndicators.some((pattern) => pattern.test(aiResponse));

      if (isHelpful) {
        score += 25;
      } else {
        issues.push('❌ Response not helpful or actionable');
      }
    }

    if (expectations.context_aware) {
      const startsFresh = /thanks.*can.*help|how.*may.*assist/i.test(aiResponse);
      if (!startsFresh) {
        score += 25;
      } else {
        issues.push('❌ Lost conversation context');
      }
    }

    return { passed: issues.length === 0, issues, score };
  }

  async runScenario(scenario: RealWorldScenario) {
    console.log(chalk.cyan(`\n📋 Scenario: ${scenario.name}`));
    console.log(chalk.gray(`   ${scenario.description}`));
    console.log(chalk.gray(`   Persona: ${scenario.user_persona}`));
    console.log(chalk.gray('   ────────────────────────────────────────────────────────────\n'));

    const results: Array<{
      user: string;
      ai: string;
      passed: boolean;
      issues: string[];
      score: number;
    }> = [];

    let totalScore = 0;
    const maxScore = scenario.messages.length * 100;

    for (let i = 0; i < scenario.messages.length; i++) {
      const msg = scenario.messages[i];
      console.log(chalk.blue(`   Turn ${i + 1}: "${msg.user}"`));

      try {
        const aiResponse = await this.sendMessage(msg.user);
        const evaluation = this.evaluateResponse(aiResponse, msg.expectations);

        totalScore += evaluation.score;
        const truncated = aiResponse.length > 150 ? `${aiResponse.substring(0, 150)}...` : aiResponse;
        console.log(chalk.gray(`   AI: ${truncated}`));

        if (evaluation.passed) {
          console.log(chalk.green(`   ✅ Pass (${evaluation.score}/100)`));
        } else {
          console.log(chalk.yellow(`   ⚠️  Issues (${evaluation.score}/100):`));
          evaluation.issues.forEach((issue) => console.log(chalk.yellow(`      ${issue}`)));
        }

        results.push({ user: msg.user, ai: aiResponse, passed: evaluation.passed, issues: evaluation.issues, score: evaluation.score });
        console.log('');
      } catch (error) {
        console.log(chalk.red(`   ❌ Error: ${error}`));
        results.push({ user: msg.user, ai: '', passed: false, issues: [`Error: ${error}`], score: 0 });
      }
    }

    const scenarioPassed = results.every((r) => r.passed);
    const percentage = Math.round((totalScore / maxScore) * 100);

    if (scenarioPassed) {
      console.log(chalk.green(`✅ Scenario PASSED (${percentage}%)`));
    } else {
      console.log(chalk.yellow(`⚠️  Scenario PARTIAL (${percentage}%)`));
    }

    return { passed: scenarioPassed, totalScore, maxScore };
  }

  reset() {
    this.sessionId = uuidv4();
    this.conversationId = undefined;
  }
}
