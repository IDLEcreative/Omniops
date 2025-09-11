# Enhanced Metadata Search Migration - Manual Application Instructions

## Overview
The enhanced metadata search migration failed to apply automatically due to limitations with direct SQL execution via the Supabase client library. This document provides instructions for manually applying the migration.

## Migration File
The migration is located at: `/Users/jamesguy/Omniops/supabase/migrations/20250128_enhanced_metadata_search.sql`

## Manual Application Steps

### Option 1: Supabase Dashboard SQL Editor (Recommended)

1. **Open Supabase Dashboard**
   - Navigate to: https://supabase.com/dashboard/project/birugqyuqhiahxvxeyqg/sql
   - Log in to your Supabase account

2. **Open SQL Editor**
   - Click on "SQL Editor" in the left sidebar
   - Create a new query

3. **Copy Migration Content**
   - Copy the entire content of the migration file: `supabase/migrations/20250128_enhanced_metadata_search.sql`
   - Paste it into the SQL editor

4. **Execute Migration**
   - Click "Run" to execute the entire migration
   - The migration will create 3 new functions and several indexes

### Option 2: Using Supabase CLI

If you have the Supabase CLI installed:

```bash
# Navigate to your project directory
cd /Users/jamesguy/Omniops

# Apply the migration
supabase db push --include-all
```

Or apply the specific migration file:

```bash
# Connect to your remote database
supabase db remote set --project-ref birugqyuqhiahxvxeyqg

# Apply the migration
supabase migration up --target 20250128_enhanced_metadata_search
```

### Option 3: PostgreSQL Client

If you have direct PostgreSQL access:

```bash
# Connect to your Supabase PostgreSQL instance
psql "postgresql://postgres:[PASSWORD]@db.birugqyuqhiahxvxeyqg.supabase.co:5432/postgres"

# Execute the migration file
\i /Users/jamesguy/Omniops/supabase/migrations/20250128_enhanced_metadata_search.sql
```

## What the Migration Creates

The migration adds the following to your Supabase database:

### 1. Enhanced Vector Search Function
- **Name**: `search_embeddings_enhanced()`
- **Purpose**: Provides advanced vector search with metadata scoring
- **Features**:
  - Position boost (first chunks get higher scores)
  - Keyword matching boost
  - Recency boost for newer content
  - Content type relevance boost
  - Configurable filters for content types and domains

### 2. Metadata-Only Search Function
- **Name**: `search_by_metadata()`
- **Purpose**: Fast search based on metadata without vector similarity
- **Features**:
  - Filter by content types
  - Keyword filtering
  - Price range filtering (for e-commerce)
  - Availability filtering

### 3. Metadata Statistics Function
- **Name**: `get_metadata_stats()`
- **Purpose**: Monitor metadata quality and coverage
- **Returns**:
  - Total embeddings count
  - Embeddings with enhanced metadata count
  - Content type distribution
  - Average keywords per chunk
  - Average readability scores
  - Coverage percentage

### 4. Performance Indexes
- Content type index for fast filtering
- Indexed date index for recency queries
- GIN indexes for keywords and entities arrays
- Price range indexes for e-commerce filtering

## Verification Steps

After applying the migration, verify it worked:

### Test Enhanced Search Function
```sql
SELECT * FROM search_embeddings_enhanced(
  ARRAY[0.1, 0.2]::vector(1536),  -- Replace with actual embedding
  match_count => 5
);
```

### Test Metadata Search
```sql
SELECT * FROM search_by_metadata(
  content_types => ARRAY['product', 'faq'],
  limit_count => 10
);
```

### Check Statistics
```sql
SELECT * FROM get_metadata_stats();
```

## Benefits After Migration

1. **Improved Search Relevance**
   - Better ranking based on content position, keywords, and type
   - Recency boost for fresher content

2. **Better Performance**
   - Optimized indexes for common query patterns
   - Separate metadata-only search for exact matches

3. **Enhanced Analytics**
   - Statistics function to monitor content quality
   - Coverage metrics for metadata completeness

## Troubleshooting

If you encounter errors during manual application:

1. **Function Already Exists**: The migration includes `DROP FUNCTION IF EXISTS` statements, so this shouldn't be an issue

2. **Permission Errors**: Ensure you're connected with sufficient privileges (service_role or postgres user)

3. **Index Already Exists**: The migration uses `CREATE INDEX IF NOT EXISTS` to prevent conflicts

4. **Vector Extension Missing**: Ensure pgvector extension is installed:
   ```sql
   CREATE EXTENSION IF NOT EXISTS vector;
   ```

## Next Steps

Once the migration is successfully applied:

1. Update your chat system to use the new `search_embeddings_enhanced` function
2. Consider using the metadata statistics to monitor content quality
3. Test the new search capabilities with real queries
4. Update any existing search code to take advantage of the new features

## Support

If you need assistance applying this migration, the Supabase dashboard SQL editor is the most reliable method. The migration file contains all necessary SQL statements and should run without issues in the web interface.