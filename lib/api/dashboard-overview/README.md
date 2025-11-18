**Last Updated:** 2025-11-18
**Verified Accurate For:** v0.1.0
**Status:** Active
**Type:** Reference

# Dashboard Overview API Module

**Type:** API
**Status:** Active
**Last Updated:** 2025-11-18
**Verified For:** v0.1.0
**Dependencies:** [Supabase](/home/user/Omniops/lib/supabase-server.ts), [Dashboard Analytics](/home/user/Omniops/lib/dashboard/analytics.ts)
**Estimated Read Time:** 4 minutes

## Purpose

Modular, reusable business logic for dashboard overview API endpoint with type-safe data fetching and transformation.

## Quick Links
- [Main Handler](handlers.ts) - Business logic orchestration
- [Services](services.ts) - Data fetching
- [Types](types.ts) - TypeScript definitions
- [API Route](/home/user/Omniops/app/api/dashboard/overview/route.ts) - HTTP endpoint

## Keywords
- Dashboard, Overview, Analytics, API, Business Logic, Data Services

---

## Module Structure

```
lib/api/dashboard-overview/
├── index.ts        (9 LOC)   - Centralized exports
├── types.ts        (77 LOC)  - TypeScript type definitions
├── utils.ts        (66 LOC)  - Helper/utility functions
├── services.ts     (169 LOC) - Data fetching services
└── handlers.ts     (154 LOC) - Business logic orchestration
```

## Files Overview

### `types.ts` - Type Definitions
Exports all TypeScript interfaces and types:
- `ConversationRecord` - Database conversation schema
- `ConversationMetadata` - Parsed metadata structure
- `RecentConversationEntry` - Formatted recent conversation
- `TelemetryRow` - Telemetry data schema
- `DashboardOverview` - Complete API response type

### `utils.ts` - Utility Functions
Pure helper functions for data formatting:
- `formatChange(current, previous)` - Calculate percentage changes
- `toDateKey(isoDate)` - Convert ISO timestamp to date string
- `parseConversationMetadata(metadata)` - Safely parse conversation metadata
- `getDefaultOverview()` - Return default overview for error cases

### `services.ts` - Data Services
Database fetching and data transformation:
- `fetchConversations(supabase, startDate)` - Fetch conversation records
- `fetchMessages(supabase, startDate, endDate?)` - Fetch messages with filters
- `fetchTelemetryRows(supabase, startDate)` - Fetch telemetry data
- `fetchLastTraining(supabase)` - Get last training timestamp
- `buildRecentConversations(conversations, messages)` - Format recent conversations
- `buildConversationTrend(conversations, startDate, days, ...)` - Generate trend data
- `calculateTelemetryStats(telemetryRows, now)` - Compute telemetry metrics

### `handlers.ts` - Business Logic
Main orchestration of dashboard overview generation:
- `buildDashboardOverview(supabase, days)` - Main function that orchestrates all data fetching and processing

### `index.ts` - Exports
Re-exports all public APIs from the module for convenient importing.

## Usage Examples

### Basic Import (from index)
```typescript
import { buildDashboardOverview, getDefaultOverview } from '@/lib/api/dashboard-overview';
import type { DashboardOverview } from '@/lib/api/dashboard-overview';
```

### Specific Import
```typescript
import { buildDashboardOverview } from '@/lib/api/dashboard-overview/handlers';
import { formatChange, toDateKey } from '@/lib/api/dashboard-overview/utils';
import type { ConversationRecord, TelemetryRow } from '@/lib/api/dashboard-overview/types';
```

### Using in API Route
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase-server';
import { buildDashboardOverview, getDefaultOverview } from '@/lib/api/dashboard-overview';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServiceRoleClient();
    const days = parseInt(request.nextUrl.searchParams.get('days') || '7', 10);
    const overview = await buildDashboardOverview(supabase, days);
    return NextResponse.json(overview);
  } catch (error) {
    return NextResponse.json(getDefaultOverview(), { status: 200 });
  }
}
```

### Testing Utilities
```typescript
import { formatChange, toDateKey } from '@/lib/api/dashboard-overview/utils';

describe('Dashboard Overview Utils', () => {
  test('formatChange calculates percentage correctly', () => {
    expect(formatChange(150, 100)).toBe(50);
    expect(formatChange(100, 0)).toBe(100);
  });

  test('toDateKey extracts date', () => {
    expect(toDateKey('2025-10-26T15:30:00.000Z')).toBe('2025-10-26');
  });
});
```

## API Response Structure

The `buildDashboardOverview()` function returns a `DashboardOverview` object with:

```typescript
{
  summary: {
    totalConversations: number;
    conversationChange: number;
    activeUsers: number;
    activeUsersChange: number;
    avgResponseTime: number;
    avgResponseTimeChange: number;
    resolutionRate: number;
    resolutionRateChange: number;
    satisfactionScore: number;
  };
  trend: Array<{
    date: string;
    conversations: number;
    satisfactionScore: number;
  }>;
  recentConversations: Array<{
    id: string;
    createdAt: string;
    status: 'active' | 'waiting' | 'resolved';
    lastMessagePreview: string;
    lastMessageAt: string;
    customerName: string | null;
  }>;
  languageDistribution: Array<{
    language: string;
    count: number;
    percentage: number;
  }>;
  quickStats: {
    satisfaction: number;
    avgResponseTime: number;
    conversationsToday: number;
    successRate: number;
    totalTokens: number;
    totalCostUSD: number;
    avgSearchesPerRequest: number;
  };
  telemetry: {
    totalRequests: number;
    successfulRequests: number;
    successRate: number;
    avgSearchesPerRequest: number;
    totalTokens: number;
    totalCostUSD: number;
  };
  botStatus: {
    online: boolean;
    uptimePercent: number;
    primaryModel: string;
    lastTrainingAt: string | null;
  };
}
```

## Performance Considerations

- Uses `Promise.all()` for parallel data fetching where possible
- Efficient date filtering to minimize database queries
- Calculates metrics in-memory rather than in database for flexibility
- Implements graceful degradation with default overview on errors

## Testing

All functions are pure and easily testable:
- **Utils**: Test with simple inputs/outputs
- **Services**: Mock Supabase client for database operations
- **Handlers**: Integration tests with mocked services

## Related Files

- `app/api/dashboard/overview/route.ts` - Main API route (35 LOC)
- `lib/dashboard/analytics.ts` - Message analysis utilities
- `lib/supabase-server.ts` - Supabase client creation

## Maintenance

When modifying this module:
1. Maintain file size limits (all files <300 LOC)
2. Keep functions pure where possible
3. Update types when adding new fields
4. Add tests for new functionality
5. Update this README for significant changes
