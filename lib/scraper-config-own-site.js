"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.recommendedParallelConfig = exports.ultraFastConfig = exports.ownSiteConfig = void 0;
exports.getOptimalConfig = getOptimalConfig;
// Optimized configuration for scraping your OWN websites
// This removes all rate limiting and maximizes speed
exports.ownSiteConfig = {
    // Maximum concurrent pages - adjust based on your server capacity
    maxConcurrency: 20, // Up from 3
    // Remove all delays
    rateLimit: {
        requestsPerMinute: 999999, // Effectively unlimited
        delayBetweenRequests: 0, // No delay
        adaptiveDelay: false, // Don't slow down
        respectRobotsTxt: false, // Skip robots.txt for own site
    },
    // Aggressive timeouts for faster failure detection
    timeouts: {
        navigation: 15000, // 15 seconds
        request: 20000, // 20 seconds
        resourceLoad: 5000, // 5 seconds
        scriptExecution: 5000, // 5 seconds
    },
    // Memory optimization for handling more pages
    memory: {
        maxResultsInMemory: 1000, // Store more in memory
        batchSize: 100, // Larger batches
        gcThreshold: 0.85, // Less aggressive GC
        enableStreaming: true, // Stream results
    },
    // Browser optimization
    browser: {
        headless: true,
        blockResources: ['image', 'media', 'font'], // Still block unnecessary resources
        viewport: { width: 1280, height: 720 },
        userAgent: 'CustomerServiceBot/1.0', // Identify as your bot
    },
    // Content settings
    content: {
        minWordCount: 10, // Lower threshold for all pages
        maxPageSizeMB: 50, // Handle larger pages
        extractImages: false, // Skip images for speed
        extractLinks: true,
        extractMetadata: true,
    },
    // Advanced settings
    advanced: {
        followRedirects: true,
        maxRedirects: 5,
        ignoreSslErrors: false,
        customHeaders: {
            'X-Customer-Service-Bot': 'true', // Identify requests
        },
    },
};
// Ultra-fast configuration for maximum speed (use with caution)
exports.ultraFastConfig = {
    ...exports.ownSiteConfig,
    maxConcurrency: 50, // Extreme concurrency
    browser: {
        ...exports.ownSiteConfig.browser,
        blockResources: ['image', 'media', 'font', 'other'], // Block most resources
    },
    content: {
        ...exports.ownSiteConfig.content,
        minWordCount: 5, // Even lower threshold
        extractLinks: false, // Skip link extraction
    },
    timeouts: {
        navigation: 5000, // Very aggressive timeouts
        request: 10000,
        resourceLoad: 2000,
        scriptExecution: 2000,
    },
};
exports.recommendedParallelConfig = {
    totalJobs: 10, // 10 parallel scrapers
    pagesPerJob: 1000, // 1000 pages each
    sharedQueue: true, // Share URLs between workers
    loadBalancing: 'least-loaded', // Distribute to least busy worker
};
// Helper to calculate optimal configuration based on site size
function getOptimalConfig(estimatedPages) {
    if (estimatedPages < 1000) {
        // Small site: single job, high concurrency
        return {
            config: exports.ownSiteConfig,
            parallel: {
                totalJobs: 1,
                pagesPerJob: estimatedPages,
                sharedQueue: false,
                loadBalancing: 'round-robin',
            },
        };
    }
    else if (estimatedPages < 10000) {
        // Medium site: moderate parallelism
        return {
            config: exports.ownSiteConfig,
            parallel: {
                totalJobs: 5,
                pagesPerJob: Math.ceil(estimatedPages / 5),
                sharedQueue: true,
                loadBalancing: 'least-loaded',
            },
        };
    }
    else {
        // Large site: maximum parallelism
        return {
            config: exports.ultraFastConfig,
            parallel: {
                totalJobs: 20,
                pagesPerJob: Math.ceil(estimatedPages / 20),
                sharedQueue: true,
                loadBalancing: 'domain-based', // If multiple subdomains
            },
        };
    }
}
