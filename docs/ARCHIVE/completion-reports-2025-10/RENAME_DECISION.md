# Decision: Rename "customer" Terminology?

**Date:** 2025-10-29
**Question:** Should we rename scraper_configs.customer_id (and related naming)?
**Status:** 🤔 **RECOMMENDATION PROVIDED**

---

## 🎯 The Problem You Identified

**Core Issue:** The word "customer" is overloaded and confusing throughout the codebase.

```
❌ CURRENT (Confusing):
- customer_configs table (not about customers!)
- scraper_configs.customer_id (references customer_configs.id)
- customerId parameter (really means "config ID")

✅ SHOULD BE (Clear):
- domain_configs table (or website_configs)
- scraper_configs.domain_config_id
- domainConfigId or configId parameter
```

---

## 📊 Impact Analysis

### Current References Count
| Item | Count | Complexity |
|------|-------|------------|
| `customer_configs` table refs | 50+ | High |
| `customer_id` column refs | 40+ | Medium |
| `customerId` parameters | 30+ | Medium |
| API routes with `/customer/` | 6+ | Medium |

**Total Scope:** ~120+ code locations would be affected by full rename

---

## ⚖️ Options Comparison

### Option 1: Quick Fix - Rename scraper_configs.customer_id Only
**What:** Just fix the immediate confusion point

**Changes:**
- Column: `customer_id` → `domain_config_id`
- 2 code files
- 1 migration

**Pros:**
- ✅ Low risk (isolated change)
- ✅ Quick (2-3 hours)
- ✅ Immediate clarity improvement
- ✅ No breaking changes

**Cons:**
- ❌ Doesn't fix root cause
- ❌ customer_configs still confusing
- ❌ Inconsistent naming (some renamed, some not)

**Effort:** 🟡 2-3 hours

---

### Option 2: Systematic Rename - Fix Root Cause
**What:** Rename entire "customer" concept → "domain_config"

**Changes:**
- Table: `customer_configs` → `domain_configs`
- Columns: all `customer_id` → `domain_config_id`
- Parameters: all `customerId` → `domainConfigId`
- API routes: `/customer/config` → `/domain/config`
- 120+ code locations

**Pros:**
- ✅ Fixes root cause completely
- ✅ Self-documenting codebase
- ✅ Eliminates all confusion
- ✅ Professional architecture

**Cons:**
- ❌ Breaking API change (major version bump)
- ❌ High effort (10-15 hours)
- ❌ Requires coordination with API consumers
- ❌ Risk of missing references

**Effort:** 🔴 10-15 hours

---

### Option 3: Document and Move On
**What:** Leave naming as-is, just document the confusion

**Changes:**
- Update architecture docs
- Add code comments
- Team communication

**Pros:**
- ✅ Zero risk
- ✅ Minimal effort (30 minutes)
- ✅ No breaking changes

**Cons:**
- ❌ Confusion remains forever
- ❌ Every new developer faces learning curve
- ❌ Technical debt accumulates
- ❌ Looks unprofessional in code reviews

**Effort:** 🟢 30 minutes

---

## 💡 Recommended Approach

### **Phase 1: Quick Win (NOW) ✅**

**Do:** Rename scraper_configs.customer_id → domain_config_id

**Why:**
- Isolated change (2 files)
- Low risk (table is empty)
- Immediate improvement
- Doesn't break anything

**Implementation:**
```sql
-- Migration
ALTER TABLE scraper_configs
RENAME COLUMN customer_id TO domain_config_id;

-- Update 2 code files
lib/scraper-config-manager-persistence.ts
lib/scraper-config-manager-loaders.ts
```

**Estimated Time:** 2-3 hours

---

### **Phase 2: Systematic Rename (FUTURE) 🔮**

**Do:** Full "customer" → "domain_config" rename

**When:** During next major version (v2.0)

**Why Wait:**
- Breaking change requires major version
- Can batch with other breaking changes
- Time to notify API consumers
- Plan migration path

**Prerequisites:**
1. Document current API contracts
2. Create deprecation notices
3. Build backward compatibility layer
4. Coordinate with stakeholders

**Estimated Time:** 10-15 hours (spread over sprint)

---

## 🎯 Immediate Recommendation

### **YES - Rename scraper_configs.customer_id Now**

**Decision:** ✅ Proceed with Option 1 (Quick Fix)

**Rationale:**
1. **Low Risk**
   - Table is empty (0 rows)
   - Only 2 code files affected
   - No API breaking changes

2. **High Value**
   - Removes immediate confusion
   - Sets precedent for better naming
   - Quick win for code quality

3. **Minimal Effort**
   - 2-3 hours total
   - Single migration file
   - Easy to verify

4. **Future-Proof**
   - Doesn't prevent systematic rename later
   - Actually makes it easier (one less thing to change)

---

## 📋 Implementation Plan (Option 1)

### Step 1: Create Migration (30 minutes)
```sql
-- supabase/migrations/20251029_rename_scraper_customer_id.sql
ALTER TABLE scraper_configs
RENAME COLUMN customer_id TO domain_config_id;

-- Update unique constraint name for clarity
ALTER TABLE scraper_configs
RENAME CONSTRAINT scraper_configs_customer_id_key
TO scraper_configs_domain_config_id_key;
```

