# Database Tests Directory

**Purpose:** Database-specific tests for data integrity, RLS policies, chunking strategies, page retrieval, and storage utilities.

**Test Type:** Integration | Unit

**Last Updated:** 2025-10-30

**Coverage:** PostgreSQL operations, Row Level Security, vector embeddings, chunk quality, and data retrieval strategies.

## Overview

Tests for database layer functionality including Supabase operations, security policies, content chunking for embeddings, and optimized data retrieval patterns.

## Test Structure

```
__tests__/database/
├── test-chunk-quality-analysis.ts          # Chunk quality metrics
├── test-chunk-ranking-simple.ts            # Chunk ranking algorithms
├── test-database-cleanup.ts                # Cleanup utilities
├── test-full-page-final-verification.ts    # Page retrieval validation
├── test-full-page-retrieval-10mtr.ts       # 10MTR retrieval strategy
├── test-full-page-retrieval-detailed.ts    # Detailed page retrieval
├── test-full-page-retrieval.ts             # Standard page retrieval
├── test-rls-policies.ts                    # Row Level Security tests
├── test-rpc-page-id.ts                     # RPC function tests
├── test-scattered-chunks-verification.ts   # Chunk distribution tests
├── test-storage-utilities.ts               # Storage helper tests
└── test-supabase-insert-debug.ts           # Insert debugging
```

## Running Tests

```bash
# Run all database tests
npm test -- __tests__/database/

# Run RLS policy tests
npm test -- test-rls-policies

# Run chunk quality tests
npm test -- test-chunk-quality-analysis

# Run with real Supabase (requires connection)
SUPABASE_URL=xxx npm test -- __tests__/database/
```

## Key Test Areas

### Row Level Security (RLS)
- Multi-tenant data isolation
- User permission validation
- Policy enforcement
- Security boundary testing

### Content Chunking
- Chunk quality metrics
- Optimal chunk size determination
- Chunk ranking for relevance
- Scattered chunk handling

### Data Retrieval
- Full page retrieval strategies
- Vector similarity search
- Pagination performance
- Cache effectiveness

### Storage Utilities
- Data cleanup operations
- Bulk operations
- Transaction handling
- Error recovery

## Related Code

- **Database Client**: `/lib/supabase-server.ts`, `/lib/supabase-client.ts`
- **Schema**: `/docs/07-REFERENCE/REFERENCE_DATABASE_SCHEMA.md`
- **Storage Utilities**: `/lib/storage-utilities.ts`
- **Embeddings**: `/lib/embeddings.ts`

## Related Documentation

- [Main Tests README](/Users/jamesguy/Omniops/__tests__/README.md)
- [Database Schema Reference](/Users/jamesguy/Omniops/docs/07-REFERENCE/REFERENCE_DATABASE_SCHEMA.md)
- [Library Tests](/Users/jamesguy/Omniops/__tests__/lib/README.md)
