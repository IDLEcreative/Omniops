# Scripts Directory

**Purpose:** Comprehensive collection of utility scripts for maintenance, testing, monitoring, and development tasks
**Last Updated:** 2025-10-30
**Usage:** Run scripts using `npx tsx <script-name>.ts` or directly with Node.js

## Overview

This directory contains infrastructure utilities organized by function. All scripts support the Omniops multi-tenant customer service platform with tools for database management, performance monitoring, testing, and system validation.

## Directory Structure

```
scripts/
├── analysis/          # Diagnostic and investigation tools
├── benchmarks/        # Performance benchmarking utilities
├── database/          # Database maintenance and integrity checks
├── deployment/        # Deployment and cleanup scripts
├── diagnostics/       # Service-specific diagnostic tools
├── migrations/        # Legacy migration scripts
├── monitoring/        # System health and performance monitoring
├── scrapers/          # Web scraping diagnostic tools
├── setup/             # Initial setup scripts (currently empty)
├── sql/               # SQL migration scripts organized by category
├── stripe/            # Stripe integration testing and setup
├── tests/             # Testing utilities and verification scripts
├── utilities/         # General-purpose utility scripts
├── validation/        # Data validation and verification
└── verification/      # System verification scripts
```

## Quick Reference by Category

### Analysis & Diagnostics
**Directory:** `analysis/`
**Purpose:** Investigate and diagnose system issues
**Common Scripts:**
- `diagnose-embeddings.js` - Analyze embedding generation issues
- `investigate_scraping.js` - Debug web scraping problems
- `profile-database-performance.js` - Profile database query performance

[See analysis/README.md for full documentation](analysis/README.md)

### Performance Benchmarking
**Directory:** `benchmarks/`
**Purpose:** Measure and analyze system performance
**Common Scripts:**
- `benchmark-vector-graph-analysis.ts` - Benchmark vector search performance

[See benchmarks/README.md for full documentation](benchmarks/README.md)

### Database Utilities
**Directory:** `database/`
**Purpose:** Database maintenance, integrity checks, and credential management
**Common Scripts:**
- `check-rls-policies.ts` - Verify Row Level Security policies
- `fix-currency-symbols.ts` - Fix currency formatting issues
- `update-thompson-credentials.ts` - Update customer credentials (example)
- `check-metrics-data.ts` - Verify database metrics collection

[See database/README.md for full documentation](database/README.md)

### Deployment
**Directory:** `deployment/`
**Purpose:** Deployment and production cleanup scripts
**Common Scripts:**
- `deploy-to-vercel.sh` - Deploy application to Vercel
- `cleanup-root.sh` - Clean up root directory before deployment

[See deployment/README.md for full documentation](deployment/README.md)

### Service Diagnostics
**Directory:** `diagnostics/`
**Purpose:** Diagnose WooCommerce and external service issues
**Common Scripts:**
- `diagnose-woocommerce-api.ts` - Test WooCommerce API connectivity
- `check-woocommerce-config.ts` - Verify WooCommerce configuration

[See diagnostics/README.md for full documentation](diagnostics/README.md)

### System Monitoring
**Directory:** `monitoring/`
**Purpose:** Real-time system health and performance monitoring
**Common Scripts:**
- `monitor-embeddings-health.ts` - Monitor embedding generation health
- `monitor-woocommerce.ts` - Monitor WooCommerce integration status
- `benchmark-database-improvements.ts` - Benchmark database optimizations
- `simulate-production-conversations.ts` - Simulate production load

**Usage:**
```bash
# Run health check
npx tsx monitoring/monitor-embeddings-health.ts check

# Auto-maintenance mode
npx tsx monitoring/monitor-embeddings-health.ts auto

# Continuous monitoring
npx tsx monitoring/monitor-embeddings-health.ts watch
```

[See monitoring/README.md for full documentation](monitoring/README.md)

### Web Scraping
**Directory:** `scrapers/`
**Purpose:** Diagnostic tools for web scraping functionality
**Common Scripts:**
- `diagnose-scraper.js` - Debug web scraper issues
- `scrape-thompsons-full.mjs` - Full website scraping example

[See scrapers/README.md for full documentation](scrapers/README.md)

