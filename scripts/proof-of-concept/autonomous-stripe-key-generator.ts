/**
 * Proof of Concept: Autonomous Stripe API Key Generator
 *
 * This demonstrates how an AI agent can autonomously:
 * 1. Open a browser
 * 2. Navigate to Stripe
 * 3. Generate an API key
 * 4. Return the key to the user
 *
 * Uses:
 * - Playwright for browser automation
 * - Anthropic Computer Use API for AI vision
 * - E2E test workflows as training data
 *
 * Usage:
 *   ANTHROPIC_API_KEY=xxx STRIPE_EMAIL=xxx STRIPE_PASSWORD=xxx \
 *   npx tsx scripts/proof-of-concept/autonomous-stripe-key-generator.ts
 */

import type { Browser, Page } from 'playwright';
import { AgentExecutor, type StepResult } from './modules/agent-executor';
import {
  initBrowser,
  getStripeWorkflow,
  extractApiKey,
  saveScreenshots
} from './modules/stripe-operations';

export interface TaskResult {
  success: boolean;
  apiKey?: string;
  error?: string;
  steps: StepResult[];
}

class AutonomousStripeAgent {
  private browser?: Browser;
  private page?: Page;
  private executor: AgentExecutor;

  constructor() {
    this.executor = new AgentExecutor();
  }

  async execute(): Promise<TaskResult> {
    const steps: StepResult[] = [];

    try {
      console.log('🤖 Autonomous Stripe API Key Generator');
      console.log('=====================================\n');

      // Initialize browser
      const { browser, page } = await initBrowser();
      this.browser = browser;
      this.page = page;

      // Get workflow steps
      const workflow = getStripeWorkflow();

      // Execute workflow with AI guidance
      for (const step of workflow) {
        console.log(`\n📍 Step ${step.stepNumber}: ${step.intent}`);

        const stepResult = await this.executor.executeStepWithAI(this.page, step);
        steps.push(stepResult);

        if (!stepResult.success) {
          throw new Error(`Step ${step.stepNumber} failed: ${stepResult.error}`);
        }

        console.log(`✅ ${step.expectedOutcome}`);
      }

      // Extract API key from page
      const apiKey = await extractApiKey(this.page);

      console.log('\n🎉 Success!');
      console.log(`API Key: ${apiKey?.substring(0, 20)}...`);

      return {
        success: true,
        apiKey,
        steps
      };

    } catch (error) {
      console.error('\n❌ Error:', error);
      return {
        success: false,
        error: (error as Error).message,
        steps
      };
    } finally {
      if (this.browser) {
        await this.browser.close();
      }

      // Save screenshots for debugging
      await saveScreenshots(this.executor.getScreenshots());
    }
  }
}

/**
 * Main execution
 */
async function main() {
  // Validate environment
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('❌ ANTHROPIC_API_KEY environment variable required');
    console.error('   Get your API key from: https://console.anthropic.com/');
    process.exit(1);
  }

  if (!process.env.STRIPE_EMAIL || !process.env.STRIPE_PASSWORD) {
    console.error('❌ STRIPE_EMAIL and STRIPE_PASSWORD required for this demo');
    console.error('   Note: For production, use OAuth or secure credential vault');
    process.exit(1);
  }

  console.log('⚠️  WARNING: This is a proof of concept');
  console.log('   Real implementation would use:');
  console.log('   - OAuth instead of passwords');
  console.log('   - Encrypted credential storage');
  console.log('   - User consent flows');
  console.log('   - Comprehensive audit logging\n');

  const agent = new AutonomousStripeAgent();
  const result = await agent.execute();

  if (result.success && result.apiKey) {
    console.log('\n✅ Autonomous execution complete!');
    console.log(`\n💾 API Key: ${result.apiKey.substring(0, 30)}...`);
    console.log(`\n📊 Steps executed: ${result.steps.length}`);
    console.log(`   Success rate: ${result.steps.filter(s => s.success).length}/${result.steps.length}`);
  } else {
    console.log('\n❌ Autonomous execution failed');
    console.log(`   Error: ${result.error}`);
  }
}

// Run if executed directly
if (require.main === module) {
  main().catch(console.error);
}

export { AutonomousStripeAgent, TaskResult };
