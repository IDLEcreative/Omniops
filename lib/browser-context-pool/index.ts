/**
 * Browser Context Pool
 * Manages a pool of browser contexts for efficient resource usage
 */

import { Browser, Page } from 'playwright';
import { ContextPoolConfig, ContextInfo } from './types';
import { DEFAULT_POOL_CONFIG, CLEANUP_INTERVAL } from './constants';
import { setupPage } from './page-setup';
import {
  createContext,
  removeContext,
  findOldestContext,
  findExpiredContexts,
} from './context-manager';

export * from './types';

export class BrowserContextPool {
  private browser: Browser | null = null;
  private contexts: Map<string, ContextInfo> = new Map();
  private config: ContextPoolConfig;
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor(config: Partial<ContextPoolConfig> = {}) {
    this.config = { ...DEFAULT_POOL_CONFIG, ...config };
    this.startCleanup();
  }

  /**
   * Initialize the pool with a browser instance
   */
  async initialize(browser: Browser): Promise<void> {
    this.browser = browser;
  }

  /**
   * Get a page from the pool, creating context if needed
   */
  async getPage(domain?: string): Promise<{ page: Page; contextId: string }> {
    if (!this.browser) {
      throw new Error('Browser not initialized. Call initialize() first.');
    }

    // Find or create context
    const contextId = domain ? `domain_${domain}` : `general_${Date.now()}`;
    let contextInfo = this.contexts.get(contextId);

    // Create new context if needed
    if (!contextInfo || contextInfo.pages.length >= this.config.maxPagesPerContext) {
      if (this.contexts.size >= this.config.maxContexts) {
        await this.removeOldestContext();
      }

      contextInfo = await createContext(
        this.browser,
        contextId,
        this.config,
        domain
      );
      this.contexts.set(contextId, contextInfo);
    }

    // Create new page in context
    const page = await contextInfo.context.newPage();
    contextInfo.pages.push(page);
    contextInfo.lastUsed = Date.now();

    // Setup page with optimizations
    await setupPage(page);

    return { page, contextId };
  }

  /**
   * Return a page to the pool
   */
  async returnPage(page: Page, contextId: string): Promise<void> {
    const contextInfo = this.contexts.get(contextId);
    if (!contextInfo) return;

    try {
      // Remove page from context info
      const pageIndex = contextInfo.pages.indexOf(page);
      if (pageIndex !== -1) {
        contextInfo.pages.splice(pageIndex, 1);
      }

      // Close the page
      await page.close();

      // Update last used time
      contextInfo.lastUsed = Date.now();

      // If context has no pages and we're not reusing contexts, remove it
      if (!this.config.reuseContexts && contextInfo.pages.length === 0) {
        await this.removeContextById(contextId);
      }
    } catch (error) {
      console.error('Error returning page to pool:', error);
    }
  }

  /**
   * Remove oldest context from pool
   */
  private async removeOldestContext(): Promise<void> {
    const oldestId = findOldestContext(this.contexts);
    if (oldestId) {
      await this.removeContextById(oldestId);
    }
  }

  /**
   * Remove context by ID
   */
  private async removeContextById(contextId: string): Promise<void> {
    const contextInfo = this.contexts.get(contextId);
    if (!contextInfo) return;

    await removeContext(contextInfo);
    this.contexts.delete(contextId);
  }

  /**
   * Start cleanup interval to remove expired contexts
   */
  private startCleanup(): void {
    this.cleanupInterval = setInterval(async () => {
      const expiredIds = findExpiredContexts(
        this.contexts,
        this.config.contextTimeout
      );

      for (const id of expiredIds) {
        await this.removeContextById(id);
      }
    }, CLEANUP_INTERVAL);
  }

  /**
   * Get pool statistics
   */
  getStats(): {
    totalContexts: number;
    totalPages: number;
    contexts: Array<{
      id: string;
      pageCount: number;
      age: number;
      lastUsed: number;
      domain?: string;
    }>;
  } {
    const now = Date.now();
    const contexts: Array<{
      id: string;
      pageCount: number;
      age: number;
      lastUsed: number;
      domain?: string;
    }> = [];

    let totalPages = 0;

    for (const [id, info] of this.contexts.entries()) {
      totalPages += info.pages.length;
      contexts.push({
        id,
        pageCount: info.pages.length,
        age: now - info.createdAt,
        lastUsed: now - info.lastUsed,
        domain: info.domain,
      });
    }

    return {
      totalContexts: this.contexts.size,
      totalPages,
      contexts,
    };
  }

  /**
   * Close all contexts and cleanup
   */
  async cleanup(): Promise<void> {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }

    const contextIds = Array.from(this.contexts.keys());
    for (const id of contextIds) {
      await this.removeContextById(id);
    }
  }

  /**
   * Update pool configuration
   */
  updateConfig(newConfig: Partial<ContextPoolConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Get current configuration
   */
  getConfig(): ContextPoolConfig {
    return { ...this.config };
  }
}
