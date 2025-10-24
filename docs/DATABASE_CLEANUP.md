# Database Cleanup Guide

## Overview

The Database Cleanup system provides multiple methods to completely remove scraped data, embeddings, and related content from your Supabase database. This is essential for:

- 🔄 **Fresh Re-scraping**: Start over with updated scraping configurations
- 🧹 **Data Hygiene**: Remove outdated or incorrect content
- 💾 **Storage Management**: Free up database space
- 🔧 **Development**: Clean slate for testing new features
- 🎯 **Domain-Specific Cleanup**: Remove data for specific domains only

## Quick Start

### Check Current Data Stats

```bash
npx tsx test-database-cleanup.ts stats
```

### Clean All Data (with Safety Countdown)

```bash
npx tsx test-database-cleanup.ts clean
```

### Clean Specific Domain

```bash
npx tsx test-database-cleanup.ts clean --domain=example.com
```

## Architecture

`★ Insight ─────────────────────────────────────`
The cleanup system leverages PostgreSQL's CASCADE foreign key constraints. All scraping-related tables reference the `domains` table with ON DELETE CASCADE, creating a hierarchical deletion chain that ensures referential integrity while simplifying cleanup operations.
`─────────────────────────────────────────────────`

### Data Hierarchy

```
domains
  ├── scraped_pages
  │   └── page_embeddings
  ├── website_content
  ├── structured_extractions
  ├── scrape_jobs
  └── query_cache (domain field)
```

### What Gets Deleted

| Table | Description | Typical Size |
|-------|-------------|--------------|
| `page_embeddings` | Vector embeddings for semantic search | ~6,000 records |
| `scraped_pages` | Raw HTML and extracted content | ~4,500 records |
| `website_content` | Processed and structured content | ~25 records |
| `structured_extractions` | FAQs, products, contact info | ~35 records |
| `scrape_jobs` | Background job queue | Variable |
| `query_cache` | Cached search results | Variable |
| `conversations` | Chat history (optional) | Variable |
| `messages` | Individual messages (optional) | Variable |

### What's Preserved

- ✅ Customer configurations (`customer_configs`)
- ✅ Domain settings (`domains` table structure)
- ✅ WooCommerce credentials (encrypted)
- ✅ User accounts and authentication
- ✅ Admin settings

## Methods

### Method 1: Command Line Tool

The CLI tool provides the safest and most user-friendly approach.

#### Installation

No installation needed - uses `npx tsx` to run directly.

#### Commands

```bash
# Show help
npx tsx test-database-cleanup.ts help

# View statistics
npx tsx test-database-cleanup.ts stats
npx tsx test-database-cleanup.ts stats --domain=example.com

# Dry run (preview only)
npx tsx test-database-cleanup.ts clean --dry-run

# Perform cleanup
npx tsx test-database-cleanup.ts clean                    # All domains
npx tsx test-database-cleanup.ts clean --domain=site.com  # Specific domain
```

#### Features

- 📊 Statistics before deletion
- ⏱️ 3-second safety countdown
- 🎯 Domain-specific targeting
- 🔍 Dry-run mode
- 📈 Detailed deletion counts

### Method 2: API Endpoint

Perfect for integration with admin panels or automation.

#### Endpoint

```
POST /api/admin/cleanup
GET  /api/admin/cleanup
```

#### Get Statistics

```javascript
// GET request
const response = await fetch('/api/admin/cleanup?domain=example.com', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

const { stats } = await response.json();
console.log(stats);
```

#### Perform Cleanup

```javascript
// POST request
const response = await fetch('/api/admin/cleanup', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    action: 'clean',
    domain: 'example.com',  // Optional: omit for all domains
    includeJobs: true,      // Delete scrape jobs
    includeCache: true,     // Delete query cache
    preserveConfigs: true   // Keep customer configs
  })
});

const result = await response.json();
console.log(result.deletedCounts);
```

