# Database Migrations

**Type:** Reference
**Status:** Active
**Last Updated:** 2025-11-18
**Verified For:** v0.1.0
**Dependencies:** [Supabase README](/home/user/Omniops/supabase/README.md), [Database Schema Reference](/home/user/Omniops/docs/09-REFERENCE/REFERENCE_DATABASE_SCHEMA.md)
**Estimated Read Time:** 14 minutes

## Purpose

Complete reference for database schema evolution containing all SQL migration files that define the database structure and changes over time, including migration procedures, schema overview, and troubleshooting guides.

## Quick Links

- [Supabase README](/home/user/Omniops/supabase/README.md)
- [Database Schema Reference](/home/user/Omniops/docs/09-REFERENCE/REFERENCE_DATABASE_SCHEMA.md)
- [Performance Optimization](/home/user/Omniops/docs/09-REFERENCE/REFERENCE_PERFORMANCE_OPTIMIZATION.md)

## Migration Files (In Chronological Order)

| File | Purpose | Description |
|------|---------|-------------|
| `000_complete_schema.sql` | Initial Complete Schema | Creates the complete initial database schema with all core tables |
| `000_complete_schema_fixed.sql` | Schema Corrections | Fixed version of the complete schema with bug fixes |
| `001_initial_migration.sql` | Initial Setup | Basic table structure and initial configuration |
| `001_remove_redundant_tables.sql` | Cleanup | Removes redundant database tables to optimize schema |
| `002_add_auth.sql` | Authentication System | Adds Supabase auth integration, user management, and RLS policies |
| `003_update_customer_configs.sql` | Customer Configuration | Updates to customer configuration table structure |
| `004_add_owned_domains.sql` | Owned Domains Feature | Adds owned_domains field for 20x faster scraping optimization |
| `20240101000000_create_chat_tables.sql` | Chat System | Creates conversations and messages tables for chat functionality |
| `20240201_firecrawl_enhancements.sql` | Scraping Improvements | Enhances web scraping capabilities and data structures |
| `20250125_add_ai_optimized_tables.sql` | AI Content Optimization | Creates tables for AI-optimized content processing |
| `20250125_add_domain_patterns.sql` | Domain Pattern Matching | Adds domain pattern matching capabilities |
| `20250127_performance_indexes.sql` | Performance Optimization | Adds database indexes for improved query performance |

## Database Schema Overview

### Core Tables

#### Customer Management
```sql
-- Main customer records
customers (
  id UUID PRIMARY KEY,
  auth_user_id UUID REFERENCES auth.users(id),
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  company_name TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)

-- Customer configurations and settings
customer_configs (
  id UUID PRIMARY KEY,
  customer_id UUID REFERENCES customers(id),
  domain TEXT UNIQUE NOT NULL,
  business_name TEXT,
  business_description TEXT,
  primary_color TEXT DEFAULT '#000000',
  welcome_message TEXT,
  suggested_questions JSONB DEFAULT '[]',
  woocommerce_url TEXT,
  encrypted_credentials JSONB,
  owned_domains TEXT[] DEFAULT '{}', -- For 20x faster scraping
  rate_limit INTEGER DEFAULT 10,
  allowed_origins TEXT[] DEFAULT ARRAY['*'],
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
```

#### Content Management
```sql
-- Scraped website pages
scraped_pages (
  id UUID PRIMARY KEY,
  customer_id UUID REFERENCES customer_configs(id),
  url TEXT NOT NULL,
  title TEXT,
  content TEXT,
  metadata JSONB,
  last_scraped_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ
)

-- Vector embeddings for semantic search
page_embeddings (
  id UUID PRIMARY KEY,
  page_id UUID REFERENCES scraped_pages(id),
  chunk_text TEXT,
  embedding vector(1536), -- OpenAI embeddings
  metadata JSONB,
  created_at TIMESTAMPTZ
)

-- Unified content storage with change tracking
website_content (
  id UUID PRIMARY KEY,
  domain_id UUID REFERENCES domains(id),
  url TEXT NOT NULL,
  title TEXT,
  content TEXT,
  content_hash TEXT, -- For change detection
  metadata JSONB,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)

```

