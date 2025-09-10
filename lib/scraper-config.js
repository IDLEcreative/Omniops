"use strict";
/**
 * Advanced Configuration Management System for E-commerce Scraper
 *
 * Provides a flexible, hierarchical configuration system with:
 * - Multiple configuration sources (env, DB, files, runtime)
 * - Platform-specific overrides
 * - Hot reload capability
 * - Validation and defaults
 * - Performance tuning parameters
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.configManager = exports.ConfigPresets = exports.ScraperConfigManager = exports.ScraperConfigSchema = void 0;
exports.getScraperConfig = getScraperConfig;
exports.updateScraperConfig = updateScraperConfig;
exports.applyConfigPreset = applyConfigPreset;
exports.loadCustomerConfig = loadCustomerConfig;
exports.saveCustomerConfig = saveCustomerConfig;
const zod_1 = require("zod");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const yaml = __importStar(require("js-yaml"));
const events_1 = require("events");
const supabase_js_1 = require("@supabase/supabase-js");
// ============================================================================
// CONFIGURATION SCHEMAS
// ============================================================================
/**
 * Extraction settings schema
 */
const ExtractionSettingsSchema = zod_1.z.object({
    // Platform-specific selectors
    platformOverrides: zod_1.z.record(zod_1.z.string(), zod_1.z.object({
        selectors: zod_1.z.object({
            productName: zod_1.z.array(zod_1.z.string()).optional(),
            price: zod_1.z.array(zod_1.z.string()).optional(),
            image: zod_1.z.array(zod_1.z.string()).optional(),
            availability: zod_1.z.array(zod_1.z.string()).optional(),
            sku: zod_1.z.array(zod_1.z.string()).optional(),
            description: zod_1.z.array(zod_1.z.string()).optional(),
            variants: zod_1.z.array(zod_1.z.string()).optional(),
            specifications: zod_1.z.array(zod_1.z.string()).optional(),
        }).optional(),
        waitForSelectors: zod_1.z.array(zod_1.z.string()).optional(),
        extractionPriority: zod_1.z.array(zod_1.z.enum(['json-ld', 'microdata', 'dom', 'learned-patterns'])).optional(),
    })).default({}),
    // Extraction strategies
    strategies: zod_1.z.object({
        jsonLdEnabled: zod_1.z.boolean().default(true),
        microdataEnabled: zod_1.z.boolean().default(true),
        domScrapingEnabled: zod_1.z.boolean().default(true),
        patternLearningEnabled: zod_1.z.boolean().default(true),
        fallbackChain: zod_1.z.array(zod_1.z.string()).default(['json-ld', 'microdata', 'learned-patterns', 'dom']),
    }).default({}),
    // Content filters
    filters: zod_1.z.object({
        minPrice: zod_1.z.number().min(0).optional(),
        maxPrice: zod_1.z.number().min(0).optional(),
        excludeCategories: zod_1.z.array(zod_1.z.string()).default([]),
        includeCategories: zod_1.z.array(zod_1.z.string()).default([]),
        excludeOutOfStock: zod_1.z.boolean().default(false),
        requireImages: zod_1.z.boolean().default(false),
        requirePrice: zod_1.z.boolean().default(true),
        minDescriptionLength: zod_1.z.number().default(0),
        maxDescriptionLength: zod_1.z.number().optional(),
    }).default({}),
    // Data enrichment
    enrichment: zod_1.z.object({
        normalizeProductNames: zod_1.z.boolean().default(true),
        extractColorFromImages: zod_1.z.boolean().default(false),
        inferCategories: zod_1.z.boolean().default(true),
        calculatePriceHistory: zod_1.z.boolean().default(false),
        detectDuplicates: zod_1.z.boolean().default(true),
    }).default({}),
});
/**
 * Performance tuning schema
 */
const PerformanceSettingsSchema = zod_1.z.object({
    // Concurrent pages
    concurrency: zod_1.z.object({
        maxConcurrentPages: zod_1.z.number().min(1).max(100).default(5),
        maxConcurrentDomains: zod_1.z.number().min(1).max(20).default(3),
        queueSize: zod_1.z.number().min(100).max(100000).default(1000),
        priorityQueuing: zod_1.z.boolean().default(true),
    }).default({}),
    // Request delays
    delays: zod_1.z.object({
        minRequestDelay: zod_1.z.number().min(0).max(10000).default(100),
        maxRequestDelay: zod_1.z.number().min(0).max(30000).default(2000),
        delayBetweenBatches: zod_1.z.number().min(0).max(60000).default(5000),
        adaptiveDelayEnabled: zod_1.z.boolean().default(true),
        delayMultiplier: zod_1.z.number().min(1).max(5).default(1.5),
    }).default({}),
    // Timeout values
    timeouts: zod_1.z.object({
        pageLoad: zod_1.z.number().min(5000).max(120000).default(30000),
        navigation: zod_1.z.number().min(5000).max(120000).default(30000),
        selector: zod_1.z.number().min(1000).max(30000).default(10000),
        script: zod_1.z.number().min(1000).max(30000).default(10000),
        idle: zod_1.z.number().min(0).max(10000).default(2000),
    }).default({}),
    // Resource management
    resources: zod_1.z.object({
        maxMemoryMB: zod_1.z.number().min(512).max(8192).default(2048),
        maxCpuPercent: zod_1.z.number().min(10).max(100).default(80),
        blockImages: zod_1.z.boolean().default(false),
        blockStyles: zod_1.z.boolean().default(false),
        blockFonts: zod_1.z.boolean().default(true),
        blockMedia: zod_1.z.boolean().default(true),
        blockAnalytics: zod_1.z.boolean().default(true),
    }).default({}),
    // Caching
    caching: zod_1.z.object({
        enableResponseCache: zod_1.z.boolean().default(true),
        cacheValidityMinutes: zod_1.z.number().min(0).max(1440).default(60),
        maxCacheSize: zod_1.z.number().min(0).max(10000).default(1000),
        cacheStrategy: zod_1.z.enum(['lru', 'lfu', 'ttl']).default('lru'),
    }).default({}),
});
/**
 * Pattern learning settings schema
 */