#### Response Format

```json
{
  "success": true,
  "deletedCounts": {
    "pages": 4537,
    "content": 24,
    "embeddings": 6100,
    "extractions": 34,
    "jobs": 12,
    "cache": 156,
    "conversations": 89,
    "messages": 423
  }
}
```

### Method 3: Direct SQL

For database administrators who prefer direct SQL execution.

#### Via Supabase Dashboard

1. Navigate to SQL Editor in Supabase Dashboard
2. Copy contents of `/scripts/clean-scraped-data.sql`
3. Review the script
4. Execute

#### Via Command Line

```bash
# Using psql
psql $DATABASE_URL < scripts/clean-scraped-data.sql

# Using Supabase CLI
supabase db execute -f scripts/clean-scraped-data.sql
```

#### Domain-Specific SQL

```sql
-- Clean specific domain only
WITH target_domain AS (
  SELECT id FROM domains WHERE domain = 'example.com'
)
DELETE FROM page_embeddings 
WHERE domain_id IN (SELECT id FROM target_domain);

-- Repeat for other tables...
```

### Method 4: Programmatic (TypeScript/JavaScript)

Use the `DatabaseCleaner` class directly in your code.

#### Basic Usage

```typescript
import { DatabaseCleaner } from '@/lib/database-cleaner';

const cleaner = new DatabaseCleaner();

// Get statistics
const stats = await cleaner.getScrapingStats('example.com');
console.log(stats);

// Clean all data
const result = await cleaner.cleanAllScrapedData({
  domain: 'example.com',    // Optional
  includeJobs: true,        // Delete scrape jobs
  includeCache: true,       // Delete query cache
  preserveConfigs: true     // Keep customer configs
});

if (result.success) {
  console.log('Cleaned:', result.deletedCounts);
} else {
  console.error('Failed:', result.error);
}
```

#### Advanced Options

```typescript
interface CleanupOptions {
  domain?: string;          // Target specific domain
  includeJobs?: boolean;    // Delete scrape_jobs table
  includeCache?: boolean;   // Delete query_cache table
  preserveConfigs?: boolean; // Keep customer configurations
}

interface CleanupResult {
  success: boolean;
  deletedCounts: {
    pages?: number;
    content?: number;
    embeddings?: number;
    extractions?: number;
    jobs?: number;
    cache?: number;
    conversations?: number;
    messages?: number;
  };
  error?: string;
}
```

## Use Cases

### 1. Complete Fresh Start

Remove all data across all domains:

```bash
npx tsx test-database-cleanup.ts clean
```

### 2. Re-scrape Single Website

Clean and prepare for re-scraping:

```bash
# Step 1: Clean old data
npx tsx test-database-cleanup.ts clean --domain=example.com

# Step 2: Trigger new scrape
curl -X POST http://localhost:3000/api/scrape \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com", "domain": "example.com"}'
```

### 3. Scheduled Maintenance

Automate cleanup with cron:

```bash
# Add to crontab for weekly cleanup
0 2 * * 0 cd /path/to/project && npx tsx test-database-cleanup.ts clean --domain=old-site.com
```

### 4. Development Reset

Quick reset during development:

```bash
# Clean and immediately re-scrape
npm run dev:clean-scrape
```

Add to `package.json`:

```json
{
  "scripts": {
    "dev:clean-scrape": "npx tsx test-database-cleanup.ts clean && npm run scrape:all"
  }
}
```

## Safety Features

`★ Insight ─────────────────────────────────────`
The cleanup system includes multiple safety mechanisms: authentication checks prevent unauthorized access, foreign key constraints maintain referential integrity, and the 3-second countdown in CLI mode prevents accidental execution. The dry-run mode allows you to preview changes without committing them.
`─────────────────────────────────────────────────`

### Built-in Protections

