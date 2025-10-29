# Search Architecture & Result Limits

**Type:** Architecture
**Status:** Active
**Last Updated:** 2025-10-29
**Verified For:** v0.1.0
**Estimated Read Time:** 7 minutes

## Purpose
This documentation has been moved to the architecture section and updated with current implementation details:

## Quick Links
- [What Changed](#what-changed)
- [Quick Reference](#quick-reference)
- [Why It Moved](#why-it-moved)
- [New Content Includes](#new-content-includes)
- [Update Your Bookmarks](#update-your-bookmarks)

## Keywords
architecture, bookmarks, changed, content, includes, moved, quick, reference, search, update

---

**Last Updated:** 2025-10-24
**Verified Accurate For:** v0.1.0


**⚠️ THIS FILE HAS MOVED**

This documentation has been moved to the architecture section and updated with current implementation details:

**New Location**: [docs/01-ARCHITECTURE/ARCHITECTURE_SEARCH_SYSTEM.md](./01-ARCHITECTURE/ARCHITECTURE_SEARCH_SYSTEM.md)

---

## What Changed

The search architecture documentation has been:
- ✅ **Verified** against current implementation (2025-10-24)
- ✅ **Moved** to proper architecture folder (`docs/01-ARCHITECTURE/`)
- ✅ **Expanded** with comprehensive implementation details
- ✅ **Updated** with accurate code references and line numbers
- ✅ **Enhanced** with debugging guides and testing scenarios

---

## Quick Reference

**Critical Facts (Verified Current):**

1. **Result Limits:**
   - Default: 100 results
   - Maximum: 1000 results
   - Adaptive: 50 for targeted queries (>3 words)
   - Keyword multiplier: `Math.max(limit * 2, 200)` for deduplication

2. **Embedding Model:**
   - Model: `text-embedding-3-small`
   - Dimensions: 1,536 (not 3,072)
   - Cost: $0.02 per 1M tokens

3. **Hybrid Search:**
   - Short queries (≤2 words): Keyword search first
   - Long queries (>2 words): Vector search
   - Fallback: Keyword search on vector error

4. **Similarity Thresholds:**
   - `search_products`: 0.2
   - `search_by_category`: 0.15
   - `get_product_details`: 0.3

5. **Token Usage:**
   - 200 results ≈ 15,000 tokens
   - 1000 results ≈ 75,000 tokens
   - Content truncated to 200 chars/result

---

## Why It Moved

This document is **core architecture documentation** and belongs with:
- [Performance Optimization](./07-REFERENCE/REFERENCE_PERFORMANCE_OPTIMIZATION.md)
- [Architectural Decisions](./01-ARCHITECTURE/decisions.md)

The new location provides:
- ✅ Better organization (architecture docs together)
- ✅ More comprehensive coverage (1200+ lines vs 468)
- ✅ Verified accuracy (checked against actual code 2025-10-24)
- ✅ Better cross-referencing with related docs

---

## New Content Includes

The updated document now includes:

1. **Verified Implementation Details** (2025-10-24)
   - Exact code references with file paths and line numbers
   - Current model configuration (GPT-5-mini vs GPT-4)
   - Adaptive limit logic
   - Multi-layer caching

2. **Hybrid Search Deep Dive**
   - Decision logic (short vs long queries)
   - Keyword search implementation
   - Vector search implementation
   - Fallback strategies

3. **Performance Analysis**
   - Response time breakdowns
   - Token usage calculations
   - Cost comparisons (GPT-5-mini vs GPT-4)
   - Bottleneck identification

4. **Testing & Debugging Guides**
   - Common scenarios and solutions
   - Debug logging examples
   - Database query examples
   - Performance monitoring

5. **Configuration Options**
   - Tuning search limits
   - Adjusting similarity thresholds
   - Content truncation settings
   - Keyword multiplier configuration

---

## Update Your Bookmarks

**Old Path:** `docs/SEARCH_ARCHITECTURE.md`
**New Path:** `docs/01-ARCHITECTURE/ARCHITECTURE_SEARCH_SYSTEM.md`

**Related Documentation:**
- [Performance Optimization](./07-REFERENCE/REFERENCE_PERFORMANCE_OPTIMIZATION.md) - Response times and bottlenecks
- [Hallucination Prevention](./02-GUIDES/GUIDE_HALLUCINATION_PREVENTION.md) - Quality safeguards
- [Chat System](./02-FEATURES/chat-system/README.md) - Complete chat architecture
- [For Developers](./00-GETTING-STARTED/for-developers.md) - Getting started guide

---

**Redirect created:** 2025-10-24
**Original last update:** 2025-01-09 (9 months old)
**New version verified:** 2025-10-24 (current)
**See:** [01-ARCHITECTURE/ARCHITECTURE_SEARCH_SYSTEM.md](./01-ARCHITECTURE/ARCHITECTURE_SEARCH_SYSTEM.md) for complete documentation