### Testing & Verification
**Directory:** `tests/`
**Purpose:** Test utilities and system verification
**Common Scripts:**
- `test-chat-accuracy.ts` - Test AI chat response accuracy
- `test-hallucination-prevention.ts` - Verify anti-hallucination safeguards
- `test-metadata-tracking.ts` - Test conversation metadata tracking
- `test-complete-system.ts` - End-to-end system verification

**Usage:**
```bash
# Test chat accuracy
npx tsx tests/test-chat-accuracy.ts

# Run hallucination tests
npx tsx tests/test-hallucination-prevention.ts --verbose

# Test metadata tracking (86% accuracy benchmark)
npx tsx tests/test-metadata-tracking.ts
```

[See tests/README.md for full documentation](tests/README.md)

### Utility Scripts
**Directory:** `utilities/`
**Purpose:** General-purpose utilities for various tasks
**Common Scripts:**
- `check-embeddings.js` - Check embedding status
- `docker-dev.sh` - Docker development helper
- `run-agent-tests.sh` - Run agent test suite
- `add-metadata.sh` - Add metadata to files

[See utilities/README.md for full documentation](utilities/README.md)

### Validation
**Directory:** `validation/`
**Purpose:** Data validation and verification scripts
**Common Scripts:**
- `validate-price-detection.js` - Validate price extraction
- `verify-enhanced-features.js` - Verify feature implementation
- `verify-supabase.js` - Verify Supabase connectivity

[See validation/README.md for full documentation](validation/README.md)

### SQL Migrations
**Directory:** `sql/`
**Purpose:** SQL migration scripts organized by category
**Subdirectories:**
- `sql/migrations/` - Database migration scripts
- `sql/setup/` - Database setup scripts
- `sql/tests/` - SQL test scripts
- `sql/utilities/` - SQL utility functions

[See sql/README.md for full documentation](sql/README.md)

### Stripe Integration
**Directory:** `stripe/`
**Purpose:** Stripe payment integration testing and setup
**Common Scripts:**
- `setup-webhook.sh` - Configure Stripe webhooks
- `test-integration.sh` - Test Stripe integration
- `create-products.sh` - Create test products in Stripe

[See stripe/README.md for full documentation](stripe/README.md)

## Root-Level Legacy Scripts

### check-dependencies.js
Validates that all required dependencies are installed and compatible.

**Usage:**
```bash
npm run check:deps
# or directly
node scripts/check-dependencies.js
```

**Features:**
- Checks for missing dependencies
- Validates version compatibility
- Reports security vulnerabilities
- Suggests fixes for issues

### migrate-encrypt-credentials.ts
Migrates existing plaintext WooCommerce credentials to encrypted format.

**Usage:**
```bash
npm run migrate:encrypt-credentials
# or directly
npx tsx scripts/migrate-encrypt-credentials.ts
```

**Features:**
- One-time migration script
- Encrypts all customer credentials
- Backs up original data
- Validates encryption success
- Safe to run multiple times (idempotent)

## Creating New Scripts

### Script Template (TypeScript)

```typescript
#!/usr/bin/env tsx
/**
 * Script: script-name
 * Purpose: What this script does
 * Category: [analysis|benchmarks|database|monitoring|etc.]
 * Usage: npx tsx scripts/category/script-name.ts
 */

import { config } from 'dotenv';
config();

async function main() {
  try {
    console.log('Starting script...');

    // Script logic here

    console.log('✓ Script completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('✗ Script failed:', error);
    process.exit(1);
  }
}

main();
```

### JavaScript Template

```javascript
#!/usr/bin/env node
/**
 * Script: script-name
 * Purpose: What this script does
 * Category: [analysis|benchmarks|database|monitoring|etc.]
 * Usage: node scripts/category/script-name.js
 */

const main = async () => {
  try {
    console.log('Starting script...');

    // Script logic here

    console.log('✓ Script completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('✗ Script failed:', error);
    process.exit(1);
  }
};

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { main };
```

## Common Script Patterns

### Database Operations

```typescript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Query with error handling
const { data, error } = await supabase
  .from('table')
  .select('*')
  .eq('customer_id', customerId);

if (error) throw error;
```

### Environment Variables

```typescript
import { config } from 'dotenv';
config({ path: '.env.local' });

const requiredVars = ['OPENAI_API_KEY', 'SUPABASE_SERVICE_ROLE_KEY'];
for (const varName of requiredVars) {
  if (!process.env[varName]) {
    throw new Error(`${varName} not set in environment`);
  }
}
```

