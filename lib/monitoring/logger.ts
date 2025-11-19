/**
 * Structured Logging Utility
 *
 * Provides JSON-formatted structured logging for log aggregation services
 * (Logtail, Datadog, Elasticsearch, etc.). Includes correlation IDs,
 * metadata, and log levels.
 *
 * Features:
 * - Structured JSON logs
 * - Log levels (debug, info, warn, error)
 * - Correlation IDs for request tracking
 * - Metadata and context
 * - Integration with existing logger
 * - Production-ready formatting
 *
 * Usage:
 * ```ts
 * import { structuredLogger } from '@/lib/monitoring/logger';
 *
 * structuredLogger.info('User logged in', { userId: '123', email: 'user@example.com' });
 * structuredLogger.error('Payment failed', { orderId: '456', amount: 99.99 }, error);
 *
 * // With correlation ID for request tracking
 * const correlationId = generateCorrelationId();
 * structuredLogger.info('Processing order', { orderId: '789' }, correlationId);
 * ```
 *
 * LOC: ~260 lines
 */

import { logger as basicLogger } from '@/lib/logger';

// Log level enum
export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
}

// Log entry structure
export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  correlationId?: string;
  context?: Record<string, any>;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
  metadata: {
    environment: string;
    service: string;
    version: string;
    hostname?: string;
    pid: number;
  };
}

// Configuration
const config = {
  serviceName: 'omniops',
  environment: process.env.NODE_ENV || 'development',
  version: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
  formatJson: process.env.NODE_ENV === 'production',
};

/**
 * Generate a unique correlation ID for request tracking
 */
export function generateCorrelationId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
}

/**
 * Format log entry as JSON
 */
function formatLogEntry(entry: LogEntry): string {
  if (config.formatJson) {
    return JSON.stringify(entry);
  }

  // Development-friendly format
  const contextStr = entry.context ? ` ${JSON.stringify(entry.context)}` : '';
  const correlationStr = entry.correlationId ? ` [${entry.correlationId}]` : '';
  return `[${entry.timestamp}] [${entry.level.toUpperCase()}]${correlationStr} ${entry.message}${contextStr}`;
}

/**
 * Create metadata for log entry
 */
function createMetadata(): LogEntry['metadata'] {
  return {
    environment: config.environment,
    service: config.serviceName,
    version: config.version,
    hostname: typeof process !== 'undefined' ? process.env.HOSTNAME : undefined,
    pid: typeof process !== 'undefined' ? process.pid : 0,
  };
}

/**
 * Structured logger class
 */
class StructuredLogger {
  private correlationId?: string;

  /**
   * Set correlation ID for all subsequent logs
   */
  setCorrelationId(correlationId: string): void {
    this.correlationId = correlationId;
  }

  /**
   * Clear correlation ID
   */
  clearCorrelationId(): void {
    this.correlationId = undefined;
  }

  /**
   * Log debug message
   */
  debug(
    message: string,
    context?: Record<string, any>,
    correlationId?: string
  ): void {
    if (process.env.NODE_ENV !== 'development') return;

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: LogLevel.DEBUG,
      message,
      correlationId: correlationId || this.correlationId,
      context,
      metadata: createMetadata(),
    };

    console.debug(formatLogEntry(entry));
  }

  /**
   * Log info message
   */
  info(
    message: string,
    context?: Record<string, any>,
    correlationId?: string
  ): void {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: LogLevel.INFO,
      message,
      correlationId: correlationId || this.correlationId,
      context,
      metadata: createMetadata(),
    };

    console.info(formatLogEntry(entry));
  }

  /**
   * Log warning message
   */
  warn(
    message: string,
    context?: Record<string, any>,
    correlationId?: string
  ): void {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: LogLevel.WARN,
      message,
      correlationId: correlationId || this.correlationId,
      context,
      metadata: createMetadata(),
    };

    console.warn(formatLogEntry(entry));
  }

  /**
   * Log error message
   */
  error(
    message: string,
    context?: Record<string, any>,
    error?: Error | unknown,
    correlationId?: string
  ): void {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: LogLevel.ERROR,
      message,
      correlationId: correlationId || this.correlationId,
      context,
      error: error instanceof Error
        ? {
            name: error.name,
            message: error.message,
            stack: error.stack,
          }
        : undefined,
      metadata: createMetadata(),
    };

    console.error(formatLogEntry(entry));
  }

  /**
   * Log with custom level
   */
  log(
    level: LogLevel,
    message: string,
    context?: Record<string, any>,
    error?: Error | unknown,
    correlationId?: string
  ): void {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      correlationId: correlationId || this.correlationId,
      context,
      error: error instanceof Error
        ? {
            name: error.name,
            message: error.message,
            stack: error.stack,
          }
        : undefined,
      metadata: createMetadata(),
    };

    const logFn = level === LogLevel.ERROR
      ? console.error
      : level === LogLevel.WARN
      ? console.warn
      : level === LogLevel.DEBUG
      ? console.debug
      : console.info;

    logFn(formatLogEntry(entry));
  }

  /**
   * Create child logger with correlation ID
   */
  child(correlationId: string): StructuredLogger {
    const child = new StructuredLogger();
    child.setCorrelationId(correlationId);
    return child;
  }
}

// Export singleton instance
export const structuredLogger = new StructuredLogger();

/**
 * Create logger for a specific request with correlation ID
 */
export function createRequestLogger(correlationId?: string): StructuredLogger {
  const id = correlationId || generateCorrelationId();
  return structuredLogger.child(id);
}

/**
 * Middleware helper to add correlation ID to requests
 */
export function withCorrelationId(
  headers: Headers
): { correlationId: string; logger: StructuredLogger } {
  const correlationId =
    headers.get('x-correlation-id') ||
    headers.get('x-request-id') ||
    generateCorrelationId();

  const logger = createRequestLogger(correlationId);
  return { correlationId, logger };
}

/**
 * Export basic logger for backwards compatibility
 */
export { basicLogger as logger };
