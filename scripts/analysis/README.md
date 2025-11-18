# Analysis Scripts

**Type:** Reference
**Status:** Active
**Last Updated:** 2025-11-18
**Verified For:** v0.1.0
**Dependencies:** [Database Schema](/home/user/Omniops/docs/09-REFERENCE/REFERENCE_DATABASE_SCHEMA.md), [Performance Optimization](/home/user/Omniops/docs/09-REFERENCE/REFERENCE_PERFORMANCE_OPTIMIZATION.md), [Main Scripts README](/home/user/Omniops/scripts/README.md)
**Estimated Read Time:** 5 minutes

## Purpose

Diagnostic and investigation tools for system troubleshooting, performance analysis, and problem identification across embeddings, scraping, and customer data.

## Quick Links

- [Main Scripts README](/home/user/Omniops/scripts/README.md)
- [Database Schema](/home/user/Omniops/docs/09-REFERENCE/REFERENCE_DATABASE_SCHEMA.md)
- [Performance Optimization](/home/user/Omniops/docs/09-REFERENCE/REFERENCE_PERFORMANCE_OPTIMIZATION.md)
- [Search Architecture](/home/user/Omniops/docs/01-ARCHITECTURE/ARCHITECTURE_SEARCH_SYSTEM.md)

## Keywords

analysis, diagnostics, troubleshooting, investigation, embeddings, scraping, performance profiling, customer data, system health

## Overview

This directory contains scripts for investigating system issues, analyzing performance bottlenecks, and diagnosing problems with embeddings, scraping, and customer data.

## Available Tools

### diagnose-embeddings.js
**Purpose:** Analyze embedding generation issues and troubleshoot vector search problems

**Usage:**
```bash
node scripts/analysis/diagnose-embeddings.js
```

**What it does:**
- Checks embedding generation status for all customers
- Identifies missing or corrupted embeddings
- Analyzes vector dimensions and metadata
- Reports embedding coverage statistics
- Suggests remediation steps

**Common use cases:**
- Vector search returning no results
- Embeddings not generating after scraping
- Investigating search quality issues

---

### investigate_scraping.js
**Purpose:** Debug web scraping problems and analyze scrape job failures

**Usage:**
```bash
node scripts/analysis/investigate_scraping.js
```

**What it does:**
- Lists all scrape jobs and their status
- Identifies failed or stalled scraping jobs
- Analyzes page extraction success rates
- Reports content quality metrics
- Shows scraping error patterns

**Common use cases:**
- Scraping jobs stuck in pending state
- Pages not being extracted correctly
- Content quality issues

---

### investigate_scraping_detailed.js
**Purpose:** Deep dive analysis of scraping operations with detailed statistics

**Usage:**
```bash
node scripts/analysis/investigate_scraping_detailed.js
```

**What it does:**
- Provides comprehensive scraping statistics per customer
- Analyzes content extraction quality scores
- Shows page-by-page extraction results
- Identifies patterns in scraping failures
- Reports on content deduplication

**Output includes:**
- Total pages scraped vs. attempted
- Average content length and quality scores
- Failed URLs with error details
- Scraping time metrics
- Memory usage patterns

---

### investigate_all_customers.js
**Purpose:** System-wide customer data investigation and health check

**Usage:**
```bash
node scripts/analysis/investigate_all_customers.js
```

**What it does:**
- Lists all customers and their configuration status
- Checks for missing or incomplete setups
- Validates customer data integrity
- Reports on active vs. inactive customers
- Identifies configuration issues

**Common use cases:**
- Auditing customer onboarding status
- Finding customers with missing configurations
- Identifying inactive or problematic accounts

---

### profile-database-performance.js
**Purpose:** Profile and analyze database query performance

**Usage:**
```bash
node scripts/analysis/profile-database-performance.js
```

**What it does:**
- Profiles slow database queries
- Analyzes index usage and efficiency
- Reports on query execution times (p50, p95, p99)
- Identifies missing indexes
- Suggests optimization opportunities

**Metrics tracked:**
- Query execution time distribution
- Index hit rates
- Table scan frequency
- Connection pool usage
- Lock wait times

**Output:**
- Performance report with recommendations
- Slow query log analysis
- Index usage statistics

## Prerequisites

All analysis scripts require:

```bash
# Environment variables (in .env.local)
NEXT_PUBLIC_SUPABASE_URL=https://[project-id].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

Some scripts may additionally require:
```bash
OPENAI_API_KEY=sk-...  # For embedding analysis
REDIS_URL=redis://localhost:6379  # For job queue analysis
```

## Common Workflow

### Investigating Embedding Issues

1. **Start with basic diagnosis:**
   ```bash
   node scripts/analysis/diagnose-embeddings.js
   ```

2. **If issues found, check scraping:**
   ```bash
   node scripts/analysis/investigate_scraping.js
   ```

3. **Deep dive if needed:**
   ```bash
   node scripts/analysis/investigate_scraping_detailed.js
   ```

### Performance Investigation

1. **Profile database:**
   ```bash
   node scripts/analysis/profile-database-performance.js
   ```

2. **Review slow queries and apply optimizations**

3. **Re-run to verify improvements**

### Customer Audit

1. **Check all customers:**
   ```bash
   node scripts/analysis/investigate_all_customers.js
   ```

2. **Follow up on flagged issues:**
   - Missing configurations → Update customer configs
   - Failed scraping → Re-trigger scrape jobs
   - Missing embeddings → Regenerate embeddings

## Output Formats

All analysis scripts output structured data:

```javascript
// Example output structure
{
  "summary": {
    "total_customers": 10,
    "issues_found": 3,
    "healthy": 7
  },
  "details": [
    {
      "customer_id": "uuid",
      "domain": "example.com",
      "status": "issue",
      "problems": ["missing_embeddings", "stale_scrape"]
    }
  ],
  "recommendations": [
    "Re-scrape domains with missing embeddings",
    "Add index on embeddings.customer_id"
  ]
}
```

## Troubleshooting

### "Cannot connect to Supabase"
```bash
# Verify environment variables
echo $SUPABASE_SERVICE_ROLE_KEY

# Check Supabase status
npx tsx scripts/validation/verify-supabase.js
```

### "No data found for customer"
```bash
# Check if customer exists
node scripts/analysis/investigate_all_customers.js

# Verify customer configuration
npx tsx scripts/database/check-thompson-config.ts
```

### "Permission denied on analysis scripts"
```bash
# Make scripts executable
chmod +x scripts/analysis/*.js
```

## Best Practices

1. **Run analysis scripts regularly** - Weekly health checks recommended
2. **Save output to files** - Redirect output for historical comparison
3. **Document findings** - Add notes to investigation results
4. **Follow up on issues** - Don't just identify, remediate
5. **Share results** - Keep team informed of systemic issues

## Related Scripts

- **Monitoring:** `scripts/monitoring/` - Real-time health monitoring
- **Database:** `scripts/database/` - Database integrity checks
- **Validation:** `scripts/validation/` - Data validation scripts

## Related Documentation

- [Database Schema Reference](/home/user/Omniops/docs/09-REFERENCE/REFERENCE_DATABASE_SCHEMA.md)
- [Performance Optimization](/home/user/Omniops/docs/09-REFERENCE/REFERENCE_PERFORMANCE_OPTIMIZATION.md)
- [Search Architecture](/home/user/Omniops/docs/01-ARCHITECTURE/ARCHITECTURE_SEARCH_SYSTEM.md)
- [Main Scripts README](/home/user/Omniops/scripts/README.md)
