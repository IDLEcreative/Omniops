# Tests Directory

Comprehensive test suite for the Customer Service Agent application.

## Structure

```
__tests__/
├── api/               # API route tests
│   ├── chat/         # Chat endpoint tests
│   └── scrape/       # Scraping endpoint tests
├── app/              # Page component tests
│   └── chat/         # Chat page tests
├── lib/              # Business logic tests
│   ├── encryption.test.ts
│   ├── rate-limit.test.ts
│   ├── supabase/
│   └── woocommerce.test.ts
├── mocks/            # Mock data and handlers
│   ├── handlers.ts   # MSW request handlers
│   └── server.ts     # MSW server setup
└── utils/            # Test utilities
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

## Test Configuration

### Jest Configuration
Two separate configs for different environments:

1. **jest.config.js** - Browser/React tests
   - Environment: jsdom
   - Tests: Components, pages

2. **jest.config.node.js** - Node.js tests
   - Environment: node
   - Tests: API routes, server-side logic

### Setup Files
- `jest.setup.js` - Browser test setup
- `jest.setup.node.js` - Node test setup
- `jest.setup.msw.js` - Mock Service Worker setup

## Running Tests

```bash
# Run all tests
npm test

# Run unit tests only
npm run test:unit

# Run integration tests only
npm run test:integration

# Watch mode for development
npm run test:watch

# Generate coverage report
npm run test:coverage

# Run specific test file
npm test -- encryption.test.ts

# Run tests matching pattern
npm test -- --testNamePattern="should encrypt"
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