const PatternLearningSchema = zod_1.z.object({
    enabled: zod_1.z.boolean().default(true),
    // Learning thresholds
    thresholds: zod_1.z.object({
        minConfidence: zod_1.z.number().min(0).max(1).default(0.7),
        minSamples: zod_1.z.number().min(1).max(100).default(5),
        successRateThreshold: zod_1.z.number().min(0).max(1).default(0.8),
        patternAgeMaxDays: zod_1.z.number().min(1).max(365).default(30),
    }).default({}),
    // Pattern management
    patterns: zod_1.z.object({
        maxPatternsPerDomain: zod_1.z.number().min(10).max(1000).default(100),
        maxPatternsTotal: zod_1.z.number().min(100).max(100000).default(10000),
        autoCleanupEnabled: zod_1.z.boolean().default(true),
        mergeSimilarPatterns: zod_1.z.boolean().default(true),
    }).default({}),
    // Learning behavior
    behavior: zod_1.z.object({
        learnFromFailures: zod_1.z.boolean().default(true),
        adaptToChanges: zod_1.z.boolean().default(true),
        shareAcrossDomains: zod_1.z.boolean().default(false),
        persistToDatabase: zod_1.z.boolean().default(true),
    }).default({}),
});
/**
 * Rate limiting settings schema
 */
const RateLimitingSchema = zod_1.z.object({
    // Per-domain limits
    perDomain: zod_1.z.object({
        requestsPerSecond: zod_1.z.number().min(0.1).max(100).default(2),
        requestsPerMinute: zod_1.z.number().min(1).max(1000).default(60),
        burstSize: zod_1.z.number().min(1).max(100).default(10),
        cooldownMs: zod_1.z.number().min(0).max(60000).default(1000),
    }).default({}),
    // Global limits
    global: zod_1.z.object({
        maxRequestsPerSecond: zod_1.z.number().min(1).max(1000).default(20),
        maxActiveDoamins: zod_1.z.number().min(1).max(100).default(10),
        respectRobotsTxt: zod_1.z.boolean().default(true),
        respectCrawlDelay: zod_1.z.boolean().default(true),
    }).default({}),
    // Backoff strategies
    backoff: zod_1.z.object({
        strategy: zod_1.z.enum(['exponential', 'linear', 'constant', 'adaptive']).default('exponential'),
        initialDelayMs: zod_1.z.number().min(100).max(10000).default(1000),
        maxDelayMs: zod_1.z.number().min(1000).max(300000).default(60000),
        multiplier: zod_1.z.number().min(1).max(5).default(2),
        jitter: zod_1.z.boolean().default(true),
    }).default({}),
    // User agent rotation
    userAgents: zod_1.z.object({
        rotationEnabled: zod_1.z.boolean().default(true),
        rotationInterval: zod_1.z.number().min(1).max(100).default(10),
        agents: zod_1.z.array(zod_1.z.string()).default([
            'Mozilla/5.0 (compatible; CustomerServiceBot/1.0)',
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        ]),
    }).default({}),
});
/**
 * Browser settings schema
 */
const BrowserSettingsSchema = zod_1.z.object({
    headless: zod_1.z.boolean().default(true),
    viewport: zod_1.z.object({
        width: zod_1.z.number().min(320).max(3840).default(1920),
        height: zod_1.z.number().min(240).max(2160).default(1080),
        deviceScaleFactor: zod_1.z.number().min(1).max(3).default(1),
        isMobile: zod_1.z.boolean().default(false),
    }).default({}),
    stealth: zod_1.z.object({
        enabled: zod_1.z.boolean().default(true),
        evasions: zod_1.z.array(zod_1.z.string()).default([
            'chrome.runtime',
            'navigator.webdriver',
            'navigator.plugins',
            'iframe.contentWindow',
        ]),
    }).default({}),
    cookies: zod_1.z.object({
        acceptCookies: zod_1.z.boolean().default(true),
        persistCookies: zod_1.z.boolean().default(false),
        cookieFile: zod_1.z.string().optional(),
    }).default({}),
    proxy: zod_1.z.object({
        enabled: zod_1.z.boolean().default(false),
        url: zod_1.z.string().optional(),
        username: zod_1.z.string().optional(),
        password: zod_1.z.string().optional(),
        rotateProxies: zod_1.z.boolean().default(false),
        proxyList: zod_1.z.array(zod_1.z.string()).default([]),
    }).default({}),
});
/**
 * Complete scraper configuration schema
 */
