# Dashboard Directory

**Purpose:** Dashboard utilities and data processing for admin interface
**Last Updated:** 2025-10-30
**Related:** [Dashboard Pages](/app/dashboard), [Components Dashboard](/components/dashboard)

## Overview

Utilities for dashboard navigation, analytics, integrations, and settings management.

## Files

- **[analytics.ts](analytics.ts)** - Analytics data processing
- **[help-data.ts](help-data.ts)** - Help documentation data
- **[help-utils.ts](help-utils.ts)** - Help system utilities
- **[integrations-data.tsx](integrations-data.tsx)** - Integration configuration data
- **[integrations-utils.ts](integrations-utils.ts)** - Integration utilities
- **[layout-utils.ts](layout-utils.ts)** - Dashboard layout utilities
- **[navigation-config.ts](navigation-config.ts)** - Navigation menu configuration
- **[overview-utils.ts](overview-utils.ts)** - Overview page utilities
- **[privacy-utils.ts](privacy-utils.ts)** - Privacy settings utilities
- **[settings-utils.ts](settings-utils.ts)** - Settings management utilities

## Usage

```typescript
import { getDashboardNavigation } from '@/lib/dashboard/navigation-config';

const navItems = getDashboardNavigation(user);
```
