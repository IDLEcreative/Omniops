"use strict";
/**
 * Smart Request Interceptor
 * Optimizes requests by blocking unnecessary resources and modifying requests
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SmartRequestInterceptor = void 0;
class SmartRequestInterceptor {
    constructor(config = {}) {
        this.blockedRequests = 0;
        this.modifiedRequests = 0;
        this.totalRequests = 0;
        this.config = {
            blockImages: false,
            blockCSS: false,
            blockFonts: false,
            blockMedia: false,
            blockOther: false,
            allowedDomains: [],
            blockedDomains: [],
            customHeaders: {},
            modifyUserAgent: false,
            ...config
        };
    }
    /**
     * Setup request interception for a Playwright page
     */
    async setupInterception(page) {
        await page.route('**/*', async (route) => {
            const request = route.request();
            this.totalRequests++;
            const url = request.url();
            const resourceType = request.resourceType();
            // Check if request should be blocked
            if (this.shouldBlockRequest(url, resourceType)) {
                this.blockedRequests++;
                await route.abort();
                return;
            }
            // Check if request should be modified
            const modifications = this.getRequestModifications(request);
            if (modifications) {
                this.modifiedRequests++;
                await route.continue(modifications);
                return;
            }
            // Continue with original request
            await route.continue();
        });
    }
    /**
     * Determine if a request should be blocked
     */
    shouldBlockRequest(url, resourceType) {
        try {
            const urlObj = new URL(url);
            // Check blocked domains
            if (this.config.blockedDomains?.some(domain => urlObj.hostname.includes(domain))) {
                return true;
            }
            // Check allowed domains (if specified, only allow these)
            if (this.config.allowedDomains?.length &&
                !this.config.allowedDomains.some(domain => urlObj.hostname.includes(domain))) {
                return true;
            }
            // Block by resource type
            switch (resourceType) {
                case 'image':
                    return this.config.blockImages === true;
                case 'stylesheet':
                    return this.config.blockCSS === true;
                case 'font':
                    return this.config.blockFonts === true;
                case 'media':
                    return this.config.blockMedia === true;
                case 'other':
                    return this.config.blockOther === true;
                default:
                    return false;
            }
        }
        catch {
            // If URL parsing fails, don't block
            return false;
        }
    }
    /**
     * Get modifications to apply to a request
     */
    getRequestModifications(request) {
        const modifications = {};
        let hasModifications = false;
        // Add custom headers
        if (this.config.customHeaders && Object.keys(this.config.customHeaders).length > 0) {
            modifications.headers = {
                ...request.headers(),
                ...this.config.customHeaders
            };
            hasModifications = true;
        }
        // Modify user agent
        if (this.config.modifyUserAgent) {
            const userAgents = [
                'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:120.0) Gecko/20100101 Firefox/120.0',
            ];
            const randomUA = userAgents[Math.floor(Math.random() * userAgents.length)];
            if (!modifications.headers) {
                modifications.headers = request.headers();
            }
            modifications.headers['User-Agent'] = randomUA;
            hasModifications = true;
        }
        return hasModifications ? modifications : null;
    }
    /**
     * Create optimized config for different scraping scenarios
     */
    static createConfig(scenario) {
        switch (scenario) {
            case 'fast':
                return {
                    blockImages: true,
                    blockCSS: true,
                    blockFonts: true,
                    blockMedia: true,
                    blockOther: true,
                    modifyUserAgent: false,
                };
            case 'stealth':
                return {
                    blockImages: false,
                    blockCSS: false,
                    blockFonts: false,
                    blockMedia: false,
                    blockOther: false,
                    modifyUserAgent: true,
                    customHeaders: {
                        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                        'Accept-Language': 'en-US,en;q=0.9',
                        'Accept-Encoding': 'gzip, deflate, br',
                        'DNT': '1',
                        'Connection': 'keep-alive',
                        'Upgrade-Insecure-Requests': '1',
                    },
                };
            case 'balanced':
            default:
                return {
                    blockImages: true,
                    blockCSS: false,
                    blockFonts: true,
                    blockMedia: true,
                    blockOther: false,
                    modifyUserAgent: true,
                };
        }
    }
    /**
     * Add domain to blocked list
     */
    blockDomain(domain) {
        if (!this.config.blockedDomains) {
            this.config.blockedDomains = [];
        }
        if (!this.config.blockedDomains.includes(domain)) {
            this.config.blockedDomains.push(domain);
        }
    }
    /**
     * Add domain to allowed list
     */
    allowDomain(domain) {
        if (!this.config.allowedDomains) {
            this.config.allowedDomains = [];
        }
        if (!this.config.allowedDomains.includes(domain)) {
            this.config.allowedDomains.push(domain);
        }
    }
    /**
     * Set custom headers
     */
    setHeaders(headers) {
        this.config.customHeaders = { ...this.config.customHeaders, ...headers };
    }
    /**
     * Get performance statistics
     */
    getStats() {
        return {
            totalRequests: this.totalRequests,
            blockedRequests: this.blockedRequests,
            modifiedRequests: this.modifiedRequests,
            blockedPercentage: this.totalRequests > 0 ?
                Math.round((this.blockedRequests / this.totalRequests) * 100) : 0,
            modifiedPercentage: this.totalRequests > 0 ?
                Math.round((this.modifiedRequests / this.totalRequests) * 100) : 0,
        };
    }
    /**
     * Reset statistics
     */
    resetStats() {
        this.blockedRequests = 0;
        this.modifiedRequests = 0;
        this.totalRequests = 0;
    }
    /**
     * Update configuration
     */
    updateConfig(config) {
        this.config = { ...this.config, ...config };
    }
    /**
     * Get current configuration
     */
    getConfig() {
        return { ...this.config };
    }
}
exports.SmartRequestInterceptor = SmartRequestInterceptor;