exports.ScraperConfigSchema = zod_1.z.object({
    // Configuration metadata
    version: zod_1.z.string().default('1.0.0'),
    name: zod_1.z.string().optional(),
    description: zod_1.z.string().optional(),
    environment: zod_1.z.enum(['development', 'staging', 'production']).default('development'),
    // Main configuration sections
    extraction: ExtractionSettingsSchema.default({}),
    performance: PerformanceSettingsSchema.default({}),
    patternLearning: PatternLearningSchema.default({}),
    rateLimiting: RateLimitingSchema.default({}),
    browser: BrowserSettingsSchema.default({}),
    // Feature flags
    features: zod_1.z.object({
        enableEcommerce: zod_1.z.boolean().default(true),
        enablePatternLearning: zod_1.z.boolean().default(true),
        enableAdaptiveDelays: zod_1.z.boolean().default(true),
        enableMemoryManagement: zod_1.z.boolean().default(true),
        enableErrorRecovery: zod_1.z.boolean().default(true),
        enableMetrics: zod_1.z.boolean().default(true),
    }).default({}),
    // Logging
    logging: zod_1.z.object({
        level: zod_1.z.enum(['debug', 'info', 'warn', 'error']).default('info'),
        logToFile: zod_1.z.boolean().default(false),
        logFile: zod_1.z.string().optional(),
        logRotation: zod_1.z.boolean().default(true),
        maxLogSizeMB: zod_1.z.number().default(100),
    }).default({}),
});
// ============================================================================
// CONFIGURATION MANAGER
// ============================================================================
/**
 * Configuration source priority (higher number = higher priority)
 */
var ConfigPriority;
(function (ConfigPriority) {
    ConfigPriority[ConfigPriority["DEFAULTS"] = 0] = "DEFAULTS";
    ConfigPriority[ConfigPriority["FILE"] = 1] = "FILE";
    ConfigPriority[ConfigPriority["DATABASE"] = 2] = "DATABASE";
    ConfigPriority[ConfigPriority["ENVIRONMENT"] = 3] = "ENVIRONMENT";
    ConfigPriority[ConfigPriority["RUNTIME"] = 4] = "RUNTIME";
})(ConfigPriority || (ConfigPriority = {}));
/**
 * Advanced configuration manager with hot reload and multiple sources
 */