#### AI Content Optimization
```sql
-- AI-optimized content processing
ai_optimized_content (
  id UUID PRIMARY KEY,
  domain_id UUID REFERENCES domains(id),
  source_content_id UUID REFERENCES website_content(id),
  url TEXT NOT NULL,
  content_type TEXT NOT NULL, -- 'product', 'category', 'article', 'faq', 'support'
  
  -- Original content
  raw_content TEXT,
  raw_html TEXT,
  
  -- AI-optimized content
  optimized_title TEXT,
  optimized_summary TEXT,
  optimized_content TEXT,
  key_points JSONB, -- Array of key points
  topics JSONB, -- Array of topics/tags
  
  -- SEO optimization
  meta_title TEXT,
  meta_description TEXT,
  keywords TEXT[],
  
  -- Structured data
  structured_data JSONB, -- Schema.org or other structured data
  
  -- Performance metadata
  readability_score REAL,
  content_quality_score REAL,
  
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
```

#### Chat System
```sql
-- Chat conversations
conversations (
  id UUID PRIMARY KEY,
  customer_id UUID REFERENCES customer_configs(id),
  session_id TEXT NOT NULL,
  user_id TEXT,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)

-- Individual messages
messages (
  id UUID PRIMARY KEY,
  conversation_id UUID REFERENCES conversations(id),
  role TEXT CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  metadata JSONB, -- Store sources, context, etc.
  created_at TIMESTAMPTZ
)

-- Support ticket submissions
support_tickets (
  id UUID PRIMARY KEY,
  customer_id UUID REFERENCES customer_configs(id),
  email TEXT,
  subject TEXT,
  message TEXT,
  status TEXT DEFAULT 'open',
  priority TEXT DEFAULT 'medium',
  created_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ
)
```

#### Data Extraction & Processing
```sql
-- Structured data extractions (FAQs, products, etc.)
structured_extractions (
  id UUID PRIMARY KEY,
  page_id UUID REFERENCES scraped_pages(id),
  extraction_type TEXT NOT NULL, -- 'faq', 'product', 'contact', 'custom'
  extracted_data JSONB NOT NULL,
  confidence_score REAL,
  created_at TIMESTAMPTZ
)

-- Content refresh job tracking
content_refresh_jobs (
  id UUID PRIMARY KEY,
  customer_id UUID REFERENCES customer_configs(id),
  job_type TEXT NOT NULL, -- 'full', 'incremental', 'discover'
  status TEXT DEFAULT 'pending', -- 'pending', 'running', 'completed', 'failed'
  pages_processed INTEGER DEFAULT 0,
  pages_total INTEGER,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  error_message TEXT
)
```

## Running Migrations

### Prerequisites

1. **PostgreSQL with Extensions**:
   ```sql
   CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
   CREATE EXTENSION IF NOT EXISTS "vector";
   CREATE EXTENSION IF NOT EXISTS "pg_trgm";
   ```

2. **Environment Setup**:
   ```bash
   # Required environment variables
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```

### Local Development

**Option 1: Using psql (Recommended sequence)**
```bash
# Navigate to project root
cd /path/to/customer-service-agent

# Run migrations in correct order
psql -U postgres -d your_database < supabase/migrations/000_complete_schema_fixed.sql
psql -U postgres -d your_database < supabase/migrations/002_add_auth.sql
psql -U postgres -d your_database < supabase/migrations/003_update_customer_configs.sql
psql -U postgres -d your_database < supabase/migrations/004_add_owned_domains.sql
psql -U postgres -d your_database < supabase/migrations/20240101000000_create_chat_tables.sql
psql -U postgres -d your_database < supabase/migrations/20250125_add_ai_optimized_tables.sql
psql -U postgres -d your_database < supabase/migrations/20250125_add_domain_patterns.sql
psql -U postgres -d your_database < supabase/migrations/20250127_performance_indexes.sql

# Verify migration success
psql -U postgres -d your_database -c "\dt"
```