### Step 2: Update Code (1 hour)
**File 1:** `lib/scraper-config-manager-persistence.ts`
```typescript
// Before
await supabase
  .from('scraper_configs')
  .upsert({
    customer_id: customerId,  // ❌ Old
    config: config
  });

// After
await supabase
  .from('scraper_configs')
  .upsert({
    domain_config_id: domainConfigId,  // ✅ New
    config: config
  });
```

**File 2:** `lib/scraper-config-manager-loaders.ts`
```typescript
// Before
.eq('customer_id', customerId)  // ❌ Old

// After
.eq('domain_config_id', domainConfigId)  // ✅ New
```

### Step 3: Update Function Signatures (30 minutes)
```typescript
// Before
async function saveToDatabase(
  supabase: SupabaseClient,
  customerId: string,  // ❌ Confusing name
  config: ScraperConfig
)

// After
async function saveToDatabase(
  supabase: SupabaseClient,
  domainConfigId: string,  // ✅ Clear name
  config: ScraperConfig
)
```

### Step 4: Test & Verify (30 minutes)
- Run TypeScript compilation
- Run test suite
- Verify migration applies cleanly
- Check for any missed references

### Step 5: Document (30 minutes)
- Update ARCHITECTURE_DATA_MODEL.md
- Add migration notes
- Update code comments

**Total Time:** 2.5-3 hours

---

## 🔮 Future Systematic Rename (v2.0)

### Trigger Conditions
Consider full rename when:
- Planning next major version (v2.0)
- Have 2+ week sprint for refactoring
- API consumers notified 3+ months in advance
- Can coordinate breaking changes

### Scope
- [ ] Rename table: `customer_configs` → `domain_configs`
- [ ] Update all column refs: `customer_id` → `domain_config_id`
- [ ] Rename parameters: `customerId` → `domainConfigId`
- [ ] Update API routes: `/customer/config` → `/domain/config`
- [ ] Update frontend code
- [ ] Update API documentation
- [ ] Create deprecation notices
- [ ] Build backward compatibility layer

### Estimated Effort
- Migration creation: 2 hours
- Code updates: 6-8 hours
- Testing: 2-3 hours
- Documentation: 1-2 hours
- **Total:** 11-15 hours

---

## ✅ Decision Matrix

| Criteria | Option 1 (Quick) | Option 2 (Full) | Option 3 (Document) |
|----------|------------------|-----------------|---------------------|
| **Effort** | 🟡 3 hours | 🔴 15 hours | 🟢 30 min |
| **Risk** | 🟢 Low | 🔴 Medium | 🟢 None |
| **Clarity Gain** | ⭐⭐⭐ Good | ⭐⭐⭐⭐⭐ Excellent | ⭐ Minimal |
| **Breaking Changes** | 0 | Many | 0 |
| **Timeline** | Today | v2.0 (months) | Today |
| **ROI** | High | Medium | Low |

---

## 🎓 Lessons & Principles

### Why This Matters

**Good Naming is Architecture:**
- Names communicate intent
- Bad names = cognitive debt
- Every developer pays the "confusion tax"
- 10 developers × 10 minutes lost = 100 minutes wasted

**The Cost of Confusion:**
```
New developer sees: customer_configs.id

Questions they ask:
1. Is this about end-users? (No)
2. Is this about billing customers? (No)
3. Is this about WooCommerce customers? (No)
4. What IS it about? (Domain/website configs)

Time lost: 5-15 minutes per developer
Total cost: Hours of accumulated confusion
```

### Architectural Principle
**"Names should reveal intent without explanation"**

```
❌ customer_configs.id (requires explanation)
✅ domain_configs.id (self-explanatory)

❌ customerId (ambiguous)
✅ domainConfigId (clear)
```

---

## 📊 Final Recommendation

```
╔════════════════════════════════════════════════════════╗
║        RENAME scraper_configs.customer_id NOW          ║
╠════════════════════════════════════════════════════════╣
║ Action:          Rename to domain_config_id            ║
║ Effort:          2-3 hours                             ║
║ Risk:            🟢 Low (empty table, 2 files)         ║
║ Value:           🟢 High (immediate clarity)           ║
║ Breaking Changes: None                                 ║
║ Recommendation:  ✅ DO IT NOW                          ║
╠════════════════════════════════════════════════════════╣
║ Future:          Full rename in v2.0 (months away)     ║
║ Effort:          10-15 hours                           ║
║ Risk:            🟡 Medium (breaking changes)          ║
║ Value:           🟢 Excellent (fixes root cause)       ║
║ Recommendation:  🔮 PLAN FOR LATER                     ║
╚════════════════════════════════════════════════════════╝
```

---

## 🚀 Next Steps

### Immediate (Today)
1. ✅ Create migration for scraper_configs rename
2. ✅ Update 2 code files
3. ✅ Run tests
4. ✅ Deploy

### Near Term (This Sprint)
5. ✅ Document the naming convention
6. ✅ Update team on new pattern
7. ✅ Code review new PRs for naming

### Long Term (v2.0 Planning)
8. 🔮 Create RFC for systematic rename
9. 🔮 Get stakeholder buy-in
10. 🔮 Plan migration strategy
11. 🔮 Notify API consumers
12. 🔮 Implement in major version

---

**Decision:** ✅ YES, rename scraper_configs.customer_id → domain_config_id NOW

**Your Instinct:** 🎯 100% correct - the naming IS confusing and SHOULD be fixed

**Approach:** Start with quick win, plan systematic fix for later

---

🤖 Generated with [Claude Code](https://claude.com/claude-code)

**Created:** 2025-10-29
**Status:** Ready for implementation
