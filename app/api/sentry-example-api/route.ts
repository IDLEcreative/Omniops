/**
 * Sentry Integration Example API Route
 *
 * Demonstrates how to use Sentry error tracking in Next.js API routes.
 * This is a reference implementation showing best practices.
 *
 * Features demonstrated:
 * - Error capture with context
 * - Breadcrumb tracking
 * - User context
 * - Performance monitoring
 * - Custom tags
 *
 * Usage:
 * - GET /api/sentry-example-api?action=success - Successful request
 * - GET /api/sentry-example-api?action=error - Trigger error (captured by Sentry)
 * - GET /api/sentry-example-api?action=message - Send info message to Sentry
 *
 * LOC: ~120 lines
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  captureError,
  captureMessage,
  setUserContext,
  addBreadcrumb,
  setTags,
  withSentry,
  trackDatabaseQuery,
} from '@/lib/monitoring/sentry';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function handler(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action') || 'success';
  const userId = searchParams.get('userId') || 'anonymous';

  // Set user context for error tracking
  if (userId !== 'anonymous') {
    setUserContext({
      id: userId,
      email: `${userId}@example.com`,
      domain: 'example.com',
    });
  }

  // Add custom tags
  setTags({
    action,
    environment: process.env.NODE_ENV || 'development',
    api_version: '1.0',
  });

  // Add breadcrumb for user action
  addBreadcrumb('User accessed Sentry example API', {
    action,
    userId,
    timestamp: new Date().toISOString(),
  });

  try {
    switch (action) {
      case 'success':
        // Successful operation with breadcrumb
        addBreadcrumb('Processing successful request');

        return NextResponse.json({
          success: true,
          message: 'Request processed successfully',
          sentryEnabled: !!process.env.NEXT_PUBLIC_SENTRY_DSN,
        });

      case 'error':
        // Intentional error for testing Sentry
        addBreadcrumb('About to throw test error');
        throw new Error('This is a test error for Sentry tracking');

      case 'message':
        // Send info message to Sentry
        captureMessage('User accessed example endpoint', 'info', {
          userId,
          action,
          userAgent: request.headers.get('user-agent'),
        });

        return NextResponse.json({
          success: true,
          message: 'Message sent to Sentry',
        });

      case 'database':
        // Simulate database query tracking
        const queryStart = Date.now();

        addBreadcrumb('Simulating database query');
        await new Promise(resolve => setTimeout(resolve, 50)); // Simulate query

        const duration = Date.now() - queryStart;
        trackDatabaseQuery('SELECT * FROM users WHERE id = ?', duration, 'users');

        return NextResponse.json({
          success: true,
          message: 'Database query tracked',
          duration,
        });

      case 'unhandled':
        // Simulate unhandled error
        addBreadcrumb('Triggering unhandled error');
        // This will be caught by the outer try-catch
        JSON.parse('invalid json{');
        break;

      default:
        captureMessage(`Unknown action: ${action}`, 'warning', { action });
        return NextResponse.json(
          {
            success: false,
            error: 'Unknown action',
            validActions: ['success', 'error', 'message', 'database', 'unhandled'],
          },
          { status: 400 }
        );
    }
  } catch (error) {
    // Capture error with full context
    const errorId = captureError(error, {
      action,
      userId,
      url: request.url,
      method: request.method,
      headers: Object.fromEntries(request.headers.entries()),
    });

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        errorId,
        sentryEnabled: !!process.env.NEXT_PUBLIC_SENTRY_DSN,
      },
      { status: 500 }
    );
  }
}

// Wrap handler with Sentry for automatic error tracking
export const GET = withSentry(handler, {
  operation: 'sentry-example-api',
  tags: {
    endpoint: '/api/sentry-example-api',
  },
});
