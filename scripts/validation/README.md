# Validation Scripts

**Purpose:** Data validation and system verification utilities
**Last Updated:** 2025-10-30
**Usage:** Run validation scripts from project root

## Overview

This directory contains scripts for validating data integrity, verifying system functionality, and ensuring quality standards are met.

## Available Tools

### validate-price-detection.js
**Purpose:** Validate price extraction and detection accuracy

**Usage:**
```bash
node scripts/validation/validate-price-detection.js
```

**What it validates:**
- Price extraction from scraped content
- Currency symbol detection
- Price formatting consistency
- Price range handling

**Test cases:**
- Single prices (£45.99)
- Price ranges (£20-£50)
- Multiple currencies
- Special formats (from £99)

**Output:**
```
Price Detection Validation

Total test cases: 50
✓ Passed: 47 (94%)
✗ Failed: 3 (6%)

Failed cases:
  - "from £99" detected as "£99" (should be "from £99")
  - "£20-50" detected as "£20" (should be "£20-£50")
  - "EUR 45.99" not detected (currency not supported)

Accuracy: 94%
```

---

### verify-enhanced-features.js
**Purpose:** Verify enhanced feature implementations

**Usage:**
```bash
node scripts/validation/verify-enhanced-features.js
```

**What it verifies:**
- New features work as expected
- Feature flags are properly configured
- No regressions in existing functionality
- Performance within acceptable limits

---

### verify-fixes.js
**Purpose:** Verify bug fixes have been successfully applied

**Usage:**
```bash
node scripts/validation/verify-fixes.js
```

**What it checks:**
- Known bugs are resolved
- Fixes don't introduce new issues
- Edge cases handled correctly
- Performance not degraded

---

### verify-fixes-simple.js
**Purpose:** Simplified verification of common fixes

**Usage:**
```bash
node scripts/validation/verify-fixes-simple.js
```

---

### verify-playwright-setup.js
**Purpose:** Verify Playwright test environment is configured correctly

**Usage:**
```bash
node scripts/validation/verify-playwright-setup.js
```

**What it verifies:**
- Playwright installed
- Browsers downloaded
- Test configuration valid
- Can launch browsers

---

### verify-supabase.js
**Purpose:** Verify Supabase connectivity and configuration

**Usage:**
```bash
node scripts/validation/verify-supabase.js
```

**What it verifies:**
- Supabase URL is reachable
- API keys are valid
- Database connection works
- Required tables exist
- RLS policies active

**Output:**
```
Supabase Validation

Connection:
  ✓ URL reachable (https://xxx.supabase.co)
  ✓ Anon key valid
  ✓ Service role key valid

Database:
  ✓ Connection successful (45ms)
  ✓ All required tables exist (31/31)
  ✓ RLS enabled on sensitive tables
  ✓ pgvector extension installed

Overall: HEALTHY
```

---

### quick-validation-check.js
**Purpose:** Quick validation of common system components

**Usage:**
```bash
node scripts/validation/quick-validation-check.js
```

**What it checks:**
- Database connectivity
- Redis connectivity
- API endpoints responding
- Basic functionality working

**Use case:** Fast smoke test before deployment

---

## Common Workflows

### Pre-Deployment Validation

```bash
# 1. Quick smoke test
node scripts/validation/quick-validation-check.js

# 2. Verify Supabase
node scripts/validation/verify-supabase.js

# 3. Verify fixes
node scripts/validation/verify-fixes.js

# 4. Validate prices
node scripts/validation/validate-price-detection.js

# 5. Full system test
npx tsx scripts/tests/test-complete-system.ts
```

### Post-Fix Validation

```bash
# 1. Apply fix
# ... make changes ...

# 2. Verify fix
node scripts/validation/verify-fixes-simple.js

# 3. Check for regressions
node scripts/validation/verify-enhanced-features.js

# 4. Full validation
node scripts/validation/verify-fixes.js
```

### Setup Validation

```bash
# 1. Verify environment
node scripts/validation/verify-supabase.js

# 2. Verify Playwright
node scripts/validation/verify-playwright-setup.js

# 3. Quick check all systems
node scripts/validation/quick-validation-check.js
```

## Validation Criteria

### Price Detection
- **Target accuracy:** ≥95%
- **Supported currencies:** GBP (£), USD ($), EUR (€)
- **Formats:** Single, ranges, "from" prices

### Feature Verification
- **All features:** Must pass functional tests
- **Performance:** No >10% degradation
- **No regressions:** Existing features still work

### Supabase Connection
- **Response time:** <100ms for queries
- **All tables:** Must exist and be accessible
- **RLS:** Must be enabled on sensitive tables

## Prerequisites

```bash
# Environment variables
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```

## Adding New Validation Scripts

Template:
```javascript
#!/usr/bin/env node
/**
 * Validation: [What this validates]
 * Purpose: [Why this validation is needed]
 */

const validate = async () => {
  const results = {
    passed: 0,
    failed: 0,
    total: 0,
  };

  // Run validation tests
  // ...

  // Report results
  console.log(`Validation Results:`);
  console.log(`  Passed: ${results.passed}/${results.total}`);
  console.log(`  Failed: ${results.failed}/${results.total}`);

  // Exit with appropriate code
  process.exit(results.failed === 0 ? 0 : 1);
};

validate();
```

## Integration with CI/CD

```yaml
# .github/workflows/validate.yml
- name: Run validations
  run: |
    node scripts/validation/quick-validation-check.js
    node scripts/validation/verify-supabase.js
    node scripts/validation/validate-price-detection.js
```

## Troubleshooting

### "Validation failing"
```bash
# Run in verbose mode
node scripts/validation/verify-fixes.js --verbose

# Check specific component
node scripts/validation/verify-supabase.js

# Review error logs
```

### "Supabase validation timeout"
```bash
# Check if Supabase is accessible
curl -I $NEXT_PUBLIC_SUPABASE_URL

# Verify API keys
echo $SUPABASE_SERVICE_ROLE_KEY

# Check network connectivity
```

### "Price detection accuracy low"
```bash
# Review failed test cases
node scripts/validation/validate-price-detection.js --show-failures

# Update price extraction regex
# In: lib/content-extractor.ts

# Re-run validation
node scripts/validation/validate-price-detection.js
```

## Related Scripts

- **Tests:** `scripts/tests/` - Full test suite
- **Analysis:** `scripts/analysis/` - Diagnostic tools
- **Monitoring:** `scripts/monitoring/` - System monitoring

## Related Documentation

- [Testing Philosophy](../../CLAUDE.md#testing--code-quality-philosophy)
- [Price Detection](../../docs/price-detection.md)
- [Supabase Configuration](../../supabase/README.md)
- [Main Scripts README](../README.md)
