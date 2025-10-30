# Hooks Tests Directory

**Purpose:** Comprehensive test suite for all custom React hooks, validating lifecycle behavior, state management, side effects, and error handling.

**Test Type:** Unit

**Last Updated:** 2025-10-30

**Coverage:** Custom hooks for dashboard analytics, conversations, GDPR compliance, telemetry, and data fetching.

**Estimated Test Count:** 102 tests (2,303 LOC)

## Overview

Hook tests ensure that custom React hooks behave correctly throughout their lifecycle, handle state updates properly, manage side effects, and respond to errors gracefully. These tests use `@testing-library/react-hooks` (or `renderHook` from React Testing Library) to test hooks in isolation.

## Test Structure

```
__tests__/hooks/
├── use-dashboard-analytics.test.tsx      # Analytics data fetching (25 tests, 388 LOC)
├── use-dashboard-conversations.test.tsx  # Conversation management (25 tests, 390 LOC)
├── use-dashboard-overview.test.tsx       # Overview statistics (25 tests, 393 LOC)
├── use-dashboard-telemetry.test.tsx      # Telemetry data collection (12 tests, 136 LOC)
├── use-gdpr-delete-basic.test.tsx        # GDPR deletion - basic flow
├── use-gdpr-delete-errors.test.tsx       # GDPR deletion - error cases
├── use-gdpr-delete-validation.test.tsx   # GDPR deletion - validation
├── use-gdpr-export-basic.test.tsx        # GDPR export - basic flow
├── use-gdpr-export-errors.test.tsx       # GDPR export - error cases
└── use-gdpr-export-validation.test.tsx   # GDPR export - validation
```

## Running Tests

```bash
# Run all hook tests
npm test -- __tests__/hooks/

# Run specific hook test
npm test -- use-dashboard-analytics.test.tsx

# Run with coverage
npm test -- --coverage __tests__/hooks/

# Run in watch mode
npm test -- --watch __tests__/hooks/

# Run GDPR tests only
npm test -- --testNamePattern="GDPR" __tests__/hooks/
```

## Test Files

### Dashboard Hooks (87 tests, 1,307 LOC)

**use-dashboard-analytics.test.tsx (25 tests, 388 LOC)**

Tests for analytics data fetching, filtering, and aggregation.

**Key Test Areas:**
- Initial data fetching
- Date range filtering
- Metrics aggregation
- Real-time updates
- Error handling and retries
- Loading states
- Cache invalidation

**Example Test:**
```typescript
describe('useDashboardAnalytics', () => {
  it('should fetch analytics data on mount', async () => {
    const { result } = renderHook(() =>
      useDashboardAnalytics('example.com')
    )

    expect(result.current.isLoading).toBe(true)

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.data).toEqual({
      totalMessages: 100,
      totalConversations: 50,
      averageResponseTime: 1.5
    })
  })

  it('should refetch when date range changes', async () => {
    const { result, rerender } = renderHook(
      ({ startDate, endDate }) => useDashboardAnalytics('example.com', {
        startDate,
        endDate
      }),
      {
        initialProps: {
          startDate: '2025-01-01',
          endDate: '2025-01-31'
        }
      }
    )

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    // Change date range
    rerender({
      startDate: '2025-02-01',
      endDate: '2025-02-28'
    })

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(2)
    })
  })
})
```

**use-dashboard-conversations.test.tsx (25 tests, 390 LOC)**

Tests for conversation list management and filtering.

**Key Test Areas:**
- Conversation list fetching
- Pagination
- Filtering by status
- Search functionality
- Conversation selection
- Real-time updates via polling
- Optimistic updates

**use-dashboard-overview.test.tsx (25 tests, 393 LOC)**

Tests for dashboard overview statistics.

**Key Test Areas:**
- Overview metrics calculation
- Data aggregation
- Trend analysis
- Comparison periods
- Chart data formatting
- Widget data refresh

**use-dashboard-telemetry.test.tsx (12 tests, 136 LOC)**

Tests for telemetry data collection and reporting.

**Key Test Areas:**
- Event tracking
- Performance metrics collection
- User behavior analytics
- Error tracking
- Session management

### GDPR Compliance Hooks (15+ tests, 996+ LOC)

**GDPR Delete Hook Suite**

Tests for GDPR-compliant data deletion workflows.

**use-gdpr-delete-basic.test.tsx**
- Basic deletion flow
- User confirmation
- Deletion status tracking
- Success callbacks

**use-gdpr-delete-errors.test.tsx**
- API error handling
- Network failures
- Partial deletion failures
- Retry mechanisms

**use-gdpr-delete-validation.test.tsx**
- Input validation
- Email verification
- Permission checks
- Safety confirmations

**Example Test:**
```typescript
describe('useGdprDelete', () => {
  it('should delete user data successfully', async () => {
    const { result } = renderHook(() => useGdprDelete())

    expect(result.current.isDeleting).toBe(false)

    await act(async () => {
      await result.current.deleteData('user@example.com')
    })

    expect(result.current.isDeleting).toBe(false)
    expect(result.current.success).toBe(true)
    expect(result.current.error).toBeNull()
  })

  it('should handle deletion errors', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('API Error'))

    const { result } = renderHook(() => useGdprDelete())

    await act(async () => {
      await result.current.deleteData('user@example.com')
    })

    expect(result.current.error).toBeTruthy()
    expect(result.current.success).toBe(false)
  })
})
```

**GDPR Export Hook Suite**

Tests for GDPR-compliant data export workflows.

