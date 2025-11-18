**Last Updated:** 2025-11-18
**Verified Accurate For:** v0.1.0
**Status:** Active
**Type:** Reference

# Tests Directory

Comprehensive test suite for the OmniOps Customer Service Platform.

## Test Suite Statistics

- **Total Test Files:** 67
- **Total Tests:** 1,048+
- **Total Test Code:** 23,677 LOC
- **Coverage Target:** 80%+

### Test Distribution
- **Component Tests:** 138 tests (2,542 LOC)
- **Hook Tests:** 102 tests (2,303 LOC)
- **API Tests:** 300+ tests
- **Integration Tests:** 100+ tests
- **Business Logic Tests:** 400+ tests

## Structure

```
__tests__/
├── components/            # Component tests (138 tests, 2,542 LOC)
│   ├── ChatWidget.test.tsx          # Chat widget UI (38 tests, 755 LOC)
│   ├── ErrorBoundary.test.tsx       # Error handling (33 tests, 637 LOC)
│   ├── auth/
│   │   └── UserMenu.test.tsx        # Auth UI (28 tests, 761 LOC)
│   └── chat/
│       └── MessageContent.test.tsx  # Message rendering (39 tests, 389 LOC)
│
├── hooks/                 # Custom hook tests (102 tests, 2,303 LOC)
│   ├── use-dashboard-analytics.test.tsx      # Analytics hook (25 tests, 388 LOC)
│   ├── use-dashboard-conversations.test.tsx  # Conversations hook (25 tests, 390 LOC)
│   ├── use-dashboard-overview.test.tsx       # Overview hook (25 tests, 393 LOC)
│   ├── use-dashboard-telemetry.test.ts       # Telemetry hook (12 tests, 136 LOC)
│   ├── use-gdpr-delete.test.tsx              # GDPR deletion (8 tests, 528 LOC)
│   └── use-gdpr-export.test.tsx              # GDPR export (7 tests, 468 LOC)
│
├── api/                   # API route tests (300+ tests)
│   ├── auth/              # Authentication tests
│   │   └── customer/route.test.ts
│   ├── chat/              # Chat endpoint tests
│   │   ├── route-async.test.ts
│   │   ├── route.basic.test.ts
│   │   ├── route.commerce.test.ts
│   │   ├── route.errors.test.ts
│   │   ├── route.tools.test.ts
│   │   └── malformed-tool-args.test.ts
│   ├── gdpr/              # Privacy endpoint tests
│   │   ├── audit/route.test.ts
│   │   ├── delete/route.test.ts
│   │   ├── export/route.test.ts
│   │   ├── delete.test.ts
│   │   └── export.test.ts
│   ├── scrape/            # Scraping endpoint tests
│   │   └── route.test.ts
│   ├── dashboard/         # Dashboard API tests
│   │   └── telemetry/route.test.ts
│   └── organizations/     # Multi-tenant tests
│       ├── route.test.ts
│       ├── route-global-mock.test.ts
│       └── invitations.test.ts
│
├── app/                   # Page component tests
│   ├── chat/page.test.tsx
│   └── dashboard/telemetry/page.test.tsx
│
├── integration/           # Integration tests (100+ tests)
│   ├── README.md
│   ├── enhanced-scraper-system.test.ts
│   ├── multi-tenant-isolation.test.ts
│   ├── woocommerce-schema-fix.test.ts
│   ├── shopify-ux-flow.test.ts
│   └── rls-smoke-test.test.ts
│
├── lib/                   # Business logic tests (400+ tests)
│   ├── agents/            # AI agent tests
│   │   ├── commerce-provider.test.ts
│   │   ├── customer-service-agent.test.ts
│   │   ├── customer-service-agent-intelligent.test.ts
│   │   ├── domain-agnostic-agent.test.ts
│   │   ├── router.test.ts
│   │   ├── woocommerce-agent.test.ts
│   │   └── providers/
│   │       ├── shopify-provider.test.ts
│   │       └── woocommerce-provider.test.ts
│   ├── analytics/         # Analytics tests
│   │   └── business-intelligence.test.ts
│   ├── monitoring/        # Monitoring tests
│   │   └── performance-tracker.test.ts
│   ├── chat-service.test.ts
│   ├── ecommerce-extractor.test.ts
│   ├── embeddings.test.ts
│   ├── encryption.test.ts
│   ├── link-sanitizer.test.ts
│   ├── organization-helpers.test.ts
│   ├── pagination-crawler.test.ts
│   ├── pattern-learner.test.ts
│   ├── product-normalizer.test.ts
│   ├── rate-limit.test.ts
│   ├── rate-limiter-enhanced.test.ts
│   ├── shopify-integration.test.ts
│   ├── woocommerce-api.test.ts
│   ├── woocommerce.test.ts
│   └── supabase/
│       └── database.test.ts
│
├── mocks/                 # Mock data and handlers
│   ├── handlers.ts        # MSW request handlers
│   └── server.ts          # MSW server setup
│
└── utils/                 # Test utilities
    ├── global-setup.js
    ├── global-teardown.js
    ├── integration-setup.js
    ├── integration-test-helpers.ts
    ├── supabase-mock.ts
    └── test-utils.tsx
```

