**Last Updated:** 2025-11-18
**Verified Accurate For:** v0.1.0
**Status:** Active
**Type:** Reference

# Supabase Directory

**Type:** Reference
**Status:** Active
**Last Updated:** 2025-11-18
**Verified For:** v0.1.0
**Dependencies:** [Database Schema Reference](/home/user/Omniops/docs/09-REFERENCE/REFERENCE_DATABASE_SCHEMA.md), [Migrations README](/home/user/Omniops/supabase/migrations/README.md)
**Estimated Read Time:** 8 minutes

## Purpose

Complete reference for database migrations, configurations, and Supabase-specific files including schema definitions, migration procedures, and database management best practices.

## Structure

```
supabase/
├── migrations/         # SQL migration files
│   ├── 002_add_auth.sql
│   ├── 003_update_customer_configs.sql
│   ├── 004_add_owned_domains.sql
│   └── 20240201_firecrawl_enhancements.sql
├── functions/         # Edge functions (if needed)
├── seed.sql          # Seed data (if needed)
└── config.toml       # Supabase configuration (if needed)
```

## Migrations

### Migration Files
SQL files that define database schema changes (in chronological order):

1. **000_complete_schema.sql** - Complete initial database schema
2. **000_complete_schema_fixed.sql** - Fixed version of complete schema  
3. **001_initial_migration.sql** - Initial migration setup
4. **001_remove_redundant_tables.sql** - Clean up redundant database tables
5. **002_add_auth.sql** - Authentication tables and policies
6. **003_update_customer_configs.sql** - Customer configuration updates
7. **004_add_owned_domains.sql** - Owned domains feature
8. **20240101000000_create_chat_tables.sql** - Chat system tables
9. **20240201_firecrawl_enhancements.sql** - Firecrawl/scraping improvements
10. **20250125_add_ai_optimized_tables.sql** - AI optimization tables
11. **20250125_add_domain_patterns.sql** - Domain pattern matching
12. **20250127_performance_indexes.sql** - Performance optimization indexes

### Running Migrations

**Local Development:**
```bash
# Using psql
psql -U postgres -d your_database < supabase/migrations/002_add_auth.sql

# Or using Supabase CLI
supabase db push

# Run all migrations in order (recommended sequence)
psql -U postgres -d your_database < supabase/migrations/000_complete_schema_fixed.sql
psql -U postgres -d your_database < supabase/migrations/002_add_auth.sql
psql -U postgres -d your_database < supabase/migrations/003_update_customer_configs.sql
psql -U postgres -d your_database < supabase/migrations/004_add_owned_domains.sql
psql -U postgres -d your_database < supabase/migrations/20240101000000_create_chat_tables.sql
psql -U postgres -d your_database < supabase/migrations/20250125_add_ai_optimized_tables.sql
psql -U postgres -d your_database < supabase/migrations/20250125_add_domain_patterns.sql
psql -U postgres -d your_database < supabase/migrations/20250127_performance_indexes.sql

# Or run all in sequence (be careful of order)
for file in supabase/migrations/000_complete_schema_fixed.sql supabase/migrations/002_add_auth.sql supabase/migrations/003_update_customer_configs.sql supabase/migrations/004_add_owned_domains.sql supabase/migrations/20240101000000_create_chat_tables.sql supabase/migrations/20250125_add_ai_optimized_tables.sql supabase/migrations/20250125_add_domain_patterns.sql supabase/migrations/20250127_performance_indexes.sql; do
  echo "Running migration: $file"
  psql -U postgres -d your_database < "$file"
done
```

**Production:**
Apply migrations through Supabase Dashboard or CLI:
```bash
supabase db push --linked
```

### Creating New Migrations

**Naming Convention:**
```
XXX_description.sql
# or
YYYYMMDD_description.sql
```

**Template:**
```sql
-- Migration: XXX_description
-- Created: YYYY-MM-DD
-- Purpose: What this migration does

BEGIN;

-- Your SQL changes here
CREATE TABLE IF NOT EXISTS new_table (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes
CREATE INDEX idx_new_table_created_at ON new_table(created_at);

-- Add RLS policies
ALTER TABLE new_table ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own data" ON new_table
  FOR SELECT USING (auth.uid() = user_id);

COMMIT;
```