### File System Operations

```typescript
import { readFile, writeFile } from 'fs/promises';
import { join } from 'path';

// Read JSON
const data = JSON.parse(await readFile('config.json', 'utf8'));

// Write with formatting
await writeFile('output.json', JSON.stringify(result, null, 2));
```

## Best Practices

1. **Error Handling** - Always use try/catch and meaningful exit codes
2. **Logging** - Provide clear progress messages with ✓/✗ indicators
3. **Validation** - Check inputs and environment before running
4. **Idempotency** - Scripts should be safe to run multiple times
5. **Documentation** - Include usage examples in file header comments
6. **Categories** - Place scripts in appropriate subdirectories
7. **Naming** - Use descriptive kebab-case names (e.g., `check-database-health.ts`)

## NPM Scripts Integration

Add frequently-used scripts to `package.json`:

```json
{
  "scripts": {
    "check:deps": "node scripts/check-dependencies.js",
    "migrate:encrypt": "tsx scripts/migrate-encrypt-credentials.ts",
    "monitor:embeddings": "tsx scripts/monitoring/monitor-embeddings-health.ts",
    "test:hallucination": "tsx scripts/tests/test-hallucination-prevention.ts"
  }
}
```

## Environment Setup

Scripts typically require these environment variables:

```bash
# Required for most scripts
NEXT_PUBLIC_SUPABASE_URL=https://[project-id].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Required for AI/chat scripts
OPENAI_API_KEY=sk-...

# Required for Redis/queue scripts
REDIS_URL=redis://localhost:6379

# Copy environment file
cp .env.example .env.local

# Run script with environment
npx tsx scripts/monitoring/monitor-embeddings-health.ts
```

## Testing Scripts

Create test files for complex scripts:

```typescript
// scripts/__tests__/script-name.test.ts
import { describe, it, expect } from '@jest/globals';
import { main } from '../script-name';

describe('Script Name', () => {
  it('should complete successfully', async () => {
    const result = await main();
    expect(result).toBeDefined();
  });
});
```

## Scheduling Scripts

For recurring tasks, use cron jobs:

```bash
# Run embeddings health check daily at 2 AM
0 2 * * * cd /path/to/omniops && npx tsx scripts/monitoring/monitor-embeddings-health.ts check

# Run WooCommerce monitoring every hour
0 * * * * cd /path/to/omniops && npx tsx scripts/monitoring/monitor-woocommerce.ts

# Clean up database weekly
0 3 * * 0 cd /path/to/omniops && npx tsx scripts/database/cleanup-old-data.ts
```

## Security Notes

- **Never commit scripts with hardcoded credentials**
- Use environment variables for sensitive data
- Validate all inputs to prevent injection attacks
- Log operations for audit trails
- Test in development before running in production
- Use service role keys only in secure environments

## Troubleshooting

### Common Issues

**Script not found:**
```bash
# Ensure you're in project root
pwd  # Should show /path/to/Omniops

# Use correct path
npx tsx scripts/monitoring/monitor-embeddings-health.ts
```

**Permission denied:**
```bash
# Make script executable
chmod +x scripts/deployment/deploy-to-vercel.sh
```

**Environment variables not loaded:**
```bash
# Ensure .env.local exists
ls -la .env.local

# Load manually if needed
export $(cat .env.local | xargs)
```

**TypeScript errors:**
```bash
# Ensure tsx is installed
npm install -D tsx

# Or use ts-node
npm install -D ts-node
npx ts-node scripts/your-script.ts
```

## Performance Considerations

- Use connection pooling for database operations
- Batch operations when processing multiple records
- Stream large datasets instead of loading to memory
- Use worker threads for CPU-intensive tasks
- Implement rate limiting for API calls

## Related Documentation

- [Database Schema Reference](../docs/07-REFERENCE/REFERENCE_DATABASE_SCHEMA.md)
- [Performance Optimization Guide](../docs/07-REFERENCE/REFERENCE_PERFORMANCE_OPTIMIZATION.md)
- [NPX Tools Guide](../docs/07-REFERENCE/REFERENCE_NPX_SCRIPTS.md)
- [Development Workflow](../CLAUDE.md#development-workflow)
- [Testing Philosophy](../CLAUDE.md#testing--code-quality-philosophy)
