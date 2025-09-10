"use strict";
/**
 * Browser Context Pool
 * Manages a pool of browser contexts for efficient resource usage
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.BrowserContextPool = void 0;
class BrowserContextPool {
    constructor(config = {}) {
        this.browser = null;
        this.contexts = new Map();
        this.cleanupInterval = null;
        this.config = {
            maxContexts: 5,
            maxPagesPerContext: 3,
            contextTimeout: 300000, // 5 minutes
            reuseContexts: true,
            stealth: true,
            ...config
        };
        // Start cleanup interval
        this.startCleanup();
    }
    /**
     * Initialize the pool with a browser instance
     */
    async initialize(browser) {
        this.browser = browser;
    }
    /**
     * Get a page from the pool, creating context if needed
     */
    async getPage(domain) {
        if (!this.browser) {
            throw new Error('Browser not initialized. Call initialize() first.');
        }
        // Find or create context
        const contextId = domain ? `domain_${domain}` : `general_${Date.now()}`;
        let contextInfo = this.contexts.get(contextId);
        // Create new context if needed
        if (!contextInfo || contextInfo.pages.length >= this.config.maxPagesPerContext) {
            if (this.contexts.size >= this.config.maxContexts) {
                // Remove oldest context
                await this.removeOldestContext();
            }
            contextInfo = await this.createContext(contextId, domain);
        }
        // Create new page in context
        const page = await contextInfo.context.newPage();
        contextInfo.pages.push(page);
        contextInfo.lastUsed = Date.now();
        // Setup page with optimizations
        await this.setupPage(page);
        return { page, contextId };
    }
    /**
     * Return a page to the pool
     */
    async returnPage(page, contextId) {
        const contextInfo = this.contexts.get(contextId);
        if (!contextInfo)
            return;
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
                await this.removeContext(contextId);
            }
        }
        catch (error) {
            console.error('Error returning page to pool:', error);
        }
    }
    /**
     * Create a new browser context
     */
    async createContext(contextId, domain) {
        if (!this.browser) {
            throw new Error('Browser not initialized');
        }
        const contextOptions = {
            ignoreHTTPSErrors: true,
            javaScriptEnabled: true,
        };
        // Add stealth options
        if (this.config.stealth) {
            contextOptions.userAgent = this.getRandomUserAgent();
            contextOptions.viewport = this.getRandomViewport();
            contextOptions.locale = 'en-US';
            contextOptions.timezoneId = 'America/New_York';
            contextOptions.geolocation = { latitude: 40.7128, longitude: -74.0060 };
            contextOptions.permissions = ['geolocation'];
        }
        const context = await this.browser.newContext(contextOptions);
        // Add additional stealth measures
        if (this.config.stealth) {
            await this.addStealthScripts(context);
        }
        const contextInfo = {
            context,
            pages: [],
            createdAt: Date.now(),
            lastUsed: Date.now(),
            domain,
        };
        this.contexts.set(contextId, contextInfo);
        return contextInfo;
    }
    /**
     * Setup page with optimizations
     */
    async setupPage(page) {
        // Set reasonable timeouts
        page.setDefaultTimeout(30000);
        page.setDefaultNavigationTimeout(30000);
        // Block unnecessary resources for performance
        await page.route('**/*', async (route) => {
            const request = route.request();
            const resourceType = request.resourceType();
            // Block certain resource types for better performance
            if (['image', 'font', 'media'].includes(resourceType)) {
                await route.abort();
                return;
            }
            await route.continue();
        });
        // Add error handling
        page.on('pageerror', (error) => {
            console.warn('Page error:', error.message);
        });
        page.on('console', (msg) => {
            if (msg.type() === 'error') {
                console.warn('Console error:', msg.text());
            }
        });
    }
    /**
     * Add stealth scripts to context
     */
    async addStealthScripts(context) {
        // Add script to hide automation indicators
        await context.addInitScript(`
      // Remove webdriver property
      Object.defineProperty(navigator, 'webdriver', {
        get: () => undefined,
      });
      
      // Mock permissions
      const originalQuery = window.navigator.permissions.query;
      window.navigator.permissions.query = (parameters) => (
        parameters.name === 'notifications' ?
          Promise.resolve({ state: Notification.permission }) :
          originalQuery(parameters)
      );
      
      // Mock plugins
      Object.defineProperty(navigator, 'plugins', {
        get: () => [1, 2, 3, 4, 5],
      });
      
      // Mock languages
      Object.defineProperty(navigator, 'languages', {
        get: () => ['en-US', 'en'],
      });
    `);
    }
    /**
     * Get random user agent
     */
    getRandomUserAgent() {
        const userAgents = [
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:120.0) Gecko/20100101 Firefox/120.0',
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15',
        ];
        const index = Math.floor(Math.random() * userAgents.length);
        const agent = userAgents[index];
        return agent !== undefined ? agent : userAgents[0];
    }
    /**
     * Get random viewport size
     */
    getRandomViewport() {
        const viewports = [
            { width: 1920, height: 1080 },
            { width: 1366, height: 768 },
            { width: 1440, height: 900 },
            { width: 1536, height: 864 },
            { width: 1280, height: 720 },
        ];
        const index = Math.floor(Math.random() * viewports.length);
        const viewport = viewports[index];
        return viewport !== undefined ? viewport : viewports[0];
    }
    /**
     * Remove oldest context from pool
     */
    async removeOldestContext() {
        let oldestId = null;
        let oldestTime = Date.now();
        for (const [id, info] of this.contexts.entries()) {
            if (info.lastUsed < oldestTime) {
                oldestTime = info.lastUsed;
                oldestId = id;
            }
        }
        if (oldestId) {
            await this.removeContext(oldestId);
        }
    }
    /**
     * Remove specific context
     */
    async removeContext(contextId) {
        const contextInfo = this.contexts.get(contextId);
        if (!contextInfo)
            return;
        try {
            // Close all pages in context
            for (const page of contextInfo.pages) {
                try {
                    await page.close();
                }
                catch (error) {
                    console.error('Error closing page:', error);
                }
            }
            // Close context
            await contextInfo.context.close();
            // Remove from map
            this.contexts.delete(contextId);
        }
        catch (error) {
            console.error('Error removing context:', error);
        }
    }
    /**
     * Start cleanup interval to remove expired contexts
     */
    startCleanup() {
        this.cleanupInterval = setInterval(async () => {
            const now = Date.now();
            const contextsToRemove = [];
            for (const [id, info] of this.contexts.entries()) {
                if (now - info.lastUsed > this.config.contextTimeout) {
                    contextsToRemove.push(id);
                }
            }
            for (const id of contextsToRemove) {
                await this.removeContext(id);
            }
        }, 60000); // Check every minute
    }
    /**
     * Get pool statistics
     */
    getStats() {
        const now = Date.now();
        const contexts = [];
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
    async cleanup() {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
            this.cleanupInterval = null;
        }
        const contextIds = Array.from(this.contexts.keys());
        for (const id of contextIds) {
            await this.removeContext(id);
        }
    }
    /**
     * Update pool configuration
     */
    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
    }
    /**
     * Get current configuration
     */
    getConfig() {
        return { ...this.config };
    }
}
exports.BrowserContextPool = BrowserContextPool;
