**Last Updated:** 2025-11-18
**Verified Accurate For:** v0.1.0
**Status:** Active
**Type:** Reference

# Database Utilities

**Purpose:** Shared database utilities and helpers for CLI tools and tests

**Status:** Active
**Last Updated:** 2025-11-10

## Modules

### `types.ts` (36 LOC)
Shared TypeScript interfaces:
- `CleanupOptions` - Configuration for cleanup operations
- `CleanupResult` - Result object with deletion counts
- `DatabaseStats` - Statistics about database content

### `supabase-client.ts` (17 LOC)
Supabase client factory:
- `createSupabaseClient()` - Creates authenticated Supabase client with service role

### `domain-helper.ts` (28 LOC)
Domain utilities:
- `getDomainId()` - Looks up domain ID from domain string
- `resetDomainTimestamps()` - Resets scraping timestamps for a domain

## Usage

These utilities are designed to be reused across multiple CLI tools and tests:

```typescript
import { createSupabaseClient } from '__tests__/utils/database/supabase-client';
import { getDomainId, resetDomainTimestamps } from '__tests__/utils/database/domain-helper';
import { CleanupOptions, DatabaseStats } from '__tests__/utils/database/types';

const supabase = createSupabaseClient();
const domainId = await getDomainId(supabase, 'example.com');
```

## Related Files

- `__tests__/database/cleanup/` - Database cleanup CLI tool using these utilities
