# Own-Site Scraping Guide

When scraping your own websites for customer service bot training, the scraper can automatically detect and optimize for maximum speed.

## How Own-Site Detection Works

### 1. **Automatic Detection**
The scraper automatically detects if you're scraping your own site by checking:
- **Environment variables**: `OWNED_DOMAINS`, `OWN_DOMAINS`, or `COMPANY_DOMAIN`
- **Local URLs**: localhost, 127.0.0.1, local network IPs
- **DNS resolution**: If the domain resolves to your server's IP

### 2. **Manual Configuration**
You can explicitly configure owned domains:

```typescript
import { configureOwnedDomains } from './lib/scraper-api';

// Add your domains at startup
configureOwnedDomains([
  'yourcompany.com',
  'docs.yourcompany.com',
  'shop.yourcompany.com'
]);
```

### 3. **Environment Variables**
Set in your `.env` file:
```bash
# Single domain
COMPANY_DOMAIN=yourcompany.com

# Multiple domains (comma-separated)
OWNED_DOMAINS=yourcompany.com,yourcompany.co.uk,yourcompany.io
```

### 4. **Explicit Flag**
Always takes precedence:
```typescript
await crawlWebsite('https://example.com', {
  ownSite: true  // Force own-site mode regardless of detection
});
```

## What Changes with Own-Site Mode

When own-site mode is activated (automatically or manually):

1. **Job Limits Increase**:
   - Concurrent jobs: 5 → 20
   - Pages per job: 1,000 → 5,000
   - Total pages: 3,000 → 50,000

2. **Speed Optimizations**:
   - Concurrent browsers: 3 → 20 per job
   - Request delays: Removed completely
   - Rate limiting: Disabled
   - Timeouts: More aggressive (faster failure detection)

3. **Resource Usage**:
   - Memory limits: Increased to 4GB
   - Batch sizes: Larger for efficiency
   - GC threshold: Less aggressive

## Usage Examples

### Basic Usage (Auto-Detection)
```typescript
// If yourcompany.com is in OWNED_DOMAINS env var
const jobId = await crawlWebsite('https://yourcompany.com', {
  maxPages: 10000  // Automatically uses own-site optimizations
});
```

### Force Own-Site Mode
```typescript
// Useful for staging/development URLs
const jobId = await crawlWebsite('https://staging-xyz.herokuapp.com', {
  maxPages: 5000,
  ownSite: true  // Force optimizations even if domain isn't recognized
});
```

### Check Detection
```typescript
import { isOwnedSite } from './lib/scraper-api';

const isOwn = await isOwnedSite('https://yourcompany.com');
console.log(`Is own site: ${isOwn}`);
```

## Performance Expectations

With own-site mode enabled:
- **Single job**: 10-30 pages/second (20 concurrent browsers)
- **5 parallel jobs**: 50-150 pages/second (100 concurrent browsers)
- **20 parallel jobs**: 200-600 pages/second (400 concurrent browsers)

Actual speed depends on:
- Your server's response time
- Page complexity
- Network latency
- Available system resources