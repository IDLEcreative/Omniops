/**
 * AI Command Generation for Autonomous Agents
 * Uses OpenAI GPT-4 Vision to analyze screenshots and generate Playwright commands
 *
 * @module lib/autonomous/core/ai-commander
 */

import OpenAI from 'openai';
import type { TaskStep } from './base-agent-types';

export class AICommander {
  private openai: OpenAI;

  constructor(apiKey: string) {
    this.openai = new OpenAI({
      apiKey,
      timeout: 30 * 1000,    // 30 seconds (chat completions need 5-15s normally)
      maxRetries: 2,          // Retry failed requests twice
    });
  }

  /**
   * Get AI command for a step using OpenAI GPT-4 Vision
   */
  async getCommand(
    step: TaskStep,
    screenshot: string,
    pageUrl: string
  ): Promise<string> {
    const response = await this.openai.chat.completions.create({
      model: 'gpt-4-vision-preview',
      max_tokens: 500,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: this.buildPrompt(step, pageUrl)
            },
            {
              type: 'image_url',
              image_url: {
                url: `data:image/png;base64,${screenshot}`,
                detail: 'high'
              }
            }
          ]
        }
      ],
      temperature: 0.1 // Low temperature for consistent, deterministic commands
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

  private extractCommand(response: OpenAI.Chat.Completions.ChatCompletion): string {
    const textContent = response.choices[0]?.message?.content || '';

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
