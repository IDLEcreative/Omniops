/**
 * Browser Management Utilities for Autonomous Agents
 * @module lib/autonomous/core/browser-manager
 */

import { chromium, Browser, Page } from 'playwright';
import type { ExecutionContext } from './base-agent-types';

export class BrowserManager {
  /**
   * Initialize browser with context settings
   */
  static async initializeBrowser(context?: ExecutionContext): Promise<{ browser: Browser; page: Page }> {
    const browser = await chromium.launch({
      headless: context?.headless !== false,
      slowMo: context?.slowMo || 0
    });

    const page = await browser.newPage();
    await page.setViewportSize({ width: 1280, height: 720 });

    console.log('[BrowserManager] Browser initialized');
    return { browser, page };
  }

  /**
   * Cleanup browser resources
   */
  static async cleanup(browser?: Browser): Promise<void> {
    if (browser) {
      await browser.close();
      console.log('[BrowserManager] Browser closed');
    }
  }

  /**
   * Allowed Playwright methods for security
   */
  static readonly ALLOWED_METHODS = [
    'goto',
    'click',
    'fill',
    'type',
    'waitForSelector',
    'waitForTimeout',
    'waitForLoadState',
    'press',
    'selectOption',
    'locator',
    'textContent'
  ];

  /**
   * Execute Playwright command safely with credential replacement
   */
  static async executeCommand(
    page: Page,
    command: string,
    credentials: Record<string, string>
  ): Promise<void> {
    const methodMatch = command.match(/page\.(\w+)/);
    if (!methodMatch) {
      throw new Error('Invalid command format');
    }

    const method = methodMatch[1];
    if (!this.ALLOWED_METHODS.includes(method)) {
      throw new Error(`Method '${method}' not allowed for security`);
    }

    let processedCommand = command;
    for (const [key, value] of Object.entries(credentials)) {
      processedCommand = processedCommand.replace(
        new RegExp(`{${key}}`, 'g'),
        value
      );
    }

    const executeFunc = new Function('page', `return ${processedCommand}`);
    await executeFunc(page);
  }
}