## Test Categories

### Unit Tests
Testing individual functions and modules in isolation:

```typescript
// lib/encryption.test.ts
describe('Encryption', () => {
  it('should encrypt and decrypt data correctly', () => {
    const original = 'sensitive data'
    const encrypted = encrypt(original)
    const decrypted = decrypt(encrypted)
    expect(decrypted).toBe(original)
  })
})
```

### Integration Tests
Testing API routes and database operations:

```typescript
// api/chat/route.test.ts
describe('POST /api/chat', () => {
  it('should return AI response', async () => {
    const response = await request(app)
      .post('/api/chat')
      .send({ message: 'Hello' })
    
    expect(response.status).toBe(200)
    expect(response.body).toHaveProperty('message')
  })
})
```

### Integration Tests
Testing complete system functionality and cross-module interactions:

```typescript
// integration/enhanced-scraper-system.test.ts
describe('Enhanced Scraper System', () => {
  it('should scrape and index content with embeddings', async () => {
    const result = await scrapeAndIndex(testUrl)
    expect(result.embeddings).toBeDefined()
    expect(result.status).toBe('completed')
  })
})
```

### Component Tests
Testing React components with React Testing Library:

```typescript
// components/ChatWidget.test.tsx
describe('ChatWidget', () => {
  it('should send message on submit', async () => {
    render(<ChatWidget domain="example.com" />)

    const input = screen.getByPlaceholderText(/type.*message/i)
    fireEvent.change(input, { target: { value: 'Hello' } })

    const sendButton = screen.getByRole('button', { name: /send/i })
    fireEvent.click(sendButton)

    expect(await screen.findByText('AI response')).toBeInTheDocument()
  })

  it('should handle errors gracefully', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('Network error'))

    render(<ChatWidget domain="example.com" />)
    // ... trigger action ...

    expect(await screen.findByText(/error.*occurred/i)).toBeInTheDocument()
  })
})
```

### Hook Tests
Testing custom React hooks with renderHook:

```typescript
// hooks/use-dashboard-analytics.test.tsx
describe('useDashboardAnalytics', () => {
  it('should fetch analytics data', async () => {
    const mockData = {
      totalMessages: 100,
      totalConversations: 50,
      averageResponseTime: 1.5
    }

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => mockData
    })

    const { result } = renderHook(() =>
      useDashboardAnalytics('example.com')
    )

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.data).toEqual(mockData)
  })

  it('should handle date range changes', async () => {
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

### Business Logic Tests
Testing specific business logic modules:

```typescript
// lib/chat-service.test.ts - Chat functionality
// lib/embeddings.test.ts - Vector embeddings
// lib/ecommerce-extractor.test.ts - E-commerce data extraction
// lib/pagination-crawler.test.ts - Paginated content crawling
// lib/pattern-learner.test.ts - Content pattern recognition
// lib/product-normalizer.test.ts - Product data normalization
// lib/rate-limiter-enhanced.test.ts - Advanced rate limiting
// lib/woocommerce-api.test.ts - WooCommerce API integration
```

## Test Configuration

### Jest Configuration
Multiple Jest configurations for different test types:

1. **jest.config.js** - Main configuration for unit tests
   - Environment: jsdom for browser tests, node for API tests
   - Tests: Components, pages, business logic

2. **jest.integration.config.js** - Integration tests configuration
   - Environment: node
   - Tests: Full system integration tests
   - Longer timeouts and setup

3. **jest.config.node.js** - Node.js specific tests
   - Environment: node  
   - Tests: Server-side logic, API routes

### Setup Files and Utilities
- `test-utils/jest.setup.js` - Main Jest setup
- `test-utils/jest.setup.node.js` - Node environment setup
- `test-utils/jest.setup.msw.js` - Mock Service Worker setup
- `test-utils/test-config.ts` - Test configuration utilities
- `test-utils/mock-helpers.ts` - Mock helper functions
- `test-utils/integration-setup.js` - Integration test setup
- `test-utils/integration-test-helpers.ts` - Integration test utilities
- `test-utils/global-setup.js` - Global test setup
- `test-utils/global-teardown.js` - Global test cleanup

## Running Tests

```bash
# Run all tests (unit tests only by default)
npm test

