# Testing Documentation

This document provides comprehensive information about testing strategies, tools, and procedures for the Customer Service Agent project.

## Overview

The project uses Jest as the primary testing framework with React Testing Library for component testing. The testing setup includes unit tests, integration tests, and mock service workers for API testing.

## Testing Framework and Tools

- **Jest**: Main testing framework
- **React Testing Library**: Component testing utilities
- **MSW (Mock Service Worker)**: API mocking for integration tests
- **Jest DOM**: Extended matchers for DOM testing
- **User Event**: Simulating user interactions

## Test Scripts

The following npm scripts are available for running tests:

### Basic Testing Commands

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate test coverage report
npm run test:coverage
```

### Unit Testing

```bash
# Run unit tests only (excludes integration tests)
npm run test:unit

# Pattern: **/__tests__/**/*.test.ts (excluding integration folder)
```

### Integration Testing

```bash
# Run integration tests only
npm run test:integration

# Run integration tests in watch mode
npm run test:integration:watch

# Generate coverage report for integration tests
npm run test:integration:coverage
```

### Complete Test Suite

```bash
# Run both unit and integration tests
npm run test:all
```

## Test Structure and Organization

### Recommended Directory Structure

While no formal test directories currently exist, the following structure is recommended:

```
project-root/
├── __tests__/
│   ├── unit/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── lib/
│   │   └── utils/
│   └── integration/
│       ├── api/
│       ├── queue/
│       └── workflows/
├── __mocks__/
│   ├── __fixtures__/
│   └── handlers/
└── test-utils/
    ├── setup.ts
    ├── test-helpers.ts
    └── mock-factories.ts
```

### Current Test Files

The project includes two standalone test files in the root directory:

1. **`test-queue-import.js`** - Basic import validation test
2. **`test-queue-system.js`** - Comprehensive queue system functionality test

## Test Coverage Goals

- **Unit Tests**: 80%+ coverage for utility functions, hooks, and components
- **Integration Tests**: Cover critical user workflows and API interactions
- **E2E Tests**: Not currently implemented, but recommended for key user journeys

## Mocking Strategies

### API Mocking
- Use MSW for HTTP request mocking
- Mock external services (WooCommerce API, Supabase)
- Create reusable mock handlers for common API patterns

### Service Mocking
- Mock queue services (BullMQ, Redis) for unit tests
- Use dependency injection for testable service architecture
- Mock external dependencies (Playwright, file system operations)

### Component Mocking
- Mock complex child components in unit tests
- Use React Testing Library's screen queries
- Mock external libraries (charts, complex UI components)

## Testing Best Practices

### General Guidelines

1. **Write tests first** - Follow TDD when possible
2. **Test behavior, not implementation** - Focus on what users see and do
3. **Keep tests isolated** - Each test should be independent
4. **Use descriptive names** - Test names should explain what is being tested
5. **Arrange, Act, Assert** - Structure tests clearly

### Component Testing

```typescript
// Example component test structure
import { render, screen, userEvent } from '@testing-library/react';
import { ComponentName } from './ComponentName';

describe('ComponentName', () => {
  it('should render with correct initial state', () => {
    render(<ComponentName />);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('should handle user interactions correctly', async () => {
    const user = userEvent.setup();
    render(<ComponentName />);
    
    await user.click(screen.getByRole('button'));
    expect(screen.getByText('Expected text')).toBeVisible();
  });
});
```

### API Testing

```typescript
// Example API test with MSW
import { rest } from 'msw';
import { server } from '../__mocks__/server';

beforeEach(() => {
  server.use(
    rest.get('/api/jobs', (req, res, ctx) => {
      return res(ctx.json({ jobs: [] }));
    })
  );
});
```

### Queue System Testing

The queue system requires special consideration due to Redis dependency:

1. **Mock Redis connections** for unit tests
2. **Use test Redis instance** for integration tests
3. **Test job processing logic** separately from queue infrastructure
4. **Verify job priorities and deduplication**

## Environment Setup for Testing

### Required Environment Variables

```bash
# Test environment variables
NODE_ENV=test
REDIS_URL=redis://localhost:6379/1  # Use different DB for tests
SUPABASE_URL=https://test-project.supabase.co
SUPABASE_ANON_KEY=test-key
```

### Test Database Setup

1. Use separate Redis database for testing (DB 1 instead of DB 0)
2. Mock Supabase calls or use test project
3. Ensure test isolation between runs

## Running Tests in Different Environments

### Local Development

```bash
# Install dependencies
npm install

# Run tests
npm test
```

### CI/CD Pipeline

```bash
# Install dependencies
npm ci

# Run linting and type checking
npm run check:all

# Run complete test suite with coverage
npm run test:all
npm run test:coverage
```

### Docker Environment

```bash
# Build test environment
docker-compose -f docker-compose.dev.yml build

# Run tests in container
docker-compose -f docker-compose.dev.yml run app npm test
```

## Debugging Tests

### Common Issues and Solutions

1. **Redis connection errors**:
   ```bash
   # Start Redis for tests
   npm run redis:start
   ```

2. **Timeout issues with async operations**:
   ```typescript
   // Increase timeout for async tests
   it('should complete async operation', async () => {
     // Test code
   }, 10000); // 10 second timeout
   ```

3. **Mock not working**:
   ```typescript
   // Clear mocks between tests
   afterEach(() => {
     jest.clearAllMocks();
   });
   ```

### Test Debugging Tools

- Use `screen.debug()` to inspect rendered components
- Add `console.log` statements in test files
- Use `--verbose` flag for detailed test output
- Use `--detectOpenHandles` to find hanging promises

## Performance Testing Considerations

### Queue Performance
- Test job processing rates
- Verify memory usage under load
- Test concurrency limits

### Component Performance
- Test render performance with large datasets
- Verify virtualization for long lists
- Test component re-render optimization

## Future Testing Enhancements

### Recommended Additions

1. **E2E Testing**:
   - Implement Playwright for end-to-end tests
   - Test complete user workflows
   - Cross-browser testing

2. **Visual Regression Testing**:
   - Screenshot comparison tests
   - Component visual testing

3. **Performance Testing**:
   - Load testing for queue system
   - Component performance benchmarks

4. **Accessibility Testing**:
   - Automated a11y testing
   - Screen reader compatibility

## Getting Started with Testing

### For New Contributors

1. **Setup local environment**:
   ```bash
   npm install
   npm run setup:dev
   ```

2. **Run existing tests**:
   ```bash
   npm run test:all
   ```

3. **Write your first test**:
   - Choose a component or function to test
   - Create test file following naming conventions
   - Follow existing patterns in the codebase

4. **Submit tests with your changes**:
   - Include tests for new features
   - Update tests for modified functionality
   - Ensure all tests pass before submitting PR

## Resources and References

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [MSW Documentation](https://mswjs.io/docs/)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)