## Database Schema

### Core Tables

```sql
-- Customer configurations
customer_configs (
  id UUID PRIMARY KEY,
  domain TEXT UNIQUE NOT NULL,
  config JSONB,
  encrypted_woocommerce_config TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)

-- Scraped pages
scraped_pages (
  id UUID PRIMARY KEY,
  customer_id UUID REFERENCES customer_configs(id),
  url TEXT NOT NULL,
  title TEXT,
  content TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ
)

-- Vector embeddings
page_embeddings (
  id UUID PRIMARY KEY,
  page_id UUID REFERENCES scraped_pages(id),
  chunk_text TEXT,
  embedding vector(1536),
  metadata JSONB
)

-- Conversations
conversations (
  id UUID PRIMARY KEY,
  customer_id UUID REFERENCES customer_configs(id),
  session_id TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)

-- Messages
messages (
  id UUID PRIMARY KEY,
  conversation_id UUID REFERENCES conversations(id),
  role TEXT CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ
)
```

### Indexes
```sql
-- Performance indexes
CREATE INDEX idx_scraped_pages_customer_id ON scraped_pages(customer_id);
CREATE INDEX idx_scraped_pages_url ON scraped_pages(url);
CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX idx_conversations_session_id ON conversations(session_id);

-- Vector search index
CREATE INDEX ON page_embeddings USING ivfflat (embedding vector_cosine_ops);
```

### Row Level Security (RLS)

```sql
-- Enable RLS on all tables
ALTER TABLE customer_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE scraped_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

-- Example policies
CREATE POLICY "Customers can read own config" ON customer_configs
  FOR SELECT USING (domain = current_setting('app.current_domain'));

CREATE POLICY "Service role has full access" ON customer_configs
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');
```

## Supabase Functions

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
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pe.id,
    pe.chunk_text as content,
    1 - (pe.embedding <=> query_embedding) as similarity
  FROM page_embeddings pe
  JOIN scraped_pages sp ON pe.page_id = sp.id
  WHERE 
    (customer_id_param IS NULL OR sp.customer_id = customer_id_param)
  ORDER BY pe.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
```

### Cleanup Function
```sql
CREATE OR REPLACE FUNCTION cleanup_old_data()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  -- Delete conversations older than retention period
  DELETE FROM conversations 
  WHERE created_at < NOW() - INTERVAL '30 days';
  
  -- Delete orphaned messages
  DELETE FROM messages 
  WHERE conversation_id NOT IN (SELECT id FROM conversations);
END;
$$;
```

## Environment Setup

### Required Extensions
```sql
-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
```

### Connection String
```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=https://[project-id].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

## Best Practices

### Migration Guidelines
1. **Always use transactions** - Wrap changes in BEGIN/COMMIT
2. **Make migrations idempotent** - Use IF NOT EXISTS
3. **Test locally first** - Run on local database
4. **Version control** - Commit migrations to git
5. **Document changes** - Add comments explaining why

### Performance Tips
1. **Add indexes** for frequently queried columns
2. **Use partial indexes** for filtered queries
3. **Vacuum regularly** for vector tables
4. **Monitor slow queries** in Supabase dashboard
5. **Use connection pooling** in production

### Security
1. **Enable RLS** on all tables
2. **Use service role key** only server-side
3. **Validate inputs** before database operations
4. **Audit sensitive operations**
5. **Regular backups** of production data

## Troubleshooting

### Common Issues

**Migration fails:**
```bash
# Check current schema
psql -c "\dt" 
# Rollback if needed
psql -c "ROLLBACK;"
```

**RLS blocking access:**
```sql
-- Temporarily disable to debug
ALTER TABLE table_name DISABLE ROW LEVEL SECURITY;
-- Re-enable after fixing
ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;
```

**Vector search slow:**
```sql
-- Rebuild index
REINDEX INDEX idx_embeddings_vector;
-- Analyze table
ANALYZE page_embeddings;
```