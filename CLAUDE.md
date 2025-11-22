# CLAUDE.md

**AI Assistant Instructions for Omniops Codebase**

**Last Updated:** 2025-11-22
**Version:** v0.1.0
**File Purpose:** Critical rules and quick reference for Claude Code AI assistant

---

## 🚨 CRITICAL RULES (Top 10)

**MUST Rules:**
1. **NEVER hardcode**: company names, products, industries, domains, URLs, emails (multi-tenant system)
2. **NEVER create files in root** (only config files allowed - see File Placement Matrix below)
3. **Code files MUST be <300 LOC** (AI instruction files exempt)
4. **ALWAYS read entire file** before making changes
5. **ALL AGENTS MUST READ CLAUDE.md FIRST** - agents don't inherit project rules

**AUTO-TRIGGER Rules (No Permission Needed):**
6. **Deploy agent immediately** when encountering ANY issue (test failures, build errors, TypeScript errors)
7. **Deploy testing agent immediately** after completing any code (features, bug fixes, refactors)
8. **Deploy parallel agents** for: 2+ independent categories, 20+ files, >30min tasks
9. **ALWAYS validate fixes** with actual commands (`npm test`, `npm run build`, `npm run lint`)
10. **Consider multiple approaches** like a Senior Engineer - don't jump to conclusions

---

## ⚡ AUTO-TRIGGER ACTIONS

**Fix Issues Immediately (Deploy the-fixer agent):**
- Test failure detected → Deploy immediately
- Build/TypeScript error → Deploy immediately
- Import/linting violation → Deploy immediately
- Security issue/dead code → Deploy immediately
- Performance issue (O(n²)) → Deploy performance-profiler

**Create Tests Immediately (Deploy code-quality-validator):**
- New feature completed → Deploy immediately
- Bug fix applied → Deploy immediately
- API endpoint/component created → Deploy immediately

**Use Parallel Agents (Deploy multiple agents):**
- 2+ independent categories → Deploy in parallel
- 20+ files to modify → Deploy by module
- Dependency updates → Deploy by category
- >30 min sequential work → Parallelize

---

## 🎯 QUICK SCENARIOS (When You're Stuck)

**"I found an issue - what do I do?"**
→ Deploy the-fixer agent immediately (see line 31)

**"I just finished coding - what's next?"**
→ Deploy code-quality-validator agent (see line 38)

**"I need to refactor a large file - how?"**
→ See "Refactoring Patterns" below (line 198)

**"I have many independent tasks - parallelize?"**
→ YES if: 2+ categories OR 20+ files OR >30min work (see line 43)

**"Tests are hard to write - is my code bad?"**
→ Probably yes. Refactor for dependency injection (see line 184)

**"Should I use an agent template?"**
→ YES for: documentation, analysis, implementation research (see line 94)

---

## 📊 DECISION MATRICES

### File Placement Matrix
| File Type | Root? | Destination |
|-----------|-------|-------------|
| Test script | ❌ | `__tests__/[category]/` |
| Utility script | ❌ | `scripts/[category]/` |
| SQL script | ❌ | `scripts/sql/[category]/` |
| Report/docs | ❌ | `ARCHIVE/` or `docs/[category]/` |
| Config file | ✅ | `/` (root only) |

### Agent Deployment Matrix
| Scenario | Deploy Agent? | Type |
|----------|---------------|------|
| Fix single test (<5min) | ❌ Do directly | - |
| Fix import error | ✅ YES | the-fixer (immediate) |
| Update 15+ dependencies | ✅ YES | 4 parallel by category |
| Refactor 30+ files | ✅ YES | 3 parallel by module |
| Create tests for feature | ✅ YES | code-quality-validator (auto) |

### Testing Strategy Matrix
| Mock Complexity | Test Setup | Action |
|----------------|------------|--------|
| 3+ levels deep | >20 lines | 🔧 Refactor for dependency injection |
| 2 levels | 10-20 lines | ⚠️ Consider simplification |
| 1 level | <10 lines | ✅ Good design |

### Performance Matrix
| Complexity | Action |
|------------|--------|
| O(n²) or worse | 🔴 Refactor immediately |
| O(n log n) | ✅ Acceptable |
| O(n) | ✅ Good |

---

## 📚 DETAILED GUIDES (Read When Needed)

