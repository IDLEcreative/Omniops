# Database Migrations

**Purpose:** SQL migration files for database schema evolution and optimization
**Last Updated:** 2025-10-30
**Usage:** Apply migrations using `psql` or Supabase Management API

## Overview

This directory contains standalone SQL migration files that modify the database schema. These migrations are **independent of Supabase's migration system** and can be applied directly via SQL.

## Directory Structure

```
migrations/
├── 2024_01_optimize_slow_queries.sql                          # Query optimization
├── 20250830_add_foreign_key_indexes.sql                       # Index improvements
├── 20250830_fix_rls_performance*.sql                          # RLS policy optimization (multiple versions)
├── 20250830_install_pgvector_and_search_embeddings.sql        # pgvector setup
├── add_metadata_embeddings.sql                                # Embedding metadata
├── add_query_enhancement_config.sql                           # Query enhancement
├── apply_remaining.sql                                        # Batch application
└── [additional migration files]
```

## Key Migration Files

### Performance Optimization

#### 2024_01_optimize_slow_queries.sql
**Purpose:** Optimize frequently slow database queries

**What it does:**
- Adds indexes to improve query performance
- Rewrites inefficient queries
- Optimizes JOIN operations
- Improves aggregate query performance

**Apply:**
```bash
psql $DATABASE_URL -f migrations/2024_01_optimize_slow_queries.sql
```

---

#### 20250830_add_foreign_key_indexes.sql
**Purpose:** Add indexes on all foreign key columns

**What it does:**
- Indexes all foreign key columns for faster JOINs
- Improves referential integrity check performance
- Reduces lock contention on parent tables

**Impact:**
- 40-60% improvement in JOIN query performance
- Faster DELETE operations on parent tables

**Apply:**
```bash
psql $DATABASE_URL -f migrations/20250830_add_foreign_key_indexes.sql
```

---

### Row Level Security (RLS) Optimization

#### 20250830_fix_rls_performance.sql
**Purpose:** Initial RLS policy performance optimization

**Apply:**
```bash
psql $DATABASE_URL -f migrations/20250830_fix_rls_performance.sql
```

---

#### 20250830_fix_rls_performance_corrected.sql
**Purpose:** Corrected version of RLS performance fixes

**Apply:**
```bash
psql $DATABASE_URL -f migrations/20250830_fix_rls_performance_corrected.sql
```

---

#### 20250830_fix_rls_performance_final.sql
**Purpose:** Final optimized version of RLS policies

**What it does:**
- Simplifies RLS policy logic
- Adds indexes used by RLS policies
- Reduces policy evaluation time
- Optimizes service role permissions

**Impact:**
- 50-70% improvement in query performance with RLS enabled
- Reduced CPU usage on policy evaluation

**Apply:**
```bash
psql $DATABASE_URL -f migrations/20250830_fix_rls_performance_final.sql
```

**⚠️ Note:** This is the recommended version. The others are kept for historical reference.

---

#### 20250830_fix_rls_performance_minimal.sql
**Purpose:** Minimal set of RLS fixes for quick deployment

**Apply:**
```bash
psql $DATABASE_URL -f migrations/20250830_fix_rls_performance_minimal.sql
```

---

### Vector Search Setup

#### 20250830_install_pgvector_and_search_embeddings.sql
**Purpose:** Install pgvector extension and create search functions

**What it does:**
- Installs pgvector extension (if not already installed)
- Creates vector search functions
- Sets up IVFFlat indexes for vector similarity search
- Configures optimal index parameters

**Prerequisites:**
- PostgreSQL 14+ with pgvector support
- Supabase projects have this by default

**Apply:**
```bash
psql $DATABASE_URL -f migrations/20250830_install_pgvector_and_search_embeddings.sql
```

**Verify:**
```sql
SELECT * FROM pg_extension WHERE extname = 'vector';
```

---

### Feature Additions

#### add_metadata_embeddings.sql
**Purpose:** Add metadata columns to embeddings table

**What it does:**
- Adds metadata JSONB column to page_embeddings
- Adds chunk_index for tracking chunk position
- Adds source_type for content categorization

**Apply:**
```bash
psql $DATABASE_URL -f migrations/add_metadata_embeddings.sql
```

---

#### add_query_enhancement_config.sql
**Purpose:** Add configuration for query enhancement features

**What it does:**
- Adds query_enhancement_enabled column to customer_configs
- Adds enhancement_settings JSONB column
- Sets sensible defaults

**Apply:**
```bash
psql $DATABASE_URL -f migrations/add_query_enhancement_config.sql
```

---

### Batch Application

#### apply_remaining.sql
**Purpose:** Apply multiple migrations in sequence

**What it does:**
- Combines multiple migration statements
- Applies several schema changes at once
- Useful for initial setup or catching up

**Apply:**
```bash
psql $DATABASE_URL -f migrations/apply_remaining.sql
```

## Migration Application Methods

### Method 1: Direct psql (Recommended for local development)

```bash
# Set database URL
export DATABASE_URL="postgresql://user:pass@host:5432/dbname"

# Apply migration
psql $DATABASE_URL -f migrations/migration_file.sql

# Verify success
echo $?  # Should be 0
```