**use-gdpr-export-basic.test.tsx**
- Basic export flow
- Data format selection
- Export status tracking
- Download handling

**use-gdpr-export-errors.test.tsx**
- Export failures
- Timeout handling
- Large dataset exports
- Retry logic

**use-gdpr-export-validation.test.tsx**
- Request validation
- Data scope verification
- Format validation
- Size limit checks

**Example Test:**
```typescript
describe('useGdprExport', () => {
  it('should export all user data', async () => {
    const { result } = renderHook(() => useGdprExport())

    await act(async () => {
      await result.current.exportData('user@example.com')
    })

    expect(result.current.exportedData).toContain('conversations')
    expect(result.current.exportedData).toContain('messages')
    expect(result.current.exportedData).toContain('user_profile')
  })
})
```

## Testing Patterns

### Hook Lifecycle Testing
```typescript
it('should clean up on unmount', () => {
  const { unmount } = renderHook(() => useMyHook())

  // Verify subscriptions or timers are active
  expect(someSubscription.isActive).toBe(true)

  unmount()

  // Verify cleanup occurred
  expect(someSubscription.isActive).toBe(false)
})
```

### Dependency Change Testing
```typescript
it('should refetch on dependency change', async () => {
  const { result, rerender } = renderHook(
    ({ filter }) => useMyHook(filter),
    { initialProps: { filter: 'active' } }
  )

  await waitFor(() => expect(result.current.isLoading).toBe(false))

  rerender({ filter: 'inactive' })

  await waitFor(() => {
    expect(global.fetch).toHaveBeenCalledTimes(2)
  })
})
```

### Error Handling Testing
```typescript
it('should handle API errors gracefully', async () => {
  global.fetch = jest.fn().mockRejectedValue(new Error('Network error'))

  const { result } = renderHook(() => useMyHook())

  await waitFor(() => {
    expect(result.current.error).toBeTruthy()
    expect(result.current.data).toBeNull()
  })
})
```

### Optimistic Updates Testing
```typescript
it('should apply optimistic updates', async () => {
  const { result } = renderHook(() => useConversations())

  const newConversation = { id: 'new-1', status: 'active' }

  act(() => {
    result.current.addConversation(newConversation)
  })

  // Immediately reflects in state
  expect(result.current.conversations).toContain(newConversation)

  // Verify API was called
  await waitFor(() => {
    expect(global.fetch).toHaveBeenCalled()
  })
})
```

## Mock Setup

### Global Fetch Mock
```typescript
beforeEach(() => {
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    json: async () => mockData
  })
})

afterEach(() => {
  jest.restoreAllMocks()
})
```

### Custom Hook Wrapper
```typescript
const wrapper = ({ children }) => (
  <QueryClientProvider client={queryClient}>
    {children}
  </QueryClientProvider>
)

const { result } = renderHook(() => useMyHook(), { wrapper })
```

## Coverage Targets

| Metric | Target |
|--------|--------|
| Lines | 95%+ |
| Functions | 100% |
| Branches | 90%+ |
| Statements | 95%+ |

## Best Practices

1. **Test hook behavior, not implementation**: Focus on what the hook does, not how it does it
2. **Use act() for state updates**: Wrap all state changes in `act()` or `waitFor()`
3. **Test all hook states**: Initial, loading, success, error states
4. **Test cleanup**: Verify subscriptions, timers, and listeners are cleaned up
5. **Test dependencies**: Verify hooks refetch when dependencies change
6. **Isolate tests**: Each test should be independent and not rely on others
7. **Mock external dependencies**: Mock API calls, timers, and external services

## Common Hook Patterns

### Data Fetching Hook
```typescript
function useDataFetch(url: string) {
  const [data, setData] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    let isCancelled = false

    const fetchData = async () => {
      setIsLoading(true)
      try {
        const response = await fetch(url)
        const json = await response.json()
        if (!isCancelled) {
          setData(json)
        }
      } catch (err) {
        if (!isCancelled) {
          setError(err)
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false)
        }
      }
    }

    fetchData()

    return () => {
      isCancelled = true
    }
  }, [url])

  return { data, isLoading, error }
}
```

### Polling Hook
```typescript
function usePolling(callback: () => void, interval: number) {
  useEffect(() => {
    const intervalId = setInterval(callback, interval)
    return () => clearInterval(intervalId)
  }, [callback, interval])
}
```

## Related Code

- **Source Hooks**: `/hooks/` - Custom hook implementations
- **Component Tests**: `/__tests__/components/` - Component tests using these hooks
- **API Tests**: `/__tests__/api/` - API endpoint tests for data sources

## Troubleshooting

### Common Issues

1. **"Act() warnings"**: Wrap state updates in `act()` or `await waitFor()`
2. **"Memory leak warnings"**: Ensure cleanup functions are properly implemented
3. **"Too many re-renders"**: Check for infinite loops in useEffect dependencies
4. **"State updates on unmounted component"**: Use cleanup flags to prevent updates

### Debug Tips

```bash
# Run with verbose output
npm test -- --verbose use-dashboard-analytics.test.tsx

# Run single test
npm test -- --testNamePattern="should fetch analytics data"

# Debug with console output
# Add console.log in tests to see current state
```

## Related Documentation

- [Main Tests README](/Users/jamesguy/Omniops/__tests__/README.md) - Overall testing strategy
- [Component Tests](/Users/jamesguy/Omniops/__tests__/components/README.md) - Component tests
- [Testing Guide](../docs/TESTING_GUIDE.md) - Comprehensive testing patterns
