# Search Orchestrator Test Suite

**Type:** Test Documentation
**Status:** Active
**Last Updated:** 2025-11-18
**Verified For:** v0.1.0
**Estimated Read Time:** 3 minutes

**Original File:** search-orchestrator-domain.test.ts (554 LOC)
**Refactored Structure:** 6 focused test files (848 LOC total with shared setup)
**All Tests:** 25 passing

## Overview

This directory contains the refactored test suite for the search-orchestrator domain lookup fallback system. The original 554 LOC monolithic test file has been split into focused test modules, each under 300 LOC per CLAUDE.md file length guidelines.

## Test Files

### 1. `tier-1-cache-lookup.test.ts` (128 LOC)
Tests for the first tier of domain lookup - standard domain cache lookups.

**Scenarios covered:**
- Direct cache hit for domain
- Domain lookup with www prefix handling
- Cache stats logging on successful lookup

### 2. `tier-2-alternative-formats.test.ts` (165 LOC)
Tests for the second tier - alternative domain format cache lookups as fallback.

**Scenarios covered:**
- Alternative format attempts on cache miss
- Trying all alternative formats in order
- Deduplicating domain format variations
- Stopping search once domain is found
- Logging each alternative attempt

### 3. `tier-3-direct-database.test.ts` (180 LOC)
Tests for the third tier - direct database lookup with fuzzy matching when cache is exhausted.

**Scenarios covered:**
- Direct database query execution
- Fuzzy matching with ILIKE patterns
- Fallback tier ordering
- Database error handling
- PGRST116 (not found) error handling
- Successful database lookup outcomes

### 4. `fallback-chain.test.ts` (143 LOC)
Tests for the complete three-tier fallback system working together.

**Scenarios covered:**
- Empty result after exhausting all options
- Logging all fallback attempts in correct order
- Database connection failures
- Proceeding with search after domain discovery via any tier

### 5. `edge-cases.test.ts` (123 LOC)
Tests for unusual scenarios and boundary conditions.

**Scenarios covered:**
- Empty domain handling
- Domains with protocol prefixes
- Very long domain names
- Concurrent lookups for same domain

### 6. `performance-caching.test.ts` (109 LOC)
Tests for performance characteristics and caching behavior.

**Scenarios covered:**
- Cache statistics tracking
- Database query skipping when cache hits
- Cache preference over database for performance

## Shared Test Utilities

The test files share common mock setup code located in `__tests__/utils/embeddings/`:

- **`test-mocks.ts`** - Reusable mock factories for Supabase client, cache manager, and search results
- **`test-setup.ts`** - Common mock initialization and dependency setup

## Running Tests

```bash
# Run all search-orchestrator tests
npm test -- __tests__/lib/embeddings/search-orchestrator/

# Run a specific test file
npm test -- __tests__/lib/embeddings/search-orchestrator/tier-1-cache-lookup.test.ts

# Run with coverage
npm test -- __tests__/lib/embeddings/search-orchestrator/ --coverage
```

## Test Statistics

| Metric | Value |
|--------|-------|
| Original File LOC | 554 |
| Refactored Total LOC | 848 (with setup files) |
| Test Files Created | 6 |
| Test Files > 300 LOC | 0 ✓ |
| Total Tests | 25 |
| Tests Passing | 25 |
| Pass Rate | 100% |

## Architecture

The test suite maintains a clear structure matching the three-tier domain lookup fallback system:

```
Tier 1: Cache Hit
├─ test: tier-1-cache-lookup.test.ts
└─ Tests: 3

Tier 2: Alternative Formats
├─ test: tier-2-alternative-formats.test.ts
└─ Tests: 5

Tier 3: Direct Database
├─ test: tier-3-direct-database.test.ts
└─ Tests: 6

Complete Chain
├─ test: fallback-chain.test.ts
└─ Tests: 4

Edge Cases & Performance
├─ test: edge-cases.test.ts (5 tests)
├─ test: performance-caching.test.ts (3 tests)
└─ Total: 8 tests
```

## Key Improvements

1. **Modularity**: Each test file focuses on a single aspect of the system
2. **Maintainability**: Smaller files are easier to understand and modify
3. **Reusability**: Common mock setup reduces duplication
4. **Readability**: Clear test grouping by functionality
5. **LOC Compliance**: All files under 300 LOC per coding standards

## Related Files

- Source: `/lib/embeddings/search-orchestrator.ts`
- Test utilities: `/__tests__/utils/embeddings/`
- Original monolithic test: Deleted (was `search-orchestrator-domain.test.ts`)