# Run unit tests only (excludes integration tests)  
npm run test:unit

# Run integration tests only
npm run test:integration

# Run integration tests in watch mode
npm run test:integration:watch

# Generate integration test coverage
npm run test:integration:coverage

# Watch mode for unit tests
npm run test:watch

# Generate coverage report
npm run test:coverage

# Run all tests (unit + integration)
npm run test:all

# Run specific test file
npm test -- encryption.test.ts

# Run tests matching pattern
npm test -- --testNamePattern="should encrypt"

# Run integration test with specific pattern
npm run test:integration -- --testNamePattern="scraper"
```

## Mock Service Worker (MSW)

We use MSW to mock external API calls:

```typescript
// mocks/handlers.ts
export const handlers = [
  rest.post('https://api.openai.com/v1/chat/completions', (req, res, ctx) => {
    return res(
      ctx.json({
        choices: [{
          message: { content: 'Mocked AI response' }
        }]
      })
    )
  }),
  
  rest.get('*/api/products', (req, res, ctx) => {
    return res(
      ctx.json([
        { id: 1, name: 'Product 1' }
      ])
    )
  })
]
```

## Test Utilities

### Custom Render
Wrapper with providers for component tests:

```typescript
// utils/test-utils.tsx
export function renderWithProviders(
  ui: React.ReactElement,
  options?: RenderOptions
) {
  return render(
    <ThemeProvider>
      <AuthProvider>
        {ui}
      </AuthProvider>
    </ThemeProvider>,
    options
  )
}
```

### Mock Data
Reusable test data:

```typescript
// mocks/data.ts
export const mockCustomerConfig = {
  id: 'test-id',
  domain: 'example.com',
  config: {
    businessName: 'Test Business',
    welcomeMessage: 'Welcome!'
  }
}

export const mockMessage = {
  id: 'msg-1',
  content: 'Test message',
  role: 'user' as const
}
```

### Database Mocks
Supabase client mocks:

```typescript
// utils/supabase-mock.ts
export const mockSupabase = {
  from: jest.fn(() => ({
    select: jest.fn(() => ({
      eq: jest.fn(() => ({
        single: jest.fn(() => ({ data: mockData }))
      }))
    })),
    insert: jest.fn(() => ({ data: mockData })),
    update: jest.fn(() => ({ data: mockData })),
    delete: jest.fn(() => ({ data: null }))
  }))
}
```

## Writing Tests

### Best Practices

1. **Descriptive Names**: Use clear test descriptions
2. **AAA Pattern**: Arrange, Act, Assert
3. **Isolation**: Each test should be independent
4. **Mocking**: Mock external dependencies
5. **Coverage**: Aim for 80%+ code coverage

### Test Structure
```typescript
describe('Feature/Module Name', () => {
  // Setup
  beforeEach(() => {
    // Reset mocks
    // Set up test data
  })
  
  // Teardown
  afterEach(() => {
    // Clean up
  })
  
  describe('specific functionality', () => {
    it('should do something specific', () => {
      // Arrange
      const input = 'test'
      
      // Act
      const result = functionToTest(input)
      
      // Assert
      expect(result).toBe('expected')
    })
  })
})
```

### Async Tests
```typescript
it('should handle async operations', async () => {
  const promise = asyncFunction()
  await expect(promise).resolves.toBe('result')
})

