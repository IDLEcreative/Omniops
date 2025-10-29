# Migration Guide: Hardcoded Synonyms → Database-Driven

**Type:** Analysis
**Status:** Active
**Last Updated:** 2025-10-29
**Verified For:** v0.1.0
**Estimated Read Time:** 19 minutes

## Purpose
> **Status**: In Progress > **Target Completion**: TBD > **Impact**: All domains using hardcoded synonyms in `lib/synonym-expander.ts`

## Quick Links
- [Overview](#overview)
- [Current State](#current-state)
- [Migration Steps](#migration-steps)
- [Rollback Plan](#rollback-plan)
- [Success Criteria](#success-criteria)

## Keywords
analysis, criteria, current, decisions, hardcoded, migration, overview, plan, questions, references

---


> **Status**: In Progress
> **Target Completion**: TBD
> **Impact**: All domains using hardcoded synonyms in `lib/synonym-expander.ts`

## Overview

This guide documents the migration from hardcoded synonym mappings to the database-driven synonym system.

---

## Current State

### Hardcoded Synonyms (Deprecated)

**Location**: `lib/synonym-expander.ts` (lines 10-80)

**Issues:**
- ❌ Not multi-tenant (same synonyms for all domains)
- ❌ Cannot be customized per customer
- ❌ Requires code deployment to update
- ❌ Contains industry-specific terminology (violates brand-agnostic principle)

**Example:**
```typescript
private static synonymMap: Record<string, string[]> = {
  "pump": ["hydraulic pump", "fluid pump", "pumping unit"],
  "tank": ["reservoir", "container", "vessel", "storage"],
  "forest equipment": ["forest loader", "forestry", "logging equipment"],
  // ... 70+ hardcoded mappings
};
```

### New System (Recommended)

**Location**:
- `lib/synonym-loader.ts` (service)
- `app/api/synonyms/route.ts` (API)
- Database tables: `domain_synonym_mappings`, `global_synonym_mappings`

**Benefits:**
- ✅ Multi-tenant (per-domain customization)
- ✅ Database-driven (no code deployment needed)
- ✅ Admin UI ready (future enhancement)
- ✅ Brand-agnostic (each tenant defines their own terms)

---

## Migration Steps

### Phase 1: Extract Hardcoded Synonyms (Manual)

**Goal:** Export existing synonyms to JSON for import.

**Script:**
```typescript
// extract-synonyms.ts
import { SynonymExpander } from './lib/synonym-expander';
import fs from 'fs';

// Access the private synonymMap (for migration purposes)
const synonymMap = {
  // Copy from lib/synonym-expander.ts lines 10-80
  "pump": ["hydraulic pump", "fluid pump", "pumping unit"],
  "tank": ["reservoir", "container", "vessel", "storage"],
  "forest equipment": ["forest loader", "forestry", "logging equipment"],
  // ... (complete list)
};

// Convert to database format
const synonymsForImport = Object.entries(synonymMap).map(([term, synonyms]) => ({
  term: term.toLowerCase(),
  synonyms: synonyms.map(s => s.toLowerCase()),
  priority: 5, // Default priority
  category: classifyTerm(term) // Optional categorization
}));

// Save to JSON
fs.writeFileSync(
  'synonyms-export.json',
  JSON.stringify(synonymsForImport, null, 2)
);

console.log(`Exported ${synonymsForImport.length} synonym mappings to synonyms-export.json`);

// Helper to classify terms
function classifyTerm(term: string): string {
  if (term.includes('forest') || term.includes('agricultural')) return 'equipment';
  if (term.includes('pump') || term.includes('hydraulic')) return 'components';
  if (term.includes('chainsaw') || term.includes('blade')) return 'tools';
  return 'general';
}
```

**Run:**
```bash
npx tsx extract-synonyms.ts
```

**Output:** `synonyms-export.json`

---

### Phase 2: Categorize Synonyms (Decision)

**Question:** Should these synonyms be **global** or **domain-specific**?

| Category | Type | Rationale |
|----------|------|-----------|
| General terms (product, service, price) | **Global** | Universal across all business types |
| Equipment-specific (forest loader, pump) | **Domain-Specific** | Only relevant to specific industries |
| Technical abbreviations (hp, rpm, psi) | **Global** | Common across industries |
| Brand names (CAT, JD) | **Domain-Specific** | Customer may have different brands |

**Recommendation:**
1. **Global synonyms** → Import to `global_synonym_mappings` with `is_safe_for_all = true`
2. **Industry-specific** → Import to `domain_synonym_mappings` for relevant domains only

---

### Phase 3: Import to Database

#### Option A: Import to Global Synonyms

```sql
-- Import universal synonyms to global_synonym_mappings
INSERT INTO global_synonym_mappings (term, synonyms, is_safe_for_all, category)
VALUES
  ('product', ARRAY['item', 'goods', 'merchandise'], true, 'general'),
  ('service', ARRAY['offering', 'solution'], true, 'general'),
  ('price', ARRAY['cost', 'rate', 'fee'], true, 'general'),
  ('available', ARRAY['in stock', 'available now'], true, 'general'),
  ('hp', ARRAY['horsepower', 'power'], true, 'technical'),
  ('rpm', ARRAY['revolutions per minute', 'speed'], true, 'technical'),
  ('psi', ARRAY['pounds per square inch', 'pressure'], true, 'technical')
ON CONFLICT (term) DO UPDATE SET
  synonyms = EXCLUDED.synonyms,
  updated_at = NOW();
```

#### Option B: Import to Domain-Specific Synonyms

```typescript
// import-domain-synonyms.ts
import { createClient } from '@supabase/supabase-js';
import synonymsData from './synonyms-export.json';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function importSynonyms(domainId: string) {
  console.log(`Importing ${synonymsData.length} synonyms for domain ${domainId}...`);

  for (const { term, synonyms, priority } of synonymsData) {
    const { error } = await supabase
      .from('domain_synonym_mappings')
      .upsert({
        domain_id: domainId,
        term,
        synonyms,
        priority: priority || 5,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'domain_id,term'
      });

    if (error) {
      console.error(`Error importing "${term}":`, error);
    } else {
      console.log(`✅ Imported: ${term}`);
    }
  }

  console.log('✅ Import complete!');
}

// Get domain ID from command line
const domainId = process.argv[2];
if (!domainId) {
  console.error('Usage: npx tsx import-domain-synonyms.ts <domainId>');
  process.exit(1);
}

importSynonyms(domainId);
```

**Run:**
```bash
npx tsx import-domain-synonyms.ts <your-domain-id>
```

---

### Phase 4: Update Code References

**Find all usages:**
```bash
grep -r "SynonymExpander" lib/ app/ --include="*.ts" --include="*.tsx"
```

**Update imports:**
```typescript
// OLD (deprecated)
import { SynonymExpander } from '@/lib/synonym-expander';
const expanded = SynonymExpander.expandQuery(query);

// NEW (database-driven)
import { synonymLoader } from '@/lib/synonym-loader';
const expanded = await synonymLoader.expandQuery(domainId, query);
```

**Note:** The new API is **async**, so you'll need to update function signatures.

---

### Phase 5: Test & Verify

**1. Test synonym loading:**
```bash
npx tsx test-synonym-system.ts
```

**2. Test API endpoints:**
```bash
# Get synonyms
curl "http://localhost:3000/api/synonyms?domainId=<your-domain-id>"

# Test query expansion
curl -X PATCH "http://localhost:3000/api/synonyms/expand" \
  -H "Content-Type: application/json" \
  -d '{"domainId":"<your-domain-id>","query":"need pump"}'
```

**3. Test in production:**
- Deploy changes
- Monitor logs for errors
- Verify search quality hasn't degraded

---

### Phase 6: Deprecate Hardcoded System

**1. Mark as deprecated:**
```typescript
// lib/synonym-expander.ts
/**
 * @deprecated This class is deprecated. Use {@link synonymLoader} from lib/synonym-loader.ts
 *
 * Reason: Hardcoded synonyms violate multi-tenant architecture.
 * Migration: See docs/MIGRATION_HARDCODED_SYNONYMS.md
 */
export class SynonymExpander {
  // ...
}
```

**2. Add migration warning:**
```typescript
export class SynonymExpander {
  static expandQuery(query: string, maxExpansions?: number): string {
    console.warn(
      '[DEPRECATED] SynonymExpander.expandQuery() is deprecated. ' +
      'Use synonymLoader.expandQuery(domainId, query) instead. ' +
      'See docs/MIGRATION_HARDCODED_SYNONYMS.md'
    );
    // ...
  }
}
```

**3. Schedule removal:**
- Set removal date (e.g., 3 months from migration start)
- Add TODO comments
- Create tracking issue

---

## Rollback Plan

If issues arise, you can roll back by:

1. **Keep old code:** Don't delete `lib/synonym-expander.ts` immediately
2. **Feature flag:** Add environment variable to toggle between old/new
3. **Gradual migration:** Migrate one domain at a time

```typescript
// Rollback mechanism
import { synonymLoader } from '@/lib/synonym-loader';
import { SynonymExpander } from '@/lib/synonym-expander';

const USE_DATABASE_SYNONYMS = process.env.USE_DATABASE_SYNONYMS === 'true';

async function expandQuery(domainId: string, query: string): Promise<string> {
  if (USE_DATABASE_SYNONYMS) {
    return await synonymLoader.expandQuery(domainId, query);
  } else {
    return SynonymExpander.expandQuery(query); // Fallback
  }
}
```

---

## Success Criteria

- [ ] All hardcoded synonyms exported to JSON
- [ ] Synonyms imported to database (global or domain-specific)
- [ ] All code references updated to use `synonymLoader`
- [ ] Tests pass (`npx tsx test-synonym-system.ts`)
- [ ] API endpoints functional
- [ ] Search quality maintained or improved
- [ ] Legacy code marked as deprecated
- [ ] Migration documented

---

## Timeline

| Phase | Duration | Status |
|-------|----------|--------|
| Extract synonyms | 1 hour | ⏳ Not started |
| Categorize synonyms | 2 hours | ⏳ Not started |
| Import to database | 1 hour | ⏳ Not started |
| Update code references | 3 hours | ⏳ Not started |
| Test & verify | 2 hours | ⏳ Not started |
| Deploy & monitor | 1 week | ⏳ Not started |
| Deprecate old code | After 1 month | ⏳ Not started |
| **Total** | **~2 weeks** | |

---

## Questions & Decisions

### 1. Should we keep global synonyms?

**Options:**
- A) Migrate all to `global_synonym_mappings` (easy, less flexible)
- B) Migrate to `domain_synonym_mappings` per domain (more work, more flexible)
- C) Hybrid: Universal terms → global, industry-specific → domain

**Recommendation:** Option C (hybrid approach)

### 2. What about existing customers?

**Options:**
- A) Apply default synonyms to all existing domains
- B) Let customers opt-in via admin UI
- C) Auto-apply but allow customization

**Recommendation:** Option A (auto-apply to avoid disruption)

### 3. When to remove legacy code?

**Options:**
- A) Remove immediately (risky)
- B) Remove after 1 month (moderate)
- C) Remove after 3 months (safe)

**Recommendation:** Option C (3 months deprecation period)

---

## References

- **New System**: [docs/01-ARCHITECTURE/ARCHITECTURE_SYNONYM_SYSTEM.md](docs/01-ARCHITECTURE/ARCHITECTURE_SYNONYM_SYSTEM.md)
- **Database Schema**: [docs/07-REFERENCE/REFERENCE_DATABASE_SCHEMA.md](07-REFERENCE/REFERENCE_DATABASE_SCHEMA.md#synonym-management)
- **Legacy Code**: `lib/synonym-expander.ts`, `lib/synonym-expander-dynamic.ts`

---

**Migration Lead**: TBD
**Questions?** Open an issue or contact the engineering team.