### Method 2: Supabase Management API

```javascript
// For when MCP tools unavailable or CLI conflicts
const SUPABASE_ACCESS_TOKEN = process.env.SUPABASE_ACCESS_TOKEN;
const PROJECT_REF = 'birugqyuqhiahxvxeyqg';

const sql = await fs.readFile('migrations/migration_file.sql', 'utf8');

const response = await fetch(
  `https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`,
  {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SUPABASE_ACCESS_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query: sql })
  }
);
```

**Reference:** See [CLAUDE.md](../CLAUDE.md) - Database Operations section

### Method 3: Supabase CLI (When available)

```bash
# Link to project
supabase link --project-ref birugqyuqhiahxvxeyqg

# Apply migration
supabase db push
```

## Migration Naming Convention

**Pattern:** `YYYYMMDD_description.sql` or `YYYY_MM_description.sql`

**Examples:**
- `20250830_add_foreign_key_indexes.sql`
- `2024_01_optimize_slow_queries.sql`
- `add_metadata_embeddings.sql` (descriptive name for features)

## Migration Best Practices

### Before Applying

1. **Read the migration** - Understand what it does
2. **Check prerequisites** - Ensure dependencies are met
3. **Backup database** - Take snapshot before major changes
4. **Test in development** - Apply to dev environment first

### Writing Migrations

```sql
-- Migration: Description
-- Created: YYYY-MM-DD
-- Purpose: What this migration accomplishes

BEGIN;

-- Make changes with IF NOT EXISTS for idempotency
CREATE INDEX IF NOT EXISTS idx_name ON table_name(column);

-- Add comments
COMMENT ON INDEX idx_name IS 'Improves performance of common queries';

-- Verify changes
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_name') THEN
    RAISE EXCEPTION 'Index creation failed';
  END IF;
END $$;

COMMIT;
```

### After Applying

1. **Verify changes:**
   ```sql
   -- Check tables
   \dt

   -- Check indexes
   \di

   -- Check functions
   \df
   ```

2. **Test functionality:**
   ```bash
   npx tsx scripts/validation/verify-fixes.js
   ```

3. **Monitor performance:**
   ```bash
   npx tsx scripts/benchmarks/benchmark-vector-graph-analysis.ts
   ```

4. **Document in project:**
   - Update schema documentation
   - Note breaking changes
   - Update related code if needed

## Rollback Strategy

### Manual Rollback

```sql
-- For index additions
BEGIN;
DROP INDEX IF EXISTS idx_name;
COMMIT;

-- For column additions
BEGIN;
ALTER TABLE table_name DROP COLUMN IF EXISTS column_name;
COMMIT;

-- For table additions
BEGIN;
DROP TABLE IF EXISTS table_name CASCADE;
COMMIT;
```

### Automatic Rollback

If migration fails mid-execution:
```sql
-- PostgreSQL automatically rolls back failed transactions
-- If using BEGIN/COMMIT, partial changes won't persist
```

## Migration Versioning

**Relationship with Supabase migrations:**

- **This directory:** Standalone SQL files for manual application
- **supabase/migrations/:** Supabase CLI managed migrations
- **Both are tracked:** Different migration tracking systems

**Why separate?**
- Flexibility in application method
- No dependency on Supabase CLI
- Can apply via Management API or direct SQL
- Easier for one-off fixes

## Common Migration Tasks

### Adding an Index

```sql
-- migrations/add_index_example.sql
CREATE INDEX IF NOT EXISTS idx_customer_configs_domain
ON customer_configs(domain);

ANALYZE customer_configs;
```

### Adding a Column

```sql
-- migrations/add_column_example.sql
ALTER TABLE table_name
ADD COLUMN IF NOT EXISTS new_column TEXT;

COMMENT ON COLUMN table_name.new_column IS 'Description';
```

### Updating RLS Policies

```sql
-- migrations/update_rls_example.sql
DROP POLICY IF EXISTS "old_policy" ON table_name;

CREATE POLICY "new_policy" ON table_name
  FOR SELECT
  USING (customer_id = current_setting('app.current_customer_id')::uuid);
```

## Troubleshooting

### "Migration already applied"
```bash
# Check if changes already exist
psql $DATABASE_URL -c "\d table_name"

# Most migrations use IF NOT EXISTS - safe to re-run
```

### "Permission denied"
```bash
# Ensure using service role key or proper database credentials
echo $DATABASE_URL

# Check user permissions
psql $DATABASE_URL -c "SELECT current_user;"
```

### "Syntax error in migration"
```bash
# Validate SQL syntax before applying
psql --dry-run $DATABASE_URL -f migrations/migration_file.sql

# Or use online SQL validators
```

## Related Directories

- **supabase/migrations/:** Supabase CLI managed migrations
- **scripts/database/:** Database utility scripts
- **scripts/sql/:** Additional SQL utility scripts

## Related Documentation

- [Database Schema Reference](../docs/07-REFERENCE/REFERENCE_DATABASE_SCHEMA.md)
- [Supabase Configuration](../supabase/README.md)
- [Performance Optimization](../docs/07-REFERENCE/REFERENCE_PERFORMANCE_OPTIMIZATION.md)
- [Main Scripts README](../scripts/README.md)
