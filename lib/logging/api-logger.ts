/**
 * API Request/Response Logger
 *
 * Provides structured logging for API endpoints with request tracking,
 * performance monitoring, and error correlation.
 *
 * Usage:
 * ```typescript
 * const requestId = await ApiLogger.logRequest(request, 'conversations.list', userId);
 * const startTime = Date.now();
 *
 * // ... handler logic ...
 *
 * ApiLogger.logResponse(requestId, 200, Date.now() - startTime, cached);
 * ```
 */

import { NextRequest } from 'next/server';

interface RequestLogData {
  requestId: string;
  endpoint: string;
  method: string;
  userId?: string;
  timestamp: string;
  userAgent?: string;
  queryParams?: Record<string, string>;
  ip?: string;
}

interface ResponseLogData {
  requestId: string;
  status: number;
  duration: number;
  cached: boolean;
  timestamp: string;
  errorCode?: string;
}

interface ErrorLogData {
  requestId: string;
  error: string;
  stack?: string;
  timestamp: string;
  endpoint: string;
}

export class ApiLogger {
  /**
   * Log an incoming API request
   *
   * @param request - Next.js request object
   * @param endpoint - Endpoint identifier (e.g., 'conversations.list')
   * @param userId - Optional user ID from auth
   * @returns Request ID for correlation
   */
  static async logRequest(
    request: NextRequest,
    endpoint: string,
    userId?: string
  ): Promise<string> {
    const requestId = crypto.randomUUID();

    const logData: RequestLogData = {
      requestId,
      endpoint,
      method: request.method,
      userId,
      timestamp: new Date().toISOString(),
      userAgent: request.headers.get('user-agent') || undefined,
      ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
    };

    // Extract query parameters
    const searchParams = request.nextUrl.searchParams;
    const queryParams: Record<string, string> = {};
    searchParams.forEach((value, key) => {
      queryParams[key] = value;
    });
    if (Object.keys(queryParams).length > 0) {
      logData.queryParams = queryParams;
    }

    console.log('[API Request]', JSON.stringify(logData));

    return requestId;
  }

  /**
   * Log a successful API response
   *
   * @param requestId - Request ID from logRequest
   * @param status - HTTP status code
   * @param duration - Request duration in milliseconds
   * @param cached - Whether response was served from cache
   */
  static logResponse(
    requestId: string,
    status: number,
    duration: number,
    cached: boolean = false,
    errorCode?: string
  ): void {
    const logData: ResponseLogData = {
      requestId,
      status,
      duration,
      cached,
      timestamp: new Date().toISOString(),
      errorCode,
    };

    const logLevel = status >= 500 ? 'error' : status >= 400 ? 'warn' : 'info';
    const logMessage = `[API Response] ${logLevel.toUpperCase()}`;

    if (logLevel === 'error') {
      console.error(logMessage, JSON.stringify(logData));
    } else if (logLevel === 'warn') {
      console.warn(logMessage, JSON.stringify(logData));
    } else {
      console.log(logMessage, JSON.stringify(logData));
    }

    // Log performance warnings
    if (duration > 5000 && !cached) {
      console.warn(`[API Performance] Slow request detected: ${requestId} took ${duration}ms`);
    }
  }

  /**
   * Log an API error
   *
   * @param requestId - Request ID from logRequest
   * @param error - Error object or message
   * @param endpoint - Endpoint identifier
   */
  static logError(
    requestId: string,
    error: Error | string,
    endpoint: string
  ): void {
    const logData: ErrorLogData = {
      requestId,
      error: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString(),
      endpoint,
    };

    console.error('[API Error]', JSON.stringify(logData));
  }

  /**
   * Create a performance timer
   *
   * @param label - Timer label
   * @returns Start time in milliseconds
   */
  static startTimer(label: string): number {
    const startTime = Date.now();
    return startTime;
  }

  /**
   * End a performance timer and log duration
   *
   * @param label - Timer label
   * @param startTime - Start time from startTimer
   */
  static endTimer(label: string, startTime: number): number {
    const duration = Date.now() - startTime;
    return duration;
  }

  /**
   * Log a validation error
   *
   * @param requestId - Request ID
   * @param validationErrors - Zod validation errors
   */
  static logValidationError(
    requestId: string,
    validationErrors: any
  ): void {
    console.warn('[API Validation]', JSON.stringify({
      requestId,
      timestamp: new Date().toISOString(),
      errors: validationErrors,
    }));
  }

  /**
   * Log a cache operation
   *
   * @param operation - Cache operation (hit, miss, set, invalidate)
   * @param key - Cache key
   * @param metadata - Additional metadata
   */
  static logCache(
    operation: 'hit' | 'miss' | 'set' | 'invalidate',
    key: string,
    metadata?: Record<string, any>
  ): void {
    console.log('[Cache]', JSON.stringify({
      operation,
      key,
      timestamp: new Date().toISOString(),
      ...metadata,
    }));
  }

  /**
   * Log a database query
   *
   * @param query - Query description
   * @param duration - Query duration in milliseconds
   * @param rowCount - Number of rows returned
   */
  static logQuery(
    query: string,
    duration: number,
    rowCount?: number
  ): void {
    const logData = {
      query,
      duration,
      rowCount,
      timestamp: new Date().toISOString(),
    };

    if (duration > 1000) {
      console.warn('[Slow Query]', JSON.stringify(logData));
    } else {
      console.log('[DB Query]', JSON.stringify(logData));
    }
  }
}
