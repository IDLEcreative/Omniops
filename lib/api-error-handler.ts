import { NextRequest, NextResponse } from 'next/server';
import { logError, ErrorSeverity, ErrorCategory } from './error-logger';
import { ZodError } from 'zod';

export interface ApiError extends Error {
  statusCode?: number;
  category?: ErrorCategory;
  severity?: ErrorSeverity;
}

export class ValidationError extends Error implements ApiError {
  statusCode = 400;
  category = ErrorCategory.VALIDATION;
  severity = ErrorSeverity.LOW;
  
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class AuthenticationError extends Error implements ApiError {
  statusCode = 401;
  category = ErrorCategory.AUTHENTICATION;
  severity = ErrorSeverity.HIGH;
  
  constructor(message: string) {
    super(message);
    this.name = 'AuthenticationError';
  }
}

export class DatabaseError extends Error implements ApiError {
  statusCode = 500;
  category = ErrorCategory.DATABASE;
  severity = ErrorSeverity.HIGH;
  
  constructor(message: string) {
    super(message);
    this.name = 'DatabaseError';
  }
}

export class ExternalServiceError extends Error implements ApiError {
  statusCode = 502;
  category = ErrorCategory.EXTERNAL_SERVICE;
  severity = ErrorSeverity.MEDIUM;
  
  constructor(message: string, public service: string) {
    super(message);
    this.name = 'ExternalServiceError';
  }
}

type ApiHandler = (request: NextRequest) => Promise<NextResponse>;

export function withErrorHandler(
  handler: ApiHandler,
  options?: {
    logErrors?: boolean;
    includeStackTrace?: boolean;
  }
): ApiHandler {
  return async (request: NextRequest) => {
    const startTime = Date.now();
    const requestId = crypto.randomUUID();
    
    try {
      // Add request ID to headers for tracking
      const response = await handler(request);
      response.headers.set('X-Request-Id', requestId);
      response.headers.set('X-Response-Time', `${Date.now() - startTime}ms`);
      
      return response;
    } catch (error) {
      const duration = Date.now() - startTime;
      
      // Determine error details
      let statusCode = 500;
      let message = 'Internal Server Error';
      let category = ErrorCategory.SYSTEM;
      let severity = ErrorSeverity.HIGH;
      
      if (error instanceof ZodError) {
        statusCode = 400;
        message = 'Validation Error: ' + error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
        category = ErrorCategory.VALIDATION;
        severity = ErrorSeverity.LOW;
      } else if (error && typeof error === 'object' && 'statusCode' in error) {
        // Check if error has ApiError-like properties
        const apiError = error as ApiError;
        statusCode = apiError.statusCode || 500;
        message = apiError.message || 'An error occurred';
        category = apiError.category || ErrorCategory.SYSTEM;
        severity = apiError.severity || ErrorSeverity.MEDIUM;
      } else if (error instanceof Error) {
        message = error.message;
        
        // Check for specific error patterns
        if (error.message.includes('PGRST')) {
          category = ErrorCategory.DATABASE;
          statusCode = 500;
        } else if (error.message.includes('fetch')) {
          category = ErrorCategory.EXTERNAL_SERVICE;
          statusCode = 502;
        }
      }
      
      // Log the error
      if (options?.logErrors !== false) {
        await logError(
          error as Error,
          {
            endpoint: request.url,
            method: request.method,
            statusCode,
            requestId,
            userAgent: request.headers.get('user-agent') || undefined,
            ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
            duration,
            domain: new URL(request.url).hostname
          },
          severity,
          category
        );
      }
      
      // Prepare error response
      const errorResponse: any = {
        error: true,
        message: process.env.NODE_ENV === 'development' ? message : 'An error occurred',
        requestId,
        timestamp: new Date().toISOString()
      };
      
      if (process.env.NODE_ENV === 'development' && options?.includeStackTrace !== false) {
        errorResponse.stack = error instanceof Error ? error.stack : undefined;
        errorResponse.details = error;
      }
      
      return NextResponse.json(errorResponse, {
        status: statusCode,
        headers: {
          'X-Request-Id': requestId,
          'X-Response-Time': `${duration}ms`
        }
      });
    }
  };
}

// Helper to wrap async functions with error handling
export async function handleApiError<T>(
  fn: () => Promise<T>,
  errorMessage?: string
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error(errorMessage || 'An unexpected error occurred');
  }
}