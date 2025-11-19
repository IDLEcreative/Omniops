/**
 * Lighthouse CI Configuration
 *
 * Automated performance, accessibility, SEO, and best practices auditing.
 * Runs on PRs via GitHub Actions to enforce quality standards.
 *
 * See: docs/04-TESTING/GUIDE_LIGHTHOUSE_CI.md for full documentation
 */

module.exports = {
  ci: {
    collect: {
      // URLs to test
      url: [
        'http://localhost:3000/',
        'http://localhost:3000/widget-test',
        'http://localhost:3000/dashboard',
      ],
      // Number of runs per URL (median of 3)
      numberOfRuns: 3,
      // Start server before collecting
      startServerCommand: 'npm run dev',
      startServerReadyPattern: 'ready on',
      startServerReadyTimeout: 60000,
      // Collect settings
      settings: {
        preset: 'desktop',
        // Lighthouse options
        onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
        // Skip PWA checks (not applicable)
        skipAudits: ['service-worker', 'installable-manifest', 'apple-touch-icon'],
      },
    },

    assert: {
      // Performance budgets
      assertions: {
        // Categories (0-100 scores)
        'categories:performance': ['error', { minScore: 0.90 }],
        'categories:accessibility': ['error', { minScore: 1.0 }],
        'categories:best-practices': ['error', { minScore: 0.95 }],
        'categories:seo': ['error', { minScore: 0.90 }],

        // Performance metrics
        'first-contentful-paint': ['warn', { maxNumericValue: 2000 }],
        'largest-contentful-paint': ['error', { maxNumericValue: 2500 }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],
        'total-blocking-time': ['warn', { maxNumericValue: 300 }],
        'speed-index': ['warn', { maxNumericValue: 3000 }],
        'interactive': ['warn', { maxNumericValue: 3500 }],

        // Accessibility audits
        'color-contrast': 'error',
        'image-alt': 'error',
        'label': 'error',
        'aria-valid-attr': 'error',
        'aria-required-attr': 'error',
        'heading-order': 'error',
        'tabindex': 'error',

        // Best practices
        'errors-in-console': 'warn',
        'no-vulnerable-libraries': 'error',
        'uses-https': 'error',
        'geolocation-on-start': 'error',

        // SEO
        'meta-description': 'error',
        'document-title': 'error',
        'link-text': 'error',
        'crawlable-anchors': 'error',

        // Resource budgets
        'resource-summary:script:size': ['warn', { maxNumericValue: 300000 }],
        'resource-summary:stylesheet:size': ['warn', { maxNumericValue: 50000 }],
        'resource-summary:image:size': ['warn', { maxNumericValue: 200000 }],
        'resource-summary:font:size': ['warn', { maxNumericValue: 100000 }],
      },
    },

    upload: {
      // Upload results to temporary public storage
      target: 'temporary-public-storage',
      // Reports available for 7 days
      // Alternative: Use LHCI server for permanent storage
      // target: 'lhci',
      // serverBaseUrl: 'https://your-lhci-server.com',
      // token: process.env.LHCI_TOKEN,
    },

    server: {
      // Optional: Configure LHCI server for long-term storage
      // See: https://github.com/GoogleChrome/lighthouse-ci/blob/main/docs/server.md
    },
  },
};