class ScraperConfigManager extends events_1.EventEmitter {
    constructor() {
        super();
        this.configSources = new Map();
        this.configCache = new Map();
        this.lastReload = 0;
        this.reloadInterval = 60000; // 1 minute
        this.config = exports.ScraperConfigSchema.parse({});
        this.initializeSources();
    }
    /**
     * Get singleton instance
     */
    static getInstance() {
        if (!ScraperConfigManager.instance) {
            ScraperConfigManager.instance = new ScraperConfigManager();
        }
        return ScraperConfigManager.instance;
    }
    /**
     * Initialize configuration sources
     */
    async initializeSources() {
        // Load defaults
        this.configSources.set(ConfigPriority.DEFAULTS, this.getDefaultConfig());
        // Load from file if exists
        await this.loadFromFile();
        // Load from environment
        this.loadFromEnvironment();
        // Initialize database connection if credentials available
        this.initializeDatabase();
        // Merge all sources
        this.mergeConfigurations();
        // Set up file watching for hot reload
        this.setupFileWatcher();
    }
    /**
     * Get default configuration
     */
    getDefaultConfig() {
        return {
            version: '1.0.0',
            environment: 'development',
            extraction: {
                strategies: {
                    jsonLdEnabled: true,
                    microdataEnabled: true,
                    domScrapingEnabled: true,
                    patternLearningEnabled: true,
                    fallbackChain: ['json-ld', 'microdata', 'learned-patterns', 'dom'],
                },
                filters: {
                    excludeCategories: [],
                    includeCategories: [],
                    excludeOutOfStock: false,
                    requireImages: false,
                    requirePrice: true,
                    minDescriptionLength: 0,
                },
                enrichment: {
                    normalizeProductNames: true,
                    extractColorFromImages: false,
                    inferCategories: true,
                    calculatePriceHistory: false,
                    detectDuplicates: true,
                },
                platformOverrides: {},
            },
            performance: {
                concurrency: {
                    maxConcurrentPages: 5,
                    maxConcurrentDomains: 3,
                    queueSize: 100,
                    priorityQueuing: false,
                },
                delays: {
                    minRequestDelay: 100,
                    maxRequestDelay: 2000,
                    delayBetweenBatches: 5000,
                    adaptiveDelayEnabled: true,
                    delayMultiplier: 1.5,
                },
                timeouts: {
                    script: 10000,
                    navigation: 30000,
                    idle: 5000,
                    pageLoad: 30000,
                    selector: 5000,
                },
                caching: {
                    enableResponseCache: true,
                    cacheValidityMinutes: 60,
                    maxCacheSize: 100,
                    cacheStrategy: 'lru',
                },
                resources: {
                    maxMemoryMB: 512,
                    maxCpuPercent: 50,
                    blockImages: false,
                    blockStyles: false,
                    blockFonts: false,
                    blockMedia: false,
                    blockAnalytics: false,
                },
            },
            patternLearning: {
                enabled: true,
                behavior: {
                    learnFromFailures: true,
                    adaptToChanges: true,
                    shareAcrossDomains: false,
                    persistToDatabase: true,
                },
                patterns: {
                    maxPatternsPerDomain: 100,
                    maxPatternsTotal: 1000,
                    autoCleanupEnabled: true,
                    mergeSimilarPatterns: true,
                },
                thresholds: {
                    minConfidence: 0.7,
                    minSamples: 5,
                    successRateThreshold: 0.8,
                    patternAgeMaxDays: 30,
                },
            },
            rateLimiting: {
                perDomain: {
                    requestsPerSecond: 2,
                    requestsPerMinute: 60,
                    burstSize: 5,
                    cooldownMs: 1000,
                },
                global: {
                    respectRobotsTxt: true,
                    maxRequestsPerSecond: 10,
                    maxActiveDoamins: 5,
                    respectCrawlDelay: true,
                },
                backoff: {
                    strategy: 'exponential',
                    initialDelayMs: 1000,
                    maxDelayMs: 30000,
                    multiplier: 2,
                    jitter: true,
                },
                userAgents: {
                    rotationEnabled: true,
                    rotationInterval: 10,
                    agents: [],
                },
            },
            browser: {
                headless: true,
                viewport: {
                    width: 1920,
                    height: 1080,
                    deviceScaleFactor: 1,
                    isMobile: false,
                },
                cookies: {
                    acceptCookies: true,
                    persistCookies: false,
                },
                proxy: {
                    enabled: false,
                    rotateProxies: false,
                    proxyList: [],
                },
                stealth: {
                    enabled: true,
                    evasions: [
                        'chrome.app',
                        'chrome.csi',
                        'chrome.loadTimes',
                        'chrome.runtime',
                        'iframe.contentWindow',
                        'media.codecs',
                        'navigator.hardwareConcurrency',
                        'navigator.languages',
                        'navigator.permissions',
                        'navigator.platform',
                        'navigator.plugins',
                        'navigator.webdriver',
                        'window.outerHeight',
                        'window.outerWidth'
                    ],
                },
            },
        };
    }
    /**
     * Load configuration from file
     */
    async loadFromFile(filepath) {
        const configPaths = [
            filepath,
            path.join(process.cwd(), 'scraper-config.yaml'),
            path.join(process.cwd(), 'scraper-config.yml'),
            path.join(process.cwd(), 'scraper-config.json'),
            path.join(process.cwd(), '.scraper-config.yaml'),
            path.join(process.cwd(), '.scraper-config.json'),
        ].filter(Boolean);
        for (const configPath of configPaths) {
            if (fs.existsSync(configPath)) {
                try {
                    const fileContent = fs.readFileSync(configPath, 'utf-8');
                    let parsedConfig;
                    if (configPath.endsWith('.json')) {
                        parsedConfig = JSON.parse(fileContent);
                    }
                    else if (configPath.endsWith('.yaml') || configPath.endsWith('.yml')) {
                        parsedConfig = yaml.load(fileContent);
                    }
                    if (parsedConfig) {
                        this.configSources.set(ConfigPriority.FILE, parsedConfig);
                        console.log(`Loaded configuration from ${configPath}`);
                        break;
                    }
                }
                catch (error) {
                    console.error(`Error loading configuration from ${configPath}:`, error);
                }
            }
        }
    }
    /**
     * Load configuration from environment variables
     */
    loadFromEnvironment() {
        const envConfig = {};
        // Map environment variables to configuration
        const envMappings = {
            'SCRAPER_MAX_CONCURRENT_PAGES': 'performance.concurrency.maxConcurrentPages',
            'SCRAPER_MIN_DELAY': 'performance.delays.minRequestDelay',
            'SCRAPER_MAX_DELAY': 'performance.delays.maxRequestDelay',
            'SCRAPER_PAGE_TIMEOUT': 'performance.timeouts.pageLoad',
            'SCRAPER_REQUESTS_PER_SECOND': 'rateLimiting.perDomain.requestsPerSecond',
            'SCRAPER_RESPECT_ROBOTS': 'rateLimiting.global.respectRobotsTxt',
            'SCRAPER_HEADLESS': 'browser.headless',
            'SCRAPER_USER_AGENT': 'rateLimiting.userAgents.agents[0]',
            'SCRAPER_ENABLE_PATTERNS': 'patternLearning.enabled',
            'SCRAPER_MIN_CONFIDENCE': 'patternLearning.thresholds.minConfidence',
            'SCRAPER_BLOCK_IMAGES': 'performance.resources.blockImages',
            'SCRAPER_PROXY_URL': 'browser.proxy.url',
            'SCRAPER_LOG_LEVEL': 'logging.level',
        };
        for (const [envVar, configPath] of Object.entries(envMappings)) {
            const value = process.env[envVar];
            if (value !== undefined) {
                this.setNestedProperty(envConfig, configPath, this.parseEnvValue(value));
            }
        }
        if (Object.keys(envConfig).length > 0) {
            this.configSources.set(ConfigPriority.ENVIRONMENT, envConfig);
        }
    }
    /**
     * Initialize database connection for config storage
     */
    initializeDatabase() {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        if (supabaseUrl && supabaseKey) {
            this.supabase = (0, supabase_js_1.createClient)(supabaseUrl, supabaseKey);
        }
    }
    /**
     * Load configuration from database for a specific customer
     */
    async loadFromDatabase(customerId) {
        if (!this.supabase) {
            console.warn('Database not initialized, skipping database config load');
            return;
        }
        this.customerId = customerId;
        try {
            const { data, error } = await this.supabase
                .from('scraper_configs')
                .select('config')
                .eq('customer_id', customerId)
                .single();
            if (error) {
                console.error('Error loading config from database:', error);
                return;
            }
            if (data?.config) {
                this.configSources.set(ConfigPriority.DATABASE, data.config);
                this.mergeConfigurations();
                this.emit('configLoaded', { source: 'database', customerId });
            }
        }
        catch (error) {
            console.error('Error loading config from database:', error);
        }
    }
    /**
     * Save current configuration to database
     */
    async saveToDatabase(customerId) {
        if (!this.supabase) {
            throw new Error('Database not initialized');
        }
        const targetCustomerId = customerId || this.customerId;
        if (!targetCustomerId) {
            throw new Error('Customer ID required to save configuration');
        }
        try {
            const { error } = await this.supabase
                .from('scraper_configs')
                .upsert({
                customer_id: targetCustomerId,
                config: this.config,
                updated_at: new Date().toISOString(),
            });
            if (error) {
                throw error;
            }
            this.emit('configSaved', { customerId: targetCustomerId });
        }
        catch (error) {
            console.error('Error saving config to database:', error);
            throw error;
        }
    }
    /**
     * Merge all configuration sources
     */
    mergeConfigurations() {
        const priorities = [
            ConfigPriority.DEFAULTS,
            ConfigPriority.FILE,
            ConfigPriority.DATABASE,
            ConfigPriority.ENVIRONMENT,
            ConfigPriority.RUNTIME,
        ];
        let mergedConfig = {};
        for (const priority of priorities) {
            const source = this.configSources.get(priority);
            if (source) {
                mergedConfig = this.deepMerge(mergedConfig, source);
            }
        }
        // Validate and parse the merged configuration
        try {
            const oldConfig = this.config;
            this.config = exports.ScraperConfigSchema.parse(mergedConfig);
            // Emit change events
            this.detectAndEmitChanges(oldConfig, this.config);
        }
        catch (error) {
            console.error('Invalid configuration after merge:', error);
        }
    }
    /**
     * Deep merge two objects
     */
    deepMerge(target, source) {
        const result = { ...target };
        for (const key in source) {
            if (source[key] !== undefined) {
                if (typeof source[key] === 'object' && !Array.isArray(source[key]) && source[key] !== null) {
                    result[key] = this.deepMerge(result[key] || {}, source[key]);
                }
                else {
                    result[key] = source[key];
                }
            }
        }
        return result;
    }
    /**
     * Set nested property in object
     */
    setNestedProperty(obj, path, value) {
        const keys = path.split('.');
        let current = obj;
        for (let i = 0; i < keys.length - 1; i++) {
            const key = keys[i];
            // Handle array notation
            if (key && key.includes('[')) {
                const parts = key.split('[');
                const arrayKey = parts[0];
                const indexStr = parts[1];
                if (arrayKey && indexStr) {
                    const index = parseInt(indexStr.replace(']', ''));
                    if (!current[arrayKey]) {
                        current[arrayKey] = [];
                    }
                    const arr = current[arrayKey];
                    if (!arr[index]) {
                        arr[index] = {};
                    }
                    current = arr[index] || {};
                }
            }
            else if (key) {
                if (!current[key]) {
                    current[key] = {};
                }
                current = current[key] || {};
            }
        }
        const lastKey = keys[keys.length - 1];
        if (lastKey && lastKey.includes('[')) {
            const parts = lastKey.split('[');
            const arrayKey = parts[0];
            const indexStr = parts[1];
            if (arrayKey && indexStr) {
                const index = parseInt(indexStr.replace(']', ''));
                if (!current[arrayKey]) {
                    current[arrayKey] = [];
                }
                if (!isNaN(index)) {
                    current[arrayKey][index] = value;
                }
            }
        }
        else if (lastKey) {
            current[lastKey] = value;
        }
    }
    /**
     * Parse environment variable value
     */
    parseEnvValue(value) {
        // Try to parse as JSON
        try {
            return JSON.parse(value);
        }
        catch {
            // Not JSON
        }
        // Check for boolean
        if (value.toLowerCase() === 'true')
            return true;
        if (value.toLowerCase() === 'false')
            return false;
        // Check for number
        const num = Number(value);
        if (!isNaN(num))
            return num;
        // Return as string
        return value;
    }
    /**
     * Set up file watcher for hot reload
     */
    setupFileWatcher() {
        const configPaths = [
            path.join(process.cwd(), 'scraper-config.yaml'),
            path.join(process.cwd(), 'scraper-config.yml'),
            path.join(process.cwd(), 'scraper-config.json'),
        ];
        for (const configPath of configPaths) {
            if (fs.existsSync(configPath)) {
                this.fileWatcher = fs.watch(configPath, async (eventType) => {
                    if (eventType === 'change') {
                        console.log('Configuration file changed, reloading...');
                        await this.reload();
                    }
                });
                break;
            }
        }
    }
    /**
     * Reload configuration from all sources
     */
    async reload() {
        const now = Date.now();
        if (now - this.lastReload < 1000) {
            // Debounce rapid reloads
            return;
        }
        this.lastReload = now;
        // Clear runtime overrides
        this.configSources.delete(ConfigPriority.RUNTIME);
        // Reload from file
        await this.loadFromFile();
        // Reload from environment
        this.loadFromEnvironment();
        // Reload from database if customer ID is set
        if (this.customerId) {
            await this.loadFromDatabase(this.customerId);
        }
        // Merge all sources
        this.mergeConfigurations();
        this.emit('configReloaded');
    }
    /**
     * Detect and emit change events
     */
    detectAndEmitChanges(oldConfig, newConfig, path = '') {
        for (const key in newConfig) {
            const currentPath = path ? `${path}.${key}` : key;
            if (typeof newConfig[key] === 'object' && !Array.isArray(newConfig[key]) && newConfig[key] !== null) {
                if (oldConfig && typeof oldConfig[key] === 'object' && oldConfig[key] !== null && !Array.isArray(oldConfig[key])) {
                    this.detectAndEmitChanges(oldConfig[key], newConfig[key], currentPath);
                }
            }
            else {
                if (!oldConfig || oldConfig[key] !== newConfig[key]) {
                    this.emit('configChanged', {
                        section: currentPath.split('.')[0],
                        key: currentPath,
                        oldValue: oldConfig?.[key],
                        newValue: newConfig[key],
                        source: 'merge',
                    });
                }
            }
        }
    }
    // ============================================================================
    // PUBLIC API
    // ============================================================================
    /**
     * Get the current configuration
     */
    getConfig() {
        return this.config;
    }
    /**
     * Get a specific configuration section
     */
    getSection(section) {
        return this.config[section];
    }
    /**
     * Get a configuration value by path
     */
    get(path) {
        const keys = path.split('.');
        let current = this.config;
        for (const key of keys) {
            if (current && typeof current === 'object' && key in current) {
                current = current[key];
            }
            else {
                return undefined;
            }
        }
        return current;
    }
    /**
     * Set a runtime configuration override
     */
    set(path, value) {
        const runtimeConfig = this.configSources.get(ConfigPriority.RUNTIME) || {};
        this.setNestedProperty(runtimeConfig, path, value);
        this.configSources.set(ConfigPriority.RUNTIME, runtimeConfig);
        this.mergeConfigurations();
    }
    /**
     * Update multiple configuration values
     */
    update(updates) {
        const runtimeConfig = this.configSources.get(ConfigPriority.RUNTIME) || {};
        const merged = this.deepMerge(runtimeConfig, updates);
        this.configSources.set(ConfigPriority.RUNTIME, merged);
        this.mergeConfigurations();
    }
    /**
     * Reset configuration to defaults
     */
    reset() {
        this.configSources.clear();
        this.configSources.set(ConfigPriority.DEFAULTS, this.getDefaultConfig());
        this.mergeConfigurations();
        this.emit('configReset');
    }
    /**
     * Validate a configuration object
     */
    validate(config) {
        try {
            exports.ScraperConfigSchema.parse(config);
            return { valid: true };
        }
        catch (error) {
            return { valid: false, errors: error instanceof zod_1.ZodError ? error : undefined };
        }
    }
    /**
     * Export configuration to file
     */
    async exportToFile(filepath, format = 'yaml') {
        let content;
        if (format === 'json') {
            content = JSON.stringify(this.config, null, 2);
        }
        else {
            content = yaml.dump(this.config);
        }
        await fs.promises.writeFile(filepath, content, 'utf-8');
        this.emit('configExported', { filepath, format });
    }
    /**
     * Get platform-specific configuration
     */
    getPlatformConfig(platform) {
        return this.config.extraction.platformOverrides[platform] || {};
    }
    /**
     * Set platform-specific configuration
     */
    setPlatformConfig(platform, config) {
        this.set(`extraction.platformOverrides.${platform}`, config);
    }
    /**
     * Get effective configuration for a URL
     */
    getEffectiveConfig(url) {
        // This could be extended to apply domain-specific overrides
        // For now, return the base configuration
        return this.config;
    }
    /**
     * Clean up resources
     */
    dispose() {
        if (this.fileWatcher) {
            this.fileWatcher.close();
        }
        this.removeAllListeners();
    }
}
exports.ScraperConfigManager = ScraperConfigManager;
// ============================================================================
// PRESET CONFIGURATIONS
// ============================================================================
/**
 * Preset configurations for different use cases
 */