**Agent Orchestration:**
- [.claude/AGENT_ORCHESTRATION.md](.claude/AGENT_ORCHESTRATION.md) - When/how to deploy agents, all agent rules
- [docs/02-GUIDES/GUIDE_PARALLEL_AGENT_ORCHESTRATION.md](docs/02-GUIDES/GUIDE_PARALLEL_AGENT_ORCHESTRATION.md) - 5 scenario playbooks for parallel agents
- [docs/02-GUIDES/GUIDE_POD_ORCHESTRATION_PATTERN.md](docs/02-GUIDES/GUIDE_POD_ORCHESTRATION_PATTERN.md) - Domain-based pods for 20+ file refactoring
- [docs/02-GUIDES/GUIDE_MAKER_FRAMEWORK_HAIKU_OPTIMIZATION.md](docs/02-GUIDES/GUIDE_MAKER_FRAMEWORK_HAIKU_OPTIMIZATION.md) - Haiku voting for 80-90% cost savings
- [.claude/AGENT_PROMPT_TEMPLATES.md](.claude/AGENT_PROMPT_TEMPLATES.md) - 5 templates to prevent hallucination
  - **Use Template 1** when documenting external articles/APIs
  - **Use Template 2** when analyzing codebase with evidence requirements
  - **Use Template 5** when calculating ROI/impact with measured data

**Development:**
- [docs/02-GUIDES/GUIDE_INDUSTRY_BEST_PRACTICES.md](docs/02-GUIDES/GUIDE_INDUSTRY_BEST_PRACTICES.md) - Minimal integration code, config management, API design
- [docs/02-GUIDES/GUIDE_OPTIMIZATION_PHILOSOPHY.md](docs/02-GUIDES/GUIDE_OPTIMIZATION_PHILOSOPHY.md) - Decision framework before writing code
- [docs/02-GUIDES/GUIDE_DOCUMENTATION_STANDARDS.md](docs/02-GUIDES/GUIDE_DOCUMENTATION_STANDARDS.md) - Naming conventions, metadata headers, searchability
- [docs/02-GUIDES/GUIDE_E2E_TESTING_FOR_AGENTS.md](docs/02-GUIDES/GUIDE_E2E_TESTING_FOR_AGENTS.md) - How to write tests that teach AI agents

**Reference:**
- [docs/09-REFERENCE/REFERENCE_DATABASE_SCHEMA.md](docs/09-REFERENCE/REFERENCE_DATABASE_SCHEMA.md) - All 31 tables, 214 indexes, relationships
- [docs/09-REFERENCE/REFERENCE_DIRECTORY_DOCUMENTATION.md](docs/09-REFERENCE/REFERENCE_DIRECTORY_DOCUMENTATION.md) - Index of 109 READMEs across all directories
- [docs/09-REFERENCE/REFERENCE_PERFORMANCE_OPTIMIZATION.md](docs/09-REFERENCE/REFERENCE_PERFORMANCE_OPTIMIZATION.md) - Database, API, AI, frontend optimization
- [docs/10-ANALYSIS/ANALYSIS_LESSONS_LEARNED.md](docs/10-ANALYSIS/ANALYSIS_LESSONS_LEARNED.md) - 12 lessons from 4 weeks of development

---

## 🎯 PROJECT OVERVIEW

**What:** AI-powered customer service chat widget (Next.js 15, React 19, TypeScript, Supabase)
**Key Features:** Embeddable widget, web scraping, WooCommerce/Shopify integration, GDPR compliance

**Tech Stack:**
- Frontend: Next.js 15, React 19, TypeScript 5, Tailwind CSS
- Backend: Next.js API Routes
- Database: Supabase (PostgreSQL + pgvector)
- AI: OpenAI GPT-4, embeddings
- E-commerce: WooCommerce API, Shopify API

**Architecture Pattern:** Multi-tenant, brand-agnostic, domain-based customer isolation

---

## ⚙️ KEY COMMANDS

```bash
# Development
npm run dev              # Start dev server (port 3000)
npm run build            # Build for production
npm run lint             # ESLint
npm test                 # All tests
npm run test:e2e         # E2E tests

# Database
npx tsx test-database-cleanup.ts stats      # View stats
npx tsx test-database-cleanup.ts clean      # Clean data

# Type Checking
npx tsc --noEmit         # TypeScript check
```

---

## 🚨 BRAND-AGNOSTIC SYSTEM

**NEVER hardcode:**
- ❌ Company names, logos, branding
- ❌ Product names, SKUs, types
- ❌ Industry terms ("pumps", "parts")
- ❌ Domain names, URLs, emails
- ❌ Business categories

**✅ EXCEPTION:** Tests may use domain-specific terms to verify real-world behavior.

