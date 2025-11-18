**Last Updated:** 2025-11-18
**Verified Accurate For:** v0.1.0
**Status:** Active
**Type:** Reference

# Database Utilities

**Purpose:** Database maintenance, integrity checks, and credential management tools
**Last Updated:** 2025-10-30
**Usage:** Run database scripts using `npx tsx` from project root

## Overview

This directory contains utilities for maintaining database health, verifying integrity, managing customer credentials, and performing database operations safely.

## Available Tools

### Row Level Security (RLS) Management

#### check-rls-policies.ts
**Purpose:** Verify Row Level Security policies are correctly configured

**Usage:**
```bash
npx tsx scripts/database/check-rls-policies.ts
```

**What it checks:**
- RLS enabled on all sensitive tables
- Policies exist for SELECT, INSERT, UPDATE, DELETE
- Service role has proper access
- Anonymous users properly restricted
- Policy logic is sound

---

#### check-rls-via-sql.ts
**Purpose:** Direct SQL-based RLS policy verification

**Usage:**
```bash
npx tsx scripts/database/check-rls-via-sql.ts
```

**What it does:**
- Queries pg_policies directly
- Validates policy definitions
- Tests policy enforcement
- Reports missing or weak policies

---

#### check-view-security.ts
**Purpose:** Verify security policies on database views

**Usage:**
```bash
npx tsx scripts/database/check-view-security.ts
```

---

### Data Integrity Checks

#### check-organization-integrity.ts
**Purpose:** Verify organizational data structure integrity

**Usage:**
```bash
npx tsx scripts/database/check-organization-integrity.ts
```

**What it validates:**
- Foreign key relationships
- Orphaned records
- Data consistency across tables
- Referential integrity

---

#### check-table-structure.ts
**Purpose:** Validate table schema matches expected structure

**Usage:**
```bash
npx tsx scripts/database/check-table-structure.ts
```

**What it checks:**
- Column definitions
- Data types
- Constraints (NOT NULL, UNIQUE, CHECK)
- Indexes
- Triggers

---

#### check-metrics-data.ts
**Purpose:** Verify metrics collection is working correctly

**Usage:**
```bash
npx tsx scripts/database/check-metrics-data.ts
```

**Checks:**
- Metrics tables populated
- Data freshness (no stale metrics)
- Metrics calculation accuracy
- Storage usage

---

### Customer Configuration Management