exports.ConfigPresets = {
    /**
     * Fast extraction for well-structured sites
     */
    fast: {
        performance: {
            concurrency: {
                maxConcurrentPages: 20,
                maxConcurrentDomains: 5,
                queueSize: 200,
                priorityQueuing: false,
            },
            delays: {
                minRequestDelay: 0,
                maxRequestDelay: 500,
                delayBetweenBatches: 1000,
                adaptiveDelayEnabled: false,
                delayMultiplier: 1.0,
            },
            timeouts: {
                script: 5000,
                navigation: 15000,
                idle: 3000,
                pageLoad: 15000,
                selector: 3000,
            },
            resources: {
                maxMemoryMB: 512,
                maxCpuPercent: 50,
                blockImages: true,
                blockStyles: true,
                blockFonts: true,
                blockMedia: true,
                blockAnalytics: true,
            },
            caching: {
                enableResponseCache: true,
                cacheValidityMinutes: 30,
                maxCacheSize: 500,
                cacheStrategy: 'lru',
            },
        },
        extraction: {
            platformOverrides: {},
            strategies: {
                jsonLdEnabled: true,
                microdataEnabled: false,
                domScrapingEnabled: false,
                patternLearningEnabled: true,
                fallbackChain: ['json-ld', 'learned-patterns'],
            },
            filters: {
                minPrice: 0,
                excludeCategories: [],
                includeCategories: [],
                excludeOutOfStock: false,
                requireImages: false,
                requirePrice: true,
                minDescriptionLength: 0,
            },
            enrichment: {
                normalizeProductNames: true,
                extractColorFromImages: false,
                inferCategories: false,
                calculatePriceHistory: false,
                detectDuplicates: true,
            },
        },
    },
    /**
     * Thorough extraction for complex sites
     */
    thorough: {
        performance: {
            concurrency: {
                maxConcurrentPages: 3,
                maxConcurrentDomains: 1,
                queueSize: 50,
                priorityQueuing: true,
            },
            delays: {
                minRequestDelay: 2000,
                maxRequestDelay: 5000,
                delayBetweenBatches: 10000,
                adaptiveDelayEnabled: true,
                delayMultiplier: 1.5,
            },
            timeouts: {
                script: 20000,
                navigation: 60000,
                idle: 10000,
                pageLoad: 60000,
                selector: 20000,
            },
            resources: {
                maxMemoryMB: 2048,
                maxCpuPercent: 70,
                blockImages: false,
                blockStyles: false,
                blockFonts: false,
                blockMedia: false,
                blockAnalytics: false,
            },
            caching: {
                enableResponseCache: true,
                cacheValidityMinutes: 120,
                maxCacheSize: 2000,
                cacheStrategy: 'lru',
            },
        },
        extraction: {
            platformOverrides: {},
            strategies: {
                jsonLdEnabled: true,
                microdataEnabled: true,
                domScrapingEnabled: true,
                patternLearningEnabled: true,
                fallbackChain: ['json-ld', 'microdata', 'learned-patterns', 'dom'],
            },
            filters: {
                minPrice: 0,
                excludeCategories: [],
                includeCategories: [],
                excludeOutOfStock: true,
                requireImages: true,
                requirePrice: true,
                minDescriptionLength: 10,
            },
            enrichment: {
                normalizeProductNames: true,
                extractColorFromImages: true,
                inferCategories: true,
                calculatePriceHistory: true,
                detectDuplicates: true,
            },
        },
        browser: {
            viewport: {
                width: 1920,
                height: 1080,
                deviceScaleFactor: 1,
                isMobile: false,
            },
            cookies: {
                acceptCookies: true,
                persistCookies: true,
            },
            headless: true,
            stealth: {
                enabled: true,
                evasions: ['chrome.runtime', 'navigator.webdriver'],
            },
            proxy: {
                enabled: false,
                rotateProxies: false,
                proxyList: [],
            },
        },
    },
    /**
     * Stealth mode for sites with anti-bot measures
     */
    stealth: {
        performance: {
            concurrency: {
                maxConcurrentPages: 1,
                maxConcurrentDomains: 1,
                queueSize: 20,
                priorityQueuing: false,
            },
            delays: {
                minRequestDelay: 5000,
                maxRequestDelay: 15000,
                delayBetweenBatches: 20000,
                adaptiveDelayEnabled: true,
                delayMultiplier: 2.0,
            },
            timeouts: {
                script: 30000,
                navigation: 45000,
                idle: 15000,
                pageLoad: 45000,
                selector: 10000,
            },
            resources: {
                maxMemoryMB: 1024,
                maxCpuPercent: 50,
                blockImages: false,
                blockStyles: false,
                blockFonts: true,
                blockMedia: true,
                blockAnalytics: true,
            },
            caching: {
                enableResponseCache: false,
                cacheValidityMinutes: 5,
                maxCacheSize: 100,
                cacheStrategy: 'ttl',
            },
        },
        rateLimiting: {
            perDomain: {
                requestsPerSecond: 0.5,
                requestsPerMinute: 20,
                burstSize: 2,
                cooldownMs: 5000,
            },
            global: {
                respectRobotsTxt: true,
                maxRequestsPerSecond: 2,
                maxActiveDoamins: 1,
                respectCrawlDelay: true,
            },
            backoff: {
                strategy: 'exponential',
                initialDelayMs: 5000,
                maxDelayMs: 60000,
                multiplier: 2,
                jitter: true,
            },
            userAgents: {
                rotationEnabled: true,
                rotationInterval: 1,
                agents: [
                    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
                ],
            },
        },
        browser: {
            viewport: {
                width: 1366,
                height: 768,
                deviceScaleFactor: 1,
                isMobile: false,
            },
            cookies: {
                acceptCookies: true,
                persistCookies: true,
            },
            headless: false,
            stealth: {
                enabled: true,
                evasions: [
                    'chrome.runtime',
                    'navigator.webdriver',
                    'navigator.plugins',
                    'navigator.permissions',
                    'navigator.languages',
                    'iframe.contentWindow',
                    'media.codecs',
                ],
            },
            proxy: {
                enabled: false,
                rotateProxies: false,
                proxyList: [],
            },
        },
    },
    /**
     * E-commerce optimized
     */
    ecommerce: {
        extraction: {
            platformOverrides: {},
            strategies: {
                jsonLdEnabled: true,
                microdataEnabled: true,
                domScrapingEnabled: true,
                patternLearningEnabled: true,
                fallbackChain: ['json-ld', 'microdata', 'dom', 'learned-patterns'],
            },
            filters: {
                minPrice: 0,
                excludeCategories: [],
                includeCategories: [],
                excludeOutOfStock: false,
                requireImages: true,
                requirePrice: true,
                minDescriptionLength: 5,
            },
            enrichment: {
                normalizeProductNames: true,
                extractColorFromImages: false,
                inferCategories: true,
                calculatePriceHistory: false,
                detectDuplicates: true,
            },
        },
        performance: {
            concurrency: {
                maxConcurrentPages: 5,
                maxConcurrentDomains: 2,
                queueSize: 100,
                priorityQueuing: true,
            },
            delays: {
                minRequestDelay: 1000,
                maxRequestDelay: 3000,
                delayBetweenBatches: 5000,
                adaptiveDelayEnabled: true,
                delayMultiplier: 1.2,
            },
            timeouts: {
                script: 15000,
                navigation: 30000,
                idle: 5000,
                pageLoad: 30000,
                selector: 10000,
            },
            resources: {
                maxMemoryMB: 1024,
                maxCpuPercent: 60,
                blockImages: false, // Need images for products
                blockStyles: false, // Need styles for layout detection
                blockFonts: true,
                blockMedia: true,
                blockAnalytics: true,
            },
            caching: {
                enableResponseCache: true,
                cacheValidityMinutes: 60,
                maxCacheSize: 1000,
                cacheStrategy: 'lru',
            },
        },
        patternLearning: {
            enabled: true,
            behavior: {
                learnFromFailures: true,
                adaptToChanges: true,
                shareAcrossDomains: false,
                persistToDatabase: true,
            },
            patterns: {
                maxPatternsPerDomain: 100,
                maxPatternsTotal: 1000,
                autoCleanupEnabled: true,
                mergeSimilarPatterns: true,
            },
            thresholds: {
                minConfidence: 0.7,
                minSamples: 5,
                successRateThreshold: 0.8,
                patternAgeMaxDays: 30,
            },
        },
    },
    /**
     * Own site scraping (no restrictions)
     */
    ownSite: {
        performance: {
            concurrency: {
                maxConcurrentPages: 50,
                maxConcurrentDomains: 10,
                queueSize: 500,
                priorityQueuing: false,
            },
            delays: {
                minRequestDelay: 0,
                maxRequestDelay: 0,
                delayBetweenBatches: 0,
                adaptiveDelayEnabled: false,
                delayMultiplier: 1.0,
            },
            timeouts: {
                script: 5000,
                navigation: 10000,
                idle: 2000,
                pageLoad: 10000,
                selector: 2000,
            },
            resources: {
                maxMemoryMB: 4096,
                maxCpuPercent: 90,
                blockImages: false,
                blockStyles: false,
                blockFonts: false,
                blockMedia: false,
                blockAnalytics: false,
            },
            caching: {
                enableResponseCache: true,
                cacheValidityMinutes: 240,
                maxCacheSize: 5000,
                cacheStrategy: 'lru',
            },
        },
        rateLimiting: {
            perDomain: {
                requestsPerSecond: 100,
                requestsPerMinute: 6000,
                burstSize: 50,
                cooldownMs: 0,
            },
            global: {
                respectRobotsTxt: false,
                maxRequestsPerSecond: 500,
                maxActiveDoamins: 20,
                respectCrawlDelay: false,
            },
            backoff: {
                strategy: 'constant',
                initialDelayMs: 0,
                maxDelayMs: 0,
                multiplier: 1,
                jitter: false,
            },
            userAgents: {
                rotationEnabled: false,
                rotationInterval: 100,
                agents: [
                    'Mozilla/5.0 (compatible; InternalBot/1.0)',
                ],
            },
        },
        browser: {
            viewport: {
                width: 1920,
                height: 1080,
                deviceScaleFactor: 1,
                isMobile: false,
            },
            cookies: {
                acceptCookies: false,
                persistCookies: false,
            },
            headless: true,
            stealth: {
                enabled: false,
                evasions: [],
            },
            proxy: {
                enabled: false,
                rotateProxies: false,
                proxyList: [],
            },
        },
    },
};
// ============================================================================
// HELPER FUNCTIONS
// ============================================================================
/**
 * Get the global configuration instance
 */
function getScraperConfig() {
    return ScraperConfigManager.getInstance().getConfig();
}
/**
 * Update configuration at runtime
 */
function updateScraperConfig(updates) {
    ScraperConfigManager.getInstance().update(updates);
}
/**
 * Apply a preset configuration
 */
function applyConfigPreset(presetName) {
    const preset = exports.ConfigPresets[presetName];
    if (preset) {
        ScraperConfigManager.getInstance().update(preset);
    }
}
/**
 * Load configuration for a specific customer
 */
async function loadCustomerConfig(customerId) {
    await ScraperConfigManager.getInstance().loadFromDatabase(customerId);
}
/**
 * Save configuration for a specific customer
 */
async function saveCustomerConfig(customerId) {
    await ScraperConfigManager.getInstance().saveToDatabase(customerId);
}
/**
 * Export configuration manager instance for advanced usage
 */
exports.configManager = ScraperConfigManager.getInstance();
