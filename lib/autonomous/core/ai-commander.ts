/**
 * AI Command Generation for Autonomous Agents
 * @module lib/autonomous/core/ai-commander
 */

import Anthropic from '@anthropic-ai/sdk';
import type { TaskStep } from './base-agent-types';

export class AICommander {
  private anthropic: Anthropic;

  constructor(apiKey: string) {
    this.anthropic = new Anthropic({ apiKey });
  }

  /**
   * Get AI command for a step using Anthropic Computer Use
   */
  async getCommand(
    step: TaskStep,
    screenshot: string,
    pageUrl: string
  ): Promise<string> {
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
              data: screenshot
            }
          },
          {
            type: 'text',
            text: this.buildPrompt(step, pageUrl)
          }
        ]
      }]
    });

    return this.extractCommand(response);
  }

  private buildPrompt(step: TaskStep, pageUrl: string): string {
    return `You are an autonomous agent executing a workflow step.

**Current Step:** ${step.order}
**Intent:** ${step.intent}
**Action Type:** ${step.action}
**Target:** ${step.target || 'N/A'}
**Expected Result:** ${step.expectedResult}

**Current Page URL:** ${pageUrl}

Analyze the screenshot and provide the EXACT Playwright command to execute this step.

Respond with ONLY the Playwright command (no explanation, no markdown).

Examples:
- await page.goto('https://example.com/login')
- await page.fill('[name="email"]', 'user@example.com')
- await page.click('button:has-text("Sign in")')
- await page.click('a:has-text("Developers")')
- await page.locator('.api-key').textContent()

Your command:`;
  }

  private extractCommand(response: Anthropic.Message): string {
    const textContent = response.content
      .filter(block => block.type === 'text')
      .map(block => (block as any).text)
      .join('');

    // Extract command from code blocks
    const codeMatch = textContent.match(/```(?:typescript|javascript)?\n?(.*?)\n?```/s);
    if (codeMatch) {
      return codeMatch[1].trim();
    }

    // Look for lines starting with 'await page.'
    const lines = textContent.split('\n');
    const command = lines.find(line => line.trim().startsWith('await page.'));
    if (command) {
      return command.trim();
    }

    // Fallback
    return textContent.trim();
  }
}