it('should handle errors', async () => {
  const promise = failingFunction()
  await expect(promise).rejects.toThrow('Error message')
})
```

## Coverage Reports

Coverage reports are generated in `/coverage`:
- HTML report: `coverage/lcov-report/index.html`
- Coverage thresholds in `jest.config.js`

Current thresholds:
- Branches: 70%
- Functions: 70%
- Lines: 70%
- Statements: 70%

**Note:** With the addition of 240+ new tests (4,800+ LOC), we've significantly improved coverage across:
- Component rendering and user interactions
- Custom hook behavior and lifecycle
- Error handling and edge cases
- GDPR compliance features
- Dashboard analytics and telemetry

## CI/CD Integration

Tests run automatically on:
- Pull requests
- Commits to main branch
- Pre-deployment checks

GitHub Actions workflow runs:
```bash
npm run test:ci
```

## Debugging Tests

```bash
# Run tests in debug mode
node --inspect-brk ./node_modules/.bin/jest --runInBand

# Run single test file
npm test -- --testPathPattern=encryption

# Update snapshots
npm test -- -u

# Verbose output
npm test -- --verbose
```

## Common Issues

1. **Module not found**: Check import paths and aliases
2. **Timeout errors**: Increase timeout for async tests
3. **Mock not working**: Ensure mocks are set up before imports
4. **Environment issues**: Check correct jest config is used

---

## Recent Improvements (2025-10-25)

### New Test Coverage

Added comprehensive test suites for critical UI components and hooks:

**Component Tests (138 new tests, 2,542 LOC):**
- `ChatWidget.test.tsx` - 38 tests covering chat interface, message sending, error handling
- `ErrorBoundary.test.tsx` - 33 tests for error catching, fallback UI, recovery
- `UserMenu.test.tsx` - 28 tests for authentication UI, dropdowns, user actions
- `MessageContent.test.tsx` - 39 tests for message rendering, formatting, links

**Hook Tests (102 new tests, 2,303 LOC):**
- `use-dashboard-analytics.test.tsx` - 25 tests for analytics data fetching and filtering
- `use-dashboard-conversations.test.tsx` - 25 tests for conversation management
- `use-dashboard-overview.test.tsx` - 25 tests for overview statistics
- `use-dashboard-telemetry.test.ts` - 12 tests for telemetry data collection
- `use-gdpr-delete.test.tsx` - 8 tests for GDPR deletion workflows
- `use-gdpr-export.test.tsx` - 7 tests for GDPR export functionality

### Testing Patterns Introduced

**1. Error Boundary Testing**
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

**2. Hook Lifecycle Testing**
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

**3. GDPR Compliance Testing**
```typescript
it('should export all user data', async () => {
  const { result } = renderHook(() => useGdprExport())

  await act(async () => {
    await result.current.exportData('user@example.com')
  })

  expect(result.current.exportedData).toContain('conversations')
  expect(result.current.exportedData).toContain('messages')
})
```

**4. Async State Management**
```typescript
it('should handle loading states', async () => {
  render(<MyComponent />)

  // Initial loading state
  expect(screen.getByRole('progressbar')).toBeInTheDocument()

  // Wait for content
  expect(await screen.findByText('Loaded')).toBeInTheDocument()

  // Loading indicator removed
  expect(screen.queryByRole('progressbar')).not.toBeInTheDocument()
})
```

### Key Improvements

✅ **Better Test Organization**: Separated component and hook tests into dedicated directories
✅ **Comprehensive Coverage**: Added tests for previously untested UI components
✅ **Real-World Scenarios**: Tests based on actual user interactions and edge cases
✅ **GDPR Testing**: Explicit tests for privacy compliance features
✅ **Error Handling**: Thorough testing of error boundaries and fallback UI
✅ **Accessibility**: Using semantic queries (getByRole, getByLabelText)

### Documentation

For detailed testing guidelines, see:
- **[Testing Guide](../docs/TESTING_GUIDE.md)** - Comprehensive testing patterns and best practices
- **[Integration Tests](integration/README.md)** - Integration test documentation

---

**Need Help?**

If you're writing new tests and need examples, check:
1. This README for patterns
2. [Testing Guide](../docs/TESTING_GUIDE.md) for comprehensive examples
3. Existing test files in the same category (component/hook/API)
4. Ask in team discussions