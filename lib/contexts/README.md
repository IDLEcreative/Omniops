**Last Updated:** 2025-11-18
**Verified Accurate For:** v0.1.0
**Status:** Active
**Type:** Reference

# Contexts Directory

**Purpose:** React Context providers for organization and multi-tenant state management
**Last Updated:** 2025-10-30
**Related:** [Components](/components), [Auth](/lib/auth)

## Overview

Provides React Context implementations for organization-level state management in multi-tenant environment.

## Files

- **[organization-provider.tsx](organization-provider.tsx)** - Main organization context provider
- **[organization-context.tsx](organization-context.tsx)** - Context definition
- **[organization-cache.ts](organization-cache.ts)** - Organization data caching
- **[organization-types.ts](organization-types.ts)** - TypeScript types
- **[organization-context-index.ts](organization-context-index.ts)** - Barrel exports

## Usage

```typescript
import { OrganizationProvider, useOrganization } from '@/lib/contexts';

function App() {
  return (
    <OrganizationProvider>
      <YourApp />
    </OrganizationProvider>
  );
}

function YourComponent() {
  const { organization, loading } = useOrganization();
  return <div>{organization.name}</div>;
}
```

## Features

- Organization data caching
- Multi-tenant isolation
- Real-time updates
- Permission management
