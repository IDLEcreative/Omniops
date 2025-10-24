# How to Run Database Integrity Checks

This guide shows you how to run all the database integrity checks for the organization migration.

## Quick Start

Run all checks in sequence:

```bash
# 1. Full integrity check
npx tsx check-organization-integrity.ts

# 2. Table structure analysis
npx tsx check-table-structure.ts

# 3. RLS and security verification
npx tsx check-rls-via-sql.ts

# 4. RLS policy recommendations
npx tsx verify-rls-policies.ts
```

## What Each Script Does

### 1. check-organization-integrity.ts

**Purpose**: Comprehensive database integrity check

**Checks**:
- NULL organization_ids in critical tables
- RLS policies on organization-based tables
- Orphaned records without valid organization references
- Cross-organization data isolation
- Foreign key relationships

**Expected Output**:
- Summary of issues found by severity (CRITICAL, HIGH, MEDIUM, LOW)
- Detailed recommendations for each issue
- Data counts and relationship verification

**Run Time**: ~10 seconds

---

### 2. check-table-structure.ts

**Purpose**: Analyze table schema and organization relationships

**Checks**:
- Table column structure
- Presence of organization_id and domain_id columns
- Organization data summary (counts)
- Data relationship chains (org → domain → content)

**Expected Output**:
- Table schemas with column lists
- Organization hierarchy visualization
- Sample data with relationship verification

**Run Time**: ~5 seconds

---

### 3. check-rls-via-sql.ts

**Purpose**: Verify RLS and security constraints

**Checks**:
- RLS enabled status on tables
- Foreign key constraint enforcement
- Index recommendations
- Organization isolation testing

**Expected Output**:
- Service role access verification
- Foreign key test results
- Isolation test results
- Index recommendations

**Run Time**: ~5 seconds

---

### 4. verify-rls-policies.ts

**Purpose**: Generate RLS policy recommendations and identify missing policies

**Checks**:
- RLS enabled status via pg_tables
- Existing policies via pg_policies
- Service role bypass verification
- Missing policy identification

**Expected Output**:
- List of missing policies by table
- SQL examples for creating policies
- Direct link to Supabase Dashboard

**Run Time**: ~5 seconds

---

## Understanding the Output

### ✅ Green Checkmarks
Everything is working correctly. No action needed.

### ⚠️ Yellow Warnings
These require verification but may be expected behavior.
- Example: "Service role bypasses RLS" (expected)
- Example: "Table has no organization_id" (if it uses domain_id instead)

### ❌ Red X Marks
Issues that need attention.
- NULL organization_ids in core tables
- Orphaned records
- Missing foreign keys
- Missing RLS policies

### 🔴 CRITICAL Issues
Must be fixed before production. Security or data integrity problems.

### 🟠 HIGH Issues
Should be fixed soon. May affect functionality or security.

### 🟡 MEDIUM Issues
Should be addressed. Performance or usability issues.

### 🟢 LOW Issues
Nice to have. Minor improvements.

---

## Reading the Reports

### INTEGRITY_CHECK_SUMMARY.md
**Quick executive summary** - Read this first
- Overall status
- Critical findings
- Required actions
- Next steps

### ORGANIZATION_MIGRATION_INTEGRITY_REPORT.md
**Full detailed report** - Comprehensive documentation
- All test results
- Complete schema analysis
- Detailed recommendations
- Performance considerations

---

## Common Scenarios

### Scenario 1: First Time Check

Run all scripts to get a baseline:

```bash
npx tsx check-organization-integrity.ts > results/integrity-check.txt
npx tsx check-table-structure.ts > results/table-structure.txt
npx tsx check-rls-via-sql.ts > results/rls-check.txt
npx tsx verify-rls-policies.ts > results/rls-policies.txt
```

Then review the summary:
```bash
cat INTEGRITY_CHECK_SUMMARY.md
```

### Scenario 2: After Adding RLS Policies

Verify policies were added correctly:

```bash
npx tsx verify-rls-policies.ts
```

Look for:
- ✅ Policies exist for each table
- ✅ All CRUD operations covered
- ✅ Policies filter by organization membership

### Scenario 3: Before Production Deploy

Full verification checklist:

```bash
# 1. Check data integrity
npx tsx check-organization-integrity.ts

# 2. Verify no orphaned records
# Look for: "No orphaned records found"

# 3. Verify RLS policies
npx tsx verify-rls-policies.ts
# Look for: All policies exist

# 4. Test user isolation
npx tsx test-user-isolation-example.ts test
# Look for: No cross-org access

# 5. Review final report
cat INTEGRITY_CHECK_SUMMARY.md
```

