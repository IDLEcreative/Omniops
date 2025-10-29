# Documentation Migration Plan: AI Discoverability Standards

**Date:** 2025-10-29  
**Scope:** 808 markdown files across entire repository  
**Target:** Implement documentation standards from CLAUDE.md (lines 83-379)  
**Estimated Effort:** 20-30 hours (parallelizable across 4 agents)

---

## Executive Summary

### Inventory Results

**Total Files:** 808 markdown files
- **docs/ folder:** 606 files (75% of total)
- **Root level:** 139 completion reports (17%)
- **ARCHIVE:** 298 files (37% - already archived)
- **Other locations:** 63 files (__tests__, app/, components/)

### Current State Assessment

**Compliance Status:**
- ✅ **Well-Structured:** ~30 files (4%)
  - Files in numbered directories with metadata
  - Examples: database-schema.md, hallucination-prevention.md
- ⚠️ **Partially Compliant:** ~250 files (31%)
  - Correct location but missing metadata/TOC
  - Examples: Most files in docs/01-ARCHITECTURE/ through docs/06-TROUBLESHOOTING/
- ❌ **Non-Compliant:** ~530 files (66%)
  - 139 root-level completion reports (need archiving)
  - 229 docs/ root files (need categorization)
  - Legacy unnumbered directories

### Critical Issues

1. **Mass File Dumping:** 229 files directly in docs/ root (should be in categorized folders)
2. **Root Pollution:** 139 completion/implementation reports at project root
3. **Missing Metadata:** 95% of files lack required metadata headers
4. **No TOCs:** Long files (>100 lines) missing navigation
5. **Broken Links:** Many cross-references use relative paths without full structure
6. **Inconsistent Naming:** Generic names like "IMPLEMENTATION_SUMMARY.md" (which implementation?)

---

## Section A: Inventory Summary

### By Location
```
/Users/jamesguy/Omniops/
├── Root Level: 139 files
│   ├── Agent Reports: 16 files (AGENT_*.md)
│   ├── Completion Reports: 45 files (*_COMPLETE.md, *_COMPLETION_*.md)
│   ├── Implementation Reports: 22 files (*_IMPLEMENTATION*.md)
│   ├── Phase/PR Reports: 15 files (PHASE*.md, PR4*.md)
│   ├── Testing Reports: 18 files (*_TEST*.md, *_VALIDATION*.md)
│   ├── Technical Docs: 20 files (TECH_DEBT.md, NPX_SCRIPTS*.md, etc.)
│   └── Security/Optimization: 3 files
│
├── docs/ (606 files)
│   ├── 00-GETTING-STARTED/: 4 files ✅
│   ├── 01-ARCHITECTURE/: 4 files ⚠️
│   ├── 02-FEATURES/: 7 files ⚠️
│   ├── 03-API/: 1 file ⚠️
│   ├── 04-DEVELOPMENT/: 5 files ⚠️
│   ├── 05-DEPLOYMENT/: 3 files ⚠️
│   ├── 06-TROUBLESHOOTING/: 1 file ⚠️
│   ├── 07-REFERENCE/: 0 files (empty)
│   ├── .metadata/: 3 files ✅
│   ├── ARCHIVE/: 298 files (keep as-is)
│   ├── Unnumbered folders: ~50 files
│   │   ├── api/, features/, implementation/
│   │   ├── reports/, scraper/, setup/
│   │   ├── technical-reference/, woocommerce/, wireframes/
│   └── Root of docs/: 229 files ❌ (MASSIVE PROBLEM)
│
└── Code folders: 63 files
    ├── __tests__/: READMEs for test structure
    ├── app/api/: API endpoint documentation  
    ├── components/: Component documentation
    └── browser-automation/: Feature-specific docs
```

### By Current Status
- **Active, Well-Structured:** 30 files (4%)
- **Active, Needs Minor Fixes:** 250 files (31%)
- **Active, Needs Major Refactoring:** 230 files (28%)
- **Temporary/Completion Reports:** 139 files (17%) - should archive
- **Already Archived:** 298 files (37%)
- **Code-Adjacent (Keep As-Is):** 63 files (8%)

---

## Section B: File-by-File Migration Matrix

### Priority 0: Critical - Referenced in CLAUDE.md (5 files)

| Current Path | Category | New Name | New Location | Missing | Priority | Status |
|-------------|----------|----------|--------------|---------|----------|--------|
| docs/01-ARCHITECTURE/search-architecture.md | ARCHITECTURE | ARCHITECTURE_SEARCH_SYSTEM.md | docs/01-ARCHITECTURE/ | Metadata, TOC, Keywords | P0 | Active |
| docs/01-ARCHITECTURE/performance-optimization.md | REFERENCE | REFERENCE_PERFORMANCE_OPTIMIZATION.md | docs/07-REFERENCE/ | Metadata, TOC | P0 | Active |
| docs/01-ARCHITECTURE/database-schema.md | REFERENCE | REFERENCE_DATABASE_SCHEMA.md | docs/07-REFERENCE/ | Keywords only | P0 | Active |
| docs/02-FEATURES/chat-system/hallucination-prevention.md | GUIDE | GUIDE_HALLUCINATION_PREVENTION.md | docs/02-GUIDES/ | Metadata, Keywords | P0 | Active |
| docs/setup/DOCKER_README.md | SETUP | SETUP_DOCKER_PRODUCTION.md | docs/00-GETTING-STARTED/ | Metadata, TOC | P0 | Active |

### Priority 1: High Value Architecture & References (15 files)

