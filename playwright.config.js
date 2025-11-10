/**
 * Playwright Configuration for Web Scraping
 * Optimized for customer service agent scraping tasks
 */

// Standard device configurations for testing
const devices = {
  'Desktop Chrome': {
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    viewport: { width: 1280, height: 720 },
  },
  'Desktop Firefox': {
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:120.0) Gecko/20100101 Firefox/120.0',
    viewport: { width: 1280, height: 720 },
  },
  'Desktop Safari': {
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15',
    viewport: { width: 1280, height: 720 },
  },
  'Pixel 5': {
    userAgent: 'Mozilla/5.0 (Linux; Android 11; Pixel 5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
    viewport: { width: 393, height: 851 },
    isMobile: true,
    hasTouch: true,
  },
  'iPhone 12': {
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Mobile/15E148 Safari/604.1',
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  }
};

const playwrightConfig = {
  // Test directory (if using Playwright for testing)
  testDir: './__tests__/playwright',
  
  // Global test timeout
  timeout: 30000,
  
  // Run tests in parallel
  fullyParallel: true,
  
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

    // User agent for scraping
    userAgent: 'Mozilla/5.0 (compatible; CustomerServiceAgent/1.0; Web-Scraper)',

    // Default timeouts
    actionTimeout: 10000,
    navigationTimeout: 30000,

    // Automatic screenshots on failure for AI debugging
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',

    // Capture trace for debugging (includes screenshots, DOM, network)
    trace: 'on-first-retry',
  },
  
  // Browser projects configuration
  projects: [
    // Setup project - runs authentication before dashboard tests
    {
      name: 'setup',
      testMatch: /.*\.setup\.ts/,
    },

    // Non-authenticated tests (widget, public pages)
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
      testIgnore: /.*analytics-exports.*|.*dashboard.*/,
    },
    {
      name: 'firefox',
      use: {
        ...devices['Desktop Firefox'],
      },
      testIgnore: /.*analytics-exports.*|.*dashboard.*/,
    },
    {
      name: 'webkit',
      use: {
        ...devices['Desktop Safari'],
      },
      testIgnore: /.*analytics-exports.*|.*dashboard.*/,
    },

    // Authenticated tests (dashboard, analytics) - require setup
    {
      name: 'chromium-auth',
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'playwright/.auth/user.json',
        launchOptions: {
          args: [
            '--disable-blink-features=AutomationControlled',
            '--disable-features=VizDisplayCompositor',
            '--no-sandbox',
            '--disable-setuid-sandbox'
          ]
        }
      },
      testMatch: /.*analytics-exports.*|.*dashboard.*/,
      dependencies: ['setup'],
    },
    {
      name: 'firefox-auth',
      use: {
        ...devices['Desktop Firefox'],
        storageState: 'playwright/.auth/user.json',
      },
      testMatch: /.*analytics-exports.*|.*dashboard.*/,
      dependencies: ['setup'],
    },
    {
      name: 'webkit-auth',
      use: {
        ...devices['Desktop Safari'],
        storageState: 'playwright/.auth/user.json',
      },
      testMatch: /.*analytics-exports.*|.*dashboard.*/,
      dependencies: ['setup'],
    }
  ]
};

// Export main configuration
module.exports = playwrightConfig;

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