### Scenario 4: Adding New Organization Table

When you add a new table with organization_id:

```bash
# 1. Check structure
npx tsx check-table-structure.ts

# 2. Verify foreign keys
npx tsx check-rls-via-sql.ts

# 3. Get RLS policy template
npx tsx verify-rls-policies.ts
# Copy the policy examples

# 4. Full integrity check
npx tsx check-organization-integrity.ts
```

---

## Troubleshooting

### Error: "Could not find the table 'pg_policies'"

**Cause**: Supabase doesn't expose system tables via the client API

**Solution**: This is expected. The scripts will show warnings but continue.
You need to verify RLS policies manually in the Supabase Dashboard.

### Error: "Service role bypasses RLS"

**Cause**: Service role key has full database access

**Solution**: This is correct behavior. To test RLS:
1. Create test users
2. Get their JWT tokens
3. Use `test-user-isolation-example.ts`

### Warning: "Column organization_id does not exist"

**Check**: Does the table use domain_id instead?

**Tables that should have organization_id**:
- customer_configs ✅
- domains ✅
- organizations ✅
- organization_members ✅

**Tables that should use domain_id** (indirect link):
- scraped_pages ✅
- page_embeddings ✅
- conversations ✅
- structured_extractions ✅

**Tables that use conversation_id** (nested link):
- messages ✅

### No Issues Found But Worried?

Run the full test suite:

```bash
# Create a results directory
mkdir -p integrity-results

# Run all checks
npx tsx check-organization-integrity.ts > integrity-results/1-integrity.log 2>&1
npx tsx check-table-structure.ts > integrity-results/2-structure.log 2>&1
npx tsx check-rls-via-sql.ts > integrity-results/3-rls.log 2>&1
npx tsx verify-rls-policies.ts > integrity-results/4-policies.log 2>&1

# Review all results
cat integrity-results/*.log | grep -E "(❌|CRITICAL|HIGH)"
```

If no red flags, you're good!

---

## Next Steps After Running Checks

Based on the output:

### If All ✅ Green
1. Verify RLS policies in Supabase Dashboard
2. Test with user tokens
3. Document any remaining TODOs

### If ⚠️ Warnings
1. Review each warning
2. Check if it's expected (e.g., indirect links)
3. Document exceptions

### If ❌ Errors
1. Prioritize by severity (CRITICAL → HIGH → MEDIUM → LOW)
2. Fix CRITICAL issues immediately
3. Plan fixes for HIGH/MEDIUM issues
4. Document LOW issues for later

---

## Getting Help

If you see unexpected results:

1. **Check the full report**: `ORGANIZATION_MIGRATION_INTEGRITY_REPORT.md`
2. **Review table structure**: Run `check-table-structure.ts`
3. **Verify foreign keys**: Run `check-rls-via-sql.ts`
4. **Check schema**: Compare with expected structure in docs

Still stuck?
- Review the Supabase schema in `/SUPABASE_SCHEMA.md` (if exists)
- Check migrations in `/migrations/` directory
- Review organization table definitions

---

## Automation

Add to your CI/CD pipeline:

```yaml
# .github/workflows/integrity-check.yml
name: Database Integrity Check
on: [push, pull_request]

jobs:
  integrity:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - run: npm install
      - run: npx tsx check-organization-integrity.ts
      - run: npx tsx check-table-structure.ts
      - run: npx tsx check-rls-via-sql.ts
```

---

## Files Reference

**Test Scripts**:
- `/Users/jamesguy/Omniops/check-organization-integrity.ts`
- `/Users/jamesguy/Omniops/check-table-structure.ts`
- `/Users/jamesguy/Omniops/check-rls-via-sql.ts`
- `/Users/jamesguy/Omniops/verify-rls-policies.ts`
- `/Users/jamesguy/Omniops/test-user-isolation-example.ts`

**Reports**:
- `/Users/jamesguy/Omniops/INTEGRITY_CHECK_SUMMARY.md` (Quick summary)
- `/Users/jamesguy/Omniops/ORGANIZATION_MIGRATION_INTEGRITY_REPORT.md` (Full report)
- `/Users/jamesguy/Omniops/RUN_INTEGRITY_CHECKS.md` (This file)

**Run All Checks**:
```bash
npx tsx check-organization-integrity.ts && \
npx tsx check-table-structure.ts && \
npx tsx check-rls-via-sql.ts && \
npx tsx verify-rls-policies.ts
```