| Current Path | Category | New Name | New Location | Missing | Priority |
|-------------|----------|----------|--------------|---------|----------|
| docs/ARCHITECTURE_DATA_MODEL.md | ARCHITECTURE | ARCHITECTURE_DATA_MODEL.md | docs/01-ARCHITECTURE/ | Metadata, TOC, Move | P1 |
| docs/WOOCOMMERCE_ARCHITECTURE_ANALYSIS.md | ANALYSIS | ANALYSIS_WOOCOMMERCE_ARCHITECTURE.md | docs/04-ANALYSIS/ | Metadata, TOC, Move | P1 |
| docs/STRIPE_INTEGRATION.md | INTEGRATION | INTEGRATION_STRIPE_BILLING.md | docs/06-INTEGRATIONS/ | Metadata, TOC, Move | P1 |
| docs/WOOCOMMERCE_COMPREHENSIVE_EXPANSION_PLAN.md | ANALYSIS | ANALYSIS_WOOCOMMERCE_EXPANSION_PLAN.md | docs/04-ANALYSIS/ | Metadata, TOC, Move | P1 |
| docs/WOOCOMMERCE_CUSTOMIZATION.md | GUIDE | GUIDE_WOOCOMMERCE_CUSTOMIZATION.md | docs/02-GUIDES/ | Metadata, TOC, Move | P1 |
| TECH_DEBT.md | ANALYSIS | ANALYSIS_TECHNICAL_DEBT_TRACKER.md | docs/04-ANALYSIS/ | Metadata, Move | P1 |
| NPX_SCRIPTS_IMPLEMENTATION.md | REFERENCE | REFERENCE_NPX_SCRIPTS.md | docs/07-REFERENCE/ | Metadata, TOC, Move | P1 |
| docs/SECURITY_MODEL.md | ARCHITECTURE | ARCHITECTURE_SECURITY_MODEL.md | docs/01-ARCHITECTURE/ | Metadata, TOC, Move | P1 |
| docs/DEPENDENCY_INJECTION.md | ARCHITECTURE | ARCHITECTURE_DEPENDENCY_INJECTION.md | docs/01-ARCHITECTURE/ | Metadata, TOC, Move | P1 |
| docs/DASHBOARD.md | REFERENCE | REFERENCE_DASHBOARD_FEATURES.md | docs/07-REFERENCE/ | Metadata, TOC, Move | P1 |
| docs/API.md | REFERENCE | REFERENCE_API_ENDPOINTS.md | docs/03-API/ | Metadata, TOC | P1 |
| docs/API_REFERENCE.md | REFERENCE | REFERENCE_API_COMPLETE.md | docs/03-API/ | Metadata, TOC | P1 |
| docs/TESTING_GUIDE.md | GUIDE | GUIDE_TESTING_STRATEGY.md | docs/04-DEVELOPMENT/testing/ | Metadata, TOC, Move | P1 |
| docs/RLS_TESTING_INFRASTRUCTURE.md | GUIDE | GUIDE_RLS_SECURITY_TESTING.md | docs/04-DEVELOPMENT/testing/ | Metadata, TOC, Move | P1 |
| docs/CUSTOMER_CONFIG_SECURITY.md | ARCHITECTURE | ARCHITECTURE_CUSTOMER_CONFIG_SECURITY.md | docs/01-ARCHITECTURE/ | Metadata, TOC, Move | P1 |

### Priority 2: Active Guides & Setup (20 files)

| Current Path | Category | New Name | New Location | Missing | Priority |
|-------------|----------|----------|--------------|---------|----------|
| docs/setup/QUICK_START.md | SETUP | SETUP_QUICK_START.md | docs/00-GETTING-STARTED/ | Metadata, Move | P2 |
| docs/setup/PROJECT_PLAN.md | SETUP | SETUP_PROJECT_OVERVIEW.md | docs/00-GETTING-STARTED/ | Metadata, Move | P2 |
| docs/setup/MODEL_CONFIGURATION.md | SETUP | SETUP_AI_MODEL_CONFIG.md | docs/00-GETTING-STARTED/ | Metadata, Move | P2 |
| docs/setup/VERCEL_ENV_SETUP.md | SETUP | SETUP_VERCEL_ENVIRONMENT.md | docs/00-GETTING-STARTED/ | Metadata, Move | P2 |
| docs/setup/VERCEL_REDIS_SETUP.md | SETUP | SETUP_VERCEL_REDIS.md | docs/00-GETTING-STARTED/ | Metadata, Move | P2 |
| docs/setup/SECURITY_NOTICE.md | SETUP | SETUP_SECURITY_REQUIREMENTS.md | docs/00-GETTING-STARTED/ | Metadata, Move | P2 |
| docs/DATABASE_CLEANUP.md | GUIDE | GUIDE_DATABASE_CLEANUP.md | docs/02-GUIDES/ | Metadata, TOC, Move | P2 |
| docs/GITHUB_ACTIONS_MONITORING.md | GUIDE | GUIDE_GITHUB_ACTIONS_MONITORING.md | docs/05-DEPLOYMENT/ | Metadata, TOC, Move | P2 |
| docs/MONITORING_SETUP.md | GUIDE | GUIDE_MONITORING_SETUP.md | docs/05-DEPLOYMENT/ | Metadata, TOC, Move | P2 |
| docs/CONVERSATION_ACCURACY_IMPROVEMENTS.md | ANALYSIS | ANALYSIS_CONVERSATION_ACCURACY.md | docs/04-ANALYSIS/ | Metadata, TOC, Move | P2 |
| docs/EXPERT_LEVEL_IMPROVEMENT_PLAN.md | ANALYSIS | ANALYSIS_EXPERT_IMPROVEMENT_PLAN.md | docs/04-ANALYSIS/ | Metadata, TOC, Move | P2 |
| docs/PERFORMANCE_ANALYSIS_INDEX.md | REFERENCE | REFERENCE_PERFORMANCE_ANALYSIS_INDEX.md | docs/07-REFERENCE/ | Metadata, Move | P2 |
| docs/REMEDIATION_PLAN.md | ANALYSIS | ANALYSIS_SECURITY_REMEDIATION.md | docs/04-ANALYSIS/ | Metadata, TOC, Move | P2 |
| docs/BRAND_MONITORING_FLOW.md | GUIDE | GUIDE_BRAND_MONITORING.md | docs/02-GUIDES/ | Metadata, TOC, Move | P2 |
| docs/SYNONYM_SYSTEM.md | ARCHITECTURE | ARCHITECTURE_SYNONYM_SYSTEM.md | docs/01-ARCHITECTURE/ | Metadata, TOC, Move | P2 |
| docs/TELEMETRY_SYSTEM.md | ARCHITECTURE | ARCHITECTURE_TELEMETRY.md | docs/01-ARCHITECTURE/ | Metadata, TOC, Move | P2 |
| docs/SHOPIFY_CONFIGURATION_GUIDE.md | GUIDE | GUIDE_SHOPIFY_CONFIGURATION.md | docs/06-INTEGRATIONS/ | Metadata, TOC, Move | P2 |
| docs/SHOPIFY_UX_IMPLEMENTATION.md | GUIDE | GUIDE_SHOPIFY_UX.md | docs/06-INTEGRATIONS/ | Metadata, TOC, Move | P2 |
| docs/DEBUGGING_ENDPOINTS.md | TROUBLESHOOTING | TROUBLESHOOTING_DEBUG_ENDPOINTS.md | docs/06-TROUBLESHOOTING/ | Metadata, TOC, Move | P2 |
| docs/SECURITY_CONFIGURATION_GUIDE.md | GUIDE | GUIDE_SECURITY_CONFIGURATION.md | docs/02-GUIDES/ | Metadata, TOC, Move | P2 |

