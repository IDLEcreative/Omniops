# Scraper Configuration System

## Overview

The advanced configuration management system for the e-commerce scraper provides a flexible, hierarchical approach to managing scraper settings. It supports multiple configuration sources, hot reloading, platform-specific overrides, and runtime tuning without code changes.

## Table of Contents
- [Configuration Sources](#configuration-sources)
- [Configuration Structure](#configuration-structure)
- [Quick Start](#quick-start)
- [Usage Examples](#usage-examples)
- [Configuration Presets](#configuration-presets)
- [Platform-Specific Settings](#platform-specific-settings)
- [API Reference](#api-reference)

## Configuration Sources

The configuration system loads settings from multiple sources in priority order (highest to lowest):

1. **Runtime Overrides** - Dynamic changes made during execution
2. **Environment Variables** - For secrets and deployment-specific settings
3. **Database Configuration** - Customer-specific settings stored in Supabase
4. **Configuration Files** - YAML or JSON files in the project root
5. **Default Settings** - Built-in defaults

## Configuration Structure

The configuration is organized into the following main sections:

### Extraction Settings
- Platform-specific selectors
- Extraction strategies (JSON-LD, Microdata, DOM)
- Content filters (price ranges, categories)
- Data enrichment options

### Performance Tuning
- Concurrent pages and domains
- Request delays and timeouts
- Resource management (memory, CPU)
- Caching strategies

### Pattern Learning
- Learning thresholds and confidence levels
- Pattern management and cleanup
- Adaptive behavior settings

### Rate Limiting
- Per-domain and global limits
- Backoff strategies
- User-agent rotation

### Browser Settings
- Viewport configuration
- Stealth mode options
- Cookie and proxy management

## Quick Start

### 1. Create a Configuration File

Copy one of the example files to create your configuration:

```bash
cp scraper-config.example.yaml scraper-config.yaml
# or
cp scraper-config.example.json scraper-config.json
```

### 2. Basic Usage

```typescript
import { scrapePage, crawlWebsite } from './lib/scraper-api';

// Scrape a single page with the new config system
const result = await scrapePage('https://shop.example.com/product', {
  useNewConfig: true,
  configPreset: 'ecommerce'
});

// Crawl a website with custom configuration
const jobId = await crawlWebsite('https://shop.example.com', {
  maxPages: 100,
  useNewConfig: true,
  newConfigPreset: 'thorough'
});
```

### 3. Environment Variables

Set environment variables for sensitive data:

```bash
# Performance settings
export SCRAPER_MAX_CONCURRENT_PAGES=10
export SCRAPER_MIN_DELAY=500
export SCRAPER_MAX_DELAY=2000

# Rate limiting
export SCRAPER_REQUESTS_PER_SECOND=2
export SCRAPER_RESPECT_ROBOTS=true

# Browser settings
export SCRAPER_HEADLESS=true
export SCRAPER_USER_AGENT="MyBot/1.0"

# Features
export SCRAPER_ENABLE_PATTERNS=true
export SCRAPER_MIN_CONFIDENCE=0.75
```

## Usage Examples

### Using Configuration Presets

```typescript
import { applyConfigPreset } from './lib/scraper-config';

// Fast extraction for well-structured sites
applyConfigPreset('fast');

// Thorough extraction for complex sites
applyConfigPreset('thorough');

// Stealth mode for protected sites
applyConfigPreset('stealth');

// E-commerce optimized
applyConfigPreset('ecommerce');

// Own site (no restrictions)
applyConfigPreset('ownSite');
```

### Runtime Configuration Updates

```typescript
import { updateScraperConfig } from './lib/scraper-config';

// Update specific settings at runtime
updateScraperConfig({
  performance: {
    concurrency: {
      maxConcurrentPages: 10
    },
    delays: {
      minRequestDelay: 1000,
      adaptiveDelayEnabled: true
    }
  },
  extraction: {
    filters: {
      minPrice: 10,
      maxPrice: 1000,
      excludeOutOfStock: true
    }
  }
});
```

### Platform-Specific Configuration

```typescript
import { configManager } from './lib/scraper-config';

// Configure Shopify-specific selectors
configManager.setPlatformConfig('shopify', {
  selectors: {
    productName: ['.product__title', 'h1.product-single__title'],
    price: ['.price__regular', '.product__price'],
    availability: ['.product__availability']
  },
  extractionPriority: ['json-ld', 'microdata', 'dom']
});
```

### Customer-Specific Configuration

```typescript
import { loadCustomerConfig, saveCustomerConfig } from './lib/scraper-config';

// Load configuration for a specific customer
await loadCustomerConfig('customer-123');

// Make customer-specific changes
updateScraperConfig({
  extraction: {
    filters: {
      excludeCategories: ['accessories', 'gift-cards']
    }
  }
});

// Save changes back to database
await saveCustomerConfig('customer-123');
```

## Configuration Presets

### fast
- High concurrency (20 pages)
- Minimal delays
- Blocks unnecessary resources
- Best for well-structured sites

### thorough
- Low concurrency (3 pages)
- Longer timeouts
- All extraction methods enabled
- Best for complex sites

### stealth
- Single page concurrency
- Long delays between requests
- User-agent rotation
- Browser stealth mode enabled
- Best for sites with anti-bot measures

### ecommerce
- Optimized for product extraction
- Moderate concurrency (5 pages)
- Images not blocked
- Pattern learning enabled

### ownSite
- Maximum concurrency (50 pages)
- No delays or rate limiting
- Robots.txt ignored
- Best for scraping your own sites

## Platform-Specific Settings

The system includes pre-configured selectors for common e-commerce platforms:

- **Shopify** - Product, price, availability selectors
- **WooCommerce** - WordPress/WooCommerce specific selectors
- **Magento** - Magento 2.x selectors
- **BigCommerce** - BigCommerce platform selectors
- **Amazon** - Amazon marketplace selectors

These can be customized per deployment or customer.

## API Reference

### Core Functions

#### `getScraperConfig()`
Returns the current configuration object.

#### `updateScraperConfig(updates: Partial<ScraperConfig>)`
Updates configuration at runtime.

#### `applyConfigPreset(preset: string)`
Applies a pre-defined configuration preset.

#### `loadCustomerConfig(customerId: string)`
Loads customer-specific configuration from database.

#### `saveCustomerConfig(customerId: string)`
Saves current configuration to database for a customer.

### ConfigManager Methods

#### `configManager.get(path: string)`
Gets a configuration value by path (e.g., 'performance.concurrency.maxConcurrentPages').

#### `configManager.set(path: string, value: any)`
Sets a runtime configuration override.

#### `configManager.reload()`
Manually triggers configuration reload from all sources.

#### `configManager.exportToFile(filepath: string, format: 'json' | 'yaml')`
Exports current configuration to a file.

#### `configManager.validate(config: any)`
Validates a configuration object against the schema.

### Event Listeners

```typescript
// Listen for configuration changes
configManager.on('configChanged', (event) => {
  console.log(`Config changed: ${event.key} from ${event.oldValue} to ${event.newValue}`);
});

// Listen for configuration reload
configManager.on('configReloaded', () => {
  console.log('Configuration reloaded');
});
```

## Best Practices

1. **Start with presets** - Use configuration presets as a starting point
2. **Test incrementally** - Start with conservative settings and increase gradually
3. **Monitor performance** - Watch memory usage and response times
4. **Respect rate limits** - Always respect robots.txt unless scraping your own sites
5. **Use platform configs** - Configure platform-specific selectors for better extraction
6. **Enable pattern learning** - Let the system learn from successful extractions
7. **Customer isolation** - Keep customer configurations separate in the database

## Troubleshooting

### Configuration Not Loading
- Check file exists in project root
- Verify YAML/JSON syntax is valid
- Check environment variables are set correctly

### Platform Detection Issues
- Ensure platform-specific selectors are configured
- Check extraction priority order
- Verify pattern learning is enabled

### Performance Issues
- Reduce concurrent pages
- Increase delays between requests
- Enable adaptive delays
- Check memory settings

### Extraction Failures
- Verify selectors are up-to-date
- Check extraction strategy order
- Enable all extraction methods for debugging
- Review pattern learning confidence thresholds