/**
 * Context management operations
 */

import { Browser, BrowserContext } from 'playwright';
import { ContextInfo, ContextPoolConfig } from './types';
import { getStealthContextOptions, addStealthScripts } from './stealth';

/**
 * Create a new browser context
 */
export async function createContext(
  browser: Browser,
  contextId: string,
  config: ContextPoolConfig,
  domain?: string
): Promise<ContextInfo> {
  const contextOptions: any = {
    ignoreHTTPSErrors: true,
    javaScriptEnabled: true,
  };

  // Add stealth options
  if (config.stealth) {
    Object.assign(contextOptions, getStealthContextOptions());
  }

  const context = await browser.newContext(contextOptions);

  // Add additional stealth measures
  if (config.stealth) {
    await addStealthScripts(context);
  }

  const contextInfo: ContextInfo = {
    context,
    pages: [],
    createdAt: Date.now(),
    lastUsed: Date.now(),
    domain,
  };

  return contextInfo;
}

/**
 * Remove specific context
 */
export async function removeContext(contextInfo: ContextInfo): Promise<void> {
  try {
    // Close all pages in context
    for (const page of contextInfo.pages) {
      try {
        await page.close();
      } catch (error) {
        console.error('Error closing page:', error);
      }
    }

    // Close context
    await contextInfo.context.close();
  } catch (error) {
    console.error('Error removing context:', error);
  }
}

/**
 * Find oldest context from map
 */
export function findOldestContext(contexts: Map<string, ContextInfo>): string | null {
  let oldestId: string | null = null;
  let oldestTime = Date.now();

  for (const [id, info] of contexts.entries()) {
    if (info.lastUsed < oldestTime) {
      oldestTime = info.lastUsed;
      oldestId = id;
    }
  }

  return oldestId;
}

/**
 * Find expired contexts
 */
export function findExpiredContexts(
  contexts: Map<string, ContextInfo>,
  timeout: number
): string[] {
  const now = Date.now();
  const expiredIds: string[] = [];

  for (const [id, info] of contexts.entries()) {
    if (now - info.lastUsed > timeout) {
      expiredIds.push(id);
    }
  }

  return expiredIds;
}