### Priority 3: Root-Level Completion Reports (139 files - ARCHIVE)

**Strategy:** Move ALL root-level completion/implementation reports to ARCHIVE

| Pattern | Count | Action | New Location |
|---------|-------|--------|--------------|
| AGENT_*.md | 16 | Archive | docs/ARCHIVE/completion-reports-2025-10/ |
| *_COMPLETE.md | 15 | Archive | docs/ARCHIVE/completion-reports-2025-10/ |
| *_COMPLETION_*.md | 30 | Archive | docs/ARCHIVE/completion-reports-2025-10/ |
| *_IMPLEMENTATION*.md | 22 | Archive | docs/ARCHIVE/completion-reports-2025-10/ |
| PHASE*.md, PR4*.md | 15 | Archive | docs/ARCHIVE/completion-reports-2025-10/ |
| *_TEST*.md, *_VALIDATION*.md | 18 | Archive | docs/ARCHIVE/completion-reports-2025-10/ |
| *_FIX*.md, *_REPORT*.md | 23 | Archive | docs/ARCHIVE/completion-reports-2025-10/ |

**Reason:** These are all temporal completion reports that clutter the root directory and should be archived for historical reference.

### Priority 4: docs/ Root Files (229 files - CATEGORIZE)

**High-Level Breakdown:**
- **Integration Guides:** ~25 files (WOOCOMMERCE_*, SHOPIFY_*, STRIPE_*)
- **Architecture Docs:** ~15 files (ARCHITECTURE_*, *_SYSTEM.md)
- **Implementation Reports:** ~30 files (move to ARCHIVE)
- **Analysis Docs:** ~20 files (*_ANALYSIS.md, *_AUDIT.md)
- **Testing/Performance:** ~25 files
- **Guides:** ~40 files (GUIDE_*, *_SETUP.md, *_IMPLEMENTATION.md)
- **References:** ~30 files (*_REFERENCE.md, *_API.md)
- **Miscellaneous:** ~44 files (needs individual assessment)

**Sample Specific Files:**

| Current Path (docs/) | Category | New Name | New Location |
|---------------------|----------|----------|--------------|
| AGENTS.md | ARCHITECTURE | ARCHITECTURE_AGENT_SYSTEM.md | docs/01-ARCHITECTURE/ |
| ALL_NPX_TOOLS_REFERENCE.md | REFERENCE | REFERENCE_NPX_TOOLS_COMPLETE.md | docs/07-REFERENCE/ |
| ANALYTICS_IMPLEMENTATION.md | GUIDE | GUIDE_ANALYTICS_IMPLEMENTATION.md | docs/02-GUIDES/ |
| ANALYTICS_SUMMARY.md | REFERENCE | REFERENCE_ANALYTICS_OVERVIEW.md | docs/07-REFERENCE/ |
| ARCHITECTURE.md | ARCHITECTURE | ARCHITECTURE_SYSTEM_OVERVIEW.md | docs/01-ARCHITECTURE/ |
| CHAT_SYSTEM_DOCS.md | (redirect) | DELETE - Redirect to docs/02-FEATURES/chat-system/README.md | N/A |
| CODE_ISSUES_FROM_TESTING.md | TROUBLESHOOTING | TROUBLESHOOTING_CODE_ISSUES_FROM_TESTS.md | docs/06-TROUBLESHOOTING/ |
| CUSTOMER_SERVICE_SAAS_INTEGRATION_BLUEPRINT.md | ARCHITECTURE | ARCHITECTURE_SAAS_INTEGRATION.md | docs/01-ARCHITECTURE/ |
| EMBEDDING_SEARCH_GUIDE.md | GUIDE | GUIDE_EMBEDDING_SEARCH.md | docs/02-GUIDES/ |
| ERROR_HANDLING.md | ARCHITECTURE | ARCHITECTURE_ERROR_HANDLING.md | docs/01-ARCHITECTURE/ |
| GETTING_STARTED.md | SETUP | SETUP_GETTING_STARTED.md | docs/00-GETTING-STARTED/ |
| HALLUCINATION_PREVENTION.md | (redirect) | DELETE - Redirect to docs/02-FEATURES/chat-system/hallucination-prevention.md | N/A |
| PRIVACY_COMPLIANCE.md | REFERENCE | REFERENCE_PRIVACY_COMPLIANCE.md | docs/07-REFERENCE/ |
| QUICK_REFERENCE.md | (needs context) | Assess what this references | TBD |

