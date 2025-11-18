# Dashboard Directory

**Type:** Utility
**Status:** Active
**Last Updated:** 2025-11-18
**Verified For:** v0.1.0
**Dependencies:** [Dashboard Pages](/home/user/Omniops/app/dashboard), [Dashboard Components](/home/user/Omniops/components/dashboard)
**Estimated Read Time:** 1 minute

## Purpose

Dashboard utilities and data processing for the admin interface. Provides navigation configuration, analytics processing, integration management, and settings utilities for the dashboard experience.

## Quick Links
- [Dashboard Pages](/home/user/Omniops/app/dashboard)
- [Dashboard Components](/home/user/Omniops/components/dashboard)
- [Analytics Service](/home/user/Omniops/lib/analytics)

## Table of Contents
- [Files](#files)
- [Usage Examples](#usage-examples)
- [Related Components](#related-components)

---

## Overview

Utilities for dashboard navigation, analytics, integrations, and settings management. These utilities support the admin dashboard interface with data processing, configuration management, and helper functions.

## Files

### Core Utilities

- **[analytics.ts](analytics.ts)** - Analytics data processing and aggregation
- **[navigation-config.ts](navigation-config.ts)** - Navigation menu configuration and routing
- **[layout-utils.ts](layout-utils.ts)** - Dashboard layout utilities and responsive helpers

### Feature Utilities

- **[integrations-data.tsx](integrations-data.tsx)** - Integration configuration data and metadata
- **[integrations-utils.ts](integrations-utils.ts)** - Integration management utilities
- **[help-data.ts](help-data.ts)** - Help documentation data structure
- **[help-utils.ts](help-utils.ts)** - Help system search and navigation utilities

### Settings & Privacy

- **[overview-utils.ts](overview-utils.ts)** - Dashboard overview page utilities
- **[privacy-utils.ts](privacy-utils.ts)** - Privacy settings management utilities
- **[settings-utils.ts](settings-utils.ts)** - General settings management utilities

## Usage Examples

### Navigation Configuration

```typescript
import { getDashboardNavigation } from '@/lib/dashboard/navigation-config';

// Get navigation items for current user
const navItems = getDashboardNavigation(user);

// Render navigation menu
{navItems.map(item => (
  <NavItem key={item.id} {...item} />
))}
```

### Analytics Processing

```typescript
import { processAnalyticsData } from '@/lib/dashboard/analytics';

// Process raw analytics for dashboard display
const analytics = await processAnalyticsData(customerId, dateRange);

console.log('Total conversations:', analytics.totalConversations);
console.log('Average response time:', analytics.avgResponseTime);
```

### Integration Management

```typescript
import { getIntegrationStatus } from '@/lib/dashboard/integrations-utils';

// Check integration status
const wooCommerceStatus = await getIntegrationStatus('woocommerce', customerId);

if (wooCommerceStatus.enabled) {
  // Integration is active
}
```

### Settings Management

```typescript
import { updateDashboardSettings } from '@/lib/dashboard/settings-utils';

// Update user settings
await updateDashboardSettings(userId, {
  theme: 'dark',
  notifications: true,
  language: 'en'
});
```

## Related Components

- [Dashboard Pages](/home/user/Omniops/app/dashboard) - Next.js dashboard routes
- [Dashboard Components](/home/user/Omniops/components/dashboard) - React dashboard components
- [Analytics Service](/home/user/Omniops/lib/analytics) - Analytics data collection
- [Integrations](/home/user/Omniops/lib/integrations) - External integrations