#### check-thompson-config.ts
**Purpose:** Verify customer configuration (example using Thompson's)

**Usage:**
```bash
npx tsx scripts/database/check-thompson-config.ts
```

**What it checks:**
- Customer config exists and is valid
- Required fields populated
- WooCommerce credentials configured
- Encryption status

---

#### check-thompson-database.ts
**Purpose:** Complete database health check for customer

**Usage:**
```bash
npx tsx scripts/database/check-thompson-database.ts
```

**Comprehensive check:**
- Customer config
- Scraped pages
- Embeddings
- Conversations
- Messages
- WooCommerce data

---

#### check-test-domain.ts
**Purpose:** Validate test domain configuration

**Usage:**
```bash
npx tsx scripts/database/check-test-domain.ts
```

---

### Credential Management

#### update-thompson-credentials.ts
**Purpose:** Update customer WooCommerce credentials (example)

**Usage:**
```bash
npx tsx scripts/database/update-thompson-credentials.ts
```

**Features:**
- Encrypts credentials before storage
- Validates credential format
- Tests connectivity with new credentials
- Backs up old credentials

**⚠️ Security Note:** Always encrypt credentials. Never store plaintext.

---

#### update-woocommerce-credentials.ts
**Purpose:** Update WooCommerce credentials for any customer

**Usage:**
```bash
npx tsx scripts/database/update-woocommerce-credentials.ts
```

---

#### batch-fix-currency.py
**Purpose:** Batch fix currency symbols in database

**Usage:**
```bash
python3 scripts/database/batch-fix-currency.py
```

**What it does:**
- Identifies incorrect currency symbols
- Corrects formatting (£ instead of Â£)
- Updates price fields in bulk
- Validates changes

---

#### fix-currency-symbols.ts
**Purpose:** Fix currency symbol encoding issues

**Usage:**
```bash
npx tsx scripts/database/fix-currency-symbols.ts
```

---

### Scheduled Jobs & Automation

#### check-cron-jobs.ts
**Purpose:** Verify scheduled database jobs are running correctly

**Usage:**
```bash
npx tsx scripts/database/check-cron-jobs.ts
```

**Checks:**
- Scheduled cleanup jobs
- Data retention enforcement
- Backup job status
- Maintenance windows

---

### Direct SQL Execution

#### run-sql-direct.ts
**Purpose:** Execute SQL directly against database (admin use)

**Usage:**
```bash
npx tsx scripts/database/run-sql-direct.ts
```

**⚠️ Warning:** Use with caution. No rollback safety net.

**Example:**
```typescript
// In script, edit SQL query
const query = `
  SELECT customer_id, domain, created_at
  FROM customer_configs
  WHERE created_at > NOW() - INTERVAL '7 days'
`;
```

---

### Performance & Optimization

#### production-vector-search.sql
**Purpose:** Production-optimized vector search queries

**File:** SQL script with optimized vector search queries

**Usage:**
```bash
psql $DATABASE_URL -f scripts/database/production-vector-search.sql
```

**What it includes:**
- Optimized vector similarity search
- Index hints for pgvector
- Query plan analysis
- Performance tuning parameters

## Common Workflows

### Adding a New Customer

```bash
# 1. Verify customer config
npx tsx scripts/database/check-thompson-config.ts

# 2. Check RLS policies
npx tsx scripts/database/check-rls-policies.ts

# 3. Validate table structure
npx tsx scripts/database/check-table-structure.ts

# 4. Update credentials (if needed)
npx tsx scripts/database/update-woocommerce-credentials.ts
```

### Database Health Check

```bash
# 1. Check organization integrity
npx tsx scripts/database/check-organization-integrity.ts

# 2. Verify RLS policies
npx tsx scripts/database/check-rls-policies.ts

# 3. Check metrics collection
npx tsx scripts/database/check-metrics-data.ts

# 4. Validate table structure
npx tsx scripts/database/check-table-structure.ts
```

### Fixing Data Issues

```bash
# 1. Identify the problem
npx tsx scripts/analysis/profile-database-performance.js

# 2. Fix currency symbols
npx tsx scripts/database/fix-currency-symbols.ts

# 3. Verify fix
npx tsx scripts/validation/verify-fixes.js
```

## Prerequisites

All database scripts require:

```bash
# Environment variables
NEXT_PUBLIC_SUPABASE_URL=https://[project-id].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

## Security Best Practices

1. **Always use service role key** - Never use anon key for admin operations
2. **Encrypt sensitive data** - All credentials must be encrypted
3. **Test in development first** - Never run untested scripts in production
4. **Backup before bulk operations** - Take snapshot before major changes
5. **Validate changes** - Always verify data after modifications
6. **Audit trail** - Log all database modifications

## Troubleshooting

### "Permission denied on table"
```bash
# Verify service role key is set
echo $SUPABASE_SERVICE_ROLE_KEY

# Check RLS policies
npx tsx scripts/database/check-rls-policies.ts
```

### "Foreign key constraint violation"
```bash
# Check data integrity
npx tsx scripts/database/check-organization-integrity.ts

# Identify orphaned records
npx tsx scripts/database/check-table-structure.ts
```

### "Credentials update failed"
```bash
# Verify credential format
# WooCommerce credentials must include:
# - consumerKey
# - consumerSecret
# - storeUrl

# Test connectivity separately first
npx tsx scripts/diagnostics/check-woocommerce-config.ts
```

## Related Scripts

- **Analysis:** `scripts/analysis/` - Database performance profiling
- **Monitoring:** `scripts/monitoring/` - Database health monitoring
- **Migrations:** `migrations/` - Database schema migrations

## Related Documentation

- [Database Schema Reference](../../docs/07-REFERENCE/REFERENCE_DATABASE_SCHEMA.md)
- [RLS Security Policies](../../docs/01-ARCHITECTURE/ARCHITECTURE_SECURITY.md)
- [Supabase Configuration](../../supabase/README.md)
- [Main Scripts README](../README.md)
