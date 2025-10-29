# Documentation Version Matrix

**Last Updated:** 2025-10-24
**Verified Accurate For:** v0.1.0
**Documentation Version:** 2.0
**Application Version:** 0.1.0 (Next Major: 1.0.0)
**Last Comprehensive Review:** 2025-10-24

---

## 📋 Table of Contents

1. [Current Version Status](#current-version-status)
2. [Version Matrix](#version-matrix)
3. [Documentation Update Schedule](#documentation-update-schedule)
4. [Per-Document Version Tracking](#per-document-version-tracking)
5. [Feature Documentation Matrix](#feature-documentation-matrix)
6. [Breaking Changes History](#breaking-changes-history)
7. [Deprecation Timeline](#deprecation-timeline)
8. [Version Compatibility](#version-compatibility)
9. [How to Use This Matrix](#how-to-use-this-matrix)
10. [Automated Version Checking](#automated-version-checking)

---

## Current Version Status

### Application Version: 0.1.0

**Current State:**
- **Status:** Beta / Pre-1.0 Release
- **Database Schema:** v2.0 (Stable)
- **API Version:** v1 (Stable)
- **Documentation:** v2.0 (Comprehensive reorganization completed)

**What's New in Current Version:**
- ✅ Multi-platform commerce support (Shopify + WooCommerce)
- ✅ Dynamic commerce provider registry pattern
- ✅ Optimized test infrastructure (175x faster unit tests)
- ✅ Platform-agnostic product formatting
- ✅ Intelligent caching (60s TTL, 95% reduction in DB queries)
- ✅ Comprehensive documentation reorganization (2025-10-24)

**Next Version Preview (1.0.0 - Estimated Q1 2026):**
- Production-ready status
- Performance optimizations (target <15s response time)
- Adaptive search limits
- Enhanced WooCommerce caching
- Full test coverage (>90%)
- Security audit completion

---

## Version Matrix

| Code Version | Docs Version | Release Date | Key Changes | Breaking Changes |
|--------------|--------------|--------------|-------------|------------------|
| **0.1.0** (Current) | **2.0** | 2025-10-24 | Multi-platform commerce, Shopify integration, documentation reorganization | ⚠️ Commerce provider detection pattern (backwards compatible) |
| 0.0.9 | 1.9 | 2025-01-09 | GPT-5-mini migration, performance analysis | None |
| 0.0.8 | 1.8 | 2024-12-15 | Smart periodic scraper, GDPR telemetry | None |
| 0.0.7 | 1.7 | 2024-11-20 | WooCommerce abandoned carts, stock tracking | None |
| 0.0.6 | 1.6 | 2024-10-30 | Hallucination prevention system | None |
| 0.0.5 | 1.5 | 2024-10-01 | Intelligent chat improvements | None |
| 0.0.4 | 1.4 | 2024-09-15 | Multi-tenant architecture refinement | Database RLS changes |
| 0.0.3 | 1.3 | 2024-08-20 | Web scraping background jobs | Redis requirement added |
| 0.0.2 | 1.2 | 2024-07-15 | WooCommerce integration | Credential encryption required |
| 0.0.1 | 1.0 | 2024-06-01 | Initial MVP release | N/A |

---

## Documentation Update Schedule

### Real-Time (Every Code Change)
**Updated immediately when code changes:**

- `07-REFERENCE/REFERENCE_DATABASE_SCHEMA.md` - Database schema reference
- `lib/agents/README.md` - Agent system documentation
- `docs/02-FEATURES/*/README.md` - Feature-specific guides
- API endpoint documentation
- Type definitions and interfaces

### Release-Based (Every Version)
**Updated with each version release:**

- `CHANGELOG.md` - All changes tracked
- `README.md` - Version number, quick start
- `CLAUDE.md` - Development guidelines
- `docs/SEARCH_ARCHITECTURE.md` - Search behavior
- Feature implementation reports

### Monthly Reviews
**Updated first week of each month:**

- Performance metrics and benchmarks
- Test coverage reports
- Monitoring dashboards
- Security audit status
- Dependency updates

### Quarterly Reviews
**Updated every 3 months:**

- Architecture documentation
- Deployment guides
- Training materials
- UX design guides
- Production checklists

### As-Needed Updates
**Updated when triggered by events:**

- Error handling guides (when new patterns emerge)
- Troubleshooting docs (when issues are resolved)
- Migration guides (when breaking changes occur)
- Setup guides (when tools/services change)

---

## Per-Document Version Tracking

### Critical Documentation (Review Monthly)

| Document | Last Updated | Verified Accurate For | Next Review | Status |
|----------|-------------|----------------------|-------------|---------|
| `07-REFERENCE/REFERENCE_DATABASE_SCHEMA.md` | 2025-10-24 | v0.1.0 | 2025-11-24 | ✅ Current |
| `docs/SEARCH_ARCHITECTURE.md` | 2025-10-24 | v0.1.0 | 2025-11-24 | ✅ Current |
| `docs/02-GUIDES/GUIDE_HALLUCINATION_PREVENTION.md` | 2025-10-24 | v0.1.0 | 2025-11-24 | ✅ Current |
| `docs/07-REFERENCE/REFERENCE_PERFORMANCE_OPTIMIZATION.md` | 2025-10-24 | v0.1.0 | 2025-11-24 | ✅ Current |
| `CLAUDE.md` | 2025-10-24 | v0.1.0 | 2025-11-24 | ✅ Current |
| `README.md` | 2025-10-24 | v0.1.0 | 2025-11-24 | ✅ Current |

### Feature Documentation (Review Quarterly)

| Document | Last Updated | Verified Accurate For | Next Review | Status |
|----------|-------------|----------------------|-------------|---------|
| `docs/02-FEATURES/woocommerce/README.md` | 2025-10-24 | v0.1.0 | 2026-01-24 | ✅ Current |
| `docs/02-FEATURES/shopify/README.md` | 2025-10-24 | v0.1.0 | 2026-01-24 | ✅ Current |
| `docs/02-FEATURES/scraping/README.md` | 2025-10-24 | v0.1.0 | 2026-01-24 | ✅ Current |
| `docs/02-FEATURES/chat-system/README.md` | 2025-10-24 | v0.1.0 | 2026-01-24 | ✅ Current |
| `docs/WOOCOMMERCE_INTEGRATION_GUIDE.md` | 2024-11-20 | v0.0.7 | 2026-01-24 | ⚠️ Needs update |
| `docs/PRIVACY_GUIDE.md` | 2024-12-15 | v0.0.8 | 2026-01-24 | ✅ Current |

### Setup & Configuration (Review As-Needed)

| Document | Last Updated | Verified Accurate For | Next Review | Status |
|----------|-------------|----------------------|-------------|---------|
| `docs/00-GETTING-STARTED/QUICK_START.md` | 2025-10-24 | v0.1.0 | As-needed | ✅ Current |
| `docs/00-GETTING-STARTED/MODEL_CONFIGURATION.md` | 2025-01-09 | v0.0.9 | As-needed | ✅ Current |
| `docs/00-GETTING-STARTED/SETUP_DOCKER_PRODUCTION.md` | 2024-10-30 | v0.0.6 | As-needed | ✅ Current |
| `docs/00-GETTING-STARTED/SETUP_DOCKER_PRODUCTION.md` | 2024-10-30 | v0.0.6 | As-needed | ✅ Current |
| `.env.example` | 2025-10-24 | v0.1.0 | As-needed | ✅ Current |

### Reference Documentation (Review Annually)

| Document | Last Updated | Verified Accurate For | Next Review | Status |
|----------|-------------|----------------------|-------------|---------|
| `docs/ARCHITECTURE.md` | 2024-10-01 | v0.0.5 | 2025-10-01 | ⚠️ Needs update |
| `docs/ERROR_HANDLING.md` | 2024-09-15 | v0.0.4 | 2025-09-15 | ✅ Current |
| `docs/UX_DESIGN_GUIDE.md` | 2024-08-20 | v0.0.3 | 2025-08-20 | ✅ Current |
| `docs/STYLING_GUIDE.md` | 2024-07-15 | v0.0.2 | 2025-07-15 | ✅ Current |

---

## Feature Documentation Matrix

**Maps features to their documentation locations and version history.**

| Feature | Primary Documentation | Related Docs | Since Version | Last Updated | Status |
|---------|----------------------|--------------|---------------|--------------|---------|
| **Shopify Integration** | `docs/02-FEATURES/shopify/README.md` | `lib/agents/README.md`, `lib/shopify-api.ts` | v0.1.0 | 2025-10-24 | ✅ Complete |
| **WooCommerce** | `docs/02-FEATURES/woocommerce/README.md` | `docs/WOOCOMMERCE_INTEGRATION_GUIDE.md`, API endpoints | v0.0.2 | 2025-10-24 | ✅ Complete |
| **Chat System** | `docs/02-FEATURES/chat-system/README.md` | `docs/SEARCH_ARCHITECTURE.md`, hallucination prevention | v0.0.1 | 2025-10-24 | ✅ Complete |
| **Web Scraping** | `docs/02-FEATURES/scraping/README.md` | `lib/crawler-config.ts`, job monitoring | v0.0.3 | 2025-10-24 | ✅ Complete |
| **Hallucination Prevention** | `docs/02-GUIDES/GUIDE_HALLUCINATION_PREVENTION.md` | `test-hallucination-prevention.ts` | v0.0.6 | 2025-10-24 | ✅ Complete |
| **Multi-tenant Architecture** | `docs/MULTI_TENANT_SETUP.md` | `07-REFERENCE/REFERENCE_DATABASE_SCHEMA.md`, RLS policies | v0.0.1 | 2024-09-15 | ✅ Complete |
| **Privacy Compliance** | `docs/PRIVACY_GUIDE.md` | GDPR endpoints, data export/deletion | v0.0.1 | 2024-12-15 | ✅ Complete |
| **Commerce Provider Registry** | `CHANGELOG.md` (Unreleased) | `lib/agents/providers/`, `lib/commerce-provider-registry.ts` | v0.1.0 | 2025-10-24 | ✅ Complete |
| **Smart Periodic Scraper** | `docs/SMART_PERIODIC_SCRAPER_*.md` | Migration scripts, API examples | v0.0.8 | 2024-12-15 | ✅ Complete |
| **Abandoned Carts** | `docs/WOOCOMMERCE_ABANDONED_CARTS.md` | WooCommerce endpoints | v0.0.7 | 2024-11-20 | ✅ Complete |
| **Stock Tracking** | `docs/woocommerce/STOCK_TESTING_GUIDE.md` | Stock implementation report | v0.0.7 | 2024-11-20 | ✅ Complete |
| **Embeddings System** | `lib/embeddings.ts` | `docs/SEARCH_ARCHITECTURE.md`, performance docs | v0.0.1 | 2025-01-09 | ✅ Complete |
| **Redis Job Queue** | `lib/redis.ts` | Background worker, scraping jobs | v0.0.3 | 2024-08-20 | ✅ Complete |
| **Rate Limiting** | `lib/rate-limit.ts` | Per-domain throttling | v0.0.1 | 2024-06-01 | ✅ Complete |
| **Credential Encryption** | `docs/ENCRYPTION_IMPLEMENTATION.md` | Migration scripts, AES-256 | v0.0.2 | 2024-07-15 | ✅ Complete |

---

## Breaking Changes History

**Version-by-version list of breaking changes with migration paths.**

### v0.1.0 (2025-10-24)
**⚠️ Commerce Provider Detection Pattern (Backwards Compatible)**

**What Changed:**
- Moved from hardcoded WooCommerce to dynamic commerce provider registry
- Detection order: Shopify → WooCommerce → null
- Configuration-driven platform detection

**Breaking?** No - fully backwards compatible
**Migration Required?** No - automatic detection
**Action Needed:** None (existing WooCommerce integrations continue working)

**Benefits:**
- Supports multiple commerce platforms (Shopify + WooCommerce)
- Extensible for future platforms (BigCommerce, Magento, etc.)
- Improved performance with intelligent caching

---

### v0.0.4 (2024-09-15)
**Database RLS (Row Level Security) Changes**

**What Changed:**
- Updated RLS policies for improved security
- Modified `customer_configs` and `conversations` tables
- Added domain-based isolation

**Breaking?** Yes - requires database migration
**Migration Required?** Yes - automatic via Supabase migrations
**Action Needed:**
```bash
npm run migrate:rls-updates
```

**Impact:**
- Existing data preserved
- Access patterns remain the same
- Enhanced multi-tenant isolation

---

### v0.0.3 (2024-08-20)
**Redis Requirement for Background Jobs**

**What Changed:**
- Web scraping moved to background job queue
- Redis now required for scraping functionality

**Breaking?** Yes - new infrastructure requirement
**Migration Required?** No (data structure unchanged)
**Action Needed:**
```bash
# Install Redis
brew install redis

# Start Redis
npm run redis:start

# Or use Docker
docker-compose up redis -d
```

**Impact:**
- Web scraping won't work without Redis
- Existing scraped data unaffected
- Job monitoring now available

---

### v0.0.2 (2024-07-15)
**WooCommerce Credential Encryption**

**What Changed:**
- All WooCommerce credentials must be encrypted (AES-256)
- Plain-text credentials no longer accepted

**Breaking?** Yes - security requirement
**Migration Required?** Yes - one-time migration script
**Action Needed:**
```bash
npm run migrate:encrypt-credentials
```

**Impact:**
- Existing credentials automatically encrypted
- No manual re-entry required
- Enhanced security compliance

---

## Deprecation Timeline

**Features marked for deprecation with removal schedule and migration paths.**

### Currently Deprecated

| Feature | Deprecated In | Removal In | Migration Path | Status |
|---------|--------------|------------|----------------|---------|
| **Old scraping API** (`/api/scrape/legacy`) | v0.0.8 | v1.0.0 | Use `/api/scrape` with job queue | ⚠️ Active warning |
| **Direct WooCommerce imports** | v0.1.0 | v1.5.0 | Use commerce provider registry | ℹ️ Backwards compatible |
| **Plain-text credentials** | v0.0.2 | v0.0.3 | Use encrypted credentials | ❌ Removed |

### Scheduled for Deprecation

| Feature | Deprecation Version | Removal Version | Alternative | Timeline |
|---------|-------------------|----------------|-------------|----------|
| **Environment-based config** | v1.0.0 | v2.0.0 | Database-driven config | Q1 2026 - Q4 2026 |
| **Single-tenant mode** | v1.5.0 | v2.5.0 | Full multi-tenant architecture | Q3 2026 - Q2 2027 |
| **GPT-4 (non-mini)** | v0.0.9 | v1.0.0 | GPT-5-mini (default) | Already migrated |

### Migration Guides

**Old Scraping API → New Job Queue**
```typescript
// ❌ Deprecated (sync, blocks request)
const result = await fetch('/api/scrape/legacy', {
  method: 'POST',
  body: JSON.stringify({ domain: 'example.com' })
});

// ✅ Current (async, background job)
const job = await fetch('/api/scrape', {
  method: 'POST',
  body: JSON.stringify({ domain: 'example.com' })
});
const jobId = job.id;
// Monitor via /api/jobs/{jobId}
```

**Direct WooCommerce → Commerce Provider Registry**
```typescript
// ❌ Deprecated (hardcoded WooCommerce)
import { WooCommerceProvider } from './providers/woocommerce-provider';
const provider = new WooCommerceProvider(config);

// ✅ Current (dynamic platform detection)
import { resolveCommerceProvider } from './commerce-provider-registry';
const provider = await resolveCommerceProvider(domain);
// Auto-detects: Shopify, WooCommerce, or returns null
```

---

## Version Compatibility

**External dependencies and API version compatibility matrix.**

### Database Schema Versions

| Schema Version | Code Version | Migration Required | Breaking Changes |
|----------------|--------------|-------------------|------------------|
| **v2.0** (Current) | v0.1.0+ | Auto-applied | None |
| v1.9 | v0.0.9 | Auto-applied | None |
| v1.8 | v0.0.8 | Auto-applied | Added telemetry tables |
| v1.7 | v0.0.7 | Auto-applied | Added stock tracking |
| v1.6 | v0.0.6 | Auto-applied | None |
| v1.5 | v0.0.5 | Auto-applied | None |
| v1.4 | v0.0.4 | Auto-applied | RLS policy changes |
| v1.0 | v0.0.1-v0.0.3 | Manual required | Initial schema |

### External API Versions

| Service | Supported Versions | Recommended | Notes |
|---------|-------------------|-------------|-------|
| **OpenAI** | GPT-4, GPT-4-turbo, GPT-5-mini | GPT-5-mini | 83% cost reduction, 50% faster |
| **Supabase** | PostgreSQL 15+ | PostgreSQL 15.6 | Requires pgvector extension |
| **WooCommerce API** | v3 | v3 (latest) | v2 not supported |
| **Shopify Admin API** | 2024-07+ | 2024-10 | GraphQL + REST hybrid |
| **Redis** | 6.0+ | 7.0+ | BullMQ requires 6.0 minimum |
| **Node.js** | 18.17+, 20+ | 20.x LTS | Next.js 15 requirement |
| **Next.js** | 15.1+ | 15.1.3 | React 19 support |
| **React** | 19.0+ | 19.0.0 | Server Components |

### Browser Compatibility (Chat Widget)

| Browser | Minimum Version | Recommended | Notes |
|---------|----------------|-------------|-------|
| Chrome | 90+ | Latest | Full support |
| Firefox | 88+ | Latest | Full support |
| Safari | 14+ | Latest | Full support |
| Edge | 90+ | Latest | Chromium-based |
| Mobile Safari | iOS 14+ | Latest | Full support |
| Mobile Chrome | Android 90+ | Latest | Full support |

### Tool & Framework Versions

| Tool | Required Version | Current | Compatibility |
|------|-----------------|---------|---------------|
| TypeScript | 5.0+ | 5.x | ✅ Compatible |
| Playwright | 1.40+ | 1.55.0 | ✅ Compatible |
| Jest | 29.0+ | 29.7.0 | ✅ Compatible |
| Tailwind CSS | 3.3+ | 3.3.0 | ✅ Compatible |
| Docker | 20.10+ | 28.3.2 | ✅ Compatible |
| Docker Compose | 2.0+ | 2.29.7 | ✅ Compatible |

---

## How to Use This Matrix

### For Developers

**When starting work on the codebase:**

1. **Check Application Version**
   ```bash
   cat package.json | grep version
   # Should match "Current Version Status" above
   ```

2. **Verify Documentation Currency**
   - Check "Per-Document Version Tracking" table
   - Look for ⚠️ warnings on docs you'll use
   - Review "Next Review" dates

3. **Check Breaking Changes**
   - Review "Breaking Changes History" for your version
   - Follow migration guides if upgrading

4. **Validate External Dependencies**
   - Check "Version Compatibility" section
   - Ensure your environment matches requirements

**When updating code:**

1. **Update Related Documentation**
   - Find doc in "Per-Document Version Tracking"
   - Update content and "Last Updated" date
   - Update "Verified Accurate For" version

2. **Check for Breaking Changes**
   - Will this break existing integrations?
   - Add to "Breaking Changes History"
   - Create migration guide if needed

3. **Update Feature Matrix**
   - Add new features to "Feature Documentation Matrix"
   - Update "Since Version" and "Last Updated"
   - Mark status: ✅ Complete, 🚧 WIP, ⚠️ Deprecated

### For Users/Integrators

**When integrating the platform:**

1. **Identify Your Version**
   - Check package.json or API version endpoint
   - Find matching row in "Version Matrix"

2. **Review Compatibility**
   - Check "Version Compatibility" for your stack
   - Ensure external services match requirements

3. **Check Feature Availability**
   - Use "Feature Documentation Matrix"
   - Verify feature exists in your version ("Since Version")

4. **Plan Upgrades**
   - Review "Breaking Changes History"
   - Check "Deprecation Timeline"
   - Follow migration guides

### Review Procedures

**Monthly Review Checklist:**

```markdown
- [ ] Update "Last Updated" date in this document
- [ ] Review all docs marked for monthly review
- [ ] Update "Verified Accurate For" versions
- [ ] Check for outdated ⚠️ warnings
- [ ] Verify external API versions still valid
- [ ] Update "Next Review" dates
```

**Release Review Checklist:**

```markdown
- [ ] Update "Current Version Status"
- [ ] Add row to "Version Matrix"
- [ ] Update CHANGELOG.md
- [ ] Document any breaking changes
- [ ] Update feature matrix with new features
- [ ] Update all "Last Updated" for changed docs
- [ ] Run automated version audit script
- [ ] Tag release in git
- [ ] Update deployment docs if needed
```

**Quarterly Review Checklist:**

```markdown
- [ ] Review all quarterly docs for accuracy
- [ ] Update architecture documentation
- [ ] Review deprecation timeline
- [ ] Check for deprecated features to remove
- [ ] Update setup/deployment guides
- [ ] Verify browser compatibility matrix
- [ ] Review external dependency versions
- [ ] Update training materials
```

---

## Automated Version Checking

### Version Audit Script

**Location:** `scripts/audit-doc-versions.ts`

**Usage:**
```bash
# Run full audit
npx tsx scripts/audit-doc-versions.ts

# Check specific document
npx tsx scripts/audit-doc-versions.ts --doc=07-REFERENCE/REFERENCE_DATABASE_SCHEMA.md

# Generate report
npx tsx scripts/audit-doc-versions.ts --report
```

**What it checks:**
- ✅ Documentation version matches code version
- ✅ All docs have "Last Updated" dates
- ✅ No docs are overdue for review
- ✅ External API versions are current
- ✅ Breaking changes are documented
- ✅ Deprecated features have migration paths

### Automated Update Triggers

**GitHub Actions workflow** (`.github/workflows/doc-version-check.yml`):

```yaml
# Runs on every PR and release
- Check doc versions match code version
- Warn if critical docs are outdated
- Fail if breaking changes undocumented
- Generate version report artifact
```

### Version Mismatch Detection

**Pre-commit hook** checks:
```bash
# .husky/pre-commit
npx tsx scripts/check-doc-versions.ts --quick
```

**Detects:**
- Documentation referencing wrong versions
- Outdated API endpoint examples
- Missing migration guides
- Deprecated features still documented as current

### What to Update After Releases

**Automated (CI/CD handles):**
- ✅ Version numbers in package.json
- ✅ Git tags
- ✅ Changelog entry creation
- ✅ Documentation version numbers

**Manual (Developer must update):**
- ⚠️ This version-matrix.md file
- ⚠️ Breaking changes documentation
- ⚠️ Migration guides
- ⚠️ Feature matrix entries
- ⚠️ Deprecation timeline

**Checklist template** (copy to PR description):
```markdown
## Documentation Updates Checklist

- [ ] Updated `docs/.metadata/version-matrix.md`
  - [ ] Current Version Status
  - [ ] Version Matrix table
  - [ ] Per-Document tracking
  - [ ] Feature matrix (if applicable)
  - [ ] Breaking changes (if applicable)
  - [ ] Deprecation timeline (if applicable)
- [ ] Updated CHANGELOG.md
- [ ] Updated affected feature docs
- [ ] Created migration guide (if breaking)
- [ ] Ran `npx tsx scripts/audit-doc-versions.ts`
- [ ] All checks passed ✅
```

---

## Metadata

**This Document:**
- **Created:** 2025-10-24
- **Last Updated:** 2025-10-24
- **Next Review:** 2025-11-24 (1 month)
- **Maintained By:** Development Team
- **Review Frequency:** Monthly (first week of month)
- **Version:** 1.0

**Related Documentation:**
- [CHANGELOG.md](../../CHANGELOG.md) - Detailed version changes
- [README.md](../../README.md) - Quick start and overview
- [CLAUDE.md](../../CLAUDE.md) - Development guidelines
- [07-REFERENCE/REFERENCE_DATABASE_SCHEMA.md](docs/07-REFERENCE/REFERENCE_DATABASE_SCHEMA.md) - Database reference

**External Resources:**
- [Semantic Versioning](https://semver.org/)
- [Keep a Changelog](https://keepachangelog.com/)
- [Documentation Best Practices](https://www.writethedocs.org/)

---

## Version History of This Document

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | 2025-10-24 | Initial creation with comprehensive version tracking | System |

---

**Questions or Issues?**
- File an issue: GitHub Issues
- Documentation updates: Submit PR with updated version matrix
- Version audit failures: Review checklist and update docs

