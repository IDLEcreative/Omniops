/**
 * Structured Logger with Production Features
 *
 * Features:
 * - Log levels: debug, info, warn, error
 * - Automatic sensitive data redaction
 * - Structured JSON output in production
 * - Pretty console output in development
 * - Request ID tracking for distributed tracing
 * - Context enrichment (timestamp, service, environment)
 * - Error serialization with stack traces
 */

import { AsyncLocalStorage } from 'async_hooks';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogContext {
  [key: string]: any;
  requestId?: string;
  userId?: string;
  customerId?: string;
  service?: string;
}

export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  environment: string;
  service: string;
  context?: LogContext;
  error?: {
    message: string;
    name: string;
    stack?: string;
  };
  requestId?: string;
}

// Async local storage for request context
const asyncLocalStorage = new AsyncLocalStorage<Map<string, any>>();

// Sensitive field patterns to redact
const SENSITIVE_PATTERNS = [
  'password',
  'secret',
  'apiKey',
  'api_key',
  'token',
  'credential',
  'authorization',
  'auth',
  'key',
  'privateKey',
  'private_key',
  'accessToken',
  'access_token',
  'refreshToken',
  'refresh_token',
  'sessionId',
  'session_id',
  'ssn',
  'creditCard',
  'credit_card',
  'cvv',
  'pin',
];

class Logger {
  private logs: LogEntry[] = [];
  private maxLogs = 1000;

  // Dynamic getters for environment checks (to support testing)
  private get isDevelopment() {
    return process.env.NODE_ENV === 'development';
  }

  private get isProduction() {
    return process.env.NODE_ENV === 'production';
  }

  private get serviceName() {
    return process.env.SERVICE_NAME || 'omniops';
  }

  /**
   * Redact sensitive data from context objects
   */
  private redactSensitiveData(obj: any): any {
    if (!obj || typeof obj !== 'object') {
      return obj;
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this.redactSensitiveData(item));
    }

