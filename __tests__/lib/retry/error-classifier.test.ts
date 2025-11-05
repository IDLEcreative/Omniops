/**
 * Tests for Error Classification System
 * CRITICAL: Verifies error classification for adaptive retry strategies
 */

import { describe, it, expect } from '@jest/globals';
import {
  classifyError,
  classifyErrorWithDetails,
  isRetryableError,
  getErrorCategoryDescription,
  type ErrorCategory,
} from '@/lib/retry/error-classifier';

describe('classifyError', () => {
  describe('TRANSIENT errors', () => {
    it('should classify network timeout errors as TRANSIENT', () => {
      const error = new Error('ETIMEDOUT: Connection timed out');
      expect(classifyError(error)).toBe('TRANSIENT');
    });

    it('should classify connection reset errors as TRANSIENT', () => {
      const error = new Error('ECONNRESET: Connection reset by peer');
      expect(classifyError(error)).toBe('TRANSIENT');
    });

    it('should classify connection refused errors as TRANSIENT', () => {
      const error = new Error('ECONNREFUSED: Connection refused');
      expect(classifyError(error)).toBe('TRANSIENT');
    });

    it('should classify socket hang up errors as TRANSIENT', () => {
      const error = new Error('socket hang up');
      expect(classifyError(error)).toBe('TRANSIENT');
    });

    it('should classify generic timeout errors as TRANSIENT', () => {
      const error = new Error('Request timeout after 5000ms');
      expect(classifyError(error)).toBe('TRANSIENT');
    });

    it('should classify ENOTFOUND errors as TRANSIENT', () => {
      const error = new Error('ENOTFOUND: DNS lookup failed');
      expect(classifyError(error)).toBe('TRANSIENT');
    });
  });

  describe('AUTH_FAILURE errors', () => {
    it('should classify 401 errors as AUTH_FAILURE', () => {
      const error = new Error('401 Unauthorized');
      expect(classifyError(error)).toBe('AUTH_FAILURE');
    });

    it('should classify 403 errors as AUTH_FAILURE', () => {
      const error = new Error('403 Forbidden');
      expect(classifyError(error)).toBe('AUTH_FAILURE');
    });

    it('should classify invalid credentials errors as AUTH_FAILURE', () => {
      const error = new Error('Invalid credentials provided');
      expect(classifyError(error)).toBe('AUTH_FAILURE');
    });

    it('should classify authentication failed errors as AUTH_FAILURE', () => {
      const error = new Error('Authentication failed');
      expect(classifyError(error)).toBe('AUTH_FAILURE');
    });

    it('should classify invalid API key errors as AUTH_FAILURE', () => {
      const error = new Error('Invalid API key');
      expect(classifyError(error)).toBe('AUTH_FAILURE');
    });

    it('should classify invalid token errors as AUTH_FAILURE', () => {
      const error = new Error('Invalid token provided');
      expect(classifyError(error)).toBe('AUTH_FAILURE');
    });
  });

  describe('RATE_LIMIT errors', () => {
    it('should classify 429 errors as RATE_LIMIT', () => {
      const error = new Error('429 Too Many Requests');
      expect(classifyError(error)).toBe('RATE_LIMIT');
    });

    it('should classify rate limit exceeded errors as RATE_LIMIT', () => {
      const error = new Error('Rate limit exceeded');
      expect(classifyError(error)).toBe('RATE_LIMIT');
    });

    it('should classify too many requests errors as RATE_LIMIT', () => {
      const error = new Error('Too many requests, please slow down');
      expect(classifyError(error)).toBe('RATE_LIMIT');
    });

    it('should classify quota exceeded errors as RATE_LIMIT', () => {
      const error = new Error('Quota exceeded');
      expect(classifyError(error)).toBe('RATE_LIMIT');
    });

    it('should classify throttled errors as RATE_LIMIT', () => {
      const error = new Error('Request throttled');
      expect(classifyError(error)).toBe('RATE_LIMIT');
    });
  });

  describe('SERVER_ERROR errors', () => {
    it('should classify 500 errors as SERVER_ERROR', () => {
      const error = new Error('500 Internal Server Error');
      expect(classifyError(error)).toBe('SERVER_ERROR');
    });

    it('should classify 502 errors as SERVER_ERROR', () => {
      const error = new Error('502 Bad Gateway');
      expect(classifyError(error)).toBe('SERVER_ERROR');
    });

    it('should classify 503 errors as SERVER_ERROR', () => {
      const error = new Error('503 Service Unavailable');
      expect(classifyError(error)).toBe('SERVER_ERROR');
    });

    it('should classify 504 errors as SERVER_ERROR', () => {
      const error = new Error('504 Gateway Timeout');
      expect(classifyError(error)).toBe('SERVER_ERROR');
    });

    it('should classify internal server error messages as SERVER_ERROR', () => {
      const error = new Error('Internal server error occurred');
      expect(classifyError(error)).toBe('SERVER_ERROR');
    });
  });

  describe('NOT_FOUND errors', () => {
    it('should classify 404 errors as NOT_FOUND', () => {
      const error = new Error('404 Not Found');
      expect(classifyError(error)).toBe('NOT_FOUND');
    });

    it('should classify not found messages as NOT_FOUND', () => {
      const error = new Error('Resource not found');
      expect(classifyError(error)).toBe('NOT_FOUND');
    });

    it('should classify Supabase PGRST116 errors as NOT_FOUND', () => {
      const error = new Error('PGRST116: No rows found');
      expect(classifyError(error)).toBe('NOT_FOUND');
    });

    it('should classify does not exist errors as NOT_FOUND', () => {
      const error = new Error('Record does not exist');
      expect(classifyError(error)).toBe('NOT_FOUND');
    });
  });

  describe('UNKNOWN errors', () => {
    it('should classify unrecognized errors as UNKNOWN', () => {
      const error = new Error('Something went wrong');
      expect(classifyError(error)).toBe('UNKNOWN');
    });

    it('should classify string errors as UNKNOWN by default', () => {
      const error = 'Generic error string';
      expect(classifyError(error)).toBe('UNKNOWN');
    });

    it('should handle non-Error objects', () => {
      const error = { message: 'Custom error object' };
      expect(classifyError(error)).toBe('UNKNOWN');
    });
  });

  describe('case insensitivity', () => {
    it('should classify errors case-insensitively', () => {
      expect(classifyError(new Error('ETIMEDOUT'))).toBe('TRANSIENT');
      expect(classifyError(new Error('etimedout'))).toBe('TRANSIENT');
      expect(classifyError(new Error('ETimedOut'))).toBe('TRANSIENT');
    });
  });
});

