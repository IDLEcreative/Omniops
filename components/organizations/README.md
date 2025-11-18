# Organizations Directory

**Type:** Reference
**Status:** Active
**Last Updated:** 2025-11-18
**Verified For:** v0.1.0
**Dependencies:** [Contexts](/home/user/Omniops/lib/contexts), [Team Dashboard](/home/user/Omniops/app/dashboard/team), [Auth Components](/home/user/Omniops/components/auth/README.md)
**Estimated Read Time:** 2 minutes

## Purpose

Multi-tenant organization management components for switching between organizations, managing team members, inviting members, tracking seat usage, and upgrading seat counts.

## Quick Links

- [Main Components Directory](/home/user/Omniops/components/README.md)
- [Auth Components](/home/user/Omniops/components/auth/README.md)
- [Billing Components](/home/user/Omniops/components/billing/README.md)

---

## Keywords

multi-tenant, organizations, team management, seat allocation, invitations, role management

## Overview

Components for organization/team management in multi-tenant environment.

## Files

- **[organization-switcher.tsx](organization-switcher.tsx)** - Switch between organizations
- **[team-members-list.tsx](team-members-list.tsx)** - Display team members
- **[invite-member-form.tsx](invite-member-form.tsx)** - Invite new team members
- **[seat-usage-indicator.tsx](seat-usage-indicator.tsx)** - Show seat usage/limits
- **[upgrade-seats-modal.tsx](upgrade-seats-modal.tsx)** - Upgrade seat count
- **[upgrade-seats/](upgrade-seats/)** - Seat upgrade flow components

## Usage

```typescript
import { OrganizationSwitcher } from '@/components/organizations/organization-switcher';

<OrganizationSwitcher currentOrgId={orgId} />
```

## Features

- Organization switching
- Team member management
- Seat allocation
- Role management
- Invitation system