**Why:** This is a multi-tenant SaaS. Hardcoding breaks it for other customers.

---

## 🏗️ ARCHITECTURE BASICS

**Core Services:**
1. **API Layer** (`app/api/`) - Chat, scraping, privacy, integrations
2. **Business Logic** (`lib/`) - Embeddings, rate limiting, encryption
3. **Data Layer** - Supabase with Row Level Security
4. **Integrations** - OpenAI, WooCommerce, Shopify

**Key Patterns:**
- Multi-tenancy with encrypted credentials
- Rate limiting per domain
- Redis job queue for scraping
- Hybrid vector search (embeddings + real-time)
- GDPR/CCPA compliance

**Database:** 31 tables, 214 indexes - see [REFERENCE_DATABASE_SCHEMA.md](docs/09-REFERENCE/REFERENCE_DATABASE_SCHEMA.md)

---

## 🧪 TESTING PHILOSOPHY

**"Hard to Test" = "Poorly Designed"**

**Red Flags:**
- ❌ Need to mock 3+ levels deep → Refactor for dependency injection
- ❌ Test setup >20 lines → Architecture problem
- ❌ Tests are slow (>5s) → Hidden dependencies

**Green Lights:**
- ✅ Inject mocks via constructor
- ✅ Test setup <10 lines
- ✅ Tests run fast (<1s)

**Rule:** Don't fight with mocks - refactor the design.

---

## 🔧 REFACTORING PATTERNS (For >300 LOC Files)

**Step 1: Identify What to Extract**
Look for these natural boundaries:
- **Types/Interfaces** → Move to `types/[module].ts`
- **Constants/Config** → Move to `lib/config/[module].ts`
- **Utility Functions** → Move to `lib/utils/[module].ts`
- **Validators** → Move to `lib/validators/[module].ts`
- **API Clients** → Move to `lib/api/[module].ts`
- **Business Logic** → Keep in original file or new `lib/services/[module].ts`

**Step 2: Extract in This Order (Safest)**
1. **Types first** - No runtime dependencies
2. **Constants** - Static data
3. **Pure utilities** - No side effects
4. **Validators** - Usually pure functions
5. **Classes/services** - May have dependencies

**Step 3: Common Extraction Pattern**

**BEFORE: lib/analytics.ts (450 LOC - VIOLATES 300 RULE)**
```typescript
// Everything mixed together
interface AnalyticsEvent { type: string; data: any; }
interface AnalyticsMetrics { views: number; clicks: number; }

const ENDPOINTS = { events: '/api/analytics/events' };
const DEFAULTS = { batchSize: 100, timeout: 5000 };

function validateEvent(e: AnalyticsEvent): boolean { /* ... */ }

class AnalyticsApiClient {
  constructor(private apiKey: string) {}
  async trackEvent(event: AnalyticsEvent) { /* ... */ }
}

class AnalyticsService {
  private client: AnalyticsApiClient;
  constructor(apiKey: string) {
    this.client = new AnalyticsApiClient(apiKey);
  }
  async processEvent(event: AnalyticsEvent) {
    if (!validateEvent(event)) throw new Error('Invalid');
    await this.client.trackEvent(event);
  }
}
```

**AFTER: Split into 5 files (all <300 LOC)**

```typescript
// 1. types/analytics.ts (50 LOC)
export interface AnalyticsEvent { type: string; data: any; }
export interface AnalyticsMetrics { views: number; clicks: number; }

// 2. lib/config/analytics.ts (30 LOC)
export const ANALYTICS_ENDPOINTS = { events: '/api/analytics/events' };
export const ANALYTICS_DEFAULTS = { batchSize: 100, timeout: 5000 };

// 3. lib/validators/analytics.ts (60 LOC)
import type { AnalyticsEvent } from '@/types/analytics';
export function validateEvent(e: AnalyticsEvent): boolean { /* ... */ }

// 4. lib/api/analytics-client.ts (100 LOC)
import type { AnalyticsEvent } from '@/types/analytics';
import { ANALYTICS_ENDPOINTS } from '@/lib/config/analytics';

export class AnalyticsApiClient {
  constructor(private apiKey: string) {}
  async trackEvent(event: AnalyticsEvent) { /* ... */ }
}

// 5. lib/analytics.ts (200 LOC) - NOW COMPLIANT ✅
import type { AnalyticsEvent } from '@/types/analytics';
import { AnalyticsApiClient } from '@/lib/api/analytics-client';
import { validateEvent } from '@/lib/validators/analytics';

export class AnalyticsService {
  constructor(private client: AnalyticsApiClient) {} // DI pattern!

  async processEvent(event: AnalyticsEvent) {
    if (!validateEvent(event)) throw new Error('Invalid');
    await this.client.trackEvent(event);
  }
}

// External consumers - imports UNCHANGED
import { AnalyticsService } from '@/lib/analytics'; // Still works!
```

