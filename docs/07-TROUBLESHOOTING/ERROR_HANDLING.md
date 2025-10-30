# Error Handling & Logging System Documentation

**Type:** Troubleshooting
**Status:** Active
**Last Updated:** 2025-10-29
**Verified For:** v0.1.0
**Estimated Read Time:** 28 minutes

## Purpose
This document describes the comprehensive error handling and logging system implemented in the Omniops application. The system is designed to prevent crashes, provide detailed debugging information, and ensure a smooth user experience even when errors occur.

## Quick Links
- [Overview](#overview)
- [Architecture](#architecture)
- [Components](#components)
- [Error Flow](#error-flow)
- [Configuration](#configuration)

## Keywords
architecture, best, components, configuration, debugging, error, flow, future, handling, improvements

---


## Overview

This document describes the comprehensive error handling and logging system implemented in the Omniops application. The system is designed to prevent crashes, provide detailed debugging information, and ensure a smooth user experience even when errors occur.

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     User Interface                       │
│                  (React Components)                      │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│                   Error Boundary                         │
│              (components/error-boundary.tsx)             │
│   • Catches React component errors                       │
│   • Displays fallback UI                                 │
│   • Reports errors to backend                            │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│                    API Routes                            │
│                 (app/api/*/route.ts)                     │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│              API Error Handler Middleware                │
│              (lib/api-error-handler.ts)                  │
│   • Wraps API routes                                     │
│   • Standardizes error responses                         │
│   • Adds request tracking                                │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│                Database Operations                       │
│               (lib/safe-database.ts)                     │
│   • Automatic retry logic                                │
│   • Connection pooling                                   │
│   • Graceful degradation                                 │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│              Centralized Error Logger                    │
│                (lib/error-logger.ts)                     │
│   • Severity classification                              │
│   • Category tagging                                     │
│   • Database/file persistence                            │
│   • Buffered logging                                     │
└─────────────────────────────────────────────────────────┘
```

## Components

### 1. Error Logger (`lib/error-logger.ts`)

The centralized logging service that handles all error reporting throughout the application.

#### Features:
- **Severity Levels**: LOW, MEDIUM, HIGH, CRITICAL
- **Categories**: DATABASE, API, VALIDATION, AUTHENTICATION, EXTERNAL_SERVICE, SYSTEM, BUSINESS_LOGIC
- **Buffered Logging**: Collects errors and flushes them in batches
- **Multiple Outputs**: Database (primary) and file system (fallback)

#### Usage:

```typescript
import { logError, ErrorSeverity, ErrorCategory } from '@/lib/error-logger';

// Basic usage
await logError(error);

// With context
await logError(
  error,
  {
    userId: user.id,
    endpoint: '/api/chat',
    domain: 'example.com'
  },
  ErrorSeverity.HIGH,
  ErrorCategory.API
);
```

### 2. Error Boundary (`components/error-boundary.tsx`)

React component that catches errors in the component tree and prevents app crashes.

#### Features:
- Tracks error frequency
- Shows user-friendly error UI
- Automatic error reporting
- Progressive recovery options (retry → reload → home)

#### Usage:

```tsx
import { ErrorBoundary } from '@/components/error-boundary';

export default function Layout({ children }) {
  return (
    <ErrorBoundary>
      {children}
    </ErrorBoundary>
  );
}
```

### 3. API Error Handler (`lib/api-error-handler.ts`)

Middleware that wraps API routes with consistent error handling.

#### Features:
- Automatic error catching
- Request ID generation
- Response time tracking
- Standardized error responses

#### Usage:

```typescript
import { withErrorHandler } from '@/lib/api-error-handler';

async function handler(request: NextRequest) {
  // Your API logic here
  return NextResponse.json({ success: true });
}

export const GET = withErrorHandler(handler);
```

#### Custom Error Types:

```typescript
import { ValidationError, DatabaseError, ExternalServiceError } from '@/lib/api-error-handler';

// Throw specific error types
throw new ValidationError('Invalid email format');
throw new DatabaseError('Connection failed');
throw new ExternalServiceError('OpenAI API timeout', 'openai');
```

### 4. Safe Database Operations (`lib/safe-database.ts`)

Wrapper for database operations with automatic retry logic.

#### Features:
- Automatic retries with exponential backoff
- Detection of retryable errors
- Graceful degradation
- Connection pooling

#### Usage:

```typescript
import { withDatabaseErrorHandling, safeQuery } from '@/lib/safe-database';

// Wrap any database operation
const result = await withDatabaseErrorHandling(
  async () => {
    const supabase = await createClient();
    return await supabase.from('users').select('*');
  },
  'fetch_users',
  { maxRetries: 3, retryDelay: 1000 }
);

// Use safe query helper
const data = await safeQuery(
  async (supabase) => supabase.from('posts').select('*'),
  'fetch_posts'
);
```

### 5. Process Error Handler (`lib/process-error-handler.ts`)

Global handlers for uncaught exceptions and unhandled rejections.

#### Features:
- Catches uncaught exceptions
- Handles unhandled promise rejections
- Memory monitoring (alerts at 70%, critical at 90%)
- Graceful shutdown procedures

#### Monitored Events:
- `uncaughtException` - Critical errors that would crash the app
- `unhandledRejection` - Promises without catch handlers
- `warning` - Process warnings
- `SIGTERM` / `SIGINT` - Graceful shutdown signals

### 6. Health Check Endpoint (`/api/health`)

Monitoring endpoint for system health status.

#### Response Format:

```json
{
  "status": "healthy|degraded|unhealthy",
  "checks": {
    "api": "ok|error",
    "database": "ok|error",
    "redis": "ok|error|not-configured",
    "memory": {
      "heapUsed": 224,
      "heapTotal": 252,
      "percentage": 89
    },
    "errors": {
      "recent": 5,
      "critical": 0
    }
  },
  "responseTime": "250ms"
}
```

#### Status Codes:
- `200` - Healthy or Degraded
- `503` - Unhealthy

## Error Flow

### 1. Client-Side Error

```
User Action → Component Error → Error Boundary Catches → 
→ Display Fallback UI → Log to /api/log-error → 
→ Store in Database/File
```

### 2. API Error

```
API Request → Route Handler → Error Thrown → 
→ withErrorHandler Catches → Log Error → 
→ Return Standardized Response
```

### 3. Database Error

```
Database Operation → Error Occurs → 
→ Check if Retryable → Retry with Backoff → 
→ Success OR Max Retries → Log Error → 
→ Return null OR Throw
```

## Configuration

### Environment Variables

```env
# Required for error logging to database
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Optional - for external error tracking
SENTRY_DSN=your_sentry_dsn
LOG_LEVEL=debug|info|warn|error
```

### Error Severity Guidelines

| Severity | When to Use | Examples |
|----------|------------|----------|
| LOW | Non-critical issues that don't affect functionality | Deprecation warnings, missing optional config |
| MEDIUM | Issues affecting single features | Validation errors, 404s, rate limits |
| HIGH | Issues affecting core functionality | Auth failures, database errors, API failures |
| CRITICAL | Issues that could crash the app | Uncaught exceptions, memory leaks, infinite loops |

### Error Categories

| Category | Description | Examples |
|----------|-------------|----------|
| DATABASE | Database-related errors | Connection failures, query errors, migrations |
| API | API endpoint errors | Route errors, request/response issues |
| VALIDATION | Data validation failures | Schema violations, type errors |
| AUTHENTICATION | Auth & authorization issues | Token expiry, permission denied |
| EXTERNAL_SERVICE | Third-party service errors | OpenAI, WooCommerce, Stripe failures |
| SYSTEM | System-level errors | Memory issues, file system, process errors |
| BUSINESS_LOGIC | Application logic errors | Invalid state, workflow violations |

## Best Practices

### 1. Always Use Error Context

```typescript
// ❌ Bad - No context
await logError(error);

// ✅ Good - Rich context
await logError(error, {
  userId: session?.user?.id,
  action: 'create_post',
  postId: post.id,
  timestamp: new Date().toISOString()
});
```

### 2. Use Appropriate Error Types

```typescript
// ❌ Bad - Generic error
throw new Error('Invalid data');

// ✅ Good - Specific error type
throw new ValidationError('Email must be valid format');
```

### 3. Handle Errors at the Right Level

```typescript
// ❌ Bad - Swallowing errors
try {
  await riskyOperation();
} catch (error) {
  // Silent fail
}

// ✅ Good - Proper handling
try {
  await riskyOperation();
} catch (error) {
  await logError(error, context);
  
  // Decide: recover, retry, or propagate
  if (isRetryable(error)) {
    return retry();
  }
  throw error; // Let upper layer handle
}
```

### 4. Provide User-Friendly Messages

```typescript
// ❌ Bad - Technical error to user
return { error: 'PGRST116: relation "users" does not exist' };

// ✅ Good - User-friendly message
return { 
  error: 'Unable to load user data. Please try again.',
  requestId: 'abc-123' // For support
};
```

## Monitoring & Debugging

### 1. Check Application Health

```bash
# Get current health status
curl http://localhost:3000/api/health

# Watch health status
watch -n 5 'curl -s http://localhost:3000/api/health | jq .'
```

### 2. View Error Logs

```bash
# View recent errors in database
npm run db:errors

# Tail file logs
tail -f logs/errors-*.log

# Search for specific errors
grep -r "CRITICAL" logs/
```

### 3. Debug Specific Issues

```typescript
// Enable verbose logging for a specific operation
const result = await withDatabaseErrorHandling(
  async () => { /* operation */ },
  'debug_operation',
  { 
    maxRetries: 5,
    retryDelay: 2000,
    verbose: true // Extra logging
  }
);
```

### 4. Memory Monitoring

```bash
# Check memory usage
curl http://localhost:3000/api/health | jq '.checks.memory'

# Monitor for memory leaks
npm run monitor:memory
```

## Testing Error Handling

### 1. Test Error Boundary

```tsx
// components/__tests__/error-boundary.test.tsx
import { render } from '@testing-library/react';
import { ErrorBoundary } from '@/components/error-boundary';

const ThrowError = () => {
  throw new Error('Test error');
};

test('catches and displays errors', () => {
  const { getByText } = render(
    <ErrorBoundary>
      <ThrowError />
    </ErrorBoundary>
  );
  
  expect(getByText(/something went wrong/i)).toBeInTheDocument();
});
```

### 2. Test API Error Handler

```typescript
// __tests__/api/error-handler.test.ts
import { withErrorHandler } from '@/lib/api-error-handler';

test('handles errors gracefully', async () => {
  const handler = withErrorHandler(async () => {
    throw new Error('Test error');
  });
  
  const response = await handler(new Request('http://test'));
  const data = await response.json();
  
  expect(response.status).toBe(500);
  expect(data.error).toBe(true);
  expect(data.requestId).toBeDefined();
});
```

### 3. Test Database Retry Logic

```typescript
// __tests__/safe-database.test.ts
import { withDatabaseErrorHandling } from '@/lib/safe-database';

test('retries on connection error', async () => {
  let attempts = 0;
  
  const result = await withDatabaseErrorHandling(
    async () => {
      attempts++;
      if (attempts < 3) {
        throw new Error('Connection refused');
      }
      return 'success';
    },
    'test_retry',
    { maxRetries: 3 }
  );
  
  expect(attempts).toBe(3);
  expect(result).toBe('success');
});
```

## Troubleshooting

### Common Issues

#### 1. "Module not found: Can't resolve 'fs'"
- **Cause**: Trying to use Node.js modules in browser context
- **Solution**: Check for `typeof window !== 'undefined'` before using fs

#### 2. "cookies was called outside a request scope"
- **Cause**: Using request-specific APIs in background tasks
- **Solution**: Use service role client for background operations

#### 3. High Memory Usage
- **Cause**: Memory leaks, large error buffers
- **Solution**: Check error logger buffer size, implement cleanup

#### 4. Errors Not Being Logged
- **Cause**: Missing environment variables, database issues
- **Solution**: Check SUPABASE_SERVICE_ROLE_KEY, verify error_logs table exists

## Maintenance

### Regular Tasks

1. **Weekly**: Review critical errors
2. **Monthly**: Analyze error patterns
3. **Quarterly**: Audit error categories and severities
4. **As Needed**: Clear old error logs

### Database Cleanup

```sql
-- Remove errors older than 90 days
DELETE FROM error_logs 
WHERE created_at < NOW() - INTERVAL '90 days';

-- Analyze error patterns
SELECT 
  category,
  severity,
  COUNT(*) as count,
  DATE(created_at) as date
FROM error_logs
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY category, severity, DATE(created_at)
ORDER BY date DESC, count DESC;
```

## Future Improvements

1. **Error Analytics Dashboard**: Visual representation of error trends
2. **Alert System**: Slack/email notifications for critical errors
3. **Error Replay**: Ability to replay user sessions that led to errors
4. **A/B Testing**: Test different error recovery strategies
5. **Machine Learning**: Predict and prevent errors before they occur

## Support

For issues or questions about the error handling system:

1. Check this documentation
2. Review error logs in database
3. Check health endpoint status
4. Contact the development team

---

*Last Updated: August 2025*
*Version: 1.0.0*
