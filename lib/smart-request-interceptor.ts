/**
 * Smart Request Interceptor
 * Optimizes requests by blocking unnecessary resources and modifying requests
 */

export interface InterceptorConfig {
  blockImages?: boolean;
  blockCSS?: boolean;
  blockFonts?: boolean;
  blockMedia?: boolean;
  blockOther?: boolean;
  allowedDomains?: string[];
  blockedDomains?: string[];
  customHeaders?: Record<string, string>;
  modifyUserAgent?: boolean;
}

export class SmartRequestInterceptor {
  private config: InterceptorConfig;
  private blockedRequests: number = 0;
  private modifiedRequests: number = 0;
  private totalRequests: number = 0;
  
  constructor(config: InterceptorConfig = {}) {
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
  async setupInterception(page: any): Promise<void> {
    await page.route('**/*', async (route: any) => {
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
  private shouldBlockRequest(url: string, resourceType: string): boolean {
    try {
      const urlObj = new URL(url);
      
      // Check blocked domains
      if (this.config.blockedDomains?.some(domain => 
        urlObj.hostname.includes(domain))) {
        return true;
      }
      
      // Check allowed domains (if specified, only allow these)
      if (this.config.allowedDomains?.length && 
          !this.config.allowedDomains.some(domain => 
            urlObj.hostname.includes(domain))) {
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
    } catch {
      // If URL parsing fails, don't block
      return false;
    }
  }
  
  /**
   * Get modifications to apply to a request
   */
  private getRequestModifications(request: any): any | null {
    const modifications: any = {};
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
  static createConfig(scenario: 'fast' | 'stealth' | 'balanced'): InterceptorConfig {
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
  blockDomain(domain: string): void {
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
  allowDomain(domain: string): void {
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
  setHeaders(headers: Record<string, string>): void {
    this.config.customHeaders = { ...this.config.customHeaders, ...headers };
  }
  
  /**
   * Get performance statistics
   */
  getStats(): {
    totalRequests: number;
    blockedRequests: number;
    modifiedRequests: number;
    blockedPercentage: number;
    modifiedPercentage: number;
  } {
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
  resetStats(): void {
    this.blockedRequests = 0;
    this.modifiedRequests = 0;
    this.totalRequests = 0;
  }
  
  /**
   * Update configuration
   */
  updateConfig(config: Partial<InterceptorConfig>): void {
    this.config = { ...this.config, ...config };
  }
  
  /**
   * Get current configuration
   */
  getConfig(): InterceptorConfig {
    return { ...this.config };
  }
}