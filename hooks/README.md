**Last Updated:** 2025-11-18
**Verified Accurate For:** v0.1.0
**Status:** Active
**Type:** Reference

# Hooks Directory

**Purpose:** Custom React hooks for state management and API integration across the OmniOps application
**Last Updated:** 2025-10-30
**Related:** [Components](/components), [Lib](/lib), [Types](/types)

## Overview

This directory contains custom React hooks that encapsulate reusable logic for dashboard data fetching, GDPR compliance, keyboard shortcuts, and real-time subscriptions. All hooks follow React best practices with proper cleanup and error handling.

## Directory Structure

```
hooks/
├── README.md                        # This documentation
├── use-dashboard-analytics.ts       # Dashboard analytics data fetching
├── use-dashboard-conversations.ts   # Conversation history management
├── use-dashboard-overview.ts        # Dashboard overview metrics
├── use-dashboard-telemetry.ts       # Telemetry and usage data
├── use-conversation-transcript.ts   # Individual conversation transcript
├── use-gdpr-delete.ts              # GDPR data deletion requests
├── use-gdpr-export.ts              # GDPR data export functionality
├── use-keyboard-shortcuts.ts       # Global keyboard shortcut handling
└── use-realtime-conversations.ts   # Real-time conversation updates
```

## Key Hooks

### Dashboard Data Fetching

#### `use-dashboard-analytics.ts`
Fetches and manages dashboard analytics data with configurable time ranges.

**Features:**
- Configurable time range (default: 7 days)
- Auto-refresh capability
- Request cancellation on unmount
- Error handling with retry logic

**Usage:**
```typescript
import { useDashboardAnalytics } from '@/hooks/use-dashboard-analytics';

function AnalyticsDashboard() {
  const { data, loading, error, refresh } = useDashboardAnalytics({ days: 30 });

  if (loading) return <Spinner />;
  if (error) return <Error message={error.message} />;

  return <AnalyticsChart data={data} />;
}
```

#### `use-dashboard-overview.ts`
Provides high-level dashboard metrics and KPIs.

**Features:**
- Total conversations, messages, customers
- Response time metrics
- Satisfaction scores
- Auto-refresh support

**Usage:**
```typescript
import { useDashboardOverview } from '@/hooks/use-dashboard-overview';

function DashboardOverview() {
  const { data, loading, refresh } = useDashboardOverview();

  return (
    <MetricsGrid>
      <Metric label="Conversations" value={data?.totalConversations} />
      <Metric label="Avg Response Time" value={data?.avgResponseTime} />
    </MetricsGrid>
  );
}
```

#### `use-dashboard-conversations.ts`
Manages conversation list with pagination, filtering, and search.

**Features:**
- Pagination support
- Search functionality
- Date range filtering
- Sort by multiple fields
- Real-time updates

**Usage:**
```typescript
import { useDashboardConversations } from '@/hooks/use-dashboard-conversations';

function ConversationList() {
  const { conversations, loading, loadMore, hasMore } = useDashboardConversations({
    pageSize: 20,
    search: searchTerm
  });

  return (
    <InfiniteScroll onLoadMore={loadMore} hasMore={hasMore}>
      {conversations.map(conv => <ConversationCard key={conv.id} {...conv} />)}
    </InfiniteScroll>
  );
}
```

#### `use-dashboard-telemetry.ts`
Tracks and displays system telemetry data.

**Features:**
- API response times
- Database query performance
- Cache hit rates
- Error tracking

**Usage:**
```typescript
import { useDashboardTelemetry } from '@/hooks/use-dashboard-telemetry';

function TelemetryMonitor() {
  const { data, loading } = useDashboardTelemetry();

  return (
    <TelemetryChart
      apiLatency={data?.apiLatency}
      cacheHitRate={data?.cacheHitRate}
    />
  );
}
```

### Conversation Management

#### `use-conversation-transcript.ts`
Fetches and manages individual conversation transcripts.

**Features:**
- Message-by-message loading
- Metadata tracking
- Source citation support
- Real-time updates

**Usage:**
```typescript
import { useConversationTranscript } from '@/hooks/use-conversation-transcript';

function ConversationView({ conversationId }: { conversationId: string }) {
  const { messages, loading, metadata } = useConversationTranscript(conversationId);

  return (
    <Transcript>
      {messages.map(msg => <Message key={msg.id} {...msg} />)}
    </Transcript>
  );
}
```

#### `use-realtime-conversations.ts`
Subscribes to real-time conversation updates via Supabase Realtime.

**Features:**
- WebSocket-based updates
- Automatic reconnection
- Optimistic UI updates
- Presence tracking

**Usage:**
```typescript
import { useRealtimeConversations } from '@/hooks/use-realtime-conversations';

function LiveConversations() {
  const { conversations, onlineUsers } = useRealtimeConversations();

  return (
    <ConversationList
      conversations={conversations}
      onlineUsers={onlineUsers}
    />
  );
}
```

### GDPR Compliance

#### `use-gdpr-export.ts`
Handles GDPR data export requests.

**Features:**
- Generates complete user data export
- JSON format download
- Progress tracking
- Error handling

**Usage:**
```typescript
import { useGDPRExport } from '@/hooks/use-gdpr-export';

function PrivacySettings() {
  const { exportData, loading, error } = useGDPRExport();

  return (
    <Button onClick={exportData} loading={loading}>
      Download My Data
    </Button>
  );
}
```

#### `use-gdpr-delete.ts`
Manages GDPR data deletion (right to be forgotten).

**Features:**
- Complete data deletion
- Confirmation workflow
- Irreversible action protection
- Audit trail