*(Full 229-file breakdown available upon request)*

---

## Section C: Workstream Assignments (4 Parallel Agents)

### Workstream 1: Metadata & Headers Team (Agent 1)

**Mission:** Add required metadata headers to all active documentation

**Scope:** ~550 active files (excluding ARCHIVE, code READMEs)

**Tasks:**
1. **Create Metadata Template Script**
   ```bash
   # For each file, prepend:
   # # [Title from first line]
   #
   # **Type:** [Architecture | Guide | Reference | Analysis | Troubleshooting]
   # **Status:** [Active | Draft | Deprecated]
   # **Last Updated:** 2025-10-29
   # **Verified For:** v0.1.0
   # **Dependencies:** [List related docs]
   # **Estimated Read Time:** X minutes
   #
   # ## Purpose
   # [Extract from first paragraph or write 1-2 sentence summary]
   #
   # ## Quick Links
   # [Extract existing links or leave empty]
   #
   # ## Table of Contents
   # [Auto-generate if file >100 lines]
   ```

2. **Priority Order:**
   - P0 files (5 files) - manual, careful review
   - P1 files (15 files) - semi-automated with review
   - P2 files (20 files) - semi-automated with review
   - docs/ root files (229 files) - automated with spot checks
   - Numbered directory files (25 files) - automated with spot checks

3. **Table of Contents Generation:**
   - Use script to auto-generate TOCs for files >100 lines
   - Format: `- [Section Name](#anchor-link)`

4. **Verification:**
   - Run validation script to check all files have metadata
   - Verify TOCs are accurate
   - Check all "Dependencies" links are valid

**Deliverables:**
- Metadata added to 550 files
- TOCs generated for ~200 long files
- Validation report showing 100% compliance

**Estimated Time:** 6-8 hours

---

### Workstream 2: File Organization Team (Agent 2)

**Mission:** Move, rename, and organize files into proper directory structure

**Tasks:**

1. **Create Directory Structure**
   ```bash
   mkdir -p docs/02-GUIDES
   mkdir -p docs/04-ANALYSIS  
   mkdir -p docs/06-INTEGRATIONS
   mkdir -p docs/ARCHIVE/completion-reports-2025-10
   ```

2. **Priority 0-2 Migrations (40 files):**
   - Move and rename each file per migration matrix above
   - Update git history: `git mv old_path new_path`
   - Maintain file modification dates where possible

3. **Root-Level Completion Reports (139 files):**
   ```bash
   # Batch move all completion reports to ARCHIVE
   git mv AGENT_*.md docs/ARCHIVE/completion-reports-2025-10/
   git mv *_COMPLETE.md docs/ARCHIVE/completion-reports-2025-10/
   git mv *_COMPLETION_*.md docs/ARCHIVE/completion-reports-2025-10/
   git mv *_IMPLEMENTATION*.md docs/ARCHIVE/completion-reports-2025-10/
   git mv PHASE*.md PR4*.md docs/ARCHIVE/completion-reports-2025-10/
   git mv *_TEST*.md *_VALIDATION*.md docs/ARCHIVE/completion-reports-2025-10/
   git mv *_FIX*.md *_REPORT*.md docs/ARCHIVE/completion-reports-2025-10/
   ```

4. **docs/ Root Files Categorization (229 files):**
   - Process by category batches (Integrations, Architecture, Guides, etc.)
   - Move to appropriate numbered directories
   - Rename to follow PREFIX_NAME.md pattern

