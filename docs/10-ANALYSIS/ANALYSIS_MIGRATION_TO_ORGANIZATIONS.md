# Migration Guide: Single-User to Multi-Seat Organizations

**Type:** Analysis
**Status:** Active
**Last Updated:** 2025-10-29
**Verified For:** v0.1.0
**Estimated Read Time:** 15 minutes

## Purpose
This guide walks you through migrating from the single-user model to the new multi-seat organization model.

## Quick Links
- [Overview](#overview)
- [What Changes](#what-changes)
- [Migration Steps](#migration-steps)
- [Rollback Plan](#rollback-plan)
- [Common Migration Issues](#common-migration-issues)

## Keywords
analysis, changes, checklist, cleanup, common, considerations, documentation, issues, migration, next

---


## Overview

This guide walks you through migrating from the single-user model to the new multi-seat organization model.

## What Changes

### Before (Single-User Model)
- One user owns one or more domains
- No team collaboration
- Data scoped by `user_id`

### After (Multi-Seat Organizations)
- Multiple users can belong to an organization
- Organizations own domains
- Data scoped by `organization_id`
- Role-based access control (owner, admin, member, viewer)

## Migration Steps

### Step 1: Apply Database Migration

Run the SQL migration to add organization tables:

```sql
-- In Supabase Dashboard SQL Editor or via CLI
-- Run: supabase/migrations/20251020_add_multi_seat_organizations.sql
```

This creates:
- `organizations` table
- `organization_members` table
- `organization_invitations` table
- Updates `domains` and `customer_configs` tables
- Adds RLS policies
- Creates helper functions

### Step 2: Migrate Existing Data

Run the data migration script to convert existing customers to organizations:

```bash
npx tsx scripts/migrate-to-organizations.ts
```

**What it does:**
1. Creates a default organization for each existing customer
2. Names it after their `company_name` or `email`
3. Sets them as the organization owner
4. Links their domains to the organization
5. Links their customer configs to the organization

**Output:**
```
🚀 Starting migration to organization-based structure...

📋 Fetching customers...
   Found 3 customers

👤 Processing customer: john@example.com
   Creating organization: "Acme Corp" (acme-corp)
   ✓ Organization created: abc-123
   ✓ Added as owner
   ✓ Updated 2 domain(s)
   ✓ Updated 2 config(s)
   ✅ Customer migrated successfully

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 Migration Summary:
   Total customers: 3
   ✅ Successful: 3
   ❌ Failed: 0
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ All customers migrated successfully!
```

### Step 3: Update Application Code

#### Add Organization Provider

Wrap your app with the `OrganizationProvider`:

```tsx
// app/layout.tsx or your root layout
import { OrganizationProvider } from '@/lib/contexts/organization-context';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <OrganizationProvider>
          {children}
        </OrganizationProvider>
      </body>
    </html>
  );
}
```

#### Add Organization Switcher

Add the organization switcher to your navigation:

```tsx
// components/header.tsx
import { OrganizationSwitcher } from '@/components/organizations/organization-switcher';

export function Header() {
  return (
    <header>
      <OrganizationSwitcher />
      {/* other nav items */}
    </header>
  );
}
```

#### Update API Routes (Optional but Recommended)

For better security, update your API routes to verify organization membership:

```typescript
// Before
const { data: domains } = await supabase
  .from('domains')
  .select('*')
  .eq('user_id', user.id);

// After
import { verifyDomainAccess } from '@/lib/organization-helpers';

const hasAccess = await verifyDomainAccess(
  supabase,
  domain,
  user.id,
  'member' // required role
);

if (!hasAccess) {
  return NextResponse.json({ error: 'Access denied' }, { status: 403 });
}
```

### Step 4: Verify Migration

1. **Login as existing user**
   - Should see their auto-created organization
   - Should see their existing domains

2. **Test inviting a team member**
   ```bash
   # Use the UI or API to send an invitation
   POST /api/organizations/:id/invitations
   {
     "email": "teammate@example.com",
     "role": "member"
   }
   ```

3. **Accept invitation as new user**
   - Create account with invited email
   - Visit invitation link
   - Should join the organization

4. **Test role permissions**
   - Try accessing features as different roles
   - Verify viewers can't edit
   - Verify members can edit but not invite
   - Verify admins can invite and manage members

## Rollback Plan

If you need to rollback the migration:

### Option 1: Restore from Backup
```bash
# Restore Supabase backup from before migration
# In Supabase Dashboard > Database > Backups
```

### Option 2: Manual Rollback

```sql
-- Remove organization references (keeps existing user_id relationships)
UPDATE domains SET organization_id = NULL;
UPDATE customer_configs SET organization_id = NULL;

-- Drop organization tables
DROP TABLE IF EXISTS organization_invitations CASCADE;
DROP TABLE IF EXISTS organization_members CASCADE;
DROP TABLE IF EXISTS organizations CASCADE;

-- Restore original RLS policies
-- (See supabase/migrations/000_complete_schema_fixed.sql for original policies)
```

## Common Migration Issues

### Issue: "Migration failed" for some customers

**Cause:** Customer might not have auth_user_id or data inconsistency

**Solution:**
1. Check the error message
2. Manually fix the customer record
3. Re-run migration script (it's idempotent)

### Issue: Existing user can't see their data

**Cause:** Domains not linked to organization

**Solution:**
```sql
-- Find user's organization
SELECT o.id, o.name
FROM organizations o
JOIN organization_members om ON o.id = om.organization_id
WHERE om.user_id = 'user-uuid-here';

-- Link their domains
UPDATE domains
SET organization_id = 'org-uuid-here'
WHERE user_id = 'user-uuid-here';
```

### Issue: RLS policies blocking access

**Cause:** RLS policies might conflict with service role operations

**Solution:**
- Use service role client for backend operations
- Ensure user is authenticated for frontend operations
- Check RLS policies in Supabase dashboard

## Testing Checklist

After migration, verify:

- [ ] Existing users can login
- [ ] Existing users see their data
- [ ] Existing scrapers still work
- [ ] Organization switcher appears
- [ ] Can create new organization
- [ ] Can invite team member
- [ ] Can accept invitation
- [ ] Role permissions work correctly
- [ ] Cannot remove last owner
- [ ] RLS policies enforce access control

## Performance Considerations

The migration should be fast for most deployments:

- **< 100 customers**: ~1-2 seconds
- **< 1,000 customers**: ~10-30 seconds
- **> 1,000 customers**: May take several minutes

For very large deployments, consider:
1. Running migration during off-peak hours
2. Batching the migration (modify script to process in chunks)
3. Monitoring database performance during migration

## Post-Migration Cleanup

After verifying everything works:

```sql
-- Optional: Remove user_id from domains (not recommended for backward compatibility)
-- ALTER TABLE domains DROP COLUMN user_id;
```

## Support

If you encounter issues during migration:

1. Check error logs in migration script output
2. Review Supabase logs for RLS policy violations
3. Verify database triggers are active
4. Check the troubleshooting section in [MULTI_SEAT_ORGANIZATIONS.md](./MULTI_SEAT_ORGANIZATIONS.md)

## Next Steps

After successful migration:

1. **Communicate to users** - Notify them about team collaboration features
2. **Update documentation** - Add organization management to user guides
3. **Monitor usage** - Track organization creation and member invitations
4. **Plan billing** - Consider seat-based pricing for future

## Related Documentation

- [Multi-Seat Organizations](./MULTI_SEAT_ORGANIZATIONS.md)
- [Database Schema](../09-REFERENCE/REFERENCE_DATABASE_SCHEMA.md)
- [API Documentation](./API.md)