**Step 4: Update Imports**
```typescript
// Old single import
import { everything } from './analytics';

// New specific imports
import type { AnalyticsData } from '@/types/analytics';
import { ANALYTICS_DEFAULTS } from '@/lib/config/analytics';
import { validateAnalytics } from '@/lib/validators/analytics';
```

**When to Use Subdirectory vs. Separate File:**
- **<5 related files** → Separate files at same level
- **5-10 related files** → Consider subdirectory
- **>10 related files** → Definitely use subdirectory

**Common Mistake to Avoid:**
❌ Don't create circular dependencies (A imports B, B imports A)
✅ Extract shared code to a third file

---

## 🧪 TESTING WORKFLOW FOR REFACTORING

**Phase 1: BEFORE (Create Baseline)**
```bash
npm test -- lib/[module].test.ts  # All tests must pass first
npm run test:coverage              # Verify >90% coverage
```

**Phase 2: DURING (After Each Extraction)**
```bash
npm run lint                       # No lint errors
npx tsc --noEmit                   # No type errors
npm test                          # Behavior unchanged
```

**Phase 3: AFTER (Final Validation)**
```bash
npm run build                      # Build succeeds
npm test                          # All tests pass
npm run test:coverage              # Coverage >90%
scripts/check-loc-compliance.sh    # All files <300 LOC
```

**🚨 Red Flag:** If ANY test fails → Stop and fix immediately before continuing

---

## 🔧 COMMON TASKS

**Adding API Endpoint:**
1. Create `app/api/[feature]/route.ts`
2. Add Zod schema in `types/api.ts`
3. Business logic in `lib/services/`
4. Tests in `__tests__/api/[feature]/`
5. Deploy code-quality-validator agent (auto)

**Modifying Chat Widget:**
1. Embed code: `public/embed.js`
2. Widget UI: `app/embed/page.tsx`
3. Test on different sites

**Database Cleanup:**
```bash
npx tsx test-database-cleanup.ts stats              # Check data
npx tsx test-database-cleanup.ts clean --domain=X   # Clean domain
```

---

## ✅ VERIFICATION CHECKLIST

**After ANY code change:**
```bash
npm run lint              # → No errors
npx tsc --noEmit         # → No type errors
npm test                 # → All pass
npm run build            # → Success
```

**After refactoring specifically:**
```bash
scripts/check-loc-compliance.sh   # → All files <300 LOC
```

---

## 📝 DEVELOPMENT WORKFLOW

**Starting Development:**
1. Docker running: `open -a "Docker"`
2. Start services: `docker-compose up -d`
3. Start dev: `npm run dev`
4. Access: http://localhost:3000

**Code Conventions:**
- TypeScript strict mode
- Follow patterns in `components/ui/`
- Zod validation for APIs
- WooCommerce credentials encrypted (AES-256)

**Testing:** Fully automated
- Tests run on file save (watch mode)
- E2E validates workflows automatically
- Pre-push hook blocks broken code
- CI/CD runs full suite

---

## ⚡ PERFORMANCE GUIDELINES

**Avoid O(n²)** - Use Map/Set for lookups
**Use async/parallel** - `Promise.all()` everywhere possible
**Before adding dependency** - Check if native JS/TS can do it
**Measure first** - Profile before optimizing

---

## 🔍 QUICK SEARCH

**Find rules about:**
- Brand-agnostic: grep "HARDCODING" or "multi-tenant"
- File placement: grep "root directory" or "NEVER create files"
- Agents: grep "agents MUST READ" or "Deploy agent"
- Testing: grep "Hard to Test" or "dependency injection"
- Performance: grep "O(n²)" or "algorithmic complexity"

---

**Total Lines:** ~445 (within 100-500 range - industry best practice)
**Latest Improvements:** Added Testing Workflow, Concrete Refactoring Example, Validation Checklist
**Previous Improvements:** Quick Scenarios, Refactoring Patterns, Agent Template guidance, Guide descriptions
**Next Read:** [.claude/AGENT_ORCHESTRATION.md](.claude/AGENT_ORCHESTRATION.md) for detailed agent rules