5. **Legacy Directory Consolidation:**
   - Move docs/setup/* → docs/00-GETTING-STARTED/
   - Move docs/reports/* → docs/ARCHIVE/reports-old/
   - Move docs/implementation/* → docs/ARCHIVE/implementation-old/
   - Consolidate docs/api/, docs/technical-reference/ into docs/03-API/

6. **Create INDEX.md in Each Directory:**
   - Auto-generate index of all files in each numbered directory
   - Include brief description and links to each file

**Deliverables:**
- All P0-P2 files moved and renamed (40 files)
- 139 completion reports archived
- 229 docs/ root files categorized and moved
- Legacy directories consolidated
- INDEX.md in all main directories
- Git history preserved with `git mv`

**Estimated Time:** 8-10 hours

---

### Workstream 3: Cross-Reference Team (Agent 3)

**Mission:** Update all internal links to use full paths and fix broken references

**Tasks:**

1. **Inventory All Cross-References:**
   ```bash
   # Find all markdown links
   grep -r "\[.*\](.*.md" docs/ --include="*.md" > /tmp/all_links.txt
   # Find all relative links
   grep -r "\[.*\](\.\./" docs/ --include="*.md" > /tmp/relative_links.txt
   ```

2. **Convert Relative Links to Full Paths:**
   - Pattern: `[text](../path/doc.md)` → `[text](/Users/jamesguy/Omniops/docs/category/PREFIX_doc.md)`
   - Or use repo-relative: `[text](docs/01-ARCHITECTURE/ARCHITECTURE_doc.md)`

3. **Update Links for Moved Files:**
   - For all files moved by Agent 2, find all references
   - Update to new locations
   - Example: `docs/STRIPE_INTEGRATION.md` → `docs/06-INTEGRATIONS/INTEGRATION_STRIPE_BILLING.md`

4. **Create Redirects for Deprecated Paths:**
   ```markdown
   # DEPRECATED: This file has moved
   
   **New Location:** [INTEGRATION_STRIPE_BILLING.md](docs/06-INTEGRATIONS/INTEGRATION_STRIPE_BILLING.md)
   
   **Reason:** Documentation restructure for AI discoverability (2025-10-29)
   ```

5. **Fix Broken Links:**
   - Identify dead links (files that don't exist)
   - Either find correct target or mark as [BROKEN]
   - Report broken links for manual review

6. **Add Full Paths to CLAUDE.md References:**
   - Update all doc references in CLAUDE.md to use full paths
   - Verify all links work

**Deliverables:**
- All relative links converted to full paths
- All links updated for moved files
- Redirect stubs created for old paths
- Broken links identified and reported
- CLAUDE.md links validated

**Estimated Time:** 6-8 hours

---

### Workstream 4: Content Enhancement Team (Agent 4)

**Mission:** Add keywords, improve structure, annotate code examples

**Tasks:**

1. **Add Keywords/Aliases Section (550 files):**
   ```markdown
   ## Keywords
   [primary term], [synonym 1], [synonym 2], [related concept 1]
   
   ## Aliases
   - "customer_configs" (also known as: customer settings, config table)
   - "embeddings" (also known as: vectors, semantic search data)
   ```
   - Extract from filename, headings, and content
   - Add common search terms

2. **Code Example Annotation (Priority Files):**
   - Find all code blocks in P0-P2 files
   - Add context comments:
     ```typescript
     // Purpose: [What does this do?]
     // Used by: [Which files use this?]
     // Context: [When would you use this?]
     [code here]
     ```

3. **Structure Improvements:**
   - Add "Quick Start" sections to guides
   - Add "Common Use Cases" to architecture docs
   - Add "Troubleshooting" sections to setup guides
   - Ensure inverted pyramid structure (critical info first)

4. **Cross-Reference Enhancement:**
   - Add "See Also" sections to related docs
   - Add "Prerequisites" sections where needed
   - Link to related code files

5. **Create Missing Anchor Links:**
   - Add `{#anchor-name}` to all major headings
   - Ensure headings are linkable
   - Update internal references to use anchors

6. **Build Glossary (New File):**
   - Create `docs/07-REFERENCE/REFERENCE_GLOSSARY.md`
   - Extract all key terms from documentation
   - Define each term consistently
   - Link from other docs

**Deliverables:**
- Keywords added to all active files
- Code examples annotated in P0-P2 files
- Structure improvements in guides
- Anchor links added
- Comprehensive glossary created

**Estimated Time:** 6-8 hours

---

## Section D: Directory Structure to Create

```
docs/
├── .metadata/                              # (exists) Version tracking, maintenance
│   ├── DOCUMENTATION_MAINTENANCE_SCHEDULE.md
│   ├── README.md
│   └── version-matrix.md
│
├── 00-GETTING-STARTED/                     # (exists) Quick start, setup, prerequisites
│   ├── brand-agnostic-checklist.md
│   ├── for-developers.md
│   ├── for-devops.md
│   ├── glossary.md
│   ├── SETUP_QUICK_START.md               # (move from setup/)
│   ├── SETUP_DOCKER_PRODUCTION.md         # (move from setup/)
│   ├── SETUP_PROJECT_OVERVIEW.md          # (move from setup/)
│   ├── SETUP_AI_MODEL_CONFIG.md           # (move from setup/)
│   ├── SETUP_VERCEL_ENVIRONMENT.md        # (move from setup/)
│   ├── SETUP_VERCEL_REDIS.md              # (move from setup/)
│   ├── SETUP_SECURITY_REQUIREMENTS.md     # (move from setup/)
│   ├── SETUP_GETTING_STARTED.md           # (move from docs/)
│   └── INDEX.md                           # (create)
│
├── 01-ARCHITECTURE/                        # (exists) System design, patterns, data models
│   ├── database-schema.md → REFERENCE_DATABASE_SCHEMA.md (move to 07-REFERENCE)
│   ├── decisions.md
│   ├── performance-optimization.md → REFERENCE_PERFORMANCE_OPTIMIZATION.md (move to 07-REFERENCE)
│   ├── search-architecture.md → ARCHITECTURE_SEARCH_SYSTEM.md
│   ├── ARCHITECTURE_DATA_MODEL.md         # (move from docs/)
│   ├── ARCHITECTURE_SECURITY_MODEL.md     # (move from docs/)
│   ├── ARCHITECTURE_DEPENDENCY_INJECTION.md # (move from docs/)
│   ├── ARCHITECTURE_AGENT_SYSTEM.md       # (move from docs/)
│   ├── ARCHITECTURE_SYSTEM_OVERVIEW.md    # (move from docs/)
│   ├── ARCHITECTURE_SAAS_INTEGRATION.md   # (move from docs/)
│   ├── ARCHITECTURE_ERROR_HANDLING.md     # (move from docs/)
│   ├── ARCHITECTURE_SYNONYM_SYSTEM.md     # (move from docs/)
│   ├── ARCHITECTURE_TELEMETRY.md          # (move from docs/)
│   ├── ARCHITECTURE_CUSTOMER_CONFIG_SECURITY.md # (move from docs/)
│   └── INDEX.md                           # (create)
│
├── 02-GUIDES/                              # (create) Step-by-step how-to instructions
│   ├── GUIDE_HALLUCINATION_PREVENTION.md  # (move from 02-FEATURES/chat-system/)
│   ├── GUIDE_WOOCOMMERCE_CUSTOMIZATION.md # (move from docs/)
│   ├── GUIDE_DATABASE_CLEANUP.md          # (move from docs/)
│   ├── GUIDE_MONITORING_SETUP.md          # (move from docs/)
│   ├── GUIDE_BRAND_MONITORING.md          # (move from docs/)
│   ├── GUIDE_SECURITY_CONFIGURATION.md    # (move from docs/)
│   ├── GUIDE_ANALYTICS_IMPLEMENTATION.md  # (move from docs/)
│   ├── GUIDE_EMBEDDING_SEARCH.md          # (move from docs/)
│   ├── GUIDE_TESTING_STRATEGY.md          # (move from docs/)
│   ├── GUIDE_RLS_SECURITY_TESTING.md      # (move from docs/)
│   └── INDEX.md                           # (create)
│
├── 02-FEATURES/                            # (exists) Feature documentation
│   ├── chat-system/
│   │   ├── CONSOLIDATION_SUMMARY.md
│   │   ├── QUICK_REFERENCE.md
│   │   ├── README.md
│   │   └── hallucination-prevention.md → (move to 02-GUIDES/)
│   ├── scraping/
│   │   ├── CONSOLIDATION_REPORT.md
│   │   └── README.md
│   └── woocommerce/
│       └── README.md
│
├── 03-API/                                 # (exists) API documentation
│   ├── README.md
│   ├── REFERENCE_API_ENDPOINTS.md         # (move from docs/)
│   ├── REFERENCE_API_COMPLETE.md          # (move from docs/)
│   └── INDEX.md                           # (create)
│
├── 04-ANALYSIS/                            # (create) Problem analysis, decisions, investigations
│   ├── ANALYSIS_WOOCOMMERCE_ARCHITECTURE.md  # (move from docs/)
│   ├── ANALYSIS_WOOCOMMERCE_EXPANSION_PLAN.md # (move from docs/)
│   ├── ANALYSIS_TECHNICAL_DEBT_TRACKER.md    # (move from root)
│   ├── ANALYSIS_CONVERSATION_ACCURACY.md     # (move from docs/)
│   ├── ANALYSIS_EXPERT_IMPROVEMENT_PLAN.md   # (move from docs/)
│   ├── ANALYSIS_SECURITY_REMEDIATION.md      # (move from docs/)
│   └── INDEX.md                              # (create)
│
├── 04-DEVELOPMENT/                         # (exists) Development workflows, patterns
│   ├── code-patterns/
│   │   ├── adding-agents-providers.md
│   │   ├── adding-api-endpoints.md
│   │   └── adding-database-tables.md
│   └── testing/
│       ├── README.md
│       ├── GUIDE_TESTING_STRATEGY.md      # (move from docs/)
│       └── GUIDE_RLS_SECURITY_TESTING.md  # (move from docs/)
│
├── 05-DEPLOYMENT/                          # (exists) Deployment guides
│   ├── production-checklist.md
│   ├── runbooks.md
│   ├── GUIDE_GITHUB_ACTIONS_MONITORING.md # (move from docs/)
│   ├── GUIDE_MONITORING_SETUP.md          # (move from docs/)
│   └── INDEX.md                           # (create)
│
├── 06-INTEGRATIONS/                        # (create) Third-party integration guides
│   ├── INTEGRATION_STRIPE_BILLING.md      # (move from docs/)
│   ├── INTEGRATION_WOOCOMMERCE.md         # (consolidate from docs/woocommerce/)
│   ├── INTEGRATION_SHOPIFY.md             # (consolidate from docs/)
│   ├── GUIDE_SHOPIFY_CONFIGURATION.md     # (move from docs/)
│   ├── GUIDE_SHOPIFY_UX.md                # (move from docs/)
│   └── INDEX.md                           # (create)
│
├── 06-TROUBLESHOOTING/                     # (exists) Common problems & solutions
│   ├── README.md
│   ├── TROUBLESHOOTING_DEBUG_ENDPOINTS.md # (move from docs/)
│   ├── TROUBLESHOOTING_CODE_ISSUES_FROM_TESTS.md # (move from docs/)
│   └── INDEX.md                           # (create)
│
├── 07-REFERENCE/                           # (exists) Complete references, schemas
│   ├── REFERENCE_DATABASE_SCHEMA.md       # (move from 01-ARCHITECTURE/)
│   ├── REFERENCE_PERFORMANCE_OPTIMIZATION.md # (move from 01-ARCHITECTURE/)
│   ├── REFERENCE_NPX_SCRIPTS.md           # (move from root)
│   ├── REFERENCE_DASHBOARD_FEATURES.md    # (move from docs/)
│   ├── REFERENCE_ANALYTICS_OVERVIEW.md    # (move from docs/)
│   ├── REFERENCE_PRIVACY_COMPLIANCE.md    # (move from docs/)
│   ├── REFERENCE_PERFORMANCE_ANALYSIS_INDEX.md # (move from docs/)
│   ├── REFERENCE_NPX_TOOLS_COMPLETE.md    # (move from docs/)
│   ├── REFERENCE_GLOSSARY.md              # (create)
│   └── INDEX.md                           # (create)
│
└── ARCHIVE/                                # (exists) Historical documentation
    ├── completion-reports-2025-10/        # (create) - Move all root completion reports here
    │   ├── AGENT_*.md                     # (139 files from root)
    │   ├── *_COMPLETE.md
    │   ├── *_COMPLETION_*.md
    │   ├── *_IMPLEMENTATION*.md
    │   ├── PHASE*.md, PR4*.md
    │   └── ...
    ├── reports-old/                       # (create) - Move docs/reports/ here
    ├── implementation-old/                # (create) - Move docs/implementation/ here
    ├── analysis/                          # (exists) - 298 existing archived files
    ├── forensics/
    ├── documentation-overhaul-2025-10/
    └── ...existing archive structure...
```

**Summary of Changes:**
- **Create:** docs/02-GUIDES/, docs/04-ANALYSIS/, docs/06-INTEGRATIONS/
- **Create:** docs/ARCHIVE/completion-reports-2025-10/
- **Populate:** Move 40 P0-P2 files to proper locations
- **Archive:** Move 139 root completion reports to ARCHIVE
- **Categorize:** Move 229 docs/ root files to numbered directories
- **Consolidate:** Merge legacy unnumbered directories into numbered structure
- **Generate:** INDEX.md for each main directory

---

## Section E: Risk Assessment

### High-Risk Areas

1. **Broken Links (High Impact)**
   - **Risk:** Moving 400+ files will break thousands of internal links
   - **Mitigation:** Agent 3 dedicated to updating all cross-references
   - **Validation:** Run link checker before and after migration
   - **Fallback:** Create redirect stubs for all moved files

2. **Git History Loss (Medium Impact)**
   - **Risk:** File moves might obscure git history
   - **Mitigation:** Use `git mv` instead of delete+create
   - **Validation:** Test `git log --follow` on sample files
   - **Fallback:** Document original paths in metadata headers

3. **External References (Medium Impact)**
   - **Risk:** External tools/scripts might reference old paths
   - **Mitigation:** Keep redirect stubs for 90 days minimum
   - **Validation:** Search codebase for hardcoded doc paths
   - **Affected:** CLAUDE.md, README.md, CI/CD configs

4. **Metadata Inaccuracy (Low Impact)**
   - **Risk:** Auto-generated metadata might be incorrect
   - **Mitigation:** Manual review of P0-P1 files
   - **Validation:** Spot-check 10% of automated files
   - **Fallback:** Iterate with user feedback

5. **File Naming Conflicts (Low Impact)**
   - **Risk:** Multiple files might map to same new name
   - **Mitigation:** Run conflict detection script before rename
   - **Validation:** Check for duplicate filenames
   - **Fallback:** Add disambiguating suffixes (_V2, _OLD, etc.)

### Files with External Dependencies

| File | Referenced By | Action Required |
|------|---------------|-----------------|
| docs/HALLUCINATION_PREVENTION.md | CLAUDE.md line 367 | Update CLAUDE.md link |
| docs/setup/DOCKER_README.md | README.md, CLAUDE.md | Update both files |
| NPX_SCRIPTS_IMPLEMENTATION.md | Multiple scripts | Update script comments |
| TECH_DEBT.md | GitHub issues | Add redirect stub |
| docs/WOOCOMMERCE_*.md | WooCommerce integration code | Add redirect stubs |

### Validation Checkpoints

**Before Migration:**
- [ ] Backup entire repository
- [ ] Run link inventory script
- [ ] Document all external references
- [ ] Test git mv on sample files

**During Migration:**
- [ ] Agent 1: Validate metadata template on 5 sample files
- [ ] Agent 2: Check for filename conflicts before batch move
- [ ] Agent 3: Validate link updates on moved files incrementally
- [ ] Agent 4: Spot-check keyword accuracy on 10% of files

**After Migration:**
- [ ] Run link checker (broken links < 1%)
- [ ] Verify git history with `git log --follow`
- [ ] Test all CLAUDE.md references
- [ ] Check README.md links
- [ ] Build passes with new paths
- [ ] Spot-check 20 random files for quality

---

## Section F: Execution Strategy

### Parallel Execution Plan

**Phase 1: Preparation (Sequential, 1 hour)**
1. Create backup branch: `git checkout -b docs-migration-2025-10-29-backup`
2. Create working branch: `git checkout -b docs-migration-ai-discoverability`
3. Run pre-migration validation:
   - Inventory all links
   - Check for filename conflicts
   - Document external references
4. Set up shared tracking document for agents

**Phase 2: Parallel Execution (4 agents, 8-10 hours)**

Launch all 4 agents simultaneously:

```
Agent 1 (Metadata Team):       8 hours | P0→P1→P2→docs root→numbered dirs
Agent 2 (Organization Team):  10 hours | P0→P1→P2→root archive→docs root→legacy dirs
Agent 3 (Cross-Reference):     8 hours | Inventory→relative→moved→broken→CLAUDE
Agent 4 (Enhancement):         8 hours | Keywords→code→structure→anchors→glossary
```

**Coordination Points:**
- Hour 2: Agent 2 starts P0-P2 moves → Agent 3 begins updating links for moved files
- Hour 4: Agent 1 completes P0-P2 metadata → Agent 4 can annotate code in those files
- Hour 6: Agent 2 completes root archive → Agent 3 updates those links
- Hour 8: All agents report progress, identify blockers

**Phase 3: Integration (Sequential, 2 hours)**
1. Merge Agent 2 changes (file moves) first
2. Merge Agent 1 changes (metadata) second
3. Merge Agent 3 changes (links) third
4. Merge Agent 4 changes (enhancement) last
5. Resolve any merge conflicts
6. Run final validation

**Phase 4: Validation (Sequential, 2 hours)**
1. Run link checker: `find docs -name "*.md" -exec markdown-link-check {} \;`
2. Validate metadata: Custom script to check all files have headers
3. Check git history: `git log --follow` on sample files
4. Test CLAUDE.md references manually
5. Build and test application
6. Spot-check 20 random files

**Phase 5: Deployment (Sequential, 1 hour)**
1. Create comprehensive commit message documenting changes
2. Push to remote branch
3. Create PR with before/after comparison
4. Update CLAUDE.md to reference new structure
5. Update README.md links
6. Merge to main

**Total Estimated Time:**
- Parallel work: 8-10 hours (wall clock time)
- Sequential work: 6 hours
- **Total wall clock:** 14-16 hours
- **Total effort:** 30-36 hours (parallelized to 14-16 hours)

---

## Section G: Success Metrics

### Quantitative Goals

1. **File Organization**
   - [ ] 0 files in project root (except CLAUDE.md, README.md, CHANGELOG.md, TECH_DEBT.md)
   - [ ] 0 files in docs/ root
   - [ ] All numbered directories have INDEX.md
   - [ ] 95%+ of files follow PREFIX_NAME.md pattern

2. **Metadata Compliance**
   - [ ] 100% of active files have metadata headers
   - [ ] 95%+ of files >100 lines have TOCs
   - [ ] 90%+ of files have keywords section
   - [ ] 85%+ of files have "Purpose" statement

3. **Link Health**
   - [ ] <1% broken links
   - [ ] 100% of moved files have redirect stubs
   - [ ] All CLAUDE.md references validated
   - [ ] All README.md references validated

4. **Code Quality**
   - [ ] P0-P2 code examples annotated (40 files)
   - [ ] Glossary created with 100+ terms
   - [ ] All major headings have anchor links

### Qualitative Goals

- Documentation is **scannable** - Agent can find info in <10 seconds
- Documentation is **navigable** - Clear hierarchy, cross-references work
- Documentation is **current** - Status field shows if doc is active/deprecated
- Documentation is **consistent** - Same terminology throughout
- Documentation is **comprehensive** - Covers all major features and patterns

### Validation Checklist

Before marking migration complete:

- [ ] **User Test:** Can a new developer find setup instructions in <2 minutes?
- [ ] **Agent Test:** Can Claude find WooCommerce architecture docs with one glob command?
- [ ] **Build Test:** Does application build and pass tests with new paths?
- [ ] **Link Test:** Does automated link checker pass?
- [ ] **Git Test:** Is file history preserved for moved files?
- [ ] **Spot Check:** Do 20 random files meet all standards?

---

## Section H: Post-Migration Maintenance

### Ongoing Compliance

**Automated Checks (CI/CD):**
```yaml
# .github/workflows/docs-validation.yml
- name: Validate Documentation
  run: |
    # Check all docs have metadata headers
    npx tsx scripts/validate-doc-metadata.ts
    # Check for broken links
    npx markdown-link-check docs/**/*.md
    # Check for files in wrong locations
    [ $(find docs -maxdepth 1 -name "*.md" | wc -l) -eq 0 ] || exit 1
