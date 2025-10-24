# NPX Scripts Roadmap

**Last Updated:** 2025-10-24
**Purpose:** Track planned NPX utility scripts referenced in CLAUDE.md but not yet implemented

## Overview

This document tracks the implementation status of NPX utility scripts that are mentioned in documentation but not yet built. These scripts are planned enhancements to improve developer experience and operational efficiency.

---

## High Priority Scripts

### 1. Database Cleanup Utilities

**Script:** `test-database-cleanup.ts`

**Status:** 🔜 Not Implemented

**Priority:** High

**Estimated Effort:** 2-3 days

**Description:**
Utility for cleaning scraped data from the database, useful for:
- Fresh re-scraping of domains
- Removing stale or incorrect data
- Database maintenance and testing

**Planned Commands:**
```bash
npx tsx test-database-cleanup.ts stats              # View scraping statistics
npx tsx test-database-cleanup.ts clean              # Clean all scraped data
npx tsx test-database-cleanup.ts clean --domain=X   # Clean specific domain
npx tsx test-database-cleanup.ts clean --dry-run    # Preview cleanup
```

**Implementation Notes:**
- Use CASCADE foreign keys for safe deletion
- Preserve: customer configs, credentials, user accounts
- Remove: scraped pages, embeddings, extractions, cache
- Add confirmation prompts for destructive operations
- Support dry-run mode for safety
- Related implementation: `lib/database-cleaner.ts` (may need to be created)

**Dependencies:**
- Supabase client
- CLI argument parsing (e.g., commander or yargs)

---

### 2. Hallucination Prevention Testing

**Script:** `test-hallucination-prevention.ts`

**Status:** 🔜 Not Implemented

**Priority:** High

**Estimated Effort:** 3-4 days

**Description:**
Automated testing suite for the chat system's anti-hallucination measures. Critical for validating that the AI assistant admits uncertainty rather than making false claims.

**Planned Functionality:**
- Test suite with edge cases for hallucination scenarios
- Validate response patterns for uncertain queries
- Check compliance with hallucination prevention guidelines
- Regression testing after prompt changes

**Implementation Notes:**
- Should be run after any changes to chat prompts
- Reference: `docs/HALLUCINATION_PREVENTION.md`
- Include test cases for:
  - Out-of-scope product questions
  - Missing data scenarios
  - Ambiguous queries
  - Edge cases that might trigger false confidence

**Dependencies:**
- OpenAI API access
- Test framework (Jest/Vitest)
- Chat route integration

---

## Medium Priority Scripts

### 3. Embeddings Health Monitoring

**Script:** `monitor-embeddings-health.ts`

**Status:** 🔜 Not Implemented

**Priority:** Medium

**Estimated Effort:** 3-5 days

**Description:**
Health monitoring and maintenance for the vector embeddings system.

**Planned Commands:**
```bash
npx tsx monitor-embeddings-health.ts check          # Run health check
npx tsx monitor-embeddings-health.ts auto           # Run auto-maintenance
npx tsx monitor-embeddings-health.ts watch          # Start continuous monitoring
```

**Planned Features:**
- Check for missing or corrupted embeddings
- Validate embedding dimensions and quality
- Monitor token usage and costs
- Identify stale embeddings that need refresh
- Auto-heal common issues
- Continuous monitoring mode with alerts

**Implementation Notes:**
- Integration with existing `lib/embeddings.ts`
- Consider pgvector health metrics
- Track embedding generation failures
- Monitor OpenAI API rate limits

**Dependencies:**
- Supabase/pgvector access
- OpenAI API
- Monitoring infrastructure

---

### 4. Chunk Size Optimization

**Script:** `optimize-chunk-sizes.ts`

**Status:** 🔜 Not Implemented

**Priority:** Medium

**Estimated Effort:** 2-3 days

**Description:**
Analyze and optimize text chunk sizes for embeddings.

**Planned Commands:**
```bash
npx tsx optimize-chunk-sizes.ts analyze             # Analyze chunk distribution
npx tsx optimize-chunk-sizes.ts optimize            # Fix oversized chunks
```

**Planned Features:**
- Analyze current chunk size distribution
- Identify chunks that are too large or too small
- Recommend optimal chunk sizes for token efficiency
- Batch optimization of problematic chunks
- Report on token usage improvements

**Implementation Notes:**
- Consider token limits (8191 for text-embedding-ada-002)
- Balance between context preservation and efficiency
- May need to re-embed optimized chunks
- Related: `lib/embeddings.ts` chunking logic

**Dependencies:**
- Database access for page_embeddings
- OpenAI tokenizer
- Batch processing capabilities

---

### 5. Batch Rechunking Operations

**Script:** `batch-rechunk-embeddings.ts`

**Status:** 🔜 Not Implemented

**Priority:** Medium

**Estimated Effort:** 2-3 days

**Description:**
Batch process embeddings for rechunking and re-embedding.

