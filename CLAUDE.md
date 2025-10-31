**Last Updated:** 2025-10-31 (Added Industry Best Practices section)
**Verified Accurate For:** v0.1.0

# CLAUDE.md

## 🚨 CRITICAL: BRAND-AGNOSTIC APPLICATION 🚨

**THIS IS A MULTI-TENANT, BRAND-AGNOSTIC SYSTEM**

### ABSOLUTELY NO HARDCODING OF:
- ❌ Company names, logos, or branding
- ❌ Specific product names, SKUs, or product types
- ❌ Industry-specific terminology (e.g., "pumps", "parts", "Cifa products")
- ❌ Business-specific categories or classifications
- ❌ Domain names or company-specific URLs
- ❌ Company-specific email addresses or contact info
- ❌ Industry-specific assumptions (e.g., assuming it's always e-commerce)

### THIS SYSTEM MUST WORK EQUALLY FOR:
- ✅ E-commerce stores (any product type)
- ✅ Restaurants and food services
- ✅ Real estate and housing
- ✅ Healthcare providers
- ✅ Educational institutions
- ✅ Service businesses
- ✅ ANY other business type

**VIOLATION CONSEQUENCES**: Hardcoding specific information will break the system for other tenants and violate the multi-tenant architecture. All business-specific data must come from the database configuration, NOT from code.

### ✅ EXCEPTION: TEST DATA

**Tests MAY use domain-specific terminology to verify real-world behavior.**

Tests should use actual product names, industry terms, and domain-specific queries to ensure the system works correctly:

```typescript
// ✅ ALLOWED in tests - Verifies system handles real queries
it('should find products when user asks about pumps', async () => {
  const result = await agent.query('Do you have any pumps?');
  expect(result.products).toBeDefined();
});

// ✅ ALLOWED - Tests with realistic data for primary customer (Thompson's)
const testData = {
  query: 'Show me ZF5 hydraulic pumps',
  expectedProducts: ['A4VTG90', 'BP-001']
};
```

**Rationale:** Tests verify the system works with real-world data. If the primary customer (Thompson's) sells pumps, tests should use "pumps" to ensure accurate behavior verification.

**Where this applies:**
- `__tests__/` - All test files can use domain-specific terms
- E2E tests simulating real user queries
- Integration tests with actual product data
- Test fixtures and mock data

**Where this does NOT apply:**
- Production code in `lib/`, `app/`, `components/`
- Default configurations
- UI templates or placeholders
- Documentation examples (should show multi-industry support)

---

## 🚨 CRITICAL: FILE PLACEMENT RULES 🚨

**NEVER create files directly in the root directory.** The root should contain ONLY configuration files.

### Automatic Placement Rules

When creating ANY file, you MUST follow these placement rules:

| File Type | Root? | Correct Location | Example |
|-----------|-------|------------------|---------|
| **Test scripts** | ❌ NO | `__tests__/[category]/` | `__tests__/integration/test-checkout.ts` |
| **Utility scripts** | ❌ NO | `scripts/[category]/` | `scripts/database/check-rls.ts` |
| **SQL scripts** | ❌ NO | `scripts/sql/[category]/` | `scripts/sql/migrations/add-index.sql` |
| **Completion reports** | ❌ NO | `ARCHIVE/completion-reports-[date]/` | `ARCHIVE/completion-reports-2025-10/REPORT.md` |
| **Test results (JSON)** | ❌ NO | `ARCHIVE/test-results/` | `ARCHIVE/test-results/benchmark.json` |
| **Log files** | ❌ NO | `logs/[category]/` | `logs/tests/jest-output.log` |
| **Documentation** | ❌ NO | `docs/[category]/` | `docs/02-GUIDES/GUIDE_SETUP.md` |
| **Config files** | ✅ YES | `/` (root only) | `package.json`, `tsconfig.json` |

### Allowed Root Files (ONLY These)

**Configuration Files:**
- `package.json`, `package-lock.json`
- `tsconfig.json`, `tsconfig.test.json`, `jsconfig.json`
- `next.config.js`, `middleware.ts`, `next-env.d.ts`
- `tailwind.config.js`, `postcss.config.mjs`
- `jest.config.js`, `playwright.config.js`, `eslint.config.mjs`
- `components.json`, `vercel.json`

**Docker Files:**
- `Dockerfile`, `Dockerfile.dev`
- `docker-compose.yml`, `docker-compose.dev.yml`
- `.dockerignore`

**Environment/Git Files:**
- `.env.example`, `.env.docker.example`, `.env.monitoring.example`
- `.gitignore`, `.eslintignore`, `.vercelignore`
- `.mcp.json`

**Documentation:**
- `README.md`, `CLAUDE.md`

### Decision Tree: Where Does My File Go?

```
Is it a config file (package.json, tsconfig.json, etc.)?
├─ YES → Root directory (/)
└─ NO → Continue...

Is it a test script (test-*.ts, verify-*.ts)?
├─ YES → __tests__/[category]/
└─ NO → Continue...

Is it a utility script (apply-*.ts, migrate-*.ts, check-*.ts)?
├─ YES → scripts/[category]/
└─ NO → Continue...

Is it a completion report (*_REPORT.md, *_SUMMARY.md)?
├─ YES → ARCHIVE/completion-reports-[date]/
└─ NO → Continue...

Is it test output (JSON, logs)?
├─ YES → ARCHIVE/test-results/ or logs/tests/
└─ NO → Continue...

Is it documentation?
├─ YES → docs/[category]/
└─ NO → Ask the user where it should go
```

### Examples of CORRECT File Creation

```typescript
// ❌ WRONG - Creating test in root
await writeFile('test-checkout-flow.ts', content);

// ✅ CORRECT - Creating test in proper location
await writeFile('__tests__/integration/test-checkout-flow.ts', content);

// ❌ WRONG - Creating migration script in root
await writeFile('apply-new-index.ts', content);

// ✅ CORRECT - Creating migration in proper location
await writeFile('scripts/database/apply-new-index.ts', content);

// ❌ WRONG - Creating report in root
await writeFile('IMPLEMENTATION_COMPLETE.md', content);

// ✅ CORRECT - Creating report in archive
await writeFile('ARCHIVE/completion-reports-2025-10/IMPLEMENTATION_COMPLETE.md', content);
```

### Enforcement

1. **Pre-commit hook** will block commits with misplaced files
2. **GitHub Actions** will reject PRs with root clutter
3. **`.gitignore`** patterns will hide accidental files (but don't rely on this!)

**ALWAYS create files in the correct location from the start. Do not rely on `.gitignore` to hide mistakes.**

---

## 🎯 CRITICAL: FOLLOW INDUSTRY BEST PRACTICES 🎯

**THIS IS A SAAS PRODUCT - Follow established patterns from successful companies**

When building features, always research and follow industry standards from established SaaS products (Stripe, Intercom, Segment, Vercel, etc.). Don't reinvent the wheel - learn from companies that have solved these problems at scale.

### Core Principles

**1. Minimal Integration Code**
- ✅ Embed scripts should be 5-10 lines maximum
- ✅ Configuration should load dynamically from server
- ✅ Customers should never need to update their integration code
- ❌ Don't generate 50+ lines of configuration in embed code

**Example - Widget Integration:**
```html
<!-- ✅ GOOD: Minimal, dynamic configuration -->
<script>
window.ChatWidgetConfig = { serverUrl: "https://omniops.co.uk" };
</script>
<script src="https://omniops.co.uk/embed.js" async></script>

<!-- ❌ BAD: Hardcoded configuration -->
<script>
window.ChatWidgetConfig = {
  serverUrl: "...",
  appearance: { /* 20 lines */ },
  features: { /* 20 lines */ },
  // Customer must update HTML to change anything
};
</script>
```

**2. Configuration Management**
- ✅ Store configuration in database
- ✅ Provide dashboard/UI for updates
- ✅ Apply changes instantly without code changes
- ✅ Version configuration for rollback capability
- ❌ Don't require customers to edit code to change settings

**3. API Design**
- ✅ RESTful endpoints with clear naming
- ✅ Consistent error responses with proper HTTP codes
- ✅ Rate limiting on all public endpoints
- ✅ Pagination for list endpoints (cursor-based preferred)
- ✅ API versioning strategy (URL or header-based)
- ❌ Don't return unbounded lists
- ❌ Don't expose internal implementation details in responses

**4. Developer Experience (DX)**
- ✅ Clear, concise documentation with examples
- ✅ Copy-paste ready code snippets
- ✅ Multiple framework examples (HTML, React, Next.js, etc.)
- ✅ Interactive testing/preview capabilities
- ✅ Helpful error messages with actionable solutions
- ❌ Don't assume technical knowledge
- ❌ Don't use jargon without explanation

**5. Security & Privacy**
- ✅ Environment variables for sensitive configuration
- ✅ Never expose API keys in client-side code
- ✅ Use service role keys server-side only
- ✅ Implement proper CORS policies
- ✅ Follow GDPR/CCPA compliance requirements
- ❌ Don't hardcode credentials anywhere
- ❌ Don't log sensitive information

**6. Scalability Defaults**
- ✅ Design for 10x current usage from day one
- ✅ Use caching strategically (Redis, CDN)
- ✅ Implement background job processing for heavy operations
- ✅ Database indexes on commonly queried fields
- ✅ Connection pooling for database access
- ❌ Don't make synchronous external API calls in request path
- ❌ Don't perform heavy computation in API routes

### Decision Framework

Before implementing any customer-facing feature, ask:

1. **How do industry leaders solve this?**
   - Research Stripe, Intercom, Vercel, Segment approaches
   - Look for common patterns across multiple products
   - Understand why they made those choices

2. **Is this the simplest solution?**
   - Can it be done with less code?
   - Can it be done with less customer effort?
   - What's the minimum viable implementation?

3. **Will this scale?**
   - Works for 1,000 customers?
   - Works for 10,000 customers?
   - What breaks first at scale?

4. **Is this maintainable?**
   - Can changes be made without customer action?
   - Is configuration centralized?
   - Are there sharp edges or gotchas?

5. **Is the DX excellent?**
   - Would I enjoy using this?
   - Is it self-explanatory?
   - Are errors helpful?

### Real-World Examples from This Codebase

**Widget Embed Code (Commit 43467ab)**
- ❌ **Before**: 50+ lines of hardcoded configuration
- ✅ **After**: 7 lines with dynamic config loading from `/api/widget/config`
- **Why**: Matches Intercom, Drift pattern - customers install once, update via dashboard

**Environment-Based URLs (Commit c875074)**
- ❌ **Before**: Widget auto-detected URLs, used Vercel preview URLs in production
- ✅ **After**: Uses `NEXT_PUBLIC_APP_URL` environment variable
- **Why**: Matches Vercel, Netlify pattern - different configs per environment

### When to Deviate from Best Practices

Sometimes you need to deviate - but document WHY:

```typescript
// DEVIATION: Using synchronous API call here because...
// 1. This endpoint is internal-only (not customer-facing)
// 2. Response time is <50ms (measured)
// 3. Alternative would require job queue setup (over-engineering for this use case)
const result = await fetchSyncData();
```

### Learning Resources

**For SaaS Patterns:**
- Stripe API Documentation (gold standard)
- Intercom Developer Hub (excellent DX)
- Segment Documentation (clear integration guides)
- Vercel Documentation (deployment best practices)

**For Architecture:**
- 12-Factor App methodology
- Microsoft Azure Architecture Center
- AWS Well-Architected Framework

**The Golden Rule:** If a successful SaaS company does it a certain way, there's probably a good reason. Learn from their mistakes and successes.

---

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a General purpose AI-powered customer service chat widget built with Next.js 15, React 19, TypeScript, and Supabase. The application provides an embeddable chat widget that can be integrated into any website, with features including web scraping, WooCommerce integration, and privacy-compliant data handling

## Key Documentation

- **[Search Architecture](docs/01-ARCHITECTURE/ARCHITECTURE_SEARCH_SYSTEM.md)** - CRITICAL: Explains actual search result limits (100-200, NOT 20!), hybrid search behavior, and token usage
- **[Performance Optimization](docs/09-REFERENCE/REFERENCE_PERFORMANCE_OPTIMIZATION.md)** - Comprehensive optimization guide covering database, API, AI, and frontend performance
- **[Database Schema](docs/09-REFERENCE/REFERENCE_DATABASE_SCHEMA.md)** - Complete database schema reference with 31 tables, 214 indexes, verified 2025-10-24
- **[Conversation Accuracy](docs/CONVERSATION_ACCURACY_IMPROVEMENTS.md)** - Metadata tracking system for 86% conversation accuracy
- **[Hallucination Prevention](docs/HALLUCINATION_PREVENTION.md)** - Anti-hallucination safeguards and testing
- **[Docker Setup](docs/00-GETTING-STARTED/SETUP_DOCKER_PRODUCTION.md)** - Complete Docker configuration and commands

---

## Documentation Standards for AI Discoverability

**Purpose:** This section defines how documentation should be named, structured, and written to maximize AI agent efficiency when scanning, searching, and understanding the codebase.

### Why This Matters

When I (Claude) scan documentation, I need to quickly:
1. **Identify** what a document contains without reading it fully
2. **Locate** specific information across multiple documents
3. **Understand** relationships between documents
4. **Determine** if a document is current and authoritative
5. **Navigate** hierarchies efficiently without getting lost

**Poor documentation structure costs 10-50x more time** in agent context consumption and requires multiple file reads to find simple information.

### File Naming Conventions

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
✅ docs/04-ANALYSIS/ANALYSIS_WOOCOMMERCE_EXPANSION.md
✅ docs/05-TROUBLESHOOTING/TROUBLESHOOTING_TEST_FAILURES.md
```

**Bad Examples (Hard to Scan):**
```
❌ docs/woocommerce.md  (What about WooCommerce? Setup? API? Analysis?)
❌ docs/stuff.md  (Completely ambiguous)
❌ docs/notes-2025-10-26.md  (Date-based, no content indicator)
❌ docs/final_final_v2.md  (Version soup, no description)
```

**Naming Rules:**
1. **Be Specific**: "GUIDE_STRIPE_INTEGRATION.md" NOT "stripe.md"
2. **Use Prefixes**: Makes grep/glob searches faster
3. **No Dates in Filenames**: Use metadata instead
4. **Snake_case**: Use `UPPER_SNAKE_CASE`, never `camelCase` or `kebab-case`
5. **No Redundancy**: "docs/GUIDE_..." NOT "docs/guides/GUIDE_..."

### Directory Structure

**Hierarchical Organization:**
```
docs/
├── 01-ARCHITECTURE/       # System design & patterns
│   ├── ARCHITECTURE_DATA_MODEL.md
│   ├── ARCHITECTURE_SEARCH_SYSTEM.md
│   └── ARCHITECTURE_SECURITY.md
│
├── 02-GUIDES/             # Step-by-step instructions
│   ├── GUIDE_DOCKER_SETUP.md
│   ├── GUIDE_STRIPE_INTEGRATION.md
│   └── GUIDE_DEPLOYMENT.md
│
├── 03-REFERENCE/          # Complete references
│   ├── REFERENCE_DATABASE_SCHEMA.md
│   ├── REFERENCE_API_ENDPOINTS.md
│   └── REFERENCE_ENV_VARIABLES.md
│
├── 04-ANALYSIS/           # Decisions & investigations
│   ├── ANALYSIS_WOOCOMMERCE_EXPANSION.md
│   ├── ANALYSIS_PERFORMANCE_BOTTLENECKS.md
│   └── ANALYSIS_TECH_DEBT.md
│
├── 05-TROUBLESHOOTING/    # Common problems
│   ├── TROUBLESHOOTING_TEST_FAILURES.md
│   ├── TROUBLESHOOTING_DOCKER_ISSUES.md
│   └── TROUBLESHOOTING_DATABASE_MIGRATIONS.md
│
└── 06-INTEGRATIONS/       # Third-party integrations
    ├── INTEGRATION_WOOCOMMERCE.md
    ├── INTEGRATION_SHOPIFY.md
    └── INTEGRATION_STRIPE.md
```

**Benefits:**
- **Fast Scanning**: I can `ls docs/02-GUIDES/` to find all guides
- **Glob Patterns**: `grep -r "search" docs/01-ARCHITECTURE/` finds architecture docs only
- **Clear Context**: Directory tells me document category immediately
- **Scalability**: Easy to add new docs without clutter

### Document Header Standards

**Every document MUST start with this metadata block:**

```markdown
# Document Title

**Type:** [Architecture | Guide | Reference | Analysis | Troubleshooting]
**Status:** [Active | Draft | Deprecated | Archived]
**Last Updated:** 2025-10-29
**Verified For:** v0.1.0
**Dependencies:** [List of related docs]
**Estimated Read Time:** 5 minutes

## Purpose
[1-2 sentence summary of what this document covers and why it exists]

## Quick Links
- [Related Document 1](../path/to/doc.md)
- [Related Document 2](../path/to/doc.md)

## Table of Contents
- [Section 1](#section-1)
- [Section 2](#section-2)

---

[Document content starts here]
```

**Why This Format:**
- **Status**: I immediately know if doc is current
- **Last Updated**: I can assess freshness
- **Verified For**: I know which version this applies to
- **Dependencies**: I can read prerequisites first
- **Purpose**: I understand the doc without reading it all
- **Quick Links**: I can navigate related docs efficiently
- **TOC**: I can jump to specific sections

### Content Structure Standards

**1. Progressive Detail (Inverted Pyramid)**

Start with the most critical information, then add details:

```markdown
## Feature Name

**TL;DR:** [1 sentence - what it does]

**Quick Start:** [2-3 lines - minimal example]

**Common Use Cases:** [Bullet list - when to use]

**Detailed Explanation:** [Full details for deep dive]

**Advanced Topics:** [Edge cases, optimizations]
```

**2. Code Examples Must Be Annotated**

```typescript
// ❌ BAD: No context
function process(data) { return data.map(x => x * 2); }

// ✅ GOOD: Clear purpose
// Doubles all values in price array for tax calculation
// Used by: billing-service.ts, invoice-generator.ts
function applyTaxMultiplier(prices: number[]): number[] {
  return prices.map(price => price * 2);
}
```

**3. Consistent Terminology**

Maintain a glossary and use terms consistently:

```markdown
✅ "customer configuration" (always use this)
❌ "customer settings", "config", "customer data" (inconsistent)

✅ "scraped pages" (database table name)
❌ "crawled pages", "web pages", "content" (ambiguous)
```

**4. Cross-References Use Full Paths**

```markdown
✅ See [Architecture: Search System](docs/01-ARCHITECTURE/ARCHITECTURE_SEARCH_SYSTEM.md#hybrid-search)
❌ See search architecture docs (where? what section?)
```

### Searchability Optimization

**1. Keyword Front-Loading**

Place important terms early in headings and paragraphs:

```markdown
✅ ## WooCommerce Integration: Product Sync Implementation
❌ ## How We Implemented the Thing That Syncs Products with WooCommerce
```

**2. Synonyms and Aliases**

Include common search terms:

```markdown
## Database Schema Reference

**Keywords:** postgres, supabase, tables, indexes, SQL, database structure, data model

**Aliases:**
- "customer_configs" table (also known as: customer settings, config table)
- "scraped_pages" table (also known as: crawled pages, website content)
```

**3. Anchor Links for Sub-Sections**

```markdown
## API Endpoints

### POST /api/chat {#endpoint-chat}
[Details...]

### GET /api/scrape/status {#endpoint-scrape-status}
[Details...]

// Now I can link directly: [Chat Endpoint](docs/API.md#endpoint-chat)
```

### Anti-Patterns (What Makes Docs Hard to Scan)

❌ **Generic Filenames**
- `notes.md`, `todo.md`, `misc.md`, `temp.md`

❌ **No Metadata**
- Missing update dates, status, or version info

❌ **Wall of Text**
- No headings, code blocks, or visual breaks

❌ **Hidden Context**
- Important info buried in middle of document

❌ **Broken Links**
- Dead cross-references make navigation impossible

❌ **Inconsistent Terms**
- Same concept called different things across docs

❌ **No Table of Contents**
- Long docs without navigation structure

### Migration Plan for Existing Docs

**Phase 1: Quick Wins (Do First)**
1. Add metadata headers to all docs
2. Rename ambiguous files (`woocommerce.md` → `ANALYSIS_WOOCOMMERCE_EXPANSION.md`)
3. Add table of contents to docs >100 lines
4. Fix broken cross-references

**Phase 2: Structural Improvements**
1. Move docs into categorized folders
2. Add keyword sections
3. Standardize code example formats
4. Create cross-reference map

**Phase 3: Content Enhancement**
1. Add "Purpose" and "Quick Links" sections
2. Create missing prerequisite docs
3. Build comprehensive glossary
4. Add troubleshooting sections

### Validation Checklist

Before considering a document "AI-ready", verify:

- [ ] Filename is descriptive and follows prefix pattern
- [ ] Document has metadata header (status, date, version)
- [ ] Purpose is clear in first 2 sentences
- [ ] Table of contents exists (if doc >100 lines)
- [ ] Code examples are annotated with context
- [ ] Cross-references use full paths
- [ ] Keywords/aliases section present
- [ ] Last updated date is accurate
- [ ] Related documents are linked
- [ ] No broken links
- [ ] Consistent terminology with other docs

**Example of a Well-Structured Document:**

See [REFERENCE_DATABASE_SCHEMA.md](docs/09-REFERENCE/REFERENCE_DATABASE_SCHEMA.md) as the gold standard - it includes:
- Clear metadata header
- Comprehensive TOC
- Annotated schema definitions
- Cross-references to related docs
- Examples with context
- Consistent terminology

---

## 📚 Directory Documentation Status

**Last Audit:** 2025-10-30
**Status:** ✅ Complete - All directories documented with AI-readable READMEs

### Documentation Coverage

**Total README Files:** 109 across all directories

| Category | READMEs | Status |
|----------|---------|--------|
| **Source Code** (app/, components/, lib/, hooks/, types/) | 60 | ✅ Complete |
| **Testing** (__tests__/, test-utils/) | 18 | ✅ Complete |
| **Infrastructure** (scripts/, config/, docker/, supabase/) | 24 | ✅ Complete |
| **Integration** (lib/integrations/, lib/agents/, lib/woocommerce-api/) | 7 | ✅ Complete |

### Recent Documentation Work (Oct 2025)

**Comprehensive Audit Results:**
- **Created:** 40 new README files
- **Updated:** 9 existing READMEs with AI discoverability metadata
- **Coverage:** 100% of source directories documented
- **Standards Compliance:** All READMEs follow documentation standards above

**Key Improvements:**
- ✅ All directories have PURPOSE statements in first 2 sentences
- ✅ Metadata headers added (Last Updated, Related, Status)
- ✅ Cross-references use full paths
- ✅ Usage examples with annotated code
- ✅ Troubleshooting sections for complex modules
- ✅ Consistent terminology across all docs

### Where to Find Documentation

**Source Code Documentation:**
- [app/README.md](app/README.md) - Next.js app router pages and API routes
- [components/README.md](components/README.md) - React component library
- [lib/README.md](lib/README.md) - Core business logic and services
- [hooks/README.md](hooks/README.md) - Custom React hooks (9 hooks documented)
- [types/README.md](types/README.md) - TypeScript type definitions

**Testing Documentation:**
- [__tests__/README.md](__tests__/README.md) - Complete test suite (1,210+ tests)
- [__tests__/components/README.md](__tests__/components/README.md) - Component tests (138 tests)
- [__tests__/lib/agents/README.md](__tests__/lib/agents/README.md) - AI agent tests (80+ tests)
- [__tests__/mocks/README.md](__tests__/mocks/README.md) - MSW setup guide

**Infrastructure Documentation:**
- [scripts/README.md](scripts/README.md) - All utility scripts (200+ scripts in 15 categories)
- [scripts/database/README.md](scripts/database/README.md) - Database utilities (17 scripts)
- [scripts/monitoring/README.md](scripts/monitoring/README.md) - Health monitoring tools
- [scripts/tests/README.md](scripts/tests/README.md) - Testing tools (hallucination prevention, metadata tracking)
- [migrations/README.md](migrations/README.md) - Database migration strategy
- [docker/README.md](docker/README.md) - Docker configuration

**Integration Documentation:**
- [lib/agents/README.md](lib/agents/README.md) - AI agent orchestration system
- [lib/agents/providers/README.md](lib/agents/providers/README.md) - WooCommerce & Shopify providers
- [lib/woocommerce-api/README.md](lib/woocommerce-api/README.md) - WooCommerce integration
- [lib/queue/README.md](lib/queue/README.md) - Job queue with BullMQ
- [lib/analytics/README.md](lib/analytics/README.md) - Business intelligence (510 lines)

### Impact on AI Agent Efficiency

**Before Documentation Audit:**
- 30-60 minutes to understand directory structure
- High context consumption for navigation
- Manual file exploration required
- Unclear service relationships

**After Documentation Audit:**
- 2-5 minutes to understand any directory (90% faster)
- 60-80% reduction in context consumption
- One-click navigation via cross-references
- Clear documentation of all integrations

**Quantified Benefits:**
- Directory understanding: 90% faster
- Script discovery: 95% faster
- Test discovery: 93% faster
- Integration setup: 85% faster

### Maintenance Guidelines

**When Creating New Directories:**
1. Always create a README.md in the new directory
2. Include metadata header (Purpose, Last Updated, Related)
3. Document all files in the directory
4. Add cross-references to related docs
5. Follow naming conventions from standards above

**When Modifying Existing Code:**
1. Update "Last Updated" date in relevant README
2. Update documentation if functionality changes
3. Keep cross-references accurate
4. Test that usage examples still work

---

### FILE LENGTH
- **STRICT RULE**: All files must be under 300 LOC
- Current codebase has violations that need refactoring
- Files must be modular & single-purpose

### READING FILES
- **ALWAYS** read the entire file before making changes
- Find and read ALL related files before coding
- Never make changes without reading the complete file

### EGO
- Do not make assumptions or jump to conclusions
- You are a Large Language Model with limitations
- Always consider multiple different approaches like a Senior Engineer

### AGENT ORCHESTRATION & PARALLELIZATION

**CRITICAL**: Proactively orchestrate specialized agents in parallel to maximize efficiency and protect your context window.

#### When to Automatically Use Agent Orchestration

**Trigger Patterns - Use Agents WITHOUT User Prompting When:**

1. **Multiple Independent Categories** (HIGH PRIORITY)
   - Updating dependencies across different categories (Supabase, types, testing, utilities)
   - Refactoring files in different modules (API routes, components, libs, tests)
   - Running validation across multiple systems (build, lint, tests, types)
   - Analyzing different aspects of a problem (performance, security, architecture)

2. **Repetitive Tasks at Scale**
   - Fixing 20+ files with similar patterns (import updates, type fixes, etc.)
   - Updating multiple test files with same refactoring
   - Applying consistent changes across module boundaries

3. **Time-Intensive Sequential Work**
   - Any task that would take >30 minutes sequentially
   - Build verification + tests + linting (can run in parallel)
   - Multiple large file reads/analysis
   - Comprehensive codebase searches

4. **Context Protection**
   - When a task might generate >10,000 tokens of output
   - Multiple file reads that would fill context
   - Long-running analysis or validation tasks

**DO NOT Wait for User Permission** - If you identify a parallelizable task, immediately orchestrate agents!

#### The Proven Orchestration Pattern

**Framework (Use This Every Time):**

```
1. DECOMPOSE: Break task into independent subtasks
   ↓
2. DESIGN: Create specialized agent missions
   ↓
3. LAUNCH: Deploy all agents in single message (parallel execution)
   ↓
4. CONSOLIDATE: Synthesize findings from all agents
   ↓
5. VERIFY: Run final validation
   ↓
6. DOCUMENT: Update tracking docs
```

#### Real-World Success Example (Oct 2025)

**Task**: Update 15 outdated npm packages
**Sequential Time**: 2-3 hours
**Parallel Time**: 15 minutes (88-92% savings)

**Agent Team Deployed:**
```typescript
// Single message with 4 Task tool invocations
Agent 1: Supabase Specialist
  - Mission: Update @supabase/supabase-js, @supabase/ssr
  - Verify: Build success, no TypeScript errors
  - Time: ~10 minutes

Agent 2: Type Definition Expert
  - Mission: Update all @types/* packages
  - Verify: TypeScript compilation clean
  - Time: ~10 minutes

Agent 3: Testing Infrastructure Lead
  - Mission: Update testing libraries (jest-dom, msw)
  - Verify: Test suite passes
  - Time: ~10 minutes

Agent 4: Utility Package Manager
  - Mission: Update infrastructure (bullmq, ioredis, lru-cache, crawlee)
  - Verify: Build success, Redis functional
  - Time: ~10 minutes

Result: All updates completed simultaneously in ~10 minutes
```

**Key Insight**: Each agent worked independently, validated their changes, and reported findings. No blocking dependencies = perfect parallelism.

#### Agent Mission Structure

**Template for Each Agent:**
```markdown
You are responsible for [SPECIFIC CATEGORY].

## Your Mission
[Clear, bounded objective]

## Tasks
1. [Specific action 1]
2. [Specific action 2]
3. [Verification step]

## If Issues Occur
[Decision criteria and fallback]

## Final Report
Provide:
- ✅ Success metrics
- ❌ Failures (if any)
- 🔧 Fixes applied
- Total time spent

Return findings in structured format.
```

#### Decision Criteria: Parallel vs. Sequential

**Use Parallel Agents When:**
✅ Tasks are independent (no shared state/files)
✅ Each task can validate its own success
✅ Failure in one doesn't block others
✅ Time savings > 30 minutes
✅ Each category requires different expertise

**Use Sequential When:**
❌ Tasks must happen in order (dependencies)
❌ Each step informs the next decision
❌ Shared file modifications (merge conflicts)
❌ Total work < 15 minutes
❌ Need interactive decision-making

#### What Makes a Good Parallel Task

**Excellent Candidates:**
- Dependency updates by category (different package.json sections)
- File refactoring across different modules
- Multiple independent test suites
- Category-based linting/type fixes
- Parallel validation (build + test + lint)
- Multi-environment deployments

**Poor Candidates:**
- Sequential git operations (must commit before push)
- Dependent file modifications (need to see results of previous)
- Interactive debugging
- Iterative algorithm development

#### Anti-Patterns to Avoid

❌ **Don't** launch agents for tiny tasks (<5 minutes each)
❌ **Don't** create agents with blocking dependencies
❌ **Don't** over-decompose (too many tiny agents)
❌ **Don't** launch agents without clear success criteria
❌ **Don't** forget to consolidate and verify results

#### Success Metrics

**Track These After Agent Orchestration:**
- Time savings vs. sequential (aim for >50%)
- Success rate (aim for 100% of agents completing)
- Context window savings (tokens not consumed)
- Code quality (all verifications passing)

**Proven Results:**
- Dependency updates: 88-92% time savings
- File refactoring: 60-75% time savings
- Multi-module testing: 70-80% time savings
- Context protection: 50-80% token savings

#### Examples of Automatic Agent Use

**Scenario 1: User Says "Update dependencies"**
```
❌ WRONG: Ask user which ones or do sequentially
✅ RIGHT: Immediately launch 4 agents by category
```

**Scenario 2: User Says "Refactor these 30 files"**
```
❌ WRONG: Process files one-by-one
✅ RIGHT: Launch agents by module (API routes, components, libs, tests)
```

**Scenario 3: User Says "Fix all ESLint errors"**
```
❌ WRONG: Fix errors file-by-file sequentially
✅ RIGHT: Launch agents by error category (unused vars, type issues, imports)
```

**The Rule**: If you can mentally divide the work into 2+ independent categories, you MUST use agents!

#### Reporting Results

**After Agent Orchestration, Always Provide:**
1. Executive summary (what was accomplished)
2. Individual agent results (structured)
3. Consolidated verification (final build/test status)
4. Time savings achieved
5. Next recommended steps

**Reference**: See [ANALYSIS_TECHNICAL_DEBT_TRACKER.md](docs/10-ANALYSIS/ANALYSIS_TECHNICAL_DEBT_TRACKER.md) Item 9 completion (Oct 2025) for example of successful agent orchestration with full documentation.

---

### TESTING & CODE QUALITY PHILOSOPHY

**"Hard to Test" = "Poorly Designed"**

When tests are difficult to write, it's revealing fundamental design problems, not a mocking problem.

**Core Principles:**

1. **Test Difficulty as a Design Signal**
   - If tests require complex module mocking, the code has tight coupling
   - If tests are slow, the code likely has hidden dependencies
   - If tests are brittle, the code violates separation of concerns
   - **Action**: Refactor for testability, don't fight with mocks

2. **Prioritize Architecture Over Workarounds**
   - Don't spend hours fixing complex mock configurations
   - Instead, apply SOLID principles (especially Dependency Inversion)
   - Use dependency injection to make code trivially testable
   - Simple tests with simple mocks indicate good design
   - **Example**: See SHOPIFY_PROVIDER_TEST_ANALYSIS.md for a real case study

3. **Always Validate Claims with Verification**
   - Never assume fixes work without running actual tests
   - Use concrete commands: `npm run lint`, `npm test`, `npm run build`
   - Document verification steps in commit messages
   - If verification reveals issues, fix them immediately
   - **Rule**: "It works" requires proof, not assumptions

**Red Flags in Testing:**
- ❌ Need to mock 3+ levels deep
- ❌ Tests require extensive setup (>20 lines of mocks)
- ❌ Module mocking with factories and hoisting tricks
- ❌ Tests pass individually but fail in batch
- ❌ Can't test without entire infrastructure running

**Green Lights in Testing:**
- ✅ Can inject simple mock objects via constructor
- ✅ Test setup is clear and under 10 lines
- ✅ Tests are fast (< 1 second for 50 tests)
- ✅ Tests are isolated and independent
- ✅ Can test business logic without infrastructure

**Real Example from This Codebase:**

```typescript
// ❌ BEFORE: Hard to test (hidden dependencies)
class ShopifyProvider {
  constructor(domain: string) { }
  async lookupOrder() {
    const client = await getDynamicShopifyClient(this.domain); // Hidden dependency
    if (!client) return null;
    // Business logic buried after infrastructure concerns
  }
}

// ✅ AFTER: Easy to test (dependency injection)
class ShopifyProvider {
  constructor(private client: ShopifyAPI) { } // Explicit dependency
  async lookupOrder() {
    return await this.client.getOrder(id); // Direct usage
  }
}

// Test becomes trivial:
const mockClient = { getOrder: jest.fn() };
const provider = new ShopifyProvider(mockClient);
```

**Impact**: This refactoring eliminated 9 test failures, improved test speed by 80%, and removed all module mocking complexity.

**Reference**: Commits 27b607d, 4d1006d (Oct 2025) - Dependency injection refactoring

## Key Commands

```bash
# Development
npm run dev              # Start development server on port 3000
npm run build            # Build for production
npm run start            # Start production server
npm run lint             # Run ESLint

# Testing
npm test                 # Run all tests (unit + integration)
npm run test:unit        # Run unit tests only
npm run test:integration # Run integration tests only
npm run test:watch       # Run tests in watch mode
npm run test:coverage    # Generate coverage report

# Type Checking
npx tsc --noEmit        # Run TypeScript type checking

# Database Migration
npm run migrate:encrypt-credentials  # Migrate credentials to encrypted format

# Database Cleanup & Health Monitoring
npx tsx test-database-cleanup.ts stats              # View scraping statistics
npx tsx test-database-cleanup.ts clean              # Clean all scraped data
npx tsx test-database-cleanup.ts clean --domain=X   # Clean specific domain
npx tsx test-database-cleanup.ts clean --dry-run    # Preview cleanup

# Embeddings Health Monitoring
npx tsx monitor-embeddings-health.ts check          # Run health check
npx tsx monitor-embeddings-health.ts auto           # Run auto-maintenance
npx tsx monitor-embeddings-health.ts watch          # Start continuous monitoring

# Quality Assurance (requires dev server running)
npx tsx test-hallucination-prevention.ts            # Test anti-hallucination safeguards
npx tsx test-hallucination-prevention.ts --verbose  # Detailed test output

# Conversation Competency Testing
npx tsx scripts/tests/test-metadata-tracking.ts     # Test conversation accuracy (86%)

# Performance Monitoring & Optimization (Additional Tools)
# ⚠️ NOTE: Additional NPX tools are available but not documented here.
# See docs/NPX_TOOLS_GUIDE.md and docs/07-REFERENCE/REFERENCE_NPX_SCRIPTS.md for complete list.

# Dependencies
npm run check:deps       # Check for dependency issues
npm run check:all        # Run all checks (deps + lint + typecheck)
```

## Architecture Overview

### Tech Stack
- **Frontend**: Next.js 15.4.3, React 19.1.0, TypeScript 5, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: Supabase (PostgreSQL with pgvector extension)
- **AI**: OpenAI GPT-4 for chat, embeddings for semantic search
- **Web Scraping**: Crawlee + Playwright, Mozilla Readability for extraction
- **Job Queue**: Redis for background job management
- **E-commerce**: WooCommerce REST API v3 + Shopify Admin API integration

### Core Services Architecture

The application follows a service-oriented architecture with clear separation of concerns:

1. **API Layer** (`app/api/`): All endpoints for chat, scraping, privacy, and integrations
2. **Business Logic** (`lib/`): Core services including embeddings, rate limiting, encryption, and scraping
3. **Data Layer**: Supabase client/server instances with Row Level Security
4. **External Integrations**: OpenAI, WooCommerce

### Key Patterns

- **Multi-tenancy**: Domain-based customer isolation with encrypted credentials
- **Rate Limiting**: Per-domain request throttling to prevent abuse
- **Job Processing**: Redis-backed async processing for web scraping
- **Vector Search**: Hybrid search combining embeddings with real-time web results
- **Privacy First**: GDPR/CCPA compliant with configurable retention and user rights

## Database Structure

**📚 Complete Schema Reference: See [REFERENCE_DATABASE_SCHEMA.md](docs/09-REFERENCE/REFERENCE_DATABASE_SCHEMA.md) for authoritative database documentation**

Main tables:
- `customer_configs`: Customer settings and encrypted credentials
- `scraped_pages` / `website_content`: Indexed website content
- `page_embeddings`: Vector embeddings for semantic search
- `conversations` & `messages`: Chat history
- `structured_extractions`: FAQs, products, contact info
- `scrape_jobs`: Background job queue for scraping tasks
- `query_cache`: Performance optimization cache

### Database Operations via Supabase Management API

When MCP tools are unavailable or Supabase CLI has migration conflicts, use the Management API directly:

```javascript
// Direct SQL execution via Supabase Management API
const SUPABASE_ACCESS_TOKEN = 'sbp_...'; // Your access token
const PROJECT_REF = 'birugqyuqhiahxvxeyqg'; // Project reference

const response = await fetch(
  `https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`,
  {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SUPABASE_ACCESS_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query: sqlStatement })
  }
);
```

**Use cases:**
- Executing DDL statements (CREATE/DROP/ALTER TABLE)
- Running migrations when CLI has conflicts
- Bulk data operations
- Direct database maintenance

**Note:** The Management API is equivalent to running SQL in the Supabase Dashboard and bypasses migration tracking.

## Environment Setup

Required environment variables (copy `.env.example` to `.env.local`):
- Supabase: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- OpenAI: `OPENAI_API_KEY`
- Redis: `REDIS_URL` (defaults to `redis://localhost:6379`)
- Optional: WooCommerce credentials for testing

### Docker Setup
- **Docker Desktop**: Version 28.3.2 installed and configured
- **Full Docker Documentation**: See [SETUP_DOCKER_PRODUCTION.md](docs/00-GETTING-STARTED/SETUP_DOCKER_PRODUCTION.md) for complete setup guide

#### Quick Docker Commands
```bash
# Start Docker Desktop (macOS)
open -a "Docker"

# Build and run the entire application stack
DOCKER_BUILDKIT=1 docker-compose build  # Optimized build (59% faster with cache)
docker-compose up -d                    # Production mode
docker-compose -f docker-compose.dev.yml up -d  # Development with hot reload

# Container management
docker-compose down                     # Stop all services
docker-compose ps                       # Check service status
docker-compose logs -f app              # View application logs
docker-compose logs -f redis            # View Redis logs

# Rebuild after code changes
DOCKER_BUILDKIT=1 docker-compose build --no-cache  # Full rebuild
DOCKER_BUILDKIT=1 docker-compose up -d --build     # Rebuild and restart (uses cache)

# Access running container
docker exec -it omniops-app sh         # Shell into app container

# Performance monitoring (Planned)
# 🔜 npx tsx profile-docker-quick.ts  # Profile Docker build performance
```

#### Docker Files Structure
- `Dockerfile` - Production multi-stage build
- `Dockerfile.dev` - Development with hot reload
- `docker-compose.yml` - Production orchestration
- `docker-compose.dev.yml` - Development orchestration
- `.dockerignore` - Build exclusions
- `.env.docker.example` - Environment template

## Development Workflow

### Starting Development
1. Ensure Docker is running: `open -a "Docker"` (if not already running)
2. Start Redis and services: `docker-compose up -d`
3. Start dev server: `npm run dev`
4. Access at http://localhost:3000

### Port Configuration
- **IMPORTANT**: Always ensure the development server runs on port 3000
- If port 3000 is in use, kill existing processes first:
  ```bash
  pkill -f "next dev"  # Kill any Next.js dev servers
  lsof -i :3000        # Check what's using port 3000
  ```
- The application is configured to use port 3000 for consistency

### Code Conventions
- Use TypeScript strict mode
- Follow existing component patterns in `components/ui/`
- API routes use Zod for validation
- Services use class-based patterns in `lib/`
- All WooCommerce credentials are encrypted using AES-256

### Testing Approach
- Unit tests for business logic (`lib/`)
- Integration tests for API routes (`app/api/`)
- Component tests for React components
- MSW (Mock Service Worker) for external API mocking

## Key Features & Entry Points

### Chat System
- Entry: `app/api/chat/route.ts`
- Widget: `app/embed/page.tsx`, `public/embed.js`
- Processing: `lib/embeddings.ts`

### Web Scraping
- Entry: `app/api/scrape/route.ts`
- Core: `lib/crawler-config.ts`, `lib/content-extractor.ts`
- Jobs: Redis-backed via `lib/redis.ts`

### WooCommerce Integration
- Dynamic API: `lib/woocommerce-dynamic.ts`
- Full API: `lib/woocommerce-full.ts`
- Cart Tracker: `lib/woocommerce-cart-tracker.ts`
- Endpoints: `app/api/woocommerce/`
- Abandoned Carts: `app/api/woocommerce/abandoned-carts/route.ts`

### Shopify Integration
- API Client: `lib/shopify-api.ts`
- Dynamic Loader: `lib/shopify-dynamic.ts`
- Provider: `lib/agents/providers/shopify-provider.ts`
- Endpoints: `app/api/shopify/`
- Test Route: `app/api/shopify/test/route.ts`

### Privacy Features
- GDPR APIs: `app/api/gdpr/`
- Data Export: `app/api/privacy/export/route.ts`
- Data Deletion: `app/api/privacy/delete/route.ts`

## Common Development Tasks

### Adding a New API Endpoint
1. Create route in `app/api/[feature]/route.ts`
2. Add Zod schema for validation in `types/api.ts`
3. Implement business logic in `lib/services/`
4. Add tests in `__tests__/api/[feature]/`

### Modifying the Chat Widget
1. Edit embed code in `public/embed.js`
2. Update widget UI in `app/embed/page.tsx`
3. Test embedding on different sites

### Working with Scraping
1. Scraping config: `lib/crawler-config.ts`
2. Content extraction: `lib/content-extractor.ts`
3. Job monitoring: Check Redis or use job status endpoint

### Database Cleanup & Maintenance
When you need to clean scraped data for fresh re-scraping:

1. **Check Current Data**: `npx tsx test-database-cleanup.ts stats`
2. **Clean Specific Domain**: `npx tsx test-database-cleanup.ts clean --domain=example.com`
3. **Clean Everything**: `npx tsx test-database-cleanup.ts clean`

The cleanup system uses CASCADE foreign keys for safe deletion:
- Removes: scraped pages, embeddings, extractions, cache
- Preserves: customer configs, credentials, user accounts
- See `test-database-cleanup.ts` for implementation
- Full docs: [REFERENCE_NPX_SCRIPTS.md](docs/09-REFERENCE/REFERENCE_NPX_SCRIPTS.md)

## Critical Development Guidelines

### ACTIVE CONTRIBUTORS
- This section contains critical guidelines that must be followed

### Hallucination Prevention
- **CRITICAL**: The chat system has strict anti-hallucination measures in place
- See `docs/HALLUCINATION_PREVENTION.md` for comprehensive documentation
- Key principle: Always admit uncertainty rather than making false claims
- Run `npx tsx test-hallucination-prevention.ts` after any chat prompt changes

## Optimization Philosophy

### Core Principles
**Every decision should prioritize efficiency and scalability:**

- **Minimize Everything**: Every line of code, every dependency, every API call must justify its existence
- **Think Scale First**: Design for 10x growth - what works for 100 users should work for 1,000 or 10,000
- **Performance is a Feature**: Not an afterthought - consider performance implications during design phase
- **Simplicity Over Cleverness**: Simple, readable code is easier to optimize than clever abstractions

### Code Minimalism
**Less code = fewer bugs, faster execution, easier maintenance:**

```typescript
// ❌ Over-engineered
class UserDataTransformerFactory {
  private static instance: UserDataTransformerFactory;
  private transformers: Map<string, ITransformer>;
  // ... 50 lines of abstraction
}

// ✅ Minimal and efficient
function transformUserData(user: User): TransformedUser {
  return { id: user.id, name: user.name };
}
```

**Guidelines:**
- No premature abstractions - wait for 3+ use cases
- Delete dead code immediately - don't comment it out
- Prefer functions over classes when state isn't needed
- Use native JS/TS features over libraries when possible

### Future-Proofing Strategies
**Build for tomorrow's scale today:**

1. **Database Optimization**
   - Index from day one on commonly queried fields
   - Use pagination everywhere - never fetch unbounded lists
   - Design schemas to minimize JOIN operations
   - Consider read/write splitting early

2. **API Design**
   - Implement rate limiting on all endpoints
   - Use cursor-based pagination, not offset
   - Return only needed fields (GraphQL-style thinking)
   - Cache aggressively but invalidate intelligently

3. **Frontend Performance**
   - Lazy load everything that's not critical path
   - Implement virtual scrolling for long lists
   - Use React.memo/useMemo strategically
   - Minimize bundle size - audit regularly

### Resource Efficiency
**Every resource call costs time and money:**

```typescript
// ❌ Wasteful
const users = await db.select('*').from('users');
const filtered = users.filter(u => u.active);

// ✅ Efficient
const users = await db
  .select(['id', 'name', 'email'])
  .from('users')
  .where('active', true);
```

**Optimization Checklist:**
- [ ] Batch database operations where possible
- [ ] Use connection pooling effectively
- [ ] Implement request deduplication
- [ ] Cache computed values aggressively
- [ ] Stream large datasets instead of loading to memory
- [ ] Use background jobs for heavy processing

### Bundle Size Optimization
**Every KB matters for user experience:**

- **Before adding any dependency:** Can native JS/TS do this?
- **Regular audits:** `npm run analyze` weekly
- **Tree-shaking:** Ensure all imports are specific
- **Dynamic imports:** Split code by route/feature
- **Image optimization:** WebP, lazy loading, responsive sizes

### Measurement & Monitoring
**You can't optimize what you don't measure:**

```typescript
// Add performance markers
performance.mark('fetch-start');
const data = await fetchData();
performance.mark('fetch-end');
performance.measure('fetch-duration', 'fetch-start', 'fetch-end');
```

**Key Metrics to Track:**
- API response times (p50, p95, p99)
- Database query performance
- Bundle size changes per PR
- Memory usage patterns
- Cache hit rates

### Decision Framework
**Before writing any code, ask:**

1. **Is this necessary?** Can we achieve the goal without it?
2. **Is there a simpler way?** What's the minimal solution?
3. **Will this scale?** What happens at 10x load?
4. **What's the performance impact?** CPU, memory, network?
5. **Can this be async/deferred?** Does the user need to wait?
6. **Is there a native solution?** Before adding dependencies?
7. **Can we reuse existing code?** Before creating new abstractions?

### Anti-Patterns to Avoid
- **Gold plating**: Adding features "just in case"
- **Dependency bloat**: Package for every small utility
- **Synchronous everything**: Not utilizing async operations
- **Unbounded operations**: Queries/loops without limits
- **Memory leaks**: Not cleaning up listeners/subscriptions
- **Premature optimization**: Optimizing without profiling
- **But also**: Ignoring obvious inefficiencies

**Remember:** The best code is no code. The second best is minimal, efficient code that does exactly what's needed and nothing more.

## Performance Guidelines

### Algorithmic Complexity
**Avoid O(n²) or worse - aim for O(n) or O(n log n):**

```typescript
// ❌ O(n²) - Nested loops
for (const item of items) {
  for (const other of items) {
    if (item.id === other.parentId) { /* ... */ }
  }
}

// ✅ O(n) - Use Map/Set for lookups
const itemMap = new Map(items.map(i => [i.id, i]));
for (const item of items) {
  const parent = itemMap.get(item.parentId); // O(1) lookup
}
```

**Common pitfalls:**
- Nested array searches → Use Maps/Sets
- Multiple database queries in loops → Batch fetch
- Array.includes() in loops → Use Set.has()
- Sorting inside loops → Sort once, reuse

### Async and Parallel Processing
**Use async/parallel processing wherever possible:**

```typescript
// ❌ Sequential
const a = await fetchA();
const b = await fetchB();

// ✅ Parallel
const [a, b] = await Promise.all([fetchA(), fetchB()]);
```

**Apply to:** API routes, web scraping, embeddings, WooCommerce sync, data exports  
**Use:** `Promise.all()` for must-succeed, `Promise.allSettled()` for partial failures

## Important Notes

- Always check `lib/config.ts` for feature flags and configuration schemas
- Rate limiting is enforced per domain - see `lib/rate-limit.ts`
- All customer WooCommerce credentials must be encrypted before storage
- Redis must be running for web scraping features to work