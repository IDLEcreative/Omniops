**Last Updated:** 2025-11-18
**Verified Accurate For:** v0.1.0
**Status:** Active
**Type:** Reference

# Component Tests Directory

**Type:** Test Documentation
**Status:** Active
**Last Updated:** 2025-11-18
**Verified For:** v0.1.0
**Estimated Read Time:** 5 minutes

**Purpose:** Comprehensive test suite for all React UI components, ensuring proper rendering, user interactions, error handling, and accessibility compliance.

**Test Type:** Unit | Integration

**Coverage:** React components including chat widgets, error boundaries, authentication UI, installation flows, and messaging interfaces.

**Estimated Test Count:** 138 tests (2,542 LOC)

## Overview

Component tests validate the behavior, rendering, and user interactions of all React components in the application. These tests use React Testing Library to ensure components work correctly in isolation and when integrated with the application.

## Test Structure

```
__tests__/components/
├── ChatWidget-errors.test.tsx         # Error handling in chat widget
├── ChatWidget-interactions.test.tsx   # User interactions (clicks, typing)
├── ChatWidget-messaging.test.tsx      # Message sending and receiving
├── ChatWidget-rendering.test.tsx      # Initial render and state changes
├── ChatWidget-setup.ts                # Shared test utilities for ChatWidget
├── ErrorBoundary-integration.test.tsx # Error boundary integration scenarios
├── ErrorBoundary-recovery.test.tsx    # Error recovery mechanisms
├── ErrorBoundary-rendering.test.tsx   # Error boundary UI rendering
├── auth/                               # Authentication UI components
│   └── UserMenu.test.tsx              # User menu dropdown tests (28 tests)
├── chat/                               # Chat-related components
│   └── MessageContent.test.tsx        # Message rendering tests (39 tests)
└── installation/                       # Installation flow components
    └── [installation tests]
```

## Running Tests

```bash
# Run all component tests
npm test -- __tests__/components/

# Run specific component test
npm test -- ChatWidget-rendering.test.tsx

# Run with coverage
npm test -- --coverage __tests__/components/

# Run in watch mode
npm test -- --watch __tests__/components/
```

## Test Files

### ChatWidget Test Suite (38 tests, 755 LOC)

**ChatWidget-rendering.test.tsx**
- Initial component rendering
- Props handling and defaults
- Conditional rendering based on state
- Loading states and indicators

**ChatWidget-interactions.test.tsx**
- User input interactions (typing, clicking)
- Button state management
- Form submissions
- Keyboard shortcuts

**ChatWidget-messaging.test.tsx**
- Message sending functionality
- Message history display
- Real-time message updates
- Message formatting

**ChatWidget-errors.test.tsx**
- Network error handling
- API failure scenarios
- User-friendly error messages
- Retry mechanisms

**ChatWidget-setup.ts**
- Shared mock data
- Common test utilities
- Helper functions for component testing

### ErrorBoundary Test Suite (33 tests, 637 LOC)

**ErrorBoundary-rendering.test.tsx**
- Error UI rendering
- Fallback component display
- Error message formatting
- Custom error boundaries

**ErrorBoundary-recovery.test.tsx**
- Error recovery mechanisms
- Reset functionality
- State restoration after errors
- User-initiated recovery

**ErrorBoundary-integration.test.tsx**
- Integration with child components
- Error propagation
- Multiple error boundaries
- Production error logging

### Authentication Components (28 tests, 761 LOC)

**auth/UserMenu.test.tsx**
- User menu rendering
- Authentication status display
- Logout functionality
- User profile interactions
- Dropdown menu behavior

### Chat Components (39 tests, 389 LOC)

**chat/MessageContent.test.tsx**
- Message content rendering
- Markdown formatting
- Link handling and sanitization
- Code block syntax highlighting
- Emoji rendering

## Testing Patterns

