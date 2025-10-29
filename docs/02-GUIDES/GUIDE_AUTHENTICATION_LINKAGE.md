# Authentication & Domain Linkage Documentation

**Type:** Guide
**Status:** Active
**Last Updated:** 2025-10-29
**Verified For:** v0.1.0
**Dependencies:**
- `auth.users` (Supabase Auth)
- `customer_configs` table
- Row Level Security policies
- Supabase client authentication
**Estimated Read Time:** 8 minutes

## Purpose
Describes the authentication and domain ownership model for multi-tenant security in OmniOps. Documents how each domain configuration links to an authenticated user account through customer_id references, Row Level Security enforcement, and ownership verification to prevent unauthorized access to business configurations.

## Quick Links
- [Overview](#overview)
- [Database Schema](#database-schema)
- [Security Model](#security-model)
- [Current Production Setup](#current-production-setup)
- [Common Operations](#common-operations)
- [Security Considerations](#security-considerations)
- [Troubleshooting](#troubleshooting)
- [Migration Path](#migration-path)
- [Best Practices](#best-practices)
- [API Integration](#api-integration)

## Keywords
authentication, domain ownership, multi-tenancy, Row Level Security, RLS policies, customer linkage, Supabase Auth, user verification, access control, ownership verification, domain isolation, security model, orphaned domains, audit trail

## Aliases
- "domain linkage" (also known as: domain ownership, domain association, user-domain mapping)
- "customer_id" (also known as: user ID, auth user ID, owner ID)
- "RLS" (also known as: Row Level Security, policy enforcement, database-level access control)
- "orphaned domain" (also known as: unlinked domain, unassociated domain, ownerless configuration)

---

## Overview
This document describes the authentication and domain ownership model for the OmniOps customer service platform. Each domain configuration must be linked to an authenticated user account for security and multi-tenancy support.

## Database Schema

### Key Tables
- `auth.users` - Supabase authentication users
- `customer_configs` - Domain configurations and settings

### Linkage Mechanism
The `customer_configs.customer_id` field (UUID) references `auth.users.id` to establish domain ownership:

```sql
customer_configs.customer_id → auth.users.id
```

## Security Model

### Row Level Security (RLS)
- Only authenticated users can access their linked domains
- `customer_id` field enforces ownership boundaries
- Prevents unauthorized access to business configurations

### Authentication Flow
1. User registers/logs in via Supabase Auth
2. User's ID is stored in `customer_configs.customer_id`
3. All subsequent operations verify user ownership
4. RLS policies enforce access control at database level

## Current Production Setup

### Thompson's E-Parts Configuration
- **User Account**: hello@idlecreative.co.uk
- **User ID**: 988ff616-f2e0-4c50-9fb2-d17359eb259f
- **Domain**: thompsonseparts.co.uk
- **Config ID**: 8dccd788-1ec1-43c2-af56-78aa3366bad3
- **Status**: ✅ Properly linked (as of 2025-09-22)

## Common Operations

### Verify Domain Linkage
```sql
SELECT 
    u.email,
    cc.domain,
    cc.business_name,
    cc.customer_id = u.id as properly_linked
FROM customer_configs cc
JOIN auth.users u ON u.id = cc.customer_id
WHERE cc.domain = 'your-domain.com';
```

### Link Orphaned Domain to User
```sql
UPDATE customer_configs
SET 
    customer_id = 'user-uuid-here',
    updated_at = NOW()
WHERE domain = 'orphaned-domain.com';
```

### Find Orphaned Domains
```sql
SELECT domain, business_name, created_at
FROM customer_configs
WHERE customer_id IS NULL;
```

## Security Considerations

### Critical Requirements
1. **Never leave domains orphaned** - All domains must have a `customer_id`
2. **Verify ownership** - Always confirm user identity before linking
3. **Audit trail** - Track all linkage changes via `updated_at` timestamps
4. **Credential encryption** - Use `encrypted_credentials` field for sensitive data

### Access Control Matrix
| Operation | Requirement |
|-----------|-------------|
| View domain config | Authenticated + owns domain |
| Update settings | Authenticated + owns domain |
| Access chat data | Authenticated + owns domain |
| Manage WooCommerce | Authenticated + owns domain |
| Delete domain | Authenticated + owns domain + confirmation |

## Troubleshooting

### Domain Not Accessible
1. Check if user is authenticated
2. Verify `customer_id` matches user's ID
3. Ensure domain is active (`active = true`)
4. Check RLS policies are enabled

### Multiple Users Need Access
Currently, the system supports single-owner model. For team access:
- Share account credentials (not recommended)
- Future: Implement team/organization support

### Email Typos
Common issue: Email registered with typo
- Example: "idlecreative" vs "idolcreative"
- Solution: Verify exact email in auth.users table

## Migration Path

### For Legacy Unlinked Domains
1. Identify orphaned domains (`customer_id IS NULL`)
2. Verify legitimate ownership
3. Update customer_id to link to user
4. Migrate credentials to encrypted format
5. Test access through authenticated session

## Best Practices

1. **Regular Audits**: Check for orphaned domains monthly
2. **Immediate Linking**: Link domains to users at creation time
3. **Secure Credentials**: Always use encrypted_credentials field
4. **Monitor Access**: Log authentication attempts and failures
5. **Document Changes**: Track all ownership transfers

## API Integration

### Required Headers
```javascript
headers: {
  'Authorization': 'Bearer {user-jwt-token}',
  'X-Domain': 'customer-domain.com'
}
```

### Verification Endpoint
```typescript
// app/api/auth/verify-ownership/route.ts
const userOwnssDomain = await verifyDomainOwnership(
  userId,
  domain
);
```

## Future Enhancements

- [ ] Team/organization support with role-based access
- [ ] Domain transfer between accounts
- [ ] Audit logging for all configuration changes
- [ ] Two-factor authentication for sensitive operations
- [ ] API keys for programmatic access

## Contact

For authentication issues or domain linkage problems:
- Check Supabase Dashboard for user management
- Review RLS policies in database
- Contact system administrator for manual intervention

---

*Last Updated: 2025-09-22*
*Production User: hello@idlecreative.co.uk*
*Production Domain: thompsonseparts.co.uk*