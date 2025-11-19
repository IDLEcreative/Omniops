# Developer Debugging Guide

**Type:** Guide
**Status:** Active
**Last Updated:** 2025-11-18
**Verified For:** v0.1.0
**Estimated Read Time:** 12 minutes

## Purpose

This guide shows how to debug different parts of OmniOps using modern developer tools. Includes VSCode configuration, console debugging, and advanced techniques.

## Quick Start: Debugging Options

| Component | Method | Command |
|-----------|--------|---------|
| **Next.js Server** | VSCode Debugger | Press `F5` or Run > Start Debugging |
| **Jest Tests** | VSCode Debugger | `npm test -- --inspect-brk` |
| **E2E Tests** | Playwright UI | `npm run test:e2e:debug` |
| **API Routes** | Console logs | `console.log()` + dev server |
| **React Components** | React DevTools | Install extension in Chrome |
| **Database** | Supabase UI | https://app.supabase.com/ |

---

## VSCode Debugging Setup

### Prerequisites
- Visual Studio Code installed
- Node.js debugging capability (built-in)
- Project opened in VSCode

### Configuration

Create `.vscode/launch.json` (see separate file) with these configurations:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Next.js Server",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/node_modules/next/dist/bin/next",
      "args": ["dev"],
      "console": "integratedTerminal"
    }
  ]
}
```

### Using the Debugger

**Start Debugging:**
1. Press `F5` or go to Run > Start Debugging
2. Select "Next.js Server" from dropdown
3. Dev server starts with debugger attached

**Set Breakpoints:**
1. Click left margin in code editor to set breakpoint
2. Red dot indicates breakpoint is set
3. Code stops when breakpoint is reached

**Debug Controls:**
- Continue execution: `F5` or play button
- Step over: `F10` or step-over button
- Step into: `F11` or step-into button
- Step out: `Shift+F11`
- View variables: Left sidebar "Variables" panel

**Example Debugging:**
```typescript
// app/api/chat/route.ts
import { NextRequest } from 'next/server'

export async function POST(request: NextRequest) {
  const body = await request.json()
  console.log('Request body:', body)  // ← Breakpoint here

  // Code stops here, you can inspect 'body' variable
  // in the Variables panel on the left

  return Response.json({ success: true })
}
```

---

## Console Debugging

### Basic Logging

```typescript
// Simple values
console.log('Message:', value)

// Objects
console.log('User:', { name, email, id })

// Pretty print
console.log('%O', complexObject)

// Warnings and errors
console.warn('Warning message')
console.error('Error message')
```

### Structured Logging

```typescript
// Use object structure for readability
console.log({
  context: 'api/chat',
  action: 'processing_message',
  timestamp: new Date().toISOString(),
  data: { userId, messageId },
  metrics: { duration: 145, tokens: 280 }
})

// Output shows clear structure in console
```

### Debug Mode

```typescript
// Add debug flag for verbose output
const debug = process.env.DEBUG === 'true'

if (debug) {
  console.log('Detailed debug information...')
}
```

**Enable debug mode:**
```bash
DEBUG=true npm run dev
```

### Inspecting Large Objects

```typescript
// Don't use JSON.stringify for large objects
// Instead use console's built-in pretty printer
const largeObject = { /* ... */ }
console.log('%O', largeObject)  // Interactive tree view
// or
console.dir(largeObject, { depth: null })  // Full depth
```

---

## Debugging API Routes

### API Route Debugging

```typescript
// app/api/chat/route.ts
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    // 1. Log request details
    console.log('📍 Step 1: Received request')
    console.log('  URL:', request.url)
    console.log('  Method:', request.method)

    // 2. Parse request body
    const body = await request.json()
    console.log('📍 Step 2: Parsed body', body)

    // 3. Process request
    console.log('📍 Step 3: Processing message...')
    const result = await processMessage(body)
    console.log('📍 Step 4: Result', result)

    // 4. Return response
    return NextResponse.json(result)
  } catch (error) {
    // 5. Log errors with full context
    console.error('❌ Error in /api/chat:', error)
    console.error('  Error type:', error.constructor.name)
    console.error('  Message:', error.message)

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
```

### Using curl to Test APIs

```bash
# Simple GET request
curl http://localhost:3000/api/health

# POST with JSON data
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Hello",
    "domain": "test.local"
  }'

# With verbose output to see headers
curl -v http://localhost:3000/api/health

