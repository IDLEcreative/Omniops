**Last Updated:** 2025-11-09 (Added "Create Comprehensive Tests with Agents" guideline)
**Verified Accurate For:** v0.1.0

# CLAUDE.md

**AI Assistant Instructions for Omniops Codebase**

**📊 Metadata:**
- **Last Updated:** 2025-11-09
- **Version:** v0.1.0
- **File Purpose:** Primary instruction set for Claude Code AI assistant
- **Critical Sections:** Lines 6-165 (brand-agnostic, file placement, agents), 785-1044 (fix issues, create tests)
- **Total MUST/NEVER Rules:** 52 directives
- **Line Count:** ~1,700 lines
- **Estimated Parse Time:** 30 seconds

**⚡ Quick Navigation:**
- [🚨 Critical Rules Index](#-critical-rules-index) - All MUST/NEVER/ALWAYS directives
- [⚡ Trigger Index](#-trigger-index-auto-actions) - When to auto-deploy agents
- [📚 Pattern Library](#-pattern-library-quick-reference) - Code examples (right vs wrong)
- [📊 Decision Matrices](#-decision-matrices) - Quick reference tables
- [🔍 Search Keywords](#-search-keywords-map) - Fast grep/search guide

---

## 🚨 Critical Rules Index

**MUST Rules (Required Actions):**
1. **[Line 10-17]** NEVER hardcode: company names, products, industries, domains, URLs, emails
2. **[Line 68]** NEVER create files in root (only config files allowed)
3. **[Line 729]** Files MUST be under 300 LOC - refactor if exceeded
4. **[Line 734]** ALWAYS read entire file before making any changes
5. **[Line 783]** Deploy agents immediately for parallelizable tasks (no user permission needed)
6. **[Line 787]** Deploy agent immediately when encountering ANY issue
7. **[Line 879]** Deploy testing agent immediately after completing any code
8. **[Line 1152]** ALWAYS validate fixes with actual commands (`npm test`, `npm run build`)

**NEVER Rules (Prohibited Actions):**
1. **[Line 10-17]** NEVER hardcode brand-specific data (Thompson's, pumps, etc.) in production code
2. **[Line 68]** NEVER create files directly in root directory
3. **[Line 815]** NEVER defer issue fixes - deploy agent immediately
4. **[Line 985]** NEVER complete code without creating comprehensive tests
5. **[Line 1159]** NEVER mock 3+ levels deep - refactor for dependency injection instead
6. **[Line 1509]** NEVER add dependencies without checking native JS/TS alternatives

**ALWAYS Rules (Required Behaviors):**
1. **[Line 734]** ALWAYS read complete file before editing
2. **[Line 740]** ALWAYS consider multiple approaches like a Senior Engineer
3. **[Line 787-799]** ALWAYS deploy agent immediately for: test failures, build errors, linting, imports, type errors
4. **[Line 879-892]** ALWAYS deploy testing agent after: new features, bug fixes, refactors, API endpoints, components
5. **[Line 1060]** ALWAYS use standardized agent prompt templates
6. **[Line 1152]** ALWAYS validate with concrete commands, never assume fixes work

**Auto-Trigger Rules (Do Without User Permission):**
1. **[Line 759-782]** Auto-deploy parallel agents for: 2+ independent categories, 20+ files, >30min tasks, >10K tokens
2. **[Line 787-799]** Auto-deploy fix agents for: test failures, build errors, TypeScript errors, imports, linting, security
3. **[Line 879-892]** Auto-deploy testing agents for: completed features, bug fixes, refactors, new endpoints, new components
4. **[Line 920-936]** Auto-deploy for: dependency updates, file refactoring, ESLint fixes

→ **Full details:** [Brand-Agnostic](#-critical-brand-agnostic-application) | [File Placement](#-critical-file-placement-rules) | [Fix Issues](#fix-issues-immediately-with-agents) | [Create Tests](#create-comprehensive-tests-with-agents-after-code-completion)

---

## ⚡ Trigger Index (Auto-Actions)

**Format:** `TRIGGER → ACTION (no user permission needed)`

### Issue Triggers (Fix Immediately)
```
Test failure detected        → Deploy the-fixer agent (line 830)
Build error detected         → Deploy the-fixer agent (line 833)
TypeScript error detected    → Deploy the-fixer agent (line 833)
Import error detected        → Deploy the-fixer agent (line 825)
Linting violation detected   → Deploy the-fixer agent (line 792)
Security issue detected      → Deploy the-fixer agent (line 837)
Dead code found              → Deploy the-fixer agent (line 841)
Performance issue (O(n²))    → Deploy performance-profiler agent (line 795)
```

### Code Completion Triggers (Test Immediately)
```
New feature completed        → Deploy code-quality-validator agent (line 892)
Bug fix applied              → Deploy code-quality-validator agent (line 894)
Refactoring finished         → Deploy code-quality-validator agent (line 895)
API endpoint created         → Deploy code-quality-validator agent (line 896)
Component built              → Deploy code-quality-validator agent (line 897)
Utility function added       → Deploy code-quality-validator agent (line 898)
Database migration done      → Deploy code-quality-validator agent (line 899)
```

### Parallelization Triggers (Multi-Agent Deploy)
```
2+ independent categories    → Deploy parallel agents (line 761)
20+ files to modify          → Deploy parallel agents (line 768)
>30 min sequential work      → Deploy parallel agents (line 773)
>10K token output expected   → Deploy parallel agents (line 779)
Dependency updates needed    → Deploy parallel agents by category (line 1013)
```

### Code Quality Triggers (Refactor Immediately)
```
File exceeds 300 LOC         → Refactor into smaller modules (line 729)
Mock >3 levels deep          → Refactor for dependency injection (line 1159)
Test setup >20 lines         → Refactor architecture (line 1160)
O(n²) algorithm detected     → Optimize to O(n) or O(n log n) (line 1516-1623)
Hidden dependencies found    → Extract to explicit constructor params (line 1175-1196)
```

→ **Full trigger details:** [Fix Issues Immediately](#fix-issues-immediately-with-agents) | [Create Tests](#create-comprehensive-tests-with-agents-after-code-completion) | [Agent Orchestration](#agent-orchestration--parallelization)

---

## 📚 Pattern Library (Quick Reference)

### Brand-Agnostic Patterns
```typescript
// ❌ WRONG: Hardcoded business logic
if (product.type === 'pump') { /* ... */ }
if (domain.includes('thompson')) { /* ... */ }
const defaultCategory = 'hydraulic-parts';

// ✅ RIGHT: Dynamic business logic from database
if (product.type === customer.config.primaryProductType) { /* ... */ }
if (customer.settings.specialHandling) { /* ... */ }
const defaultCategory = customer.config.defaultCategory;
```

### File Placement Patterns
```typescript
// ❌ WRONG: Files in root
Write('test-checkout-flow.ts', content)
Write('apply-migration.ts', content)
Write('IMPLEMENTATION_REPORT.md', content)

// ✅ RIGHT: Files in proper locations
Write('__tests__/integration/test-checkout-flow.ts', content)
Write('scripts/database/apply-migration.ts', content)
Write('ARCHIVE/completion-reports-2025-11/IMPLEMENTATION_REPORT.md', content)
```

### Agent Deployment Patterns
```typescript
// ❌ WRONG: Defer issues or ask user
"I found 5 test failures. Should I fix them?"
"There are TypeScript errors. Let me note them and continue..."

// ✅ RIGHT: Deploy agent immediately
"I found 5 test failures. Deploying the-fixer agent now."
Task({
  subagent_type: 'the-fixer',
  description: 'Fix 5 test failures',
  prompt: 'Fix test failures in: test1.ts, test2.ts...'
})
```

### Testing Patterns
```typescript
// ❌ WRONG: Complete feature without tests
function newFeature() { /* implementation */ }
// Move on to next task...

// ✅ RIGHT: Complete feature, then deploy testing agent
function newFeature() { /* implementation */ }
Task({
  subagent_type: 'code-quality-validator',
  description: 'Create comprehensive tests',
  prompt: 'Create test suite for newFeature() with 90%+ coverage...'
})
```

### Dependency Injection Patterns
```typescript
// ❌ WRONG: Hidden dependencies (hard to test)
class ShopifyProvider {
  constructor(domain: string) {}
  async fetch() {
    const client = await getDynamicClient(this.domain); // Hidden!
    return client.get();
  }
}

// ✅ RIGHT: Explicit dependencies (easy to test)
class ShopifyProvider {
  constructor(private client: ShopifyAPI) {} // Explicit!
  async fetch() {
    return this.client.get();
  }
}

// Test becomes trivial:
const mockClient = { get: jest.fn() };
const provider = new ShopifyProvider(mockClient);
```

### Performance Patterns
```typescript
// ❌ WRONG: O(n²) nested loops
for (const item of items) {
  for (const other of items) {
    if (item.id === other.parentId) { /* ... */ }
  }
}

// ✅ RIGHT: O(n) with Map/Set
const itemMap = new Map(items.map(i => [i.id, i]));
for (const item of items) {
  const parent = itemMap.get(item.parentId); // O(1) lookup
}
```

→ **More patterns:** [Testing Philosophy](#testing--code-quality-philosophy) | [Performance Guidelines](#performance-guidelines) | [Optimization Philosophy](#optimization-philosophy)

---

## 📊 Decision Matrices

### File Placement Matrix
| File Type | Example | Root? | Destination |
|-----------|---------|-------|-------------|
| Test script | `test-*.ts`, `verify-*.ts` | ❌ NO | `__tests__/[category]/` |
| Utility script | `apply-*.ts`, `check-*.ts` | ❌ NO | `scripts/[category]/` |
| SQL script | `*.sql` | ❌ NO | `scripts/sql/[category]/` |
| Completion report | `*_REPORT.md`, `*_SUMMARY.md` | ❌ NO | `ARCHIVE/completion-reports-[date]/` |
| Test output | `*.json` (results) | ❌ NO | `ARCHIVE/test-results/` |
| Log file | `*.log` | ❌ NO | `logs/[category]/` |
| Documentation | `*.md` (guides) | ❌ NO | `docs/[category]/` |
| Config file | `package.json`, `tsconfig.json` | ✅ YES | `/` (root only) |

### Agent Deployment Decision Matrix
| Scenario | Independent? | Time Est | Deploy Agent? | Agent Type |
|----------|--------------|----------|---------------|------------|
| Update 15 dependencies | ✅ 4 categories | 2-3h | ✅ YES | 4 parallel agents by category |
| Fix single failing test | ❌ 1 test | <5min | ❌ NO | Do directly |
| Refactor 30+ files | ✅ 3 modules | 1-2h | ✅ YES | 3 parallel agents by module |
| Fix import error | ✅ 1 file | 2min | ✅ YES | the-fixer (immediate) |
| Build + test + lint | ✅ 3 tasks | 15min | ✅ YES | 3 parallel agents |
| Create tests for feature | ✅ 1 feature | 20min | ✅ YES | code-quality-validator (auto) |

### Testing Strategy Matrix
| Mock Complexity | Test Setup Lines | Test Speed | Action Required |
|----------------|------------------|------------|-----------------|
| 3+ levels deep | >20 lines | Slow (>5s) | 🔧 Refactor for dependency injection |
| 2 levels | 10-20 lines | Medium (2-5s) | ⚠️ Consider simplification |
| 1 level (constructor) | <10 lines | Fast (<1s) | ✅ Good design |
| No mocking needed | <5 lines | Fast (<1s) | ✅ Excellent design |

### Performance Optimization Matrix
| Complexity | Example | Action | Target |
|------------|---------|--------|--------|
| O(n²) or worse | Nested loops | 🔴 Refactor immediately | O(n) or O(n log n) |
| O(n log n) | Sorting | ✅ Acceptable | Maintain |
| O(n) | Single loop with Map | ✅ Good | Maintain |
| O(1) | Direct lookup | ✅ Excellent | Maintain |

---

## 🔍 Search Keywords Map

**To find rules about specific topics, grep/search for these terms:**

| Topic | Search Terms | Jump To |
|-------|-------------|---------|
| **Brand-Agnostic** | "HARDCODING", "multi-tenant", "Thompson", "pumps" | [#brand-agnostic](#-critical-brand-agnostic-application) |
| **File Placement** | "root directory", "NEVER create files", "Decision Tree" | [#file-placement](#-critical-file-placement-rules) |
| **Agent Deployment** | "Deploy agent", "parallel", "Fix Issues Immediately" | [#fix-issues](#fix-issues-immediately-with-agents) |
| **Testing** | "Hard to Test", "dependency injection", "mock", "Create Tests" | [#testing-philosophy](#testing--code-quality-philosophy) |
| **Performance** | "O(n²)", "algorithmic complexity", "optimization" | [#performance-guidelines](#performance-guidelines) |
| **Security** | "credentials", "encryption", "RLS", "GDPR" | [#security](#security--privacy) |
| **Database** | "Supabase", "migrations", "schema", "pgvector" | [#database-structure](#database-structure) |
| **Agent Templates** | "hallucination", "extrapolation", "verification" | [#preventing-hallucination](#preventing-agent-hallucination--extrapolation) |

**Anchor links for instant jump:**
```
#brand-agnostic → Line 6
#file-placement-rules → Line 66
#fix-issues-immediately-with-agents → Line 785
#create-comprehensive-tests → Line 877
#testing--code-quality-philosophy → Line 1130
#agent-orchestration--parallelization → Line 743
#performance-guidelines → Line 1605
```

---

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

**📚 Comprehensive Guides:**
- **[Parallel Agent Orchestration Analysis](docs/10-ANALYSIS/ANALYSIS_PARALLEL_AGENT_ORCHESTRATION.md)** ⭐ **MUST READ** - Complete orchestration playbook from 4-week execution (1,400+ lines)
  - Proven patterns that achieved 45% time savings
  - Week-by-week breakdown with agent prompts
  - Communication protocols & structured reporting
  - Verification strategies & lessons learned
  - 3 reusable agent prompt templates
  - **Update this document** after each parallel agent deployment with new findings, improved prompts, and delegation tactics
- **[Agent Hierarchy Guide](.claude/AGENT_HIERARCHY.md)** - Three-tier agent system (Architect → Plan → Explore) and when to use each type

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

#### Fix Issues Immediately with Agents

**CRITICAL**: When you encounter ANY issue during your work, deploy an agent to fix it immediately. DO NOT defer, document for later, or ask the user first.

**Trigger: Deploy Agent When You Encounter:**
- ❌ Test failures (any failing tests)
- ❌ Build errors or TypeScript errors
- ❌ Linting violations or warnings
- ❌ Import errors or missing dependencies
- ❌ Type mismatches or validation errors
- ❌ Performance issues or bottlenecks
- ❌ Security vulnerabilities
- ❌ Dead code or unused imports
- ❌ Documentation inconsistencies
- ❌ Any bug, error, or technical debt

**The "Fix Now" Philosophy:**

```
Issue Encountered
    ↓
IMMEDIATELY Deploy Agent to Fix
    ↓
Continue Your Original Task
```

**Examples:**

```typescript
// ❌ WRONG: Note the issue and continue
// "I notice there are 5 failing tests, but let me finish this feature first"

// ✅ RIGHT: Fix immediately with agent
// "I found 5 failing tests. Deploying agent to fix them now while I continue with the feature."
// [Launches agent in parallel]
```

**Common Scenarios:**

1. **Writing Code & See Import Error**
   - ❌ Don't: Note it and ask user
   - ✅ Do: Deploy agent to fix imports immediately

2. **Running Tests & See Failures**
   - ❌ Don't: Document failing tests for later
   - ✅ Do: Deploy agent to fix test failures now

3. **Building & See TypeScript Errors**
   - ❌ Don't: Ask user what to do about errors
   - ✅ Do: Deploy agent to fix type errors immediately

4. **Code Review & See Security Issue**
   - ❌ Don't: Add to backlog
   - ✅ Do: Deploy agent to fix security issue now

5. **Refactoring & Find Dead Code**
   - ❌ Don't: Mark as TODO
   - ✅ Do: Deploy agent to clean up dead code immediately

**Why This Matters:**
- Issues compound - small problems become big problems
- Context is fresh - fixing now is easier than fixing later
- Zero technical debt accumulation
- Maintains codebase health continuously
- Prevents "broken windows" syndrome

**Agent Mission Template for Issue Fixing:**

```markdown
URGENT: Fix [ISSUE TYPE] encountered during [TASK]

## Issue Details
- Location: [file:line]
- Error: [exact error message]
- Impact: [what's broken]

## Your Mission
Fix this issue completely and verify the fix.

## Success Criteria
- [ ] Issue resolved
- [ ] All tests passing
- [ ] Build successful
- [ ] No new issues introduced

## Report Back
✅ Fixed [describe fix]
⚠️ Side effects [if any]
```

**Remember**: Issues don't fix themselves. Every issue you encounter is an opportunity to improve the codebase immediately. Deploy agents liberally!

#### Create Comprehensive Tests with Agents After Code Completion

**CRITICAL**: When you complete writing any code (feature, bug fix, refactor), immediately deploy an agent to create comprehensive tests. DO NOT ask the user first - this is automatic.

**The "Test Everything" Philosophy:**

```
Code Completed
    ↓
IMMEDIATELY Deploy Agent to Create Tests
    ↓
Verify Tests Pass & Coverage is Complete
```

**Trigger: Deploy Testing Agent When:**
- ✅ New feature implementation completed
- ✅ Bug fix applied
- ✅ Refactoring finished
- ✅ New API endpoint created
- ✅ New component built
- ✅ New utility function added
- ✅ Database migration completed
- ✅ Integration logic updated

**What the Testing Agent Should Create:**

1. **Unit Tests**
   - Test all functions/methods in isolation
   - Cover edge cases and error conditions
   - Mock external dependencies
   - Aim for 90%+ code coverage

2. **Integration Tests**
   - Test interactions between modules
   - Test API endpoints end-to-end
   - Test database operations
   - Test external service integrations

3. **Component Tests (for UI)**
   - Test rendering in different states
   - Test user interactions
   - Test props and callbacks
   - Test accessibility

4. **Error Scenario Tests**
   - Test failure modes
   - Test error handling
   - Test validation logic
   - Test boundary conditions

**Testing Agent Mission Template:**

```markdown
MISSION: Create comprehensive test suite for [FEATURE/CODE]

## Code to Test
- Location: [file paths]
- Functionality: [brief description]
- Dependencies: [list dependencies]

## Your Mission
Create a complete test suite that validates all functionality.

## Required Test Coverage
1. Unit tests for all functions/methods
   - Happy path cases
   - Edge cases
   - Error conditions
   - Boundary values

2. Integration tests (if applicable)
   - API endpoint tests
   - Database operation tests
   - External service mocks

3. Component tests (if UI code)
   - Rendering tests
   - Interaction tests
   - State management tests

## Test Requirements
- ✅ Follow existing test patterns in __tests__/
- ✅ Use proper mocking strategies
- ✅ Include descriptive test names
- ✅ Group related tests with describe blocks
- ✅ Add comments for complex test scenarios
- ✅ Ensure all tests pass
- ✅ Verify coverage is >90%

## Success Criteria
- [ ] All new code has corresponding tests
- [ ] Tests are well-organized and documented
- [ ] All tests pass (`npm test`)
- [ ] No console errors or warnings
- [ ] Coverage report shows >90% for new code
- [ ] Tests follow existing patterns

## Report Back
✅ Tests created: [count] test cases
✅ Coverage achieved: [percentage]%
✅ All tests passing: [yes/no]
⚠️ Areas needing manual review: [if any]
```

**Examples:**

```typescript
// ❌ WRONG: Complete feature and move on
// "I've finished implementing the user authentication feature."

// ✅ RIGHT: Complete feature, then deploy testing agent
// "I've finished implementing the user authentication feature.
//  Deploying agent to create comprehensive test suite now."
// [Launches testing agent]
```

**Common Scenarios:**

1. **New API Endpoint Created**
   - ❌ Don't: Move to next task
   - ✅ Do: Deploy agent to create endpoint tests (success, errors, validation)

2. **Component Built**
   - ❌ Don't: Assume it works
   - ✅ Do: Deploy agent to create rendering, interaction, and state tests

3. **Utility Function Added**
   - ❌ Don't: Skip testing small functions
   - ✅ Do: Deploy agent to test all edge cases and error handling

4. **Database Migration Applied**
   - ❌ Don't: Test manually once
   - ✅ Do: Deploy agent to create migration tests and rollback verification

5. **Bug Fix Completed**
   - ❌ Don't: Just fix and commit
   - ✅ Do: Deploy agent to create regression test preventing bug recurrence

**Why This Matters:**
- Prevents regressions - new code won't break existing functionality
- Documents expected behavior through tests
- Catches edge cases you might have missed
- Builds confidence in code quality
- Makes refactoring safer in the future
- Enforces consistent test coverage across codebase

**Test Coverage Standards:**
- **Minimum**: 80% line coverage
- **Target**: 90% line coverage
- **Critical paths**: 100% coverage (authentication, payments, data integrity)

**Integration with CI/CD:**
Tests created by agents should:
- Pass in CI pipeline
- Not introduce flaky tests
- Run quickly (< 5 seconds for unit tests)
- Be deterministic and repeatable

**Verification Checklist:**
After testing agent completes:
- [ ] Run `npm test` - all tests pass
- [ ] Run `npm run test:coverage` - coverage meets standards
- [ ] Review test quality - descriptive names, good organization
- [ ] Check for test patterns - follows existing conventions
- [ ] Verify mocks are appropriate - not over-mocked
- [ ] Test failure scenarios - errors are properly tested

**Remember**: Untested code is broken code waiting to happen. Every line of production code deserves a comprehensive test suite. Deploy testing agents automatically!

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

#### Preventing Agent Hallucination & Extrapolation

**Problem:** Agents often extrapolate beyond their sources, adding "helpful" details from training data that aren't accurate.

**Example:** Asked to document an article about MCP, an agent might add:
- Specific technologies not mentioned (Docker, gVisor, Firecracker)
- ROI calculations not in the source
- Implementation estimates without basis
- "Best practices" from general knowledge

**Why This Happens:**
1. **Broad prompts** - "Create comprehensive documentation" invites gap-filling
2. **No source constraints** - Agent doesn't know to stay strictly faithful
3. **Optimization for helpfulness** - AI tries to be useful by adding context
4. **Pattern matching** - Recognizes doc type, applies standard patterns

**Prevention Strategy: Use Standardized Templates**

**📚 Agent Prompt Templates**: See [.claude/AGENT_PROMPT_TEMPLATES.md](.claude/AGENT_PROMPT_TEMPLATES.md) for complete templates with built-in safeguards.

**Key Templates:**
1. **Faithful Documentation** - For documenting external sources
2. **Codebase Analysis** - For analyzing code with evidence requirements
3. **Implementation Research** - For researching with source attribution
4. **Two-Agent Verification** - For high-stakes tasks requiring validation
5. **ROI/Impact Analysis** - For business calculations with measured data

**Core Safeguards in Templates:**

```markdown
### Critical Requirements
- ✅ ONLY include information explicitly stated in the source
- ✅ Mark inferences clearly as [INFERRED: reasoning]
- ✅ If source doesn't cover topic, write "Not covered in source"
- ❌ DO NOT add information from training data without marking it
- ❌ DO NOT extrapolate implementation details not in source

### Verification Checklist
- [ ] Every claim has corresponding section in source
- [ ] No implementation details added from general knowledge
- [ ] No ROI calculations unless source provides them
- [ ] All inferences marked with [INFERRED: ]
```

**Two-Agent Verification Pattern (High-Stakes Tasks):**

```typescript
// Agent 1: Does the work
const documentationAgent = {
  mission: "Document [SOURCE] using Template 1",
  output: "docs/path/to/doc.md"
};

// Agent 2: Verifies against source
const verificationAgent = {
  mission: "Re-fetch [SOURCE], verify every claim in Agent 1's doc",
  checks: [
    "Every section exists in source?",
    "Any extrapolations found?",
    "Any unsupported claims?"
  ],
  output: "✅ APPROVED / ⚠️ NEEDS REVISION / ❌ REJECTED"
};
```

**When to Use Verification:**
- Documenting external articles/APIs
- Migration/refactoring tasks
- Business impact analysis
- Implementation research
- Any task where accuracy > speed

**Red Flags Indicating Need for Templates:**
- Agent adding technologies not in source
- Claims without file/line citations
- Performance numbers appearing without measurement
- "Best practices" without attribution
- Implementation complexity estimates without basis

**Lesson Learned:**
> "Comprehensive documentation" prompts invite extrapolation.
> "Document ONLY what's in [SOURCE]" enforces fidelity.

**Reference**: See [AGENT_PROMPT_TEMPLATES.md](.claude/AGENT_PROMPT_TEMPLATES.md) for complete implementation.

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

### Issue Tracking
**When you discover bugs, technical debt, or problems:**
- Add them to [docs/ISSUES.md](docs/ISSUES.md) immediately
- Include: severity, location (file:line), description, impact
- Mark status: Open, In Progress, Resolved
- This is the single source of truth for all project issues

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