**Usage:**
```typescript
import { useGDPRDelete } from '@/hooks/use-gdpr-delete';

function DeleteAccount() {
  const { deleteData, loading, confirmed, setConfirmed } = useGDPRDelete();

  return (
    <DangerZone>
      <Checkbox checked={confirmed} onChange={setConfirmed}>
        I understand this is permanent
      </Checkbox>
      <Button onClick={deleteData} disabled={!confirmed} variant="destructive">
        Delete All My Data
      </Button>
    </DangerZone>
  );
}
```

### Utilities

#### `use-keyboard-shortcuts.ts`
Global keyboard shortcut management system.

**Features:**
- Multi-key combinations
- Platform detection (Mac vs Windows)
- Context-aware shortcuts
- Conflict prevention

**Usage:**
```typescript
import { useKeyboardShortcuts } from '@/hooks/use-keyboard-shortcuts';

function App() {
  useKeyboardShortcuts({
    'cmd+k': () => openCommandPalette(),
    'cmd+/': () => toggleHelp(),
    'esc': () => closeModal(),
  });

  return <YourApp />;
}
```

## Hook Patterns & Best Practices

### Standard Hook Structure
All hooks follow this consistent pattern:

```typescript
import { useState, useEffect, useCallback } from 'react';

interface HookOptions {
  // Configuration options
}

interface HookResult {
  data: DataType | null;
  loading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
}

export function useCustomHook(options: HookOptions = {}): HookResult {
  // 1. State management
  const [data, setData] = useState<DataType | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // 2. Data fetching logic
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/endpoint');
      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [/* dependencies */]);

  // 3. Initial data fetch
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // 4. Return public API
  return { data, loading, error, refresh: fetchData };
}
```

### Common Patterns

**1. Request Cancellation**
```typescript
const abortControllerRef = useRef<AbortController | null>(null);

useEffect(() => {
  abortControllerRef.current?.abort();
  const controller = new AbortController();
  abortControllerRef.current = controller;

  fetch('/api/data', { signal: controller.signal });

  return () => controller.abort();
}, [dependency]);
```

**2. Auto-Refresh**
```typescript
useEffect(() => {
  if (!autoRefresh) return;

  const interval = setInterval(fetchData, refreshInterval);
  return () => clearInterval(interval);
}, [autoRefresh, refreshInterval, fetchData]);
```

**3. Optimistic Updates**
```typescript
const updateItem = useCallback(async (id: string, updates: Partial<Item>) => {
  // Optimistic update
  setItems(prev => prev.map(item =>
    item.id === id ? { ...item, ...updates } : item
  ));

  try {
    await fetch(`/api/items/${id}`, { method: 'PATCH', body: JSON.stringify(updates) });
  } catch (error) {
    // Rollback on error
    fetchItems();
  }
}, [fetchItems]);
```

**4. Pagination**
```typescript
const [page, setPage] = useState(1);
const [hasMore, setHasMore] = useState(true);

const loadMore = useCallback(async () => {
  const nextPage = page + 1;
  const newData = await fetchPage(nextPage);

  setData(prev => [...prev, ...newData]);
  setHasMore(newData.length > 0);
  setPage(nextPage);
}, [page]);
```

## Testing Hooks

All hooks should be tested using `@testing-library/react-hooks`:

```typescript
import { renderHook, act } from '@testing-library/react-hooks';
import { useDashboardAnalytics } from '@/hooks/use-dashboard-analytics';

describe('useDashboardAnalytics', () => {
  it('should fetch analytics data', async () => {
    const { result, waitForNextUpdate } = renderHook(() =>
      useDashboardAnalytics({ days: 7 })
    );

    expect(result.current.loading).toBe(true);

    await waitForNextUpdate();

    expect(result.current.loading).toBe(false);
    expect(result.current.data).toBeDefined();
  });

  it('should handle refresh', async () => {
    const { result, waitForNextUpdate } = renderHook(() =>
      useDashboardAnalytics()
    );

    await waitForNextUpdate();

    act(() => {
      result.current.refresh();
    });

    expect(result.current.loading).toBe(true);
  });
});
```

## Performance Considerations

### Memoization
Use `useCallback` and `useMemo` to prevent unnecessary re-renders:

```typescript
const memoizedValue = useMemo(() =>
  expensiveComputation(data),
  [data]
);

const memoizedCallback = useCallback(() => {
  doSomething(data);
}, [data]);
```

### Debouncing
For search and user input:

```typescript
const [debouncedValue, setDebouncedValue] = useState(value);

useEffect(() => {
  const timer = setTimeout(() => setDebouncedValue(value), 300);
  return () => clearTimeout(timer);
}, [value]);
```

### Cleanup
Always clean up effects to prevent memory leaks:

```typescript
useEffect(() => {
  const subscription = someObservable.subscribe();
  const interval = setInterval(() => {}, 1000);

  return () => {
    subscription.unsubscribe();
    clearInterval(interval);
  };
}, []);
```

## Dependencies

Required packages:
- `react` - Core React library
- `@supabase/supabase-js` - Real-time subscriptions
- TypeScript types from `@/types`

## Related Documentation

- [Components Documentation](/components/README.md) - React components using these hooks
- [API Documentation](/app/api/README.md) - API endpoints called by hooks
- [Types Documentation](/types/README.md) - TypeScript type definitions
- [Database Schema](/docs/07-REFERENCE/REFERENCE_DATABASE_SCHEMA.md) - Data structures

## Contributing

When adding new hooks:

1. **Follow naming convention**: `use-<feature-name>.ts`
2. **Include TypeScript types**: Define `Options` and `Result` interfaces
3. **Implement cleanup**: Always clean up effects and subscriptions
4. **Write tests**: Add corresponding test file
5. **Document usage**: Add examples to this README
6. **Handle errors**: Provide clear error states
7. **Support SSR**: Ensure hooks work with Next.js SSR