**Option 2: Batch Script**
```bash
#!/bin/bash
# Run all migrations in sequence

MIGRATIONS=(
  "000_complete_schema_fixed.sql"
  "002_add_auth.sql" 
  "003_update_customer_configs.sql"
  "004_add_owned_domains.sql"
  "20240101000000_create_chat_tables.sql"
  "20250125_add_ai_optimized_tables.sql"
  "20250125_add_domain_patterns.sql"
  "20250127_performance_indexes.sql"
)

for migration in "${MIGRATIONS[@]}"; do
  echo "Running migration: $migration"
  psql -U postgres -d your_database < "supabase/migrations/$migration"
  if [ $? -ne 0 ]; then
    echo "ERROR: Migration $migration failed!"
    exit 1
  fi
  echo "✓ Migration $migration completed successfully"
done

echo "🎉 All migrations completed!"
```

**Option 3: Using Supabase CLI**
```bash
# Initialize Supabase (if not already done)
supabase init

# Link to your Supabase project
supabase link --project-ref your-project-ref

# Push migrations to database
supabase db push

# Or reset and apply all migrations
supabase db reset
```

### Production Deployment

**Via Supabase Dashboard:**
1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Copy and paste migration content
4. Execute in correct order

**Via Supabase CLI:**
```bash
# Link to production project
supabase link --project-ref your-prod-project-ref

# Push migrations to production
supabase db push --linked

# Verify deployment
supabase db diff --linked
```

## Creating New Migrations

### Naming Convention
```
XXX_description.sql           # Sequential numbering
# or
YYYYMMDD_description.sql      # Date-based naming
# or  
YYYYMMDDHHMMSS_description.sql # Timestamp-based naming
```

### Migration Template
```sql
-- Migration: XXX_description
-- Created: YYYY-MM-DD
-- Purpose: Brief description of what this migration does
-- Dependencies: List any migrations this depends on

BEGIN;

-- =====================================================
-- DESCRIPTION OF CHANGES
-- =====================================================

-- Create new tables
CREATE TABLE IF NOT EXISTS new_table (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX idx_new_table_name ON new_table(name);
CREATE INDEX idx_new_table_created_at ON new_table(created_at DESC);

-- Enable Row Level Security
ALTER TABLE new_table ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can read own data" ON new_table
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role has full access" ON new_table
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Add comments for documentation
COMMENT ON TABLE new_table IS 'Description of what this table stores';
COMMENT ON COLUMN new_table.metadata IS 'JSONB field for flexible data storage';

COMMIT;
```

## Key Database Functions

### Vector Search Function
```sql
CREATE OR REPLACE FUNCTION search_embeddings(
  query_embedding vector(1536),
  match_count int DEFAULT 5,
  customer_id_param uuid DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  content text,
  similarity float,
  metadata jsonb
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pe.id,
    pe.chunk_text as content,
    1 - (pe.embedding <=> query_embedding) as similarity,
    pe.metadata
  FROM page_embeddings pe
  JOIN scraped_pages sp ON pe.page_id = sp.id
  WHERE 
    (customer_id_param IS NULL OR sp.customer_id = customer_id_param)
  ORDER BY pe.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
```

### Data Cleanup Function
```sql
CREATE OR REPLACE FUNCTION cleanup_old_data(retention_days INTEGER DEFAULT 30)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  -- Delete old conversations based on customer retention settings
  DELETE FROM conversations 
  WHERE created_at < NOW() - INTERVAL '1 day' * retention_days;
  
  -- Delete orphaned messages
  DELETE FROM messages 
  WHERE conversation_id NOT IN (SELECT id FROM conversations);
  
  -- Delete old embeddings for removed pages
  DELETE FROM page_embeddings 
  WHERE page_id NOT IN (SELECT id FROM scraped_pages);
  
  -- Log cleanup results
  RAISE NOTICE 'Cleanup completed for data older than % days', retention_days;
END;
$$;
```

## Performance Indexes

