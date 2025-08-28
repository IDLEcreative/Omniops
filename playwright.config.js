// @ts-check
const { defineConfig, devices } = require('@playwright/test');

/**
 * Playwright Configuration for Web Scraping
 * Optimized for customer service agent scraping tasks
 */
module.exports = defineConfig({
  // Test directory (if using Playwright for testing)
  testDir: './__tests__/playwright',
  
  // Global test timeout
  timeout: 30000,
  
  // Expect timeout for assertions
  expect: {
    timeout: 5000
  },
  
  // Run tests in parallel
  fullyParallel: true,
  
  // Reporter configuration
  reporter: [['html'], ['json', { outputFile: 'test-results.json' }]],
  
  // Global setup and teardown
  globalSetup: require.resolve('./test-utils/playwright-global-setup.js'),
  globalTeardown: require.resolve('./test-utils/playwright-global-teardown.js'),
  
  // Use this to configure the default browser settings for all tests
  use: {
    // Base URL for relative paths
    baseURL: 'http://localhost:3000',
    
    // Browser context settings
    ignoreHTTPSErrors: true,
    viewport: { width: 1280, height: 720 },
    
    // Enable trace collection
    trace: 'retain-on-failure',
    
    // Screenshot on failure
    screenshot: 'only-on-failure',
    
    // Video recording
    video: 'retain-on-failure',
    
    // User agent for scraping
    userAgent: 'Mozilla/5.0 (compatible; CustomerServiceAgent/1.0; Web-Scraper)',
    
    // Default timeouts
    actionTimeout: 10000,
    navigationTimeout: 30000,
  },
  
  // Browser projects configuration
  projects: [
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        // Chromium-specific settings for web scraping
        launchOptions: {
          args: [
            '--disable-blink-features=AutomationControlled',
            '--disable-features=VizDisplayCompositor',
            '--no-sandbox',
            '--disable-setuid-sandbox'
          ]
        }
      },
    },
    {
      name: 'firefox',
      use: { 
        ...devices['Desktop Firefox'],
        // Firefox-specific settings
      },
    },
    {
      name: 'webkit',
      use: { 
        ...devices['Desktop Safari'],
        // WebKit-specific settings
      },
    },
    
    // Mobile browsers for responsive scraping
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
    
    // Headless optimized for scraping
    {
      name: 'scraping-optimized',
      use: {
        browserName: 'chromium',
        headless: true,
        viewport: { width: 1920, height: 1080 },
        ignoreHTTPSErrors: true,
        javaScriptEnabled: true,
        launchOptions: {
          args: [
            '--disable-blink-features=AutomationControlled',
            '--disable-features=VizDisplayCompositor',
            '--no-first-run',
            '--no-default-browser-check',
            '--disable-default-apps',
            '--disable-popup-blocking',
            '--disable-translate',
            '--disable-background-timer-throttling',
            '--disable-renderer-backgrounding',
            '--disable-backgrounding-occluded-windows',
            '--disable-client-side-phishing-detection',
            '--disable-sync',
            '--metrics-recording-only',
            '--no-sandbox',
            '--disable-setuid-sandbox'
          ]
        },
        // Stealth mode settings
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        extraHTTPHeaders: {
          'Accept-Language': 'en-US,en;q=0.9',
          'Accept-Encoding': 'gzip, deflate, br',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
          'Sec-Fetch-Dest': 'document',
          'Sec-Fetch-Mode': 'navigate',
          'Sec-Fetch-Site': 'none',
          'Upgrade-Insecure-Requests': '1'
        }
      },
    }
  ],
  
  // Global setup for web scraping
  webServer: {
    command: 'npm run dev',
    port: 3000,
    reuseExistingServer: !process.env.CI,
  },
});

// Export default scraping configuration
module.exports.scrapingConfig = {
  browsers: {
    chromium: {
      headless: true,
      args: [
        '--disable-blink-features=AutomationControlled',
        '--disable-features=VizDisplayCompositor',
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--disable-gpu'
      ]
    },
    firefox: {
      headless: true,
      firefoxUserPrefs: {
        'dom.webdriver.enabled': false,
        'useAutomationExtension': false
      }
    },
    webkit: {
      headless: true
    }
  },
  
  // Default page settings for scraping
  pageDefaults: {
    viewport: { width: 1280, height: 720 },
    userAgent: 'Mozilla/5.0 (compatible; CustomerServiceAgent/1.0)',
    timeout: 30000,
    waitUntil: 'domcontentloaded',
    ignoreHTTPSErrors: true
  },
  
  // Resource blocking for performance
  resourceBlocking: {
    enabled: true,
    blockTypes: ['image', 'font', 'media', 'websocket'],
    allowTypes: ['document', 'script', 'xhr', 'fetch']
  },
  
  // Request interception settings
  requestInterception: {
    enabled: true,
    maxRetries: 3,
    retryDelay: 1000,
    timeout: 30000
  },
  
  // Anti-detection measures
  stealth: {
    enabled: true,
    hideWebDriver: true,
    randomizeViewport: true,
    randomizeUserAgent: true,
    blockCanvasFingerprinting: true
  }
};