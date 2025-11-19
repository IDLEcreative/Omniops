/**
 * Sentry Helper Functions
 *
 * Extended functionality for Sentry integration including:
 * - Database query tracking
 * - API call tracking
 * - Wrapper functions for automatic error capture
 *
 * LOC: ~100 lines
 */

import * as Sentry from '@sentry/nextjs';
import { addBreadcrumb, startTransaction } from './sentry';

const isSentryEnabled = !!process.env.NEXT_PUBLIC_SENTRY_DSN;

/**
 * Track database query performance
 */
export function trackDatabaseQuery(
  query: string,
  duration: number,
  table?: string
): void {
  if (!isSentryEnabled) return;

  addBreadcrumb(`DB Query: ${query.substring(0, 100)}`, {
    duration,
    table,
  }, 'database');

  // Create span if we're in a transaction
  const activeTransaction = Sentry.getActiveTransaction();
  if (activeTransaction) {
    const span = activeTransaction.startChild({
      op: 'db.query',
      description: query.substring(0, 100),
      data: { table, duration },
    });
    span.finish();
  }
}

/**
 * Track external API calls
 */
export function trackApiCall(
  url: string,
  method: string,
  duration: number,
  status: number
): void {
  if (!isSentryEnabled) return;

  addBreadcrumb(`API Call: ${method} ${url}`, {
    method,
    status,
    duration,
  }, 'http');

  const activeTransaction = Sentry.getActiveTransaction();
  if (activeTransaction) {
    const span = activeTransaction.startChild({
      op: 'http.client',
      description: `${method} ${url}`,
      data: { status, duration },
    });
    span.finish();
  }
}

/**
 * Wrapper for API routes with automatic error tracking
 */
export function withSentry<T extends (...args: any[]) => Promise<any>>(
  handler: T,
  options?: {
    operation?: string;
    tags?: Record<string, string>;
  }
): T {
  return (async (...args: any[]) => {
    const transaction = startTransaction(
      options?.operation || 'api-handler',
      'http.server',
      options?.tags
    );

    try {
      const result = await handler(...args);
      transaction?.setStatus('ok');
      return result;
    } catch (error) {
      transaction?.setStatus('internal_error');
      const { captureError } = await import('./sentry');
      captureError(error, {
        operation: options?.operation,
        args: JSON.stringify(args),
      });
      throw error;
    } finally {
      transaction?.finish();
    }
  }) as T;
}

/**
 * Flush pending events (useful before serverless function exits)
 */
export async function flush(timeout: number = 2000): Promise<boolean> {
  if (!isSentryEnabled) return true;
  return Sentry.flush(timeout);
}
