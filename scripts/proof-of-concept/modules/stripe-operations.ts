/**
 * Stripe-Specific Operations for Autonomous Agent
 */

import type { Browser, Page } from 'playwright';
import { chromium } from 'playwright';
import type { TaskStep } from './agent-executor';

export async function initBrowser(): Promise<{ browser: Browser; page: Page }> {
  console.log('🌐 Launching browser...');
  const browser = await chromium.launch({
    headless: false, // Show browser for demo
    slowMo: 1000     // Slow down for visibility
  });

  const page = await browser.newPage();
  await page.setViewportSize({ width: 1280, height: 720 });

  return { browser, page };
}

export function getStripeWorkflow(): TaskStep[] {
  return [
    {
      stepNumber: 1,
      intent: 'Navigate to Stripe login',
      expectedAction: 'goto https://dashboard.stripe.com/login',
      expectedOutcome: 'Login form visible'
    },
    {
      stepNumber: 2,
      intent: 'Enter email address',
      expectedAction: 'fill email field',
      expectedOutcome: 'Email entered'
    },
    {
      stepNumber: 3,
      intent: 'Enter password',
      expectedAction: 'fill password field',
      expectedOutcome: 'Password entered'
    },
    {
      stepNumber: 4,
      intent: 'Click sign in',
      expectedAction: 'click sign in button',
      expectedOutcome: 'Dashboard loads'
    },
    {
      stepNumber: 5,
      intent: 'Navigate to API keys',
      expectedAction: 'click Developers → API keys',
      expectedOutcome: 'API keys page visible'
    },
    {
      stepNumber: 6,
      intent: 'Create secret key',
      expectedAction: 'click Create secret key button',
      expectedOutcome: 'Key creation modal appears'
    },
    {
      stepNumber: 7,
      intent: 'Name the key',
      expectedAction: 'fill key name: OmniOps Integration',
      expectedOutcome: 'Name entered'
    },
    {
      stepNumber: 8,
      intent: 'Generate the key',
      expectedAction: 'click Create button',
      expectedOutcome: 'API key displayed'
    },
    {
      stepNumber: 9,
      intent: 'Copy API key',
      expectedAction: 'copy key value',
      expectedOutcome: 'Key copied to clipboard'
    }
  ];
}

export async function extractApiKey(page: Page): Promise<string | undefined> {
  try {
    // Look for secret key element
    const keyElement = await page.locator('[data-test*="secret"], code, .secret-key').first();
    const keyText = await keyElement.textContent({ timeout: 5000 });

    if (keyText && keyText.startsWith('sk_')) {
      return keyText;
    }

    // Alternative: Get from clipboard
    const clipboardText = await page.evaluate(() => {
      return navigator.clipboard.readText();
    }).catch(() => undefined);

    if (clipboardText && clipboardText.startsWith('sk_')) {
      return clipboardText;
    }

    return undefined;
  } catch (error) {
    console.error('Failed to extract API key:', error);
    return undefined;
  }
}

export async function saveScreenshots(screenshots: string[]): Promise<void> {
  const fs = await import('fs');
  const path = await import('path');

  const screenshotDir = path.join(process.cwd(), 'test-results/autonomous-agent');

  if (!fs.existsSync(screenshotDir)) {
    fs.mkdirSync(screenshotDir, { recursive: true });
  }

  screenshots.forEach((screenshot, index) => {
    const filename = `step-${index + 1}.png`;
    const filepath = path.join(screenshotDir, filename);

    fs.writeFileSync(filepath, screenshot, 'base64');
  });

  console.log(`\n📸 Screenshots saved to: ${screenshotDir}`);
}