# Save response to file
curl http://localhost:3000/api/data > response.json
```

---

## Debugging React Components

### React DevTools Extension

**Install:**
1. Chrome Web Store: Search "React Developer Tools"
2. Firefox Add-ons: Search "React Developer Tools"
3. Click "Add to Chrome" or "Add to Firefox"

**Use:**
1. Open Chrome DevTools (`F12` or `Cmd+Option+I`)
2. Go to "Components" tab
3. Inspect React component tree
4. View props and state in real-time
5. Edit props/state to test behavior

### Component Debugging Code

```typescript
// components/ChatWidget.tsx
import { useEffect, useState } from 'react'

export function ChatWidget() {
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(false)

  // Log when component mounts
  useEffect(() => {
    console.log('📍 ChatWidget mounted')

    return () => {
      console.log('📍 ChatWidget unmounted')
    }
  }, [])

  // Log when messages change
  useEffect(() => {
    console.log('📍 Messages updated:', messages.length, 'messages')
  }, [messages])

  const sendMessage = async (text: string) => {
    console.log('📍 Sending message:', text)
    setLoading(true)

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        body: JSON.stringify({ message: text })
      })

      console.log('📍 Response status:', response.status)
      const data = await response.json()
      console.log('📍 Response data:', data)

      setMessages(prev => [...prev, data])
    } catch (error) {
      console.error('❌ Send message error:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      {/* Component JSX */}
    </div>
  )
}
```

### Debugging Hooks

```typescript
// Custom hook debugging
function useCustomHook(initialValue) {
  const [state, setState] = useState(initialValue)

  console.log('Hook state changed:', state)

  return [state, setState]
}

// Use in component
function MyComponent() {
  const [value, setValue] = useCustomHook('initial')

  // Will see logs each time state changes

  return (...)
}
```

---

## Debugging Tests

### Jest Test Debugging

**Run tests with inspector:**
```bash
node --inspect-brk ./node_modules/jest/bin/jest.js --runInBand

# Then open chrome://inspect in Chrome
```

**Debug single test:**
```bash
npm test -- --testNamePattern="test name" --inspect-brk --runInBand
```

**Test with logging:**
```typescript
// __tests__/api/chat.test.ts
describe('Chat API', () => {
  it('processes message correctly', async () => {
    console.log('📍 Test start')

    const response = await fetch('/api/chat', {
      method: 'POST',
      body: JSON.stringify({ message: 'Hi' })
    })

    console.log('📍 Got response')
    expect(response.status).toBe(200)

    console.log('📍 Test passed')
  })
})
```

**Run tests in watch mode with logging:**
```bash
npm run test:watch
# Tests re-run on file change, console output visible
```

---

## Debugging E2E Tests

### Playwright Inspector

**Start interactive debugger:**
```bash
npm run test:e2e:debug

# Or manually
PWDEBUG=1 npx playwright test
```

**Features:**
- Step through test line by line
- View page state at each step
- Inspect DOM elements
- See network requests

### Playwright Trace Viewer

```bash
# Generate trace file
npx playwright test --trace on

# Open trace viewer
npx playwright show-trace trace.zip
```

**In trace viewer:**
- See entire test execution
- Step backwards and forwards
- View network activity
- Inspect element state

### E2E Test Logging

```typescript
// __tests__/playwright/example.spec.ts
import { test, expect } from '@playwright/test'

test('user journey', async ({ page }) => {
  console.log('📍 Step 1: Navigate')
  await page.goto('http://localhost:3000')

  console.log('📍 Step 2: Click button')
  await page.click('button')

  console.log('📍 Step 3: Wait for response')
  const response = await page.waitForResponse(
    r => r.url().includes('/api/') && r.status() === 200
  )
  console.log('📍 Response status:', response.status())

  console.log('📍 Step 4: Verify state')
  const text = await page.textContent('.result')
  expect(text).toContain('Success')
  console.log('✓ Test passed')
})
```

---

## Debugging Database Operations

### Supabase Query Logging

```typescript
// lib/supabase/client.ts
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(url, key)

// Log all queries
const originalFrom = supabase.from.bind(supabase)
supabase.from = function(table) {
  const builder = originalFrom(table)

  // Intercept select
  const originalSelect = builder.select.bind(builder)
  builder.select = function(...args) {
    console.log(`📍 Query: SELECT from ${table}`)
    return originalSelect(...args)
  }

  return builder
}
```

### View Supabase Logs

1. Go to [Supabase Dashboard](https://app.supabase.com/)
2. Select your project
3. Go to "Logs" section
4. View all database queries
5. See error messages and timestamps

### Test Queries

```typescript
// Test database operations
async function testQuery() {
  console.log('📍 Fetching users...')

  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .limit(10)

  if (error) {
    console.error('❌ Query error:', error)
    return
  }

  console.log('✓ Found', data.length, 'customers')
  console.log('Data:', data)
}