1. **Authentication Required**: API endpoints require valid user authentication
2. **Countdown Timer**: CLI tool has 3-second safety countdown
3. **Dry Run Mode**: Preview what will be deleted without executing
4. **Transaction Safety**: SQL operations use transactions for atomicity
5. **Preserve Configs**: Customer configurations are never deleted by default
6. **Foreign Key Constraints**: Database enforces referential integrity

### Best Practices

1. **Always Check Stats First**
   ```bash
   npx tsx test-database-cleanup.ts stats
   ```

2. **Use Dry Run for Verification**
   ```bash
   npx tsx test-database-cleanup.ts clean --dry-run
   ```

3. **Target Specific Domains When Possible**
   ```bash
   npx tsx test-database-cleanup.ts clean --domain=example.com
   ```

4. **Backup Before Major Cleanup**
   ```bash
   # Export data first if needed
   supabase db dump > backup.sql
   ```

## Performance Considerations

### Cleanup Speed

- **Small Dataset** (<1,000 records): ~1-2 seconds
- **Medium Dataset** (10,000 records): ~5-10 seconds
- **Large Dataset** (100,000+ records): ~30-60 seconds

### Database Impact

- Cleanup operations use DELETE statements with CASCADE
- Temporary lock on affected tables during deletion
- Minimal impact on other operations
- Automatic VACUUM recommended after large deletions

### Optimization Tips

1. **Schedule During Low Traffic**
   ```bash
   # Run at 3 AM
   0 3 * * * npx tsx test-database-cleanup.ts clean
   ```

2. **Clean by Domain**
   - Reduces lock scope
   - Faster execution
   - Less database impact

3. **Monitor Database Size**
   ```sql
   SELECT pg_size_pretty(pg_database_size('postgres'));
   ```

## Troubleshooting

### Common Issues

#### 1. Permission Denied

```
Error: Permission denied for table scraped_pages
```

**Solution**: Ensure using service role key, not anon key:

```typescript
const cleaner = new DatabaseCleaner(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY  // Must be service role
);
```

#### 2. Foreign Key Constraint Violation

```
Error: violates foreign key constraint
```

**Solution**: Delete in correct order (embeddings before pages):

```sql
DELETE FROM page_embeddings;  -- First
DELETE FROM scraped_pages;    -- Second
```

#### 3. Table Not Found

```
Error: relation "scrape_jobs" does not exist
```

**Solution**: Tool handles missing tables gracefully:

```typescript
if (includeJobs) {
  // Wrapped in try-catch, continues if table doesn't exist
}
```

### Debug Mode

Enable verbose logging:

```typescript
const cleaner = new DatabaseCleaner();
cleaner.debug = true;  // Show detailed SQL queries
```

## Integration Examples

### With Next.js Admin Panel

```tsx
// app/admin/components/DatabaseCleanup.tsx
'use client';

import { useState } from 'react';

export function DatabaseCleanup() {
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState(null);

  const handleCleanup = async () => {
    if (!confirm('Delete all scraped data?')) return;
    
    setLoading(true);
    const response = await fetch('/api/admin/cleanup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'clean' })
    });
    
    const result = await response.json();
    alert(`Deleted ${result.deletedCounts.pages} pages`);
    setLoading(false);
  };

  return (
    <button onClick={handleCleanup} disabled={loading}>
      {loading ? 'Cleaning...' : 'Clean Database'}
    </button>
  );
}
```

### With GitHub Actions

```yaml
# .github/workflows/weekly-cleanup.yml
name: Weekly Database Cleanup

on:
  schedule:
    - cron: '0 2 * * 0'  # Sunday 2 AM

jobs:
  cleanup:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - run: npm install
      - run: npx tsx test-database-cleanup.ts clean
        env:
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_KEY }}
```

## Related Documentation

- [Database Schema](./01-ARCHITECTURE/database-schema.md)
- [Scraping Guide](./SCRAPING.md)
- [API Documentation](./API.md)
- [Admin Panel Guide](./ADMIN.md)