# Tests Directory

Comprehensive test suite for the Customer Service Agent application.

## Structure

```
__tests__/
├── api/                    # API route tests
│   ├── auth/              # Authentication tests
│   ├── chat/              # Chat endpoint tests
│   │   ├── route-async.test.ts
│   │   └── route.test.ts
│   └── scrape/            # Scraping endpoint tests
│       └── route.test.ts
├── app/                   # Page component tests
│   └── chat/              # Chat page tests
│       └── page.test.tsx
├── integration/           # Integration tests
│   ├── README.md
│   └── enhanced-scraper-system.test.ts
├── lib/                   # Business logic tests
│   ├── chat-service.test.ts
│   ├── ecommerce-extractor.test.ts
│   ├── embeddings.test.ts
│   ├── encryption.test.ts
│   ├── pagination-crawler.test.ts
│   ├── pattern-learner.test.ts
│   ├── product-normalizer.test.ts
│   ├── rate-limit.test.ts
│   ├── rate-limiter-enhanced.test.ts
│   ├── woocommerce-api.test.ts
│   ├── woocommerce.test.ts
│   └── supabase/
│       └── database.test.ts
├── mocks/                 # Mock data and handlers
│   ├── handlers.ts        # MSW request handlers
│   └── server.ts          # MSW server setup
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
// app/chat/page.test.tsx
describe('Chat Page', () => {
  it('should render chat interface', () => {
    render(<ChatPage />)
    expect(screen.getByRole('textbox')).toBeInTheDocument()
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