    const redacted: any = {};
    for (const [key, value] of Object.entries(obj)) {
      const lowerKey = key.toLowerCase();
      const isSensitive = SENSITIVE_PATTERNS.some(pattern =>
        lowerKey.includes(pattern.toLowerCase())
      );

      if (isSensitive) {
        redacted[key] = '[REDACTED]';
      } else if (typeof value === 'object' && value !== null) {
        redacted[key] = this.redactSensitiveData(value);
      } else {
        redacted[key] = value;
      }
    }
    return redacted;
  }

  /**
   * Serialize error objects with stack traces
   */
  private serializeError(error: Error | unknown): LogEntry['error'] {
    if (error instanceof Error) {
      return {
        message: error.message,
        name: error.name,
        stack: this.isDevelopment ? error.stack : undefined,
      };
    }
    return {
      message: String(error),
      name: 'UnknownError',
    };
  }

  /**
   * Get current request ID from async context
   */
  private getRequestId(): string | undefined {
    const store = asyncLocalStorage.getStore();
    return store?.get('requestId');
  }

  /**
   * Format log entry for output
   */
  private formatLogEntry(entry: LogEntry): string {
    if (this.isProduction) {
      // JSON output for production (log aggregation tools)
      return JSON.stringify(entry);
    }

    // Pretty console output for development
    const { level, message, timestamp, context, error } = entry;
    const levelColors: Record<LogLevel, string> = {
      debug: '\x1b[36m', // Cyan
      info: '\x1b[32m',  // Green
      warn: '\x1b[33m',  // Yellow
      error: '\x1b[31m', // Red
    };
    const reset = '\x1b[0m';
    const color = levelColors[level] || reset;

    let output = `${color}[${timestamp}] [${level.toUpperCase()}]${reset} ${message}`;

    if (context && Object.keys(context).length > 0) {
      output += `\n  Context: ${JSON.stringify(context, null, 2)}`;
    }

    if (error) {
      output += `\n  Error: ${error.name}: ${error.message}`;
      if (error.stack) {
        output += `\n${error.stack}`;
      }
    }

    return output;
  }

  /**
   * Create log entry with enriched context
   */
  private createLogEntry(
    level: LogLevel,
    message: string,
    context?: LogContext,
    error?: Error | unknown
  ): LogEntry {
    const requestId = this.getRequestId() || context?.requestId;
    const redactedContext = context ? this.redactSensitiveData(context) : undefined;

    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      service: this.serviceName,
      context: redactedContext,
      requestId,
    };

    if (error) {
      entry.error = this.serializeError(error);
    }

    return entry;
  }

  /**
   * Add log to history
   */
  private addToHistory(entry: LogEntry) {
    this.logs.push(entry);
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }
  }

  /**
   * Output log entry
   */
  private output(entry: LogEntry) {
    const formatted = this.formatLogEntry(entry);

    switch (entry.level) {
      case 'debug':
        console.debug(formatted);
        break;
      case 'info':
        console.info(formatted);
        break;
      case 'warn':
        console.warn(formatted);
        break;
      case 'error':
        console.error(formatted);
        break;
    }
  }

  /**
   * Debug level logging (development only)
   */
  debug(message: string, context?: LogContext) {
    if (!this.isDevelopment) return;

    const entry = this.createLogEntry('debug', message, context);
    this.addToHistory(entry);
    this.output(entry);
  }

  /**
   * Info level logging
   */
  info(message: string, context?: LogContext) {
    const entry = this.createLogEntry('info', message, context);
    this.addToHistory(entry);
    this.output(entry);
  }

  /**
   * Warning level logging
   */
  warn(message: string, context?: LogContext) {
    const entry = this.createLogEntry('warn', message, context);
    this.addToHistory(entry);
    this.output(entry);
  }

  /**
   * Error level logging
   */
  error(message: string, error?: Error | unknown, context?: LogContext) {
    const entry = this.createLogEntry('error', message, context, error);
    this.addToHistory(entry);
    this.output(entry);

    // In production, send to error tracking service (e.g., Sentry, DataDog)
    if (this.isProduction && typeof window !== 'undefined') {
      // TODO: Integrate with error tracking service
      // Example: Sentry.captureException(error, { contexts: { custom: context } });
    }
  }

  /**
   * Set request ID in async context
   */
  setRequestId(requestId: string) {
    const store = asyncLocalStorage.getStore() || new Map();
    store.set('requestId', requestId);
  }

  /**
   * Run function with request context
   */
  async withRequestContext<T>(
    requestId: string,
    fn: () => Promise<T>
  ): Promise<T> {
    const store = new Map();
    store.set('requestId', requestId);
    return asyncLocalStorage.run(store, fn);
  }

  /**
   * Get recent logs for debugging
   */
  getRecentLogs(count: number = 50): LogEntry[] {
    return this.logs.slice(-count);
  }

  /**
   * Clear log history
   */
  clearLogs() {
    this.logs = [];
  }

  /**
   * Export logs as JSON
   */
  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }

  /**
   * Get logs by level
   */
  getLogsByLevel(level: LogLevel, count: number = 50): LogEntry[] {
    return this.logs
      .filter(log => log.level === level)
      .slice(-count);
  }

  /**
   * Get logs by request ID
   */
  getLogsByRequestId(requestId: string): LogEntry[] {
    return this.logs.filter(log => log.requestId === requestId);
  }
}

// Create singleton instance
export const logger = new Logger();

/**
 * Utility function for async error handling
 */
export async function withErrorHandling<T>(
  fn: () => Promise<T>,
  errorMessage: string,
  context?: LogContext
): Promise<T | null> {
  try {
    return await fn();
  } catch (error) {
    logger.error(errorMessage, error, context);
    return null;
  }
}

/**
 * React hook for error logging
 */
export function useLogger() {
  return logger;
}

/**
 * Middleware helper for Next.js API routes
 * Automatically tracks request ID and logs request/response
 */
export function withRequestLogging<T>(
  handler: (req: any, res: any) => Promise<T>
) {
  return async (req: any, res: any): Promise<T> => {
    const requestId = req.headers['x-request-id'] ||
                      `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    return logger.withRequestContext(requestId, async () => {
      const startTime = Date.now();

      logger.info('Incoming request', {
        requestId,
        method: req.method,
        url: req.url,
        userAgent: req.headers['user-agent'],
      });

      try {
        const result = await handler(req, res);

        const duration = Date.now() - startTime;
        logger.info('Request completed', {
          requestId,
          duration,
          statusCode: res.statusCode,
        });

        return result;
      } catch (error) {
        const duration = Date.now() - startTime;
        logger.error('Request failed', error, {
          requestId,
          duration,
          method: req.method,
          url: req.url,
        });
        throw error;
      }
    });
  };
}
