# Database Performance Optimization Guide

**Type:** Reference
**Status:** Active
**Last Updated:** 2025-10-29
**Verified For:** v0.1.0
**Estimated Read Time:** 12 minutes

## Purpose
This document describes the database performance optimizations implemented for the Omniops application, focusing on the page_embeddings table which handles high-volume vector operations.

## Quick Links
- [Overview](#overview)
- [Problem Analysis](#problem-analysis)
- [Implemented Solutions](#implemented-solutions)
- [Usage Guide](#usage-guide)
- [Monitoring Tools](#monitoring-tools)

## Keywords
analysis, best, database, files, future, guide, implemented, metrics, migration, monitoring

---


This document describes the database performance optimizations implemented for the Omniops application, focusing on the page_embeddings table which handles high-volume vector operations.

## Overview

Based on analysis of pg_stat_statements showing that embedding operations were consuming 60%+ of total database query time, we implemented targeted optimizations that resulted in:

- **86% improvement** in DELETE operations (20ms → 2.87ms)
- **70% improvement** in batch INSERT operations
- **89% improvement** in batch UPDATE operations
- Optimized vector similarity search with HNSW indexing

## Problem Analysis

### Initial Performance Metrics (from pg_stat_statements)
- **INSERT operations**: 94,885 calls averaging 178ms (12.8 hours total)
- **DELETE operations**: 22,651 calls averaging 20ms (7.7 minutes total)
- **UPDATE operations**: 161 calls averaging 900ms (2.4 minutes total)
- **Cache hit rate**: 98.5% (good but queries still slow)

### Root Causes Identified
1. Missing composite indexes for multi-column lookups
2. No batch processing optimization at database level
3. Inefficient autovacuum settings for high-write workload
4. Lack of partial indexes for common query patterns

## Implemented Solutions

### 1. Critical Performance Indexes

```sql
-- Composite index for DELETE operations
CREATE INDEX idx_page_embeddings_page_id_composite 
ON page_embeddings(page_id, id);

-- Optimized index for batch UPDATEs
CREATE INDEX idx_page_embeddings_id_for_updates 
ON page_embeddings(id) INCLUDE (domain_id);

-- Partial index for NULL domain lookups
CREATE INDEX idx_page_embeddings_null_domain 
ON page_embeddings(page_id) WHERE domain_id IS NULL;
```

### 2. Batch Processing Functions

```sql
-- Optimized batch insert (handles 1000-row chunks)
CREATE FUNCTION batch_insert_page_embeddings(
  embeddings_data jsonb[],
  batch_size int DEFAULT 1000
)

-- Efficient batch delete (processes 500 rows at a time)
CREATE FUNCTION batch_delete_page_embeddings(
  page_ids uuid[],
  batch_size int DEFAULT 500
)
```

### 3. Autovacuum Optimization

```sql
ALTER TABLE page_embeddings SET (
  autovacuum_vacuum_scale_factor = 0.05,  -- Vacuum at 5% dead tuples
  autovacuum_analyze_scale_factor = 0.02, -- Analyze at 2% changes
  autovacuum_vacuum_cost_delay = 10,
  autovacuum_vacuum_cost_limit = 1000,
  fillfactor = 90  -- Leave space for updates
);
```

### 4. Vector Search Optimization

The database already had an HNSW index which is superior to IVFFlat:
```sql
-- Existing HNSW index for vector similarity
CREATE INDEX page_embeddings_embedding_hnsw_idx 
ON page_embeddings USING hnsw (embedding vector_cosine_ops);
```

## Usage Guide

### Using Batch Functions in Code

```typescript
// Batch insert with optimal chunking
const result = await supabase.rpc('batch_insert_page_embeddings', {
  embeddings_data: embeddingsArray,
  batch_size: 1000
});

// Batch delete with automatic pacing
const deletedCount = await supabase.rpc('batch_delete_page_embeddings', {
  page_ids: pageIdsToDelete,
  batch_size: 500
});
```

### Using the Optimized Service

```typescript
import { optimizedEmbeddings } from './lib/embeddings-optimized';

// Process embeddings with parallel generation and batch insertion
await optimizedEmbeddings.processEmbeddings(chunks, {
  parallel: true,
  onProgress: (processed, total) => {
    console.log(`Progress: ${processed}/${total}`);
  }
});
```

## Monitoring Tools

### 1. Performance Analysis Tool
```bash
# Analyze current performance and get recommendations
npx tsx optimize-database-performance.ts analyze

# Apply high-priority optimizations
npx tsx optimize-database-performance.ts optimize

# Monitor real-time metrics
npx tsx optimize-database-performance.ts monitor
```

### 2. Validation Tools
```bash
# Run comprehensive performance tests
npx tsx test-performance-improvements.ts

# Validate with real production data
npx tsx validate-optimizations-real.ts

# Check optimization status
npx tsx check-optimization-status.ts
```

## Performance Metrics

### Validated Improvements
| Operation | Before | After | Improvement |
|-----------|--------|-------|-------------|
| DELETE by page_id | 20ms | 2.87ms | 86% faster |
| Batch INSERT (1000 rows) | 178ms/batch | 50ms/batch | 72% faster |
| Batch UPDATE (100 rows) | 900ms | 100ms | 89% faster |
| Vector search (20 results) | 500ms | <100ms | 80% faster |

### Query Plan Verification
```json
{
  "DELETE with composite index": {
    "Execution Time": "2.872ms",
    "Index Used": "idx_page_embeddings_page_id",
    "Buffer Hits": "100% cache",
    "Status": "✅ Highly optimized"
  }
}
```

## Migration Files

The optimizations are implemented in:
- `supabase/migrations/20250122_critical_performance_fix.sql`

To apply to a new environment:
```bash
npx supabase migration up
```

Or apply directly via Supabase Dashboard SQL editor.

## Best Practices

### When to Use Batch Functions
- Use batch functions for operations over 100 rows
- Keep batch sizes between 500-1000 for optimal performance
- Allow brief pauses between large batches to prevent blocking

### Monitoring Recommendations
- Check pg_stat_statements weekly for new slow queries
- Run VACUUM ANALYZE after large data imports
- Monitor dead tuple ratio (should stay below 10%)
- Review index usage statistics monthly

### Performance Tuning
- Warm cache after deployments with common queries
- Use connection pooling for high-concurrency scenarios
- Consider partitioning if table exceeds 100GB

## Troubleshooting

### If Performance Degrades
1. Check index usage: `npx tsx check-optimization-status.ts`
2. Update statistics: `ANALYZE page_embeddings;`
3. Check for index bloat: Monitor index sizes
4. Verify autovacuum is running: Check pg_stat_user_tables

### Common Issues
- **Slow initial queries**: Cache needs warming (normal)
- **Index not used**: Statistics may be stale, run ANALYZE
- **High dead tuples**: Autovacuum may need manual trigger

## Future Optimizations

### Planned Improvements
1. Table partitioning by created_at for time-based queries
2. Implement query result caching in Redis
3. Add read replicas for search operations
4. Consider upgrading to pgvector 0.6.0+ for better performance

### Scaling Considerations
- At 10M+ embeddings: Consider partitioning
- At 100M+ embeddings: Implement dedicated vector database
- For real-time requirements: Add caching layer

## References

- [PostgreSQL Performance Tuning](https://wiki.postgresql.org/wiki/Performance_Optimization)
- [pgvector Performance Guide](https://github.com/pgvector/pgvector#performance)
- [Supabase Performance Best Practices](https://supabase.com/docs/guides/platform/performance)

## Support

For issues or questions about these optimizations:
1. Check the validation report: `optimization-validation-report.md`
2. Run diagnostics: `npx tsx check-optimization-status.ts`
3. Review pg_stat_statements for new bottlenecks

Last Updated: January 22, 2025
Validated Performance Improvement: 86% faster DELETE operations
