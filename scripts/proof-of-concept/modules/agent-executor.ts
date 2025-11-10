/**
 * AI Agent Executor for Autonomous Tasks
 */

import Anthropic from '@anthropic-ai/sdk';
import type { Page } from 'playwright';

export interface TaskStep {
  stepNumber: number;
  intent: string;
  expectedAction: string;
  expectedOutcome: string;
}

export interface StepResult {
  stepNumber: number;
  intent: string;
  success: boolean;
  screenshot?: string;
  error?: string;
}

export class AgentExecutor {
  private anthropic: Anthropic;
  private screenshots: string[] = [];

  constructor() {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY environment variable required');
    }
    this.anthropic = new Anthropic({ apiKey });
  }

  async executeStepWithAI(page: Page, step: TaskStep): Promise<StepResult> {
    try {
      // Take screenshot for AI vision
      const screenshot = await page.screenshot();
      this.screenshots.push(screenshot.toString('base64'));

      // Ask AI what to do
      const response = await this.anthropic.messages.create({
        model: 'claude-sonnet-4-5-20250929',
        max_tokens: 2048,
        messages: [{
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: 'image/png',
                data: screenshot.toString('base64')
              }
            },
            {
              type: 'text',
              text: `You are an autonomous agent executing a Stripe API key generation workflow.

**Current Step:** ${step.stepNumber}
**Intent:** ${step.intent}
**Expected Action:** ${step.expectedAction}
**Expected Outcome:** ${step.expectedOutcome}

**Current Page URL:** ${page.url()}

Analyze the screenshot and provide the EXACT Playwright command to execute this step.

Respond with ONLY the Playwright command (no explanation).

Examples:
- await page.goto('https://dashboard.stripe.com/login')
- await page.fill('[name="email"]', 'user@example.com')
- await page.click('button:has-text("Sign in")')
- await page.click('a:has-text("Developers")')

Your command:`
            }
          ]
        }]
      });

      // Extract command from AI response
      const aiCommand = this.extractCommand(response.content);
      console.log(`   AI Command: ${aiCommand}`);

      // Execute the command safely
      await this.executeCommand(page, aiCommand);

      // Wait for network to settle
      await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
      await page.waitForTimeout(1000);

      return {
        stepNumber: step.stepNumber,
        intent: step.intent,
        success: true,
        screenshot: screenshot.toString('base64')
      };

    } catch (error) {
      return {
        stepNumber: step.stepNumber,
        intent: step.intent,
        success: false,
        error: (error as Error).message
      };
    }
  }

  private extractCommand(content: any[]): string {
    const textContent = content
      .filter(block => block.type === 'text')
      .map(block => block.text)
      .join('');

    // Extract command from code blocks or plain text
    const codeMatch = textContent.match(/```(?:typescript|javascript)?\n?(.*?)\n?```/s);
    if (codeMatch) {
      return codeMatch[1].trim();
    }

    // If no code block, look for lines starting with 'await page.'
    const lines = textContent.split('\n');
    const command = lines.find(line => line.trim().startsWith('await page.'));

    if (command) {
      return command.trim();
    }

    // Fallback: return trimmed text
    return textContent.trim();
  }

  private async executeCommand(page: Page, command: string): Promise<void> {
    // Security: Only allow specific Playwright methods
    const allowedMethods = [
      'goto',
      'click',
      'fill',
      'type',
      'waitForSelector',
      'waitForTimeout',
      'waitForLoadState',
      'press',
      'selectOption'
    ];

    const methodMatch = command.match(/page\.(\w+)/);
    if (!methodMatch) {
      throw new Error('Invalid command format');
    }

    const method = methodMatch[1];
    if (!allowedMethods.includes(method)) {
      throw new Error(`Method '${method}' not allowed for security`);
    }

    // Replace credentials from environment
    const processedCommand = command
      .replace(/['"]user@example\.com['"]/, `"${process.env.STRIPE_EMAIL}"`)
      .replace(/['"]password123['"]/, `"${process.env.STRIPE_PASSWORD}"`);

    // Execute command safely using Function constructor
    const executeFunc = new Function('page', `return ${processedCommand}`);
    await executeFunc(page);
  }

  getScreenshots(): string[] {
    return this.screenshots;
  }
}
