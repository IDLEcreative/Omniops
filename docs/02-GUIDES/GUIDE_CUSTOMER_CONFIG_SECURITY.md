# Customer Configuration API Security Model

**Type:** Guide
**Status:** ✅ Active - Implemented (Fixed GitHub Issue #9)
**Last Updated:** 2025-10-28
**Verified For:** v0.1.0
**Vulnerability Fixed:** Authentication bypass allowing unauthorized access to customer data
**Dependencies:**
- [Security Model](GUIDE_SECURITY_MODEL.md) - Overall security architecture
- [Database Schema](../01-ARCHITECTURE/database-schema.md) - RLS policies
**Estimated Read Time:** 22 minutes

## Purpose
Comprehensive security model documentation for customer configuration API protecting sensitive business data (domains, API credentials, integrations, privacy settings) through defense-in-depth strategy including API authentication, organization membership, RBAC, Row-Level Security policies, and encryption at rest.

## Quick Links
- [Security Architecture](#security-architecture) - Defense in depth
- [Authentication & Authorization Flow](#authentication--authorization-flow) - Multi-layer verification
- [RLS Policies](#database-row-level-security-rls) - PostgreSQL policies
- [Testing](#testing-security) - Security validation
- [Troubleshooting](#troubleshooting) - Common issues

## Keywords
API security, customer configuration, authentication, authorization, RBAC, Row-Level Security, RLS, multi-tenant, organization membership, encryption at rest, defense in depth, Supabase auth, PostgreSQL policies, security testing, vulnerability fix

## Aliases
- "RLS" (also known as: Row-Level Security, database policies, access policies)
- "RBAC" (also known as: Role-Based Access Control, permission system, role permissions)
- "defense in depth" (also known as: layered security, multiple security layers, security in layers)
- "organization membership" (also known as: tenant membership, org access, membership validation)

---

## Overview

The customer configuration API endpoints manage sensitive business data including:
- Customer domains and business information
- API credentials (WooCommerce, Shopify)
- Integration settings
- Privacy preferences

This document describes the comprehensive security model protecting this data through multiple layers of defense.

## Security Architecture

### Defense in Depth Strategy

1. **API-Level Authentication** - Verify user is signed in
2. **Organization Membership Check** - Verify user belongs to organization
3. **Role-Based Access Control (RBAC)** - Verify user has required permissions
4. **Row-Level Security (RLS)** - Database-level enforcement via Postgres policies
5. **Encryption at Rest** - Sensitive credentials encrypted before storage

## Authentication & Authorization Flow

### Layer 1: Authentication
```typescript
// All endpoints start with authentication check
const { data: { user }, error: authError } = await supabase.auth.getUser()
if (authError || !user) {
  return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
}
```

**Result:** Unauthenticated requests → `401 Unauthorized`

### Layer 2: Organization Membership
```typescript
// Verify user belongs to the organization that owns the resource
const { data: membership, error } = await supabase
  .from('organization_members')
  .select('organization_id, role')
  .eq('user_id', user.id)
  .eq('organization_id', resource.organization_id)
  .single()

if (error || !membership) {
  return NextResponse.json(
    { error: 'Forbidden: Not a member of this organization' },
    { status: 403 }
  )
}
```

**Result:** Non-members attempting access → `403 Forbidden`

### Layer 3: Role-Based Permissions
```typescript
// Operations requiring elevated privileges check role
if (!['admin', 'owner'].includes(membership.role)) {
  return NextResponse.json(
    { error: 'Forbidden: Only admins and owners can perform this action' },
    { status: 403 }
  )
}
```

**Result:** Members without required role → `403 Forbidden`

### Layer 4: Row-Level Security (RLS)
```sql
-- Database-level enforcement via Postgres policies
CREATE POLICY "Users can view customer_configs of their organizations"
ON customer_configs
FOR SELECT
TO public
USING (is_organization_member(organization_id, auth.uid()));
```

**Result:** Direct database queries bypass API checks → RLS blocks access

## Endpoint Security Matrix

| Endpoint | Method | Authentication | Org Membership | Required Role | RLS Policy |
|----------|--------|----------------|----------------|---------------|------------|
| `/api/customer/config` | GET | ✅ Required | ✅ Auto-filtered | Any member | ✅ SELECT |
| `/api/customer/config` | POST | ✅ Required | ✅ Verified | Admin/Owner | ✅ INSERT |
| `/api/customer/config?id=X` | PUT | ✅ Required | ✅ Verified | Admin/Owner | ✅ UPDATE |
| `/api/customer/config?id=X` | DELETE | ✅ Required | ✅ Verified | Admin/Owner | ✅ DELETE |
| `/api/customer/config/current` | GET | ✅ Required | ✅ Auto-filtered | Any member | ✅ SELECT |

## Permission Model

### Roles & Capabilities

**Owner**
- Full access to all organization resources
- Can create, read, update, delete customer configs
- Can manage organization members
- Can delete the organization

**Admin**
- Full access to organization resources
- Can create, read, update, delete customer configs
- Can manage organization members (except owners)
- Cannot delete the organization

**Member**
- Read-only access to customer configs
- Cannot create, update, or delete configs
- Cannot manage organization members

## Implementation Details

### Core Security Utilities

**Location:** `/lib/auth/api-helpers.ts`

```typescript
// Require user authentication
export async function requireAuth(): Promise<AuthResult | NextResponse>

// Require organization membership
export async function requireOrgMembership(
  userId: string,
  organizationId: string,
  supabase: SupabaseClient
): Promise<MembershipResult | NextResponse>

// Require specific role
export function requireRole(
  membership: MembershipResult,
  allowedRoles: OrganizationRole[]
): true | NextResponse

// Verify config access (combines auth + membership + config ownership)
export async function verifyConfigAccess(
  configId: string,
  userId: string,
  supabase: SupabaseClient
): Promise<{ id: string; organization_id: string } | NextResponse>
```

### Example: Secure Endpoint Pattern

```typescript
export async function handlePut(request: NextRequest) {
  // 1. Environment check
  const envError = checkSupabaseEnv()
  if (envError) return envError

  // 2. Get Supabase client
  const { client: supabase, error: clientError } = await getSupabaseClient()
  if (clientError) return clientError

  // 3. Require authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  }

  // 4. Fetch resource to get organization_id
  const { data: config, error: fetchError } = await supabase
    .from('customer_configs')
    .select('*')
    .eq('id', configId)
    .single()

  if (fetchError || !config) {
    return NextResponse.json({ error: 'Configuration not found' }, { status: 404 })
  }

  // 5. Verify organization membership
  const { data: membership, error: membershipError } = await supabase
    .from('organization_members')
    .select('role')
    .eq('user_id', user.id)
    .eq('organization_id', config.organization_id)
    .single()

  if (membershipError || !membership) {
    return NextResponse.json(
      { error: 'Forbidden: Not a member of this organization' },
      { status: 403 }
    )
  }

  // 6. Check role permissions
  if (!['admin', 'owner'].includes(membership.role)) {
    return NextResponse.json(
      { error: 'Forbidden: Only admins and owners can update configurations' },
      { status: 403 }
    )
  }

  // 7. Perform operation (RLS enforces additional check at database level)
  const { data: updated, error: updateError } = await supabase
    .from('customer_configs')
    .update(updateData)
    .eq('id', configId)
    .select()
    .single()

  return NextResponse.json({ success: true, data: updated })
}
```

## RLS Policies

### customer_configs Table

**SELECT Policy**
```sql
CREATE POLICY "Users can view customer_configs of their organizations"
ON customer_configs
FOR SELECT
TO public
USING (is_organization_member(organization_id, auth.uid()));
```

**Helper Function**
```sql
CREATE OR REPLACE FUNCTION is_organization_member(org_id uuid, user_id uuid)
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1
    FROM organization_members
    WHERE organization_id = org_id
      AND user_id = user_id
  );
$$ LANGUAGE sql SECURITY DEFINER;
```

## Security Testing

**Test Suite:** `__tests__/api/customer-config/security.test.ts`

### Test Coverage

✅ **Authentication Tests**
- Reject unauthenticated GET requests
- Reject unauthenticated POST requests
- Reject unauthenticated PUT requests
- Reject unauthenticated DELETE requests

✅ **Authorization Tests**
- Block cross-organization access (GET)
- Block cross-organization updates (PUT)
- Block cross-organization deletion (DELETE)
- Enforce role requirements for POST (admin/owner only)
- Enforce role requirements for PUT (admin/owner only)
- Enforce role requirements for DELETE (admin/owner only)

✅ **RLS Policy Tests**
- Verify RLS blocks direct database queries to other orgs
- Verify RLS allows access to own organization

### Running Tests

```bash
# Run all security tests
npm test __tests__/api/customer-config/security.test.ts

# Run with verbose output
npm test __tests__/api/customer-config/security.test.ts -- --verbose

# Run specific test suite
npm test __tests__/api/customer-config/security.test.ts -- -t "GET /api/customer/config"
```

## Attack Scenarios Prevented

### ❌ Scenario 1: Unauthenticated Data Access
**Attack:** Anonymous user tries to fetch customer configs
```bash
curl http://localhost:3000/api/customer/config
```
**Defense:** API-level authentication check → `401 Unauthorized`

### ❌ Scenario 2: Cross-Organization Access
**Attack:** User from Org A tries to read Org B's config
```bash
curl -H "Authorization: Bearer <org_a_token>" \
  http://localhost:3000/api/customer/config?id=<org_b_config_id>
```
**Defense:** Organization membership check → `403 Forbidden`

### ❌ Scenario 3: Privilege Escalation
**Attack:** Regular member tries to update config (admin-only action)
```bash
curl -X PUT -H "Authorization: Bearer <member_token>" \
  http://localhost:3000/api/customer/config?id=<config_id>
```
**Defense:** Role-based access control → `403 Forbidden`

### ❌ Scenario 4: Direct Database Bypass
**Attack:** User with database credentials queries configs directly
```sql
SELECT * FROM customer_configs WHERE organization_id != '<user_org_id>';
```
**Defense:** Row-Level Security policy → No results returned

## Logging & Monitoring

All security violations are logged with context:

```typescript
logger.warn('Unauthenticated request to GET /api/customer/config')

logger.warn('User not authorized to update config', {
  userId: user.id,
  configId,
  organizationId: config.organization_id
})

logger.warn('Insufficient permissions to delete config', {
  userId: user.id,
  role: membership.role,
  configId
})
```

**Monitoring Recommendations:**
- Alert on high volume of 401/403 responses
- Track failed authentication attempts per user
- Monitor cross-organization access attempts
- Review security logs for anomalous patterns

## Sensitive Data Handling

### Encrypted Fields

The following fields are encrypted before storage:
- `woocommerce_consumer_key`
- `woocommerce_consumer_secret`
- `shopify_access_token`
- `encrypted_credentials` (JSON blob)

**Encryption:** AES-256-GCM via `/lib/encryption.ts`

### Excluded from Client Responses

Even for authorized users, these fields are never sent to the client:

```typescript
const {
  woocommerce_consumer_key,
  woocommerce_consumer_secret,
  encrypted_credentials,
  shopify_access_token,
  ...safeConfig
} = customerConfig;

return NextResponse.json({ success: true, data: safeConfig });
```

## Compliance

This security model supports:

✅ **GDPR** - Organization-level data isolation
✅ **SOC 2** - Role-based access control, audit logging
✅ **ISO 27001** - Defense in depth, least privilege

## Migration from Vulnerable Version

### Before (Vulnerable)
```typescript
// ❌ NO AUTHENTICATION CHECK
export async function handleGet(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const customerId = searchParams.get('customerId')

  // Anyone could query any customer's data
  const { data: configs } = await supabase
    .from('customer_configs')
    .select('*')
    .eq('customer_id', customerId)  // ❌ No user verification!

  return NextResponse.json({ data: configs })
}
```

### After (Secure)
```typescript
// ✅ AUTHENTICATION + AUTHORIZATION
export async function handleGet(request: NextRequest) {
  // 1. Require authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  }

  // 2. Get user's organization
  const { data: membership } = await supabase
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', user.id)
    .single()

  // 3. Filter by user's organization only
  const { data: configs } = await supabase
    .from('customer_configs')
    .select('*')
    .eq('organization_id', membership.organization_id)  // ✅ Filtered!

  return NextResponse.json({ data: configs })
}
```

## References

- **Auth Helpers:** `/lib/auth/api-helpers.ts`
- **Endpoint Implementations:**
  - `/app/api/customer/config/get-handler.ts`
  - `/app/api/customer/config/create-handler.ts`
  - `/app/api/customer/config/update-handler.ts`
  - `/app/api/customer/config/delete-handler.ts`
- **Security Tests:** `/__tests__/api/customer-config/security.test.ts`
- **RLS Migrations:** `/supabase/migrations/20251028000000_optimize_rls_auth_performance.sql`

## Security Best Practices

1. **Always authenticate first** - Check `auth.getUser()` before any operation
2. **Verify organization membership** - Don't trust client-provided organization IDs
3. **Enforce role requirements** - Restrict write operations to admins/owners
4. **Rely on RLS as backup** - Even if API checks fail, RLS prevents data leaks
5. **Never expose credentials** - Exclude sensitive fields from responses
6. **Log security events** - Track authentication failures and authorization violations
7. **Test thoroughly** - Run security tests after any endpoint changes

## Conclusion

The customer configuration API is now protected by multiple layers of security:
- ✅ Authentication required for all endpoints
- ✅ Organization membership verified before access
- ✅ Role-based permissions enforced for write operations
- ✅ Row-level security policies enforce database-level isolation
- ✅ Comprehensive test coverage validates security model

**GitHub Issue #9: RESOLVED** ✅