```

**Monthly Review:**
- Audit for compliance with standards
- Update "Last Updated" dates
- Archive old completion reports
- Check for new files in wrong locations

**Documentation Lifecycle:**
1. **Active:** Current, accurate, well-maintained
2. **Draft:** Work in progress, clearly marked
3. **Deprecated:** Old but kept for reference, link to replacement
4. **Archived:** Historical record, moved to ARCHIVE/

---

## Appendices

### Appendix A: Validation Scripts

**1. Metadata Validator (validate-doc-metadata.ts):**
```typescript
// Check all .md files have required metadata fields
// Report missing: Type, Status, Last Updated, Purpose
```

**2. Link Checker (check-doc-links.ts):**
```typescript
// Find all [text](path.md) links
// Verify target files exist
// Report broken links
```

**3. Filename Pattern Checker:**
```bash
# Check all docs follow PREFIX_NAME.md pattern
find docs/[0-9]* -name "*.md" | grep -v -E "^[A-Z]+_[A-Z_]+\.md$"
```

### Appendix B: Sample Metadata Header Template

```markdown
# [Document Title]

**Type:** [Architecture | Guide | Reference | Analysis | Setup | Testing | Troubleshooting | Integration]
**Status:** [Active | Draft | Deprecated | Archived]
**Last Updated:** YYYY-MM-DD
**Verified For:** vX.X.X
**Dependencies:** 
- [Related Doc 1](full/path/to/doc.md)
- [Related Doc 2](full/path/to/doc.md)
**Estimated Read Time:** X minutes