### Core Performance Indexes
```sql
-- Frequently queried columns
CREATE INDEX idx_scraped_pages_url ON scraped_pages(url);
CREATE INDEX idx_scraped_pages_domain ON scraped_pages(domain);
CREATE INDEX idx_scraped_pages_last_scraped ON scraped_pages(last_scraped_at DESC);
CREATE INDEX idx_scraped_pages_domain_scraped ON scraped_pages(domain, last_scraped_at DESC);

-- Vector search optimization
CREATE INDEX idx_page_embeddings_vector ON page_embeddings 
USING ivfflat (embedding vector_cosine_ops);

-- Chat system optimization
CREATE INDEX idx_conversations_customer_id ON conversations(customer_id);
CREATE INDEX idx_conversations_session_id ON conversations(session_id);
CREATE INDEX idx_conversations_created_at ON conversations(created_at DESC);
CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX idx_messages_created_at ON messages(created_at DESC);

-- Customer configuration optimization
CREATE INDEX idx_customer_configs_domain ON customer_configs(domain);
CREATE INDEX idx_customer_configs_active ON customer_configs(active) WHERE active = true;
```

## Row Level Security (RLS) Policies

### Customer Data Isolation
```sql
-- Customers can only access their own data
CREATE POLICY "Customers access own config" ON customer_configs
  FOR ALL USING (
    customer_id IN (
      SELECT id FROM customers WHERE auth_user_id = auth.uid()
    )
  );

-- Service role has full access
CREATE POLICY "Service role full access" ON customer_configs
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Public read access for specific operations
CREATE POLICY "Public read for widget" ON customer_configs
  FOR SELECT USING (active = true AND domain = current_setting('app.current_domain'));
```

## Troubleshooting

### Common Migration Issues

**1. Extension Not Installed**
```sql
-- Fix: Install required extensions
CREATE EXTENSION IF NOT EXISTS "vector";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
```

**2. RLS Blocking Access**
```sql
-- Temporarily disable to debug
ALTER TABLE table_name DISABLE ROW LEVEL SECURITY;
-- Re-enable after fixing policies
ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;
```

**3. Vector Index Issues**
```sql
-- Rebuild vector index if slow
DROP INDEX IF EXISTS idx_page_embeddings_vector;
CREATE INDEX idx_page_embeddings_vector ON page_embeddings 
USING ivfflat (embedding vector_cosine_ops);

-- Analyze table for better query plans
ANALYZE page_embeddings;
```

**4. Migration Rollback**
```bash
# If migration fails mid-way
psql -U postgres -d your_database -c "ROLLBACK;"

# Check current transaction state
psql -U postgres -d your_database -c "SELECT txid_current();"
```

### Verification Commands

**Check Migration Status:**
```sql
-- List all tables
\dt

-- Check specific table structure
\d+ customer_configs

-- Verify indexes
\di

-- Check RLS policies
SELECT schemaname, tablename, policyname, cmd, qual 
FROM pg_policies 
WHERE tablename = 'customer_configs';

-- Verify extensions
SELECT * FROM pg_extension;
```

**Performance Monitoring:**
```sql
-- Check slow queries
SELECT query, mean_time, calls, total_time
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;

-- Check index usage
SELECT schemaname, tablename, indexname, idx_scan, idx_tup_read, idx_tup_fetch
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC;

-- Check table sizes
SELECT schemaname, tablename, 
       pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

## Best Practices

### Migration Development
1. **Always use transactions** - Wrap changes in `BEGIN`/`COMMIT`
2. **Make migrations idempotent** - Use `IF NOT EXISTS` clauses
3. **Test locally first** - Never run untested migrations in production
4. **Version control everything** - Commit all migrations to git
5. **Document changes thoroughly** - Add comments explaining the purpose

### Performance Optimization
1. **Add appropriate indexes** for frequently queried columns
2. **Use partial indexes** for filtered queries
3. **Monitor query performance** regularly
4. **Vacuum and analyze** tables after large changes
5. **Use connection pooling** in production

### Security
1. **Enable RLS** on all tables with sensitive data
2. **Create appropriate policies** for data access
3. **Use service role key** only server-side
4. **Validate all inputs** before database operations
5. **Audit sensitive operations** regularly

### Maintenance
1. **Regular backups** of production database
2. **Monitor disk space** usage
3. **Clean up old data** based on retention policies
4. **Update statistics** for query optimization
5. **Review and optimize** slow queries