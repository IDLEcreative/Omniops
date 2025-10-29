# Testing Guide

**Last Updated:** 2025-10-25
**Test Suite Version:** v2.0

Comprehensive guide for writing and maintaining tests in the OmniOps platform.

---

## Table of Contents

1. [Overview](#overview)
2. [Test Architecture](#test-architecture)
3. [Writing Component Tests](#writing-component-tests)
4. [Writing Hook Tests](#writing-hook-tests)
5. [Writing API Tests](#writing-api-tests)
6. [Testing Patterns & Best Practices](#testing-patterns--best-practices)
7. [Common Pitfalls & Solutions](#common-pitfalls--solutions)
8. [Running Tests](#running-tests)

---

## Overview

### Test Suite Statistics

- **Total Test Files:** 67
- **Total Tests:** 1,048+
- **Total Test Code:** 23,677 LOC
- **Coverage Target:** 80%+
- **Test Categories:**
  - Component Tests: 138 tests (2,542 LOC)
  - Hook Tests: 102 tests (2,303 LOC)
  - API Tests: 300+ tests
  - Integration Tests: 100+ tests
  - Business Logic Tests: 400+ tests

### Tech Stack

- **Test Runner:** Jest 29
- **React Testing:** React Testing Library
- **API Mocking:** MSW (Mock Service Worker)
- **Coverage:** Istanbul/nyc
- **Async Testing:** Jest async matchers

---

## Test Architecture

### Directory Structure

```
__tests__/
├── components/           # Component tests (138 tests)
│   ├── ChatWidget.test.tsx          # Chat widget UI (38 tests)
│   ├── ErrorBoundary.test.tsx       # Error handling (33 tests)
│   ├── auth/
│   │   └── UserMenu.test.tsx        # Auth UI (28 tests)
│   └── chat/
│       └── MessageContent.test.tsx  # Message rendering (39 tests)
│
├── hooks/                # Custom hook tests (102 tests)
│   ├── use-dashboard-analytics.test.tsx      # Analytics (25 tests)
│   ├── use-dashboard-conversations.test.tsx  # Conversations (25 tests)
│   ├── use-dashboard-overview.test.tsx       # Overview (25 tests)
│   ├── use-dashboard-telemetry.test.ts       # Telemetry (12 tests)
│   ├── use-gdpr-delete.test.tsx              # GDPR deletion (8 tests)
│   └── use-gdpr-export.test.tsx              # GDPR export (7 tests)
│
├── api/                  # API route tests (300+ tests)
│   ├── chat/            # Chat endpoints
│   ├── gdpr/            # Privacy endpoints
│   ├── scrape/          # Scraping endpoints
│   └── woocommerce/     # E-commerce endpoints
│
├── integration/          # Integration tests (100+ tests)
│   ├── enhanced-scraper-system.test.ts
│   ├── multi-tenant-isolation.test.ts
│   └── woocommerce-schema-fix.test.ts
│
├── lib/                  # Business logic tests (400+ tests)
│   ├── agents/          # AI agent tests
│   ├── analytics/       # Analytics tests
│   └── ...              # Various services
│
├── mocks/                # Mock data and handlers
│   ├── handlers.ts      # MSW request handlers
│   └── server.ts        # MSW server setup
│
└── utils/                # Test utilities
    ├── test-utils.tsx   # Custom render functions
    └── ...              # Helper functions
```

### Test Configuration

**jest.config.js** - Main unit test configuration:
```javascript
{
  testEnvironment: 'jsdom',        // For React components
  testMatch: ['**/__tests__/**/*.test.ts?(x)'],
  testPathIgnorePatterns: ['/integration/'],
  setupFilesAfterEnv: ['<rootDir>/test-utils/jest.setup.js']
}
```

**jest.integration.config.js** - Integration test configuration:
```javascript
{
  testEnvironment: 'node',         // For API/database tests
  testMatch: ['**/__tests__/integration/**/*.test.ts'],
  globalSetup: './test-utils/global-setup.js',
  globalTeardown: './test-utils/global-teardown.js'
}
```

---

## Writing Component Tests

### Basic Component Test Structure

```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { renderWithProviders } from '@/__tests__/utils/test-utils'
import MyComponent from '@/components/MyComponent'

describe('MyComponent', () => {
  // Setup - runs before each test
  beforeEach(() => {
    jest.clearAllMocks()
  })

  // Cleanup - runs after each test
  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('Rendering', () => {
    it('should render with default props', () => {
      // Arrange
      const props = { title: 'Test' }

      // Act
      render(<MyComponent {...props} />)

      // Assert
      expect(screen.getByText('Test')).toBeInTheDocument()
    })

    it('should render with custom children', () => {
      render(
        <MyComponent>
          <span>Child content</span>
        </MyComponent>
      )

      expect(screen.getByText('Child content')).toBeInTheDocument()
    })
  })

  describe('User Interactions', () => {
    it('should handle click events', async () => {
      const handleClick = jest.fn()
      render(<MyComponent onClick={handleClick} />)

      const button = screen.getByRole('button')
      fireEvent.click(button)

      expect(handleClick).toHaveBeenCalledTimes(1)
    })

    it('should handle form submission', async () => {
      const handleSubmit = jest.fn()
      render(<MyComponent onSubmit={handleSubmit} />)

      const input = screen.getByRole('textbox')
      fireEvent.change(input, { target: { value: 'test' } })

      const form = screen.getByRole('form')
      fireEvent.submit(form)

      await waitFor(() => {
        expect(handleSubmit).toHaveBeenCalledWith(
          expect.objectContaining({ value: 'test' })
        )
      })
    })
  })

  describe('Async State Management', () => {
    it('should show loading state', async () => {
      render(<MyComponent isLoading={true} />)

      expect(screen.getByRole('progressbar')).toBeInTheDocument()
      expect(screen.queryByText('Content')).not.toBeInTheDocument()
    })

    it('should show content after loading', async () => {
      const { rerender } = render(<MyComponent isLoading={true} />)

      rerender(<MyComponent isLoading={false} data="Loaded" />)

      await waitFor(() => {
        expect(screen.queryByRole('progressbar')).not.toBeInTheDocument()
        expect(screen.getByText('Loaded')).toBeInTheDocument()
      })
    })
  })
})
```

### Example: ChatWidget Component Test

Real-world example from our test suite:

```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import ChatWidget from '@/components/ChatWidget'

describe('ChatWidget', () => {
  const mockDomain = 'example.com'

  beforeEach(() => {
    // Mock fetch for API calls
    global.fetch = jest.fn()
  })

  it('should send message on submit', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        message: 'AI response',
        conversationId: 'conv-123'
      })
    })

    render(<ChatWidget domain={mockDomain} />)

    // Type message
    const input = screen.getByPlaceholderText(/type.*message/i)
    fireEvent.change(input, { target: { value: 'Hello' } })

    // Submit
    const sendButton = screen.getByRole('button', { name: /send/i })
    fireEvent.click(sendButton)

    // Verify API call
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/chat',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('Hello')
        })
      )
    })

    // Verify response rendered
    expect(await screen.findByText('AI response')).toBeInTheDocument()
  })

  it('should handle network errors gracefully', async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(
      new Error('Network error')
    )

    render(<ChatWidget domain={mockDomain} />)

    const input = screen.getByPlaceholderText(/type.*message/i)
    fireEvent.change(input, { target: { value: 'Hello' } })

    const sendButton = screen.getByRole('button', { name: /send/i })
    fireEvent.click(sendButton)

    // Should show error message
    expect(await screen.findByText(/error.*occurred/i)).toBeInTheDocument()
  })
})
```

### Testing with Providers

When components need context providers:

```typescript
import { renderWithProviders } from '@/__tests__/utils/test-utils'

it('should access auth context', () => {
  const mockUser = { id: '123', email: 'test@example.com' }

  renderWithProviders(
    <MyComponent />,
    {
      authContext: { user: mockUser, isLoading: false }
    }
  )

  expect(screen.getByText('test@example.com')).toBeInTheDocument()
})
```

---

## Writing Hook Tests

### Basic Hook Test Structure

```typescript
import { renderHook, act, waitFor } from '@testing-library/react'
import { useMyHook } from '@/hooks/useMyHook'

describe('useMyHook', () => {
  it('should initialize with default state', () => {
    const { result } = renderHook(() => useMyHook())

    expect(result.current.data).toBeNull()
    expect(result.current.isLoading).toBe(false)
    expect(result.current.error).toBeNull()
  })

  it('should fetch data on mount', async () => {
    // Mock fetch
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({ items: [1, 2, 3] })
    })

    const { result } = renderHook(() => useMyHook())

    // Wait for fetch to complete
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.data).toEqual({ items: [1, 2, 3] })
    expect(result.current.error).toBeNull()
  })

  it('should handle errors', async () => {
    global.fetch = jest.fn().mockRejectedValueOnce(
      new Error('API Error')
    )

    const { result } = renderHook(() => useMyHook())

    await waitFor(() => {
      expect(result.current.error).toBe('API Error')
      expect(result.current.isLoading).toBe(false)
      expect(result.current.data).toBeNull()
    })
  })

  it('should support manual refresh', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ items: [] })
    })

    const { result } = renderHook(() => useMyHook())

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    // Trigger refresh
    act(() => {
      result.current.refresh()
    })

    expect(result.current.isLoading).toBe(true)

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(global.fetch).toHaveBeenCalledTimes(2)
  })
})
```

### Example: Dashboard Analytics Hook

Real-world example from our test suite:

```typescript
import { renderHook, waitFor } from '@testing-library/react'
import { useDashboardAnalytics } from '@/hooks/use-dashboard-analytics'

describe('useDashboardAnalytics', () => {
  const mockDomain = 'example.com'

  beforeEach(() => {
    global.fetch = jest.fn()
  })

  it('should fetch analytics data', async () => {
    const mockData = {
      totalMessages: 100,
      totalConversations: 50,
      averageResponseTime: 1.5,
      satisfactionRate: 0.85
    }

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockData
    })

    const { result } = renderHook(() =>
      useDashboardAnalytics(mockDomain, {
        startDate: '2025-01-01',
        endDate: '2025-01-31'
      })
    )

    // Initial state
    expect(result.current.isLoading).toBe(true)
    expect(result.current.data).toBeNull()

    // Wait for data
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.data).toEqual(mockData)
    expect(result.current.error).toBeNull()
  })

  it('should handle API errors', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error'
    })

    const { result } = renderHook(() =>
      useDashboardAnalytics(mockDomain)
    )

    await waitFor(() => {
      expect(result.current.error).toBeTruthy()
      expect(result.current.isLoading).toBe(false)
    })
  })

  it('should support date range filtering', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ totalMessages: 50 })
    })

    const { result, rerender } = renderHook(
      ({ startDate, endDate }) => useDashboardAnalytics(mockDomain, {
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

### Testing Hooks with Dependencies

When hooks have complex dependencies:

```typescript
it('should update when dependencies change', async () => {
  const { result, rerender } = renderHook(
    ({ domain, filters }) => useMyHook(domain, filters),
    {
      initialProps: {
        domain: 'example.com',
        filters: { status: 'active' }
      }
    }
  )

  await waitFor(() => expect(result.current.isLoading).toBe(false))

  const firstData = result.current.data

  // Change props
  rerender({
    domain: 'example.com',
    filters: { status: 'inactive' }
  })

  await waitFor(() => {
    expect(result.current.data).not.toBe(firstData)
  })
})
```

---

## Writing API Tests

### Basic API Test Structure

```typescript
import { POST } from '@/app/api/myroute/route'
import { NextRequest } from 'next/server'

describe('POST /api/myroute', () => {
  it('should return success response', async () => {
    const request = new NextRequest('http://localhost:3000/api/myroute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data: 'test' })
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data).toHaveProperty('success', true)
  })

  it('should validate input', async () => {
    const request = new NextRequest('http://localhost:3000/api/myroute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}) // Missing required fields
    })

    const response = await POST(request)

    expect(response.status).toBe(400)
  })

  it('should handle database errors', async () => {
    // Mock database to throw error
    jest.spyOn(db, 'query').mockRejectedValueOnce(new Error('DB Error'))

    const request = new NextRequest('http://localhost:3000/api/myroute', {
      method: 'POST',
      body: JSON.stringify({ data: 'test' })
    })

    const response = await POST(request)

    expect(response.status).toBe(500)
  })
})
```

### Example: Chat API Test

```typescript
import { POST } from '@/app/api/chat/route'
import { NextRequest } from 'next/server'

describe('POST /api/chat', () => {
  beforeEach(() => {
    // Mock OpenAI
    jest.mock('openai', () => ({
      ChatCompletion: {
        create: jest.fn().mockResolvedValue({
          choices: [{
            message: { content: 'AI response' }
          }]
        })
      }
    }))
  })

  it('should process chat message', async () => {
    const request = new NextRequest('http://localhost:3000/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'Hello',
        domain: 'example.com'
      })
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data).toHaveProperty('message')
    expect(data).toHaveProperty('conversationId')
  })

  it('should enforce rate limits', async () => {
    // Make multiple rapid requests
    const requests = Array(10).fill(null).map(() =>
      POST(new NextRequest('http://localhost:3000/api/chat', {
        method: 'POST',
        body: JSON.stringify({
          message: 'Test',
          domain: 'example.com'
        })
      }))
    )

    const responses = await Promise.all(requests)
    const rateLimited = responses.filter(r => r.status === 429)

    expect(rateLimited.length).toBeGreaterThan(0)
  })
})
```

---

## Testing Patterns & Best Practices

### 1. AAA Pattern (Arrange-Act-Assert)

**Always structure tests with clear sections:**

```typescript
it('should do something', () => {
  // Arrange - Set up test data and conditions
  const input = 'test'
  const expected = 'TEST'

  // Act - Execute the code under test
  const result = transform(input)

  // Assert - Verify the result
  expect(result).toBe(expected)
})
```

### 2. Test Isolation

**Each test should be independent:**

```typescript
describe('MyComponent', () => {
  beforeEach(() => {
    // Reset state before each test
    jest.clearAllMocks()
    localStorage.clear()
  })

  afterEach(() => {
    // Clean up after each test
    jest.restoreAllMocks()
  })
})
```

### 3. Meaningful Test Names

**Use descriptive names that explain what and why:**

```typescript
// ❌ Bad
it('test 1', () => { ... })
it('works', () => { ... })

// ✅ Good
it('should display error message when API returns 500', () => { ... })
it('should disable submit button while form is invalid', () => { ... })
```

### 4. Test User Behavior, Not Implementation

**Focus on what the user sees and does:**

```typescript
// ❌ Bad - Testing implementation details
it('should call setState', () => {
  const spy = jest.spyOn(component, 'setState')
  component.handleClick()
  expect(spy).toHaveBeenCalled()
})

// ✅ Good - Testing user-visible behavior
it('should show success message after form submission', async () => {
  render(<MyForm />)

  fireEvent.click(screen.getByRole('button', { name: /submit/i }))

  expect(await screen.findByText(/success/i)).toBeInTheDocument()
})
```

### 5. Use Semantic Queries

**Prefer queries that match how users interact:**

```typescript
// ❌ Bad - Brittle selectors
screen.getByTestId('submit-btn')
container.querySelector('.button')

// ✅ Good - Semantic queries
screen.getByRole('button', { name: /submit/i })
screen.getByLabelText('Email address')
screen.getByPlaceholderText('Enter your name')
```

### 6. Async Testing

**Always use waitFor for async operations:**

```typescript
it('should load data', async () => {
  render(<DataComponent />)

  // Wait for loading to finish
  await waitFor(() => {
    expect(screen.queryByText('Loading...')).not.toBeInTheDocument()
  })

  // Then check for data
  expect(screen.getByText('Data loaded')).toBeInTheDocument()
})
```

### 7. Error Boundary Testing

**Test error handling comprehensively:**

```typescript
it('should catch and display errors', () => {
  const ThrowError = () => {
    throw new Error('Test error')
  }

  render(
    <ErrorBoundary>
      <ThrowError />
    </ErrorBoundary>
  )

  expect(screen.getByText(/something went wrong/i)).toBeInTheDocument()
})
```

### 8. Accessibility Testing

**Verify accessibility in component tests:**

```typescript
import { axe, toHaveNoViolations } from 'jest-axe'
expect.extend(toHaveNoViolations)

it('should have no accessibility violations', async () => {
  const { container } = render(<MyComponent />)
  const results = await axe(container)
  expect(results).toHaveNoViolations()
})
```

### 9. GDPR Compliance Testing

**Test privacy features explicitly:**

```typescript
describe('GDPR Compliance', () => {
  it('should export all user data', async () => {
    const { result } = renderHook(() => useGdprExport())

    await act(async () => {
      await result.current.exportData('user@example.com')
    })

    expect(result.current.exportedData).toContain('conversations')
    expect(result.current.exportedData).toContain('messages')
  })

  it('should delete all user data on request', async () => {
    const { result } = renderHook(() => useGdprDelete())

    await act(async () => {
      await result.current.deleteData('user@example.com')
    })

    expect(result.current.isDeleted).toBe(true)
  })
})
```

### 10. Mock External Services

**Use MSW for API mocking:**

```typescript
// mocks/handlers.ts
import { rest } from 'msw'

export const handlers = [
  rest.post('https://api.openai.com/v1/chat/completions', (req, res, ctx) => {
    return res(
      ctx.json({
        choices: [{ message: { content: 'Mocked response' } }]
      })
    )
  }),

  rest.get('/api/products', (req, res, ctx) => {
    return res(ctx.json([
      { id: 1, name: 'Product 1', price: 19.99 }
    ]))
  })
]
```

---

## Common Pitfalls & Solutions

### 1. Not Waiting for Async Operations

**❌ Problem:**
```typescript
it('should load data', () => {
  render(<DataComponent />)
  expect(screen.getByText('Data loaded')).toBeInTheDocument() // Fails!
})
```

**✅ Solution:**
```typescript
it('should load data', async () => {
  render(<DataComponent />)
  expect(await screen.findByText('Data loaded')).toBeInTheDocument()
})
```

### 2. Not Cleaning Up After Tests

**❌ Problem:**
```typescript
it('test 1', () => {
  jest.spyOn(console, 'error').mockImplementation()
  // Doesn't restore - affects other tests!
})
```

**✅ Solution:**
```typescript
it('test 1', () => {
  const spy = jest.spyOn(console, 'error').mockImplementation()
  // ... test code ...
  spy.mockRestore()
})

// Or use afterEach
afterEach(() => {
  jest.restoreAllMocks()
})
```

### 3. Testing Implementation Details

**❌ Problem:**
```typescript
it('should update state', () => {
  const { result } = renderHook(() => useMyHook())
  expect(result.current.internalState).toBe('loading')
})
```

**✅ Solution:**
```typescript
it('should show loading indicator', () => {
  const { result } = renderHook(() => useMyHook())
  expect(result.current.isLoading).toBe(true)
})
```

### 4. Flaky Tests Due to Timing

**❌ Problem:**
```typescript
it('should update after delay', () => {
  render(<DelayedComponent />)
  setTimeout(() => {
    expect(screen.getByText('Updated')).toBeInTheDocument()
  }, 100) // Flaky!
})
```

**✅ Solution:**
```typescript
it('should update after delay', async () => {
  render(<DelayedComponent />)
  expect(await screen.findByText('Updated')).toBeInTheDocument()
})
```

### 5. Not Mocking Network Requests

**❌ Problem:**
```typescript
// Real network requests make tests slow and fragile
it('should fetch data', async () => {
  const data = await fetch('https://api.example.com/data')
  // ...
})
```

**✅ Solution:**
```typescript
it('should fetch data', async () => {
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ items: [] })
  })

  const data = await fetch('https://api.example.com/data')
  // ...
})
```

### 6. Missing Error Cases

**❌ Problem:**
```typescript
it('should work', async () => {
  // Only tests happy path
  const result = await myFunction()
  expect(result).toBe('success')
})
```

**✅ Solution:**
```typescript
describe('myFunction', () => {
  it('should work with valid input', async () => {
    const result = await myFunction('valid')
    expect(result).toBe('success')
  })

  it('should handle invalid input', async () => {
    await expect(myFunction(null)).rejects.toThrow('Invalid input')
  })

  it('should handle network errors', async () => {
    mockApi.mockRejectedValue(new Error('Network error'))
    await expect(myFunction('test')).rejects.toThrow('Network error')
  })
})
```

---

## Running Tests

### Basic Commands

```bash
# Run all unit tests
npm test

# Run specific test file
npm test -- ChatWidget.test.tsx

# Run tests matching pattern
npm test -- --testNamePattern="should render"

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage

# Integration tests only
npm run test:integration

# All tests (unit + integration)
npm run test:all
```

### Watch Mode Tips

```bash
# In watch mode, press:
# p - Filter by filename pattern
# t - Filter by test name pattern
# a - Run all tests
# q - Quit watch mode
# Enter - Trigger a test run
```

### Debugging Tests

```bash
# Run with Node debugger
node --inspect-brk ./node_modules/.bin/jest --runInBand

# Verbose output
npm test -- --verbose

# Show individual test results
npm test -- --verbose --testNamePattern="specific test"

# Update snapshots
npm test -- -u

# Clear cache and run
npm test -- --clearCache
npm test
```

### CI/CD Integration

```bash
# CI command (used in GitHub Actions)
npm run test:ci

# Generates coverage reports
# Runs all tests with --ci flag
# Fails on console errors
```

---

## Additional Resources

### Internal Documentation
- [Test Suite README](__tests__/README.md) - Test directory structure
- [Integration Tests](docs/INTEGRATION_TESTS.md) - Integration test guide
- [API Testing](docs/API_TESTING.md) - API-specific patterns

### External Resources
- [Jest Documentation](https://jestjs.io/)
- [React Testing Library](https://testing-library.com/react)
- [MSW Documentation](https://mswjs.io/)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)

---

**Questions or Issues?**

If you encounter testing challenges not covered in this guide:
1. Check existing test files for similar patterns
2. Review [__tests__/README.md](__tests__/README.md)
3. Search GitHub issues
4. Ask in team discussions

**Last Updated:** 2025-10-25