describe('classifyErrorWithDetails', () => {
  it('should return detailed classification for TRANSIENT errors', () => {
    const error = new Error('ETIMEDOUT');
    const result = classifyErrorWithDetails(error);

    expect(result.category).toBe('TRANSIENT');
    expect(result.message).toBe('ETIMEDOUT');
    expect(result.shouldRetry).toBe(true);
    expect(result.originalError).toBe(error);
  });

  it('should return detailed classification for AUTH_FAILURE errors', () => {
    const error = new Error('401 Unauthorized');
    const result = classifyErrorWithDetails(error);

    expect(result.category).toBe('AUTH_FAILURE');
    expect(result.message).toBe('401 Unauthorized');
    expect(result.shouldRetry).toBe(false);
    expect(result.originalError).toBe(error);
  });

  it('should return detailed classification for RATE_LIMIT errors', () => {
    const error = new Error('429 Too Many Requests');
    const result = classifyErrorWithDetails(error);

    expect(result.category).toBe('RATE_LIMIT');
    expect(result.shouldRetry).toBe(true);
  });

  it('should return detailed classification for NOT_FOUND errors', () => {
    const error = new Error('404 Not Found');
    const result = classifyErrorWithDetails(error);

    expect(result.category).toBe('NOT_FOUND');
    expect(result.shouldRetry).toBe(false);
  });
});

describe('isRetryableError', () => {
  it('should return true for TRANSIENT errors', () => {
    expect(isRetryableError('TRANSIENT')).toBe(true);
  });

  it('should return false for AUTH_FAILURE errors', () => {
    expect(isRetryableError('AUTH_FAILURE')).toBe(false);
  });

  it('should return true for RATE_LIMIT errors', () => {
    expect(isRetryableError('RATE_LIMIT')).toBe(true);
  });

  it('should return true for SERVER_ERROR errors', () => {
    expect(isRetryableError('SERVER_ERROR')).toBe(true);
  });

  it('should return false for NOT_FOUND errors', () => {
    expect(isRetryableError('NOT_FOUND')).toBe(false);
  });

  it('should return true for UNKNOWN errors', () => {
    expect(isRetryableError('UNKNOWN')).toBe(true);
  });
});

describe('getErrorCategoryDescription', () => {
  it('should return description for each error category', () => {
    const categories: ErrorCategory[] = [
      'TRANSIENT',
      'AUTH_FAILURE',
      'RATE_LIMIT',
      'SERVER_ERROR',
      'NOT_FOUND',
      'UNKNOWN',
    ];

    categories.forEach((category) => {
      const description = getErrorCategoryDescription(category);
      expect(description).toBeDefined();
      expect(typeof description).toBe('string');
      expect(description.length).toBeGreaterThan(0);
    });
  });

  it('should return appropriate description for TRANSIENT', () => {
    const description = getErrorCategoryDescription('TRANSIENT');
    expect(description.toLowerCase()).toContain('network');
  });

  it('should return appropriate description for AUTH_FAILURE', () => {
    const description = getErrorCategoryDescription('AUTH_FAILURE');
    expect(description.toLowerCase()).toContain('auth');
  });
});
