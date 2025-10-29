# Owned Domains Feature Documentation

## Overview

The Owned Domains feature allows customers to specify domains they own, enabling the web scraper to automatically use high-performance settings when scraping those domains. This is essential for customer service bot training, where companies need to quickly scrape their own websites without rate limiting concerns.

## Architecture

### Database Schema

```sql
-- customer_configs table extension
owned_domains TEXT[] DEFAULT '{}'  -- Array of domains owned by the customer
```

### Key Components

1. **OwnSiteDetector** (`/lib/own-site-detector.ts`)
   - Manages domain ownership detection
   - Checks if a URL belongs to an owned domain
   - Supports environment variables and database storage

2. **CustomerConfigLoader** (`/lib/customer-config-loader.ts`)
   - Loads owned domains from database
   - Initializes OwnSiteDetector with customer's domains
   - Integrates with scraper initialization

3. **Scraper Configuration** (`/lib/scraper-config-own-site.ts`)
   - Optimized settings for owned sites
   - 20x concurrent browsers (up from 3)
   - Zero delays between requests
   - Higher memory and resource limits

## User Flow

### 1. Configuration (Admin Panel)

Users configure their owned domains in the Admin panel:

```
Admin → Owned Domains Tab → Add domains
```

**UI Features:**
- Add domains one by one
- Remove domains easily
- Visual feedback on optimization benefits
- Automatically saved to database

### 2. Automatic Detection

When a scraping job starts:

1. System loads customer's owned domains from database
2. Checks if target URL matches any owned domain
3. Automatically applies high-performance settings if matched

### 3. Performance Optimization

When a domain is detected as owned:

| Setting | Normal | Owned Site |
|---------|---------|------------|
| Concurrent Jobs | 5 | 20 |
| Pages per Job | 1,000 | 5,000 |
| Concurrent Browsers | 3 | 20+ |
| Request Delays | Adaptive | None |
| Rate Limiting | Yes | No |
| Expected Speed | 1-3 pages/sec | 50-100+ pages/sec |

## Implementation Details

### Adding Owned Domains (UI)

```typescript
// Admin page component
const [config, setConfig] = useState({
  domain: '',
  owned_domains: [] as string[],
  // ... other config
});

// Add domain
setConfig({
  ...config,
  owned_domains: [...config.owned_domains, newDomain.trim()],
});
```

### Domain Detection Logic

```typescript
// Automatic detection in scraper
const isOwnSite = options?.ownSite || await OwnSiteDetector.isOwnSite(url);

if (isOwnSite) {
  jobLimiter.enableOwnSiteMode();
  // Apply optimized configuration
}
```

### API Integration

The scraper API automatically passes the customer ID:

```typescript
// In /api/scrape/route.ts
const jobId = await crawlWebsite(url, {
  maxPages: max_pages,
  turboMode: turbo,
  customerId: customerId, // Enables owned domain detection
});
```

## Configuration Options

### Environment Variables (Optional)

For system-wide owned domains:

```bash
# .env file
OWNED_DOMAINS=company.com,docs.company.com,shop.company.com
COMPANY_DOMAIN=company.com
```

### Programmatic Configuration

```typescript
import { configureOwnedDomains } from './lib/scraper-api';

// Add domains programmatically
configureOwnedDomains(['example.com', 'subdomain.example.com']);
```

### Force Own-Site Mode

Override detection for specific scraping jobs:

```typescript
await crawlWebsite('https://staging-site.com', {
  ownSite: true,  // Force high-performance mode
  maxPages: 10000
});
```

## Security Considerations

1. **Row Level Security (RLS)**
   - Each customer can only see/modify their own domains
   - Enforced at database level

2. **No Encryption Needed**
   - Domains are not sensitive information
   - Stored as plain text array

3. **Validation**
   - Domains are validated for format
   - Duplicate prevention built-in

## Performance Impact

### Without Owned Domains
- Conservative scraping to avoid being blocked
- Rate limiting and delays
- 1-3 pages per second

### With Owned Domains
- Maximum performance configuration
- No rate limiting
- 50-100+ pages per second
- Can scrape entire site quickly

## Troubleshooting

### Domains Not Being Detected

1. Check if domains are saved in admin panel
2. Verify domain format (no https://, no trailing slash)
3. Check subdomains are included if needed

### Performance Not Improving

1. Ensure domain is properly configured
2. Check server capacity for high concurrency
3. Verify no external rate limiting (CDN, firewall)

### Database Migration

Run the migration to add owned_domains field:

```bash
# Via Supabase CLI
supabase db push

# Or direct SQL
psql $DATABASE_URL < supabase/migrations/004_add_owned_domains.sql
```

## Best Practices

1. **Domain Format**
   - Use base domain: `example.com`
   - Include subdomains separately: `docs.example.com`
   - No protocols or paths

2. **Testing**
   - Test with a small page count first
   - Monitor server load during high-speed scraping
   - Adjust concurrency if needed

3. **Multiple Environments**
   - Add staging domains for testing
   - Include all production domains
   - Consider CDN domains if applicable

## API Reference

### Check if URL is Owned

```typescript
import { isOwnedSite } from '@/lib/scraper-api';

const isOwned = await isOwnedSite('https://example.com');
// Returns: true/false
```

### Configure Owned Domains

```typescript
import { configureOwnedDomains } from '@/lib/scraper-api';

configureOwnedDomains(['domain1.com', 'domain2.com']);
```

### Get Optimal Configuration

```typescript
import { getOptimalConfig } from '@/lib/scraper-config-own-site';

const { config, parallel } = getOptimalConfig(estimatedPages);
// Returns optimized configuration based on site size
```

## Future Enhancements

1. **Auto-discovery**
   - Detect owned domains from DNS records
   - Integration with domain registrars

2. **Performance Profiles**
   - Custom speed settings per domain
   - Time-based scheduling

3. **Analytics**
   - Track scraping performance by domain
   - Optimization recommendations

4. **Bulk Import**
   - CSV upload for multiple domains
   - Import from domain management tools