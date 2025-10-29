# Multi-Seat Organization Support

**Type:** Architecture
**Status:** Active
**Last Updated:** 2025-10-29
**Verified For:** v0.1.0
**Estimated Read Time:** 21 minutes

## Purpose
The multi-seat organization feature allows multiple users (seats) from the same business to access and collaborate on shared data. This enables teams to work together on scraped content, conversations, and analytics without sharing individual login credentials.

## Quick Links
- [Overview](#overview)
- [Architecture](#architecture)
- [API Endpoints](#api-endpoints)
- [Usage](#usage)
- [Migration Guide](#migration-guide)

## Keywords
architecture, considerations, documentation, endpoints, enhancements, future, guide, migration, multi, overview

---


## Overview

The multi-seat organization feature allows multiple users (seats) from the same business to access and collaborate on shared data. This enables teams to work together on scraped content, conversations, and analytics without sharing individual login credentials.

## Architecture

### Database Schema

#### Core Tables

**organizations**
- Represents a business/company
- Fields: `id`, `name`, `slug`, `settings`, `plan_type`, `seat_limit`, `created_at`, `updated_at`

**organization_members**
- Links users to organizations with specific roles
- Fields: `id`, `organization_id`, `user_id`, `role`, `invited_by`, `joined_at`, `created_at`, `updated_at`
- Roles: `owner`, `admin`, `member`, `viewer`

**organization_invitations**
- Pending invitations to join an organization
- Fields: `id`, `organization_id`, `email`, `role`, `token`, `invited_by`, `expires_at`, `accepted_at`, `created_at`
- Invitations expire after 7 days

#### Updated Tables

**domains**
- Added `organization_id` field
- Domains are now owned by organizations, not individual users
- Maintains backward compatibility with `user_id` field

**customer_configs**
- Added `organization_id` field
- Configurations scoped to organizations

### Role-Based Access Control (RBAC)

#### Role Hierarchy

| Role | Permissions |
|------|-------------|
| **Owner** | Full control including deleting organization, managing billing, all admin/member/viewer permissions |
| **Admin** | Manage members, invite users, configure settings, all member/viewer permissions |
| **Member** | View and edit data, run scrapers, view analytics |
| **Viewer** | Read-only access to data and analytics |

#### Permission Matrix

| Action | Owner | Admin | Member | Viewer |
|--------|-------|-------|--------|--------|
| Delete organization | ✅ | ❌ | ❌ | ❌ |
| Update organization settings | ✅ | ❌ | ❌ | ❌ |
| Invite members | ✅ | ✅ | ❌ | ❌ |
| Remove members | ✅ | ✅ | ❌ | ❌ |
| Update member roles | ✅ | ✅* | ❌ | ❌ |
| View/edit data | ✅ | ✅ | ✅ | ❌ |
| View data (read-only) | ✅ | ✅ | ✅ | ✅ |
| Run scrapers | ✅ | ✅ | ✅ | ❌ |

*Admins cannot modify owner roles

### Row Level Security (RLS)

All organization-related tables have RLS policies that enforce:

1. **Organization Members** - Can only view organizations they belong to
2. **Domain Access** - Can only access domains owned by their organization
3. **Data Scoping** - All scraped data, embeddings, and analytics are scoped to organization
4. **Last Owner Protection** - Cannot remove the last owner from an organization

## API Endpoints

### Organizations

#### List Organizations
```http
GET /api/organizations
```
Returns all organizations the authenticated user belongs to.

**Response:**
```json
{
  "organizations": [
    {
      "id": "uuid",
      "name": "My Company",
      "slug": "my-company",
      "user_role": "owner",
      "member_count": 5,
      "plan_type": "free",
      "seat_limit": 10
    }
  ]
}
```

#### Create Organization
```http
POST /api/organizations
Content-Type: application/json

{
  "name": "New Company",
  "slug": "new-company" // optional, auto-generated if not provided
}
```

#### Get Organization
```http
GET /api/organizations/:id
```

#### Update Organization (Owner only)
```http
PATCH /api/organizations/:id
Content-Type: application/json

{
  "name": "Updated Name",
  "settings": {},
  "seat_limit": 20
}
```

#### Delete Organization (Owner only)
```http
DELETE /api/organizations/:id
```

### Members

#### List Members
```http
GET /api/organizations/:id/members
```

**Response:**
```json
{
  "members": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "email": "user@example.com",
      "name": "John Doe",
      "role": "admin",
      "joined_at": "2025-10-20T00:00:00Z"
    }
  ]
}
```

#### Update Member Role (Admin/Owner only)
```http
PATCH /api/organizations/:id/members/:userId
Content-Type: application/json

{
  "role": "admin"
}
```

#### Remove Member (Admin/Owner only)
```http
DELETE /api/organizations/:id/members/:userId
```

### Invitations

#### List Pending Invitations
```http
GET /api/organizations/:id/invitations
```

#### Create Invitation (Admin/Owner only)
```http
POST /api/organizations/:id/invitations
Content-Type: application/json

{
  "email": "newuser@example.com",
  "role": "member"
}
```

**Response:**
```json
{
  "invitation": {
    "id": "uuid",
    "email": "newuser@example.com",
    "role": "member",
    "expires_at": "2025-10-27T00:00:00Z"
  },
  "invitation_link": "https://yourapp.com/invitations/accept?token=..."
}
```

#### Cancel Invitation (Admin/Owner only)
```http
DELETE /api/organizations/:id/invitations/:invitationId
```

#### Accept Invitation
```http
GET /api/invitations/accept?token=xxx
```
View invitation details (before accepting)

```http
POST /api/invitations/accept
Content-Type: application/json

{
  "token": "invitation_token_here"
}
```

## Usage

### Client-Side Context

```tsx
import { OrganizationProvider, useOrganization } from '@/lib/contexts/organization-context';

// Wrap your app with the provider
function App() {
  return (
    <OrganizationProvider>
      <YourApp />
    </OrganizationProvider>
  );
}

// Use the hook in components
function MyComponent() {
  const {
    organizations,
    currentOrganization,
    setCurrentOrganization,
    isLoading,
    refreshOrganizations
  } = useOrganization();

  // ...
}
```

### Server-Side Helpers

```typescript
import {
  hasOrganizationRole,
  verifyDomainAccess,
  getOrganizationIdFromDomain
} from '@/lib/organization-helpers';

// Check if user has admin access
const hasAccess = await hasOrganizationRole(
  supabase,
  organizationId,
  userId,
  'admin'
);

// Verify user can access a domain
const canAccess = await verifyDomainAccess(
  supabase,
  'example.com',
  userId,
  'member'
);
```

### UI Components

```tsx
import { OrganizationSwitcher } from '@/components/organizations/organization-switcher';
import { TeamMembersList } from '@/components/organizations/team-members-list';
import { InviteMemberForm } from '@/components/organizations/invite-member-form';

// Organization switcher in header
<OrganizationSwitcher />

// Team management page
<TeamMembersList organizationId={orgId} userRole="admin" />
<InviteMemberForm organizationId={orgId} />
```

## Migration Guide

### For Existing Deployments

1. **Run SQL Migration**
   ```bash
   # Apply the migration in Supabase dashboard or via CLI
   supabase migration up
   ```

2. **Migrate Existing Data**
   ```bash
   npx tsx scripts/migrate-to-organizations.ts
   ```

   This script will:
   - Create a default organization for each existing customer
   - Set them as the owner
   - Link their domains and configs to the organization

3. **Update Your Application**
   - Add `OrganizationProvider` to your app layout
   - Add `OrganizationSwitcher` to your header/navigation
   - Update any domain-scoped queries to check organization membership

### Backward Compatibility

The system maintains backward compatibility with the old single-user model:

- Domains with `user_id` but no `organization_id` still work
- RLS policies check both `user_id` and organization membership
- Existing API endpoints continue to function

## Security Considerations

### RLS Enforcement

- All organization data is protected by Row Level Security
- Service role bypasses RLS - ensure proper validation in API routes
- Never trust client-provided organization IDs - always verify membership

### Invitation Security

- Tokens are cryptographically random (32 bytes)
- Invitations expire after 7 days
- Email verification ensures invitations go to intended recipients
- Accepted invitations are marked to prevent reuse

### Owner Protection

- Cannot remove the last owner (enforced by database trigger)
- Only owners can assign owner role
- Only owners can delete organization

## Testing

### Manual Testing Checklist

- [ ] Create a new organization
- [ ] Invite a team member with each role (admin, member, viewer)
- [ ] Accept invitation as new user
- [ ] Verify role permissions (try accessing restricted features)
- [ ] Switch between multiple organizations
- [ ] Update member roles
- [ ] Remove team member
- [ ] Try to remove last owner (should fail)
- [ ] Delete organization (as owner)

### Automated Tests

```bash
# Run tests
npm test

# Test organization API
npm run test:integration -- organizations
```

## Troubleshooting

### Common Issues

**Issue: User can't see organization data**
- Verify they're a member: Check `organization_members` table
- Check RLS policies are enabled
- Ensure organization_id is set on domains

**Issue: Invitation link doesn't work**
- Check invitation hasn't expired
- Verify token matches database
- Ensure user's email matches invitation email

**Issue: Can't remove member**
- Check if they're the last owner
- Verify requestor has admin/owner role
- Check for database constraint violations

## Future Enhancements

- [ ] Email notifications for invitations
- [ ] Audit log for member actions
- [ ] Custom roles with granular permissions
- [ ] SSO/SAML integration
- [ ] Billing per seat
- [ ] Organization usage analytics
- [ ] Bulk user imports

## Related Documentation

- [Database Schema](../07-REFERENCE/REFERENCE_DATABASE_SCHEMA.md)
- [Authentication](docs/AUTHENTICATION_LINKAGE.md)
- [API Documentation](docs/03-API/REFERENCE_API_ENDPOINTS.md)