### Component Rendering
```typescript
import { render, screen } from '@testing-library/react'
import ChatWidget from '@/components/ChatWidget'

describe('ChatWidget', () => {
  it('should render with initial state', () => {
    render(<ChatWidget domain="example.com" />)

    expect(screen.getByPlaceholderText(/type.*message/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /send/i })).toBeInTheDocument()
  })
})
```

### User Interactions
```typescript
import { render, screen, fireEvent } from '@testing-library/react'

it('should send message on button click', async () => {
  render(<ChatWidget domain="example.com" />)

  const input = screen.getByPlaceholderText(/type.*message/i)
  const sendButton = screen.getByRole('button', { name: /send/i })

  fireEvent.change(input, { target: { value: 'Hello' } })
  fireEvent.click(sendButton)

  expect(await screen.findByText('AI response')).toBeInTheDocument()
})
```

### Error Boundaries
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

### Async State Management
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

## Mocks and Fixtures

### Common Mocks
- **fetch API**: Mocked for API calls
- **Next.js router**: Mocked navigation
- **window.matchMedia**: Mocked for responsive design tests
- **localStorage**: Mocked for persistence tests

### Test Fixtures
Located in `ChatWidget-setup.ts` and component test files:
- Mock conversation data
- Mock user profiles
- Mock API responses
- Mock error scenarios

## Coverage Targets

| Metric | Target |
|--------|--------|
| Lines | 90%+ |
| Functions | 95%+ |
| Branches | 85%+ |
| Statements | 90%+ |

## Best Practices

1. **Use semantic queries**: Prefer `getByRole`, `getByLabelText` over `getByTestId`
2. **Test user behavior**: Focus on what users see and do, not implementation
3. **Avoid testing implementation details**: Don't test internal state directly
4. **Use waitFor for async**: Always wait for async updates properly
5. **Clean up after tests**: Use cleanup utilities to prevent memory leaks
6. **Accessible components**: Verify ARIA attributes and keyboard navigation

## Common Patterns

### Testing Forms
```typescript
it('should validate form input', async () => {
  render(<MyForm />)

  const input = screen.getByLabelText(/email/i)
  fireEvent.change(input, { target: { value: 'invalid-email' } })
  fireEvent.blur(input)

  expect(await screen.findByText(/invalid email/i)).toBeInTheDocument()
})
```

### Testing Conditional Rendering
```typescript
it('should show error when API fails', async () => {
  global.fetch = jest.fn().mockRejectedValue(new Error('API Error'))

  render(<MyComponent />)

  expect(await screen.findByText(/error occurred/i)).toBeInTheDocument()
})
```

### Testing Accessibility
```typescript
it('should be keyboard navigable', () => {
  render(<MyComponent />)

  const firstButton = screen.getAllByRole('button')[0]
  firstButton.focus()

  expect(firstButton).toHaveFocus()
})
```

## Related Code

- **Source Components**: `/components/` - Component source code
- **UI Library**: `/components/ui/` - Shared UI components
- **Hooks Tests**: `/__tests__/hooks/` - Custom hook tests
- **Integration Tests**: `/__tests__/integration/` - End-to-end component tests

## Troubleshooting

### Common Issues

1. **"Cannot find module"**: Check import paths and module mocks
2. **"Act() warnings"**: Wrap state updates in `await waitFor()`
3. **"Query failed"**: Use `findBy` instead of `getBy` for async elements
4. **"Multiple elements found"**: Use more specific queries or `getAllBy`

### Debug Tips

```bash
# Run single test with debug output
npm test -- --verbose ChatWidget-rendering.test.tsx

# Run with React Testing Library debug
# Add screen.debug() in your test to see current DOM state
```

## Related Documentation

- [Main Tests README](/Users/jamesguy/Omniops/__tests__/README.md) - Overall testing strategy
- [Hooks Tests](/Users/jamesguy/Omniops/__tests__/hooks/README.md) - Custom hook tests
- [Testing Guide](../docs/TESTING_GUIDE.md) - Comprehensive testing patterns