## Purpose
[1-2 sentence summary of what this document covers and why it exists]

## Quick Links
- [Prerequisite 1](path/to/prerequisite.md)
- [Related Feature](path/to/feature.md)

## Table of Contents
- [Section 1](#section-1)
- [Section 2](#section-2)

## Keywords
[keyword1], [keyword2], [keyword3], [related term]

## Aliases
- "term_in_code" (also known as: common name, alternate term)

---

[Document content starts here]
```

### Appendix C: Full 229-File docs/ Root Breakdown

*(Available as separate detailed spreadsheet upon request)*

Categories identified:
- WOOCOMMERCE_*.md: 15 files → docs/06-INTEGRATIONS/
- SHOPIFY_*.md: 3 files → docs/06-INTEGRATIONS/
- STRIPE_*.md: 3 files → docs/06-INTEGRATIONS/
- ARCHITECTURE_*.md: 5 files → docs/01-ARCHITECTURE/
- ANALYTICS_*.md: 4 files → Mix of 02-GUIDES and 07-REFERENCE
- TESTING_*.md: 12 files → docs/04-DEVELOPMENT/testing/
- DEPLOYMENT_*.md: 6 files → docs/05-DEPLOYMENT/
- SECURITY_*.md: 8 files → Mix of 01-ARCHITECTURE and 02-GUIDES
- *_IMPLEMENTATION.md: 18 files → ARCHIVE (completion reports)
- *_SUMMARY.md: 12 files → ARCHIVE (completion reports)
- [Continue for all 229 files...]

---

## Final Recommendations

### Critical Path
1. **DO FIRST:** Archive 139 root completion reports (clears workspace)
2. **DO SECOND:** Move and rename P0-P2 files (40 files, high value)
3. **DO THIRD:** Categorize docs/ root files (229 files, biggest impact)
4. **DO FOURTH:** Add metadata to all files (enables AI scanning)
5. **DO FIFTH:** Update all cross-references (enables navigation)
6. **DO LAST:** Enhance content with keywords and annotations

### Quick Wins (If Time Constrained)
If you can only do 20% of the work, focus on:
1. Archive root completion reports (1 hour, huge cleanup)
2. Move P0-P1 files to correct locations (2 hours, high value files)
3. Add metadata to P0-P2 files (2 hours, enables scanning)
4. Update CLAUDE.md references (30 minutes, critical)

**Total Quick Win Time:** 5.5 hours
**Impact:** 70% of value achieved

### Long-Term Vision
This migration is Phase 1 of 3:
- **Phase 1 (This Plan):** Structure and organization (14-16 hours)
- **Phase 2 (Future):** Content quality improvements (TBD)
- **Phase 3 (Future):** Automated maintenance and enforcement (TBD)

---

**END OF MIGRATION PLAN**

**Generated:** 2025-10-29  
**By:** Documentation Audit & Planning Specialist (Claude Agent)  
**For:** Omniops Documentation Restructuring  
**Total Files Analyzed:** 808  
**Estimated Effort:** 30-36 hours (parallelizable to 14-16 hours)
