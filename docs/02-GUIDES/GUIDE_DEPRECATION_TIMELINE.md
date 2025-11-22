# Deprecation Timeline: customer_id → organization_id

**Type:** Guide
**Status:** Active
**Last Updated:** 2025-11-22
**Applies To:** All API endpoints, database queries, and client code

## Purpose

Documents the complete deprecation timeline for the `customer_id` → `organization_id` migration. Provides guidance for developers on migrating their code and understanding the deprecation phases.

## Quick Links
- [Current Status](#current-status)
- [Deprecation Phases](#deprecation-phases)
- [Migration Guide](#migration-guide)
- [API Changes](#api-changes)
- [Breaking Changes Timeline](#breaking-changes-timeline)

---

## Current Status

**Phase:** 🟢 **SILENT** (Phase 1 of 4)
**Start Date:** 2025-11-22
**Next Phase:** 2026-02-22 (3 months)

### What This Means

- ✅ All production code migrated to use `organization_id`
- ✅ Database has both `customer_id` and `organization_id` columns
- ✅ Legacy functions still work but log warnings in development
- ✅ No breaking changes for existing code
- ⚠️ New code should use `organization_id` only

---

## Deprecation Phases

### Phase 1: SILENT (Current - 2025-11-22 to 2026-02-22)

**Duration:** 3 months
**Status:** ✅ Active

**What Happens:**
- Code migrated to use `organization_id`
- `customer_id` columns remain in database
- Deprecation warnings logged in **development only**
- No production warnings or errors
- Full backward compatibility maintained

**Action Required:**
- Review your code for `customer_id` usage
- Plan migration to `organization_id`
- No immediate changes required

**Example Warning (Development Only):**
```
[DEPRECATED] "customer_id" is deprecated and will be removed on 2026-11-22. Use "organization_id" instead.
```

---

### Phase 2: WARN (2026-02-22 to 2026-05-22)

**Duration:** 3 months
**Status:** ⏳ Scheduled

**What Happens:**
- Console warnings in **production** for `customer_id` usage
- API responses include deprecation headers
- Legacy functions continue to work
- Monitoring alerts for high `customer_id` usage

**Action Required:**
- ⚠️ **MIGRATE NOW** - Update all code to use `organization_id`
- Monitor console for deprecation warnings
- Update API clients to use new parameter names

**Example Warning (Production):**
```
[DEPRECATED] "customer_id" is deprecated and will be removed on 2026-11-22. Use "organization_id" instead.
```

**API Response Headers:**
```
Deprecation: true
Sunset: 2026-11-22T00:00:00Z
Link: <https://docs.omniops.co.uk/deprecations>; rel="deprecation"
```

---

### Phase 3: ERROR (2026-05-22 to 2026-11-22)

**Duration:** 6 months
**Status:** ⏳ Scheduled

**What Happens:**
- 🚨 Using `customer_id` **throws errors**
- Legacy functions still exist but fail immediately
- Database columns still present (read-only)
- Migration is **mandatory**

**Action Required:**
- 🔴 **CRITICAL** - All code must be migrated
- Fix any remaining `customer_id` references
- Test thoroughly before this phase begins

**Example Error:**
```javascript
Error: Deprecated feature used: customer_id.
"customer_id" is deprecated and will be removed on 2026-11-22. Use "organization_id" instead.
```

---

### Phase 4: REMOVED (2026-11-22 onwards)

**Duration:** Permanent
**Status:** ⏳ Scheduled

**What Happens:**
- ❌ `customer_id` columns **dropped** from database
- ❌ Legacy functions **removed** from codebase
- ❌ No backward compatibility
- Breaking change for any code still using `customer_id`

**Action Required:**
- All migrations must be complete **before** this date
- No legacy code should remain

---

## Migration Guide

### For API Users

**Before (Deprecated):**
```javascript
// ❌ Legacy - Will stop working on 2026-05-22
const response = await fetch('/api/customer/config?customerId=customer-123');
```

**After (Current):**
```javascript
// ✅ Correct - Use organization_id
const response = await fetch('/api/customer/config?organizationId=org-123');
```

### For Database Queries

**Before (Deprecated):**
```typescript
// ❌ Legacy
const { data } = await supabase
  .from('customer_configs')
  .select('*')
  .eq('customer_id', customerId);
```

**After (Current):**
```typescript
// ✅ Correct
const { data } = await supabase
  .from('customer_configs')
  .select('*')
  .eq('organization_id', organizationId);
```

### For Feature Flags

**Before (Deprecated):**
```typescript
// ❌ Legacy function
import { getCustomerOverride } from '@/lib/feature-flags/core/storage';
const flags = await getCustomerOverride(customerId);
```

**After (Current):**
```typescript
// ✅ Correct function
import { getOrganizationOverride } from '@/lib/feature-flags/core/storage';
const flags = await getOrganizationOverride(organizationId);
```

---

## API Changes

### Affected Endpoints

| Endpoint | Parameter Changed | Status |
|----------|------------------|--------|
| `GET /api/customer/config` | `customerId` → `organizationId` | ⚠️ Deprecated |
| `POST /api/customer/config` | `customerId` → `organizationId` | ⚠️ Deprecated |
| Feature flag functions | `customerId` param | ⚠️ Deprecated |
| Instagram integration | Internal only | ✅ Migrated |

### Response Format

All API responses now include organization-based data:

**Before:**
```json
{
  "id": "config-123",
  "customer_id": "customer-123",
  "domain": "example.com"
}
```

**After:**
```json
{
  "id": "config-123",
  "customer_id": "customer-123",  // ⚠️ Still present for compatibility
  "organization_id": "org-123",    // ✅ Primary field
  "domain": "example.com"
}
```

---

## Breaking Changes Timeline

### Immediate (2025-11-22) ✅
- No breaking changes
- Full backward compatibility

### 3 Months (2026-02-22) ⚠️
- Production warnings begin
- No breaking changes yet
- **Action:** Start migration

### 6 Months (2026-05-22) 🚨
- **BREAKING:** `customer_id` usage throws errors
- Legacy functions fail
- **Action:** Migration must be complete

### 12 Months (2026-11-22) ❌
- **BREAKING:** `customer_id` columns dropped
- **BREAKING:** Legacy functions removed
- No rollback possible

---

## Monitoring Deprecation Usage

### Via API

Check current deprecation status:

```bash
curl https://api.omniops.co.uk/api/deprecations
```

Response:
```json
{
  "success": true,
  "timeline": [
    {
      "feature": "customer_id",
      "phase": "silent",
      "startDate": "2025-11-22",
      "warnDate": "2026-02-22",
      "errorDate": "2026-05-22",
      "removeDate": "2026-11-22",
      "replacement": "organization_id",
      "daysUntilWarn": 92,
      "daysUntilError": 182,
      "daysUntilRemoval": 365
    }
  ]
}
```

### Via Code

```typescript
import { getDeprecationInfo, isDeprecated } from '@/lib/utils/deprecation';

// Check if feature is deprecated
if (isDeprecated('customer_id')) {
  console.log('customer_id is deprecated');
}

// Get deprecation details
const info = getDeprecationInfo('customer_id');
console.log(`Removal date: ${info.removeDate}`);
console.log(`Replacement: ${info.replacement}`);
```

---

## FAQ

### Q: When do I need to migrate?

**A:** You should start migrating as soon as possible. The hard deadline is **2026-05-22** (6 months), after which `customer_id` usage will throw errors.

### Q: Will my existing code break?

**A:** Not immediately. You have **6 months** before any breaking changes occur. However, we recommend migrating during the SILENT phase to avoid rushing.

### Q: What if I miss the deadline?

**A:** After 2026-05-22, any code using `customer_id` will throw runtime errors. After 2026-11-22, the database columns will be permanently removed.

### Q: Can I use both customer_id and organization_id?

**A:** During Phase 1 and 2, yes. The database has both columns. However, **organization_id is the primary field** and customer_id is deprecated.

### Q: How do I test my migration?

**A:** Use the `/api/deprecations` endpoint to check your usage. Monitor console warnings in development to identify legacy code.

### Q: Are there any exceptions?

**A:** Yes - WooCommerce API responses contain `customer_id` fields from their external API. These are NOT deprecated as they reference WooCommerce's internal customer IDs.

---

## Support

For questions or migration assistance:
- Email: support@omniops.co.uk
- Documentation: https://docs.omniops.co.uk/deprecations
- GitHub Issues: https://github.com/IDLEcreative/Omniops/issues

---

**Last Updated:** 2025-11-22
**Next Review:** 2026-01-22 (Before Phase 2)