**Planned Commands:**
```bash
npx tsx batch-rechunk-embeddings.ts --force         # Batch process all chunks
npx tsx batch-rechunk-embeddings.ts --domain=X      # Process specific domain
npx tsx batch-rechunk-embeddings.ts --dry-run       # Preview changes
```

**Planned Features:**
- Batch process oversized chunks
- Parallel processing for efficiency
- Progress tracking and reporting
- Rollback capability
- Cost estimation before execution

**Implementation Notes:**
- High API usage - implement rate limiting
- Consider batching to avoid OpenAI rate limits
- Maintain referential integrity during re-embedding
- Track costs and token usage

**Dependencies:**
- optimize-chunk-sizes.ts (for analysis)
- OpenAI API
- Job queue system (Redis)

---

### 6. Simple Rechunking

**Script:** `simple-rechunk.ts`

**Status:** 🔜 Not Implemented

**Priority:** Low

**Estimated Effort:** 1-2 days

**Description:**
Simple sequential rechunking utility without batch processing complexity.

**Planned Features:**
- Sequential processing (simpler than batch)
- Suitable for small-scale operations
- Less resource-intensive than batch-rechunk
- Good for testing chunking strategies

**Implementation Notes:**
- Simpler alternative to batch-rechunk-embeddings.ts
- Use for development and testing
- Consider promoting successful domains incrementally

---

## Low Priority Scripts

### 7. Docker Build Profiling

**Script:** `profile-docker-quick.ts`

**Status:** 🔜 Not Implemented

**Priority:** Low

**Estimated Effort:** 1-2 days

**Description:**
Profile Docker build performance and identify bottlenecks.

**Planned Features:**
- Measure build stage durations
- Identify cache inefficiencies
- Compare DOCKER_BUILDKIT performance
- Report on layer sizes and build time
- Suggest optimizations

**Implementation Notes:**
- Parse Docker build output
- Track build cache effectiveness
- Referenced in Docker section of CLAUDE.md (line 227)

**Dependencies:**
- Docker CLI
- Build log parsing

---

## Implementation Strategy

### Phase 1: Critical Operations (High Priority)
1. **test-database-cleanup.ts** - Essential for development workflow
2. **test-hallucination-prevention.ts** - Critical for quality assurance

**Timeline:** 1-2 weeks
**Dependencies:** None (can start immediately)

### Phase 2: Performance & Monitoring (Medium Priority)
1. **monitor-embeddings-health.ts** - Production monitoring
2. **optimize-chunk-sizes.ts** - Cost optimization
3. **batch-rechunk-embeddings.ts** - Bulk operations

**Timeline:** 2-3 weeks
**Dependencies:** Phase 1 completion

### Phase 3: Nice-to-Have (Low Priority)
1. **simple-rechunk.ts** - Development convenience
2. **profile-docker-quick.ts** - Build optimization

**Timeline:** 1 week
**Dependencies:** Phase 2 completion

---

## Design Principles

All NPX scripts should follow these principles:

### 1. Safety First
- Dry-run mode for destructive operations
- Confirmation prompts for critical actions
- Comprehensive error handling
- Rollback capabilities where applicable

### 2. Clear Output
- Progress indicators for long operations
- Detailed success/failure reporting
- Cost estimates (for API operations)
- Summary statistics

### 3. Developer Experience
- Consistent CLI interface
- Help text and examples
- Sensible defaults
- Environment variable support

### 4. Production Ready
- Proper logging
- Error recovery
- Rate limiting (for API calls)
- Idempotent operations where possible

### 5. Documentation
- README section for each script
- Usage examples
- Common troubleshooting scenarios
- Integration with existing docs

---

## Related Documentation

- **[NPX_TOOLS_GUIDE.md](NPX_TOOLS_GUIDE.md)** - Guide for existing NPX tools
- **[ALL_NPX_TOOLS_REFERENCE.md](ALL_NPX_TOOLS_REFERENCE.md)** - Complete reference of all tools
- **[HALLUCINATION_PREVENTION.md](HALLUCINATION_PREVENTION.md)** - Anti-hallucination guidelines
- **[DATABASE_CLEANUP.md](DATABASE_CLEANUP.md)** - Database cleanup documentation (planned)

---

## Contributing

When implementing a script from this roadmap:

1. Update this document with implementation status
2. Add usage examples to CLAUDE.md
3. Update related documentation
4. Add tests for the script functionality
5. Update ALL_NPX_TOOLS_REFERENCE.md with the new script

---

## Status Legend

- 🔜 **Not Implemented** - Script is planned but not built
- 🚧 **In Progress** - Currently being implemented
- ✅ **Implemented** - Script is complete and tested
- 📦 **Released** - Script is documented and in use

---

## Notes

- Scripts are referenced in CLAUDE.md lines 91-112, 227, 339
- Some documentation files reference these scripts but they don't exist yet
- This roadmap was created on 2025-10-24 to track implementation status
- Priority is based on developer workflow impact and operational needs
