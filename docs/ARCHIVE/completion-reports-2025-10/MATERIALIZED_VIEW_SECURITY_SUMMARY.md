# Materialized View Security - Quick Reference

**Migration**: `20251028_harden_organization_seat_usage.sql`
**Status**: ✅ Ready to Deploy
**Breaking Changes**: ❌ None

---

## What Changed

### Before (Insecure)
```sql
-- Any authenticated user could see ALL organizations
SELECT * FROM organization_seat_usage;
```

### After (Secure)
```sql
-- Users can only see their own organizations
SELECT * FROM get_organization_seat_usage(NULL);

-- Or a specific organization (membership verified)
SELECT * FROM get_organization_seat_usage('org-uuid');
```

---

## Security Model

| Access Type | anon | authenticated | service_role |
|------------|------|---------------|--------------|
| Direct view access | ❌ | ❌ | ✅ |
| Wrapper function | ❌ | ✅ | ✅ |

---

## Deploy

```bash
# Apply migration
supabase db push
```

---

## Verify

```sql
-- Should succeed (returns your organizations)
SELECT * FROM get_organization_seat_usage(NULL);

-- Should fail (permission denied)
SELECT * FROM organization_seat_usage;
```

---

## Background Jobs

Service role can still refresh the materialized view:

```sql
REFRESH MATERIALIZED VIEW CONCURRENTLY public.organization_seat_usage;
```

Recommended: Run every 15-30 minutes via cron/Edge Function.

---

## Full Documentation

See `docs/MATERIALIZED_VIEW_HARDENING_REPORT.md`
