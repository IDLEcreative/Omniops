# Documentation Hub

> **Central navigation for all Omniops documentation**

Welcome to the Omniops documentation! This guide will help you find exactly what you need, whether you're a developer setting up the project for the first time, a DevOps engineer deploying to production, or a product manager understanding the system architecture.

---

## Table of Contents

- [Quick Start by Role](#quick-start-by-role)
- [Documentation Structure](#documentation-structure)
- [Common Tasks](#common-tasks)
- [Key Documentation Files](#key-documentation-files)
- [Documentation Standards](#documentation-standards)
- [Archive](#archive)

---

## Quick Start by Role

### 🚀 New Developer? Start Here

**Goal:** Get the project running locally and understand the codebase

1. **[Getting Started for Developers](00-GETTING-STARTED/getting-started-developers.md)** - Local setup walkthrough
2. **[Glossary](00-GETTING-STARTED/glossary.md)** - Key terms and concepts
3. **[Development Workflow](04-DEVELOPMENT/workflow.md)** - Daily development practices
4. **[Architecture Overview](01-ARCHITECTURE/overview.md)** - System design fundamentals

**Quick Commands:**
```bash
npm install              # Install dependencies
docker-compose up -d     # Start Redis & services
npm run dev              # Start dev server (port 3000)
npm test                 # Run tests
```

---

### 🛠️ DevOps Engineer? Start Here

**Goal:** Deploy, monitor, and maintain production systems

1. **[Getting Started for DevOps](00-GETTING-STARTED/getting-started-devops.md)** - Deployment prerequisites
2. **[Production Deployment Checklist](05-DEPLOYMENT/production-checklist.md)** - Pre-launch verification
3. **[Docker Setup Guide](05-DEPLOYMENT/docker.md)** - Container orchestration
4. **[Environment Variables Reference](07-REFERENCE/environment-variables.md)** - Configuration guide

**Quick Commands:**
```bash
# Docker
DOCKER_BUILDKIT=1 docker-compose build    # Build with cache
docker-compose up -d                      # Start production

# Database
npx tsx monitor-embeddings-health.ts check   # Health check
npm run migrate:encrypt-credentials          # Run migrations
```

---

### 🧪 QA Engineer? Start Here

**Goal:** Test features and verify quality

1. **[Testing Guide](04-DEVELOPMENT/testing.md)** - Testing strategy and patterns
2. **[Debugging Procedures](06-TROUBLESHOOTING/debugging.md)** - Common debugging workflows
3. **[API Reference](03-API/reference.md)** - Endpoint testing guide
4. **[Hallucination Prevention](07-REFERENCE/docs/02-GUIDES/GUIDE_HALLUCINATION_PREVENTION.md)** - AI quality testing

**Quick Commands:**
```bash
npm test                     # All tests
npm run test:unit            # Unit tests only
npm run test:integration     # Integration tests
npm run test:coverage        # Coverage report
npx tsx test-hallucination-prevention.ts  # AI quality check
```

---

### 📊 Product Manager? Start Here

**Goal:** Understand features, capabilities, and architecture

1. **[System Architecture Overview](01-ARCHITECTURE/overview.md)** - High-level system design
2. **[Feature Documentation](02-FEATURES/)** - All implemented features
3. **[Multi-Tenancy Guide](01-ARCHITECTURE/multi-tenancy.md)** - Brand-agnostic design
4. **[Privacy & Compliance](02-FEATURES/privacy-compliance/)** - GDPR/CCPA features

---

## Documentation Structure

Our documentation is organized into numbered categories for easy navigation:

### 📂 **00-GETTING-STARTED/**
*First stop for all new team members*

- **[Getting Started for Developers](00-GETTING-STARTED/getting-started-developers.md)** - Local development setup
- **[Getting Started for DevOps](00-GETTING-STARTED/getting-started-devops.md)** - Deployment and operations
- **[Glossary](00-GETTING-STARTED/glossary.md)** - Terminology reference (embeddings, RAG, RLS, etc.)
- **[Brand-Agnostic Checklist](00-GETTING-STARTED/brand-agnostic-checklist.md)** - Multi-tenant design requirements

---

### 🏗️ **01-ARCHITECTURE/**
*System design, patterns, and technical decisions*

- **[System Architecture Overview](01-ARCHITECTURE/overview.md)** - Complete system design
- **[Architecture Decision Records (ADRs)](01-ARCHITECTURE/adr/)** - Design decisions and rationale
- **[Database Schema](07-REFERENCE/REFERENCE_DATABASE_SCHEMA.md)** - Tables, relationships, RLS policies
- **[Search Architecture](SEARCH_ARCHITECTURE.md)** - Hybrid search design (100-200 result limits!)
- **[Multi-Tenancy](01-ARCHITECTURE/multi-tenancy.md)** - Domain-based isolation
- **[Security Architecture](01-ARCHITECTURE/security.md)** - Encryption, authentication, RLS

**Key Files:**
- `ARCHITECTURE.md` - Legacy architecture doc
- `SEARCH_ARCHITECTURE.md` - Critical for understanding search behavior

---

### ⚡ **02-FEATURES/**
*Feature documentation organized by domain*

#### **[Chat System](02-FEATURES/chat-system/)**
- Real-time AI chat with context retrieval
- Hallucination prevention mechanisms
- Message history and conversation management

#### **[WooCommerce Integration](02-FEATURES/woocommerce/)**
- Product catalog integration
- Order management
- Cart tracking and abandoned carts
- Stock level monitoring

#### **[Shopify Integration](02-FEATURES/shopify/)**
- Product sync
- Inventory management
- Order processing

#### **[Web Scraping](02-FEATURES/scraping/)**
- Crawlee + Playwright implementation
- Content extraction with Mozilla Readability
- Background job processing with Redis
- Incremental scraping strategies

#### **[Privacy & Compliance](02-FEATURES/privacy-compliance/)**
- GDPR data export
- CCPA data deletion
- User consent management
- Data retention policies

**Related Docs:**
- `WEB_SCRAPING.md` - Scraping system overview
- `HALLUCINATION_PREVENTION.md` - Chat quality safeguards
- `PERFORMANCE_OPTIMIZATION.md` - Response time analysis

---

### 🔌 **03-API/**
*API documentation and integration guides*

- **[API Reference](03-API/reference.md)** - Complete endpoint documentation
- **[Authentication](03-API/authentication.md)** - Auth flows and security
- **[Rate Limiting](03-API/rate-limiting.md)** - Per-domain throttling
- **[Webhooks](03-API/webhooks.md)** - Event notifications
- **[Error Handling](03-API/errors.md)** - Error codes and responses

**API Categories:**
- Chat endpoints (`/api/chat`)
- Scraping endpoints (`/api/scrape`, `/api/scrape-jobs`)
- WooCommerce endpoints (`/api/woocommerce/*`)
- Privacy endpoints (`/api/privacy/*`, `/api/gdpr/*`)

---

### 💻 **04-DEVELOPMENT/**
*Development practices, patterns, and workflows*

- **[Development Workflow](04-DEVELOPMENT/workflow.md)** - Daily development practices
- **[Code Patterns](04-DEVELOPMENT/patterns.md)** - Service patterns, API routes, components
- **[Testing Guide](04-DEVELOPMENT/testing.md)** - Unit, integration, and E2E testing
- **[Debugging Guide](04-DEVELOPMENT/debugging.md)** - Common debugging scenarios
- **[Performance Guidelines](04-DEVELOPMENT/performance.md)** - Optimization principles
- **[Database Operations](04-DEVELOPMENT/database.md)** - Working with Supabase

**Key Principles:**
- **File Length:** All files must be < 300 LOC
- **Read Before Editing:** Always read entire files before changes
- **Agent Parallelization:** Launch multiple agents for faster completion
- **Minimize Everything:** Less code, fewer dependencies, better performance

---

### 🚀 **05-DEPLOYMENT/**
*Production deployment and operations*

- **[Production Checklist](05-DEPLOYMENT/production-checklist.md)** - Pre-launch verification
- **[Docker Setup](05-DEPLOYMENT/docker.md)** - Container configuration and commands
- **[Environment Variables](05-DEPLOYMENT/environment-variables.md)** - Required and optional configs
- **[Monitoring Setup](05-DEPLOYMENT/monitoring.md)** - Health checks and observability
- **[Database Migrations](05-DEPLOYMENT/migrations.md)** - Schema change management

**Production Files:**
- `Dockerfile` - Production multi-stage build
- `docker-compose.yml` - Production orchestration
- `.env.docker.example` - Environment template

**Performance Monitoring:**
```bash
npx tsx monitor-embeddings-health.ts check     # Health check
npx tsx monitor-embeddings-health.ts auto      # Auto-maintenance
npx tsx optimize-chunk-sizes.ts analyze        # Analyze chunk sizes
```

---

### 🔧 **06-TROUBLESHOOTING/**
*Problem diagnosis and resolution*

- **[Common Errors](06-TROUBLESHOOTING/common-errors.md)** - Frequent issues and fixes
- **[Debugging Procedures](06-TROUBLESHOOTING/debugging.md)** - Step-by-step diagnosis
- **[Database Cleanup](06-TROUBLESHOOTING/database-cleanup.md)** - Data maintenance
- **[Performance Issues](06-TROUBLESHOOTING/performance.md)** - Slow response diagnosis
- **[Integration Problems](06-TROUBLESHOOTING/integrations.md)** - WooCommerce, Shopify, OpenAI

**Database Cleanup:**
```bash
npx tsx test-database-cleanup.ts stats                # View stats
npx tsx test-database-cleanup.ts clean --domain=X     # Clean domain
npx tsx test-database-cleanup.ts clean                # Clean all
```

---

### 📚 **07-REFERENCE/**
*Technical references and specifications*

- **[Technology Stack](07-REFERENCE/tech-stack.md)** - Frameworks, libraries, versions
- **[Configuration Reference](07-REFERENCE/configuration.md)** - Feature flags, settings
- **[Database Schema](07-REFERENCE/docs/07-REFERENCE/REFERENCE_DATABASE_SCHEMA.md)** - Complete schema reference
- **[Hallucination Prevention](HALLUCINATION_PREVENTION.md)** - Anti-hallucination safeguards
- **[Search Architecture](SEARCH_ARCHITECTURE.md)** - Search limits and behavior
- **[NPX Tools Guide](NPX_TOOLS_GUIDE.md)** - Monitoring and maintenance tools

**Critical References:**
- `SEARCH_ARCHITECTURE.md` - **CRITICAL:** Explains actual search limits (100-200, NOT 20!)
- `PERFORMANCE_OPTIMIZATION.md` - Response time bottlenecks and solutions
- `HALLUCINATION_PREVENTION.md` - Chat quality testing and safeguards

---

## Common Tasks

Quick links to frequently needed documentation:

### "I want to add a new API endpoint"

1. Read **[API Patterns](04-DEVELOPMENT/patterns.md#api-routes)**
2. Create route in `app/api/[feature]/route.ts`
3. Add Zod validation schema
4. Implement business logic in `lib/services/`
5. Add tests in `__tests__/api/[feature]/`
6. Update **[API Reference](03-API/reference.md)**

### "I want to integrate a new commerce platform"

1. Read **[Commerce Provider Pattern](04-DEVELOPMENT/patterns.md#commerce-providers)**
2. Review **[WooCommerce Integration](02-FEATURES/woocommerce/)** as example
3. Create provider in `lib/agents/providers/[platform]-provider.ts`
4. Implement dynamic loader in `lib/[platform]-dynamic.ts`
5. Add API routes in `app/api/[platform]/`
6. Create feature documentation in `02-FEATURES/[platform]/`

### "I want to test locally with Docker"

1. Read **[Docker Setup](05-DEPLOYMENT/docker.md)**
2. Ensure Docker Desktop is running: `open -a "Docker"`
3. Build images: `DOCKER_BUILDKIT=1 docker-compose build`
4. Start services: `docker-compose up -d`
5. View logs: `docker-compose logs -f app`

### "I want to understand the search system"

1. **CRITICAL:** Read **[Search Architecture](SEARCH_ARCHITECTURE.md)** first
2. Key facts:
   - Search returns **100-200 results**, NOT 20
   - Hybrid search combines embeddings + real-time web results
   - Token usage varies by content size
3. Read **[Performance Optimization](PERFORMANCE_OPTIMIZATION.md)** for bottlenecks

### "Something broke in production"

1. Start with **[Common Errors](06-TROUBLESHOOTING/common-errors.md)**
2. Check **[Monitoring Logs](05-DEPLOYMENT/monitoring.md)**
3. Review **[Debugging Procedures](06-TROUBLESHOOTING/debugging.md)**
4. Run health checks:
   ```bash
   npx tsx monitor-embeddings-health.ts check
   ```
5. If database-related, see **[Database Troubleshooting](06-TROUBLESHOOTING/database-cleanup.md)**

### "I need to update the chat system"

1. Read **[Hallucination Prevention](HALLUCINATION_PREVENTION.md)** - CRITICAL
2. Review **[Chat System Docs](02-FEATURES/chat-system/)**
3. Make changes to `app/api/chat/route.ts`
4. Test with: `npx tsx test-hallucination-prevention.ts`
5. Never skip hallucination testing!

---

## Key Documentation Files

### Must-Read for Everyone

- **[CLAUDE.md](../CLAUDE.md)** - Critical development guidelines and project overview
- **[Brand-Agnostic Checklist](00-GETTING-STARTED/brand-agnostic-checklist.md)** - Multi-tenant requirements
- **[Glossary](00-GETTING-STARTED/glossary.md)** - Terminology reference

### Critical Technical Docs

- **[Search Architecture](SEARCH_ARCHITECTURE.md)** - MUST READ: Actual search behavior (100-200 results)
- **[Performance Optimization](PERFORMANCE_OPTIMIZATION.md)** - Response time analysis
- **[Hallucination Prevention](HALLUCINATION_PREVENTION.md)** - Chat quality safeguards
- **[Architecture Overview](01-ARCHITECTURE/overview.md)** - System design

### Feature-Specific

- **[WooCommerce Integration](02-FEATURES/woocommerce/)** - E-commerce integration
- **[Web Scraping](02-FEATURES/scraping/)** - Content extraction
- **[Privacy & Compliance](02-FEATURES/privacy-compliance/)** - GDPR/CCPA

### Operations

- **[Production Checklist](05-DEPLOYMENT/production-checklist.md)** - Deployment verification
- **[Docker Setup](05-DEPLOYMENT/docker.md)** - Container operations
- **[Monitoring Guide](05-DEPLOYMENT/monitoring.md)** - Health checks

---

## Documentation Standards

### How We Write Docs

**Structure:**
- Clear, scannable headings
- Table of contents for docs > 100 lines
- Code examples with explanations
- Links to related documentation

**Style:**
- Active voice ("Click the button" not "The button should be clicked")
- Present tense ("The system processes..." not "The system will process...")
- Clear, concise sentences
- Examples over abstract explanations

**Code Examples:**
```typescript
// ✅ Good: Includes context and explanation
async function fetchUserData(userId: string) {
  // Fetch from Supabase with RLS automatically applied
  const { data, error } = await supabase
    .from('users')
    .select('id, name, email')
    .eq('id', userId)
    .single();

  if (error) throw error;
  return data;
}

// ❌ Bad: No context, unclear purpose
const d = await db.q('users').w('id', u).s();
```

### When to Update Docs

**Always update docs when:**
- Adding a new feature
- Changing API behavior
- Modifying deployment process
- Discovering common errors
- Learning new best practices

**Documentation Review Process:**
1. Write docs alongside code (not after)
2. Include docs in PR reviews
3. Test all code examples
4. Verify all links work
5. Check for outdated information

### File Naming Conventions

- **Numbered directories:** `00-GETTING-STARTED/`, `01-ARCHITECTURE/`, etc.
- **Main docs:** `UPPER_CASE.md` (e.g., `ARCHITECTURE.md`)
- **Subdirectory docs:** `kebab-case.md` (e.g., `getting-started-developers.md`)
- **Feature docs:** Organized in subdirectories by feature

---

## Archive

**Location:** [docs/ARCHIVE/](ARCHIVE/)

Contains historical documentation that may be outdated but preserved for reference:

- **[ARCHIVE/analysis/](ARCHIVE/analysis/)** - Performance analysis reports
- **[ARCHIVE/forensics/](ARCHIVE/forensics/)** - Debugging investigation reports
- **[ARCHIVE/old-docs/](ARCHIVE/old-docs/)** - Superseded documentation

**When to archive:**
- Documentation for removed features
- Superseded architectural decisions
- Historical performance reports
- Investigation reports that are no longer relevant

**Note:** Archived docs are NOT maintained. Refer to current documentation for accurate information.

---

## Quick Links

### Most Frequently Used
- [API Reference](03-API/reference.md)
- [Testing Guide](04-DEVELOPMENT/testing.md)
- [Architecture Overview](01-ARCHITECTURE/overview.md)
- [Common Errors](06-TROUBLESHOOTING/common-errors.md)

### External Resources
- [Next.js 15 Docs](https://nextjs.org/docs)
- [Supabase Docs](https://supabase.com/docs)
- [React 19 Docs](https://react.dev)
- [OpenAI API Reference](https://platform.openai.com/docs)

### Project Files
- [Main README](../README.md) - Project overview
- [CLAUDE.md](../CLAUDE.md) - Development guidelines
- [TECH_DEBT.md](docs/04-ANALYSIS/ANALYSIS_TECHNICAL_DEBT_TRACKER.md) - Known technical debt
- [CHANGELOG.md](../CHANGELOG.md) - Version history

---

## Need Help?

**Can't find what you're looking for?**

1. Use the search function in your editor (CMD/CTRL + P)
2. Check the [Glossary](00-GETTING-STARTED/glossary.md) for terminology
3. Review [Common Tasks](#common-tasks) above
4. Search in [Archive](ARCHIVE/) for historical docs

**Found an issue with the docs?**
- Fix it and submit a PR
- Include docs updates in feature PRs
- Update this README if adding new categories

---

**Last Updated:** 2025-10-24
**Documentation Version:** 2.0
**Maintained By:** Omniops Team
