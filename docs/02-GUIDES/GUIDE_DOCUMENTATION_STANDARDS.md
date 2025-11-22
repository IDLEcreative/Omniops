# Documentation Standards for AI Discoverability

**Type:** Guide  
**Status:** Active  
**Last Updated:** 2025-11-22  
**Purpose:** How to name, structure, and write documentation to maximize AI agent efficiency

---

## Why This Matters

When Claude scans documentation, it needs to quickly:
1. **Identify** what a document contains without reading it fully
2. **Locate** specific information across multiple documents
3. **Understand** relationships between documents
4. **Determine** if a document is current and authoritative
5. **Navigate** hierarchies efficiently without getting lost

**Poor documentation structure costs 10-50x more time** in agent context consumption.

---

## File Naming Conventions

**Pattern:** `{PREFIX}_{DESCRIPTIVE_NAME}.md`

**Prefix Categories:**
- `ARCHITECTURE_` - System design, patterns, data models
- `GUIDE_` - How-to instructions, walkthroughs
- `REFERENCE_` - Complete API/schema references
- `ANALYSIS_` - Problem analysis, decisions, investigations
- `SETUP_` - Installation, configuration, environment
- `TESTING_` - Test strategies, coverage, quality
- `TROUBLESHOOTING_` - Common issues and solutions
- `API_` - API endpoint documentation
- `INTEGRATION_` - Third-party integrations

**Good Examples:**
```
✅ docs/01-ARCHITECTURE/ARCHITECTURE_SEARCH_SYSTEM.md
✅ docs/02-GUIDES/GUIDE_DOCKER_SETUP.md
✅ docs/03-REFERENCE/REFERENCE_DATABASE_SCHEMA.md
```

**Bad Examples:**
```
❌ docs/woocommerce.md (ambiguous)
❌ docs/stuff.md (meaningless)
❌ docs/notes-2025-10-26.md (date-based)
```

**Naming Rules:**
1. Be specific: "GUIDE_STRIPE_INTEGRATION.md" NOT "stripe.md"
2. Use prefixes for fast grep/glob searches
3. No dates in filenames - use metadata instead
4. Use UPPER_SNAKE_CASE consistently
5. No redundancy: "docs/GUIDE_..." NOT "docs/guides/GUIDE_..."

---

## Directory Structure

**Hierarchical Organization:**
```
docs/
├── 01-ARCHITECTURE/       # System design & patterns
├── 02-GUIDES/             # Step-by-step instructions
├── 03-REFERENCE/          # Complete references
├── 04-ANALYSIS/           # Decisions & investigations
├── 05-TROUBLESHOOTING/    # Common problems
└── 06-INTEGRATIONS/       # Third-party integrations
```

**Benefits:**
- Fast scanning: `ls docs/02-GUIDES/` finds all guides
- Glob patterns: `grep -r "search" docs/01-ARCHITECTURE/`
- Clear context: Directory tells category immediately
- Scalability: Easy to add new docs

---

## Document Header Standards

**Every document MUST start with this metadata:**

```markdown
# Document Title

**Type:** [Architecture | Guide | Reference | Analysis | Troubleshooting]
**Status:** [Active | Draft | Deprecated | Archived]
**Last Updated:** 2025-10-29
**Verified For:** v0.1.0
**Dependencies:** [List of related docs]
**Estimated Read Time:** 5 minutes

## Purpose
[1-2 sentence summary]

## Quick Links
- [Related Document 1](../path/to/doc.md)
- [Related Document 2](../path/to/doc.md)

## Table of Contents
- [Section 1](#section-1)
- [Section 2](#section-2)

---

[Document content starts here]
```

**Why:**
- Status: Know if doc is current
- Last Updated: Assess freshness
- Purpose: Understand without full read
- Quick Links: Navigate related docs efficiently
- TOC: Jump to specific sections

---

## Content Structure

**1. Progressive Detail (Inverted Pyramid)**

Start with most critical information, then add details:

```markdown
## Feature Name

**TL;DR:** [1 sentence - what it does]
**Quick Start:** [2-3 lines - minimal example]
**Common Use Cases:** [Bullet list]
**Detailed Explanation:** [Full details]
**Advanced Topics:** [Edge cases]
```

**2. Code Examples Must Be Annotated**

```typescript
// ❌ BAD: No context
function process(data) { return data.map(x => x * 2); }

// ✅ GOOD: Clear purpose
// Doubles prices for tax calculation
// Used by: billing-service.ts, invoice-generator.ts
function applyTaxMultiplier(prices: number[]): number[] {
  return prices.map(price => price * 2);
}
```

**3. Cross-References Use Full Paths**

```markdown
✅ See [Architecture: Search](docs/01-ARCHITECTURE/ARCHITECTURE_SEARCH_SYSTEM.md#hybrid-search)
❌ See search architecture docs (where?)
```

---

## Searchability Optimization

**1. Keyword Front-Loading**

```markdown
✅ ## WooCommerce Integration: Product Sync Implementation
❌ ## How We Implemented the Thing That Syncs Products
```

**2. Synonyms and Aliases**

```markdown
## Database Schema Reference

**Keywords:** postgres, supabase, tables, indexes, SQL

**Aliases:**
- "customer_configs" table (also known as: customer settings)
- "scraped_pages" table (also known as: crawled pages)
```

---

## Anti-Patterns

❌ **Generic Filenames** - `notes.md`, `todo.md`, `misc.md`
❌ **No Metadata** - Missing update dates, status, version
❌ **Wall of Text** - No headings, code blocks, visual breaks
❌ **Hidden Context** - Important info buried in middle
❌ **Broken Links** - Dead cross-references
❌ **Inconsistent Terms** - Same concept, different names
❌ **No TOC** - Long docs without navigation

---

## Validation Checklist

Before considering a document "AI-ready":

- [ ] Filename is descriptive with prefix pattern
- [ ] Document has metadata header
- [ ] Purpose is clear in first 2 sentences
- [ ] TOC exists (if doc >100 lines)
- [ ] Code examples annotated
- [ ] Cross-references use full paths
- [ ] Keywords/aliases section present
- [ ] Last updated date accurate
- [ ] Related documents linked
- [ ] No broken links
- [ ] Consistent terminology

---

## Example

See [REFERENCE_DATABASE_SCHEMA.md](../09-REFERENCE/REFERENCE_DATABASE_SCHEMA.md) as gold standard.
