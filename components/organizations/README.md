# Organizations Directory

**Purpose:** Multi-tenant organization management components
**Last Updated:** 2025-10-30
**Related:** [Contexts](/lib/contexts), [Team Dashboard](/app/dashboard/team)

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
