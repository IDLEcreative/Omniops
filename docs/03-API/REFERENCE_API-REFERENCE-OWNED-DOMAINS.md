# API Reference: Owned Domains

## REST API Endpoints

### Get Customer Configuration
```http
GET /api/admin/config
Authorization: Bearer {token}
```

**Response:**
```json
{
  "config": {
    "domain": "example.com",
    "owned_domains": ["example.com", "docs.example.com", "shop.example.com"],
    "woocommerce": { ... },
    "shopify": { ... }
  }
}
```

### Update Customer Configuration
```http
POST /api/admin/config
Authorization: Bearer {token}
Content-Type: application/json

{
  "domain": "example.com",
  "owned_domains": ["example.com", "docs.example.com"],
  "woocommerce": { ... },
  "shopify": { ... }
}
```

### Scrape with Owned Domain Detection
```http
POST /api/scrape
Authorization: Bearer {token}
Content-Type: application/json

{
  "url": "https://example.com",
  "crawl": true,
  "max_pages": 1000,
  "turbo": true
}
```

The API automatically:
1. Detects authenticated user
2. Loads their owned domains
3. Applies optimizations if URL matches

## JavaScript/TypeScript API

### Import Functions
```typescript
import { 
  configureOwnedDomains, 
  isOwnedSite,
  crawlWebsite 
} from '@/lib/scraper-api';
```

### Configure Owned Domains
```typescript
// Add domains programmatically
configureOwnedDomains([
  'example.com',
  'subdomain.example.com',
  'example.co.uk'
]);
```

### Check Domain Ownership
```typescript
// Check if a URL is owned
const isOwned = await isOwnedSite('https://example.com/page');
console.log(isOwned); // true/false
```

### Crawl with Options
```typescript
// Basic crawl (auto-detects owned domains)
const jobId = await crawlWebsite('https://example.com', {
  maxPages: 1000
});

// Force own-site mode
const jobId = await crawlWebsite('https://staging.example.com', {
  maxPages: 5000,
  ownSite: true  // Override detection
});

// Pass customer ID explicitly
const jobId = await crawlWebsite('https://example.com', {
  maxPages: 10000,
  customerId: 'cust_123456'  // Load specific customer's domains
});
```

### Get Optimal Configuration
```typescript
import { getOptimalConfig } from '@/lib/scraper-config-own-site';

// Get configuration based on site size
const { config, parallel } = getOptimalConfig(5000);

console.log(config.maxConcurrency);  // 20
console.log(parallel.totalJobs);     // 5
console.log(parallel.pagesPerJob);   // 1000
```

## Class: OwnSiteDetector

### Static Methods

```typescript
// Initialize from environment
OwnSiteDetector.loadFromEnvironment();

// Add a domain
OwnSiteDetector.addOwnedDomain('example.com');

// Remove a domain
OwnSiteDetector.removeOwnedDomain('example.com');

// Get all domains
const domains = OwnSiteDetector.getOwnedDomains();
// ['example.com', 'docs.example.com']

// Check ownership
const isOwned = await OwnSiteDetector.isOwnSite('https://example.com/page');
```

## Class: CustomerConfigLoader

### Static Methods

```typescript
// Load domains for specific customer
await CustomerConfigLoader.loadOwnedDomains('cust_123456');

// Initialize for scraping (loads from env + database)
await CustomerConfigLoader.initializeForScraping('cust_123456');
```

## Configuration Objects

### OwnSiteConfig
```typescript
const ownSiteConfig: Partial<CrawlerConfig> = {
  maxConcurrency: 20,           // Concurrent browsers
  rateLimit: {
    requestsPerMinute: 999999,  // Unlimited
    delayBetweenRequests: 0,    // No delay
    adaptiveDelay: false,
  },
  timeouts: {
    navigation: 15000,          // 15 seconds
    request: 20000,             // 20 seconds
    resourceLoad: 5000,         // 5 seconds
  },
  memory: {
    maxResultsInMemory: 1000,
    batchSize: 100,
    gcThreshold: 0.85,
    maxHeapUsageMB: 4096,
  },
  browser: {
    headless: true,
    blockResources: ['image', 'media', 'font'],
  },
};
```

### UltraFastConfig
```typescript
const ultraFastConfig: Partial<CrawlerConfig> = {
  ...ownSiteConfig,
  maxConcurrency: 50,  // Extreme concurrency
  browser: {
    blockResources: ['image', 'media', 'font', 'stylesheet'],  // Block CSS too
  },
  timeouts: {
    navigation: 5000,   // Very aggressive
    request: 10000,
    resourceLoad: 2000,
  },
};
```

## Environment Variables

```bash
# Single domain
COMPANY_DOMAIN=example.com

# Multiple domains (comma-separated)
OWNED_DOMAINS=example.com,docs.example.com,shop.example.com

# Alternative name
OWN_DOMAINS=example.com,example.co.uk
```

## Database Schema

```sql
-- customer_configs table
CREATE TABLE customer_configs (
  id UUID PRIMARY KEY,
  customer_id UUID REFERENCES customers(id),
  domain TEXT,
  owned_domains TEXT[] DEFAULT '{}',
  -- ... other fields
);

-- Example data
INSERT INTO customer_configs (customer_id, owned_domains) 
VALUES ('cust_123', ARRAY['example.com', 'docs.example.com']);
```

## Error Handling

```typescript
try {
  const jobId = await crawlWebsite(url, {
    maxPages: 10000,
    ownSite: true
  });
} catch (error) {
  if (error.message.includes('Cannot start new job')) {
    // Too many concurrent jobs
    console.error('Job limit reached');
  }
}
```

## Performance Limits

### Normal Mode
- Max concurrent jobs: 5
- Max pages per job: 1,000
- Max total pages: 3,000
- Concurrent browsers: 3

### Own-Site Mode
- Max concurrent jobs: 20
- Max pages per job: 5,000
- Max total pages: 50,000
- Concurrent browsers: 20-50

## WebSocket Events (Coming Soon)

```typescript
// Real-time progress updates
socket.on('crawl:progress', (data) => {
  console.log(`Job ${data.jobId}: ${data.completed}/${data.total} pages`);
});

socket.on('crawl:complete', (data) => {
  console.log(`Job ${data.jobId} completed: ${data.pagesScraped} pages`);
});
```