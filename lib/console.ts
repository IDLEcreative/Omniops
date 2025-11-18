/**
 * Safe Console Logging Utilities
 * Prevents sensitive information from being logged in production
 */

type ConsoleMethod = 'log' | 'warn' | 'error' | 'info' | 'debug';

/**
 * Safe console wrapper that sanitizes logs in production
 */
export const safeConsole = {
  /**
   * Log informational messages (disabled in production)
   */
  log: (...args: any[]) => {
    if (process.env.NODE_ENV !== 'production') {
      console.log(...args);
    }
  },

  /**
   * Log informational messages (disabled in production)
   */
  info: (...args: any[]) => {
    if (process.env.NODE_ENV !== 'production') {
      console.info(...args);
    }
  },

  /**
   * Log debug messages (disabled in production)
   */
  debug: (...args: any[]) => {
    if (process.env.NODE_ENV !== 'production') {
      console.debug(...args);
    }
  },

  /**
   * Log warnings (always enabled, sanitized in production)
   */
  warn: (...args: any[]) => {
    if (process.env.NODE_ENV === 'production') {
      // In production, sanitize the warning message
      const sanitized = args.map(arg => sanitizeLogArg(arg));
      console.warn(...sanitized);
    } else {
      console.warn(...args);
    }
  },

  /**
   * Log errors (always enabled, sanitized in production)
   */
  error: (...args: any[]) => {
    if (process.env.NODE_ENV === 'production') {
      // In production, sanitize the error message
      const sanitized = args.map(arg => sanitizeLogArg(arg));
      console.error(...sanitized);
    } else {
      console.error(...args);
    }
  },
};

/**
 * Sanitize log arguments to prevent leaking sensitive data
 */
function sanitizeLogArg(arg: any): any {
  if (typeof arg === 'string') {
    return sanitizeString(arg);
  }

  if (arg instanceof Error) {
    return {
      name: arg.name,
      message: sanitizeString(arg.message),
      // Don't include stack traces in production logs
    };
  }

  if (typeof arg === 'object' && arg !== null) {
    return sanitizeObject(arg);
  }

  return arg;
}

/**
 * Sanitize strings to remove potential sensitive data
 */
function sanitizeString(str: string): string {
  return str
    // Remove potential API keys
    .replace(/([a-z]+[-_])?api[-_]?key[=:\s]+['\"]?[\w-]+/gi, '$1api_key=***REDACTED***')
    // Remove potential tokens
    .replace(/([a-z]+[-_])?token[=:\s]+['\"]?[\w.-]+/gi, '$1token=***REDACTED***')
    // Remove potential secrets
    .replace(/([a-z]+[-_])?secret[=:\s]+['\"]?[\w-]+/gi, '$1secret=***REDACTED***')
    // Remove potential passwords
    .replace(/password[=:\s]+['\"]?[^\s'"]+/gi, 'password=***REDACTED***')
    // Remove email addresses (keep domain for debugging)
    .replace(/[\w.+-]+@([\w.-]+)/g, '***@$1')
    // Remove potential credit card numbers
    .replace(/\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g, '****-****-****-****');
}

/**
 * Sanitize objects to remove sensitive keys
 */
function sanitizeObject(obj: any): any {
  const sensitiveKeys = [
    'password',
    'token',
    'apiKey',
    'api_key',
    'secret',
    'authorization',
    'auth',
    'creditCard',
    'credit_card',
    'ssn',
    'privateKey',
    'private_key',
  ];

  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeLogArg(item));
  }

  const sanitized: any = {};
  for (const [key, value] of Object.entries(obj)) {
    const lowerKey = key.toLowerCase();

    if (sensitiveKeys.some(sensitive => lowerKey.includes(sensitive))) {
      sanitized[key] = '***REDACTED***';
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeLogArg(value);
    } else if (typeof value === 'string') {
      sanitized[key] = sanitizeString(value);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

/**
 * Create a scoped logger with a prefix
 */
export function createLogger(prefix: string) {
  return {
    log: (...args: any[]) => safeConsole.log(`[${prefix}]`, ...args),
    info: (...args: any[]) => safeConsole.info(`[${prefix}]`, ...args),
    debug: (...args: any[]) => safeConsole.debug(`[${prefix}]`, ...args),
    warn: (...args: any[]) => safeConsole.warn(`[${prefix}]`, ...args),
    error: (...args: any[]) => safeConsole.error(`[${prefix}]`, ...args),
  };
}
