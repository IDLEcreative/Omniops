/**
 * Error Classification System for Adaptive Retry Strategies
 *
 * Classifies errors into categories to determine appropriate retry behavior:
 * - TRANSIENT: Network blips, temporary issues → Retry with exponential backoff
 * - AUTH_FAILURE: Invalid credentials, unauthorized → No retry
 * - RATE_LIMIT: Too many requests → Exponential backoff with longer delays
 * - SERVER_ERROR: Server-side issues → Linear backoff
 * - NOT_FOUND: Resource doesn't exist → No retry
 * - UNKNOWN: Unclassified errors → Default retry strategy
 */

export type ErrorCategory =
  | 'TRANSIENT'
  | 'AUTH_FAILURE'
  | 'RATE_LIMIT'
  | 'SERVER_ERROR'
  | 'NOT_FOUND'
  | 'UNKNOWN';

export interface ClassifiedError {
  category: ErrorCategory;
  message: string;
  shouldRetry: boolean;
  originalError: Error | unknown;
}

/**
 * Classifies an error into a category based on error message, type, and HTTP status codes
 * @param error - The error to classify (Error object, string, or unknown)
 * @returns ErrorCategory enum value
 */
export function classifyError(error: Error | unknown): ErrorCategory {
  // Extract error message and relevant details
  const errorMessage = error instanceof Error ? error.message : String(error);
  const errorString = errorMessage.toLowerCase();

  // Check HTTP status codes FIRST before checking for generic keywords
  // This prevents "504 Gateway Timeout" from being classified as TRANSIENT due to "timeout"

  // 1. Authentication/Authorization Errors (AUTH_FAILURE)
  if (
    errorString.includes('401') ||
    errorString.includes('403') ||
    errorString.includes('unauthorized') ||
    errorString.includes('forbidden') ||
    errorString.includes('invalid credentials') ||
    errorString.includes('authentication failed') ||
    errorString.includes('invalid api key') ||
    errorString.includes('invalid token') ||
    errorString.includes('access denied')
  ) {
    return 'AUTH_FAILURE';
  }

  // 2. Not Found Errors (NOT_FOUND)
  if (
    errorString.includes('404') ||
    errorString.includes('not found') ||
    errorString.includes('pgrst116') || // Supabase "row not found" error code
    errorString.includes('does not exist')
  ) {
    return 'NOT_FOUND';
  }

  // 3. Rate Limiting (RATE_LIMIT)
  if (
    errorString.includes('429') ||
    errorString.includes('rate limit') ||
    errorString.includes('too many requests') ||
    errorString.includes('quota exceeded') ||
    errorString.includes('throttled')
  ) {
    return 'RATE_LIMIT';
  }

  // 4. Server Errors (SERVER_ERROR) - Check BEFORE TRANSIENT to catch "504 Gateway Timeout"
  // Use word boundaries for HTTP status codes to avoid matching "5000ms" as "500"
  const httpStatusPattern = /\b(500|502|503|504)\b/;
  if (
    httpStatusPattern.test(errorString) ||
    errorString.includes('internal server error') ||
    errorString.includes('bad gateway') ||
    errorString.includes('service unavailable') ||
    errorString.includes('gateway timeout')
  ) {
    return 'SERVER_ERROR';
  }

  // 5. Network/Connection Errors (TRANSIENT) - Check AFTER SERVER_ERROR
  // These are client-side timeouts (request timeout, connection timeout)
  if (
    errorString.includes('econnreset') ||
    errorString.includes('econnrefused') ||
    errorString.includes('etimedout') ||
    errorString.includes('request timeout') ||
    errorString.includes('connection timeout') ||
    errorString.includes('timeout') || // Generic timeout (after checking for gateway timeout)
    errorString.includes('network error') ||
    errorString.includes('connection failed') ||
    errorString.includes('socket hang up') ||
    errorString.includes('enotfound')
  ) {
    return 'TRANSIENT';
  }

  // 6. Default to UNKNOWN for unclassified errors
  return 'UNKNOWN';
}

/**
 * Classifies an error and returns detailed classification with retry recommendation
 * @param error - The error to classify
 * @returns ClassifiedError object with category, message, and retry recommendation
 */
export function classifyErrorWithDetails(error: Error | unknown): ClassifiedError {
  const category = classifyError(error);
  const message = error instanceof Error ? error.message : String(error);

  // Determine if error should be retried based on category
  const shouldRetry = !(category === 'AUTH_FAILURE' || category === 'NOT_FOUND');

  return {
    category,
    message,
    shouldRetry,
    originalError: error,
  };
}

/**
 * Checks if an error category is retryable
 * @param category - The error category
 * @returns true if the error should be retried, false otherwise
 */
export function isRetryableError(category: ErrorCategory): boolean {
  return category !== 'AUTH_FAILURE' && category !== 'NOT_FOUND';
}

/**
 * Gets a human-readable description of an error category
 * @param category - The error category
 * @returns Description string
 */
export function getErrorCategoryDescription(category: ErrorCategory): string {
  const descriptions: Record<ErrorCategory, string> = {
    TRANSIENT: 'Temporary network or connection issue',
    AUTH_FAILURE: 'Authentication or authorization failure',
    RATE_LIMIT: 'Rate limit exceeded',
    SERVER_ERROR: 'Server-side error',
    NOT_FOUND: 'Resource not found',
    UNKNOWN: 'Unclassified error',
  };

  return descriptions[category];
}