await testQuery()
```

---

## Common Debugging Patterns

### Debugging Async Code

```typescript
// Problem: Promise rejections silently fail
const result = await someAsyncFunction()  // Error here?

// Solution: Add logging and error handling
try {
  console.log('📍 Starting async operation...')
  const result = await someAsyncFunction()
  console.log('✓ Operation succeeded:', result)
  return result
} catch (error) {
  console.error('❌ Operation failed:', error)
  console.error('  Stack:', error.stack)
  throw error  // Re-throw or handle
}
```

### Debugging Type Issues

```typescript
// Problem: TypeScript errors hard to debug
interface User {
  id: string
  name: string
}

const user: User = { id: '1' }  // ❌ Missing 'name'

// Solution: Check type with TypeScript
npx tsc --noEmit

// Add explicit types in debugging
const userData: any = fetchUser()  // Temporarily use any
console.log('Keys:', Object.keys(userData))  // See what's available
```

### Debugging Race Conditions

```typescript
// Problem: Random test failures due to timing
it('test', async () => {
  api.call()
  // Might fail if state isn't updated yet
  expect(state).toBe('updated')
})

// Solution: Wait for condition
it('test', async () => {
  api.call()
  await waitFor(() => {
    expect(state).toBe('updated')
  })
})

// Or explicit wait
it('test', async () => {
  api.call()
  await new Promise(r => setTimeout(r, 100))  // Explicit delay for debugging
  expect(state).toBe('updated')
})
```

---

## Performance Debugging

### Check Performance in Node.js

```typescript
// Measure execution time
console.time('operation')
await someOperation()
console.timeEnd('operation')

// Output: operation: 145.234ms
```

### Profile Memory Usage

```typescript
// Monitor memory
if (global.gc) global.gc()  // Force garbage collection
const before = process.memoryUsage()

// ... do operation ...

const after = process.memoryUsage()
console.log('Memory increase:', {
  heapUsed: (after.heapUsed - before.heapUsed) / 1024 / 1024 + ' MB',
  external: (after.external - before.external) / 1024 / 1024 + ' MB'
})
```

### Profile Network

```bash
# In Chrome DevTools with dev server running:
1. Open DevTools (F12)
2. Go to "Network" tab
3. Make requests
4. See timing, size, and response time
```

---

## Troubleshooting Debugger

### Debugger Won't Start

```bash
# Check if port 9229 is available
lsof -i :9229

# Kill process using it
kill -9 <PID>

# Try again
npm run dev
```

### Breakpoints Not Hit

1. Verify breakpoint is set (red dot visible)
2. Ensure code path is actually executed
3. Check browser console for errors
4. Restart debugger (F5 to stop, F5 to start)

### Can't See Variables

1. Open "Variables" panel in left sidebar
2. Expand sections to see values
3. Hover over variables in code for tooltip
4. Use console to evaluate expressions

---

## Tips and Best Practices

### Use Descriptive Logging

```typescript
// ❌ Not helpful
console.log(data)

// ✅ Helpful with context
console.log({
  context: 'userCreation',
  userId: user.id,
  email: user.email,
  success: true
})
```

### Log Before and After

```typescript
// See the flow clearly
console.log('Before: state =', state)
setState(newValue)
console.log('After: state =', state)
```

### Use Log Levels

```typescript
// Structured logging with levels
const log = (level, message, data) => {
  const timestamp = new Date().toISOString()
  console.log(`[${timestamp}] ${level}: ${message}`, data)
}

log('INFO', 'User logged in', { userId: 123 })
log('ERROR', 'Database connection failed', { error: e.message })
log('WARN', 'Deprecated API used', { endpoint: '/old-api' })
```

### Remove Debug Code Before Commit

```bash
# Find all console.log statements
grep -r "console\." src/ --include="*.ts" --include="*.tsx"

# Remove debug code
npm run lint:fix  # ESLint can remove logs
```

---

## Next Steps

1. **Set up VSCode debugging** - Use `.vscode/launch.json`
2. **Add console logging** - Get familiar with patterns
3. **Debug first API route** - Practice with real code
4. **Debug first test** - Use Playwright UI
5. **Profile your code** - Check performance

---

**See Also:**
- [ONBOARDING.md](ONBOARDING.md) - Getting started
- [TROUBLESHOOTING_DEVELOPMENT.md](TROUBLESHOOTING_DEVELOPMENT.md) - Common issues
- [VSCode Docs](https://code.visualstudio.com/docs/editor/debugging) - Official VSCode debugging
